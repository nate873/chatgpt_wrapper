from dotenv import load_dotenv
load_dotenv("backend.env")
from typing import Optional, Dict, Any
import random
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.serpapi_search import search_local_lenders, normalize_lenders
from wrapper import ask_chatgpt
from supabase import create_client
import os
from datetime import date, datetime


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def json_safe(obj):
    return json.loads(json.dumps(obj, default=str))

def get_supabase():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

supabase = get_supabase()

def create_deal_session(user_id: str, deal: Dict[str, Any]) -> str:
    # 🔧 Normalize transaction type
    transaction_type = (deal.get("transactionType") or "purchase").strip().lower()

    if transaction_type not in ("purchase", "refinance", "cash_out_refi"):
        transaction_type = "purchase"

    # ---------- TITLE BUILDING ----------
    city = (deal.get("city") or "").strip()

    # Human-friendly transaction label
    if transaction_type in ("refinance", "cash_out_refi"):
        transaction_label = "Refi"
    else:
        transaction_label = "Purchase"

    # Pick correct amount
    if transaction_label == "Purchase":
        amount = deal.get("purchasePrice")
    else:
        amount = deal.get("existingLoanBalance") or deal.get("purchasePrice")

    amount_label = f"${int(amount):,}" if amount else ""

    # Build clean title (no empty separators)
    title_parts = []
    if city:
        title_parts.append(city)

    title_parts.append(transaction_label)

    if amount_label:
        title_parts.append(amount_label)

    title = " · ".join(title_parts)

    # Fallback safety (should rarely hit)
    if not title:
        title = "New Deal"

    # ---------- INSERT ----------
    res = (
        supabase.table("deal_sessions")
        .insert({
            "user_id": user_id,
            "title": title,
            "deal_type": transaction_type,
            "city": city,
            "address": deal.get("address"),
            "purchase_price": deal.get("purchasePrice"),
            "archived": False,
        })
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create deal session")

    return res.data[0]["id"]

  
HARD_MONEY_PROGRAMS = {
    "fix_and_flip",
    "ground_up",
    "cash_out_refi",
}
class ChatRequest(BaseModel):
    action: Optional[str] = None
    mode: str = "chat"                 # "chat" or "deal"
    message: Optional[str] = None      # chat question OR legacy deal text
    deal: Optional[Dict[str, Any]] = None  # preferred for deal mode
app = FastAPI()

@app.get("/api/deal-sessions")
def list_deal_sessions(user_id: str):
    res = (
        supabase.table("deal_sessions")
        .select("id, title, created_at")
        .eq("user_id", user_id)
        .eq("archived", False)
        .order("created_at", desc=True)
        .execute()
    )

    return res.data or []

@app.get("/health")
def health():
    return {"status": "ok"}

SUPPORTED_ACTIONS = {
    "stress_test",
    "optimize_costs",
    "find_lenders",
    "compare_lenders",
    "refi_dscr",
    "cash_to_close",
    "hold_sensitivity",
    "apr_risk",
     "worst_case",
    "refi_exit",
    "city_opportunity",
}
BILLABLE_ACTIONS = {
    "stress_test",
    "optimize_costs",
    "find_lenders",
    "compare_lenders",
    "refi_dscr",
    "cash_to_close",
    "hold_sensitivity",
    "apr_risk",
     "worst_case",
    "refi_exit",
    "city_opportunity",
}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from stripe_routes import router as stripe_router
app.include_router(stripe_router)

from webhooks import router as webhook_router
app.include_router(webhook_router)

def save_message(session_id: str, sender: str, content: Dict[str, Any]):
    supabase.table("deal_messages").insert({
        "session_id": session_id,
        "sender": sender,   # "user" or "assistant"
        "content": content, # JSON
    }).execute()


def require_and_charge_credit(
    user_id: str,
    action_type: str,
    reference_id: Optional[str] = None,
    credits: int = 1,
):
    
    # Load profile
    prof = (
        supabase.table("profiles")
        .select("id, plan, credits_remaining")
        .eq("id", user_id)
        .single()
        .execute()
    ).data

    if not prof:
        raise HTTPException(401, "Unauthorized")

    # Deduct credits atomically
    try:
        supabase.rpc(
            "deduct_credits",
            {"p_user_id": user_id, "p_amount": credits}
        ).execute()
    except Exception:
        raise HTTPException(
            status_code=402,
            detail="Out of credits. Upgrade to Pro or Premium to continue."
        )

    # Log usage
    supabase.table("usage_logs").insert({
        "user_id": user_id,
        "action_type": action_type,
        "reference_id": reference_id,
        "credits_used": credits,
    }).execute()

def compute_city_opportunity(deal: Dict[str, Any]) -> Dict[str, Any]:
    city = deal.get("city")
    state = deal.get("state", "")

    if not city:
        raise HTTPException(400, "City is required for opportunity analysis")

    prompt = f"""
You are a senior real estate investment analyst specializing in fix & flip
and rental underwriting.

Analyze the real estate investing opportunity in:

City: {city}
State: {state}

Focus on:
- Fix & flip viability
- Rehab risk
- Buyer demand
- Liquidity & resale velocity
- Rent strength (for exit flexibility)
- Market volatility risk

Rules:
- Do NOT fabricate statistics or cite exact numbers.
- Speak in ranges and qualitative terms.
- Be conservative and investor-focused.
- Assume a typical 3–6 month flip horizon.

Return JSON ONLY in this format:

{{
  "overall_rating": "Strong | Neutral | Weak",
  "strategy_fit": {{
    "fix_and_flip": "Strong | Moderate | Weak",
    "buy_and_hold": "Strong | Moderate | Weak"
  }},
  "market_characteristics": [
    "bullet point",
    "bullet point"
  ],
  "key_risks": [
    "bullet point",
    "bullet point"
  ],
  "what_works_here": [
    "bullet point",
    "bullet point"
  ],
  "what_to_avoid": [
    "bullet point",
    "bullet point"
  ],
  "bottom_line": "1–2 sentence investor conclusion"
}}
"""

    raw = ask_chatgpt(prompt)

    try:
        parsed = json.loads(raw)
    except Exception:
        raise HTTPException(500, "City opportunity analysis failed to parse")

    return {
        "uiMode": "CARD_CITY_OPPORTUNITY",
        "response": {
            "city": city,
            "state": state,
            **parsed,
        },
    }

def compute_worst_case(deal: Dict[str, Any]) -> Dict[str, Any]:
    """
    Worst-case downside scenario:
    - ARV -10%
    - Rehab +15%
    - Hold +6 months (full interest carry)
    """

    # -------------------------
    # Base case (truth)
    # -------------------------
    base = compute_deal_response(deal)

    base_profit = _to_float(base["sale_and_profit"]["gross_profit"]) or 0.0
    base_cost = _to_float(base["sale_and_profit"]["total_project_cost"]) or 0.0

    # -------------------------
    # Shock inputs
    # -------------------------
    base_arv = _to_float(deal.get("arv")) or 0.0
    base_rehab = _to_float(deal.get("rehabBudget")) or 0.0

    shocked_arv = base_arv * 0.90
    shocked_rehab = base_rehab * 1.15

    # -------------------------
    # Re-run underwriting with shocks
    # -------------------------
    shocked_deal = {
        **deal,
        "arv": shocked_arv,
        "rehabBudget": shocked_rehab,
    }

    shocked = compute_deal_response(shocked_deal)

    shocked_profit = _to_float(shocked["sale_and_profit"]["gross_profit"]) or 0.0
    shocked_cost = _to_float(shocked["sale_and_profit"]["total_project_cost"]) or 0.0

    # -------------------------
    # Timeline extension damage
    # -------------------------
    loan = _to_float(shocked["terms"]["loan_amount"]) or 0.0
    rate = _to_float(shocked["terms"]["interest_rate"]) or 0.0

    monthly_interest = loan * (rate / 100.0) / 12.0
    extension_cost = monthly_interest * 6

    # -------------------------
    # Final worst-case results
    # -------------------------
    worst_profit = shocked_profit - extension_cost

    worst_roi = (
        (worst_profit / shocked_cost) * 100
        if shocked_cost > 0
        else None
    )

    # -------------------------
    # Incremental damage breakdown
    # -------------------------
    damage = {
        "arv_hit": base_arv - shocked_arv,
        "rehab_overrun": shocked_rehab - base_rehab,
        "hold_extension_cost": extension_cost,
        "total_profit_erosion": base_profit - worst_profit,
    }

    # -------------------------
    # Verdict logic
    # -------------------------
    if worst_profit > 0:
        rating = "Survivable"
        message = "Deal remains profitable but margin compression is severe."
    elif worst_profit > -25000:
        rating = "Danger Zone"
        message = "Minor execution errors turn this deal unprofitable."
    else:
        rating = "Failing"
        message = "Worst-case scenario results in a material capital loss."

    return {
        "uiMode": "CARD_WORST_CASE",
        "response": {
            "assumptions": {
                "arv_change": "-10%",
                "rehab_change": "+15%",
                "hold_extension_months": 6,
            },

            "base_case": {
                "gross_profit": _round_money(base_profit),
                "roi_percent": _round_pct(
                    (base_profit / base_cost) * 100 if base_cost > 0 else None
                ),
            },

            "worst_case": {
                "gross_profit": _round_money(worst_profit),
                "roi_percent": _round_pct(worst_roi),
            },

            "damage_breakdown": {
                k: _round_money(v) for k, v in damage.items()
            },

            "verdict": {
                "rating": rating,
                "message": message,
            },

            "warning": (
                "Worst-case assumes no lender concessions, no market rebound, "
                "and full interest carry during extension."
            ),
        },
    }

def enrich_lenders(lenders, program):
    enriched = []

    for lender in lenders:
        name = lender["name"].lower()

        if "capital" in name or "private" in name:
            grade = "A"
            emoji = "🟢⭐"
            speed = "Fast"
            rate = "10.5–11.5%"
            points = "2–3"
        elif "mortgage" in name or "lending" in name:
            grade = "B"
            emoji = "🟡👍"
            speed = "Moderate"
            rate = "11.5–12.5%"
            points = "3–4"
        else:
            grade = "C"
            emoji = "🔴⚠️"
            speed = "Slow"
            rate = "12–14%"
            points = "4–5"

        enriched.append({
            **lender,
            "grade": grade,
            "gradeEmoji": emoji,
            "score": (
                (lender.get("rating") or 0) * 10
                + (min(lender.get("reviews") or 0, 200) * 0.05)
            ),
            "estimatedTerms": {
                "rate": rate,
                "points": points,
                "ltv": "65–70% ARV",
                "speed": speed,
            },
            "summary": (
                "Investor-friendly lender with experience in "
                f"{program.replace('_', ' ')} deals."
            ),
        })

    return enriched

def compute_out_of_pocket_costs(deal: Dict[str, Any]) -> Dict[str, Any]:
    base = compute_deal_response(deal)

    loan_amount = _to_float(base["terms"]["loan_amount"]) or 0.0

    # -------------------------
    # 1️⃣ Fixed admin fees (flat)
    # -------------------------
    fixed_admin = {
        "docs_fee": 600.0,            # Zelled
        "notary": 250.0,
        "courier": 250.0,
        "recording_service": 100.0,
        "wire_fee": 75.0,
        "endorsements": 300.0,
        "sb2_recording": 450.0,
        "sub_escrow": 125.0,
    }

    fixed_admin_subtotal = sum(fixed_admin.values())

    # -------------------------
    # 2️⃣ Escrow & title admin
    # -------------------------
    escrow_base = 1500.0
    escrow_scaled = loan_amount * 0.001  # 0.10%
    escrow_total = min(escrow_base + escrow_scaled, 3000.0)

    escrow_admin = {
        "base_fee": escrow_base,
        "scaled_fee": round(escrow_scaled, 2),
        "cap_applied": escrow_total >= 3000.0,
        "subtotal": round(escrow_total, 2),
    }

    # -------------------------
    # 3️⃣ Title insurance (loan policy)
    # -------------------------
    title_insurance_raw = loan_amount * 0.0025  # 0.25%
    title_insurance = max(750.0, min(title_insurance_raw, 3500.0))

    # -------------------------
    # 4️⃣ Recording fees
    # -------------------------
    recording_fees = 500.0

    # -------------------------
    # Total out-of-pocket
    # -------------------------
    total_out_of_pocket = (
        fixed_admin_subtotal
        + escrow_total
        + title_insurance
        + recording_fees
    )

    return {
        "uiMode": "CARD_CASH_TO_CLOSE",
        "response": {
            "loan_amount": _round_money(loan_amount),

            "categories": {
                "fixed_admin": {
                    **{k: _round_money(v) for k, v in fixed_admin.items()},
                    "subtotal": _round_money(fixed_admin_subtotal),
                },

                "escrow_and_title_admin": escrow_admin,

                "title_insurance": {
                    "rate_basis": "0.25% of loan amount",
                    "amount": _round_money(title_insurance),
                },

                "recording_fees": {
                    "estimated": _round_money(recording_fees),
                },
            },

            "total_out_of_pocket": _round_money(total_out_of_pocket),

            "excludes": [
                "Loan origination / points",
                "Prepaid interest",
                "Loan payoff",
                "Taxes and insurance escrows",
            ],
        },
    }


def compute_hold_time_sensitivity(deal: Dict[str, Any]) -> Dict[str, Any]:
    base = compute_deal_response(deal)

    loan_amount = base["terms"]["loan_amount"]
    rate = base["terms"]["interest_rate"]
    monthly_interest = loan_amount * (rate / 100) / 12

    results = []
    for months in [4, 6, 9, 12]:
        interest = monthly_interest * months
        profit = base["sale_and_profit"]["gross_profit"] - interest

        results.append({
            "hold_months": months,
            "interest_cost": _round_money(interest),
            "net_profit": _round_money(profit),
        })

    return {
        "uiMode": "CARD_HOLD_SENSITIVITY",
        "response": {
            "monthly_burn": _round_money(monthly_interest),
            "scenarios": results,
            "warning": (
                "Each additional month materially impacts profit. "
                "Timeline risk is the #1 killer of flip returns."
            ),
        },
    }
def compute_apr_and_default_risk(deal: Dict[str, Any]) -> Dict[str, Any]:
    base = compute_deal_response(deal)

    loan = base["terms"]["loan_amount"]
    rate = base["terms"]["interest_rate"]
    points = base["terms"]["points"]
    term = base["terms"]["loan_term_months"]

    if not loan or not rate or not term:
        raise HTTPException(400, "Missing loan terms for APR analysis")

    # -------------------------
    # Base costs
    # -------------------------
    interest_paid = loan * (rate / 100) * (term / 12)
    points_cost = loan * (points / 100)

    effective_apr = (
        (interest_paid + points_cost) / loan
    ) / (term / 12) * 100

    # -------------------------
    # Extension risk
    # -------------------------
    monthly_interest = loan * (rate / 100) / 12
    extension_3mo = monthly_interest * 3
    extension_6mo = monthly_interest * 6

    # -------------------------
    # Default risk
    # -------------------------
    default_rate = rate + 5.0  # typical default bump
    default_monthly = loan * (default_rate / 100) / 12
    default_90_day_cost = default_monthly * 3

    # -------------------------
    # Messaging
    # -------------------------
    warning = (
        "Hard money loans are priced for speed, not forgiveness. "
        "Extensions and defaults dramatically increase effective cost of capital."
    )

    return {
        "uiMode": "CARD_APR_RISK",
        "response": {
            "headline_apr": _round_pct(effective_apr),

            "base_costs": {
                "interest_paid": _round_money(interest_paid),
                "points_cost": _round_money(points_cost),
                "total_financing_cost": _round_money(interest_paid + points_cost),
            },

            "extension_risk": {
                "monthly_interest": _round_money(monthly_interest),
                "3_month_extension": _round_money(extension_3mo),
                "6_month_extension": _round_money(extension_6mo),
            },

            "default_risk": {
                "default_rate": _round_pct(default_rate),
                "monthly_interest_at_default": _round_money(default_monthly),
                "90_day_default_cost": _round_money(default_90_day_cost),
            },

            "warning": warning,
        },
    }





def build_lender_ui_response(cleaned, city, state):
    parsed = json.loads(cleaned)
    return {
        "uiMode": "CHAT_LENDER_RESULTS",
        "response": {
            "city": city,
            "state": state,
            "lenders": parsed.get("lenders", parsed),
        },
    }

    return f"""
You are a private lending analyst.

These lenders are VERIFIED real businesses operating in {city}, {state}.
DO NOT add or invent lenders.

For each lender:
- Classify as Local / Regional / National
- Note which support: {program.replace("_", " ")}

Return JSON only.

LENDERS:
{json.dumps(lenders, indent=2)}
"""

def compute_stress_test(deal: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simple v1 stress test:
    - Rehab +10%
    - Rehab +20%
    - ARV -5%
    - ARV -10%
    - Hold +2 months (adds interest)
    Uses your existing compute_deal_response logic as baseline.
    """
    base = compute_deal_response(deal)

    def clone_with(overrides: Dict[str, Any]) -> Dict[str, Any]:
        d = {**deal, **overrides}
        return compute_deal_response(d)

    rehab = _to_float(deal.get("rehabBudget")) or 0.0
    arv = _to_float(deal.get("arv")) or 0.0

    scenarios = []

    # rehab shocks
    scenarios.append(("Rehab +10%", clone_with({"rehabBudget": rehab * 1.10})))
    scenarios.append(("Rehab +20%", clone_with({"rehabBudget": rehab * 1.20})))

    # arv shocks
    scenarios.append(("ARV -5%", clone_with({"arv": arv * 0.95})))
    scenarios.append(("ARV -10%", clone_with({"arv": arv * 0.90})))

    # timeline shock: +2 months
    # NOTE: your compute uses loan_term_months, not a hold period input.
    # v1 approach: add 2 months of interest on top of base net_interest_cost.
    # We’ll compute that separately and show it in the card.
    loan_amt = base["terms"]["loan_amount"] or 0
    rate = base["terms"]["interest_rate"] or 0
    monthly_interest = (loan_amt * (rate / 100.0) / 12.0) if loan_amt and rate else 0.0
    extra_interest_2mo = monthly_interest * 2

    return {
        "uiMode": "CARD_STRESS_TEST",
        "response": {
            "base": base,
            "extra_interest_2mo": round(extra_interest_2mo, 2),
            "scenarios": [
                {
                    "name": name,
                    "roi_percent": s["sale_and_profit"]["roi_percent"],
                    "gross_profit": s["sale_and_profit"]["gross_profit"],
                    "verdict": s["verdict"]["rating"],
                }
                for name, s in scenarios
            ],
        }
    }
def compute_refi_dscr(deal: Dict[str, Any]) -> Dict[str, Any]:
    arv = _to_float(deal.get("arv"))
    monthly_rent = _to_float(deal.get("monthlyRent"))
    city = deal.get("city")
    program = (deal.get("loanProgram") or "cash_out_refi").lower()

    # -------------------------
    # Chat guards
    # -------------------------
    if not monthly_rent:
        return {
            "uiMode": "CHAT",
            "pendingField": "monthlyRent",
            "response": "What is the monthly rent for the property?"
        }

    if not city:
        return {
            "uiMode": "CHAT",
            "pendingField": "city",
            "response": "What city is the property located in?"
        }

    if not arv:
        raise HTTPException(400, "ARV (or appraised value) is required for DSCR")

    # -------------------------
    # DSCR leverage
    # -------------------------
    max_dscr_loan = arv * 0.75

    # -------------------------
    # EXISTING LOAN (CRITICAL FIX)
    # Priority:
    # 1) FlipBot bridge loan (from deal analysis)
    # 2) User-entered existingLoanBalance
    # -------------------------
    bridge_loan = None
    if isinstance(deal.get("terms"), dict):
        bridge_loan = _to_float(deal["terms"].get("loan_amount"))

    existing_loan = (
        bridge_loan
        if bridge_loan and bridge_loan > 0
        else _to_float(deal.get("existingLoanBalance")) or 0.0
    )

    # -------------------------
    # Pricing
    # -------------------------
    interest_rate = rate_from_program(program)

    # Interest-only DSCR assumption
    monthly_debt = max_dscr_loan * (interest_rate / 100) / 12

    # NOI proxy
    noi = monthly_rent * 0.65

    dscr = noi / monthly_debt if monthly_debt > 0 else None

    # -------------------------
    # Refi proceeds
    # -------------------------
    refi_closing_costs = max_dscr_loan * 0.02

    net_refi_proceeds = max_dscr_loan - existing_loan - refi_closing_costs

    cash_out = max(net_refi_proceeds, 0.0)
    short_to_close = max(-net_refi_proceeds, 0.0)

    overleveraged = existing_loan > max_dscr_loan

    # -------------------------
    # Status
    # -------------------------
    if dscr is None:
        status = "unknown"
    elif dscr >= 1.25:
        status = "strong"
    elif dscr >= 1.10:
        status = "borderline"
    else:
        status = "weak"

    return {
        "uiMode": "CHAT_DSCR",
        "response": {
            "status": status,
            "dscr": round(dscr, 2),

            "estimated_noi": round(noi, 2),
            "monthly_debt_service": round(monthly_debt, 2),

            "max_dscr_loan": round(max_dscr_loan, 2),
            "existing_loan_payoff": round(existing_loan, 2),

            "cash_out": round(cash_out, 2),
            "short_to_close": round(short_to_close, 2),
            "overleveraged": overleveraged,

            "assumptions": {
                "ltv_cap": "75% ARV",
                "noi_factor": "65% of rent",
                "payment_type": "interest-only",
                "closing_costs": "2% estimate",
            },

            "guidance": (
                "DSCR refinance assumes payoff of existing bridge loan. "
                "Passing DSCR does not guarantee cash-out."
            ),
        },
    }


def compare_lenders_serpapi(deal: Dict[str, Any]) -> Dict[str, Any]:
    city = deal.get("city")
    state = deal.get("state", "")
    program = (deal.get("loanProgram") or "fix_and_flip").lower()

    if not city:
        raise HTTPException(400, "City is required for lender comparison")

    location = f"{city}, {state}".strip().strip(",")
    query = f"hard money lender {location}"

    results = search_local_lenders(city, state, num=10)

    # light ranking heuristic (v1)
    scored = []
    for r in results:
        rating = r.get("rating") or 0
        reviews = r.get("reviews") or 0
        score = (float(rating) * 10.0) + (min(int(reviews), 200) * 0.05)
        scored.append({**r, "score": round(score, 2)})

    scored.sort(key=lambda x: x["score"], reverse=True)

    return {
        "uiMode": "CARD_LENDER_COMPARE",
        "response": {
            "city": city,
            "state": state,
            "program": program,
            "query": query,
            "lenders": scored[:8],
            "note": "Rank uses rating + review volume. Always confirm actual terms, licensing, and program fit."
        }
    }

   

   
def extract_city_state(address: Optional[str]):
    if not address:
        return None, None

    parts = [p.strip() for p in address.split(",")]

    if len(parts) >= 2:
        city = parts[-2]
        state = parts[-1]
        return city, state

    return None, None
def is_lender_request(msg: str) -> bool:
    m = (msg or "").lower()
    keywords = ["lender", "lenders", "hard money", "private money", "funding", "who lends", "financing"]
    return any(k in m for k in keywords)

def is_deal_intent(msg: str) -> bool:
    m = (msg or "").lower()
    triggers = ["i have a deal", "analyze", "run numbers", "deal", "underwrite", "evaluate", "fix and flip", "flip"]
    return any(t in m for t in triggers)
    
@app.post("/api/chat")
def chat_endpoint(data: ChatRequest):
    try:
        msg = data.message or ""
        deal = data.deal or {}

        # ==================================================
        # ⚡ ACTION MODE (TOOLS / ANALYZERS)
        # ==================================================
        if data.mode == "action":
            if data.action not in SUPPORTED_ACTIONS:
                raise HTTPException(400, "Unsupported action")

            # 🔐 BILLABLE ACTIONS → REQUIRE CREDITS
            if data.action in BILLABLE_ACTIONS:
                user_id = deal.get("userId")
                if not user_id:
                    raise HTTPException(401, "Unauthorized")

                require_and_charge_credit(
                    user_id=user_id,
                    action_type=f"action:{data.action}",
                    credits=1
                )

            # -------- ACTION HANDLERS --------
            if data.action == "city_opportunity":
                return compute_city_opportunity(deal)

            if data.action == "refi_dscr":
                return compute_refi_dscr(deal)

            if data.action == "worst_case":
                return compute_worst_case(deal)

            if data.action == "stress_test":
                return compute_stress_test(deal)

            if data.action == "cash_to_close":
                return compute_out_of_pocket_costs(deal)

            if data.action == "hold_sensitivity":
                return compute_hold_time_sensitivity(deal)

            if data.action == "apr_risk":
                return compute_apr_and_default_risk(deal)

            if data.action == "find_lenders":
                city = deal.get("city")
                state = deal.get("state", "")
                program = (deal.get("loanProgram") or "fix_and_flip").lower()

                if not city:
                    raise HTTPException(400, "City is required")

                raw_lenders = search_local_lenders(city, state, num=20)
                cleaned = normalize_lenders(raw_lenders)
                enriched = enrich_lenders(cleaned[:10], program)

                return {
                    "uiMode": "CHAT_LENDER_RESULTS",
                    "response": {
                        "city": city,
                        "state": state,
                        "lenders": enriched,
                    },
                }

            raise HTTPException(400, "Action not implemented")

        # ==================================================
        # 📊 DEAL MODE (FULL ANALYSIS)
        # ==================================================
        if data.mode == "deal":
            user_id = deal.get("userId")
            if not user_id:
                raise HTTPException(401, "Unauthorized")

            # 🔥 CREATE A NEW DEAL SESSION
            session_id = create_deal_session(user_id, deal)
            
            save_message(
    session_id=session_id,
    sender="user",
    content=json_safe(deal)
)

            require_and_charge_credit(
                user_id=user_id,
                action_type="deal_analysis",
                reference_id=session_id,
                credits=1
            )

            analysis = compute_deal_response(deal)
            save_message(
    session_id=session_id,
    sender="assistant",
    content=json_safe(analysis)
)

            return {
                "sessionId": session_id,
                "uiMode": "CARD_DEAL",
                "response": analysis,
            }


        # ==================================================
        # 💬 CHAT MODE (FREE)
        # ==================================================
        if not msg:
            raise HTTPException(400, "Chat mode requires message")

        reply = ask_chatgpt(CHAT_SYSTEM_PROMPT + "\n\nUser:\n" + msg)
        return {"response": reply}

    except Exception as e:
        print("🔥 BACKEND ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/deal-sessions/{session_id}/messages")
def get_deal_messages(session_id: str):
    res = (
        supabase.table("deal_messages")
        .select("id, sender, content, created_at")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )

    return {
        "sessionId": session_id,
        "messages": res.data or []
    }



VERDICT_SUMMARIES = {
    "Strong Deal": [
        "🔥 Strong deal with healthy margins and lender-friendly leverage.",
        "💪 Strong deal — pricing reflects experience and solid execution upside.",
        "🚀 Strong opportunity with room for market or rehab variance.",
        "🔥💰 Attractive risk-adjusted return based on current assumptions.",
    ],
    "Borderline Deal": [
        "⚠️ Borderline deal — margins tighten quickly if costs increase.",
        "🟡 Deal pencils, but execution discipline matters.",
        "📉 Acceptable return, though sensitive to rehab or timeline overruns.",
        "⚠️ Works on paper, but limited buffer for surprises.",
    ],
    "Weak Deal": [
        "❌ Weak deal — return does not justify the risk profile.",
        "🚫 Capital may be better deployed into a higher-margin opportunity.",
        "⚠️ Thin margins with little room for error.",
        "📉 Risk outweighs projected reward under current assumptions.",
    ],
}

FOLLOW_UP_QUESTIONS = {
    "fix_and_flip": [
        "Want me to stress-test the deal (rehab +10%, timeline +2 months)?",
        "Want tips to lower rehab costs without hurting ARV?",
        "Want me to estimate a realistic resale net after realtor + closing costs?",
        "Want me to find hard money lenders in the property area?",
    ],
    "ground_up": [
        "Want me to estimate draw schedule + interest reserve impact?",
        "Want me to stress-test the budget (materials +10%) and timeline (+3 months)?",
        "Want me to list common new-construction underwriting pitfalls?",
        "Want me to find local construction lenders / private lenders?",
    ],
    "cash_out_refi": [
        "Want me to compute your cash-to-borrower after payoff + closing costs?",
        "Want me to estimate monthly payment + DSCR style view?",
        "Want me to analyze risk if ARV comes in low by 5–10%?",
        "Want me to find lenders that do cash-out refis in this area?",
    ],
}

BASE_STIPULATIONS = [
    "Loan application",
    "Credit authorization",
    "Last 3 months of bank statements",
]

DEAL_FIELDS = [
    "loanProgram",
    "transactionType",  # purchase or refinance
    "purchasePrice",
    "existingLoanBalance",
    "address",
    "city",
    "arv",
    "interestReserves",
    "rehabBudget",
    "creditScore",
    "experienceLevel",
]

DEAL_QUESTIONS = [
    {
        "field": "loanProgram",
        "question": "Which loan program are you using? (Fix & Flip, New Construction, or Cash-Out Refinance)",
        "options": ["fix_and_flip", "ground_up", "cash_out_refi"],
    },
    {
        "field": "transactionType",
        "question": "Is this a purchase or a refinance?",
        "options": ["purchase", "refinance"],
    },
    {
        "field": "purchasePrice",
        "question": "What is the purchase price (or original purchase price if refinance)?",
    },
    {
        "field": "existingLoanBalance",
        "question": "How much is currently owed on the property?",
    },
    {
        "field": "address",
        "question": "What is the property address?",
    },
     {
        "field": "city",
        "question": "What city is the property located in?",
    },
    {
        "field": "arv",
        "question": "What is the after-repair value (ARV)?",
    },
    {
        "field": "rehabBudget",
        "question": "What is the rehab budget?",
    },
    {
    "field": "interestReserves",
    "question": "How much cash do you have available to cover monthly interest payments during the project?",
    },

    {
        "field": "creditScore",
        "question": "What is the estimated credit score?",
    },
    {
        "field": "experienceLevel",
        "question": "How many flips have you completed? (0–2, 3–10, 10+)",
        "options": ["beginner", "intermediate", "pro"],
    },
]

def get_next_question(deal: Dict[str, Any]):
    for step in DEAL_QUESTIONS:
        value = deal.get(step["field"])

        # normalize empty strings
        if isinstance(value, str):
            value = value.strip()

        if value in (None, ""):
            return step

    return None


PROGRAM_STIPULATIONS = {
    "ground_up": [
        "Construction bid",
        "Proof of permits / permit status (and lot ownership docs if applicable)",
    ],
    "cash_out_refi": [
        "Certificate of occupancy",
    ],
}

@app.post("/api/intake")
def intake_endpoint(data: ChatRequest):
    deal = data.deal or {}
    user_id = deal.get("userId")

    if not user_id:
        raise HTTPException(401, "Unauthorized")

    # 🔧 Normalize experienceLevel if numeric (CRITICAL FIX)
    exp = deal.get("experienceLevel")

    if isinstance(exp, str):
        exp = exp.strip()

        if exp.isdigit():
            flips = int(exp)
            if flips <= 2:
                deal["experienceLevel"] = "beginner"
            elif flips <= 10:
                deal["experienceLevel"] = "intermediate"
            else:
                deal["experienceLevel"] = "pro"

    # 🔍 Determine next intake question
    next_step = get_next_question(deal)

    # ⛔ STILL ASKING QUESTIONS — DO NOT COUNT
    if next_step:
        return {
            "complete": False,
            "field": next_step["field"],
            "question": next_step["question"],
            "options": next_step.get("options"),
        }

    

    # ✅ RUN ANALYSIS
    return {
        "complete": True,
        "uiMode": "CARD_DEAL",
        "response": compute_deal_response(deal),
    }


# =========================
# PROMPTS (CHAT ONLY)
# =========================

CHAT_SYSTEM_PROMPT = """
You are FlipBot, an expert assistant focused ONLY on:

- Fix & flip real estate investing
- Rehab budgets and timelines
- Hard money and private lending
- Deal risk, ROI, underwriting, and deal structure

STRICT RULES:
- If the user asks about news, politics, entertainment, sports, or unrelated topics,
  politely refuse and redirect to real estate investing.
- Respond in plain, concise text.
- If the question is unclear, ask a clarifying real-estate-related question.

Refusal example:
"I'm focused on real estate investing and deal analysis. Let me know if you'd like help evaluating a property or loan structure."
"""

# =========================
# REQUEST MODEL
# =========================

# =========================
# HELPERS
# =========================

def _to_float(x) -> Optional[float]:
    if x is None:
        return None
    if isinstance(x, (int, float)):
        return float(x)
    if isinstance(x, str):
        s = x.strip().replace(",", "").replace("$", "")
        if s == "":
            return None
        try:
            return float(s)
        except ValueError:
            return None
    return None

def _round_money(x: Optional[float]) -> Optional[float]:
    if x is None:
        return None
    return float(round(x, 2))

def _round_pct(x: Optional[float]) -> Optional[float]:
    if x is None:
        return None
    return float(round(x, 2))

def rate_from_program(program: str) -> float:
    # Base rates from you:
    # cash-out refi 10.5, fix & flip 11, new construction 12
    if program == "cash_out_refi":
        return 10.5
    if program == "ground_up":
        return 12.0
    # default fix_and_flip
    return 11.0

def rate_discount_from_experience(exp: str) -> float:
    # 0–2 flips: 0.0
    # 3–10 flips: -0.5
    # 10+ flips: -1.0 (another -0.5)
    if exp == "intermediate":
        return 0.5
    if exp == "pro":
        return 1.0
    return 0.0

def points_from_loan_amount(loan_amount: float) -> float:
    # Your rules:
    # - Over 350k: 2 points
    # - Always at least 3 points otherwise
    # - Under 150k: minimum $5k flat fee (implies points can be >3 depending on size)
    if loan_amount >= 350_000:
        return 2.0
    if loan_amount < 150_000:
        # points implied by $5k minimum, but never below 3
        implied = (5000.0 / loan_amount) * 100.0
        return max(3.0, round(implied, 2))
    # 150k–349,999: tiered (matches your 200k -> ~4 points example)
    if loan_amount < 250_000:
        return 4.0
    return 3.0

def term_months_from_ltv(
    loan_amount: float,
    arv: float,
    program: Optional[str] = None
) -> int:
    """
    Determines loan term based on LTV (ARV).

    Base rule:
    - >60% LTV → 12 months
    - 50–60% LTV → 18 months
    - <50% LTV → 24 months

    Program guardrails:
    - Fix & Flip / Ground-Up: max 18 months
    - Cash-Out Refi: allow full 24 months
    """

    if not arv or arv <= 0:
        return 12

    ltv = loan_amount / arv

    # Base term from leverage
    if ltv > 0.60:
        term = 12
    elif ltv >= 0.50:
        term = 18
    else:
        term = 24

    # Program-based cap
    if program in ("fix_and_flip", "ground_up"):
        term = min(term, 18)

    return term

def prepaid_months_from_program(program: str) -> int:
    # You specified: new construction prepay 6 months at closing.
    # For the others, choose a reasonable default that you can tweak later.
    if program == "ground_up":
        return 6
    if program == "fix_and_flip":
        return 1
    if program == "cash_out_refi":
        return 0
    return 1
def prepaid_interest_from_reserves(
    loan_amount: float,
    interest_rate: float,
    reserves: Optional[float],
    program: str,
) -> float:
    """
    Borrower-paid prepaid interest policy:
    - If reserves cover 12 months: 0 prepaid
    - Else if reserves cover 6 months: prepay 3 months
    - Else: prepay 6 months
    """

    # If reserves not provided, fall back to program default months
    if reserves is None:
        months = prepaid_months_from_program(program)
        return loan_amount * (interest_rate / 100.0) / 12.0 * months

    monthly_interest = loan_amount * (interest_rate / 100.0) / 12.0
    if monthly_interest <= 0:
        return 0.0

    six_months = monthly_interest * 6
    twelve_months = monthly_interest * 12

    if reserves >= twelve_months:
        prepaid_months = 0
    elif reserves >= six_months:
        prepaid_months = 3
    else:
        prepaid_months = 6

    return monthly_interest * prepaid_months

# =========================
# ACTION HANDLERS (CHATGPT)
# =========================
def check_and_increment_deal_limit(user_id: str):
    today = date.today().isoformat()

    res = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )

    profile = res.data

    # Reset daily counter if new day
    if profile["last_usage_date"] != today:
        supabase.table("profiles").update({
            "daily_deal_count": 0,
            "last_usage_date": today
        }).eq("id", user_id).execute()
        profile["daily_deal_count"] = 0

    # Paid users → unlimited
    if profile["plan"] == "paid":
        return True

    # Trial users → check expiry
    if profile["plan"] == "trial":
        if profile["trial_ends_at"] and profile["trial_ends_at"] > datetime.utcnow().isoformat():
            return True
        return False

    # Free users → max 3/day
    if profile["daily_deal_count"] >= 3:
        return False

    # Increment usage
    supabase.table("profiles").update({
        "daily_deal_count": profile["daily_deal_count"] + 1
    }).eq("id", user_id).execute()

    return True



def compute_deal_response(deal: Dict[str, Any]) -> Dict[str, Any]:
    transaction_type = (deal.get("transactionType") or "purchase").strip().lower()

    program = (deal.get("loanProgram") or "").strip().lower()
    exp = (deal.get("experienceLevel") or "").strip()

    purchase = _to_float(deal.get("purchasePrice"))
    rehab = _to_float(deal.get("rehabBudget")) or 0.0
    arv = _to_float(deal.get("arv"))
    existing_balance = _to_float(deal.get("existingLoanBalance")) or 0.0
    interest_reserves = _to_float(deal.get("interestReserves"))

    if not program:
        raise HTTPException(400, "Missing loanProgram")
    if purchase is None or arv is None:
        raise HTTPException(400, "Missing purchasePrice or arv")

    # -------------------------
    # Loan Amount Calculation
    # -------------------------
    if transaction_type == "purchase":
        # Purchase underwriting:
        # cap by 70% ARV AND by cost-basis leverage (90% purchase + 100% rehab)
        loan_by_arv = arv * 0.70
        loan_by_cost = (purchase * 0.90) + rehab
        loan_amount = min(loan_by_arv, loan_by_cost)

    else:  # refinance
        # Refinance underwriting:
        # cap by 70% ARV (existing liens handled in payoff/short-to-close)
        loan_amount = arv * 0.70

    loan_amount = max(0.0, loan_amount)

    loan_term_months = term_months_from_ltv(loan_amount, arv, program)

    # -------------------------
    # Pricing
    # -------------------------
    base_rate = rate_from_program(program)
    discount = rate_discount_from_experience(exp)
    interest_rate = max(0.0, base_rate - discount)

    points = points_from_loan_amount(loan_amount)
    origination_fees = max(5000.0, (points / 100.0) * loan_amount)

    processing_docs = 1195.0  # 600 docs + 595 processing
    underwriting_fee = 595.0 if loan_amount < 150_000 else 0.0
    processing_fees = processing_docs + underwriting_fee

    prepaid_interest = prepaid_interest_from_reserves(
        loan_amount,
        interest_rate,
        interest_reserves,
        program,
    )

    # -------------------------
    # Hold-period interest
    # -------------------------
    monthly_interest = loan_amount * (interest_rate / 100.0) / 12.0
    total_interest_over_term = monthly_interest * loan_term_months
    net_interest_cost = max(0.0, total_interest_over_term - prepaid_interest)

    total_closing_costs = origination_fees + processing_fees + prepaid_interest

    # -------------------------
    # Payoff logic + cash at close
    # -------------------------
    loan_principal_payoff_at_sale = loan_amount

    # ✅ Refi must pay off existing lien; purchase should ignore it
    existing_loan_payoff = existing_balance if transaction_type == "refinance" else 0.0

    net_loan_proceeds = loan_amount - existing_loan_payoff
    net_cash_at_close = net_loan_proceeds - total_closing_costs

    cash_to_borrower = max(net_cash_at_close, 0.0)
    cash_from_borrower = max(-net_cash_at_close, 0.0)

    # ✅ NEW: short-to-close + overleveraged flag (refi only)
    short_to_close = 0.0
    is_overleveraged = False
    if transaction_type == "refinance" and net_cash_at_close < 0:
        short_to_close = abs(net_cash_at_close)
        is_overleveraged = True

    # -------------------------
    # Equity / cost basis (purchase only)
    # -------------------------
    if transaction_type == "purchase":
        purchase_equity = max(0.0, purchase - loan_amount)
    else:
        purchase_equity = 0.0

    # -------------------------
    # Profit (keep your structure)
    # -------------------------
    estimated_sale_price = arv

    total_project_cost = (
        purchase_equity
        + rehab
        + total_closing_costs
        + net_interest_cost
        + loan_principal_payoff_at_sale
    )

    gross_profit = estimated_sale_price - total_project_cost
    roi_percent = (gross_profit / total_project_cost) * 100.0 if total_project_cost > 0 else None

    # -------------------------
    # Key risks
    # -------------------------
    key_risks = []

    if transaction_type == "refinance" and existing_balance <= 0:
        key_risks.append("Refinance requires an existing payoff balance—confirm current lien(s).")

    if transaction_type == "refinance" and is_overleveraged:
        key_risks.append("Overleveraged: refinance proceeds do not cover existing payoff + closing costs.")

    if roi_percent is not None and roi_percent < 10:
        key_risks.append("Thin margin: small cost/timeline changes can erase profit.")

    if rehab > 0 and rehab > (0.20 * arv):
        key_risks.append("High rehab relative to ARV: budget overruns are common—verify bids and contingency.")

    if exp == "beginner":
        key_risks.append("Beginner execution risk: timelines and change-orders tend to run higher for first-time flippers.")

    if not key_risks:
        key_risks.append("Main risk is ARV accuracy—validate comps and conservative exit assumptions.")

    # -------------------------
    # Verdict
    # -------------------------
    if transaction_type == "refinance" and is_overleveraged:
        rating = "Weak Deal"
        verdict_summary = "❌ Refinance does not cover existing lien payoff + costs. Borrower is short to close and property is overleveraged."
    else:
        if roi_percent is not None and roi_percent >= 25 and gross_profit > 0:
            rating = "Strong Deal"
        elif roi_percent is not None and roi_percent >= 10 and gross_profit > 0:
            rating = "Borderline Deal"
        else:
            rating = "Weak Deal"
        verdict_summary = random.choice(VERDICT_SUMMARIES.get(rating, ["Deal analysis complete."]))

    # -------------------------
    # Stipulations + followups
    # -------------------------
    stipulations = list(BASE_STIPULATIONS)
    stipulations.extend(PROGRAM_STIPULATIONS.get(program, []))

    followups = FOLLOW_UP_QUESTIONS.get(program, [
        "Want me to stress-test the deal assumptions?",
        "Want me to help you reduce costs or increase margin?",
        "Want me to find lenders in your area?",
    ])

    return {
        "property": {
            "city": deal.get("city"),
            "state": deal.get("state"),
        },

        "terms": {
            "interest_rate": _round_pct(interest_rate),
            "points": _round_pct(points),
            "ltv_arv": _round_pct((loan_amount / arv) * 100) if arv else None,
            "loan_amount": _round_money(loan_amount),
            "loan_term_months": loan_term_months,
        },

        "financing_costs": {
            "prepaid_interest": _round_money(prepaid_interest),
            "origination_fees": _round_money(origination_fees),
            "processing_fees": _round_money(processing_fees),
            "total_closing_costs": _round_money(total_closing_costs),
        },

        "sale_and_profit": {
            "estimated_sale_price": _round_money(estimated_sale_price),

            "loan_payoff": {
                "loan_principal_payoff_at_sale": _round_money(loan_principal_payoff_at_sale),
                "existing_loan_payoff": _round_money(existing_loan_payoff),
            },

            "cash_at_close": {
                "cash_to_borrower": _round_money(cash_to_borrower),
                "cash_from_borrower": _round_money(cash_from_borrower),
            },

            "purchase_price": _round_money(purchase),
            "rehab_budget": _round_money(rehab),
            "financing_costs": _round_money(total_closing_costs),

            "total_project_cost": _round_money(total_project_cost),
            "gross_profit": _round_money(gross_profit),
            "roi_percent": _round_pct(roi_percent),
        },

        # ✅ NEW BLOCK: shows "short to close" + overleveraged
        "refi_analysis": {
            "transaction_type": transaction_type,
            "existing_loan_balance": _round_money(existing_balance),
            "short_to_close": _round_money(short_to_close),
            "is_overleveraged": is_overleveraged,
        },

        "stipulations": stipulations,
        "key_risks": key_risks,
        "follow_up_questions": followups,

        "verdict": {
            "rating": rating,
            "summary": verdict_summary,
            "improvements": [
                "Negotiate purchase price or reduce scope to widen margin.",
                "Increase ARV confidence with stronger comps and conservative exit assumptions.",
            ],
        },
    }



