import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";

const AdminRoute = ({ children }) => {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const {
          data: { user },
          error: authError
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (mounted) setAllowed(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Admin check failed:", error);
          if (mounted) setAllowed(false);
          return;
        }

        if (mounted) setAllowed(Boolean(data?.is_admin));
      } catch (err) {
        console.error("AdminRoute error:", err);
        if (mounted) setAllowed(false);
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  /* ===== Loading state ===== */
  if (allowed === null) {
    return (
      <div style={{ padding: "2rem", color: "#9ca3af" }}>
        Checking permissions…
      </div>
    );
  }

  /* ===== Not allowed ===== */
  if (!allowed) {
    return <Navigate to="/provider" replace />;
  }

  /* ===== Allowed ===== */
  return children;
};

export default AdminRoute;
