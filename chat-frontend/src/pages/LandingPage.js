import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import "./LandingPage.css";

const PHRASES = [
  "real estate",
  "hard money",
  "rental opportunity",
  "lenders",
  "multifamily",
];

const TYPING_SPEED = 90;
const DELETING_SPEED = 100;
const HOLD_AFTER_TYPE = 1300;

const LandingPage = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");

  const currentPhrase = PHRASES[phraseIndex];

  useEffect(() => {
    let timeout;

    if (!isDeleting && charIndex < currentPhrase.length) {
      timeout = setTimeout(() => setCharIndex((i) => i + 1), TYPING_SPEED);
    } else if (!isDeleting && charIndex === currentPhrase.length) {
      timeout = setTimeout(() => setIsDeleting(true), HOLD_AFTER_TYPE);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => setCharIndex((i) => i - 1), DELETING_SPEED);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, currentPhrase.length]);

  const goToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="landing-page">
      <Header />

      <main className="landing-main">
        <div className="landing-content">
          <div className="landing-hero">
            <h1 className="hero-type">
              Analyze{" "}
              <span className="blue">
                {currentPhrase.slice(0, charIndex)}
                <span className="cursor">|</span>
              </span>{" "}
              with AI
            </h1>

            <p>
              Stress test profits, compare lenders, and uncover risk in seconds
              — powered by intelligent underwriting models.
            </p>
          </div>

          <form
            className="demo-search"
            onSubmit={(e) => {
              e.preventDefault();
              goToLogin();
            }}
          >
            <span className="demo-badge">AI-Powered</span>

            <div className="demo-input">
              <span className="demo-icon">🔍</span>

              <input
                type="text"
                placeholder="Ask something like: What if my rehab goes 10% over budget?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <button type="submit">Ask AI →</button>
            </div>
          </form>

          <section className="offmarket-preview">
            <div className="offmarket-preview-content">
              <h2>Off-Market Properties</h2>

              <ul className="offmarket-preview-features">
                <li>✔ Curated off-market fix & flips</li>
                <li>✔ Filter by state & property type</li>
                <li>✔ Verified providers only</li>
                <li>✔ Analyze deals instantly with AI</li>
              </ul>

              <button
                className="offmarket-preview-btn"
                onClick={() => (window.location.href = "/login")}
              >
                Unlock Access →
              </button>
            </div>

            <div className="offmarket-preview-image">
              <img
                src="/offmarket.png"
                alt="Off-market properties preview"
              />
            </div>
          </section>

          <section className="ai-demo">
            <div className="ai-demo-inner">
              <h2 className="ai-demo-title">
                Your AI Agents Answer in Seconds
              </h2>

              <p className="ai-demo-subtitle">
                Click any question to see your agent team in action
              </p>

              <div className="ai-demo-row">
                <div className="ai-questions">
                  <button className="ai-question active">
                    <strong>Should I buy this deal?</strong>
                    <span>Instant underwriting & profit analysis</span>
                  </button>

                  <button className="ai-question">
                    <strong>What lenders fit this deal?</strong>
                    <span>Hard money, DSCR, bridge compared</span>
                  </button>

                  <button className="ai-question">
                    <strong>What’s the downside risk?</strong>
                    <span>Stress tests & exit sensitivity</span>
                  </button>

                  <button className="ai-question">
                    <strong>What if rehab runs over?</strong>
                    <span>Live scenario modeling</span>
                  </button>
                </div>

                <div className="ai-terminal">
                  <div className="terminal-header">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>

                  <pre className="terminal-body">
                    <span className="agent">Deal Agent</span>{" "}
                    Analyzing purchase & ARV...
                    {"\n"}→ LTV: 70% | Margin: Strong
                    {"\n\n"}
                    <span className="agent">Lender Agent</span> Matching
                    lenders...
                    {"\n"}→ Rate: 10% | Points: 2
                    {"\n\n"}
                    <span className="agent">Risk Agent</span> Running downside
                    cases...
                    {"\n"}→ Rehab +10% still profitable
                    {"\n\n"}
                    <span className="consensus">
                      CONSENSUS: Deal passes underwriting ✅
                    </span>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          <section className="agents-section">
            <h2 className="agents-title">
              Your AI Research Agents for Deal Analysis
            </h2>

            <p className="agents-subtitle">
              Specialized agents delivering institutional-grade underwriting,
              lender analysis, and deal intelligence — available 24/7.
            </p>

            <div className="agents-grid">
              <div className="agent-card">
                <span className="agent-icon">🏗️</span>
                <h3>Deal Analyzer</h3>
                <p>Stress test rehab, ARV, exit strategies, and margins.</p>
                <span className="agent-link">Analyze →</span>
              </div>

              <div className="agent-card">
                <span className="agent-icon">🏦</span>
                <h3>Lender Match</h3>
                <p>Compare hard money, DSCR, and bridge lenders instantly.</p>
                <span className="agent-link">Start →</span>
              </div>

              <div className="agent-card">
                <span className="agent-icon">📊</span>
                <h3>Cash Flow Model</h3>
                <p>Live rent, NOI, DSCR, and sensitivity analysis.</p>
                <span className="agent-link">Run →</span>
              </div>

              <div className="agent-card">
                <span className="agent-icon">⚠️</span>
                <h3>Risk Engine</h3>
                <p>Surface hidden risk across leverage, rehab, and exits.</p>
                <span className="agent-link">Assess →</span>
              </div>

              <div className="agent-card">
                <span className="agent-icon">📍</span>
                <h3>Market Intel</h3>
                <p>Track pricing, rents, demand, and local volatility.</p>
                <span className="agent-link">Explore →</span>
              </div>

              <div className="agent-card">
                <span className="agent-icon">🧠</span>
                <h3>Scenario AI</h3>
                <p>Ask “what-if” questions and simulate outcomes.</p>
                <span className="agent-link">Simulate →</span>
              </div>
            </div>
          </section>

          <section className="cta-section">
            <h2 className="cta-title">
              Stop Fighting the Market Alone.
              <br />
              <span className="cta-highlight">Hire Your AI Agent Team</span>{" "}
              Today.
            </h2>

            <p className="cta-subtitle">
              While you’re drowning in data and losing to emotions, our AI
              agents deliver deep research across real estate, lending, and
              underwriting — helping you make confident, rational investment
              decisions.
            </p>

            <div className="cta-features">
              <div className="cta-feature">✅ Instant intelligence</div>
              <div className="cta-feature">✅ Confident, rational decisions</div>
              <div className="cta-feature">✅ 24/7 opportunity detection</div>
              <div className="cta-feature">✅ Institutional-grade insights</div>
            </div>

            <button className="cta-button" onClick={goToLogin}>
              Get Started Now →
            </button>
          </section>

          <footer className="landing-footer">
            <div className="footer-inner">
              <span className="footer-copy">© 2026 FlipBot</span>

              <div className="footer-links">
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
                <span className="footer-sep">•</span>
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;