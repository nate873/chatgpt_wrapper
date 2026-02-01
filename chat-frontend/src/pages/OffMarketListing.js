// src/pages/OffMarketListing.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./OffMarketListing.css";
import "./About.css";

const OffMarketListing = () => {
  const { id } = useParams();

  const [listing, setListing] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("off_market_listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error loading listing:", error);
        setLoading(false);
        return;
      }

      setListing(data);

      const { data: files } = await supabase.storage
        .from("listing-photos")
        .list(id);

      if (files?.length) {
        const urls = files.map(
          (file) =>
            supabase.storage
              .from("listing-photos")
              .getPublicUrl(`${id}/${file.name}`).data.publicUrl
        );
        setImages(urls);
      }

      setLoading(false);
    };

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <main className="about-page">
        <div className="about-container">
          <p>Loading listing…</p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="about-page">
        <div className="about-container">
          <p>Listing not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="about-page">
      <div className="about-container offmarket-detail">

        {/* ================= GALLERY ================= */}
        <section className="listing-gallery">
          {images.length ? (
            <>
              <img src={images[0]} alt="Property" />
              {images.length > 1 && (
                <div className="listing-gallery-thumbs">
                  {images.slice(1).map((src, i) => (
                    <img key={i} src={src} alt="Property thumbnail" />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="gallery-placeholder">No photos available</div>
          )}
        </section>

        {/* ================= HEADER ================= */}
        <section className="listing-header">
          <h1>{listing.street || "Off-Market Property"}</h1>
          <p className="muted">
            {listing.city}, {listing.state}
          </p>

          {listing.property_type && (
            <span className="property-type-pill">
              {listing.property_type}
            </span>
          )}
        </section>

        {/* ================= METRICS ================= */}
        <section className="listing-metrics">
          {listing.price && (
            <div>
              <span>Asking Price</span>
              <strong>${Number(listing.price).toLocaleString()}</strong>
            </div>
          )}

          {listing.arv && (
            <div>
              <span>Estimated ARV</span>
              <strong>${Number(listing.arv).toLocaleString()}</strong>
            </div>
          )}

          {listing.beds && (
            <div>
              <span>Beds</span>
              <strong>{listing.beds}</strong>
            </div>
          )}

          {listing.baths && (
            <div>
              <span>Baths</span>
              <strong>{listing.baths}</strong>
            </div>
          )}

          {listing.sqft && (
            <div>
              <span>Sqft</span>
              <strong>{Number(listing.sqft).toLocaleString()}</strong>
            </div>
          )}
        </section>

        {/* ================= DESCRIPTION ================= */}
        {listing.description && (
          <section className="listing-description">
            <h3>Property Notes</h3>
            <p>{listing.description}</p>
          </section>
        )}

        {/* ================= CONTACT ================= */}
        <section className="listing-contact">
          <h3>Contact Provider</h3>

          {listing.contact_name && (
            <p className="contact-name">{listing.contact_name}</p>
          )}

          {listing.contact_phone && (
            <p>
              <strong>Phone:</strong>{" "}
              <a href={`tel:${listing.contact_phone}`}>
                {listing.contact_phone}
              </a>
            </p>
          )}

          {listing.contact_email && (
            <p>
              <strong>Email:</strong>{" "}
              <a href={`mailto:${listing.contact_email}`}>
                {listing.contact_email}
              </a>
            </p>
          )}
        </section>

      </div>
    </main>
  );
};

export default OffMarketListing;
