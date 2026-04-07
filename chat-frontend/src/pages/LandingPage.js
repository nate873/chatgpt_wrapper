import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import "./LandingPage.css";

const PHRASES = [
  "real estate",
  "multifamily",
  "vacant land",
  "market rents",
  "distressed property",
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

  const goToDemo = () => {
    window.location.href = "/pricing-plans";
  };

  return (
    <div className="landing-page">
      <Header />

      <main className="landing-main">
        <div className="landing-content">
          <section className="landing-hero">
            <div className="hero-eyebrow">Real estate intelligence, simplified</div>

            <h1 className="hero-type">
              Analyze{" "}
              <span className="blue">
                {currentPhrase.slice(0, charIndex)}
                <span className="cursor">|</span>
              </span>{" "}
              faster
            </h1>

            <p className="hero-copy">
              FlipBot helps you analyze properties, search distress signals, and
              save the opportunities you want to track — all in one cleaner workflow.
            </p>

            <form
              className="demo-search"
              onSubmit={(e) => {
                e.preventDefault();
                goToLogin();
              }}
            >
              <span className="demo-badge">FlipBot AI</span>

              <div className="demo-input">
                <span className="demo-icon">⌕</span>

                <input
                  type="text"
                  placeholder="Ask something like: show me comps, rents, and risk on this property"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                <button type="submit">Ask AI</button>
              </div>
            </form>

            <div className="hero-actions">
              <button className="hero-primary-btn" onClick={goToLogin}>
                Get Started
              </button>
              <button className="hero-secondary-btn" onClick={goToDemo}>
                Schedule a Demo
              </button>
            </div>
          </section>

          <section className="feature-showcase">
            <div className="feature-copy">
              <div className="section-kicker">Property analysis</div>
              <h2>Analyze properties with comps, market rents, and deal signals</h2>
              <p>
                Review a property faster with nearby comps, estimated market rents,
                and a cleaner AI summary of the numbers that actually matter.
              </p>

              <ul className="feature-list">
                <li>Sales comps and rent comps in one view</li>
                <li>Estimated rents, pricing, and basic risk flags</li>
                <li>Fast underwriting support before you dig deeper</li>
              </ul>

              <button className="feature-btn" onClick={goToLogin}>
                Analyze Properties
              </button>
            </div>

            <div className="feature-visual analysis-visual">
              <div className="mock-window analysis-main">
                <div className="mock-toolbar">
                  <span className="mock-dot red" />
                  <span className="mock-dot yellow" />
                  <span className="mock-dot green" />
                </div>

                <div className="analysis-grid">
                  <div className="analysis-card large">
                    <div className="mini-label">Subject Property</div>
                    <div className="mini-title">15848 Saticoy St</div>
                    <div className="mini-meta">Los Angeles, CA</div>
                  </div>

                  <div className="analysis-card">
                    <div className="mini-label">Estimated Value</div>
                    <div className="mini-stat">$412,000</div>
                  </div>

                  <div className="analysis-card">
                    <div className="mini-label">Market Rent</div>
                    <div className="mini-stat">$2,950/mo</div>
                  </div>

                  <div className="analysis-card">
                    <div className="mini-label">Avg Comp PPSF</div>
                    <div className="mini-stat">$318</div>
                  </div>

                  <div className="analysis-card">
                    <div className="mini-label">Deal Signal</div>
                    <div className="mini-pill good">Promising</div>
                  </div>
                </div>
              </div>

              <div className="floating-panel floating-comps">
                <div className="floating-title">Nearby Comps</div>
                <div className="floating-row">
                  <span>3 bed / 2 bath</span>
                  <strong>$405,000</strong>
                </div>
                <div className="floating-row">
                  <span>2 bed / 2 bath</span>
                  <strong>$398,000</strong>
                </div>
                <div className="floating-row">
                  <span>3 bed / 2 bath</span>
                  <strong>$421,000</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="feature-showcase reverse">
            <div className="feature-visual search-visual">
              <div className="mock-window search-main">
                <div className="search-filters">
                  <div className="filter-chip">Los Angeles, CA</div>
                  <div className="filter-chip">Delinquent Taxes</div>
                  <div className="filter-chip">Open Permits</div>
                  <div className="filter-chip">Code Violations</div>
                </div>

                <div className="search-table">
                  <div className="search-table-head">
                    <span>Property</span>
                    <span>Flag</span>
                    <span>Status</span>
                  </div>

                  <div className="search-table-row">
                    <span>412 Longview Ave</span>
                    <span>Code Violation</span>
                    <span className="status-pill warning">Active</span>
                  </div>

                  <div className="search-table-row">
                    <span>1091 Ridgecrest Dr</span>
                    <span>Open Permit</span>
                    <span className="status-pill neutral">Review</span>
                  </div>

                  <div className="search-table-row">
                    <span>847 Clairemont Rd</span>
                    <span>Delinquent Taxes</span>
                    <span className="status-pill danger">Flagged</span>
                  </div>

                  <div className="search-table-row">
                    <span>1007 Maple St</span>
                    <span>Vacancy Signal</span>
                    <span className="status-pill good">Matched</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="feature-copy">
              <div className="section-kicker">Property search</div>
              <h2>Search specific properties for distress signals and hidden opportunity</h2>
              <p>
                Search for properties using filters like code violations, open permits,
                delinquent taxes, vacancy signals, and other markers that help you
                focus on the right opportunities.
              </p>

              <ul className="feature-list">
                <li>Search by address, ZIP code, city, or target area</li>
                <li>Surface code issues, permit activity, and tax delinquency</li>
                <li>Turn scattered public indicators into a more usable workflow</li>
              </ul>

              <button className="feature-btn" onClick={goToLogin}>
                Search Properties
              </button>
            </div>
          </section>

          <section className="feature-showcase">
            <div className="feature-copy">
              <div className="section-kicker">Saved results and alerts</div>
              <h2>Save your results and get alerted when we find properties you may want</h2>
              <p>
                Save searches and results, then let FlipBot notify you when we find
                new opportunities that match what you care about — like vacant land,
                distressed multifamily, and other targeted property types.
              </p>

              <ul className="feature-list">
                <li>Save searches for your own buy box</li>
                <li>Get notified about relevant new matches</li>
                <li>Track categories like vacant land or distressed multifamily</li>
              </ul>

              <button className="feature-btn" onClick={goToLogin}>
                Save and Track Results
              </button>
            </div>

            <div className="feature-visual alerts-visual">
              <div className="mock-window alerts-main">
                <div className="alerts-form-title">Save Search</div>
                <div className="alerts-field">Search Name: Vacant Land LA County</div>
                <div className="alerts-field">Property Type: Vacant Land</div>
                <div className="alerts-field">Alert Frequency: Weekly</div>
                <button className="alerts-save-btn" type="button">
                  Save Search
                </button>
              </div>

              <div className="floating-panel floating-alert">
                <div className="floating-title">New Matches Found</div>
                <div className="alert-card">
                  <div className="alert-name">Distressed Multifamily</div>
                  <div className="alert-meta">4 units • Tax issue • Permit activity</div>
                  <button type="button">View</button>
                </div>
                <div className="alert-card">
                  <div className="alert-name">Vacant Land Opportunity</div>
                  <div className="alert-meta">0.42 acres • Corner lot • New listing</div>
                  <button type="button">View</button>
                </div>
              </div>
            </div>
          </section>

          <section className="cta-section">
            <div className="section-kicker">See it live</div>

            <h2 className="cta-title">
              Bring your team into a cleaner
              <span className="cta-highlight"> property workflow</span>
            </h2>

            <p className="cta-subtitle">
              From property analysis to search filters to saved-result alerts,
              FlipBot helps you move faster with a cleaner real estate workflow.
            </p>

            <div className="cta-features">
              <div className="cta-feature">Analyze faster</div>
              <div className="cta-feature">Search smarter</div>
              <div className="cta-feature">Save your buy box</div>
              <div className="cta-feature">Get alerted sooner</div>
            </div>

            <div className="cta-actions">
              <button className="cta-button" onClick={goToLogin}>
                Get Started
              </button>
              <button className="cta-button secondary" onClick={goToDemo}>
                Schedule a Demo
              </button>
            </div>
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