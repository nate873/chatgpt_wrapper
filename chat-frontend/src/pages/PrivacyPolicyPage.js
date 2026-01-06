import React from "react";
import Header from "../components/Header";

const PrivacyPolicyPage = () => {
  return (
    <div className="chat-page">
      <Header />

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "3rem 1.5rem",
          color: "#e5e7eb",
          lineHeight: "1.7",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          Privacy Policy
        </h1>

        <p style={{ opacity: 0.8, marginBottom: "2rem" }}>
          Last updated: January 2026
        </p>

        <section>
          <p>
            FlipBot (“we”, “our”, or “us”) respects your privacy. This Privacy
            Policy explains how we collect, use, and protect your information
            when you use our website, application, and services (the
            “Service”).
          </p>
        </section>

        <h2>1. Information We Collect</h2>
        <p>We may collect the following types of information:</p>

        <ul>
          <li>
            <strong>Account Information:</strong> Email address, user ID, and
            subscription plan
          </li>
          <li>
            <strong>Payment Information:</strong> Billing details processed
            securely by Stripe (we do not store credit card numbers)
          </li>
          <li>
            <strong>Usage Data:</strong> Credits used, features accessed, and
            interaction data
          </li>
          <li>
            <strong>Deal Inputs:</strong> Property and deal data you voluntarily
            provide for analysis
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and improve the Service</li>
          <li>Manage subscriptions and credits</li>
          <li>Process payments and prevent fraud</li>
          <li>Respond to support requests</li>
          <li>Monitor platform performance and security</li>
        </ul>

        <h2>3. AI & Data Usage</h2>
        <p>
          Data you submit for analysis is used solely to generate results within
          the Service. We do not sell your data or use it to train public AI
          models.
        </p>

        <h2>4. Cookies & Tracking</h2>
        <p>
          We may use cookies or similar technologies to maintain sessions,
          improve user experience, and analyze usage patterns. You can control
          cookies through your browser settings.
        </p>

        <h2>5. Third-Party Services</h2>
        <p>
          We rely on trusted third-party providers, including:
        </p>
        <ul>
          <li>Supabase (authentication and database)</li>
          <li>Stripe (payments and billing)</li>
          <li>Cloud hosting providers</li>
        </ul>

        <p>
          These providers only receive the information necessary to perform
          their services and are contractually obligated to protect it.
        </p>

        <h2>6. Data Security</h2>
        <p>
          We implement reasonable technical and organizational safeguards to
          protect your data. However, no system can be 100% secure, and we
          cannot guarantee absolute security.
        </p>

        <h2>7. Data Retention</h2>
        <p>
          We retain your information as long as your account is active or as
          needed to provide the Service and comply with legal obligations.
        </p>

        <h2>8. Your Rights</h2>
        <p>
          Depending on your location, you may have the right to:
        </p>
        <ul>
          <li>Access or update your personal data</li>
          <li>Request deletion of your account</li>
          <li>Object to certain processing activities</li>
        </ul>

        <h2>9. Children’s Privacy</h2>
        <p>
          FlipBot is not intended for individuals under the age of 18. We do not
          knowingly collect personal data from minors.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page with an updated effective date.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy, please
          contact us at:
        </p>

        <p>
          <strong>nate@actionfunding.net</strong>
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
