import React, { useState, useEffect, useRef } from "react";
import "./ChatPage.css";
import DealAnalysisCard from "../components/DealAnalysisCard";
import Header from "../components/Header";
import LenderInsightCard from "../components/LenderInsightCard";
import LenderResultsGrid from "../components/LenderResultsGrid";
import DSCRAnalysisCard from "../components/DSCRAnalysisCard";
import { supabase } from "../supabaseClient";
import { US_STATES } from "../usStates";
import { citiesByState} from "../citiesbyState_100";
import StressTestCard from "../components/StressTestCard";
import AuthModal from "../components/AuthModal";
import Sidebar from "../components/Sidebar";
import CashToCloseCard from "../components/CashToCloseCard";
import HoldSensitivityCard from "../components/HoldSensitivityCard";
import APRDefaultRiskCard from "../components/APRDefaultRiskCard";
import WorstCaseCard from "../components/WorstCaseCard";
import CityOpportunityCard from "../components/CityOpportunityCard";
import ActionBar from "../components/ActionBar";
import { useNavigate } from "react-router-dom";


const initialMessages = [
  {
    id: 1,
    sender: "ai",
    text: "Share your fix & flip deal. will estimate loan terms (rate, points, LTV) and projected profit, then tell you if it looks like a good deal.",
    time: "Now",
  },
];

function formatCurrency(value) {
  if (value === "" || value === null || isNaN(value)) return "-";
  return `$${Number(value).toLocaleString()}`;
}



const ChatPage = () => {
    const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [freeformInput, setFreeformInput] = useState("");
  const [showDealPanel, setShowDealPanel] = useState(false);
  const [lastAnalyzedDeal, setLastAnalyzedDeal] = useState(null);
  const [uiMode, setUIMode] = useState("CHAT");
  const [lenderInsight] = useState(null);  
  const [pendingField, setPendingField] = useState(null);
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(null);
  const [plan, setPlan] = useState("free");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [activeAction, setActiveAction] = useState(null);
  const API_BASE = "https://chatgptwrapper-production.up.railway.app";
const runAction = async (action, overrideDeal = null) => {
  if (credits !== null && credits <= 0) {
    navigate("/pricing-plans");
    return;
  }


  const dealPayload = overrideDeal || lastAnalyzedDeal;

  if (!dealPayload && action !== "city_opportunity") {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: "ai",
        text: "Please analyze a deal first.",
      },
    ]);
    return;
  }

  setIsThinking(true);

  try {
   const res = await fetch(
  "https://chatgptwrapper-production.up.railway.app/api/chat",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "action",
      action,
      deal: {
        ...dealPayload,
        userId: user?.id,
      },
    }),
  }
);

    const data = await res.json();

    if (data.pendingField) {
      setPendingField(data.pendingField);
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: "ai", text: data.response },
      ]);
      return;
    }

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: "ai",
        type: action,
        payload: data.response,
      },
    ]);
  } catch (err) {
    console.error("Action failed:", err);
  } finally {
    setIsThinking(false);
  }
};

 const pushDealCard = (analysis, dealContext) => {
  const normalizedDeal = {
    ...dealContext,
    userId: dealContext.userId || user?.id, // 🔑 FIX
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


  setMessages(prev => [
    ...prev,
    {
      id: Date.now(),
      sender: "ai",
      data: analysis,
    },
  ]);
};


  const messagesEndRef = useRef(null);

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

const unformatNumber = (value) =>
  value.replace(/,/g, "");


useEffect(() => {
  scrollToBottom();
}, [messages, isThinking]);

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    setUser(data?.user ?? null);
  });
}, []);
useEffect(() => {
  if (!user?.id) return;

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("credits_remaining, plan")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setCredits(data.credits_remaining);
      setPlan(data.plan); // 🔥 THIS WAS MISSING
    }
  };

  loadProfile();
}, [user]);



  // Existing deal form state (keep this)
  const [deal, setDeal] = useState({
   transactionType: "",
    loanProgram: "",
  address: "",
  city: "",
  state: "",
  purchasePrice: "",
  rehabBudget: "",
  arv: "",
  interestReserves: "",   // 👈 ADD THIS
  creditScore: "",
  existingLoanBalance: "",
  experienceLevel: "",
});

  // ✅ Intake states (ONLY declare once)
  const [intakeDeal, setIntakeDeal] = useState({});
  const [intakeActive, setIntakeActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // ✅ IMPORTANT: define startIntake BEFORE useEffect (or use function declaration)
  const startIntake = async (updatedDeal = {}) => {
  if (!user?.id) {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: "ai",
        text: "Please log in to analyze a deal.",
      },
    ]);
    return;
  }

  setIsThinking(true);

  try {
    const res = await fetch(`${API_BASE}/api/intake`, {

  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    deal: {
      ...updatedDeal,
      userId: user.id,
    },
  }),
});

    const data = await res.json();
    

     
     
// 🔥 SAVE DEAL CONTEXT
// Intake finished → render analysis
if (data.complete) {
  setIntakeActive(false);

pushDealCard(
  data.response,
  {
    ...updatedDeal,
    ...data.response, // 🔥 persist computed terms for follow-ups
  }
);

return;
}

// Otherwise → ask next question

      // Ask next question
setCurrentQuestion({
  field: data.field,
  question: data.question,
  options: data.options,
});      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "ai", text: data.question, time: "Just now" },
      ]);
    } catch (err) {
      console.error("Intake error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "ai",
          text: "Intake failed. Make sure the backend supports mode: intake.",
          time: "Just now",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleIntakeAnswer = (value) => {
  if (!currentQuestion) return;

 let normalizedValue = value;

if (currentQuestion.field === "experienceLevel") {
  if (value === "0" || value === "1" || value === "2") {
    normalizedValue = "beginner";
  } else if (value.includes("3") || value.includes("10")) {
    normalizedValue = "intermediate";
  } else if (value.includes("+") || value.includes("10+")) {
    normalizedValue = "pro";
  }
}

const updatedDeal = {
  ...intakeDeal,
  [currentQuestion.field]: normalizedValue,
  userId: user?.id,
};

  setIntakeDeal(updatedDeal);

  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: value },
  ]);

  startIntake(updatedDeal);
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
    // Strip commas before saving
    const clean = unformatNumber(value);
    if (!/^\d*$/.test(clean)) return; // allow numbers only

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
    

    if (!deal.purchasePrice || !deal.arv) {
      alert("Please at least enter Purchase Price and ARV.");
      return;
    }

     if (!deal.loanProgram) {
    alert("Please select a loan program.");
    return;
  }

    const userText = `Analyze this fix & flip deal:
- Address: ${deal.address || "N/A"}
- Purchase: ${formatCurrency(deal.purchasePrice)}
- Rehab: ${formatCurrency(deal.rehabBudget)}
- ARV: ${formatCurrency(deal.arv)}
- Loan program: ${deal.loanProgram || "not specified"}
- Experience: ${deal.experienceLevel}`;

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
     })
      });

      const data = await res.json();

/* ===============================
   🚨 STEP 4: UPSELL GUARD
   =============================== */
if (data.uiMode === "UPSELL") {
  navigate("/pricing-plans");
  return;
}


/* ===============================
   NORMAL DEAL RESPONSE
   =============================== */
if (data.uiMode) {
  setUIMode(data.uiMode);
}

pushDealCard(
  data.response,
  {
    ...deal,
    ...data.response,
  }
);

    } catch {
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

  // ===============================
// 🔢 DSCR ACTION RUNNER
// ===============================
const runDSCR = async (updatedDeal) => {
  try {
    setIsThinking(true);

    const res = await fetch(`${API_BASE}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    mode: "action",
    action: "refi_dscr",
    deal: {
      ...updatedDeal,
      userId: user?.id,
    },
  })
});

const data = await res.json();

    // Ask for missing inputs (rent, city, etc.)
    if (data.pendingField) {
      setPendingField(data.pendingField);

      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: "ai",
          text: data.response,
        },
      ]);

      return;
    }
   
    // Render DSCR card
    if (data.uiMode === "CHAT_DSCR") {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: "ai",
          type: "dscr",
          payload: data.response,
        },
      ]);
    }
  } catch (err) {
    console.error("DSCR error:", err);
  } finally {
    setIsThinking(false);
  }
};

const handleFreeformSubmit = async (e) => {
  e.preventDefault();
  if (!freeformInput.trim()) return;

  const userText = freeformInput;
  const lower = userText.toLowerCase();
  
if (
  lower.includes("stress") ||
  lower.includes("what if") ||
  lower.includes("downside")
) {
  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: userText },
  ]);

  runAction("stress_test");   // ✅ SINGLE LINE
  setFreeformInput("");
  return;
}


// ===============================
// ☠️ WORST CASE SCENARIO
// ===============================
if (
  lower.includes("worst") ||
  lower.includes("worst case") ||
  lower.includes("downside scenario") ||
  lower.includes("disaster") ||
  lower.includes("what could go wrong")
) {
  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: userText },
  ]);

  if (!lastAnalyzedDeal) {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: "ai",
        text: "I need to analyze the deal first before running a worst-case scenario.",
      },
    ]);
    setFreeformInput("");
    return;
  }

  runAction("worst_case");
setFreeformInput("");
return;
}
// ===============================
// 🌆 CITY OPPORTUNITY ANALYSIS
// ===============================
if (
  lower.includes("city") ||
  lower.includes("market like") ||
  lower.includes("good market") ||
  lower.includes("invest in") ||
  lower.includes("is this city good")
) {
  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: userText },
  ]);

  if (!lastAnalyzedDeal?.city && !deal.city) {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: "ai",
        text: "Which city would you like me to analyze?",
      },
    ]);
    setFreeformInput("");
    return;
  }

  const city = lastAnalyzedDeal?.city || deal.city;
  const state = lastAnalyzedDeal?.state || deal.state;

  runAction("city_opportunity", { city, state });
setFreeformInput("");
return;

}


if (
  lower.includes("apr") ||
  lower.includes("default") ||
  lower.includes("extension") ||
  lower.includes("true cost") ||
  lower.includes("interest risk")
) {
  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: userText },
  ]);

  runAction("apr_risk");
return;

}

// ===============================
// 💵 CASH TO CLOSE / OUT OF POCKET
// ===============================
if (
  lower.includes("cash to close") ||
  lower.includes("out of pocket") ||
  lower.includes("closing costs") ||
  lower.includes("bring to closing")
) {
  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: userText },
  ]);

  if (!lastAnalyzedDeal) {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: "ai",
        text: "I need to analyze the deal first before calculating cash to close.",
      },
    ]);
    setFreeformInput("");
    return;
  }

  runAction("cash_to_close");
setFreeformInput("");
return;
}
// ===============================
// ⏱ HOLD TIME SENSITIVITY
// ===============================
if (
  lower.includes("hold") ||
  lower.includes("timeline") ||
  lower.includes("how long") ||
  lower.includes("extra month")
) {
  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: userText },
  ]);

  if (!lastAnalyzedDeal) {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: "ai",
        text: "I need to analyze the deal first to run a hold-time sensitivity.",
      },
    ]);
    return;
  }

  runAction("hold_sensitivity");
return;

}





  /* ===============================
     1️⃣ START INTAKE (NEW DEAL)
     =============================== */
  /* ===============================
   1️⃣ START INTAKE (NEW DEAL)
   =============================== */
const wantsDealAnalysis =
  lower.includes("i have a deal") ||
  lower.includes("analyze this deal") ||
  lower.includes("run numbers") ||
  lower.includes("estimate this") ||
  lower.includes("underwrite");

if (
  wantsDealAnalysis &&
  !intakeActive &&
  !lastAnalyzedDeal
) {
  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: userText },
  ]);

  setFreeformInput("");
  setIntakeActive(true);
  setIntakeDeal({});

  if (!user?.id) {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: "ai",
        text: "Please log in to analyze a deal.",
      },
    ]);
    return;
  }

  startIntake({});
  return;
}

  /* ===============================
     2️⃣ FOLLOW-UP ACTIONS
     =============================== */
  if (lastAnalyzedDeal) {
    let action = null;

    if (lower.includes("lender")) action = "find_lenders";
    
    if (lower.includes("dscr")) action = "refi_dscr";

      if (action === "refi_dscr") {
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: "user", text: userText },
    ]);

    setFreeformInput("");
    setIsThinking(true);

    try {
    const res = await fetch(`${API_BASE}/api/chat`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  mode: "action",
  action: "refi_dscr",
  deal: {
    ...lastAnalyzedDeal,
    userId: user?.id,
  },
})

      });

      const data = await res.json();
      // 🔑 HANDLE MISSING INPUT (monthly rent, city, etc)
if (data.pendingField) {
  setPendingField(data.pendingField);

  setMessages(prev => [
    ...prev,
    {
      id: Date.now(),
      sender: "ai",
      text: data.response,
    },
  ]);

  return;
}

      if (data.uiMode === "CHAT_DSCR") {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: "ai",
            type: "dscr",
            payload: data.response,
          },
        ]);
        return;
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }

    return;
  }
     
    if (action === "find_lenders") {
  const city = lastAnalyzedDeal.city || deal.city;
  const state = lastAnalyzedDeal.state || deal.state;

  if (!city) {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: "ai",
        text: "What city is the property in?",
      },
    ]);
    return;
  }

  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: userText },
  ]);

  runAction("find_lenders", {
    ...lastAnalyzedDeal,
    city,
    state,
  });

  setFreeformInput("");
  return;
}

  }

  /* ===============================
     3️⃣ NORMAL CHAT
     =============================== */
  setMessages(prev => [
    ...prev,
    { id: Date.now(), sender: "user", text: userText },
  ]);

  setFreeformInput("");
  setIsThinking(true);

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  mode: "chat",
  message: userText,
  deal: {
    ...lastAnalyzedDeal,
    userId: user?.id,
  },
})

    });

   const data = await res.json();

if (data.uiMode === "CARD_DEAL") {
  setMessages(prev => [
    ...prev,
    {
      id: Date.now() + 1,
      sender: "ai",
      data: data.response,
    },
  ]);
  return;
}

if (data.uiMode === "CHAT_DSCR") {
  setMessages(prev => [
    ...prev,
    {
      id: Date.now() + 1,
      sender: "ai",
      type: "dscr",
      payload: data.response,
    },
  ]);
  return;
}

// fallback = normal chat
setMessages(prev => [
  ...prev,
  {
    id: Date.now() + 1,
    sender: "ai",
    text: data.response,
  },
]);

  } catch (err) {
    console.error(err);
  } finally {
    setIsThinking(false);
  }
};


// ⛔ STOP HERE

  
 return (
  <div className="chat-page">
<Header user={user} plan={plan} credits={credits} />

    <div className={`chat-shell ${showDealPanel ? "show-deal" : ""}`}>

      {/* APP SIDEBAR (NEW) */}
   <Sidebar
  loggedIn={!!user}
  onLoginClick={() => {
    setAuthMode("login");
    setAuthOpen(true);
  }}
  onRegisterClick={() => {
    setAuthMode("register");
    setAuthOpen(true);
  }}
  onLogoutClick={async () => {
    await supabase.auth.signOut();
    setUser(null);
  }}
/>


      {/* DEAL ANALYZER */}
      <aside className="deal-panel">
        <header className="deal-header">
          <h1>Deal Analyzer</h1>
          
        </header>

{!intakeActive && (
  <div style={{ marginBottom: "0.75rem" }}>
    
  </div>
)}

<form className="deal-form" onSubmit={handleDealSubmit}>

  {/* ================= PROPERTY ================= */}
  <div className="deal-form-section">

   <div className="deal-row-pill">
  <span className="deal-label">State</span>
  <select
    name="state"
    value={deal.state}
    onChange={(e) => {
      const state = e.target.value;
      setDeal(prev => ({
        ...prev,
        state,
        city: "", // reset city when state changes
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

  {/* ================= FINANCIALS ================= */}
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
    disabled={deal.transactionType === "purchase"} // 👈 optional UX win
  />
</div>

  </div>

  {/* ================= LOAN ================= */}
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

  {/* ================= CTA ================= */}
  <button
    type="submit"
    className="primary-btn"
    disabled={isThinking}
  >
    {isThinking ? "Analyzing..." : "Analyze Deal"}
  </button>

</form>

   </aside>

      {/* CHAT PANEL */}
      <main className="chat-panel">
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "0.75rem",
          }}
        >
          <button
            className="secondary-btn"
            onClick={() => setShowDealPanel((prev) => !prev)}
          >
            {showDealPanel ? "Hide Deal Assumptions" : "Deal Assumptions"}
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
      <strong className={msg.sender === "user" ? "chat-sender-user" : "chat-sender-ai"}>
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

  {/* ✅ THINKING BUBBLE GOES HERE */}
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

  {/* ✅ SCROLL ANCHOR LAST */}
  <div ref={messagesEndRef} />
</section>

<ActionBar
  hasDeal={!!lastAnalyzedDeal}
  disabled={isThinking}
  activeAction={activeAction}
  onAnalyze={() => {
  setActiveAction(null);
  setLastAnalyzedDeal(null);
  setMessages(initialMessages);
  setShowDealPanel(true);
  setIntakeDeal({});
  setIntakeActive(false);
}}

  onRunAction={(action) => {
    setActiveAction(action);
    runAction(action);
  }}
/>

<footer className="chat-input-bar">

  <form
    onSubmit={(e) => {
      e.preventDefault();

      if (pendingField) {
  const updatedDeal = {
    ...lastAnalyzedDeal,
    [pendingField]: freeformInput,
  };

  setLastAnalyzedDeal(updatedDeal);
  setPendingField(null);
  setFreeformInput("");

  runDSCR(updatedDeal);
return;

}


      if (intakeActive && currentQuestion) {
  handleIntakeAnswer(freeformInput);
} else {
  handleFreeformSubmit(e);
}

setFreeformInput("");

    }}
  >
    <textarea
      placeholder="Ask something like: What if my rehab goes 10% over budget?"
      rows={2}
      value={freeformInput}
      onChange={(e) => setFreeformInput(e.target.value)}
      disabled={isThinking && !intakeActive}
    />

    <button
      type="submit"
      className="secondary-btn"
      disabled={(isThinking && !intakeActive) || !freeformInput.trim()}
    >
        →
    </button>
  </form>
</footer>

     </main>
    </div>
  </div>
);
};

export default ChatPage;



