import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "./About.css"; // intentionally reuse About styling

const AffiliateProgram = () => {
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
              Affiliate <span className="accent">Program</span>
            </h1>

            <p className="about-subtitle">
              Earn recurring revenue by referring investors to FlipBot.
            </p>

            <section className="about-section">
              <h2>Earn 30% Recurring Commissions</h2>
              <p>
                Partner with one of the most advanced AI-powered investing
                platforms and earn <strong>30% recurring commission</strong> on
                every subscriber you refer — for as long as they remain active.
              </p>
              <p>
                Whether you’re a content creator, newsletter publisher, or
                investing influencer, FlipBot allows you to turn your audience
                into predictable, long-term income.
              </p>
            </section>

            <section className="about-section">
              <h2>Fast, Simple, and Transparent</h2>
              <p>
                Joining the FlipBot affiliate program is straightforward.
                There’s no approval delay — just sign up, get your referral link,
                and start earning immediately.
              </p>
            </section>

            <section className="about-section">
              <h2>How Do Payouts Work?</h2>
              <p>
                Affiliate commissions are paid via{" "}
                <strong>PayPal, Wise, or direct bank transfer</strong>. Payouts
                are issued monthly once your approved commission balance exceeds{" "}
                <strong>$50</strong>.
              </p>
            </section>

            <section className="about-section">
              <h2>How Long Do Cookies Last?</h2>
              <p>
                Referral cookies last <strong>30 days</strong>. You’ll earn a
                commission if a user signs up within 30 days of clicking your
                referral link.
              </p>
            </section>

            <section className="about-section">
              <h2>Is There a Limit on Earnings?</h2>
              <p>
                There are <strong>no limits</strong> on how much you can earn.
                The more subscribers you refer, the more recurring revenue you
                generate — with 30% commission on every active customer.
              </p>
            </section>

            <section className="about-section">
              <h2>Get Started</h2>
              <p>
                If you already have an audience interested in real estate,
                investing, or financial tools, the FlipBot affiliate program
                offers a simple way to monetize while providing real value.
              </p>

              <button
                className="cta-button"
                onClick={goToRegister}
              >
                Join the Affiliate Program →
              </button>
            </section>

          </div>
        </main>
      </div>
    </>
  );
};

export default AffiliateProgram;
