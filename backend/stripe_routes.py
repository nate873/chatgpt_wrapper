import os
import stripe
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

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

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": PRICE_IDS[data.plan], "quantity": 1}],
            customer_email=data.email,
            metadata={"user_id": data.user_id, "plan": data.plan},
            success_url=f"{FRONTEND_URL}/chat?success=true",
            cancel_url=f"{FRONTEND_URL}/pricing-plans",
        )
        return {"url": session.url}

    except Exception as e:
        print("❌ Stripe checkout error:", e)
        raise HTTPException(500, "Stripe checkout failed")

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
