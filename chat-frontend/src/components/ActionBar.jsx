import React from "react";
import "./ActionBar.css";

const ActionBar = ({
  hasDeal,
  disabled,
  activeAction,
  onRunAction,
  onAnalyze,
}) => {
  const isRunning = (action) => disabled && activeAction === action;

  return (
    <div className="action-bar">
      {/* PRIMARY */}
      <button
  className="action-btn primary-action"
  onClick={onAnalyze}
  disabled={disabled}
>
  + New Deal
</button>


      {/* RISK */}
      <button
        className={`action-btn ${isRunning("stress_test") ? "active" : ""}`}
        disabled={!hasDeal || disabled}
        onClick={() => onRunAction("stress_test")}
      >
        Stress Test
      </button>

      <button
        className={`action-btn danger ${isRunning("worst_case") ? "active" : ""}`}
        disabled={!hasDeal || disabled}
        onClick={() => onRunAction("worst_case")}
      >
        Worst Case
      </button>

      {/* COST / TIME */}
      <button
        className={`action-btn ${isRunning("cash_to_close") ? "active" : ""}`}
        disabled={!hasDeal || disabled}
        onClick={() => onRunAction("cash_to_close")}
      >
        Cash to Close
      </button>

      <button
        className={`action-btn ${isRunning("hold_sensitivity") ? "active" : ""}`}
        disabled={!hasDeal || disabled}
        onClick={() => onRunAction("hold_sensitivity")}
      >
        Hold Time
      </button>

      <button
        className={`action-btn ${isRunning("apr_risk") ? "active" : ""}`}
        disabled={!hasDeal || disabled}
        onClick={() => onRunAction("apr_risk")}
      >
        APR Risk
      </button>

      {/* FINANCING */}
      <button
        className={`action-btn ${isRunning("find_lenders") ? "active" : ""}`}
        disabled={!hasDeal || disabled}
        onClick={() => onRunAction("find_lenders")}
      >
        Find Lenders
      </button>

      <button
        className={`action-btn ${isRunning("refi_dscr") ? "active" : ""}`}
        disabled={!hasDeal || disabled}
        onClick={() => onRunAction("refi_dscr")}
      >
        DSCR Refi
      </button>

      {/* MARKET */}
      <button
        className={`action-btn ${isRunning("city_opportunity") ? "active" : ""}`}
        disabled={disabled}
        onClick={() => onRunAction("city_opportunity")}
      >
        City Opportunity
      </button>
    </div>
  );
};

export default ActionBar;
