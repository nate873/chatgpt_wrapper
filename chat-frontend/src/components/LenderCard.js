function LenderCard({ lender, isTopPick, rank }) {
  const isAFI = lender.name === "AFI Private Lenders";

  return (
    <div className={`lender-card deal-card ${isAFI ? "top-pick" : ""}`}>
      
      {/* ================= Header ================= */}
      <div className="lender-header">
        <div>
          <h3>{lender.name}</h3>

          {!isAFI && rank && (
            <div className="lender-rank">
              Ranked #{rank}
            </div>
          )}
        </div>

        {/* Grade / Preferred */}
        {isAFI ? (
          <span className="lender-grade grade-A">
            ⭐ Preferred
          </span>
        ) : (
          <span className={`lender-grade grade-${lender.grade}`}>
            {lender.gradeEmoji} {lender.grade}
          </span>
        )}
      </div>

      {/* ================= Summary ================= */}
      <p className="lender-summary">
        {lender.summary}
      </p>

      {/* ================= Deal Terms ================= */}
      <div className="lender-rows">
        <div className="deal-row-pill">
          <span className="deal-label">Rate</span>
          <span className="value-warning">
            {lender.estimatedTerms.rate}
          </span>
        </div>

        <div className="deal-row-pill">
          <span className="deal-label">Points</span>
          <span className="value-neutral">
            {lender.estimatedTerms.points}
          </span>
        </div>

        <div className="deal-row-pill">
          <span className="deal-label">Max LTV</span>
          <span className="value-positive">
            {lender.estimatedTerms.ltv}
          </span>
        </div>

        <div className="deal-row-pill">
          <span className="deal-label">Close Speed</span>
          <span
            className={
              lender.estimatedTerms.speed === "Fast"
                ? "value-positive"
                : lender.estimatedTerms.speed === "Slow"
                ? "value-negative"
                : "value-neutral"
            }
          >
            {lender.estimatedTerms.speed}
          </span>
        </div>
      </div>

      {/* ================= AFI Explanation ================= */}
      {isAFI && (
        <div className="lender-why">
          <strong>Why AFI is recommended</strong>
          <ul>
            <li>✔ Consistent nationwide execution</li>
            <li>✔ Competitive leverage for fix & flip deals</li>
            <li>✔ Reliable closing timelines</li>
          </ul>
        </div>
      )}

      {/* ================= CTA ================= */}
      <div className="lender-cta">
        <a
          href={lender.website}
          target="_blank"
          rel="noopener noreferrer"
          className="estimate-btn-inline"
        >
          View Lender →
        </a>
      </div>
    </div>
  );
}

export default LenderCard;
