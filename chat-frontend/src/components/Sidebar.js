import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({
  loggedIn,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
}) => {
  const navigate = useNavigate();

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        <button
          className="sidebar-item"
          disabled={!loggedIn}
          onClick={() => loggedIn && navigate("/chat")}
        >
          Deal Chat
        </button>

        <button className="sidebar-item" disabled={!loggedIn}>
          Saved Deals
        </button>

        <button className="sidebar-item" disabled={!loggedIn}>
          Lenders
        </button>

        <button className="sidebar-item" disabled={!loggedIn}>
          Off Market Properties
        </button>

        <button className="sidebar-item" disabled={!loggedIn}>
          History
        </button>

        <button className="sidebar-item" disabled={!loggedIn}>
          Settings
        </button>
      </nav>

      <div className="sidebar-spacer" />

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
              Free Trial
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
