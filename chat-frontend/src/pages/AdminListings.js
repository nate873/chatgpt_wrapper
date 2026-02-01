import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./ProviderDashboard.css";
import "./About.css";

const AdminListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    const loadListings = async () => {
      const { data, error } = await supabase
        .from("off_market_listings")
        .select("*")
        .eq("deal_status", "pending_review")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading listings:", error);
      }

      setListings(data || []);
      setLoading(false);
    };

    loadListings();
  }, []);

  const approveListing = async (id) => {
    setActingId(id);

    const { error } = await supabase
      .from("off_market_listings")
      .update({
        deal_status: "active",
        is_published: true
      })
      .eq("id", id);

    if (error) {
      alert("Error approving listing");
      console.error(error);
      setActingId(null);
      return;
    }

    setListings((prev) => prev.filter((l) => l.id !== id));
    setActingId(null);
  };

  const rejectListing = async (id) => {
    if (!window.confirm("Reject this listing?")) return;

    setActingId(id);

    const { error } = await supabase
      .from("off_market_listings")
      .update({
        deal_status: "rejected",
        is_published: false
      })
      .eq("id", id);

    if (error) {
      alert("Error rejecting listing");
      console.error(error);
      setActingId(null);
      return;
    }

    setListings((prev) => prev.filter((l) => l.id !== id));
    setActingId(null);
  };

  if (loading) {
    return (
      <main className="about-page">
        <div className="about-container provider-dashboard">
          <p>Loading pending listings…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="about-page">
      <div className="about-container provider-dashboard">

        <h1 className="about-title">
          Listing <span className="accent">Approvals</span>
        </h1>

        <p className="about-subtitle">
          Review and approve off-market listings submitted by providers.
        </p>

        {listings.length === 0 && (
          <p className="about-subtitle">
            No listings pending review 🎉
          </p>
        )}

        <div className="dashboard-list">
          {listings.map((listing) => (
            <div key={listing.id} className="dashboard-card">

              <div>
                <h3>{listing.title || "Untitled Listing"}</h3>
                <p>
                  {listing.city}, {listing.state}
                </p>
                <p className="muted">
                  {listing.deal_type} • {listing.seller_motivation}
                </p>
              </div>

              <div className="status">
                <span className="badge pending">
                  Pending Review
                </span>
              </div>

              <div className="actions">
                <button
                  disabled={actingId === listing.id}
                  onClick={() => approveListing(listing.id)}
                >
                  {actingId === listing.id ? "Approving…" : "Approve"}
                </button>

                <button
                  disabled={actingId === listing.id}
                  onClick={() => rejectListing(listing.id)}
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
