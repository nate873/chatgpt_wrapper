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
          street,
          city,
          state,
          property_type,
          price,
          beds,
          baths,
          sqft,
          created_at
        `)
        .eq("is_published", true)
        .eq("deal_status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setListings([]);
        setLoading(false);
        return;
      }

      const listingsWithImages = await Promise.all(
        (data || []).map(async (listing) => {
          const { data: files } = await supabase.storage
            .from("listing-photos")
            .list(listing.id, { limit: 1 });

          if (files && files.length > 0) {
            const { data: image } = supabase.storage
              .from("listing-photos")
              .getPublicUrl(`${listing.id}/${files[0].name}`);

            return { ...listing, imageUrl: image.publicUrl };
          }

          return listing;
        })
      );

      setListings(listingsWithImages);
      setLoading(false);
    };

    fetchListings();
  }, []);

  return (
    <div className="offmarket-page">
      <div className="offmarket-shell">
        {/* INTRO */}
        <section className="offmarket-intro">
          <h1>Off-Market Properties</h1>
          <p>
            Curated off-market real estate opportunities from verified providers.
            Analyze deals instantly with AI-powered underwriting.
          </p>
        </section>

        {/* GRID */}
        <section className="offmarket-grid">
          {loading && <p className="loading">Loading listings…</p>}

          {!loading && listings.length === 0 && (
            <p className="empty">No off-market properties available yet.</p>
          )}

          {!loading &&
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
        </section>

        {/* ================= CTA ================= */}
        <section className="offmarket-cta">
          <h2>Sign Up to View More Properties</h2>

          <ul className="cta-features">
            <li>Find off-market fix & flips and buy-and-holds</li>
            <li>Search by city, ZIP code, or exact address</li>
            <li>Access single-family & multifamily deals</li>
            <li>Save deals and get alerts so you can move fast</li>
          </ul>

          <a href="/pricing-plans" className="cta-button">
            Sign Up
          </a>
        </section>
      </div>
    </div>
  );
};

export default OffMarketProperties;
