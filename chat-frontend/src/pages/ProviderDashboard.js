import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import "./ProviderDashboard.css";

const ProviderDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_provider, provider_approved")
        .eq("id", user.id)
        .single();

      setProfile(profile);

      // ✅ LOAD LISTINGS AS SOON AS THEY APPLY
      if (profile?.is_provider) {
        const { data: listings } = await supabase
          .from("off_market_listings")
          .select("*")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false });

        setListings(listings || []);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const applyToBeProvider = async () => {
    setApplying(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setApplying(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_provider: true,
        provider_approved: false
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Error submitting application");
      setApplying(false);
      return;
    }

    setProfile({ is_provider: true, provider_approved: false });
    setApplying(false);
  };

  if (loading) return <p>Loading…</p>;

  /* ================= NOT LOGGED IN ================= */
  if (!profile) {
    return (
      <div className="provider-dashboard">
        <h1>Provider Portal</h1>
        <p>Please log in to apply or manage listings.</p>
        <Link to="/login" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  /* ================= NOT A PROVIDER YET ================= */
  if (!profile.is_provider) {
    return (
      <div className="provider-dashboard">
        <div className="dashboard-header">
          <h1>List Properties on FlipBot</h1>
        </div>

        <p>
          Providers can submit off-market deals to FlipBot.
          You can start listing immediately — verification comes later.
        </p>

        <button
          className="btn-primary"
          onClick={applyToBeProvider}
          disabled={applying}
        >
          {applying ? "Submitting…" : "Start Listing Properties"}
        </button>
      </div>
    );
  }

  /* ================= PROVIDER DASHBOARD (APPROVED OR NOT) ================= */
  return (
    <div className="provider-dashboard">
      <div className="dashboard-header">
        <h1>Your Listings</h1>
        <Link to="/provider/create" className="btn-primary">
          + Create Listing
        </Link>
      </div>

      {/* 🔔 Pending approval notice (NON-BLOCKING) */}
      {!profile.provider_approved && (
        <div className="provider-notice">
          Your account is <strong>unverified</strong>.  
          Listings are allowed, but verified providers receive higher visibility.
        </div>
      )}

      {listings.length === 0 && (
        <p>You haven’t created any listings yet.</p>
      )}

      <div className="dashboard-list">
        {listings.map((listing) => (
          <div key={listing.id} className="dashboard-card">
            <div>
              <h3>{listing.title}</h3>
              <p>
                {listing.city}, {listing.state}
              </p>
            </div>

            <div className="status">
              <span className={`badge ${listing.deal_status}`}>
                {listing.deal_status}
              </span>

              {!listing.is_published && (
                <span className="badge pending">Not Published</span>
              )}
            </div>

            <div className="actions">
              <Link to={`/provider/edit/${listing.id}`}>
                Edit
              </Link>

              {listing.deal_status === "draft" && (
                <button
                  onClick={async () => {
                    await supabase
                      .from("off_market_listings")
                      .update({ deal_status: "pending_review" })
                      .eq("id", listing.id);

                    setListings((prev) =>
                      prev.map((l) =>
                        l.id === listing.id
                          ? { ...l, deal_status: "pending_review" }
                          : l
                      )
                    );
                  }}
                  style={{ marginLeft: "10px" }}
                >
                  Submit for Review
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderDashboard;
