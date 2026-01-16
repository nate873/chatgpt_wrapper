// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import RegisterPage from "./pages/RegisterPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import ContactPage from "./pages/ContactPage";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PricingPlans from "./pages/PricingPlans";
import About from "./pages/About";
import AffiliateProgram from "./pages/AffiliateProgram";

// ✅ NEW
import AppLayout from "./layouts/AppLayout";

function App() {
  return (
    <Routes>
      {/* PUBLIC — NO LAYOUT */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* PUBLIC — WITH APP LAYOUT */}
      <Route element={<AppLayout />}>
        <Route path="/about" element={<About />} />
        <Route path="/affiliate-program" element={<AffiliateProgram />} />
        <Route path="/pricing-plans" element={<PricingPlans />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      {/* 🔒 PROTECTED — STILL PROTECTED */}
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

      {/* FALLBACK */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
