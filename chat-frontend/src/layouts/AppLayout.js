import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const AppLayout = ({ requiresAuth = false }) => {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("free");
  const [credits, setCredits] = useState(null);
  const [stripeCustomerId, setStripeCustomerId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    supabase
      .from("profiles")
      .select("plan, credits_remaining, stripe_customer_id")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Profile load error:", error);
          return;
        }
        if (data) {
          setPlan(data.plan);
          setCredits(data.credits_remaining);
          setStripeCustomerId(data.stripe_customer_id);
        }
      });
  }, [user]);

  const isLoggedIn = !!user?.id;

  return (
    <>
      {!isLoggedIn && <Header user={user} plan={plan} credits={credits} />}

      <div className="app-shell" style={{ display: "flex" }}>
        {isLoggedIn && <Sidebar userId={user.id} />}

        <main
          className="app-main"
          style={{
            marginLeft: 0,
            flex: 1,
          }}
        >
          <Outlet
            context={{
              user,
              plan,
              credits,
              stripeCustomerId,
            }}
          />
        </main>
      </div>
    </>
  );
};

export default AppLayout;