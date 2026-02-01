import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./CreateListing.css";
import "./About.css";

const CreateListing = () => {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    deal_type: "",
    seller_motivation: "",

    street: "",
    city: "",
    state: "",
    zip: "",

    property_type: "",
    year_built: "",
    floors: "",

    beds: "",
    baths: "",
    sqft: "",

    price: "",
    arv: "",

    description: "",

    contact_phone: "",
    contact_email: ""
  });

  /* ================= AUTH ================= */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setLoading(false);
        return;
      }

      setUser(data.session.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_provider")
        .eq("id", data.session.user.id)
        .single();

      setProfile(profile);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <main className="about-page">
        <div className="about-container provider-dashboard">
          <p>Loading…</p>
        </div>
      </main>
    );
  }

  if (!profile?.is_provider) {
    return (
      <main className="about-page">
        <div className="about-container provider-dashboard">
          <h1 className="about-title">Provider access required</h1>
          <p className="about-subtitle">
            You must be approved as a provider to create listings.
          </p>
        </div>
      </main>
    );
  }

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ================= SAVE DRAFT ================= */
  const saveDraft = async () => {
    const payload = {
      provider_id: user.id,
      deal_status: "draft",
      is_published: false,

      ...form,

      year_built: form.year_built ? Number(form.year_built) : null,
      floors: form.floors ? Number(form.floors) : null,
      beds: form.beds ? Number(form.beds) : null,
      baths: form.baths ? Number(form.baths) : null,
      sqft: form.sqft ? Number(form.sqft) : null,
      price: form.price ? Number(form.price) : null,
      arv: form.arv ? Number(form.arv) : null
    };

    const { data, error } = await supabase
      .from("off_market_listings")
      .insert(payload)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setListingId(data.id);
    setStep(8);
  };

  /* ================= PHOTO UPLOAD ================= */
  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || !listingId) return;

    setUploading(true);

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `${listingId}/${fileName}`;

      await supabase.storage
        .from("listing-photos")
        .upload(filePath, file);
    }

    setUploading(false);
    alert("Photos uploaded!");
  };

  /* ================= SUBMIT FOR REVIEW ================= */
  const submitForReview = async () => {
    if (!listingId) return;

    setSubmitting(true);

    const { error } = await supabase
      .from("off_market_listings")
      .update({
  deal_status: "pending_review",
  is_published: false
})

      .eq("id", listingId);

    setSubmitting(false);

    if (error) {
      alert("Error submitting listing for review.");
      return;
    }

    alert("Listing submitted for review 🎉");
  };

  return (
    <main className="about-page">
      <div className="about-container provider-dashboard">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="question-card">
            <h2>Who are you in this deal?</h2>
            <div className="radio-grid">
              {["Wholesaler", "Property owner", "Licensed agent", "Representing the owner"].map((o) => (
                <label key={o} className="radio-card">
                  <input
                    type="radio"
                    checked={form.deal_type === o}
                    onChange={() => update("deal_type", o)}
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
            <div className="question-actions">
              <button className="btn-primary" onClick={() => setStep(2)}>Continue</button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="question-card">
            <h2>How soon does the owner want to sell?</h2>
            <div className="radio-grid">
              {["ASAP (0–30 days)", "1–3 months", "3–6 months", "Just testing the market"].map((o) => (
                <label key={o} className="radio-card">
                  <input
                    type="radio"
                    checked={form.seller_motivation === o}
                    onChange={() => update("seller_motivation", o)}
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
            <div className="question-actions">
              <button onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        )}

        {/* STEP 3 – LOCATION */}
        {step === 3 && (
          <div className="review-card">
            <h2>Property location</h2>
            <div className="input-grid">
              <input placeholder="Street" onChange={(e) => update("street", e.target.value)} />
              <input placeholder="City" onChange={(e) => update("city", e.target.value)} />
              <input placeholder="State" onChange={(e) => update("state", e.target.value)} />
              <input placeholder="ZIP" onChange={(e) => update("zip", e.target.value)} />
            </div>
            <div className="question-actions">
              <button onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(4)}>Continue</button>
            </div>
          </div>
        )}

        {/* STEP 4 – PROPERTY DETAILS */}
        {step === 4 && (
          <div className="review-card">
            <h2>Property details</h2>
            <div className="input-grid">
              <input placeholder="Property type" onChange={(e) => update("property_type", e.target.value)} />
              <input placeholder="Year built" onChange={(e) => update("year_built", e.target.value)} />
              <input placeholder="Floors / Stories" onChange={(e) => update("floors", e.target.value)} />
            </div>
            <div className="question-actions">
              <button onClick={() => setStep(3)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(5)}>Continue</button>
            </div>
          </div>
        )}

        {/* STEP 5 – SIZE */}
        {step === 5 && (
          <div className="review-card">
            <h2>Size & layout</h2>
            <div className="input-grid">
              <input placeholder="Bedrooms" onChange={(e) => update("beds", e.target.value)} />
              <input placeholder="Bathrooms" onChange={(e) => update("baths", e.target.value)} />
              <input placeholder="Square feet" onChange={(e) => update("sqft", e.target.value)} />
            </div>
            <div className="question-actions">
              <button onClick={() => setStep(4)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(6)}>Continue</button>
            </div>
          </div>
        )}

        {/* STEP 6 – DEAL NUMBERS */}
        {step === 6 && (
          <div className="review-card">
            <h2>Deal numbers</h2>
            <div className="input-grid">
              <input placeholder="Asking price" onChange={(e) => update("price", e.target.value)} />
              <input placeholder="Estimated ARV" onChange={(e) => update("arv", e.target.value)} />
            </div>
            <div className="question-actions">
              <button onClick={() => setStep(5)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(7)}>Continue</button>
            </div>
          </div>
        )}

        {/* STEP 7 – CONTACT */}
        {step === 7 && (
          <div className="review-card">
            <h2>Contact information</h2>
            <div className="input-grid">
              <input placeholder="Phone number" onChange={(e) => update("contact_phone", e.target.value)} />
              <input placeholder="Email address" onChange={(e) => update("contact_email", e.target.value)} />
            </div>
            <textarea
              placeholder="Additional notes for buyers…"
              onChange={(e) => update("description", e.target.value)}
            />
            <div className="question-actions">
              <button onClick={() => setStep(6)}>Back</button>
              <button className="btn-primary" onClick={saveDraft}>
                Save listing
              </button>
            </div>
          </div>
        )}

        {/* STEP 8 – PHOTOS + SUBMIT */}
        {step === 8 && (
          <div className="question-card">
            <h2>Upload photos</h2>
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} />
            {uploading && <p>Uploading photos…</p>}

            <div className="question-actions">
              <button onClick={() => setStep(7)}>Back</button>
              <button
                className="btn-primary"
                disabled={submitting}
                onClick={submitForReview}
              >
                {submitting ? "Submitting…" : "Submit for review"}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
};

export default CreateListing;
