import React from "react";
import "./WorstCaseCard.css";

const money = (v) =>
  v === null || v === undefined ? "-" : `$${Number(v).toLocaleString()}`;

const pct = (v) =>
  v === null || v === undefined ? "-" : `${Number(v).toFixed(1)}%`;

const WorstCaseScenarioCard = ({ data }) => {
  if (!data) return null;

  const {
    assumptions,
    base_case,
    worst_case,
    damage_breakdown,
    verdict,
    warning,
  } = data;

  return (
    <div className="worst-case-card">
      <h3>Worst-Case Scenario Analysis</h3>

      {/* ================= ASSUMPTIONS ================= */}
      <section className="assumptions">
        <h4>Stress Assumptions</h4>
        <ul>
          <li>ARV: {assumptions.arv_change}</li>
          <li>Rehab: {assumptions.rehab_change}</li>
          <li>Hold Extension: {assumptions.hold_extension_months} months</li>
        </ul>
      </section>

      {/* ================= BASE CASE ================= */}
      <section>
        <h4>Base Case</h4>
        <div className="row">
          <span>Gross Profit</span>
          <strong
            className={
              base_case.gross_profit >= 0
                ? "value-positive"
                : "value-negative"
            }
          >
            {money(base_case.gross_profit)}
          </strong>
        </div>
        <div className="row">
          <span>ROI</span>
          <strong
            className={
              base_case.roi_percent >= 0
                ? "value-positive"
                : "value-negative"
            }
          >
            {pct(base_case.roi_percent)}
          </strong>
        </div>
      </section>

      {/* ================= WORST CASE ================= */}
      <section className="danger">
        <h4>Worst Case</h4>
        <div className="row">
          <span>Gross Profit</span>
          <strong
            className={
              worst_case.gross_profit >= 0
                ? "value-positive"
                : "value-negative"
            }
          >
            {money(worst_case.gross_profit)}
          </strong>
        </div>
        <div className="row">
          <span>ROI</span>
          <strong
            className={
              worst_case.roi_percent >= 0
                ? "value-positive"
                : "value-negative"
            }
          >
            {pct(worst_case.roi_percent)}
          </strong>
        </div>
      </section>

      {/* ================= DAMAGE BREAKDOWN ================= */}
      <section className="damage">
        <h4>Profit Erosion</h4>

        <div className="row">
          <span>ARV Hit</span>
          <strong className="value-negative">
            {money(damage_breakdown.arv_hit)}
          </strong>
        </div>

        <div className="row">
          <span>Rehab Overrun</span>
          <strong className="value-negative">
            {money(damage_breakdown.rehab_overrun)}
          </strong>
        </div>

        <div className="row">
          <span>Hold Extension Cost</span>
          <strong className="value-negative">
            {money(damage_breakdown.hold_extension_cost)}
          </strong>
        </div>

        <div className="row total">
          <span>Total Profit Erosion</span>
          <strong className="value-negative">
            {money(damage_breakdown.total_profit_erosion)}
          </strong>
        </div>
      </section>

      {/* ================= VERDICT ================= */}
      <div
        className={`verdict ${verdict.rating
          .toLowerCase()
          .replace(" ", "-")}`}
      >
        <strong>{verdict.rating}</strong>
        <p>{verdict.message}</p>
      </div>

      {/* ================= WARNING ================= */}
      {warning && <div className="warning">⚠️ {warning}</div>}
    </div>
  );
};

export default WorstCaseScenarioCard;
