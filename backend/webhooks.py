import os
import stripe
from fastapi import APIRouter, Request, HTTPException
from main import supabase

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")



router = APIRouter(prefix="/webhooks", tags=["Stripe Webhooks"])

PRICE_TO_PLAN = {
    "price_1SmfwHEVVGZeraBTZEVOGJS5": {
        "plan": "pro",
        "monthly_credits": 1000,
    },
    "price_1SmfwXEVVGZeraBTLsrBpEiZ": {
        "plan": "premium",
        "monthly_credits": 3000,
    },
}


@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await handle_checkout_completed(obj)

    elif event_type in ("customer.subscription.created", "customer.subscription.updated"):
        await handle_subscription_update(obj)

    elif event_type in ("customer.subscription.deleted", "invoice.payment_failed"):
        await handle_subscription_canceled(obj)

    return {"ok": True}


async def handle_checkout_completed(session):
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    email = session.get("customer_details", {}).get("email")
    user_id = session.get("metadata", {}).get("user_id")

    # 1️⃣ Try user_id first
    if user_id:
        profile = (
            supabase.table("profiles")
            .select("id")
            .eq("id", user_id)
            .single()
            .execute()
        ).data
    else:
        # 2️⃣ Fallback to email
        profile = (
            supabase.table("profiles")
            .select("id")
            .eq("email", email)
            .single()
            .execute()
        ).data

    if not profile:
        return

    supabase.table("profiles").update({
        "stripe_customer_id": customer_id,
        "stripe_subscription_id": subscription_id,
    }).eq("id", profile["id"]).execute()

    subscription = stripe.Subscription.retrieve(subscription_id)
    await apply_plan(profile["id"], subscription)


async def handle_subscription_update(subscription):
    customer_id = subscription.get("customer")

    profile = (
        supabase.table("profiles")
        .select("id")
        .eq("stripe_customer_id", customer_id)
        .single()
        .execute()
    ).data

    if profile:
        await apply_plan(profile["id"], subscription)


async def apply_plan(user_id, subscription):
    price_id = subscription["items"]["data"][0]["price"]["id"]
    plan_info = PRICE_TO_PLAN.get(price_id)

    if not plan_info:
        return

    supabase.table("profiles").update({
        "plan": plan_info["plan"],
        "credits_remaining": plan_info["monthly_credits"],
        "stripe_subscription_id": subscription["id"],
    }).eq("id", user_id).execute()


async def handle_subscription_canceled(subscription):
    customer_id = subscription.get("customer")

    profile = (
        supabase.table("profiles")
        .select("id")
        .eq("stripe_customer_id", customer_id)
        .single()
        .execute()
    ).data

    if profile:
        supabase.table("profiles").update({
            "plan": "free",
            "credits_remaining": 10,
            "stripe_subscription_id": None,
        }).eq("id", profile["id"]).execute()
