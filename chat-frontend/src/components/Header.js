import React, { useEffect, useRef, useState } from "react";
import "./Header.css";
import logo from "../logo.png";
import { supabase } from "../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";

const Header = ({ user, plan, credits }) => {
  const [open, setOpen] = useState(false);
  const [savedDealsOpen, setSavedDealsOpen] = useState(false);
  const [dealSessions, setDealSessions] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const savedDealsRef = useRef(null);
  const accountMenuRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_BASE;

  const activeSessionId = new URLSearchParams(location.search).get("session");

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

 

  useEffect(() => {
    if (!user?.id) {
      setDealSessions([]);
      return;
    }

    const fetchDeals = async () => {
      setLoadingDeals(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/deal-sessions?user_id=${user.id}`
        );
        const data = await res.json();
        setDealSessions(data || []);
      } catch (err) {
        console.error("Failed to load deal sessions", err);
      } finally {
        setLoadingDeals(false);
      }
    };

    fetchDeals();

    const onDealCreated = () => fetchDeals();
    window.addEventListener("deal-created", onDealCreated);

    return () => {
      window.removeEventListener("deal-created", onDealCreated);
    };
  }, [user?.id, API_BASE]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        savedDealsRef.current &&
        !savedDealsRef.current.contains(event.target)
      ) {
        setSavedDealsOpen(false);
      }

      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <div
          className="header-brand"
          onClick={handleLogoClick}
          style={{ cursor: "pointer" }}
        >
          <img src={logo} alt="FlipBot" className="header-logo" />
        </div>

        <nav className="header-nav">
          <button
            className={`nav-item ${
              location.pathname === "/chat" ? "active" : ""
            }`}
            onClick={() => navigate("/chat")}
          >
            Home
          </button>

          {user?.id && (
            <div className="saved-deals-menu" ref={savedDealsRef}>
              <button
                className={`nav-item ${savedDealsOpen ? "active" : ""}`}
                onClick={() => setSavedDealsOpen((prev) => !prev)}
              >
                Saved Deals
              </button>

              {savedDealsOpen && (
                <div className="saved-deals-dropdown">
                  <div className="saved-deals-dropdown-inner">
                    <div className="saved-deals-title">Saved Deals</div>

                    {loadingDeals && (
                      <div className="saved-deal-empty">Loading...</div>
                    )}

                    {!loadingDeals && dealSessions.length === 0 && (
                      <div className="saved-deal-empty">No saved deals yet</div>
                    )}

                    {!loadingDeals &&
                      dealSessions.map((deal) => (
                        <button
                          key={deal.id}
                          className={`saved-deal-item ${
                            activeSessionId === deal.id ? "active" : ""
                          }`}
                          onClick={() => {
                            setSavedDealsOpen(false);
                            navigate(`/chat?session=${deal.id}`);
                          }}
                        >
                          <div className="saved-deal-title">{deal.title}</div>
                          <div className="saved-deal-date">
                            {new Date(deal.created_at).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button className="nav-item" onClick={() => navigate("/about")}>
            About
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/affiliate-program")}
          >
            Affiliate Program
          </button>
        </nav>
      </div>

      <div className="header-right">
        <button
          className="upgrade-btn"
          onClick={() => navigate("/pricing-plans")}
        >
          Pricing Plans
        </button>

        <div className="account-menu" ref={accountMenuRef}>
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
                  Credits remaining: <strong>{credits ?? 0}</strong>
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