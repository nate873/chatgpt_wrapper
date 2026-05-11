import React, { useEffect, useState, useCallback } from "react";
import "./Saved.css";

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "flipbot_saved_properties";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSaved(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Failed to save:", e);
  }
}

// ─── Called from other pages to save a property ───────────────────────────────
// Usage: saveProperty({ address, city, zip, source, arv, rent, purchasePrice, rehabBudget })
export function saveProperty(data) {
  const records = loadSaved();
  const id = `${data.address}-${Date.now()}`.replace(/\s+/g, "-");
  const existing = records.findIndex(
    (r) => r.address?.toLowerCase() === data.address?.toLowerCase()
  );
  if (existing !== -1) {
    // Update existing — keep notes/tag
    records[existing] = {
      ...records[existing],
      ...data,
      updatedAt: new Date().toISOString(),
    };
  } else {
    records.unshift({
      id,
      address:       data.address || "",
      city:          data.city || "",
      zip:           data.zip || "",
      source:        data.source || "Unknown",
      arv:           data.arv ?? null,
      rent:          data.rent ?? null,
      purchasePrice: data.purchasePrice ?? null,
      rehabBudget:   data.rehabBudget ?? null,
      grantor:       data.grantor || "",
      distressType:  data.distressType || "",
      parcelId:      data.parcelId || "",
      tag:           "Watch",
      notes:         "",
      savedAt:       new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
    });
  }
  persistSaved(records);
}

export function isSaved(address) {
  const records = loadSaved();
  return records.some((r) => r.address?.toLowerCase() === address?.toLowerCase());
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TAG_STYLES = {
  "Hot Lead": { bg: "#fcebeb", color: "#a32d2d" },
  "Watch":    { bg: "#faeeda", color: "#ba7517" },
  "Pass":     { bg: "#f1efe8", color: "#5f5e5a" },
  "Offer":    { bg: "#eaf3de", color: "#3b6d11" },
  "Closed":   { bg: "#e6f1fb", color: "#185fa5" },
};

const TAGS = Object.keys(TAG_STYLES);

const SOURCE_STYLES = {
  "Distress":        { bg: "#fcebeb", color: "#a32d2d" },
  "Analyzer":        { bg: "#e6f1fb", color: "#185fa5" },
  "Property Search": { bg: "#f1efe8", color: "#5f5e5a" },
  "Unknown":         { bg: "#f1efe8", color: "#5f5e5a" },
};

function formatCurrency(val) {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

const Saved = () => {
  const [records, setRecords]         = useState([]);
  const [expandedId, setExpandedId]   = useState(null);
  const [filterTag, setFilterTag]     = useState("All");
  const [filterSource, setFilterSource] = useState("All");
  const [search, setSearch]           = useState("");
  const [editingNotes, setEditingNotes] = useState({});
  const [toast, setToast]             = useState(null);

  const reload = useCallback(() => {
    setRecords(loadSaved());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const updateRecord = (id, changes) => {
    const updated = records.map((r) =>
      r.id === id ? { ...r, ...changes, updatedAt: new Date().toISOString() } : r
    );
    setRecords(updated);
    persistSaved(updated);
  };

  const deleteRecord = (id) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    persistSaved(updated);
    if (expandedId === id) setExpandedId(null);
    showToast("Property removed.");
  };

  const saveNotes = (id) => {
    updateRecord(id, { notes: editingNotes[id] ?? "" });
    showToast("Notes saved.");
  };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = records.filter((r) => {
    if (filterTag !== "All" && r.tag !== filterTag) return false;
    if (filterSource !== "All" && r.source !== filterSource) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${r.address} ${r.city} ${r.zip} ${r.grantor} ${r.notes}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sources = ["All", ...Array.from(new Set(records.map((r) => r.source).filter(Boolean)))];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="saved-page">

      {/* Toast */}
      {toast && <div className="saved-toast">{toast}</div>}

      <div className="saved-header">
        <div>
          <h1>Saved Properties</h1>
          <p>{records.length} saved · {filtered.length} shown</p>
        </div>
      </div>

      {/* Filters */}
      <div className="saved-filters">
        <input
          className="saved-search"
          placeholder="Search address, city, grantor, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="saved-filter-row">
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
            <option value="All">All Tags</option>
            {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            {sources.map((s) => <option key={s} value={s}>{s === "All" ? "All Sources" : s}</option>)}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {records.length === 0 && (
        <div className="saved-empty">
          <div className="saved-empty-icon">⊙</div>
          <p>No saved properties yet.</p>
          <p>Click <strong>Save</strong> on any property in Deal Analysis, Property Search, or Distress Search.</p>
        </div>
      )}

      {records.length > 0 && filtered.length === 0 && (
        <div className="saved-empty">
          <p>No properties match your filters.</p>
        </div>
      )}

      {/* Cards */}
      <div className="saved-list">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          const tagStyle = TAG_STYLES[r.tag] || TAG_STYLES["Watch"];
          const srcStyle = SOURCE_STYLES[r.source] || SOURCE_STYLES["Unknown"];

          return (
            <div
              key={r.id}
              className={`saved-card ${isOpen ? "open" : ""}`}
            >
              {/* Row */}
              <div
                className="saved-card-row"
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                <div className="saved-card-address">
                  <div className="saved-card-street">{r.address}</div>
                  <div className="saved-card-sub">
                    {[r.city, r.zip].filter(Boolean).join(", ")}
                    {r.distressType ? ` · ${r.distressType}` : ""}
                  </div>
                </div>

                <div className="saved-card-badges">
                  {r.arv && (
                    <span className="saved-badge saved-badge-arv">
                      ARV {formatCurrency(r.arv)}
                    </span>
                  )}
                  {r.purchasePrice && (
                    <span className="saved-badge saved-badge-price">
                      {formatCurrency(r.purchasePrice)}
                    </span>
                  )}
                  <span className="saved-badge" style={{ background: srcStyle.bg, color: srcStyle.color }}>
                    {r.source}
                  </span>
                  <span className="saved-badge" style={{ background: tagStyle.bg, color: tagStyle.color }}>
                    {r.tag}
                  </span>
                </div>

                <span className="saved-chevron" style={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}>▾</span>
              </div>

              {/* Expanded drawer */}
              {isOpen && (
                <div className="saved-drawer">

                  {/* Key numbers */}
                  {(r.arv || r.rent || r.purchasePrice || r.rehabBudget) && (
                    <div className="saved-metrics">
                      {r.purchasePrice && (
                        <div className="saved-metric">
                          <span>Purchase Price</span>
                          <strong>{formatCurrency(r.purchasePrice)}</strong>
                        </div>
                      )}
                      {r.rehabBudget && (
                        <div className="saved-metric">
                          <span>Rehab Budget</span>
                          <strong>{formatCurrency(r.rehabBudget)}</strong>
                        </div>
                      )}
                      {r.arv && (
                        <div className="saved-metric">
                          <span>Est. Value (ARV)</span>
                          <strong>{formatCurrency(r.arv)}</strong>
                        </div>
                      )}
                      {r.rent && (
                        <div className="saved-metric">
                          <span>Est. Rent</span>
                          <strong>{formatCurrency(r.rent)}/mo</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Details grid */}
                  <div className="saved-details">
                    {r.grantor && (
                      <div>
                        <div className="saved-detail-label">Plaintiff / Grantor</div>
                        <div className="saved-detail-value">{r.grantor}</div>
                      </div>
                    )}
                    {r.parcelId && (
                      <div>
                        <div className="saved-detail-label">Parcel ID</div>
                        <div className="saved-detail-value">{r.parcelId}</div>
                      </div>
                    )}
                    <div>
                      <div className="saved-detail-label">Saved</div>
                      <div className="saved-detail-value">{formatDate(r.savedAt)}</div>
                    </div>
                    <div>
                      <div className="saved-detail-label">Updated</div>
                      <div className="saved-detail-value">{formatDate(r.updatedAt)}</div>
                    </div>
                  </div>

                  {/* Tag picker */}
                  <div className="saved-section">
                    <div className="saved-section-label">Tag</div>
                    <div className="saved-tag-picker">
                      {TAGS.map((tag) => {
                        const s = TAG_STYLES[tag];
                        const active = r.tag === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => { updateRecord(r.id, { tag }); showToast(`Tagged as ${tag}`); }}
                            style={{
                              background: active ? s.bg : "transparent",
                              color:      active ? s.color : "#888",
                              border:     active ? `1px solid ${s.color}33` : "0.5px solid #e0e0e0",
                              borderRadius: 99,
                              padding: "4px 14px",
                              fontSize: 12,
                              fontWeight: active ? 600 : 400,
                              cursor: "pointer",
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="saved-section">
                    <div className="saved-section-label">Notes</div>
                    <textarea
                      className="saved-notes"
                      placeholder="Add notes about this property..."
                      value={editingNotes[r.id] ?? r.notes ?? ""}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      rows={3}
                    />
                    <button
                      type="button"
                      className="saved-btn-primary"
                      onClick={() => saveNotes(r.id)}
                    >
                      Save Notes
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="saved-actions">
                    <button
                      type="button"
                      className="saved-btn-delete"
                      onClick={() => deleteRecord(r.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Saved;
