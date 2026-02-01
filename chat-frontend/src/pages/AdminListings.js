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
      .eq("deal_status", "pending_review")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading admin listings:", error);
      setListings([]);
    } else {
      setListings(data || []);
    }

    setLoading(false);
  };

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

  return (
    <main className="about-page">
      <div className="about-container provider-dashboard">

        <section className="flipbot-hero">
          <h1>
            Listing <span className="accent">Approvals</span>
          </h1>
          <p className="about-subtitle">
            Review and approve off-market listings submitted by providers.
          </p>
        </section>

        {loading && <p>Loading listings…</p>}

        {!loading && listings.length === 0 && (
          <p className="about-subtitle">
            No listings awaiting review 🎉
          </p>
        )}

        <div className="dashboard-list">
          {listings.map((listing) => (
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
                  onClick={() => rejectListing(listing.id)}
                  disabled={processingId === listing.id}
                  style={{ color: "#ef4444" }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
};

export default AdminListings;
