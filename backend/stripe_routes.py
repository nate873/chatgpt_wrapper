import os
import stripe
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from main import supabase

router = APIRouter(prefix="/stripe", tags=["stripe"])

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL")

stripe.api_key = STRIPE_SECRET_KEY

def ensure_stripe_env():
    if not STRIPE_SECRET_KEY or not FRONTEND_URL:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured on the server"
        )

PRICE_IDS = {
    "pro": "price_1SmfwHEVVGZeraBTZEVOGJS5",
    "premium": "price_1SmfwXEVVGZeraBTLsrBpEiZ",
}

class CheckoutRequest(BaseModel):
    plan: str
    user_id: str
    email: str

class PortalRequest(BaseModel):
    customer_id: str

@router.post("/create-checkout-session")
def create_checkout_session(data: CheckoutRequest):
    ensure_stripe_env()

    if data.plan not in PRICE_IDS:
        raise HTTPException(400, "Invalid plan")

    # ✅ Create Stripe customer
    customer = stripe.Customer.create(
        email=data.email,
        metadata={"user_id": data.user_id}
    )

    # ✅ Save customer ID to Supabase
    supabase.table("profiles").update({
        "stripe_customer_id": customer.id
    }).eq("id", data.user_id).execute()

    # ✅ Attach customer to checkout
    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer.id,
        line_items=[{
            "price": PRICE_IDS[data.plan],
            "quantity": 1,
        }],
        success_url=f"{FRONTEND_URL}/chat?success=true",
        cancel_url=f"{FRONTEND_URL}/pricing-plans",
    )

    return {"url": session.url}

@router.post("/create-portal-session")
def create_portal_session(data: PortalRequest):
    ensure_stripe_env()

    if not data.customer_id:
        raise HTTPException(400, "Missing customer_id")

    try:
        session = stripe.billing_portal.Session.create(
            customer=data.customer_id,
            return_url=f"{FRONTEND_URL}/pricing-plans",
        )
        return {"url": session.url}

    except Exception:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Stripe billing portal error")
