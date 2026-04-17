import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ userId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dealSessions, setDealSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE;
  const activeSessionId = new URLSearchParams(location.search).get("session");

  useEffect(() => {
    if (!userId) return;
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/deal-sessions?user_id=${userId}`);
        const data = await res.json();
        setDealSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load deal sessions", err);
        setDealSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
    const onDealCreated = () => fetchDeals();
    window.addEventListener("deal-created", onDealCreated);
    return () => window.removeEventListener("deal-created", onDealCreated);
  }, [userId, API_BASE]);

  const navItems = [
    {
      label: "Analyzed",
      path: "/chat",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: "Saved",
      path: "/saved",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      label: "Settings",
      path: "/settings",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <aside style={{
      width: "52px",
      minHeight: "100vh",
      background: "#ffffff",
      borderRight: "1px solid #e8ecf0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "16px 0",
      gap: "2px",
      flexShrink: 0,
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            title={item.label}
            onClick={() => navigate(item.path)}
            style={{
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              border: "none",
              background: isActive ? "#eff6ff" : "transparent",
              color: isActive ? "#2563eb" : "#94a3b8",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#475569";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#94a3b8";
              }
            }}
          >
            {item.icon}
          </button>
        );
      })}

      {dealSessions.length > 0 && (
        <>
          <div style={{ width: "28px", height: "1px", background: "#e8ecf0", margin: "8px 0" }} />
          {!loading && dealSessions.map((deal) => {
            const isActive = activeSessionId === deal.id;
            return (
              <button
                key={deal.id}
                title={deal.title}
                onClick={() => navigate(`/chat?session=${deal.id}`)}
                style={{
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive ? "#eff6ff" : "transparent",
                  cursor: "pointer",
                  fontSize: "15px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                📁
              </button>
            );
          })}
        </>
      )}
    </aside>
  );
};

export default Sidebar;