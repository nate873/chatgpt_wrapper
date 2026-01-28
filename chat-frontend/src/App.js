// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

// PUBLIC PAGES
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import About from "./pages/About";
import AffiliateProgram from "./pages/AffiliateProgram";
import PricingPlans from "./pages/PricingPlans";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";

// APP PAGES
import ChatPage from "./pages/ChatPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import OffMarketProperties from "./pages/OffMarketProperties";

// LAYOUT + PROTECTION
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// FALLBACK
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      {/* ================= PUBLIC (NO LAYOUT) ================= */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ================= PUBLIC (WITH APP LAYOUT) ================= */}
      <Route element={<AppLayout />}>
        <Route path="/about" element={<About />} />
        <Route path="/affiliate-program" element={<AffiliateProgram />} />
        <Route path="/pricing-plans" element={<PricingPlans />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/off-market" element={<OffMarketProperties />} />
      </Route>

      {/* ================= PROTECTED (AUTH REQUIRED) ================= */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;