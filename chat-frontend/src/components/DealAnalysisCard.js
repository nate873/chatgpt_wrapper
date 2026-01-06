import React from "react";

const DealAnalysisCard = ({ analysis }) => {
  // 🛑 SAFETY GUARD
  if (!analysis || !analysis.terms || !analysis.sale_and_profit) {
  return <p>Analyzing deal…</p>;
}


  const { terms, financing_costs, sale_and_profit, verdict } = analysis;

  

  const loanPayoff = sale_and_profit.loan_payoff || {};
  const cashAtClose = sale_and_profit.cash_at_close || {};

  return (
    <div className="deal-analysis-card">
      {/* ===================== */}
      {/* Estimated Terms */}
      {/* ===================== */}
      <h4>Estimated Terms</h4>
      <ul>
        <li>
          Interest Rate:{" "}
          <span className="value-warning">{terms.interest_rate}%</span>
        </li>
        <li>
          Points: <span className="value-warning">{terms.points}</span>
        </li>
        <li>
          LTV (ARV):{" "}
          <span className="value-warning">{terms.ltv_arv}%</span>
        </li>
        <li>
          Loan Amount:{" "}
          <span className="value-warning">
            ${terms.loan_amount?.toLocaleString()}
          </span>
        </li>
        <li>
          Loan Term:{" "}
          <span className="value-warning">
            {terms.loan_term_months}-month interest-only term
          </span>
        </li>
      </ul>

      {/* ===================== */}
      {/* Financing Costs */}
      {/* ===================== */}
      <h4>Financing Costs</h4>
      <ul>
        <li>
          Prepaid Interest:{" "}
          <span className="value-negative">
            ${financing_costs.prepaid_interest?.toLocaleString()}
          </span>
        </li>
        <li>
          Origination Fees:{" "}
          <span className="value-negative">
            ${financing_costs.origination_fees?.toLocaleString()}
          </span>
        </li>
        <li>
          Processing Fees:{" "}
          <span className="value-negative">
            ${financing_costs.processing_fees?.toLocaleString()}
          </span>
        </li>
        <li>
          Total Closing Costs:{" "}
          <span className="value-negative">
            ${financing_costs.total_closing_costs?.toLocaleString()}
          </span>
        </li>
      </ul>

      {/* ===================== */}
      {/* Sale, Payoff & Profit */}
      {/* ===================== */}
      <h4>Sale & Profit</h4>
      <ul>
        <li>
          Sale Price:{" "}
          <span className="value-positive">
            ${sale_and_profit.estimated_sale_price?.toLocaleString()}
          </span>
        </li>

        {/* Loan payoff section */}
        {loanPayoff.loan_principal_payoff_at_sale > 0 && (
          <li>
            Loan Payoff at Sale:{" "}
            <span className="value-negative">
              ${loanPayoff.loan_principal_payoff_at_sale?.toLocaleString()}
            </span>
          </li>
        )}

        {loanPayoff.existing_loan_payoff > 0 && (
          <li>
            Existing Loan Payoff:{" "}
            <span className="value-negative">
              ${loanPayoff.existing_loan_payoff?.toLocaleString()}
            </span>
          </li>
        )}

        {/* Cash movement */}
        {cashAtClose.cash_from_borrower > 0 && (
          <li>
            Cash Required to Close:{" "}
            <span className="value-negative">
              ${cashAtClose.cash_from_borrower?.toLocaleString()}
            </span>
          </li>
        )}

        {cashAtClose.cash_to_borrower > 0 && (
          <li>
            Cash to Borrower:{" "}
            <span className="value-positive">
              ${cashAtClose.cash_to_borrower?.toLocaleString()}
            </span>
          </li>
        )}

        <li>
          Total Project Cost:{" "}
          <span className="value-negative">
            ${sale_and_profit.total_project_cost?.toLocaleString()}
          </span>
        </li>

        <li>
          Gross Profit:{" "}
          <span
            className={
              sale_and_profit.gross_profit >= 0
                ? "value-positive"
                : "value-negative"
            }
          >
            ${sale_and_profit.gross_profit?.toLocaleString()}
          </span>
        </li>

        <li>
          ROI:{" "}
          <span
            className={
              sale_and_profit.roi_percent >= 25
                ? "value-positive"
                : sale_and_profit.roi_percent >= 10
                ? "value-warning"
                : "value-negative"
            }
          >
            {sale_and_profit.roi_percent}%
          </span>
        </li>
      </ul>

      {/* ===================== */}
      {/* Verdict */}
      {/* ===================== */}
      <h4>Verdict</h4>
      <strong
        className={
          verdict.rating === "Strong Deal"
            ? "value-positive"
            : verdict.rating === "Borderline Deal"
            ? "value-warning"
            : "value-negative"
        }
      >
        {verdict.rating}
      </strong>

      <p>{verdict.summary}</p>

      {/* ===================== */}
      {/* Follow Ups */}
      {/* ===================== */}
      {analysis.follow_up_questions?.length > 0 && (
        <>
          <h4>What would you like to do next?</h4>
          <ul>
            {analysis.follow_up_questions.map((q, i) => (
              <li key={i} className="follow-up-option">
                {q}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default DealAnalysisCard;
