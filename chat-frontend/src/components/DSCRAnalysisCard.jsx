import React from "react";
import "./DSCRAnalysisCard.css";

const DSCRAnalysisCard = ({ analysis }) => {
  // 🛑 HARD SAFETY GUARD
  if (!analysis || typeof analysis !== "object") {
    return <p>Analyzing DSCR…</p>;
  }

  // =========================
  // Normalize backend fields
  // =========================
  const dscr =
    analysis.dscr ??
    analysis.DSCR ??
    analysis.dscr_ratio ??
    null;

  const noi =
    analysis.estimated_noi ??
    analysis.noi ??
    null;

  const monthlyDebt =
    analysis.monthly_debt_service ??
    analysis.monthlyDebt ??
    null;

  const maxLoan =
    analysis.max_dscr_loan ??
    analysis.maxLoan ??
    null;

  const existingLoan =
    analysis.existing_loan_payoff ??
    null;

  const cashOut =
    analysis.cash_out ??
    null;

  const shortToClose =
    analysis.short_to_close ??
    null;

  const overleveraged =
    analysis.overleveraged === true;

  // =========================
  // Verdict logic
  // =========================
  const verdict =
    typeof dscr === "number"
      ? dscr >= 1.25
        ? "Strong"
        : dscr >= 1.1
        ? "Borderline"
        : "Weak"
      : "Pending";

  const verdictClass =
    verdict === "Strong"
      ? "value-positive"
      : verdict === "Borderline"
      ? "value-warning"
      : "value-negative";

  const dscrClass =
    typeof dscr !== "number"
      ? "value-warning"
      : dscr >= 1.25
      ? "value-positive"
      : dscr >= 1.1
      ? "value-warning"
      : "value-negative";

  // =========================
  // Render
  // =========================
  return (
    <div className="deal-analysis-card dscr-analysis-card">
      <h4>DSCR Refinance Analysis</h4>

      <ul>
        <li>
          DSCR:
          <span className={dscrClass}>
            {typeof dscr === "number" ? dscr.toFixed(2) : "—"}
          </span>
        </li>

        <li>
          Monthly NOI:
          <span className="value-positive">
            ${typeof noi === "number" ? noi.toLocaleString() : "—"}
          </span>
        </li>

        <li>
          Monthly Debt Service:
          <span className="value-negative">
            ${typeof monthlyDebt === "number"
              ? monthlyDebt.toLocaleString()
              : "—"}
          </span>
        </li>

        <li>
          Max DSCR Loan (75% ARV):
          <span className="value-warning">
            ${typeof maxLoan === "number"
              ? maxLoan.toLocaleString()
              : "—"}
          </span>
        </li>

        {typeof existingLoan === "number" && (
          <li>
            Existing Loan Payoff:
            <span className="value-negative">
              ${existingLoan.toLocaleString()}
            </span>
          </li>
        )}

        {typeof cashOut === "number" && cashOut > 0 && (
          <li>
            Cash Out:
            <span className="value-positive">
              ${cashOut.toLocaleString()}
            </span>
          </li>
        )}

        {typeof shortToClose === "number" && shortToClose > 0 && (
          <li>
            Short to Close:
            <span className="value-negative">
              ${shortToClose.toLocaleString()}
            </span>
          </li>
        )}
      </ul>

      <h4>Verdict</h4>
      <strong className={verdictClass}>{verdict}</strong>

      <p>
        {overleveraged &&
          "❌ Refinance is overleveraged. New DSCR loan does not cover existing payoff and closing costs."}

        {!overleveraged && verdict === "Strong" &&
          "DSCR comfortably exceeds most lender requirements and supports this refinance."}

        {!overleveraged && verdict === "Borderline" &&
          "DSCR may qualify with select lenders depending on rate and leverage."}

        {!overleveraged && verdict === "Weak" &&
          "DSCR below typical lender minimums. Rent or leverage may need adjustment."}
      </p>
    </div>
  );
};

export default DSCRAnalysisCard;
