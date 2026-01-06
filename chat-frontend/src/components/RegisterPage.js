import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "./LoginPage.css";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
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

    if (data.session) {
      navigate("/chat");
    } else {
      setError("Check your email to confirm your account.");
    }
  };

  return (
    <div className="chat-page">
      <Header />

      <div className="chat-shell auth">
        <Sidebar loggedIn={false} />

        <main className="auth-main">
          <div className="auth-card">
            <h2 style={{ marginBottom: "1rem" }}>Create your account</h2>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleRegister}>
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
                Sign Up
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegisterPage;
