import React from "react";
import "./CashToCloseCard.css";

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "-";
  return `$${Number(value).toLocaleString()}`;
};

const Section = ({ title, items }) => (
  <div className="ctc-section">
    <h4>{title}</h4>

    {Object.entries(items).map(([key, value]) => {
      if (key === "subtotal" || key === "cap_applied") return null;

      return (
        <div key={key} className="ctc-row">
          <span className="ctc-label">
            {key.replace(/_/g, " ")}
          </span>
          <span className="ctc-value value-negative">
            {typeof value === "number" ? formatCurrency(value) : value}
          </span>
        </div>
      );
    })}

    {items.subtotal !== undefined && (
      <div className="ctc-row ctc-subtotal">
        <span>Subtotal</span>
        <span className="value-negative">
          {formatCurrency(items.subtotal)}
        </span>
      </div>
    )}
  </div>
);

const CashToCloseCard = ({ data }) => {
  if (!data) return null;

  const {
    loan_amount,
    categories,
    total_out_of_pocket,
    excludes,
  } = data;

  return (
    <div className="card cash-to-close-card">
      <h3>💵 Cash to Close (Out-of-Pocket)</h3>

      <div className="ctc-loan">
        Loan Amount:{" "}
        <strong className="value-negative">
          {formatCurrency(loan_amount)}
        </strong>
      </div>

      <Section
        title="📄 Fixed Admin Fees"
        items={categories.fixed_admin}
      />

      <Section
        title="🏦 Escrow & Title Admin"
        items={categories.escrow_and_title_admin}
      />

      <div className="ctc-section">
        <h4>🛡️ Title Insurance</h4>
        <div className="ctc-row">
          <span>{categories.title_insurance.rate_basis}</span>
          <span className="value-negative">
            {formatCurrency(categories.title_insurance.amount)}
          </span>
        </div>
      </div>

      <div className="ctc-section">
        <h4>📑 Recording Fees</h4>
        <div className="ctc-row">
          <span>Estimated</span>
          <span className="value-negative">
            {formatCurrency(categories.recording_fees.estimated)}
          </span>
        </div>
      </div>

      <div className="ctc-total">
        <span>Total Cash to Close</span>
        <span className="value-negative">
          {formatCurrency(total_out_of_pocket)}
        </span>
      </div>

      {excludes?.length > 0 && (
        <div className="ctc-excludes">
          <strong>Excludes:</strong>
          <ul>
            {excludes.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CashToCloseCard;
