function LenderInsightCard({ insight }) {
  if (!insight) return null; // 🛑 safety guard

  return (
    <div className="card lender-insight">
      <h3>{insight.title}</h3>
      <p>{insight.summary}</p>

      <div className="section">
        <strong>Expected Terms</strong>
        <ul>
          <li>Leverage: {insight.expected_terms.leverage}</li>
          <li>Rate: {insight.expected_terms.rate_range}</li>
          <li>Points: {insight.expected_terms.points_range}</li>
          <li>Term: {insight.expected_terms.term}</li>
        </ul>
      </div>

      <div className="section">
        <strong>Underwriting Focus</strong>
        <ul>
          {insight.underwriting_focus.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="actions">
        {insight.cta.map((action, i) => (
          <button key={i}>{action}</button>
        ))}
      </div>
    </div>
  );
}

export default LenderInsightCard;
