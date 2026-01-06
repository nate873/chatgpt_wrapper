// src/pages/PricingPlans.js
import React, { useEffect, useState } from "react";
import "./PricingPlans.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";
const API_BASE = "https://chatgptwrapper-production.up.railway.app";
const PricingPlans = () => {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("free");
  const [credits, setCredits] = useState(0);

  // -----------------------------
  // Load user + profile
  // -----------------------------
  useEffect(() => {
    const loadUserAndProfile = async () => {
      const session = await supabase.auth.getSession();
      const currentUser = session.data.session?.user;
      if (!currentUser) return;

      setUser(currentUser);

      const { data } = await supabase
        .from("profiles")
        .select("plan, credits_remaining")
        .eq("id", currentUser.id)
        .single();

      if (data) {
        setPlan(data.plan || "free");
        setCredits(data.credits_remaining ?? 0);
      }
    };

    loadUserAndProfile();
  }, []);

  // -----------------------------
  // Stripe Checkout
  // -----------------------------
  const startCheckout = async (selectedPlan) => {
    if (!user) {
      alert("Please log in to upgrade your plan.");
      return;
    }

    if (selectedPlan === plan) return;

    try {
     const res = await fetch(
  `${API_BASE}/stripe/create-checkout-session`,

        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: selectedPlan,
            user_id: user.id,
            email: user.email,
          }),
        }
      );

      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (err) {
      console.error("Stripe checkout error:", err);
      alert("Unable to start checkout. Please try again.");
    }
  };

  // -----------------------------
  // Stripe Billing Portal
  // -----------------------------
  const openBillingPortal = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!data?.stripe_customer_id) {
      alert("Billing account not found.");
      return;
    }

    try {
     const res = await fetch(
  `${API_BASE}/stripe/create-checkout-session`,

        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: data.stripe_customer_id,
          }),
        }
      );

      const result = await res.json();
      if (result.url) window.location.href = result.url;
      else throw new Error("No portal URL returned");
    } catch (err) {
      console.error("Billing portal error:", err);
      alert("Unable to open billing portal.");
    }
  };

  return (
    <div className="chat-page">
      <Header user={user} plan={plan} credits={credits} />

      <div className="chat-shell">
        <Sidebar
          loggedIn={!!user}
          onLogoutClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
        />

        <main className="chat-panel">
          <div className="pricing-page">
            <h1 className="pricing-title">Pricing Plans</h1>

            {/* 🔥 Manage Billing */}
            {plan !== "free" && (
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <button
                  className="secondary-btn"
                  onClick={openBillingPortal}
                >
                  Manage Billing / Cancel Subscription
                </button>
              </div>
            )}

            <div className="pricing-toggle">
              <button className="active">Monthly</button>
              <button disabled>Annually</button>
            </div>

            <div className="pricing-grid">
              {/* FREE */}
              <div className="pricing-card">
                {plan === "free" && (
                  <div className="badge current">Current Plan</div>
                )}
                <h2>Free</h2>
                <p className="price">$0<span>/month</span></p>
                <ul>
                  <li>10 research credits / month</li>
                  <li>Limited searches</li>
                  <li>Basic deal analysis</li>
                </ul>
              </div>

              {/* PRO */}
              <div className="pricing-card popular">
                <div className="badge popular-badge">POPULAR</div>
                <h2>Pro</h2>
                <p className="price">$22.95<span>/month</span></p>
                <button
                  className="choose-btn"
                  disabled={plan === "pro"}
                  onClick={() => startCheckout("pro")}
                >
                  {plan === "pro" ? "Current Plan" : "Choose This Plan"}
                </button>
                <ul>
                  <li>1,000 credits / month</li>
                  <li>Unlimited deal analysis</li>
                  <li>Advanced metrics</li>
                  <li>AI research tools</li>
                </ul>
              </div>

              {/* PREMIUM */}
              <div className="pricing-card premium">
                <div className="badge best">BEST VALUE</div>
                <h2>Premium</h2>
                <p className="price">$29.95<span>/month</span></p>
                <button
                  className="choose-btn premium-btn"
                  disabled={plan === "premium"}
                  onClick={() => startCheckout("premium")}
                >
                  {plan === "premium" ? "Current Plan" : "Choose This Plan"}
                </button>
                <ul>
                  <li>3,000 credits / month</li>
                  <li>Everything in Pro</li>
                  <li>Off-market deals access</li>
                  <li>Maximum AI analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PricingPlans;
