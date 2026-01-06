import React from "react";
import "./CityOpportunityCard.css";

const CityOpportunityCard = ({ data }) => {
  if (!data) return null;

  const {
    city,
    state,
    overall_rating,
    strategy_fit,
    market_characteristics,
    key_risks,
    what_works_here,
    what_to_avoid,
    bottom_line,
  } = data;

  const ratingClass =
    overall_rating === "Strong"
      ? "good"
      : overall_rating === "Neutral"
      ? "warn"
      : "bad";

  return (
    <div className="city-opportunity-card">
      {/* ================= HEADER ================= */}
      <div className="card-header">
        <h3>
          Market Opportunity — {city}
          {state ? `, ${state}` : ""}
        </h3>
        <span className={`market-rating ${ratingClass}`}>
          {overall_rating}
        </span>
      </div>

      {/* ================= STRATEGY FIT ================= */}
      <section className="strategy-fit">
        <h4>Strategy Fit</h4>
        <div className="fit-grid">
          <Fit label="Fix & Flip" value={strategy_fit.fix_and_flip} />
          <Fit label="Buy & Hold" value={strategy_fit.buy_and_hold} />
        </div>
      </section>

      {/* ================= MARKET CHARACTERISTICS ================= */}
      <ListSection
        title="Market Characteristics"
        items={market_characteristics}
      />

      {/* ================= WHAT WORKS ================= */}
      <ListSection
        title="What Works Here"
        items={what_works_here}
        positive
      />

      {/* ================= RISKS ================= */}
      <ListSection
        title="Key Risks"
        items={key_risks}
        danger
      />

      {/* ================= WHAT TO AVOID ================= */}
      <ListSection
        title="What to Avoid"
        items={what_to_avoid}
        danger
      />

      {/* ================= BOTTOM LINE ================= */}
      <div className={`bottom-line ${ratingClass}`}>
        <strong>Bottom Line</strong>
        <p>{bottom_line}</p>
      </div>
    </div>
  );
};

export default CityOpportunityCard;

/* ===================== helpers ===================== */

const Fit = ({ label, value }) => {
  const cls =
    value === "Strong"
      ? "good"
      : value === "Moderate"
      ? "warn"
      : "bad";

  return (
    <div className={`fit-pill ${cls}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
};

const ListSection = ({ title, items = [], positive, danger }) => (
  <section
    className={`list-section ${
      positive ? "positive" : danger ? "danger" : ""
    }`}
  >
    <h4>{title}</h4>
    <ul>
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  </section>
);
