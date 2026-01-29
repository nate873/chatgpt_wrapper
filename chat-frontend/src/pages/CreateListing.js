import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./ProviderDashboard.css";

const CreateListing = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [photos, setPhotos] = useState([]);

  const [form, setForm] = useState({
    title: "",
    property_type: "",
    street: "",
    city: "",
    state: "",
    price: "",
    arv: "",
    beds: "",
    baths: "",
    sqft: "",
    description: ""
  });

  /* ================= LOAD USER + PROFILE ================= */
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select("is_provider, provider_approved")
        .eq("id", user.id)
        .single();

      if (!error) setProfile(data);
    };

    loadUser();
  }, []);

  if (!profile) {
    return (
      <div className="provider-dashboard">
        <p>Loading…</p>
      </div>
    );
  }

  /* ================= PROVIDER GATE ================= */
  if (!profile.is_provider) {
    return (
      <div className="provider-dashboard">
        <h1>Provider Access Required</h1>
        <p>You must apply as a provider before creating listings.</p>
      </div>
    );
  }

  /* ================= FORM HANDLER ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= SAVE DRAFT ================= */
  const saveDraft = async () => {
    const payload = {
      provider_id: user.id,
      deal_status: "draft",
      is_published: false,

      title: form.title || null,
      property_type: form.property_type || null,
      street: form.street || null,
      city: form.city || null,
      state: form.state || null,
      description: form.description || null,

      price: form.price ? Number(form.price) : null,
      arv: form.arv ? Number(form.arv) : null,
      beds: form.beds ? Number(form.beds) : null,
      baths: form.baths ? Number(form.baths) : null,
      sqft: form.sqft ? Number(form.sqft) : null
    };

    const { data, error } = await supabase
      .from("off_market_listings")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("INSERT ERROR:", error);
      alert(error.message);
      return;
    }

    setListingId(data.id);
    alert("Draft saved — you can now upload photos");
  };

  /* ================= PHOTO UPLOAD ================= */
  const uploadPhoto = async (file) => {
    if (!listingId) {
      alert("Save the listing first");
      return;
    }

    const filePath = `${listingId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-photos")
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Photo upload failed");
      return;
    }

    const { data } = supabase.storage
      .from("listing-photos")
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from("listing_photos")
      .insert({
        listing_id: listingId,
        url: data.publicUrl
      });

    if (!dbError) {
      setPhotos((prev) => [...prev, data.publicUrl]);
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="provider-dashboard">
      <div className="dashboard-header">
        <h1>Create Listing</h1>
      </div>

      {!profile.provider_approved && (
        <div className="provider-notice">
          Your account is unverified. Listings are allowed, but verified providers
          receive higher visibility.
        </div>
      )}

      <div className="provider-form">
        <input name="title" placeholder="Title" onChange={handleChange} />
        <input
          name="property_type"
          placeholder="Property Type"
          onChange={handleChange}
        />
        <input name="street" placeholder="Street" onChange={handleChange} />
        <input name="city" placeholder="City" onChange={handleChange} />
        <input name="state" placeholder="State" onChange={handleChange} />

        <input
          name="price"
          type="number"
          placeholder="Price"
          onChange={handleChange}
        />
        <input
          name="arv"
          type="number"
          placeholder="ARV"
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
        />

        <button className="btn-primary" onClick={saveDraft}>
          Save Draft
        </button>
      </div>

      {/* ================= PHOTOS ================= */}
      {listingId && (
        <>
          <h3 style={{ marginTop: 32 }}>Photos</h3>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files);
              for (const file of files) {
                await uploadPhoto(file);
              }
            }}
          />

          <div className="photo-grid">
            {photos.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="Listing"
                style={{
                  width: 140,
                  height: 100,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginRight: 10,
                  marginTop: 10
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CreateListing;