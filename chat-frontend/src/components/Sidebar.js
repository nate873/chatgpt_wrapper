import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({
  loggedIn,
  userId,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showSavedDeals, setShowSavedDeals] = useState(false);
  const [dealSessions, setDealSessions] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE;

  // Fetch saved deals
  useEffect(() => {
    if (!loggedIn || !userId || !showSavedDeals) return;

    const fetchDeals = async () => {
      setLoadingDeals(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/deal-sessions?user_id=${userId}`
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
  }, [loggedIn, userId, showSavedDeals, API_BASE]);

  const openDeal = (sessionId) => {
    navigate(`/chat?session=${sessionId}`);
  };

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {/* MAIN CHAT */}
        <button
          className={`sidebar-item ${
            location.pathname === "/chat" ? "active" : ""
          }`}
          disabled={!loggedIn}
          onClick={() => loggedIn && navigate("/chat")}
        >
          Deal Chat
        </button>

        <button className="sidebar-item" disabled={!loggedIn}>
          My Lenders
        </button>

        <button className="sidebar-item" disabled={!loggedIn}>
          Off Market Properties
        </button>

        <button className="sidebar-item" disabled={!loggedIn}>
          Settings
        </button>

        {/* SAVED DEALS (CHATGPT-STYLE HISTORY) */}
        <button
          className="sidebar-item sidebar-expandable"
          disabled={!loggedIn}
          onClick={() => setShowSavedDeals((v) => !v)}
        >
          Saved Deals
          <span className={`chevron ${showSavedDeals ? "open" : ""}`}>▾</span>
        </button>

        {showSavedDeals && (
          <div className="sidebar-sublist">
            {loadingDeals && (
              <div className="sidebar-subitem muted">Loading…</div>
            )}

            {!loadingDeals && dealSessions.length === 0 && (
              <div className="sidebar-subitem muted">
                No saved deals yet
              </div>
            )}

            {dealSessions.map((deal) => (
              <button
                key={deal.id}
                className="sidebar-subitem"
                onClick={() => openDeal(deal.id)}
              >
                <div className="deal-title">{deal.title}</div>
                <div className="deal-date">
                  {new Date(deal.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-spacer" />

      {/* AUTH */}
      <div className="sidebar-auth">
        {loggedIn ? (
          <>
            <button
              className="sidebar-auth-btn secondary"
              onClick={onLogoutClick}
            >
              Sign Out
            </button>

            <button
              className="sidebar-auth-btn primary"
              onClick={() => navigate("/pricing-plans")}
            >
              Upgrade
            </button>
          </>
        ) : (
          <>
            <button
              className="sidebar-auth-btn primary"
              onClick={onLoginClick ?? (() => navigate("/"))}
            >
              Login
            </button>

            <button
              className="sidebar-auth-btn secondary"
              onClick={onRegisterClick ?? (() => navigate("/register"))}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
