import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "./About.css"; // optional if you want custom styles

const About = () => {
  const goToLogin = () => {
    window.location.href = "/login";
  };

  const goToRegister = () => {
    window.location.href = "/login?mode=register";
  };

  return (
    <>
      <Header />

      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        <Sidebar
          loggedIn={false}
          onLoginClick={goToLogin}
          onRegisterClick={goToRegister}
        />

        <main className="about-page">
          <div className="about-container">

           <h1 className="about-title">
  About{" "}
  <span className="flip">Flip</span>
  <span className="accent">Bot.io</span>
</h1>


            <p className="about-subtitle">
              Built by lenders. Powered by AI. Designed for real estate investors.
            </p>

            <section className="about-section">
              <h2>What is FlipBot?</h2>
              <p>
                <strong>FlipBot.io</strong> is an AI-powered real estate deal analysis
                platform developed by{" "}
                <a
                  href="https://afiprivatelenders.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>AFI Private Lenders</strong>
                </a>.
                It is designed to help flippers, builders, and real estate investors
                quickly evaluate opportunities, understand risk, and make confident
                decisions using intelligent underwriting models.
              </p>
            </section>

            <section className="about-section">
              <h2>Built by AFI Private Lenders</h2>
              <p>
                FlipBot.io operates under{" "}
                <a
                  href="https://afiprivatelenders.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>AFI Private Lenders</strong>
                </a>{" "}
                and was developed internally using the same assumptions, underwriting
                logic, and deal frameworks used by our lending team to evaluate
                real-world transactions.
              </p>
              <p>
                This means the insights provided by FlipBot are grounded in actual
                lending criteria — not generic calculators or surface-level estimates.
              </p>
            </section>

            <section className="about-section">
              <h2>Who It’s For</h2>
              <ul className="about-list">
                <li>Fix & Flip Investors</li>
                <li>Builders & Developers</li>
                <li>Buy & Hold Investors</li>
                <li>Wholesalers & Deal Sourcers</li>
              </ul>
            </section>

            <section className="about-section">
              <h2>What FlipBot Helps You Do</h2>
              <ul className="about-list">
                <li>Analyze fix & flip and rental deals using AI</li>
                <li>Stress test profits, rehab costs, and timelines</li>
                <li>Compare lender terms, leverage, and risk</li>
                <li>Identify underwriting red flags before committing capital</li>
                <li>Access off-market and exclusive inventory</li>
              </ul>
            </section>

            <section className="about-section">
              <h2>More Than a Calculator</h2>
              <p>
                FlipBot is not just a calculator — it’s an intelligent agent designed
                to think like an underwriter. By combining AI-driven analysis with
                real lending experience, FlipBot helps investors move faster while
                avoiding costly mistakes.
              </p>
            </section>
<section className="about-section">
  <h2>About the Founder</h2>
  <p>
    <strong>Nate Waldstein</strong>, Founder of FlipBot.io, is the Vice President of{" "}
    <a
      href="https://afiprivatelenders.com"
      target="_blank"
      rel="noopener noreferrer"
    >
      <strong>AFI Private Lenders</strong>
    </a>, where he plays a key role in underwriting, capital structuring, and
    evaluating real-world real estate transactions across a wide range of asset
    classes.
  </p>
  <p>
    With experience working alongside family offices and private capital
    sources, Nate has deep insight into how sophisticated investors assess risk,
    deploy leverage, and make disciplined investment decisions.
  </p>
  <p>
    In addition to his background in lending and finance, Nate has a strong
    passion for web application development and product design. FlipBot.io was
    created to bridge the gap between institutional-grade underwriting and
    intuitive technology — bringing professional-grade analysis tools directly
    to investors through a modern, AI-powered platform.
  </p>
</section>

          </div>
        </main>
      </div>
    </>
  );
};

export default About;
