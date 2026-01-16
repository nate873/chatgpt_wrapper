from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import stripe
import os
from supabase import create_client

router = APIRouter(prefix="/stripe", tags=["stripe"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class PortalRequest(BaseModel):
    user_id: str

def ensure_stripe_env():
    if not stripe.api_key or not FRONTEND_URL:
        raise HTTPException(500, "Stripe not configured")

@router.post("/create-portal-session")
def create_portal_session(data: PortalRequest):
    ensure_stripe_env()

    profile = (
        supabase
        .table("profiles")
        .select("stripe_customer_id")
        .eq("id", data.user_id)
        .single()
        .execute()
    ).data

    if not profile or not profile.get("stripe_customer_id"):
        raise HTTPException(
            status_code=400,
            detail="No Stripe customer found. Please subscribe first."
        )

    customer_id = profile["stripe_customer_id"]

    # 🔐 Verify customer exists in Stripe (CRITICAL)
    try:
        stripe.Customer.retrieve(customer_id)
    except stripe.error.InvalidRequestError:
        raise HTTPException(
            status_code=400,
            detail="Stripe customer invalid. Please re-subscribe."
        )

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{FRONTEND_URL}/pricing-plans",
    )

    return {"url": session.url}
