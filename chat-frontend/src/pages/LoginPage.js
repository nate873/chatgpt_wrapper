// src/pages/LoginPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { supabase } from "../supabaseClient";

function LoginPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate("/chat");
    });
  }, [navigate]);

  const signInWithGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/chat` },
    });
    if (error) setError(error.message);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return; }
    navigate("/chat");
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); return; }
    if (data?.session) navigate("/chat");
    else setError("Account created. Please check your email to confirm.");
  };

  return (
    <div className="login-root">

      {/* ── Left panel: form ── */}
      <div className="login-left">
        <div className="login-brand">
          <span className="login-brand-icon">⌂</span>
          <span className="login-brand-name">FlipBot</span>
        </div>

        <div className="login-card">
          <h1 className="login-title">
            {tab === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="login-sub">
            {tab === "login"
              ? "Log in to your FlipBot account."
              : "Start analyzing deals in seconds."}
          </p>

          {error && <div className="login-error">{error}</div>}

          {/* Google */}
          <button className="login-google-btn" onClick={signInWithGoogle}>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="login-divider"><span>or</span></div>

          {/* Tabs */}
          <div className="login-tabs">
            <button
              className={`login-tab-btn ${tab === "login" ? "active" : ""}`}
              onClick={() => { setTab("login"); setError(null); }}
            >
              Log in
            </button>
            <button
              className={`login-tab-btn ${tab === "register" ? "active" : ""}`}
              onClick={() => { setTab("register"); setError(null); }}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={tab === "login" ? handleLoginSubmit : handleRegisterSubmit}>
            <div className="login-field">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="login-submit-btn" type="submit">
              {tab === "login" ? "Log In" : "Create Account"}
            </button>
          </form>

          <p className="login-footnote">
            Analyze deals, find distressed properties, and stress-test profits.
          </p>
        </div>
      </div>

      {/* ── Right panel: hero ── */}
      <div className="login-right">
        <div className="login-hero-content">
          <div className="login-hero-badge">Orange County, FL · Live Data</div>
          <h2 className="login-hero-title">
            Find foreclosures before anyone else
          </h2>
          <p className="login-hero-sub">
            FlipBot surfaces lis pendens, HOA liens, and distressed properties
            so you can run your numbers and move fast.
          </p>

          {/* Fake stats */}
          <div className="login-stats">
            <div className="login-stat">
              <strong>972</strong>
              <span>Lis Pendens tracked</span>
            </div>
            <div className="login-stat">
              <strong>71</strong>
              <span>Addresses enriched</span>
            </div>
            <div className="login-stat">
              <strong>3</strong>
              <span>Analysis tools</span>
            </div>
          </div>

          {/* Preview card */}
          <div className="login-preview-card">
            <div className="login-preview-header">
              <span className="login-preview-label">DISTRESS SEARCH</span>
              <span className="login-preview-badge">Active</span>
            </div>
            {[
              { addr: "9572 Reymont St", city: "Orlando, FL 32836", type: "Foreclosure" },
              { addr: "8091 Laureate Blvd", city: "Orlando, FL 32827", type: "Foreclosure" },
              { addr: "918 Algare Loop", city: "Apopka, FL 32703", type: "Code Violation" },
              { addr: "3805 Bainbridge Ave", city: "Orlando, FL 32806", type: "HOA Lien" },
            ].map((row, i) => (
              <div key={i} className="login-preview-row">
                <div className="login-preview-addr">
                  <strong>{row.addr}</strong>
                  <span>{row.city}</span>
                </div>
                <span className={`login-preview-type ${row.type === "Foreclosure" ? "red" : row.type === "HOA Lien" ? "amber" : "blue"}`}>
                  {row.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default LoginPage;