// src/pages/LoginPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";

function LoginPage() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /* 🔐 Redirect if already logged in */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        navigate("/chat");
      }
    });
  }, [navigate]);

  /* ======================
     GOOGLE AUTH
     ====================== */
  const signInWithGoogle = async () => {
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/chat`,
      },
    });

    if (error) setError(error.message);
  };

  /* ======================
     LOGIN
     ====================== */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/chat");
  };

  /* ======================
     REGISTER
     ====================== */
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (data?.session) {
      navigate("/chat");
    } else {
      setError("Account created. Please check your email to confirm.");
    }
  };

  return (
    <div className="auth-page">
      <Header />

      <main className="auth-main">
        <div className="auth-card kavout-style">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={tab === "login" ? "active" : ""}
              onClick={() => setTab("login")}
            >
              Login
            </button>
            <button
              className={tab === "register" ? "active" : ""}
              onClick={() => setTab("register")}
            >
              Register
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* GOOGLE BUTTON */}
          <button className="google-btn" onClick={signInWithGoogle}>
            <img src="/google.png" alt="Google" />
            Continue with Google
          </button>

          <div className="divider">or continue with email</div>

          {/* LOGIN FORM */}
          {tab === "login" && (
            <form onSubmit={handleLoginSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button className="primary-btn" type="submit">
                Log In
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === "register" && (
            <form onSubmit={handleRegisterSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button className="primary-btn" type="submit">
                Create Account
              </button>
            </form>
          )}

          <div className="auth-footnote">
            Analyze deals, compare lenders, and stress test profits with AI.
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
