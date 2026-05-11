import os
from typing import Any, Dict, Optional, List
import csv

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv("backend.env")

# ─── Distress CSV ─────────────────────────────────────────────────────────────

DISTRESS_CSV_PATH = os.getenv("DISTRESS_CSV_PATH", "oc_enriched_20260509_182748.csv")


def _classify_distress(row: Dict[str, str]) -> str:
    return "Mortgage Foreclosure"


def _build_flags(row: Dict[str, str]) -> List[str]:
    flags = []
    grantor  = (row.get("grantor")  or "").upper()
    grantees = (row.get("grantees") or "").upper()
    legal    = (row.get("legal")    or "").upper()

    if "SECRETARY OF HOUSING" in grantees or "HUD" in grantees:
        flags.append("FHA/HUD")
    if "ORANGE COUNTY" in grantees or "ORANGE COUNTY" in grantor:
        flags.append("County party")
    if "LLC" in grantees or "INVESTMENTS" in grantees:
        flags.append("Investor-owned")
    if "DISNEY" in legal or "PALM FINANCIAL" in grantor:
        flags.append("Timeshare")
    if "SHERATON" in grantor or "VISTANA" in grantor or "MARRIOTT" in grantor:
        flags.append("Resort timeshare")
    return flags


def _count_by_type(records: List[Dict]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for r in records:
        dt = r["distress_type"]
        counts[dt] = counts.get(dt, 0) + 1
    return dict(sorted(counts.items(), key=lambda x: -x[1]))


def _load_distress_csv(path: str) -> List[Dict[str, Any]]:
    records = []
    try:
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            seen = set()
            for row in reader:
                doc = row.get("doc_number", "")
                if doc in seen:
                    continue
                seen.add(doc)
                addr = (row.get("address") or "").strip()
                if not addr or "200 S. Orange Avenue" in addr:
                    continue
                records.append({
                    "doc_number":    doc,
                    "recorded_date": row.get("recorded_date", ""),
                    "doc_type":      row.get("doc_type", ""),
                    "grantor":       row.get("grantor", ""),
                    "grantees":      row.get("grantees", ""),
                    "address":       addr,
                    "city":          row.get("city", ""),
                    "zip":           row.get("zip", ""),
                    "parcel_id":     row.get("parcel_id", ""),
                    "legal":         row.get("legal", ""),
                    "ocpa_url":      row.get("ocpa_url", ""),
                    "distress_type": _classify_distress(row),
                    "flags":         _build_flags(row),
                })
    except FileNotFoundError:
        print(f"[distress] WARNING: CSV not found at {path}")
    print(f"[distress] Loaded {len(records)} distress records from {path}")
    return records


DISTRESS_DATA: List[Dict[str, Any]] = _load_distress_csv(DISTRESS_CSV_PATH)

# ─── RentCast config ──────────────────────────────────────────────────────────

RENTCAST_API_KEY = os.getenv("RENTCAST_API_KEY")
BASE_URL = os.getenv("RENTCAST_BASE_URL", "https://api.rentcast.io/v1")
HEADERS = {
    "X-Api-Key": RENTCAST_API_KEY or "",
    "Accept": "application/json",
}

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="FlipBot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ──────────────────────────────────────────────────────────

class DealRequest(BaseModel):
    address: str = Field(..., min_length=5)
    purchasePrice: float = Field(..., gt=0)
    rehabBudget: Optional[float] = Field(default=0, ge=0)
    arvCompCount: Optional[int] = Field(default=5, ge=1, le=25)
    rentCompCount: Optional[int] = Field(default=5, ge=1, le=25)
    listingLimit: Optional[int] = Field(default=10, ge=1, le=50)
    radius: Optional[float] = Field(default=0.5, gt=0, le=100)


class LandSearchRequest(BaseModel):
    zipCode: str = Field(..., min_length=3, max_length=10)
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    radius: Optional[float] = Field(default=None, gt=0, le=100)
    minLotSize: Optional[int] = Field(default=None, ge=0)
    maxLotSize: Optional[int] = Field(default=None, ge=0)
    limit: Optional[int] = Field(default=25, ge=1, le=100)
    offset: Optional[int] = Field(default=0, ge=0)
    includeListings: Optional[bool] = True
    listingLimit: Optional[int] = Field(default=25, ge=1, le=100)


class FinancialMetricsRequest(BaseModel):
    initial_investment: float = Field(..., gt=0)
    cash_flows: List[float] = Field(..., min_items=1)
    net_operating_income: float = Field(..., ge=0)
    risk_free_rate: float = Field(default=4.5, ge=0)
    beta: float = Field(default=1.0, ge=0)
    market_return: float = Field(default=10.0, ge=0)
    loan_amount: Optional[float] = Field(default=None, ge=0)
    annual_debt_service: Optional[float] = Field(default=None, ge=0)
    equity_value: Optional[float] = Field(default=None, ge=0)
    tax_rate: Optional[float] = Field(default=0.0, ge=0, le=100)


class DistressSearchRequest(BaseModel):
    query: Optional[str] = Field(default=None)
    zip_code: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None)
    distress_type: Optional[str] = Field(default=None)
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)

# ─── RentCast helpers ─────────────────────────────────────────────────────────

def rentcast_get(path: str, params: Optional[Dict[str, Any]] = None):
    url = f"{BASE_URL}{path}"
    print(f"\n--- RENTCAST {path} ---")
    print("PARAMS:", params)
    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=20)
        print("STATUS:", response.status_code)
        print("TEXT:", response.text[:500])
        try:
            body = response.json()
        except Exception:
            body = {"raw_text": response.text}
        if response.status_code != 200:
            return {"ok": False, "status_code": response.status_code, "body": body}
        return {"ok": True, "status_code": response.status_code, "body": body}
    except requests.RequestException as exc:
        print("REQUEST ERROR:", str(exc))
        return {"ok": False, "status_code": None, "body": {"request_error": str(exc)}}


def safe_first(items: Any) -> Optional[Dict[str, Any]]:
    if isinstance(items, list) and items:
        first = items[0]
        if isinstance(first, dict):
            return first
    return None


def extract_subject_property(property_records, value_estimate, rent_estimate):
    if value_estimate and isinstance(value_estimate.get("subjectProperty"), dict):
        return value_estimate["subjectProperty"]
    if rent_estimate and isinstance(rent_estimate.get("subjectProperty"), dict):
        return rent_estimate["subjectProperty"]
    return safe_first(property_records)


def average_price_per_sqft(comps: Any) -> Optional[float]:
    if not isinstance(comps, list):
        return None
    values = []
    for comp in comps:
        if not isinstance(comp, dict):
            continue
        price = comp.get("price")
        sqft = comp.get("squareFootage")
        if isinstance(price, (int, float)) and isinstance(sqft, (int, float)) and sqft > 0:
            values.append(price / sqft)
    return round(sum(values) / len(values), 2) if values else None


def build_deal_summary(purchase_price, rehab_budget, subject_property, value_estimate, rent_estimate):
    arv      = value_estimate.get("price")          if value_estimate else None
    arv_low  = value_estimate.get("priceRangeLow")  if value_estimate else None
    arv_high = value_estimate.get("priceRangeHigh") if value_estimate else None
    est_rent  = rent_estimate.get("rent")            if rent_estimate else None
    rent_low  = rent_estimate.get("rentRangeLow")    if rent_estimate else None
    rent_high = rent_estimate.get("rentRangeHigh")   if rent_estimate else None

    total_basis   = purchase_price + rehab_budget
    spread_to_arv = (arv - total_basis) if isinstance(arv, (int, float)) else None
    mao_70_rule   = (arv * 0.70 - rehab_budget) if isinstance(arv, (int, float)) else None

    sale_ppsf = None
    if isinstance(arv, (int, float)) and subject_property:
        sqft = subject_property.get("squareFootage")
        if isinstance(sqft, (int, float)) and sqft > 0:
            sale_ppsf = round(arv / sqft, 2)

    cap_rate_gross = None
    if isinstance(est_rent, (int, float)) and total_basis > 0:
        cap_rate_gross = round((est_rent * 12 / total_basis) * 100, 2)

    return {
        "purchase_price":   purchase_price,
        "rehab_budget":     rehab_budget,
        "total_basis":      round(total_basis, 2),
        "estimated_value":  arv,
        "estimated_value_range": {"low": arv_low, "high": arv_high},
        "estimated_rent":   est_rent,
        "estimated_rent_range": {"low": rent_low, "high": rent_high},
        "spread_to_arv":    round(spread_to_arv, 2) if isinstance(spread_to_arv, (int, float)) else None,
        "mao_70_rule":      round(mao_70_rule, 2)   if isinstance(mao_70_rule, (int, float)) else None,
        "gross_rent_cap_rate_percent": cap_rate_gross,
        "estimated_sale_price_per_sqft": sale_ppsf,
        "gross_monthly_cashflow_before_expenses": est_rent if isinstance(est_rent, (int, float)) else None,
    }


def compact_land_record(item: Dict[str, Any]) -> Dict[str, Any]:
    owner   = item.get("owner", {}) or {}
    mailing = owner.get("mailingAddress", {}) or {}
    return {
        "id":               item.get("id"),
        "formattedAddress": item.get("formattedAddress"),
        "addressLine1":     item.get("addressLine1"),
        "city":             item.get("city"),
        "state":            item.get("state"),
        "zipCode":          item.get("zipCode"),
        "county":           item.get("county"),
        "propertyType":     item.get("propertyType"),
        "lotSize":          item.get("lotSize"),
        "squareFootage":    item.get("squareFootage"),
        "yearBuilt":        item.get("yearBuilt"),
        "lastSaleDate":     item.get("lastSaleDate"),
        "lastSalePrice":    item.get("lastSalePrice"),
        "ownerOccupied":    item.get("ownerOccupied"),
        "ownerNames":       owner.get("names"),
        "ownerType":        owner.get("type"),
        "mailingAddress":   mailing.get("formattedAddress"),
    }

# ─── Financial math ───────────────────────────────────────────────────────────

def calculate_irr(initial_investment, cash_flows, max_iterations=1000, tolerance=1e-6):
    if not cash_flows:
        return None
    flows = [-abs(initial_investment)] + list(cash_flows)
    rate = 0.1 / len(cash_flows)
    for _ in range(max_iterations):
        npv  = sum(cf / (1 + rate) ** t for t, cf in enumerate(flows))
        dnpv = sum(-t * cf / (1 + rate) ** (t + 1) for t, cf in enumerate(flows))
        if abs(dnpv) < 1e-12:
            break
        new_rate = rate - npv / dnpv
        if abs(new_rate - rate) < tolerance:
            return round(new_rate * 100, 4)
        rate = new_rate
    return None


def calculate_cost_of_equity(risk_free_rate, beta, market_return):
    return round(risk_free_rate + beta * (market_return - risk_free_rate), 4)


def calculate_return_on_cost(net_operating_income, total_cost):
    if total_cost <= 0:
        return None
    return round((net_operating_income / total_cost) * 100, 4)


def calculate_cost_of_debt(annual_debt_service, loan_amount):
    if loan_amount <= 0:
        return None
    return round((annual_debt_service / loan_amount) * 100, 4)


def calculate_wacc(equity_value, debt_value, cost_of_equity_pct, cost_of_debt_pct, tax_rate_pct=0.0):
    total = equity_value + debt_value
    if total <= 0:
        return None
    return round(
        (equity_value / total) * cost_of_equity_pct +
        (debt_value  / total) * cost_of_debt_pct * (1 - tax_rate_pct / 100),
        4,
    )

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/distress-search")
def distress_search(data: DistressSearchRequest):
    results = DISTRESS_DATA[:]

    if data.zip_code:
        results = [r for r in results if r["zip"] == data.zip_code.strip()]

    if data.city:
        city_lower = data.city.strip().lower()
        results = [r for r in results if city_lower in r["city"].lower()]

    if data.distress_type and data.distress_type != "All Types":
        dt_lower = data.distress_type.lower()
        results = [r for r in results if dt_lower in r["distress_type"].lower()]

    if data.query:
        q = data.query.strip().lower()
        results = [
            r for r in results
            if q in r["address"].lower()
            or q in r["grantor"].lower()
            or q in r["grantees"].lower()
            or q in r["city"].lower()
            or q in (r["parcel_id"] or "").lower()
        ]

    total = len(results)
    page  = results[data.offset : data.offset + data.limit]

    return {
        "total":                total,
        "offset":               data.offset,
        "limit":                data.limit,
        "results":              page,
        "distress_type_counts": _count_by_type(results),
    }


@app.post("/analyze")
def analyze(data: DealRequest):
    print("\n=== HIT /analyze ===")
    if not RENTCAST_API_KEY:
        raise HTTPException(status_code=500, detail="Missing RentCast API Key")

    full_address = data.address.strip()
    rehab_budget = data.rehabBudget or 0

    property_res = rentcast_get("/properties", {"address": full_address, "limit": 1})
    if not property_res["ok"]:
        raise HTTPException(status_code=400, detail={
            "message": "RentCast property lookup failed",
            "rentcast_status_code": property_res["status_code"],
            "rentcast_body": property_res["body"],
        })

    value_res  = rentcast_get("/avm/value",             {"address": full_address, "compCount": data.arvCompCount})
    rent_res   = rentcast_get("/avm/rent/long-term",    {"address": full_address, "compCount": data.rentCompCount})
    sale_res   = rentcast_get("/listings/sale",          {"address": full_address, "radius": data.radius, "status": "Active", "limit": data.listingLimit})
    rental_res = rentcast_get("/listings/rental/long-term", {"address": full_address, "radius": data.radius, "status": "Active", "limit": data.listingLimit})

    value_body = value_res["body"]  if value_res["ok"]  and isinstance(value_res["body"],  dict) else None
    rent_body  = rent_res["body"]   if rent_res["ok"]   and isinstance(rent_res["body"],   dict) else None

    subject_property = extract_subject_property(property_res["body"], value_body, rent_body)
    sale_comps   = value_body.get("comparables", []) if value_body else []
    rental_comps = rent_body.get("comparables",  []) if rent_body  else []

    deal_summary = build_deal_summary(data.purchasePrice, rehab_budget, subject_property, value_body or {}, rent_body or {})
    deal_summary["avg_sale_comp_price_per_sqft"]   = average_price_per_sqft(sale_comps)
    deal_summary["avg_rental_comp_price_per_sqft"] = average_price_per_sqft(rental_comps)

    def wrap(res, params):
        return {"params_used": params, "response": res["body"] if res["ok"] else {"error": True, "body": res["body"]}}

    return {
        "input":           {"address": full_address, "purchasePrice": data.purchasePrice, "rehabBudget": rehab_budget},
        "subject_property": subject_property,
        "deal_summary":    deal_summary,
        "value_estimate":  wrap(value_res,  {"address": full_address, "compCount": data.arvCompCount}),
        "rent_estimate":   wrap(rent_res,   {"address": full_address, "compCount": data.rentCompCount}),
        "sale_listings":   wrap(sale_res,   {"address": full_address, "radius": data.radius, "status": "Active"}),
        "rental_listings": wrap(rental_res, {"address": full_address, "radius": data.radius, "status": "Active"}),
    }


@app.post("/search-land")
def search_land(data: LandSearchRequest):
    print("\n=== HIT /search-land ===")
    if not RENTCAST_API_KEY:
        raise HTTPException(status_code=500, detail="Missing RentCast API Key")

    if data.maxLotSize and data.minLotSize and data.maxLotSize < data.minLotSize:
        raise HTTPException(status_code=400, detail="maxLotSize must be >= minLotSize")

    property_params: Dict[str, Any] = {
        "propertyType": "Land",
        "zipCode": data.zipCode,
        "limit": data.limit,
        "offset": data.offset,
    }
    if data.city:    property_params["city"]    = data.city
    if data.state:   property_params["state"]   = data.state
    if data.address: property_params["address"] = data.address
    if data.radius:  property_params["radius"]  = data.radius
    if data.minLotSize is not None or data.maxLotSize is not None:
        property_params["lotSize"] = f"{data.minLotSize or ''}:{data.maxLotSize or ''}"

    property_res = rentcast_get("/properties", property_params)
    if not property_res["ok"]:
        raise HTTPException(status_code=400, detail={"message": "Land search failed", "body": property_res["body"]})

    land_records = property_res["body"] if isinstance(property_res["body"], list) else []

    listings_output = {"params_used": None, "response": []}
    if data.includeListings:
        listing_params: Dict[str, Any] = {"propertyType": "Land", "zipCode": data.zipCode, "status": "Active", "limit": data.listingLimit}
        if data.city:    listing_params["city"]    = data.city
        if data.state:   listing_params["state"]   = data.state
        if data.address: listing_params["address"] = data.address
        if data.radius:  listing_params["radius"]  = data.radius
        listing_res = rentcast_get("/listings/sale", listing_params)
        listings_output = {"params_used": listing_params, "response": listing_res["body"] if listing_res["ok"] else {"error": True, "body": listing_res["body"]}}

    return {
        "input": data.model_dump(),
        "search_summary": {"records_found": len(land_records), "zipCode": data.zipCode, "city": data.city, "state": data.state},
        "land_records": {"params_used": property_params, "count": len(land_records), "response": land_records, "compact": [compact_land_record(i) for i in land_records if isinstance(i, dict)]},
        "land_sale_listings": listings_output,
    }


@app.post("/financial-metrics")
def financial_metrics(data: FinancialMetricsRequest):
    print("\n=== HIT /financial-metrics ===")

    irr = calculate_irr(data.initial_investment, data.cash_flows)
    roc = calculate_return_on_cost(data.net_operating_income, data.initial_investment)
    coe = calculate_cost_of_equity(data.risk_free_rate, data.beta, data.market_return)
    cod = calculate_cost_of_debt(data.annual_debt_service, data.loan_amount) if data.loan_amount and data.annual_debt_service else None
    wacc = None
    if data.equity_value is not None and data.loan_amount and cod is not None:
        wacc = calculate_wacc(data.equity_value, data.loan_amount, coe, cod, data.tax_rate or 0.0)

    irr_beats_wacc = (irr > wacc) if isinstance(irr, float) and isinstance(wacc, float) else None

    return {
        "input":                      data.model_dump(),
        "irr_percent":                irr,
        "return_on_cost_percent":     roc,
        "cost_of_equity_percent_capm": coe,
        "cost_of_debt_percent":       cod,
        "wacc_percent":               wacc,
        "irr_beats_wacc":             irr_beats_wacc,
        "notes": {
            "irr":            "Periodic rate — annualise monthly IRR with (1 + r/100)^12 - 1",
            "return_on_cost": "Compare to prevailing market cap rate; above = value creation",
            "wacc":           "Requires loan_amount, annual_debt_service, and equity_value",
            "irr_beats_wacc": "Primary go/no-go signal: IRR > WACC means the deal clears its hurdle rate",
        },
    }