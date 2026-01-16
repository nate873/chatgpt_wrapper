import React from "react";
import "./About.css";

const About = () => {
  return (
    <main className="about-page">
      <div className="about-container">
        <h1 className="about-title">
          About <span className="flip">Flip</span>
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
              className="about-link"
            >
              <strong>AFI Private Lenders</strong>
            </a>.
            It helps investors evaluate opportunities, understand risk, and make
            confident decisions using intelligent underwriting models.
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
              className="about-link"
            >
              <strong>AFI Private Lenders</strong>
            </a>{" "}
            and was developed using the same underwriting logic and deal frameworks
            applied to real-world transactions.
          </p>
          <p>
            This ensures FlipBot insights are grounded in actual lending criteria —
            not surface-level estimates.
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
            <li>Analyze deals using AI</li>
            <li>Stress test profits and rehab costs</li>
            <li>Compare lender terms and leverage</li>
            <li>Identify underwriting red flags</li>
            <li>Access off-market opportunities</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>More Than a Calculator</h2>
          <p>
            FlipBot is an intelligent agent designed to think like an underwriter —
            combining AI-driven analysis with real lending experience to help
            investors move faster while avoiding costly mistakes.
          </p>
        </section>

        <section className="about-section">
          <h2>About the Founder</h2>
          <p>
            <strong>Nate Waldstein</strong>, Founder of FlipBot.io, is the Vice
            President of{" "}
            <a
              href="https://afiprivatelenders.com"
              target="_blank"
              rel="noopener noreferrer"
              className="about-link"
            >
              <strong>AFI Private Lenders</strong>
            </a>, where he works closely with private capital and family offices
            on underwriting and structuring real estate investments.
          </p>
          <p>
            With deep experience in lending and capital markets, Nate built
            FlipBot to bring institutional-grade underwriting tools to everyday
            investors through a modern web platform.
          </p>
          <p>
            Alongside finance, Nate has a strong passion for web application
            development and product design — making FlipBot both powerful and
            intuitive.
          </p>
        </section>
      </div>
    </main>
  );
};

export default About;
