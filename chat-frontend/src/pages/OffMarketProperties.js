import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./OffMarketProperties.css";

const OffMarketProperties = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from("off_market_listings")
        .select(`
          id,
          title,
          property_type,
          city,
          state,
          price,
          arv,
          description,
          created_at
        `)
        .eq("is_published", true)
        .eq("deal_status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading off-market listings:", error);
      } else {
        setListings(data || []);
      }

      setLoading(false);
    };

    fetchListings();
  }, []);

  return (
    <div className="offmarket-content">
      {/* INTRO */}
      <section className="offmarket-intro">
        <h1>Off-Market Properties</h1>
        <p>
          Curated off-market real estate opportunities from verified providers.
          Analyze deals instantly with AI-powered underwriting.
        </p>
      </section>

      {/* LISTINGS */}
      <section className="offmarket-grid">
        {loading && <p className="loading">Loading listings…</p>}

        {!loading && listings.length === 0 && (
          <p className="empty">
            No off-market properties available yet.
          </p>
        )}

        {listings.map((listing) => (
          <div key={listing.id} className="offmarket-card">
            <div className="card-header">
              <h3>{listing.title}</h3>
              <span className="badge">{listing.property_type}</span>
            </div>

            <div className="card-location">
              {listing.city}, {listing.state}
            </div>

            <div className="card-metrics">
              {listing.price && (
                <div>
                  <span>Price</span>
                  <strong>${Number(listing.price).toLocaleString()}</strong>
                </div>
              )}

              {listing.arv && (
                <div>
                  <span>ARV</span>
                  <strong>${Number(listing.arv).toLocaleString()}</strong>
                </div>
              )}
            </div>

            <p className="card-description">
              {listing.description?.slice(0, 120)}…
            </p>

            <button className="analyze-btn">
              Analyze Deal →
            </button>
          </div>
        ))}
      </section>
    </div>
  );
};

export default OffMarketProperties;