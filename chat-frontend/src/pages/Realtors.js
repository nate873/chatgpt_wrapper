import React from "react";
import "./About.css"; // intentionally reuse About styling
import { useNavigate } from "react-router-dom";

const Realtors = () => {
const navigate = useNavigate();

return ( <main className="about-page"> <div className="about-container">

    <h1 className="about-title">
      For <span className="accent">Realtors</span>
    </h1>

    <p className="about-subtitle">
      Connect your listings with serious real estate investors.
    </p>

    <section className="about-section">
      <h2>Access Active Investor Buyers</h2>
      <p>
        FlipBot connects realtors with a network of investors actively
        searching for profitable real estate opportunities.
      </p>
      <p>
        Whether you're listing properties that need renovation,
        rental-ready homes, or investment opportunities, FlipBot helps
        you expose those listings to buyers specifically looking for
        deals.
      </p>
    </section>

    <section className="about-section">
      <h2>Help Investors Analyze Deals Faster</h2>
      <p>
        FlipBot provides AI-powered tools that allow investors to quickly
        analyze potential deals, including estimated ARV, renovation
        costs, profit potential, and rental performance.
      </p>
      <p>
        This allows buyers to make faster decisions and helps realtors
        move investment properties more efficiently.
      </p>
    </section>

    <section className="about-section">
      <h2>Expand Your Investor Network</h2>
      <p>
        Instead of relying only on local buyers or personal connections,
        FlipBot allows you to reach a wider audience of investors who
        are actively searching for their next property.
      </p>
      <p>
        This helps realtors build stronger relationships with repeat
        investor clients and close deals faster.
      </p>
    </section>

    <section className="about-section">
      <h2>Increase Deal Visibility</h2>
      <p>
        By sharing investment-friendly properties on FlipBot, you
        increase the visibility of your listings among serious buyers
        who understand renovation projects, rental opportunities,
        and value-add properties.
      </p>
    </section>

    <section className="about-section">
      <h2>Get Started</h2>
      <p>
        If you work with investment properties or clients searching
        for real estate opportunities, FlipBot helps connect you
        with the right buyers.
      </p>

      <button
        className="cta-button"
        onClick={() => navigate("/login?mode=register")}
      >
        Get Started →
      </button>
    </section>

  </div>
</main>


);
};

export default Realtors;
