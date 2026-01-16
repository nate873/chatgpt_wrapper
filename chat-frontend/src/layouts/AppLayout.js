import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "./AppLayout.css";

const AppLayout = () => {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("free");
  const [credits, setCredits] = useState(null);

  // Load auth user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

  // Load profile data
  useEffect(() => {
    if (!user?.id) return;

    supabase
      .from("profiles")
      .select("plan, credits_remaining")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPlan(data.plan);
          setCredits(data.credits_remaining);
        }
      });
  }, [user]);

  return (
    <>
      <Header user={user} plan={plan} credits={credits} />

      <div className="app-shell">
        <Sidebar
          loggedIn={!!user}
          onLogoutClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
          }}
        />

        <main className="app-main">
          <Outlet context={{ user, plan, credits }} />
        </main>
      </div>
    </>
  );
};

export default AppLayout;
