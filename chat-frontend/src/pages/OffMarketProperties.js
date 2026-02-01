import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ListingCard from "../components/ListingCard";
import "./OffMarketProperties.css";

const OffMarketProperties = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("off_market_listings")
        .select(`
          id,
          title,
          street,
          city,
          state,
          property_type,
          price,
          arv,
          beds,
          baths,
          sqft,
          description,
          photos,
          created_at
        `)
        .eq("is_published", true)
        .eq("deal_status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading off-market listings:", error);
        setListings([]);
      } else {
        setListings(data || []);
      }

      setLoading(false);
    };

    fetchListings();
  }, []);

  return (
    <div className="offmarket-content">
      <div className="offmarket-shell">

        {/* ================= INTRO ================= */}
        <section className="offmarket-intro">
          <h1>Off-Market Properties</h1>
          <p>
            Curated off-market real estate opportunities from verified providers.
            Analyze deals instantly with AI-powered underwriting.
          </p>
        </section>

        {/* ================= LISTINGS ================= */}
        <section className="offmarket-grid">
          {loading && (
            <p className="loading">Loading listings…</p>
          )}

          {!loading && listings.length === 0 && (
            <p className="empty">
              No off-market properties available yet.
            </p>
          )}

          {!loading &&
            listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
              />
            ))}
        </section>

      </div>
    </div>
  );
};

export default OffMarketProperties;
