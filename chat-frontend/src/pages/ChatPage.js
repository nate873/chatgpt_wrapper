import React, { useState, useEffect, useRef } from "react";
import "./ChatPage.css";
import DealAnalysisCard from "../components/DealAnalysisCard";
import LenderInsightCard from "../components/LenderInsightCard";
import LenderResultsGrid from "../components/LenderResultsGrid";
import DSCRAnalysisCard from "../components/DSCRAnalysisCard";
import { US_STATES } from "../usStates";
import { citiesByState } from "../citiesbyState_100";
import StressTestCard from "../components/StressTestCard";
import AuthModal from "../components/AuthModal";
import CashToCloseCard from "../components/CashToCloseCard";
import HoldSensitivityCard from "../components/HoldSensitivityCard";
import APRDefaultRiskCard from "../components/APRDefaultRiskCard";
import WorstCaseCard from "../components/WorstCaseCard";
import CityOpportunityCard from "../components/CityOpportunityCard";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";

const initialMessages = [
  {
    id: 1,
    sender: "ai",
    text: "Enter the deal details on the left and FlipBot will analyze the opportunity for you.",
    time: "Now",
  },
];

function formatCurrency(value) {
  if (value === "" || value === null || isNaN(value)) return "-";
  return `$${Number(value).toLocaleString()}`;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { user, credits } = useOutletContext();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const API_BASE = process.env.REACT_APP_API_BASE;

  const [messages, setMessages] = useState(initialMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [showDealPanel, setShowDealPanel] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode] = useState("login");
  const [uiMode, setUIMode] = useState("CARD_DEAL");
  const [lenderInsight] = useState(null);

  const [lastAnalyzedDeal, setLastAnalyzedDeal] = useState(() => {
    try {
      const saved = localStorage.getItem("flipbot_last_deal");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const messagesEndRef = useRef(null);

  const [deal, setDeal] = useState({
    transactionType: "purchase",
    loanProgram: "",
    address: "",
    city: "",
    state: "",
    purchasePrice: "",
    rehabBudget: "",
    arv: "",
    interestReserves: "",
    creditScore: "",
    existingLoanBalance: "",
    experienceLevel: "",
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const formatNumber = (value) => {
    if (!value) return "";
    const numeric = value.replace(/,/g, "");
    if (isNaN(numeric)) return "";
    return Number(numeric).toLocaleString();
  };

  const unformatNumber = (value) => value.replace(/,/g, "");

  useEffect(() => {
    if (lastAnalyzedDeal) {
      localStorage.setItem(
        "flipbot_last_deal",
        JSON.stringify(lastAnalyzedDeal)
      );
    }
  }, [lastAnalyzedDeal]);

  useEffect(() => {
    localStorage.setItem("flipbot_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    if (!sessionId || !user?.id) return;

    const loadSession = async () => {
      try {
        setIsThinking(true);

        const res = await fetch(
          `${API_BASE}/api/deal-sessions/${sessionId}/messages`
        );

        const data = await res.json();

        const restoredMessages = data.messages.map((m) => {
          if (m.sender === "assistant" && typeof m.content === "object") {
            return {
              id: m.id,
              sender: "ai",
              data: m.content,
            };
          }

          return {
            id: m.id,
            sender: m.sender === "user" ? "user" : "ai",
            text:
              typeof m.content === "string"
                ? m.content
                : JSON.stringify(m.content),
          };
        });

        setMessages(
          restoredMessages.length ? restoredMessages : initialMessages
        );
      } catch (err) {
        console.error("Failed to load deal session", err);
      } finally {
        setIsThinking(false);
      }
    };

    loadSession();
  }, [sessionId, user?.id, API_BASE]);

  const pushDealCard = (analysis, dealContext) => {
    const normalizedDeal = {
      ...dealContext,
      userId: dealContext.userId || user?.id,
      city:
        dealContext.city ||
        dealContext.property?.city ||
        analysis?.property?.city ||
        "",
      state:
        dealContext.state ||
        dealContext.property?.state ||
        analysis?.property?.state ||
        "",
    };

    setLastAnalyzedDeal(normalizedDeal);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "ai",
        data: analysis,
      },
    ]);
  };

  const handleDealChange = (e) => {
    const { name, value } = e.target;

    const numericFields = [
      "purchasePrice",
      "rehabBudget",
      "arv",
      "existingLoanBalance",
      "interestReserves",
      "creditScore",
    ];

    if (numericFields.includes(name)) {
      const clean = unformatNumber(value);
      if (!/^\d*$/.test(clean)) return;

      setDeal((prev) => ({
        ...prev,
        [name]: clean,
      }));
    } else {
      setDeal((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDealSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      setAuthOpen(true);
      return;
    }

    if (credits !== null && credits <= 0) {
      navigate("/pricing-plans");
      return;
    }

    if (!deal.purchasePrice || !deal.arv) {
      alert("Please at least enter Purchase Price and ARV.");
      return;
    }

    if (!deal.loanProgram) {
      alert("Please select a loan program.");
      return;
    }

    const userText = `Analyze this deal:
- Address: ${deal.address || "N/A"}
- City: ${deal.city || "N/A"}
- State: ${deal.state || "N/A"}
- Purchase: ${formatCurrency(deal.purchasePrice)}
- Rehab: ${formatCurrency(deal.rehabBudget)}
- ARV: ${formatCurrency(deal.arv)}
- Loan program: ${deal.loanProgram || "not specified"}
- Experience: ${deal.experienceLevel || "not specified"}`;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: userText, time: "Just now" },
    ]);

    setIsThinking(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "deal",
          deal: {
            ...deal,
            userId: user?.id,
          },
        }),
      });

      const data = await res.json();

      if (data.uiMode === "UPSELL") {
        navigate("/pricing-plans");
        return;
      }

      if (data.uiMode) {
        setUIMode(data.uiMode);
      }

      pushDealCard(data.response, {
        ...deal,
        userId: user?.id,
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "ai",
          text: "I couldn’t analyze the deal. Make sure the backend is running.",
          time: "Just now",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleNewDeal = () => {
    setUIMode("CARD_DEAL");
    setLastAnalyzedDeal(null);
    setMessages(initialMessages);

    setDeal({
      transactionType: "purchase",
      loanProgram: "",
      address: "",
      city: "",
      state: "",
      purchasePrice: "",
      rehabBudget: "",
      arv: "",
      interestReserves: "",
      creditScore: "",
      existingLoanBalance: "",
      experienceLevel: "",
    });

    localStorage.removeItem("flipbot_messages");
    localStorage.removeItem("flipbot_last_deal");
  };

  return (
    <div className="chat-page">
      <div className={`chat-shell ${showDealPanel ? "show-deal" : ""}`}>
        <aside className="deal-panel">
          <header className="deal-header">
            <h1>Deal Analyzer</h1>
          </header>

          <form className="deal-form" onSubmit={handleDealSubmit}>
            <div className="deal-form-section">
              <div className="deal-row-pill">
                <span className="deal-label">Address</span>
                <input
                  name="address"
                  value={deal.address}
                  onChange={handleDealChange}
                  placeholder="123 Main St"
                />
              </div>

              <div className="deal-row-pill">
                <span className="deal-label">State</span>
                <select
                  name="state"
                  value={deal.state}
                  onChange={(e) => {
                    const state = e.target.value;
                    setDeal((prev) => ({
                      ...prev,
                      state,
                      city: "",
                    }));
                  }}
                >
                  <option value="">Select State</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="deal-row-pill">
                <span className="deal-label">City</span>
                <select
                  name="city"
                  value={deal.city}
                  onChange={handleDealChange}
                  disabled={!deal.state}
                >
                  <option value="">
                    {deal.state ? "Select City" : "Select State First"}
                  </option>

                  {deal.state &&
                    citiesByState[deal.state]
                      ?.slice()
                      .sort()
                      .map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                </select>
              </div>
            </div>

            <div className="deal-form-section">
              <div className="deal-row-pill">
                <span className="deal-label">Purchase Price</span>
                <input
                  name="purchasePrice"
                  value={formatNumber(deal.purchasePrice)}
                  onChange={handleDealChange}
                  placeholder="500,000"
                />
              </div>

              <div className="deal-row-pill">
                <span className="deal-label">Rehab Budget</span>
                <input
                  name="rehabBudget"
                  value={formatNumber(deal.rehabBudget)}
                  onChange={handleDealChange}
                  placeholder="75,000"
                />
              </div>

              <div className="deal-row-pill">
                <span className="deal-label">ARV</span>
                <input
                  name="arv"
                  value={formatNumber(deal.arv)}
                  onChange={handleDealChange}
                  placeholder="650,000"
                />
              </div>

              <div className="deal-row-pill">
                <span className="deal-label">Amount Owed</span>
                <input
                  name="existingLoanBalance"
                  value={formatNumber(deal.existingLoanBalance)}
                  onChange={handleDealChange}
                  placeholder="3,500,000"
                  disabled={deal.transactionType === "purchase"}
                />
              </div>
            </div>

            <div className="deal-form-section">
              <div className="deal-row-pill">
                <span className="deal-label">Loan Type</span>
                <select
                  name="transactionType"
                  value={deal.transactionType}
                  onChange={handleDealChange}
                >
                  <option value="purchase">Purchase</option>
                  <option value="refinance">Refinance</option>
                </select>
              </div>

              <div className="deal-row-pill">
                <span className="deal-label">Loan Program</span>
                <select
                  name="loanProgram"
                  value={deal.loanProgram}
                  onChange={handleDealChange}
                >
                  <option value="">Select</option>
                  <option value="fix_and_flip">Fix & Flip</option>
                  <option value="ground_up">Ground-Up</option>
                  <option value="cash_out_refi">Cash-Out Refi</option>
                </select>
              </div>

              <div className="deal-row-pill">
                <span className="deal-label">Credit Score</span>
                <input
                  name="creditScore"
                  value={deal.creditScore}
                  onChange={handleDealChange}
                  placeholder="730"
                />
              </div>

              <div className="deal-row-pill">
                <span className="deal-label">Experience</span>
                <select
                  name="experienceLevel"
                  value={deal.experienceLevel}
                  onChange={handleDealChange}
                >
                  <option value="">Select</option>
                  <option value="beginner">0–2 flips</option>
                  <option value="intermediate">3–10 flips</option>
                  <option value="pro">10+ flips</option>
                </select>
              </div>

              <div className="deal-row-pill">
                <span className="deal-label">Cash Reserves</span>
                <input
                  name="interestReserves"
                  value={formatNumber(deal.interestReserves)}
                  onChange={handleDealChange}
                  placeholder="100,000"
                />
              </div>
            </div>

            <button type="submit" className="primary-btn" disabled={isThinking}>
              {isThinking ? "Analyzing..." : "Analyze Deal"}
            </button>
          </form>
        </aside>

        <main className="chat-panel">
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "0.75rem",
              gap: "0.75rem",
            }}
          >
            <button
              className="secondary-btn"
              onClick={() => setShowDealPanel((prev) => !prev)}
            >
              {showDealPanel ? "Hide Deal Assumptions" : "Deal Assumptions"}
            </button>

            <button className="secondary-btn" onClick={handleNewDeal}>
              + New Deal
            </button>

            <AuthModal
              open={authOpen}
              mode={authMode}
              onClose={() => setAuthOpen(false)}
            />
          </div>

          {uiMode === "INSIGHT_LENDER" && lenderInsight && (
            <LenderInsightCard insight={lenderInsight} />
          )}

          <section className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.sender === "user"
                    ? "message-bubble message-user"
                    : "message-bubble message-ai"
                }
              >
                <strong
                  className={
                    msg.sender === "user"
                      ? "chat-sender-user"
                      : "chat-sender-ai"
                  }
                >
                  {msg.sender === "user" ? (
                    "You"
                  ) : (
                    <>
                      <span className="chat-sender-flip">Flip</span>
                      <span className="chat-sender-bot">Bot</span>
                    </>
                  )}
                </strong>

                {msg.type === "hold_sensitivity" && (
                  <HoldSensitivityCard data={msg.payload} />
                )}

                {msg.type === "apr_risk" && (
                  <APRDefaultRiskCard data={msg.payload} />
                )}

                {msg.type === "city_opportunity" && (
                  <CityOpportunityCard data={msg.payload} />
                )}

                {msg.type === "worst_case" && (
                  <WorstCaseCard data={msg.payload} />
                )}

                {msg.type === "find_lenders" && (
                  <LenderResultsGrid results={msg.payload} />
                )}

                {msg.type === "stress_test" && (
                  <StressTestCard data={msg.payload} />
                )}

                {msg.type === "cash_to_close" && (
                  <CashToCloseCard data={msg.payload} />
                )}

                {msg.type === "dscr" && (
                  <DSCRAnalysisCard analysis={msg.payload} />
                )}

                {msg.data && <DealAnalysisCard analysis={msg.data} />}

                {!msg.type && !msg.data && <p>{msg.text}</p>}
              </div>
            ))}

            {isThinking && (
              <div className="message-bubble message-ai thinking-bubble">
                <strong className="chat-sender-ai">
                  <span className="chat-sender-flip">Flip</span>
                  <span className="chat-sender-bot">Bot</span>
                </strong>

                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;