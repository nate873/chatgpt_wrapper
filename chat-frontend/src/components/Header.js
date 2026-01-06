import React, { useState } from "react";
import "./Header.css";
import logo from "../logo.png";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Header = ({ user, plan, credits }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (user?.id) {
      navigate("/chat"); // logged in → app
    } else {
      navigate("/"); // logged out → landing
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/");
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
          <button className="nav-item">Contact Us</button>
          <button className="nav-item">Affiliate Program</button>
          <button className="nav-item">Notifications</button>
          <button className="nav-item">Tools</button>
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
            onClick={() => setOpen(prev => !prev)}
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

              {/* Only show trial button if FREE */}
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

              <button
                className="dropdown-btn"
                onClick={handleLogout}
              >
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
