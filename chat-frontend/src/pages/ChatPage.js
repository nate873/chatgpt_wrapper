import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ChatPage.css";

const API_BASE = "http://localhost:8000";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Choose a tool to get started.",
    },
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
    minLotSize: "",
    maxLotSize: "",
    limit: "25",
    offset: "0",
    includeListings: true,
    listingLimit: "25",
  });

  // Financial metrics override state — values here take precedence over auto-generated ones
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

  // Which result message tab is currently expanded ("deal" | "finance")
  const [activeResultTab, setActiveResultTab] = useState({});

  const [isThinking, setIsThinking] = useState(false);
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

    const observer = new MutationObserver(() => {
      removeInjectedLoginText();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

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
        key: "mystery",
        title: "Mystery",
        description: "Placeholder for the next FlipBot workflow.",
        badge: "Soon",
        icon: "✦",
      },
    ],
    []
  );

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
      if (value.every((item) => typeof item !== "object")) {
        return value.join(", ");
      }
      return `${value.length} item${value.length === 1 ? "" : "s"}`;
    }

    if (typeof value === "object") return "View details below";

    return String(value);
  };

  const titleCase = (text) =>
    String(text)
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const summarizeArrayItem = (item) => {
    if (!item || typeof item !== "object") return null;

    const preferredKeys = [
      "formattedAddress",
      "addressLine1",
      "city",
      "state",
      "zipCode",
      "price",
      "rent",
      "bedrooms",
      "bathrooms",
      "squareFootage",
      "lotSize",
      "daysOnMarket",
      "propertyType",
      "status",
      "listingType",
    ];

    const chosen = preferredKeys.filter(
      (key) => item[key] !== undefined && item[key] !== null
    );

    if (chosen.length === 0) return Object.entries(item).slice(0, 6);
    return chosen.map((key) => [key, item[key]]);
  };

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

  const handleFinOverrideChange = (e) => {
    const { name, value } = e.target;
    setFinOverrides((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Build financial-metrics payload from analyze result + overrides ────────
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

    // Effective monthly rent after vacancy
    const effectiveMonthlyRent = estimatedRent * (1 - vacancyRate / 100);

    // NOI = annual effective rent minus operating expenses (excludes debt service)
    const annualEffectiveRent = effectiveMonthlyRent * 12;
    const noi = annualEffectiveRent * (1 - expenseRate / 100);

    // Monthly net cash flow during hold (rent - vacancy - expenses, before debt service)
    const monthlyNetCashFlow = noi / 12;

    // Net sale proceeds at end of hold
    const saleProceeds = estimatedValue * (1 - saleClosingCostPct / 100);

    // Cash flow array: monthly income for holdMonths, last month adds sale proceeds
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

  // ─── Submit handlers ──────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "mystery") {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "ai", text: "Mystery is coming soon." },
      ]);
      setTimeout(scrollToBottom, 100);
      return;
    }

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

        // Auto-run financial metrics using current overrides
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
            analyzeData, // store for re-running fin metrics
          },
        ]);

        // Default to deal tab
        setActiveResultTab((prev) => ({ ...prev, [aiMsgId]: "deal" }));
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "ai",
            text: err.message || "Error fetching comps.",
          },
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
        text: `Property search | ZIP: ${payload.zipCode}${
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

      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "ai", data },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "ai",
          text: err.message || "Error searching property.",
        },
      ]);
    } finally {
      setIsThinking(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  // Re-run financial metrics for a specific message when overrides change
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
          m.id === msgId
            ? { ...m, finData: finRes.ok ? finData : null, finPayload }
            : m
        )
      );
    } catch {
      // silently fail — keep stale finData
    }
  };

  const handleReset = () => {
    setMessages([{ id: 1, sender: "ai", text: "Choose a tool to get started." }]);
    setMode("analyze");
    setDeal({ fullAddress: "", purchasePrice: "", rehabBudget: "" });
    setLandSearch({
      zipCode: "",
      city: "",
      state: "",
      address: "",
      radius: "",
      minLotSize: "",
      maxLotSize: "",
      limit: "25",
      offset: "0",
      includeListings: true,
      listingLimit: "25",
    });
    setFinOverrides({
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
    setActiveResultTab({});
  };

  const renderFormTitle = () => {
    if (mode === "analyze") return "Deal Analysis";
    if (mode === "land") return "Property Search";
    return "Mystery";
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
            ds.gross_rent_cap_rate_percent !== null &&
            ds.gross_rent_cap_rate_percent !== undefined
              ? `${ds.gross_rent_cap_rate_percent}%`
              : "—",
        }
      );
    } else if (data?.search_summary) {
      const ss = data.search_summary;
      summary.push(
        { label: "Records Found", value: ss.records_found ?? "—" },
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

  const renderListSection = (title, items, emptyMessage = "No results found.") => {
    if (!Array.isArray(items)) return null;

    return (
      <section className="result-section">
        <div className="result-section-title">
          {title}
          <span className="result-count">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="result-empty">{emptyMessage}</div>
        ) : (
          <div className="result-list">
            {items.map((item, index) => {
              const entries = summarizeArrayItem(item);
              return (
                <div className="result-card" key={`${title}-${index}`}>
                  {entries?.map(([key, value]) => (
                    <div className="result-row" key={key}>
                      <span>{titleCase(key)}</span>
                      <strong>{formatCompactValue(value, key)}</strong>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  // Financial assumptions panel with auto-generated values + override inputs
  const renderFinAssumptions = (msgId, analyzeData, finPayload) => {
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
            <input
              name="holdMonths"
              type="number"
              min="1"
              value={finOverrides.holdMonths}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Vacancy Rate (%)</label>
            <input
              name="vacancyRate"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={finOverrides.vacancyRate}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Operating Expense Rate (%)</label>
            <input
              name="expenseRate"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={finOverrides.expenseRate}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Sale Closing Costs (%)</label>
            <input
              name="saleClosingCostPct"
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={finOverrides.saleClosingCostPct}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Risk-Free Rate (%){autoMonthly ? "" : ""}</label>
            <input
              name="riskFreeRate"
              type="number"
              step="0.1"
              value={finOverrides.riskFreeRate}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Beta</label>
            <input
              name="beta"
              type="number"
              step="0.05"
              min="0"
              value={finOverrides.beta}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Expected Market Return (%)</label>
            <input
              name="marketReturn"
              type="number"
              step="0.5"
              value={finOverrides.marketReturn}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Loan Amount (optional)</label>
            <input
              name="loanAmount"
              type="number"
              placeholder="e.g. 200000"
              value={finOverrides.loanAmount}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Annual Debt Service (optional)</label>
            <input
              name="annualDebtService"
              type="number"
              placeholder="e.g. 14400"
              value={finOverrides.annualDebtService}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Equity Value (optional)</label>
            <input
              name="equityValue"
              type="number"
              placeholder="e.g. 80000"
              value={finOverrides.equityValue}
              onChange={handleFinOverrideChange}
            />
          </div>

          <div className="form-group">
            <label>Tax Rate % (for WACC)</label>
            <input
              name="taxRate"
              type="number"
              min="0"
              max="60"
              step="1"
              value={finOverrides.taxRate}
              onChange={handleFinOverrideChange}
            />
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

  const renderFinTab = (msgId, finData, analyzeData, finPayload) => {
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
                  <strong>
                    {finData.irr_percent !== null ? formatPct(finData.irr_percent) : "—"}
                  </strong>
                </div>
                <div className="info-item">
                  <span>Annualised IRR</span>
                  <strong>
                    {finData.irr_percent !== null
                      ? formatPct(
                          ((1 + finData.irr_percent / 100) ** 12 - 1) * 100
                        )
                      : "—"}
                  </strong>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="result-empty">
            Financial metrics unavailable — check that estimated rent and ARV were returned by
            the analysis.
          </div>
        )}

        {renderFinAssumptions(msgId, analyzeData, finPayload)}
      </div>
    );
  };

  const renderAiData = (msg) => {
    const { id: msgId, data, finData, finPayload, analyzeData } = msg;

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

    const dealPanel = (
      <div className="result-panel">
        {renderOverviewCards(data)}
        {renderObjectGrid("Subject Property", subjectProperty)}
        {renderObjectGrid("Deal Summary", dealSummary, [
          "estimated_value_range",
          "estimated_rent_range",
        ])}

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
        {renderListSection("Land Records", landCompact)}

        {!dealSummary &&
          !subjectProperty &&
          !saleComparables.length &&
          !rentComparables.length &&
          !saleListings.length &&
          !rentalListings.length &&
          !landCompact.length && (
            <section className="result-section">
              <div className="result-section-title">Raw Response</div>
              <pre className="raw-fallback">{JSON.stringify(data, null, 2)}</pre>
            </section>
          )}
      </div>
    );

    // Land results — no tabs needed
    if (!isAnalyzeResult) return dealPanel;

    // Analyze results — tabbed
    const currentTab = activeResultTab[msgId] || "deal";

    return (
      <div>
        <div className="result-tabs">
          <button
            type="button"
            className={`result-tab ${currentTab === "deal" ? "active" : ""}`}
            onClick={() =>
              setActiveResultTab((prev) => ({ ...prev, [msgId]: "deal" }))
            }
          >
            Deal Analysis
          </button>
          <button
            type="button"
            className={`result-tab ${currentTab === "finance" ? "active" : ""}`}
            onClick={() =>
              setActiveResultTab((prev) => ({ ...prev, [msgId]: "finance" }))
            }
          >
            Financial Metrics
          </button>
        </div>

        {currentTab === "deal"
          ? dealPanel
          : renderFinTab(msgId, finData, analyzeData, finPayload)}
      </div>
    );
  };

  return (
    <div className="chat-page">
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
                  <span className="tool-badge">{tool.badge}</span>
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
                  {mode === "mystery" && "This module is a placeholder for now."}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {mode === "analyze" ? (
                  <>
                    <div className="form-group">
                      <label>Full Address</label>
                      <input
                        name="fullAddress"
                        placeholder="123 Main St, City, ST 12345"
                        value={deal.fullAddress}
                        onChange={handleDealChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Purchase Price</label>
                      <input
                        name="purchasePrice"
                        placeholder="250,000"
                        value={formatNumber(deal.purchasePrice)}
                        onChange={handleDealChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Rehab Budget</label>
                      <input
                        name="rehabBudget"
                        placeholder="50,000"
                        value={formatNumber(deal.rehabBudget)}
                        onChange={handleDealChange}
                      />
                    </div>

                    <button type="submit" disabled={isThinking}>
                      {isThinking ? "Analyzing..." : "Submit for Analysis"}
                    </button>
                  </>
                ) : mode === "land" ? (
                  <>
                    <div className="form-group">
                      <label>ZIP Code</label>
                      <input
                        name="zipCode"
                        placeholder="90210"
                        value={landSearch.zipCode}
                        onChange={handleLandChange}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input
                          name="city"
                          placeholder="Los Angeles"
                          value={landSearch.city}
                          onChange={handleLandChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>State</label>
                        <input
                          name="state"
                          placeholder="CA"
                          value={landSearch.state}
                          onChange={handleLandChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Center Address</label>
                      <input
                        name="address"
                        placeholder="Optional center point"
                        value={landSearch.address}
                        onChange={handleLandChange}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Radius</label>
                        <input
                          name="radius"
                          placeholder="10"
                          value={landSearch.radius}
                          onChange={handleLandChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>Record Limit</label>
                        <input
                          name="limit"
                          placeholder="25"
                          value={formatNumber(landSearch.limit)}
                          onChange={handleLandChange}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Min Lot Size</label>
                        <input
                          name="minLotSize"
                          placeholder="10000"
                          value={formatNumber(landSearch.minLotSize)}
                          onChange={handleLandChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>Max Lot Size</label>
                        <input
                          name="maxLotSize"
                          placeholder="50000"
                          value={formatNumber(landSearch.maxLotSize)}
                          onChange={handleLandChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="includeListings"
                          checked={landSearch.includeListings}
                          onChange={handleLandChange}
                        />
                        Include active land listings
                      </label>
                    </div>

                    <div className="form-group">
                      <label>Listing Limit</label>
                      <input
                        name="listingLimit"
                        placeholder="25"
                        value={formatNumber(landSearch.listingLimit)}
                        onChange={handleLandChange}
                      />
                    </div>

                    <button type="submit" disabled={isThinking}>
                      {isThinking ? "Searching..." : "Submit Property Search"}
                    </button>
                  </>
                ) : (
                  <div className="placeholder-card">
                    <div className="placeholder-icon">✦</div>
                    <h3>Mystery module coming soon</h3>
                    <p>This area is reserved for your next workflow.</p>
                  </div>
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
                className={`message-bubble ${
                  msg.sender === "user" ? "message-user" : "message-ai"
                }`}
              >
                <strong>{msg.sender === "user" ? "You" : "FlipBot"}</strong>

                {msg.data ? (
                  renderAiData(msg)
                ) : typeof msg.text === "object" ? (
                  <pre className="raw-fallback">{JSON.stringify(msg.text, null, 2)}</pre>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            ))}

            {isThinking && (
              <p className="typing-indicator">
                {mode === "analyze" ? "Analyzing deal..." : "Searching properties..."}
              </p>
            )}

            <div ref={messagesEndRef} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;