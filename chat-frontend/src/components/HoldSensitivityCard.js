import React from "react";

const HoldSensitivityCard = ({ data }) => {
  if (!data) return null;

  return (
    <div className="analysis-card">
      <h3>⏱ Hold Time Sensitivity</h3>

      <p style={{ marginBottom: "0.75rem" }}>
        Monthly interest burn:{" "}
        <strong>${Number(data.monthly_burn).toLocaleString()}</strong>
      </p>

      <table className="analysis-table">
        <thead>
          <tr>
            <th>Hold Period</th>
            <th>Interest Cost</th>
            <th>Net Profit</th>
          </tr>
        </thead>

        <tbody>
          {data.scenarios.map((s, idx) => (
            <tr key={idx}>
              <td>{s.hold_months} months</td>

              {/* 🔴 Interest cost always red when present */}
              <td
                style={{
                  color: s.interest_cost > 0 ? "#d32f2f" : "inherit",
                  fontWeight: s.interest_cost > 0 ? 600 : "normal",
                }}
              >
                ${Number(s.interest_cost).toLocaleString()}
              </td>

              {/* 🟢 / 🔴 Net profit */}
              <td
                style={{
                  color: s.net_profit < 0 ? "#d32f2f" : "#22c55e",
                  fontWeight: 600,
                }}
              >
                ${Number(s.net_profit).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.warning && (
        <p style={{ marginTop: "0.75rem", color: "#b71c1c" }}>
          ⚠️ {data.warning}
        </p>
      )}
    </div>
  );
};

export default HoldSensitivityCard;
