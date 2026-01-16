
import os
import stripe
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

# -----------------------------
# Router
# -----------------------------
router = APIRouter(prefix="/stripe", tags=["stripe"])

# -----------------------------
# Environment
# -----------------------------
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not STRIPE_SECRET_KEY:
    raise RuntimeError("❌ STRIPE_SECRET_KEY not set")

if not FRONTEND_URL:
    raise RuntimeError("❌ FRONTEND_URL not set")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("❌ Supabase env vars not set")

# -----------------------------
# Clients
# -----------------------------
stripe.api_key = STRIPE_SECRET_KEY
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("✅ Stripe + Supabase initialized")

# -----------------------------
# Price IDs (TEST MODE)
# -----------------------------
PRICE_IDS = {
    "pro": "price_1SmfwHEVVGZeraBTZEVOGJS5",
    "premium": "price_1SmfwXEVVGZeraBTLsrBpEiZ",
}

# -----------------------------
# Request models
# -----------------------------
class CheckoutRequest(BaseModel):
    plan: str
    user_id: str
    email: str


class PortalRequest(BaseModel):
    user_id: str
    customer_id: str | None = None


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
            line_items=[{
                "price": PRICE_IDS[data.plan],
                "quantity": 1,
            }],
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
        print("❌ Stripe checkout error:", e)
        raise HTTPException(500, "Stripe checkout failed")


# -----------------------------
# Create Billing Portal Session
# -----------------------------
@router.post("/create-portal-session")
def create_portal_session(data: PortalRequest):
    try:
        customer = None

        # 1️⃣ Try existing Stripe customer
        if data.customer_id:
            try:
                customer = stripe.Customer.retrieve(data.customer_id)
            except stripe.error.InvalidRequestError:
                customer = None

        # 2️⃣ Create Stripe customer if missing
        if not customer:
            customer = stripe.Customer.create(
                metadata={"user_id": data.user_id}
            )

            # 🔑 Persist new Stripe ID in Supabase
            supabase.table("profiles") \
                .update({"stripe_customer_id": customer.id}) \
                .eq("id", data.user_id) \
                .execute()

        # 3️⃣ Create billing portal session
        session = stripe.billing_portal.Session.create(
            customer=customer.id,
            return_url=f"{FRONTEND_URL}/pricing-plans",
        )

        return {"url": session.url}

    except stripe.error.StripeError as e:
        print("❌ Stripe portal error:", e)
        raise HTTPException(500, "Failed to create billing portal session")
