import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import "./ProviderDashboard.css";
import "./About.css";

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
      <main className="about-page">
        <div className="about-container provider-dashboard">
          <h1 className="about-title">Provider Portal</h1>
          <p className="about-subtitle">
            Please log in to list or manage off-market deals.
          </p>
          <Link to="/login" className="btn-primary">Log In</Link>
        </div>
      </main>
    );
  }

  /* ================= NOT A PROVIDER ================= */
  if (!profile.is_provider) {
    return (
      <main className="about-page">
        <div className="about-container provider-dashboard">
          <section className="flipbot-hero">
            <h1>
              List off-market deals with{" "}
              <span className="flip">Flip</span>
              <span className="bot">Bot</span>
            </h1>

            <p className="flipbot-lead">
              <span className="flip">Flip</span>
              <span className="bot">Bot</span> connects wholesalers and agents
              with active fix-and-flip and buy-and-hold investors.
            </p>

            <button
              className="btn-primary"
              onClick={applyToBeProvider}
              disabled={applying}
            >
              {applying ? "Submitting…" : "Start Listing Deals"}
            </button>
          </section>
        </div>
      </main>
    );
  }

  /* ================= PROVIDER DASHBOARD ================= */
  return (
    <main className="about-page">
      <div className="about-container provider-dashboard">

        {/* ================= HERO ================= */}
        <section className="flipbot-hero">
          <h1>
            List off-market investment properties with{" "}
            <span className="flip">Flip</span>
            <span className="bot">Bot</span>
          </h1>

          <div className="flipbot-cards">
            <div className="flipbot-card">
              <h3>Reach serious fix-and-flippers</h3>
              <p>
                Share off-market deals directly with a network of
                active investors looking for value-add opportunities.
              </p>
            </div>

            <div className="flipbot-card">
              <h3>Private listings, faster decisions</h3>
              <p>
                Skip the MLS. List properties privately and get
                faster feedback from qualified buyers.
              </p>
            </div>
          </div>

          <p className="flipbot-subtext">
            Create a listing in minutes — submit deals for review and
            unlock increased exposure to investors.
          </p>

          <Link to="/provider/create" className="btn-primary">
            + Create Listing
          </Link>
        </section>

        {/* ================= LISTINGS ================= */}
        {listings.length === 0 && (
          <p className="about-subtitle">
            You haven’t created any listings yet.
          </p>
        )}

        <div className="dashboard-list">
          {listings.map((listing) => (
            <div key={listing.id} className="dashboard-card">
              <div>
                <h3>{listing.title || "Untitled Listing"}</h3>
                <p>{listing.city}, {listing.state}</p>
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
                <Link to={`/provider/edit/${listing.id}`}>Edit</Link>

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
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ================= FAQ ================= */}
        <section className="faq">
          <h2>Frequently Asked Questions</h2>

          <details>
            <summary>
              <span className="faq-question">
                Who can list deals on{" "}
                <span className="flip">Flip</span>
                <span className="bot">Bot</span>?
              </span>
            </summary>
            <p>Wholesalers and agents with off-market investment properties.</p>
          </details>

          <details>
            <summary>
              <span className="faq-question">
                Are listings public?
              </span>
            </summary>
            <p>
              No. <span className="flip">Flip</span>
              <span className="bot">Bot</span> focuses on private,
              off-market deal flow.
            </p>
          </details>

          <details>
            <summary>
              <span className="faq-question">
                Do listings need approval?
              </span>
            </summary>
            <p>Yes, listings are reviewed for quality and compliance.</p>
          </details>

          <details>
            <summary>
              <span className="faq-question">
                Is this an MLS replacement?
              </span>
            </summary>
            <p>
              No. <span className="flip">Flip</span>
              <span className="bot">Bot</span> complements private
              investment sourcing.
            </p>
          </details>
        </section>

      </div>
    </main>
  );
};

export default ProviderDashboard;
