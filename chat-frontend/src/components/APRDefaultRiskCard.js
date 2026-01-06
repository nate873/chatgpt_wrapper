import React from "react";
import "./APRDefaultRiskCard.css";

const formatMoney = (val) =>
  val === null || val === undefined ? "-" : `$${Number(val).toLocaleString()}`;

const formatPercent = (val) =>
  val === null || val === undefined ? "-" : `${Number(val).toFixed(2)}%`;

const APRDefaultRiskCard = ({ data }) => {
  if (!data) return null;

  const {
    headline_apr,
    base_costs,
    extension_risk,
    default_risk,
    warning,
  } = data;

  return (
    <div className="apr-risk-card">
      <h3>APR & Default Risk Analysis</h3>

      {/* ================= HEADLINE ================= */}
      <div className="apr-risk-highlight">
        <span>Effective APR</span>
        <strong className="value-negative">
          {formatPercent(headline_apr)}
        </strong>
      </div>

      {/* ================= BASE COSTS ================= */}
      <section>
        <h4>Base Financing Costs</h4>
        <ul>
          <li>
            <span>Total Interest Paid</span>
            <strong className="value-negative">
              {formatMoney(base_costs?.interest_paid)}
            </strong>
          </li>
          <li>
            <span>Points Cost</span>
            <strong className="value-negative">
              {formatMoney(base_costs?.points_cost)}
            </strong>
          </li>
          <li className="total">
            <span>Total Financing Cost</span>
            <strong className="value-negative">
              {formatMoney(base_costs?.total_financing_cost)}
            </strong>
          </li>
        </ul>
      </section>

      {/* ================= EXTENSION RISK ================= */}
      <section>
        <h4>Extension Risk</h4>
        <ul>
          <li>
            <span>Monthly Interest Burn</span>
            <strong className="value-negative">
              {formatMoney(extension_risk?.monthly_interest)}
            </strong>
          </li>
          <li>
            <span>3-Month Extension Cost</span>
            <strong className="value-negative">
              {formatMoney(extension_risk?.["3_month_extension"])}
            </strong>
          </li>
          <li>
            <span>6-Month Extension Cost</span>
            <strong className="value-negative">
              {formatMoney(extension_risk?.["6_month_extension"])}
            </strong>
          </li>
        </ul>
      </section>

      {/* ================= DEFAULT RISK ================= */}
      <section className="danger">
        <h4>Default Risk</h4>
        <ul>
          <li>
            <span>Default Interest Rate</span>
            <strong className="value-negative">
              {formatPercent(default_risk?.default_rate)}
            </strong>
          </li>
          <li>
            <span>Monthly Interest at Default</span>
            <strong className="value-negative">
              {formatMoney(default_risk?.monthly_interest_at_default)}
            </strong>
          </li>
          <li className="total">
            <span>90-Day Default Cost</span>
            <strong className="value-negative">
              {formatMoney(default_risk?.["90_day_default_cost"])}
            </strong>
          </li>
        </ul>
      </section>

      {/* ================= WARNING ================= */}
      {warning && (
        <div className="apr-risk-warning">
          ⚠️ {warning}
        </div>
      )}
    </div>
  );
};

export default APRDefaultRiskCard;
