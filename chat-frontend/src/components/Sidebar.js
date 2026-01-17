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

  const API_BASE = process.env.REACT_APP_API_BASE;

  const [dealSessions, setDealSessions] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // Active deal from URL (?session=...)
  const activeSessionId =
    new URLSearchParams(location.search).get("session");

  // Fetch saved deals (chat-history style)
  useEffect(() => {
  if (!loggedIn || !userId) return;

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

  // initial load
  fetchDeals();

  // 🔥 listen for new deal creation
  const onDealCreated = () => fetchDeals();
  window.addEventListener("deal-created", onDealCreated);

  return () => {
    window.removeEventListener("deal-created", onDealCreated);
  };
}, [loggedIn, userId, API_BASE]);


  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {/* MAIN NAV */}
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

        {/* SAVED DEALS (CHAT HISTORY STYLE) */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Saved Deals</div>

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
              className={`sidebar-subitem deal-history-item ${
                activeSessionId === deal.id ? "active" : ""
              }`}
              onClick={() => navigate(`/chat?session=${deal.id}`)}
            >
              <div className="deal-title">{deal.title}</div>
              <div className="deal-date">
                {new Date(deal.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
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
