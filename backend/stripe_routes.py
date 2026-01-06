# stripe_routes.py

import os
import stripe
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# -----------------------------
# Router
# -----------------------------
router = APIRouter(prefix="/stripe", tags=["stripe"])

# -----------------------------
# Environment
# -----------------------------
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL")

if not STRIPE_SECRET_KEY:
    raise RuntimeError("❌ STRIPE_SECRET_KEY not set")

if not FRONTEND_URL:
    raise RuntimeError("❌ FRONTEND_URL not set")

# -----------------------------
# Stripe config
# -----------------------------
stripe.api_key = STRIPE_SECRET_KEY
print("✅ Stripe initialized")

# -----------------------------
# Price IDs (TEST MODE)
# -----------------------------
PRICE_IDS = {
    "pro": "price_1SmJFSRIcFNR0I8c5nT67kz9",
    "premium": "price_1SmJGBRIcFNR0I8cS3TEAHpA",
}

# -----------------------------
# Request models
# -----------------------------
class CheckoutRequest(BaseModel):
    plan: str
    user_id: str
    email: str


class PortalRequest(BaseModel):
    customer_id: str


# -----------------------------
# Create Checkout Session
# -----------------------------
@router.post("/create-checkout-session")
def create_checkout_session(data: CheckoutRequest):
    if data.plan not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[
                {
                    "price": PRICE_IDS[data.plan],
                    "quantity": 1,
                }
            ],
            customer_email=data.email,
            metadata={
                "user_id": data.user_id,
                "plan": data.plan,
            },
            success_url=f"{FRONTEND_URL}/chat?success=true",
            cancel_url=f"{FRONTEND_URL}/pricing-plans",
        )

        return {"url": session.url}

    except Exception as e:
        print("❌ Stripe checkout error:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Stripe checkout failed"
        )


# -----------------------------
# Create Stripe Billing Portal
# -----------------------------
@router.post("/create-portal-session")
def create_portal_session(data: PortalRequest):
    if not data.customer_id:
        raise HTTPException(status_code=400, detail="Missing customer_id")

    try:
        session = stripe.billing_portal.Session.create(
            customer=data.customer_id,
            return_url=f"{FRONTEND_URL}/chat",
        )

        return {"url": session.url}

    except Exception as e:
        print("❌ Stripe portal error:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Unable to open billing portal"
        )
