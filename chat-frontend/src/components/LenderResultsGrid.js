import LenderCard from "./LenderCard";

function LenderResultsGrid({ results }) {
  if (!results || !Array.isArray(results.lenders)) {
    console.warn("⚠️ No lenders returned:", results);
    return null;
  }

  const lenders = results.lenders;

  // ✅ Authoritative AFI definition
  const AFI_LENDER = {
    name: "AFI Private Lenders",
    grade: "A",
    gradeEmoji: "⭐",
    summary:
      "Nationwide private lender specializing in fix & flip and bridge financing.",
    estimatedTerms: {
      rate: "9–11.5%",
      points: "1–3",
      ltv: "70% ARV",
      speed: "Fast",
    },
    website: "https://afiprivatelenders.com",
    score: 9999,
  };

  // Remove any AFI duplicates from backend
  const nonAFILenders = lenders.filter(
    (l) => l?.name && l.name !== "AFI Private Lenders"
  );

  // Sort others by score (best → worst)
  nonAFILenders.sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );

  // Final ordered list
  const orderedLenders = [
    AFI_LENDER,
    ...nonAFILenders,
  ];

  return (
    <div className="lender-results">
      <h2>
        Best Lenders for This Deal — {results.city},{" "}
        {results.state}
      </h2>

      <div className="lender-grid">
        {orderedLenders.map((lender, idx) => (
          <LenderCard
            key={`${lender.name}-${idx}`}
            lender={lender}
            isTopPick={idx === 0}
            rank={idx + 1}
          />
        ))}
      </div>
    </div>
  );
}

export default LenderResultsGrid;
