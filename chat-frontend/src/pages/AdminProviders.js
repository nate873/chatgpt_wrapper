import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AdminProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProviders = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          is_provider,
          provider_approved,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (!error) setProviders(data || []);
      setLoading(false);
    };

    loadProviders();
  }, []);

  const approveProvider = async (id) => {
    await supabase
      .from("profiles")
      .update({ provider_approved: true })
      .eq("id", id);

    setProviders((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, provider_approved: true } : p
      )
    );
  };

  if (loading) return <p>Loading providers…</p>;

  return (
    <div style={{ padding: "40px", color: "#e5e7eb" }}>
      <h1>Providers</h1>
      <p style={{ color: "#9ca3af", marginBottom: 24 }}>
        View all users who have listed properties.
      </p>

      <table width="100%" cellPadding="10">
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
            <th>Email</th>
            <th>Provider</th>
            <th>Approved</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {providers.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #222" }}>
              <td>{p.email}</td>
              <td>{p.is_provider ? "Yes" : "No"}</td>
              <td>{p.provider_approved ? "✅" : "❌"}</td>
              <td>
                {!p.provider_approved && (
                  <button
                    onClick={() => approveProvider(p.id)}
                    style={{
                      background: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      cursor: "pointer"
                    }}
                  >
                    Approve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminProviders;
