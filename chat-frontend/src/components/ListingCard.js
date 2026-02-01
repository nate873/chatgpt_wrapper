import React from "react";
import "./ListingCard.css";

const ListingCard = ({ listing }) => {
  return (
    <div className="listing-card">
      {/* IMAGE PLACEHOLDER */}
      <div className="listing-image">
        <span>Property</span>
      </div>

      {/* CONTENT */}
      <div className="listing-body">
        <h3 className="listing-title">
          {listing.title?.trim() || "Untitled Property"}
        </h3>

        <p className="listing-location">
          {listing.city}, {listing.state}
        </p>

        {listing.price && (
          <div className="listing-price">
            ${Number(listing.price).toLocaleString()}
          </div>
        )}

        <div className="listing-stats">
          {listing.beds && (
            <span>
              <strong>{listing.beds}</strong> Beds
            </span>
          )}
          {listing.baths && (
            <span>
              <strong>{listing.baths}</strong> Baths
            </span>
          )}
          {listing.sqft && (
            <span>
              <strong>{Number(listing.sqft).toLocaleString()}</strong> Sqft
            </span>
          )}
        </div>

        <button className="analyze-btn">
          Analyze Deal →
        </button>
      </div>
    </div>
  );
};

export default ListingCard;
