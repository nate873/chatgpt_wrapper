import React from "react";

function StressTestCard({ data }) {
  const { scenarios, extra_interest_2mo } = data;

  return (
    <div className="analysis-card">
      <h3>Stress Test Analysis</h3>

      <table className="stress-table">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Gross Profit</th>
            <th>ROI</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s, idx) => (
            <tr key={idx}>
              <td>{s.name}</td>
              <td>${Number(s.gross_profit).toLocaleString()}</td>
              <td>{s.roi_percent?.toFixed(1)}%</td>
              <td>
                <span className={`verdict ${s.verdict.toLowerCase().replace(" ", "-")}`}>
                  {s.verdict}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: "0.75rem", color: "#9ca3af" }}>
        ⏱ Additional 2-month hold adds approx. ${extra_interest_2mo.toLocaleString()} in interest.
      </p>
    </div>
  );
}

export default StressTestCard;
