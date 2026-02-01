// src/pages/AdminListings.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./ProviderDashboard.css";
import "./About.css";

const AdminListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("off_market_listings")
      .select(`
        id,
        title,
        city,
        state,
        deal_type,
        seller_motivation,
        deal_status,
        is_published,
        created_at
      `)
      .in("deal_status", ["pending_review", "active"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading admin listings:", error);
      setListings([]);
    } else {
      setListings(data || []);
    }

    setLoading(false);
  };

  /* ================= ACTIONS ================= */

  const approveListing = async (id) => {
    setProcessingId(id);

    const { error } = await supabase
      .from("off_market_listings")
      .update({
        deal_status: "active",
        is_published: true
      })
      .eq("id", id);

    if (error) {
      alert("Failed to approve listing");
      console.error(error);
    } else {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }

    setProcessingId(null);
  };

  const rejectListing = async (id) => {
    setProcessingId(id);

    const { error } = await supabase
      .from("off_market_listings")
      .update({
        deal_status: "rejected",
        is_published: false
      })
      .eq("id", id);

    if (error) {
      alert("Failed to reject listing");
      console.error(error);
    } else {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }

    setProcessingId(null);
  };

  const removeListing = async (id) => {
    setProcessingId(id);

    const { error } = await supabase
      .from("off_market_listings")
      .update({
        deal_status: "inactive",
        is_published: false
      })
      .eq("id", id);

    if (error) {
      alert("Failed to remove listing");
      console.error(error);
    } else {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }

    setProcessingId(null);
  };

  /* ================= GROUP LISTINGS ================= */

  const pendingListings = listings.filter(
    (l) => l.deal_status === "pending_review"
  );

  const activeListings = listings.filter(
    (l) => l.deal_status === "active"
  );

  return (
    <main className="about-page">
      <div className="about-container provider-dashboard">

        <section className="flipbot-hero">
          <h1>
            Listing <span className="accent">Approvals</span>
          </h1>
          <p className="about-subtitle">
            Review, approve, or remove off-market listings.
          </p>
        </section>

        {loading && <p>Loading listings…</p>}

        {!loading && pendingListings.length === 0 && activeListings.length === 0 && (
          <p className="about-subtitle">
            No listings found.
          </p>
        )}

        {/* ================= PENDING REVIEW ================= */}
        {pendingListings.length > 0 && (
          <>
            <h2 style={{ marginTop: 40 }}>Pending Review</h2>

            <div className="dashboard-list">
              {pendingListings.map((listing) => (
                <div key={listing.id} className="dashboard-card">
                  <div>
                    <h3>{listing.title || "Untitled Listing"}</h3>
                    <p>
                      {listing.city}
                      {listing.state ? `, ${listing.state}` : ""}
                    </p>
                    <p className="muted">
                      {listing.deal_type}
                      {listing.seller_motivation
                        ? ` • ${listing.seller_motivation}`
                        : ""}
                    </p>
                  </div>

                  <div className="actions">
                    <button
                      className="btn-primary"
                      disabled={processingId === listing.id}
                      onClick={() => approveListing(listing.id)}
                    >
                      {processingId === listing.id ? "Approving…" : "Approve"}
                    </button>

                    <button
                      disabled={processingId === listing.id}
                      onClick={() => rejectListing(listing.id)}
                      style={{ color: "#ef4444" }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ================= ACTIVE LISTINGS ================= */}
        {activeListings.length > 0 && (
          <>
            <h2 style={{ marginTop: 60 }}>Active Listings</h2>

            <div className="dashboard-list">
              {activeListings.map((listing) => (
                <div key={listing.id} className="dashboard-card">
                  <div>
                    <h3>{listing.title || "Untitled Listing"}</h3>
                    <p>
                      {listing.city}
                      {listing.state ? `, ${listing.state}` : ""}
                    </p>
                    <p className="muted">
                      {listing.deal_type}
                      {listing.seller_motivation
                        ? ` • ${listing.seller_motivation}`
                        : ""}
                    </p>
                  </div>

                  <div className="actions">
                    <button
                      disabled={processingId === listing.id}
                      onClick={() => removeListing(listing.id)}
                      style={{ color: "#ef4444" }}
                    >
                      {processingId === listing.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </main>
  );
};

export default AdminListings;
