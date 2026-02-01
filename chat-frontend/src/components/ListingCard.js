import React from "react";
import { useNavigate } from "react-router-dom";
import "./ListingCard.css";

const ListingCard = ({ listing }) => {
  const navigate = useNavigate();

  return (
    <div
      className="listing-card"
      onClick={() => navigate(`/off-market/${listing.id}`)}
      style={{ cursor: "pointer" }}
    >
      {/* IMAGE */}
      <div className="listing-image">

        {/* PROPERTY TYPE BADGE */}
        {listing.property_type && (
          <div className="property-type-badge">
            {listing.property_type}
          </div>
        )}

        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.street} />
        ) : (
          <span>Property</span>
        )}
      </div>

      {/* CONTENT */}
      <div className="listing-body">
        <h3 className="listing-title">
          {listing.street || "Off-Market Property"}
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
          {listing.beds && <span><strong>{listing.beds}</strong> Beds</span>}
          {listing.baths && <span><strong>{listing.baths}</strong> Baths</span>}
          {listing.sqft && (
            <span>
              <strong>{Number(listing.sqft).toLocaleString()}</strong> Sqft
            </span>
          )}
        </div>

        {/* Stop click so button doesn't trigger card navigation */}
        <button
          className="analyze-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/off-market/${listing.id}`);
          }}
        >
          Analyze Deal →
        </button>
      </div>
    </div>
  );
};

export default ListingCard;
