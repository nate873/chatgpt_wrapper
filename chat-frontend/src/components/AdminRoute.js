import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";

const AdminRoute = ({ children }) => {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setAllowed(false);

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      setAllowed(!!data?.is_admin);
    };

    checkAdmin();
  }, []);

  if (allowed === null) return null; // loading
  if (!allowed) return <Navigate to="/" />;

  return children;
};

export default AdminRoute;