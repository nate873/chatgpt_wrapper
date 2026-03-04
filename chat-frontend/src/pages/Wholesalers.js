import React from "react";
import "./About.css"; // reuse About styling
import { useNavigate } from "react-router-dom";

const Wholesalers = () => {
const navigate = useNavigate();

return ( <main className="about-page"> <div className="about-container">

    <h1 className="about-title">
      For <span className="accent">Wholesalers</span>
    </h1>

    <p className="about-subtitle">
      Turn your locked-up deals into faster assignments by reaching
      serious real estate investors.
    </p>

    <section className="about-section">
      <h2>List Your Off-Market Deals</h2>
      <p>
        FlipBot allows wholesalers to share off-market opportunities
        with a growing network of investors actively looking for their
        next property.
      </p>
      <p>
        Instead of manually sending deals through email lists or group
        chats, you can <strong>upload your locked-up properties</strong>
        and instantly expose them to buyers analyzing deals daily.
      </p>
    </section>

    <section className="about-section">
      <h2>Reach Serious Buyers</h2>
      <p>
        Investors on FlipBot are actively analyzing deals using
        AI-powered tools to evaluate potential opportunities.
      </p>
      <p>
        When you list a property, your deal becomes visible to buyers
        who are searching for profitable investments — helping you
        <strong> close assignments faster.</strong>
      </p>
    </section>

    <section className="about-section">
      <h2>AI Deal Analysis</h2>
      <p>
        Buyers can instantly analyze deals using FlipBot’s AI tools,
        which estimate key investment metrics such as:
      </p>

      <ul>
        <li>After Repair Value (ARV)</li>
        <li>Estimated renovation costs</li>
        <li>Projected profit margins</li>
        <li>Rental performance potential</li>
      </ul>

      <p>
        This helps buyers evaluate opportunities quickly and increases
        the chances of your deals getting picked up.
      </p>
    </section>

    <section className="about-section">
      <h2>Build Your Buyer Network</h2>
      <p>
        FlipBot helps wholesalers connect with repeat investors who
        regularly purchase properties.
      </p>

      <p>
        Over time, this creates a reliable pipeline of buyers who trust
        your deals and are ready to move quickly.
      </p>
    </section>

    <section className="about-section">
      <h2>Start Listing Deals</h2>
      <p>
        If you regularly lock up off-market properties, FlipBot makes
        it easy to distribute deals and connect with investors looking
        for their next opportunity.
      </p>

      <button
        className="cta-button"
        onClick={() => navigate("/login?mode=register")}
      >
        Start Listing Deals →
      </button>
    </section>

  </div>
</main>


);
};

export default Wholesalers;
