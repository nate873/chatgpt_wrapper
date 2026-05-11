import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ChatPage.css";
import { saveProperty } from "./Saved";

const API_BASE = "flipbot.io";

const DISTRESS_TYPES = [
  "All Types",
  "Mortgage Foreclosure",
  "HOA Lien",
  "Tax Delinquent",
  "Contractor Lien",
  "Code / Contractor Lien",
  "Timeshare Foreclosure",
];


const SAVE_BTN = {
  fontSize: 12,
  padding: "6px 14px",
  borderRadius: 6,
  cursor: "pointer",
  background: "#fff",
  color: "#185fa5",
  border: "0.5px solid #b5d4f4",
  fontWeight: 500,
};

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "Choose a tool to get started." },
  ]);

  const [mode, setMode] = useState("analyze");

  const [deal, setDeal] = useState({
    fullAddress: "",
    purchasePrice: "",
    rehabBudget: "",
  });

  const [landSearch, setLandSearch] = useState({
    zipCode: "",
    city: "",
    state: "",
    address: "",
    radius: "",
    propertyType: "Land",
    minLotSize: "",
    maxLotSize: "",
    limit: "25",
    offset: "0",
    includeListings: true,
    listingLimit: "25",
  });

  const [distressSearch, setDistressSearch] = useState({
    query: "",
    zip_code: "",
    city: "",
    distress_type: "All Types",
    limit: "50",
  });

  const [finOverrides, setFinOverrides] = useState({
    holdMonths: "12",
    vacancyRate: "5",
    expenseRate: "35",
    saleClosingCostPct: "6",
    riskFreeRate: "4.5",
    beta: "0.7",
    marketReturn: "10",
    loanAmount: "",
    annualDebtService: "",
    equityValue: "",
    taxRate: "0",
  });

  const [activeResultTab, setActiveResultTab] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedDistressRow, setExpandedDistressRow] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const removeInjectedLoginText = () => {
      const bodyNodes = Array.from(document.body.childNodes);
      bodyNodes.forEach((node) => {
        if (
          node.nodeType === Node.TEXT_NODE &&
          typeof node.textContent === "string" &&
          node.textContent.includes("loggedIn=")
        ) {
          node.textContent = "";
        }
      });
    };
    removeInjectedLoginText();
    const observer = new MutationObserver(() => removeInjectedLoginText());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  const tools = useMemo(
    () => [
      {
        key: "analyze",
        title: "Deal Analysis",
        description: "Analyze a deal using address, purchase price, and rehab budget.",
        badge: "Primary",
        icon: "↗",
      },
      {
        key: "land",
        title: "Property Search",
        description: "Search vacant land and property opportunities with location filters.",
        badge: "Search",
        icon: "⌕",
      },
      {
        key: "distress",
        title: "Distress Search",
        description: "Find foreclosures, HOA liens, tax delinquent, and code violation properties.",
        badge: "New",
        icon: "⚑",
      },
    ],
    []
  );

  const showSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatNumber = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const numeric = String(value).replace(/,/g, "");
    if (Number.isNaN(Number(numeric))) return "";
    return Number(numeric).toLocaleString();
  };

  const unformatNumber = (value) => String(value).replace(/,/g, "");

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  };

  const formatPct = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    return `${Number(value).toFixed(2)}%`;
  };

  const formatCompactValue = (value, key = "") => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") {
      if (/(price|value|amount|arv|rent|budget|cost|basis|sale)/i.test(key)) {
        return formatCurrency(value);
      }
      return value.toLocaleString();
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return "—";
      if (value.every((item) => typeof item !== "object")) return value.join(", ");
      return `${value.length} item${value.length === 1 ? "" : "s"}`;
    }
    if (typeof value === "object") return "—";
    return String(value);
  };

  const titleCase = (text) =>
    String(text)
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  // ─── CSV helpers ──────────────────────────────────────────────────────────

  const escapeCSV = (v) => `"${String(v || "").replace(/"/g, '""')}"`;

  const downloadCSV = (headers, rows, filename) => {
    const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCSV).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Distress CSV export ──────────────────────────────────────────────────

  const exportDistressCSV = (results) => {
    const headers = [
      "doc_number", "recorded_date", "doc_type", "grantor", "grantees",
      "address", "city", "zip", "parcel_id", "distress_type", "flags", "ocpa_url",
    ];
    const rows = results.map((r) => [
      r.doc_number, r.recorded_date, r.doc_type, r.grantor, r.grantees,
      r.address, r.city, r.zip, r.parcel_id, r.distress_type,
      (r.flags || []).join("; "), r.ocpa_url,
    ]);
    downloadCSV(headers, rows, `distress_records_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // ─── Land / Property CSV export ───────────────────────────────────────────

  const exportLandCSV = (records) => {
    const headers = [
      "address", "city", "state", "zip", "county",
      "property_type", "lot_size_sqft", "square_footage", "year_built",
      "last_sale_date", "last_sale_price", "owner_names", "owner_type",
      "owner_occupied", "mailing_address", "parcel_id",
    ];
    const rows = records.map((r) => [
      r.formattedAddress || r.addressLine1,
      r.city, r.state, r.zipCode, r.county,
      r.propertyType, r.lotSize, r.squareFootage, r.yearBuilt,
      r.lastSaleDate, r.lastSalePrice,
      Array.isArray(r.ownerNames) ? r.ownerNames.join("; ") : (r.ownerNames || ""),
      r.ownerType,
      r.ownerOccupied != null ? (r.ownerOccupied ? "Yes" : "No") : "",
      r.mailingAddress, r.id,
    ]);
    downloadCSV(headers, rows, `property_search_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // ─── Change handlers ──────────────────────────────────────────────────────

  const handleDealChange = (e) => {
    const { name, value } = e.target;
    if (name === "purchasePrice" || name === "rehabBudget") {
      const clean = unformatNumber(value);
      if (!/^\d*$/.test(clean)) return;
      setDeal((prev) => ({ ...prev, [name]: clean }));
      return;
    }
    setDeal((prev) => ({ ...prev, [name]: value }));
  };

  const handleLandChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (
      ["radius", "minLotSize", "maxLotSize", "limit", "offset", "listingLimit"].includes(name)
    ) {
      const clean = unformatNumber(value);
      if (name === "radius") {
        if (!/^\d*\.?\d*$/.test(clean)) return;
      } else {
        if (!/^\d*$/.test(clean)) return;
      }
      setLandSearch((prev) => ({ ...prev, [name]: clean }));
      return;
    }
    if (type === "checkbox") {
      setLandSearch((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setLandSearch((prev) => ({ ...prev, [name]: value }));
  };

  const handleDistressChange = (e) => {
    const { name, value } = e.target;
    setDistressSearch((prev) => ({ ...prev, [name]: value }));
  };

  const handleFinOverrideChange = (e) => {
    const { name, value } = e.target;
    setFinOverrides((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Financial payload builder ────────────────────────────────────────────

  const buildFinancialPayload = (analyzeData, overrides) => {
    const ds = analyzeData?.deal_summary || {};
    const purchasePrice = ds.purchase_price || 0;
    const rehabBudget = ds.rehab_budget || 0;
    const totalBasis = ds.total_basis || purchasePrice + rehabBudget;
    const estimatedRent = ds.estimated_rent || 0;
    const estimatedValue = ds.estimated_value || 0;

    const holdMonths = Math.max(1, parseInt(overrides.holdMonths) || 12);
    const vacancyRate = parseFloat(overrides.vacancyRate) || 5;
    const expenseRate = parseFloat(overrides.expenseRate) || 35;
    const saleClosingCostPct = parseFloat(overrides.saleClosingCostPct) || 6;

    const effectiveMonthlyRent = estimatedRent * (1 - vacancyRate / 100);
    const annualEffectiveRent = effectiveMonthlyRent * 12;
    const noi = annualEffectiveRent * (1 - expenseRate / 100);
    const monthlyNetCashFlow = noi / 12;
    const saleProceeds = estimatedValue * (1 - saleClosingCostPct / 100);

    const cashFlows = Array.from({ length: holdMonths }, (_, i) => {
      const base = monthlyNetCashFlow;
      return i === holdMonths - 1 ? base + saleProceeds : base;
    });

    return {
      initial_investment: totalBasis,
      cash_flows: cashFlows,
      net_operating_income: noi,
      risk_free_rate: parseFloat(overrides.riskFreeRate) || 4.5,
      beta: parseFloat(overrides.beta) || 0.7,
      market_return: parseFloat(overrides.marketReturn) || 10,
      loan_amount: overrides.loanAmount ? parseFloat(overrides.loanAmount) : undefined,
      annual_debt_service: overrides.annualDebtService
        ? parseFloat(overrides.annualDebtService)
        : undefined,
      equity_value: overrides.equityValue ? parseFloat(overrides.equityValue) : undefined,
      tax_rate: parseFloat(overrides.taxRate) || 0,
    };
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Distress search ──────────────────────────────────────────────────────
    if (mode === "distress") {
      const payload = {
        query: distressSearch.query.trim() || undefined,
        zip_code: distressSearch.zip_code.trim() || undefined,
        city: distressSearch.city.trim() || undefined,
        distress_type:
          distressSearch.distress_type === "All Types"
            ? undefined
            : distressSearch.distress_type,
        limit: Number(distressSearch.limit) || 50,
        offset: 0,
      };

      const filterParts = [];
      if (payload.query) filterParts.push(`"${payload.query}"`);
      if (payload.zip_code) filterParts.push(`ZIP ${payload.zip_code}`);
      if (payload.city) filterParts.push(payload.city);
      if (payload.distress_type) filterParts.push(payload.distress_type);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "user",
          text: `Distress search${
            filterParts.length ? ": " + filterParts.join(" · ") : " (all records)"
          }`,
        },
      ]);
      setIsThinking(true);

      try {
        const res = await fetch(`${API_BASE}/distress-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
          );
        }
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: "ai", distressData: data },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), sender: "ai", text: err.message || "Distress search failed." },
        ]);
      } finally {
        setIsThinking(false);
        setTimeout(scrollToBottom, 100);
      }
      return;
    }

    // ── Analyze ──────────────────────────────────────────────────────────────
    if (mode === "analyze") {
      if (!deal.fullAddress.trim() || !deal.purchasePrice) {
        alert("Enter full address and purchase price.");
        return;
      }

      const payload = {
        address: deal.fullAddress.trim(),
        purchasePrice: Number(deal.purchasePrice),
        rehabBudget: Number(deal.rehabBudget || 0),
      };

      const userMsgId = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          sender: "user",
          text: `${payload.address} | Purchase: $${formatNumber(payload.purchasePrice)}${
            payload.rehabBudget ? ` | Rehab: $${formatNumber(payload.rehabBudget)}` : ""
          }`,
        },
      ]);
      setIsThinking(true);

      try {
        const res = await fetch(`${API_BASE}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const analyzeData = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errorMessage =
            typeof analyzeData.detail === "string"
              ? analyzeData.detail
              : JSON.stringify(analyzeData.detail, null, 2);
          throw new Error(errorMessage || "Error fetching comps.");
        }

        let finData = null;
        try {
          const finPayload = buildFinancialPayload(analyzeData, finOverrides);
          const finRes = await fetch(`${API_BASE}/financial-metrics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finPayload),
          });
          finData = await finRes.json().catch(() => null);
          if (!finRes.ok) finData = null;
        } catch {
          finData = null;
        }

        const aiMsgId = Date.now() + 1;
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            sender: "ai",
            data: analyzeData,
            finData,
            finPayload: buildFinancialPayload(analyzeData, finOverrides),
            analyzeData,
          },
        ]);
        setActiveResultTab((prev) => ({ ...prev, [aiMsgId]: "deal" }));
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), sender: "ai", text: err.message || "Error fetching comps." },
        ]);
      } finally {
        setIsThinking(false);
        setTimeout(scrollToBottom, 100);
      }
      return;
    }

    // ── Land search ──────────────────────────────────────────────────────────
    if (!landSearch.zipCode.trim()) {
      alert("Enter a ZIP code for property search.");
      return;
    }

    const payload = {
      zipCode: landSearch.zipCode.trim(),
      propertyType: landSearch.propertyType || "Land",
      city: landSearch.city.trim() || undefined,
      state: landSearch.state.trim() || undefined,
      address: landSearch.address.trim() || undefined,
      radius: landSearch.radius ? Number(landSearch.radius) : undefined,
      minLotSize: landSearch.minLotSize ? Number(landSearch.minLotSize) : undefined,
      maxLotSize: landSearch.maxLotSize ? Number(landSearch.maxLotSize) : undefined,
      limit: landSearch.limit ? Number(landSearch.limit) : 25,
      offset: landSearch.offset ? Number(landSearch.offset) : 0,
      includeListings: !!landSearch.includeListings,
      listingLimit: landSearch.listingLimit ? Number(landSearch.listingLimit) : 25,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        text: `Property search | ${payload.propertyType} | ZIP: ${payload.zipCode}${
          payload.city ? ` | City: ${payload.city}` : ""
        }${payload.state ? ` | State: ${payload.state}` : ""}`,
      },
    ]);
    setIsThinking(true);

    try {
      const res = await fetch(`${API_BASE}/search-land`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMessage =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail, null, 2);
        throw new Error(errorMessage || "Error searching property.");
      }
      setMessages((prev) => [...prev, { id: Date.now(), sender: "ai", data }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "ai", text: err.message || "Error searching property." },
      ]);
    } finally {
      setIsThinking(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const rerunFinancials = async (msgId, analyzeData) => {
    const finPayload = buildFinancialPayload(analyzeData, finOverrides);
    try {
      const finRes = await fetch(`${API_BASE}/financial-metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finPayload),
      });
      const finData = await finRes.json().catch(() => null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, finData: finRes.ok ? finData : null, finPayload } : m
        )
      );
    } catch {
      // silently fail
    }
  };

  const handleReset = () => {
    setMessages([{ id: 1, sender: "ai", text: "Choose a tool to get started." }]);
    setMode("analyze");
    setDeal({ fullAddress: "", purchasePrice: "", rehabBudget: "" });
    setLandSearch({
      zipCode: "", city: "", state: "", address: "", radius: "",
      propertyType: "Land",
      minLotSize: "", maxLotSize: "", limit: "25", offset: "0",
      includeListings: true, listingLimit: "25",
    });
    setDistressSearch({
      query: "", zip_code: "", city: "", distress_type: "All Types", limit: "50",
    });
    setFinOverrides({
      holdMonths: "12", vacancyRate: "5", expenseRate: "35", saleClosingCostPct: "6",
      riskFreeRate: "4.5", beta: "0.7", marketReturn: "10",
      loanAmount: "", annualDebtService: "", equityValue: "", taxRate: "0",
    });
    setActiveResultTab({});
    setExpandedRows({});
    setExpandedDistressRow(null);
  };

  const renderFormTitle = () => {
    if (mode === "analyze") return "Deal Analysis";
    if (mode === "land") return "Property Search";
    if (mode === "distress") return "Distress Search";
    return "";
  };

  // ─── Distress results renderer ────────────────────────────────────────────

  const renderDistressResults = (distressData) => {
    const { total, results, distress_type_counts } = distressData;

    const statusColor = (dt) => {
      if (dt === "Mortgage Foreclosure")   return { bg: "#fcebeb", color: "#a32d2d" };
      if (dt === "HOA Lien")               return { bg: "#faeeda", color: "#ba7517" };
      if (dt === "Tax Delinquent")         return { bg: "#faeeda", color: "#ba7517" };
      if (dt === "Code / Contractor Lien") return { bg: "#e6f1fb", color: "#185fa5" };
      if (dt === "Contractor Lien")        return { bg: "#e6f1fb", color: "#185fa5" };
      return { bg: "#f1efe8", color: "#5f5e5a" };
    };

    const shortLabel = (dt) => {
      if (dt === "Mortgage Foreclosure")   return "Foreclosure";
      if (dt === "HOA Lien")               return "HOA Lien";
      if (dt === "Tax Delinquent")         return "Tax Delinquent";
      if (dt === "Code / Contractor Lien") return "Code Violation";
      if (dt === "Contractor Lien")        return "Contractor Lien";
      if (dt === "Timeshare Foreclosure")  return "Timeshare";
      return dt;
    };

    return (
      <div className="result-panel">
        {/* Summary chips + Export button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: "#f1efe8", color: "#5f5e5a" }}>
            {total} records
          </span>
          {Object.entries(distress_type_counts || {}).map(([type, count]) => {
            const s = statusColor(type);
            return (
              <span key={type} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>
                {shortLabel(type)} ({count})
              </span>
            );
          })}
          {results.length > 0 && (
            <button
              type="button"
              onClick={() => exportDistressCSV(results)}
              style={{
                marginLeft: "auto",
                fontSize: 12,
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                background: "#111",
                color: "#fff",
                border: "none",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              ↓ Export CSV ({results.length} records)
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="result-empty">No distress records matched your filters.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {results.map((r) => {
              const s = statusColor(r.distress_type);
              const rowKey = r.doc_number;
              const isOpen = expandedDistressRow === rowKey;

              return (
                <div key={rowKey} style={{
                  border: isOpen ? "1px solid #d0d0d0" : "0.5px solid #e8e8e8",
                  borderRadius: 10,
                  background: "#fff",
                  overflow: "hidden",
                }}>
                  {/* Collapsed row */}
                  <div
                    onClick={() => setExpandedDistressRow(isOpen ? null : rowKey)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", userSelect: "none" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.address}
                      </div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        {r.city}{r.zip ? `, FL ${r.zip}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", flexShrink: 0, maxWidth: 180, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.grantor.length > 30 ? r.grantor.slice(0, 30) + "…" : r.grantor}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 99, flexShrink: 0, background: s.bg, color: s.color }}>
                      {shortLabel(r.distress_type)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, flexShrink: 0, background: "#eaf3de", color: "#3b6d11" }}>
                      Active
                    </span>
                    <span style={{ fontSize: 16, color: "#aaa", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", lineHeight: 1 }}>
                      ▾
                    </span>
                  </div>

                  {/* Expanded detail drawer */}
                  {isOpen && (
                    <div style={{ borderTop: "0.5px solid #efefef", padding: "16px 16px 12px", background: "#fafafa" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px 24px", marginBottom: 14 }}>
                        {[
                          ["Doc number",  r.doc_number],
                          ["Recorded",    r.recorded_date],
                          ["Doc type",    r.doc_type],
                          ["Plaintiff",   r.grantor],
                          ["Defendant",   r.grantees],
                          ["Parcel ID",   r.parcel_id],
                          ["ZIP",         r.zip],
                          ["City",        r.city],
                        ].map(([label, val]) =>
                          val ? (
                            <div key={label}>
                              <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{label}</div>
                              <div style={{ fontSize: 13, color: "#111", fontWeight: 500, wordBreak: "break-word" }}>{val}</div>
                            </div>
                          ) : null
                        )}
                      </div>

                      {r.legal && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>Legal description</div>
                          <div style={{ fontSize: 12, color: "#444", lineHeight: 1.5, background: "#f0f0f0", borderRadius: 6, padding: "8px 10px", fontFamily: "monospace" }}>
                            {r.legal}
                          </div>
                        </div>
                      )}

                      {r.flags?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                          {r.flags.map((flag) => (
                            <span key={flag} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#e6f1fb", color: "#185fa5", fontWeight: 500 }}>
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setMode("analyze");
                            setDeal((prev) => ({
                              ...prev,
                              fullAddress: [r.address, r.city, "FL", r.zip].filter(Boolean).join(", "),
                            }));
                            setExpandedDistressRow(null);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, cursor: "pointer", background: "#111", color: "#fff", border: "none", fontWeight: 500 }}
                        >
                          Analyze this deal →
                        </button>
                        {r.ocpa_url && (
                          <a
                            href={r.ocpa_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, background: "transparent", color: "#185fa5", border: "0.5px solid #b5d4f4", fontWeight: 500, textDecoration: "none", display: "inline-block" }}
                          >
                            View OCPA record ↗
                          </a>
                        )}
                        <button
                          type="button"
                          style={SAVE_BTN}
                          onClick={() => {
                            saveProperty({
                              address: r.address,
                              city: r.city,
                              zip: r.zip,
                              source: "Distress",
                              grantor: r.grantor,
                              distressType: r.distress_type,
                              parcelId: r.parcel_id,
                            });
                            showSaveToast();
                          }}
                        >
                          Save ☆
                        </button>
                        <button
                          type="button"
                          onClick={() => exportDistressCSV([r])}
                          style={{ ...SAVE_BTN }}
                        >
                          Export row ↓
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Renderers ────────────────────────────────────────────────────────────

  const renderOverviewCards = (data) => {
    const summary = [];
    if (data?.deal_summary) {
      const ds = data.deal_summary;
      summary.push(
        { label: "Estimated Value", value: formatCurrency(ds.estimated_value) },
        { label: "Estimated Rent", value: formatCurrency(ds.estimated_rent) },
        { label: "Total Basis", value: formatCurrency(ds.total_basis) },
        { label: "Spread to ARV", value: formatCurrency(ds.spread_to_arv) },
        { label: "70% Rule MAO", value: formatCurrency(ds.mao_70_rule) },
        {
          label: "Gross Rent Cap Rate",
          value:
            ds.gross_rent_cap_rate_percent !== null && ds.gross_rent_cap_rate_percent !== undefined
              ? `${ds.gross_rent_cap_rate_percent}%`
              : "—",
        }
      );
    } else if (data?.search_summary) {
      const ss = data.search_summary;
      summary.push(
        { label: "Records Found", value: ss.records_found ?? "—" },
        { label: "Property Type", value: ss.propertyType ?? "—" },
        { label: "ZIP Code", value: ss.zipCode ?? "—" },
        { label: "City", value: ss.city ?? "—" },
        { label: "State", value: ss.state ?? "—" }
      );
    }
    if (!summary.length) return null;
    return (
      <div className="metric-grid">
        {summary.map((item) => (
          <div className="metric-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    );
  };

  const renderFinOverviewCards = (finData) => {
    if (!finData) return null;
    const irrBeatsWacc = finData.irr_beats_wacc;
    const signal =
      irrBeatsWacc === true
        ? "✓ IRR clears WACC hurdle"
        : irrBeatsWacc === false
        ? "✗ IRR below WACC hurdle"
        : null;
    const cards = [
      { label: "IRR (periodic)", value: finData.irr_percent !== null ? formatPct(finData.irr_percent) : "—" },
      { label: "Return on Cost", value: finData.return_on_cost_percent !== null ? formatPct(finData.return_on_cost_percent) : "—" },
      { label: "Cost of Equity (CAPM)", value: finData.cost_of_equity_percent_capm !== null ? formatPct(finData.cost_of_equity_percent_capm) : "—" },
      { label: "Cost of Debt", value: finData.cost_of_debt_percent !== null ? formatPct(finData.cost_of_debt_percent) : "—" },
      { label: "WACC", value: finData.wacc_percent !== null ? formatPct(finData.wacc_percent) : "—" },
      ...(signal ? [{ label: "Decision Signal", value: signal }] : []),
    ];
    return (
      <div className="metric-grid">
        {cards.map((item) => (
          <div className="metric-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    );
  };

  const renderObjectGrid = (title, obj, excludedKeys = []) => {
    if (!obj || typeof obj !== "object") return null;
    const rows = Object.entries(obj).filter(
      ([key, value]) => !excludedKeys.includes(key) && typeof value !== "object"
    );
    if (!rows.length) return null;
    return (
      <section className="result-section">
        <div className="result-section-title">{title}</div>
        <div className="info-grid">
          {rows.map(([key, value]) => (
            <div className="info-item" key={key}>
              <span>{titleCase(key)}</span>
              <strong>{formatCompactValue(value, key)}</strong>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // ─── Expandable list section ──────────────────────────────────────────────

  const renderListSection = (title, items, emptyMessage = "No results found.", isLandRecords = false) => {
    if (!Array.isArray(items)) return null;
    return (
      <section className="result-section">
        <div className="result-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>
            {title}
            <span className="result-count">{items.length}</span>
          </span>
          {isLandRecords && items.length > 0 && (
            <button
              type="button"
              onClick={() => exportLandCSV(items)}
              style={{
                fontSize: 11,
                padding: "4px 12px",
                borderRadius: 6,
                cursor: "pointer",
                background: "#111",
                color: "#fff",
                border: "none",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              ↓ Export CSV ({items.length})
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="result-empty">{emptyMessage}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((item, index) => {
              const rowKey = `${title}-${index}`;
              const isOpen = expandedRows[rowKey];

              const address =
                item?.formattedAddress ||
                item?.addressLine1 ||
                item?.address ||
                `Record ${index + 1}`;
              const sub = [item?.city, item?.state, item?.zipCode]
                .filter(Boolean)
                .join(", ");
              const price = item?.price ?? item?.rent ?? null;

              // Owner name for land records
              const ownerDisplay = item?.ownerNames
                ? (Array.isArray(item.ownerNames)
                    ? item.ownerNames.join(", ")
                    : item.ownerNames)
                : null;

              const allFields = Object.entries(item || {}).filter(
                ([, v]) =>
                  v !== null &&
                  v !== undefined &&
                  v !== "" &&
                  typeof v !== "object"
              );

              return (
                <div key={rowKey} style={{
                  border: isOpen ? "1px solid #d0d0d0" : "0.5px solid #e8e8e8",
                  borderRadius: 10,
                  background: "#fff",
                  overflow: "hidden",
                }}>
                  <div
                    onClick={() =>
                      setExpandedRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))
                    }
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", userSelect: "none" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {address}
                      </div>
                      {sub && (
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{sub}</div>
                      )}
                      {ownerDisplay && (
                        <div style={{ fontSize: 11, color: "#185fa5", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Owner: {ownerDisplay}
                        </div>
                      )}
                    </div>
                    {price !== null && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111", flexShrink: 0 }}>
                        {formatCurrency(price)}
                      </div>
                    )}
                    {item?.propertyType && (
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, flexShrink: 0, background: "#f1efe8", color: "#5f5e5a", fontWeight: 500 }}>
                        {item.propertyType}
                      </span>
                    )}
                    {item?.status && (
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, flexShrink: 0, background: "#eaf3de", color: "#3b6d11", fontWeight: 600 }}>
                        {item.status}
                      </span>
                    )}
                    <span style={{ fontSize: 16, color: "#aaa", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", lineHeight: 1 }}>
                      ▾
                    </span>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: "0.5px solid #efefef", padding: "16px 16px 12px", background: "#fafafa" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px 24px", marginBottom: 14 }}>
                        {allFields.map(([key, val]) => (
                          <div key={key}>
                            <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>
                              {titleCase(key)}
                            </div>
                            <div style={{ fontSize: 13, color: "#111", fontWeight: 500, wordBreak: "break-word" }}>
                              {formatCompactValue(val, key)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={SAVE_BTN}
                          onClick={() => {
                            saveProperty({
                              address: item.formattedAddress || item.addressLine1,
                              city: item.city,
                              zip: item.zipCode,
                              source: "Property Search",
                              parcelId: item.id,
                            });
                            showSaveToast();
                          }}
                        >
                          Save ☆
                        </button>
                        {isLandRecords && (
                          <button
                            type="button"
                            onClick={() => exportLandCSV([item])}
                            style={{ ...SAVE_BTN }}
                          >
                            Export row ↓
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  // ─── Financial tab ────────────────────────────────────────────────────────

  const renderFinAssumptions = (msgId, analyzeData) => {
    const ds = analyzeData?.deal_summary || {};
    const autoMonthly = ds.estimated_rent
      ? `Auto: $${formatNumber(Math.round(ds.estimated_rent))} / mo`
      : null;
    return (
      <section className="result-section fin-assumptions">
        <div className="result-section-title">Assumptions & Overrides</div>
        <p className="fin-note">
          Cash flows are auto-generated from estimated rent. Adjust any field and click
          <strong> Recalculate</strong> to update.
        </p>
        <div className="info-grid">
          <div className="form-group">
            <label>Hold Period (months)</label>
            <input name="holdMonths" type="number" min="1" value={finOverrides.holdMonths} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Vacancy Rate (%)</label>
            <input name="vacancyRate" type="number" min="0" max="100" step="0.5" value={finOverrides.vacancyRate} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Operating Expense Rate (%)</label>
            <input name="expenseRate" type="number" min="0" max="100" step="0.5" value={finOverrides.expenseRate} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Sale Closing Costs (%)</label>
            <input name="saleClosingCostPct" type="number" min="0" max="20" step="0.5" value={finOverrides.saleClosingCostPct} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Risk-Free Rate (%)</label>
            <input name="riskFreeRate" type="number" step="0.1" value={finOverrides.riskFreeRate} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Beta</label>
            <input name="beta" type="number" step="0.05" min="0" value={finOverrides.beta} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Expected Market Return (%)</label>
            <input name="marketReturn" type="number" step="0.5" value={finOverrides.marketReturn} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Loan Amount (optional)</label>
            <input name="loanAmount" type="number" placeholder="e.g. 200000" value={finOverrides.loanAmount} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Annual Debt Service (optional)</label>
            <input name="annualDebtService" type="number" placeholder="e.g. 14400" value={finOverrides.annualDebtService} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Equity Value (optional)</label>
            <input name="equityValue" type="number" placeholder="e.g. 80000" value={finOverrides.equityValue} onChange={handleFinOverrideChange} />
          </div>
          <div className="form-group">
            <label>Tax Rate % (for WACC)</label>
            <input name="taxRate" type="number" min="0" max="60" step="1" value={finOverrides.taxRate} onChange={handleFinOverrideChange} />
          </div>
        </div>
        {autoMonthly && (
          <p className="fin-note muted">
            {autoMonthly} — vacancy & expense rates applied above
          </p>
        )}
        <button
          type="button"
          className="recalc-button"
          onClick={() => rerunFinancials(msgId, analyzeData)}
        >
          Recalculate
        </button>
      </section>
    );
  };

  const renderFinTab = (msgId, finData, analyzeData) => {
    return (
      <div className="result-panel">
        {finData ? (
          <>
            {renderFinOverviewCards(finData)}
            <section className="result-section">
              <div className="result-section-title">Annualised IRR</div>
              <div className="info-grid">
                <div className="info-item">
                  <span>Periodic IRR</span>
                  <strong>{finData.irr_percent !== null ? formatPct(finData.irr_percent) : "—"}</strong>
                </div>
                <div className="info-item">
                  <span>Annualised IRR</span>
                  <strong>
                    {finData.irr_percent !== null
                      ? formatPct(((1 + finData.irr_percent / 100) ** 12 - 1) * 100)
                      : "—"}
                  </strong>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="result-empty">
            Financial metrics unavailable — check that estimated rent and ARV were returned by the analysis.
          </div>
        )}
        {renderFinAssumptions(msgId, analyzeData)}
      </div>
    );
  };

  const renderAiData = (msg) => {
    const { id: msgId, data, distressData, finData, analyzeData } = msg;

    if (distressData) return renderDistressResults(distressData);

    if (!data || typeof data !== "object") {
      return <p>{String(data ?? "")}</p>;
    }

    const isAnalyzeResult = !!data.deal_summary || !!data.subject_property;
    const subjectProperty = data.subject_property || null;
    const dealSummary = data.deal_summary || null;
    const landCompact = data.land_records?.compact || [];
    const saleComparables = data.value_estimate?.response?.comparables || [];
    const rentComparables = data.rent_estimate?.response?.comparables || [];
    const saleListings = Array.isArray(data.sale_listings?.response)
      ? data.sale_listings.response
      : Array.isArray(data.land_sale_listings?.response)
      ? data.land_sale_listings.response
      : [];
    const rentalListings = Array.isArray(data.rental_listings?.response)
      ? data.rental_listings.response
      : [];

    const isLandSearch = !!data.land_records;

    const dealPanel = (
      <div className="result-panel">
        {data?.input?.address && (
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              style={SAVE_BTN}
              onClick={() => {
                saveProperty({
                  address: data.input.address,
                  source: "Analyzer",
                  arv: data.deal_summary?.estimated_value,
                  rent: data.deal_summary?.estimated_rent,
                  purchasePrice: data.input.purchasePrice,
                  rehabBudget: data.input.rehabBudget,
                });
                showSaveToast();
              }}
            >
              Save ☆
            </button>
          </div>
        )}
        {renderOverviewCards(data)}
        {renderObjectGrid("Subject Property", subjectProperty)}
        {renderObjectGrid("Deal Summary", dealSummary, ["estimated_value_range", "estimated_rent_range"])}
        {dealSummary?.estimated_value_range && (
          <section className="result-section">
            <div className="result-section-title">Estimated Value Range</div>
            <div className="info-grid">
              <div className="info-item">
                <span>Low</span>
                <strong>{formatCurrency(dealSummary.estimated_value_range.low)}</strong>
              </div>
              <div className="info-item">
                <span>High</span>
                <strong>{formatCurrency(dealSummary.estimated_value_range.high)}</strong>
              </div>
            </div>
          </section>
        )}
        {dealSummary?.estimated_rent_range && (
          <section className="result-section">
            <div className="result-section-title">Estimated Rent Range</div>
            <div className="info-grid">
              <div className="info-item">
                <span>Low</span>
                <strong>{formatCurrency(dealSummary.estimated_rent_range.low)}</strong>
              </div>
              <div className="info-item">
                <span>High</span>
                <strong>{formatCurrency(dealSummary.estimated_rent_range.high)}</strong>
              </div>
            </div>
          </section>
        )}
        {renderListSection("Sale Comparables", saleComparables)}
        {renderListSection("Rental Comparables", rentComparables)}
        {renderListSection("Nearby Sale Listings", saleListings)}
        {renderListSection("Nearby Rental Listings", rentalListings)}
        {renderListSection("Land Records", landCompact, "No results found.", isLandSearch)}
        {!dealSummary && !subjectProperty && !saleComparables.length && !rentComparables.length &&
          !saleListings.length && !rentalListings.length && !landCompact.length && (
          <section className="result-section">
            <div className="result-section-title">Raw Response</div>
            <pre className="raw-fallback">{JSON.stringify(data, null, 2)}</pre>
          </section>
        )}
      </div>
    );

    if (!isAnalyzeResult) return dealPanel;

    const currentTab = activeResultTab[msgId] || "deal";
    return (
      <div>
        <div className="result-tabs">
          <button
            type="button"
            className={`result-tab ${currentTab === "deal" ? "active" : ""}`}
            onClick={() => setActiveResultTab((prev) => ({ ...prev, [msgId]: "deal" }))}
          >
            Deal Analysis
          </button>
          <button
            type="button"
            className={`result-tab ${currentTab === "finance" ? "active" : ""}`}
            onClick={() => setActiveResultTab((prev) => ({ ...prev, [msgId]: "finance" }))}
          >
            Financial Metrics
          </button>
        </div>
        {currentTab === "deal" ? dealPanel : renderFinTab(msgId, finData, analyzeData)}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="chat-page">
      {saveToast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#111", color: "#fff", fontSize: 13, padding: "10px 20px",
          borderRadius: 8, zIndex: 9999, pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          Saved to bookmarks ☆
        </div>
      )}

      <div className="chat-layout">
        <div className="tool-strip-wrap">
          <div className="tool-strip-header">
            <h1>FlipBot</h1>
            <p>Select a workflow and submit your inputs.</p>
          </div>
          <div className="tool-strip">
            {tools.map((tool) => (
              <button
                key={tool.key}
                type="button"
                className={`tool-card ${mode === tool.key ? "active" : ""}`}
                onClick={() => setMode(tool.key)}
              >
                <div className="tool-card-top">
                  <div className="tool-card-icon">{tool.icon}</div>
                  <span className={`tool-badge${tool.key === "distress" ? " tool-badge-new" : ""}`}>
                    {tool.badge}
                  </span>
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="main-shell">
          <aside className="input-sidebar">
            <div className="form-card">
              <div className="form-card-header">
                <h2>{renderFormTitle()}</h2>
                <p>
                  {mode === "analyze" && "Enter the deal details below to run an analysis."}
                  {mode === "land" && "Enter search filters to find property opportunities."}
                  {mode === "distress" && "Search lis pendens, HOA liens, tax delinquent, and code violation records."}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* ── Deal Analysis ── */}
                {mode === "analyze" && (
                  <>
                    <div className="form-group">
                      <label>Full Address</label>
                      <input name="fullAddress" placeholder="123 Main St, City, ST 12345" value={deal.fullAddress} onChange={handleDealChange} />
                    </div>
                    <div className="form-group">
                      <label>Purchase Price</label>
                      <input name="purchasePrice" placeholder="250,000" value={formatNumber(deal.purchasePrice)} onChange={handleDealChange} />
                    </div>
                    <div className="form-group">
                      <label>Rehab Budget</label>
                      <input name="rehabBudget" placeholder="50,000" value={formatNumber(deal.rehabBudget)} onChange={handleDealChange} />
                    </div>
                    <button type="submit" disabled={isThinking}>
                      {isThinking ? "Analyzing..." : "Submit for Analysis"}
                    </button>
                  </>
                )}

                {/* ── Property / Land ── */}
                {mode === "land" && (
                  <>
                    <div className="form-group">
                      <label>Property Type</label>
                      <select name="propertyType" value={landSearch.propertyType} onChange={handleLandChange}>
                        <option value="Single Family">Single Family</option>
                        <option value="Condo">Condo</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Multi-Family">Multi-Family</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Manufactured">Manufactured</option>
                        <option value="Land">Land (Vacant)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>ZIP Code</label>
                      <input name="zipCode" placeholder="90210" value={landSearch.zipCode} onChange={handleLandChange} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input name="city" placeholder="Los Angeles" value={landSearch.city} onChange={handleLandChange} />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input name="state" placeholder="CA" value={landSearch.state} onChange={handleLandChange} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Center Address</label>
                      <input name="address" placeholder="Optional center point" value={landSearch.address} onChange={handleLandChange} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Radius</label>
                        <input name="radius" placeholder="10" value={landSearch.radius} onChange={handleLandChange} />
                      </div>
                      <div className="form-group">
                        <label>Record Limit</label>
                        <input name="limit" placeholder="25" value={formatNumber(landSearch.limit)} onChange={handleLandChange} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Min Lot Size</label>
                        <input name="minLotSize" placeholder="10000" value={formatNumber(landSearch.minLotSize)} onChange={handleLandChange} />
                      </div>
                      <div className="form-group">
                        <label>Max Lot Size</label>
                        <input name="maxLotSize" placeholder="50000" value={formatNumber(landSearch.maxLotSize)} onChange={handleLandChange} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input type="checkbox" name="includeListings" checked={landSearch.includeListings} onChange={handleLandChange} />
                        Include active listings
                      </label>
                    </div>
                    <div className="form-group">
                      <label>Listing Limit</label>
                      <input name="listingLimit" placeholder="25" value={formatNumber(landSearch.listingLimit)} onChange={handleLandChange} />
                    </div>
                    <button type="submit" disabled={isThinking}>
                      {isThinking ? "Searching..." : "Submit Property Search"}
                    </button>
                  </>
                )}

                {/* ── Distress Search ── */}
                {mode === "distress" && (
                  <>
                    <div className="form-group">
                      <label>Keyword Search</label>
                      <input name="query" placeholder="Name, address, or parcel ID" value={distressSearch.query} onChange={handleDistressChange} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>ZIP Code</label>
                        <input name="zip_code" placeholder="32801" value={distressSearch.zip_code} onChange={handleDistressChange} />
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input name="city" placeholder="Orlando" value={distressSearch.city} onChange={handleDistressChange} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Distress Type</label>
                      <select name="distress_type" value={distressSearch.distress_type} onChange={handleDistressChange}>
                        {DISTRESS_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Max Results</label>
                      <input name="limit" type="number" min="1" max="200" value={distressSearch.limit} onChange={handleDistressChange} />
                    </div>
                    <button type="submit" disabled={isThinking}>
                      {isThinking ? "Searching..." : "Search Distress Records"}
                    </button>
                  </>
                )}
              </form>

              <button type="button" className="reset-button" onClick={handleReset}>
                Reset
              </button>
            </div>
          </aside>

          <main className="chat-content">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-bubble ${msg.sender === "user" ? "message-user" : "message-ai"}`}
              >
                {msg.data || msg.distressData ? (
                  renderAiData(msg)
                ) : typeof msg.text === "object" ? (
                  <pre className="raw-fallback">{JSON.stringify(msg.text, null, 2)}</pre>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="loading-overlay">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                  <div className="loading-ring" />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "#111" }}>
                      {mode === "distress"
                        ? "Searching distress records..."
                        : mode === "analyze"
                        ? "Analyzing deal..."
                        : "Searching properties..."}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {mode === "distress"
                        ? "Filtering lis pendens records"
                        : mode === "analyze"
                        ? "Pulling comps, rent estimates & ARV"
                        : "Fetching property records"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;