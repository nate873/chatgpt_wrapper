import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./AuthModal.css";

const AuthModal = ({ open, mode, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  if (!open) return null;

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/chat`,
      },
    });

    if (error) setError(error.message);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);

    const fn =
      mode === "login"
        ? supabase.auth.signInWithPassword
        : supabase.auth.signUp;

    const { error } = await fn({ email, password });
    if (error) setError(error.message);
  };

  return (
    <div className="auth-backdrop">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>×</button>

        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="auth-sub">
          {mode === "login"
            ? "Sign in to continue"
            : "Start analyzing deals with AI"}
        </p>

        {/* GOOGLE LOGIN */}
        <button className="google-btn" onClick={signInWithGoogle}>
          <img src="/google.svg" alt="Google" />
          Continue with Google
        </button>

        <div className="divider">or continue with email</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleEmailAuth}>
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

          <button className="primary-btn">
            {mode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
