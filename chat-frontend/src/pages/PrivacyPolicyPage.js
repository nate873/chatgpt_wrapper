import React from "react";
import "./About.css"; // ✅ reuse About styling

const PrivacyPolicyPage = () => {
  return (
    <main className="about-page">
      <div className="about-container">
        <h1 className="about-title">
          Privacy <span className="accent">Policy</span>
        </h1>

        <p className="about-subtitle">
          Last updated: January 2026
        </p>

        <section className="about-section">
          <p>
            FlipBot (“we”, “our”, or “us”) respects your privacy. This Privacy
            Policy explains how we collect, use, and protect your information
            when you use our website, application, and services (the “Service”).
          </p>
        </section>

        <section className="about-section">
          <h2>1. Information We Collect</h2>
          <ul className="about-list">
            <li><strong>Account Information:</strong> Email, user ID, subscription plan</li>
            <li><strong>Payment Information:</strong> Processed securely by Stripe</li>
            <li><strong>Usage Data:</strong> Credits used and feature interactions</li>
            <li><strong>Deal Inputs:</strong> Property and deal data you submit</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>2. How We Use Your Information</h2>
          <ul className="about-list">
            <li>Provide and improve the Service</li>
            <li>Manage subscriptions and credits</li>
            <li>Process payments and prevent fraud</li>
            <li>Respond to support requests</li>
            <li>Maintain platform security</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>3. AI & Data Usage</h2>
          <p>
            Data submitted for analysis is used solely to generate results inside
            FlipBot. We do not sell your data or train public AI models on it.
          </p>
        </section>

        <section className="about-section">
          <h2>4. Cookies & Tracking</h2>
          <p>
            We may use cookies to maintain sessions and improve user experience.
            You can control cookies through your browser settings.
          </p>
        </section>

        <section className="about-section">
          <h2>5. Third-Party Services</h2>
          <ul className="about-list">
            <li>Supabase (authentication & database)</li>
            <li>Stripe (payments & billing)</li>
            <li>Cloud infrastructure providers</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>6. Data Security</h2>
          <p>
            We implement reasonable safeguards to protect your data, but no
            system can be completely secure.
          </p>
        </section>

        <section className="about-section">
          <h2>7. Data Retention</h2>
          <p>
            Data is retained while your account is active or as required by law.
          </p>
        </section>

        <section className="about-section">
          <h2>8. Your Rights</h2>
          <ul className="about-list">
            <li>Access or update your personal data</li>
            <li>Request account deletion</li>
            <li>Object to certain processing activities</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>9. Children’s Privacy</h2>
          <p>
            FlipBot is not intended for users under the age of 18.
          </p>
        </section>

        <section className="about-section">
          <h2>10. Changes to This Policy</h2>
          <p>
            This policy may be updated periodically. Changes will be reflected
            on this page.
          </p>
        </section>

        <section className="about-section">
          <h2>11. Contact</h2>
          <p>
            Questions? Email <strong>nate@actionfunding.net</strong>
          </p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;
