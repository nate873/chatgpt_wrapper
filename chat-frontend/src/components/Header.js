import React, { useState } from "react";
import "./Header.css";
import logo from "../logo.png";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Header = ({ user, plan, credits }) => {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (user?.id) {
      navigate("/chat");
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/");
  };

  // 🔑 NEW: List a Property handler
  const handleListProperty = () => {
    if (!user?.id) {
      navigate("/login");
    } else {
      navigate("/provider");
    }
  };

  return (
    <header className="app-header">
      {/* LEFT */}
      <div className="header-left">
        <div
          className="header-brand"
          onClick={handleLogoClick}
          style={{ cursor: "pointer" }}
        >
          <img src={logo} alt="FlipBot" className="header-logo" />
        </div>

        <nav className="header-nav">
          <button className="nav-item" onClick={() => navigate("/about")}>
            About
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/affiliate-program")}
          >
            Affiliate Program
          </button>

          {/* 🔔 Notifications */}
          <div className="notifications-wrapper">
            <button
              className="nav-item"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setToolsOpen(false);
              }}
            >
              Notifications
            </button>

            {notificationsOpen && (
              <div className="notifications-dropdown clean">
                <span className="notif-label">Notifications</span>

                <label className="notif-toggle">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={() =>
                      setNotificationsEnabled((prev) => !prev)
                    }
                  />
                  <span className="slider" />
                </label>
              </div>
            )}
          </div>

          {/* 🧰 Tools */}
          <div className="tools-wrapper">
            <button
              className="nav-item"
              onClick={() => {
                setToolsOpen((prev) => !prev);
                setNotificationsOpen(false);
              }}
            >
              Tools
            </button>

            {toolsOpen && (
              <div className="tools-dropdown">
                <div className="tools-grid">
                  <div className="tool-item">
                    <span className="tool-icon">💬</span>
                    <span>Deal Chat</span>
                  </div>

                  <div className="tool-item">
                    <span className="tool-icon">🏘️</span>
                    <span>Off-Market Properties</span>
                  </div>

                  <div className="tool-item">
                    <span className="tool-icon">🏦</span>
                    <span>Saved Lenders</span>
                  </div>

                  <div className="tool-item">
                    <span className="tool-icon">⭐</span>
                    <span>Saved Deals</span>
                  </div>

                  <div className="tool-item">
                    <span className="tool-icon">📊</span>
                    <span>DSCR Analysis</span>
                  </div>

                  <div className="tool-item">
                    <span className="tool-icon">⚠️</span>
                    <span>Stress Test</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ⭐ PRIMARY CTA */}
          <button
            className="nav-item primary"
            onClick={handleListProperty}
          >
            List a Property
          </button>
        </nav>
      </div>

      {/* RIGHT */}
      <div className="header-right">
        <button
          className="upgrade-btn"
          onClick={() => navigate("/pricing-plans")}
        >
          Pricing Plans
        </button>

        <div className="account-menu">
          <button
            className="account-avatar"
            onClick={() => setOpen((prev) => !prev)}
          >
            {user?.email?.[0]?.toUpperCase() || "U"}
          </button>

          {open && (
            <div className="account-dropdown">
              <div className="account-email">
                {user?.email || "Not signed in"}
              </div>

              <div className="account-meta">
                <span>
                  Plan: <strong>{plan ?? "free"}</strong>
                </span>
                <span>
                  ⚡ Credits remaining:{" "}
                  <strong>{credits ?? 0}</strong>
                </span>
              </div>

              {plan === "free" && (
                <button
                  className="dropdown-btn primary"
                  onClick={() => {
                    setOpen(false);
                    navigate("/pricing-plans");
                  }}
                >
                  Start Free Trial
                </button>
              )}

              <button className="dropdown-btn" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;