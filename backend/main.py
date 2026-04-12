import os
from typing import Any, Dict, Optional, List

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv("backend.env")

RENTCAST_API_KEY = os.getenv("RENTCAST_API_KEY")
BASE_URL = os.getenv("RENTCAST_BASE_URL", "https://api.rentcast.io/v1")

HEADERS = {
    "X-Api-Key": RENTCAST_API_KEY or "",
    "Accept": "application/json",
}

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
    address: str = Field(..., min_length=5, description="Full address: Street, City, State, Zip")
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
    # IRR inputs
    initial_investment: float = Field(
        ..., gt=0,
        description="Total capital invested (purchase + rehab + carry costs)"
    )
    cash_flows: List[float] = Field(
        ..., min_items=1,
        description="Periodic net cash flows in the same period unit as the desired IRR (e.g. monthly or annual)"
    )

    # Return on Cost
    net_operating_income: float = Field(
        ..., ge=0,
        description="Annual NOI (gross rent minus operating expenses, before debt service)"
    )

    # CAPM / Cost of Equity
    risk_free_rate: float = Field(
        default=4.5, ge=0,
        description="Risk-free rate, e.g. 10-yr Treasury yield (%)"
    )
    beta: float = Field(
        default=1.0, ge=0,
        description="Asset beta relative to the market (SFR typically 0.6–0.8)"
    )
    market_return: float = Field(
        default=10.0, ge=0,
        description="Expected market return (%)"
    )

    # Cost of Debt / WACC
    loan_amount: Optional[float] = Field(
        default=None, ge=0,
        description="Total debt outstanding"
    )
    annual_debt_service: Optional[float] = Field(
        default=None, ge=0,
        description="Annual principal + interest payments"
    )
    equity_value: Optional[float] = Field(
        default=None, ge=0,
        description="Equity portion of the capital stack"
    )
    tax_rate: Optional[float] = Field(
        default=0.0, ge=0, le=100,
        description="Marginal tax rate for WACC interest-deductibility adjustment (%) — use 0 for pass-through entities"
    )


# ─── RentCast helpers ─────────────────────────────────────────────────────────

def rentcast_get(path: str, params: Optional[Dict[str, Any]] = None):
    url = f"{BASE_URL}{path}"

    print("\n--- ABOUT TO CALL RENTCAST ---")
    print("PATH:", path)
    print("PARAMS:", params)
    print("API KEY PRESENT:", bool(RENTCAST_API_KEY))
    print("BASE URL:", BASE_URL)

    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=20)

        print("\n--- RENTCAST REQUEST ---")
        print("FINAL URL:", response.url)
        print("STATUS:", response.status_code)
        print("TEXT:", response.text[:3000])

        try:
            body = response.json()
        except Exception:
            body = {"raw_text": response.text}

        if response.status_code != 200:
            return {
                "ok": False,
                "status_code": response.status_code,
                "body": body,
            }

        return {
            "ok": True,
            "status_code": response.status_code,
            "body": body,
        }

    except requests.RequestException as exc:
        print("REQUEST ERROR:", str(exc))
        return {
            "ok": False,
            "status_code": None,
            "body": {"request_error": str(exc)},
        }


def safe_first(items: Any) -> Optional[Dict[str, Any]]:
    if isinstance(items, list) and items:
        first = items[0]
        if isinstance(first, dict):
            return first
    return None


def extract_subject_property(
    property_records: Any,
    value_estimate: Optional[Dict[str, Any]],
    rent_estimate: Optional[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    record = safe_first(property_records)

    if value_estimate and isinstance(value_estimate.get("subjectProperty"), dict):
        return value_estimate["subjectProperty"]

    if rent_estimate and isinstance(rent_estimate.get("subjectProperty"), dict):
        return rent_estimate["subjectProperty"]

    return record


def average_price_per_sqft(comps: Any) -> Optional[float]:
    if not isinstance(comps, list):
        return None

    values: List[float] = []
    for comp in comps:
        if not isinstance(comp, dict):
            continue
        price = comp.get("price")
        sqft = comp.get("squareFootage")
        if isinstance(price, (int, float)) and isinstance(sqft, (int, float)) and sqft > 0:
            values.append(price / sqft)

    if not values:
        return None

    return round(sum(values) / len(values), 2)


def build_deal_summary(
    purchase_price: float,
    rehab_budget: float,
    subject_property: Optional[Dict[str, Any]],
    value_estimate: Optional[Dict[str, Any]],
    rent_estimate: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    arv = value_estimate.get("price") if value_estimate else None
    arv_low = value_estimate.get("priceRangeLow") if value_estimate else None
    arv_high = value_estimate.get("priceRangeHigh") if value_estimate else None
    est_rent = rent_estimate.get("rent") if rent_estimate else None
    rent_low = rent_estimate.get("rentRangeLow") if rent_estimate else None
    rent_high = rent_estimate.get("rentRangeHigh") if rent_estimate else None

    total_basis = purchase_price + rehab_budget
    spread_to_arv = (arv - total_basis) if isinstance(arv, (int, float)) else None
    mao_70_rule = (arv * 0.70 - rehab_budget) if isinstance(arv, (int, float)) else None
    gross_monthly_cashflow_before_expenses = (
        est_rent if isinstance(est_rent, (int, float)) else None
    )

    sale_ppsf = None
    if isinstance(arv, (int, float)) and subject_property:
        sqft = subject_property.get("squareFootage")
        if isinstance(sqft, (int, float)) and sqft > 0:
            sale_ppsf = round(arv / sqft, 2)

    cap_rate_gross = None
    if isinstance(est_rent, (int, float)) and total_basis > 0:
        annual_gross_rent = est_rent * 12
        cap_rate_gross = round((annual_gross_rent / total_basis) * 100, 2)

    return {
        "purchase_price": purchase_price,
        "rehab_budget": rehab_budget,
        "total_basis": round(total_basis, 2),
        "estimated_value": arv,
        "estimated_value_range": {
            "low": arv_low,
            "high": arv_high,
        },
        "estimated_rent": est_rent,
        "estimated_rent_range": {
            "low": rent_low,
            "high": rent_high,
        },
        "spread_to_arv": round(spread_to_arv, 2) if isinstance(spread_to_arv, (int, float)) else None,
        "mao_70_rule": round(mao_70_rule, 2) if isinstance(mao_70_rule, (int, float)) else None,
        "gross_rent_cap_rate_percent": cap_rate_gross,
        "estimated_sale_price_per_sqft": sale_ppsf,
        "gross_monthly_cashflow_before_expenses": gross_monthly_cashflow_before_expenses,
    }


def compact_land_record(item: Dict[str, Any]) -> Dict[str, Any]:
    owner = item.get("owner", {}) or {}
    mailing = owner.get("mailingAddress", {}) or {}

    return {
        "id": item.get("id"),
        "formattedAddress": item.get("formattedAddress"),
        "addressLine1": item.get("addressLine1"),
        "city": item.get("city"),
        "state": item.get("state"),
        "zipCode": item.get("zipCode"),
        "county": item.get("county"),
        "propertyType": item.get("propertyType"),
        "lotSize": item.get("lotSize"),
        "squareFootage": item.get("squareFootage"),
        "yearBuilt": item.get("yearBuilt"),
        "lastSaleDate": item.get("lastSaleDate"),
        "lastSalePrice": item.get("lastSalePrice"),
        "ownerOccupied": item.get("ownerOccupied"),
        "ownerNames": owner.get("names"),
        "ownerType": owner.get("type"),
        "mailingAddress": mailing.get("formattedAddress"),
    }


# ─── Financial math helpers ───────────────────────────────────────────────────

def calculate_irr(
    initial_investment: float,
    cash_flows: List[float],
    max_iterations: int = 1000,
    tolerance: float = 1e-6,
) -> Optional[float]:
    """
    Internal Rate of Return via Newton-Raphson iteration.

    initial_investment should be positive (the total capital outlay); it is
    negated internally to form t=0 of the cash-flow series.

    cash_flows is a list of periodic net cash inflows (e.g. monthly hold
    income + net sale proceeds at the end for a flip).

    Returns the periodic rate as a percentage. To annualise a monthly IRR:
        annual_irr = (1 + monthly_irr / 100) ** 12 - 1
    Returns None if the solver does not converge.
    """
    if not cash_flows:
        return None

    flows = [-abs(initial_investment)] + list(cash_flows)

    # Seed near 10% annualised, scaled to the period length
    rate = 0.1 / len(cash_flows)

    for _ in range(max_iterations):
        npv = sum(cf / (1 + rate) ** t for t, cf in enumerate(flows))
        dnpv = sum(-t * cf / (1 + rate) ** (t + 1) for t, cf in enumerate(flows))

        if abs(dnpv) < 1e-12:
            break  # derivative is flat — cannot continue

        new_rate = rate - npv / dnpv

        if abs(new_rate - rate) < tolerance:
            return round(new_rate * 100, 4)  # return as percentage

        rate = new_rate

    return None  # did not converge


def calculate_cost_of_equity(
    risk_free_rate: float,
    beta: float,
    market_return: float,
) -> float:
    """
    Cost of equity via CAPM: Re = Rf + β × (Rm − Rf)

    All inputs and the return value are percentages (e.g. 4.5 for 4.5 %).
    Typical SFR beta: 0.6–0.8. Use current 10-yr Treasury for Rf.
    """
    return round(risk_free_rate + beta * (market_return - risk_free_rate), 4)


def calculate_return_on_cost(
    net_operating_income: float,
    total_cost: float,
) -> Optional[float]:
    """
    Return on Cost (also called development yield):
        RoC = NOI / Total Cost

    total_cost should include purchase price, rehab, carry costs, and closing
    costs — i.e. everything spent to stabilise the asset.

    Returns a percentage. A RoC above the prevailing market cap rate signals
    value creation; below it signals value destruction.
    """
    if total_cost <= 0:
        return None
    return round((net_operating_income / total_cost) * 100, 4)


def calculate_cost_of_debt(
    annual_debt_service: float,
    loan_amount: float,
) -> Optional[float]:
    """
    Effective cost of debt (mortgage constant / all-in rate):
        Rd = Annual Debt Service / Loan Amount

    This equals the stated interest rate for interest-only loans and is
    slightly higher for amortising loans (because P&I > interest alone).
    Returns a percentage.
    """
    if loan_amount <= 0:
        return None
    return round((annual_debt_service / loan_amount) * 100, 4)


def calculate_wacc(
    equity_value: float,
    debt_value: float,
    cost_of_equity_pct: float,
    cost_of_debt_pct: float,
    tax_rate_pct: float = 0.0,
) -> Optional[float]:
    """
    Weighted Average Cost of Capital:
        WACC = (E/V) × Re + (D/V) × Rd × (1 − tax_rate)

    tax_rate adjusts for the interest-deductibility shield. For LLCs and
    other pass-through entities set tax_rate_pct = 0.

    All rate inputs and the return value are percentages.
    """
    total = equity_value + debt_value
    if total <= 0:
        return None

    weight_equity = equity_value / total
    weight_debt = debt_value / total
    after_tax_debt = cost_of_debt_pct * (1 - tax_rate_pct / 100)

    return round(
        weight_equity * cost_of_equity_pct + weight_debt * after_tax_debt,
        4,
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/analyze")
def analyze(data: DealRequest):
    print("\n===================")
    print("HIT /analyze")
    print("REQUEST BODY:", data.model_dump())
    print("===================")

    if not RENTCAST_API_KEY:
        raise HTTPException(status_code=500, detail="Missing RentCast API Key")

    full_address = data.address.strip()
    rehab_budget = data.rehabBudget or 0

    # 1) Property record lookup
    property_params = {
        "address": full_address,
        "limit": 1,
    }
    property_res = rentcast_get("/properties", property_params)

    if not property_res["ok"]:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "RentCast property records request failed",
                "address": full_address,
                "params_used": property_params,
                "rentcast_status_code": property_res["status_code"],
                "rentcast_body": property_res["body"],
            },
        )

    property_records = property_res["body"]

    # 2) Value estimate + sale comps
    value_params = {
        "address": full_address,
        "compCount": data.arvCompCount,
    }
    value_res = rentcast_get("/avm/value", value_params)

    # 3) Rent estimate + rental comps
    rent_params = {
        "address": full_address,
        "compCount": data.rentCompCount,
    }
    rent_res = rentcast_get("/avm/rent/long-term", rent_params)

    # 4) Sale listings nearby / same address area
    sale_params = {
        "address": full_address,
        "radius": data.radius,
        "status": "Active",
        "limit": data.listingLimit,
    }
    sale_res = rentcast_get("/listings/sale", sale_params)

    # 5) Rental listings nearby / same address area
    rental_params = {
        "address": full_address,
        "radius": data.radius,
        "status": "Active",
        "limit": data.listingLimit,
    }
    rental_res = rentcast_get("/listings/rental/long-term", rental_params)

    value_body = value_res["body"] if value_res["ok"] and isinstance(value_res["body"], dict) else None
    rent_body = rent_res["body"] if rent_res["ok"] and isinstance(rent_res["body"], dict) else None

    subject_property = extract_subject_property(
        property_records=property_records,
        value_estimate=value_body,
        rent_estimate=rent_body,
    )

    sale_comps = value_body.get("comparables", []) if value_body else []
    rental_comps = rent_body.get("comparables", []) if rent_body else []

    deal_summary = build_deal_summary(
        purchase_price=data.purchasePrice,
        rehab_budget=rehab_budget,
        subject_property=subject_property,
        value_estimate=value_body or {},
        rent_estimate=rent_body or {},
    )

    deal_summary["avg_sale_comp_price_per_sqft"] = average_price_per_sqft(sale_comps)
    deal_summary["avg_rental_comp_price_per_sqft"] = average_price_per_sqft(rental_comps)

    return {
        "input": {
            "address": full_address,
            "purchasePrice": data.purchasePrice,
            "rehabBudget": rehab_budget,
            "arvCompCount": data.arvCompCount,
            "rentCompCount": data.rentCompCount,
            "listingLimit": data.listingLimit,
            "radius": data.radius,
        },
        "subject_property": subject_property,
        "deal_summary": deal_summary,
        "property_records": {
            "params_used": property_params,
            "response": property_records,
        },
        "value_estimate": {
            "params_used": value_params,
            "response": value_body if value_res["ok"] else {
                "error": True,
                "status_code": value_res["status_code"],
                "body": value_res["body"],
            },
        },
        "rent_estimate": {
            "params_used": rent_params,
            "response": rent_body if rent_res["ok"] else {
                "error": True,
                "status_code": rent_res["status_code"],
                "body": rent_res["body"],
            },
        },
        "sale_listings": {
            "params_used": sale_params,
            "response": sale_res["body"] if sale_res["ok"] else {
                "error": True,
                "status_code": sale_res["status_code"],
                "body": sale_res["body"],
            },
        },
        "rental_listings": {
            "params_used": rental_params,
            "response": rental_res["body"] if rental_res["ok"] else {
                "error": True,
                "status_code": rental_res["status_code"],
                "body": rental_res["body"],
            },
        },
    }


@app.post("/search-land")
def search_land(data: LandSearchRequest):
    print("\n===================")
    print("HIT /search-land")
    print("REQUEST BODY:", data.model_dump())
    print("===================")

    if not RENTCAST_API_KEY:
        raise HTTPException(status_code=500, detail="Missing RentCast API Key")

    if data.maxLotSize is not None and data.minLotSize is not None and data.maxLotSize < data.minLotSize:
        raise HTTPException(status_code=400, detail="maxLotSize must be greater than or equal to minLotSize")

    property_params: Dict[str, Any] = {
        "propertyType": "Land",
        "zipCode": data.zipCode,
        "limit": data.limit,
        "offset": data.offset,
    }

    if data.city:
        property_params["city"] = data.city

    if data.state:
        property_params["state"] = data.state

    if data.address:
        property_params["address"] = data.address

    if data.radius is not None:
        property_params["radius"] = data.radius

    if data.minLotSize is not None or data.maxLotSize is not None:
        min_lot = data.minLotSize if data.minLotSize is not None else ""
        max_lot = data.maxLotSize if data.maxLotSize is not None else ""
        property_params["lotSize"] = f"{min_lot}:{max_lot}"

    property_res = rentcast_get("/properties", property_params)

    if not property_res["ok"]:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "RentCast land search failed",
                "params_used": property_params,
                "rentcast_status_code": property_res["status_code"],
                "rentcast_body": property_res["body"],
            },
        )

    property_body = property_res["body"]
    land_records = property_body if isinstance(property_body, list) else []

    listings_output: Dict[str, Any] = {
        "params_used": None,
        "response": [],
    }

    if data.includeListings:
        listing_params: Dict[str, Any] = {
            "propertyType": "Land",
            "zipCode": data.zipCode,
            "status": "Active",
            "limit": data.listingLimit,
        }

        if data.city:
            listing_params["city"] = data.city

        if data.state:
            listing_params["state"] = data.state

        if data.address:
            listing_params["address"] = data.address

        if data.radius is not None:
            listing_params["radius"] = data.radius

        listing_res = rentcast_get("/listings/sale", listing_params)

        listings_output = {
            "params_used": listing_params,
            "response": listing_res["body"] if listing_res["ok"] else {
                "error": True,
                "status_code": listing_res["status_code"],
                "body": listing_res["body"],
            },
        }

    return {
        "input": data.model_dump(),
        "search_summary": {
            "records_found": len(land_records),
            "zipCode": data.zipCode,
            "city": data.city,
            "state": data.state,
        },
        "land_records": {
            "params_used": property_params,
            "count": len(land_records),
            "response": land_records,
            "compact": [compact_land_record(item) for item in land_records if isinstance(item, dict)],
        },
        "land_sale_listings": listings_output,
    }


@app.post("/financial-metrics")
def financial_metrics(data: FinancialMetricsRequest):
    """
    Standalone financial analysis endpoint. Does not call RentCast — pass in
    numbers derived from /analyze or entered manually by the user.

    Key outputs
    -----------
    irr_percent               Periodic IRR (multiply to annualise if monthly flows)
    return_on_cost_percent    NOI / total basis — compare to market cap rates
    cost_of_equity_percent    CAPM cost of equity
    cost_of_debt_percent      Annual debt service / loan amount
    wacc_percent              Blended cost of capital (requires loan + equity inputs)
    irr_beats_wacc            True if IRR > WACC — the core go/no-go signal
    """
    print("\n===================")
    print("HIT /financial-metrics")
    print("REQUEST BODY:", data.model_dump())
    print("===================")

    irr = calculate_irr(data.initial_investment, data.cash_flows)

    roc = calculate_return_on_cost(data.net_operating_income, data.initial_investment)

    coe = calculate_cost_of_equity(data.risk_free_rate, data.beta, data.market_return)

    cod = (
        calculate_cost_of_debt(data.annual_debt_service, data.loan_amount)
        if data.loan_amount and data.annual_debt_service
        else None
    )

    wacc = None
    if data.equity_value is not None and data.loan_amount and cod is not None:
        wacc = calculate_wacc(
            equity_value=data.equity_value,
            debt_value=data.loan_amount,
            cost_of_equity_pct=coe,
            cost_of_debt_pct=cod,
            tax_rate_pct=data.tax_rate or 0.0,
        )

    irr_beats_wacc = (
        irr > wacc
        if isinstance(irr, float) and isinstance(wacc, float)
        else None
    )

    return {
        "input": data.model_dump(),
        "irr_percent": irr,
        "return_on_cost_percent": roc,
        "cost_of_equity_percent_capm": coe,
        "cost_of_debt_percent": cod,
        "wacc_percent": wacc,
        "irr_beats_wacc": irr_beats_wacc,
        "notes": {
            "irr": "Periodic rate — annualise monthly IRR with (1 + r/100)^12 - 1",
            "return_on_cost": "Compare to prevailing market cap rate; above = value creation",
            "cost_of_equity": f"CAPM: {data.risk_free_rate}% + {data.beta} × ({data.market_return}% − {data.risk_free_rate}%)",
            "wacc": "Requires loan_amount, annual_debt_service, and equity_value",
            "irr_beats_wacc": "Primary go/no-go signal: IRR > WACC means the deal clears its hurdle rate",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}