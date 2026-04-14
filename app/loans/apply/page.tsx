"use client";

import { useState } from "react";
import Image from "next/image";

interface FormData {
  // Section 1 — Loan
  loan_type: string;
  loan_purpose: string;
  loan_amount: string;
  loan_term_months: string;
  repayment_method: string;
  estimated_rental: string;

  // Section 2 — Property
  property_address: string;
  property_type: string;
  property_status: string;
  property_value: string;
  purchase_price: string;
  charge_type: string;

  // Section 3 — Applicant
  applicant_type: string;
  title: string;
  first_name: string;
  surname: string;
  dob: string;
  marital_status: string;
  current_address: string;
  mobile: string;
  email: string;

  // Corporate
  company_name: string;
  company_type: string;
  company_reg: string;
  registered_address: string;
  directors: string;
  contact_name: string;
  contact_position: string;
  company_phone: string;
  company_email: string;

  // Section 4 — Financial Background
  refused_mortgage: string;
  has_ccj: string;
  has_bankruptcy: string;
  missed_payments: string;
  has_arrears: string;
  broker_name: string;
  broker_email: string;
  consent: boolean;
}

const defaultForm: FormData = {
  loan_type: "bridging",
  loan_purpose: "purchase",
  loan_amount: "",
  loan_term_months: "12",
  repayment_method: "sale",
  estimated_rental: "",
  property_address: "",
  property_type: "Residential",
  property_status: "purchasing",
  property_value: "",
  purchase_price: "",
  charge_type: "first",
  applicant_type: "personal",
  title: "",
  first_name: "",
  surname: "",
  dob: "",
  marital_status: "",
  current_address: "",
  mobile: "",
  email: "",
  company_name: "",
  company_type: "Ltd",
  company_reg: "",
  registered_address: "",
  directors: "",
  contact_name: "",
  contact_position: "",
  company_phone: "",
  company_email: "",
  refused_mortgage: "no",
  has_ccj: "no",
  has_bankruptcy: "no",
  missed_payments: "no",
  has_arrears: "no",
  broker_name: "",
  broker_email: "",
  consent: false,
};

type Section = 1 | 2 | 3 | 4;

const GOLD = "#C9A84C";
const SURFACE = "#16161C";
const BORDER = "rgba(201,168,76,0.15)";
const TEXT_DIM = "rgba(232,228,220,0.55)";
const TEXT = "#E8E4DC";
const BG = "#0F0F13";

export default function LoanApplyPage() {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [section, setSection] = useState<Section>(1);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ name: string; ref: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateSection(s: Section): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.loan_amount || isNaN(Number(form.loan_amount))) errs.loan_amount = "Required";
    }
    if (s === 2) {
      if (!form.property_address.trim()) errs.property_address = "Required";
      if (!form.property_value || isNaN(Number(form.property_value))) errs.property_value = "Required";
    }
    if (s === 3) {
      if (form.applicant_type === "personal") {
        if (!form.first_name.trim()) errs.first_name = "Required";
        if (!form.surname.trim()) errs.surname = "Required";
        if (!form.email.trim()) errs.email = "Required";
      } else {
        if (!form.company_name.trim()) errs.company_name = "Required";
        if (!form.company_email.trim()) errs.company_email = "Required";
      }
    }
    if (s === 4) {
      if (!form.consent) errs.consent = "You must confirm the declaration";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextSection() {
    if (validateSection(section)) {
      setSection((s) => (s < 4 ? ((s + 1) as Section) : s));
    }
  }

  async function handleSubmit() {
    if (!validateSection(4)) return;
    setSubmitting(true);
    setServerError(null);

    const isPersonal = form.applicant_type === "personal";
    const applicantName = isPersonal
      ? `${form.title ? form.title + " " : ""}${form.first_name} ${form.surname}`.trim()
      : form.contact_name || form.company_name;
    const applicantEmail = isPersonal ? form.email : form.company_email;
    const applicantPhone = isPersonal ? form.mobile : form.company_phone;

    const body = {
      loan_type: form.loan_type,
      loan_purpose: form.loan_purpose,
      loan_amount_pence: Math.round(Number(form.loan_amount) * 100),
      loan_term_months: Number(form.loan_term_months),
      repayment_method: form.repayment_method,
      estimated_rental_pence: form.estimated_rental
        ? Math.round(Number(form.estimated_rental) * 100)
        : undefined,
      property_address: form.property_address,
      property_type: form.property_type,
      property_status: form.property_status,
      property_value_pence: Math.round(Number(form.property_value) * 100),
      purchase_price_pence: form.purchase_price
        ? Math.round(Number(form.purchase_price) * 100)
        : undefined,
      charge_type: form.charge_type,
      applicant_type: form.applicant_type,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      applicant_phone: applicantPhone || undefined,
      company_name: !isPersonal ? form.company_name : undefined,
      refused_mortgage: form.refused_mortgage === "yes",
      has_ccj: form.has_ccj === "yes",
      has_bankruptcy: form.has_bankruptcy === "yes",
      missed_payments: form.missed_payments === "yes",
      has_arrears: form.has_arrears === "yes",
      broker_name: form.broker_name || undefined,
      broker_email: form.broker_email || undefined,
      source: "website",
    };

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { application?: { id: string }; error?: string };

      if (!res.ok) {
        setServerError(data.error ?? "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }

      setSuccess({
        name: applicantName,
        ref: (data.application?.id ?? "").slice(0, 8).toUpperCase(),
      });
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ backgroundColor: BG, minHeight: "100vh", color: TEXT }} className="flex items-center justify-center p-6">
        <div
          className="w-full max-w-lg rounded-xl p-8 text-center space-y-5"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-semibold" style={{ color: GOLD }}>
            Enquiry Received
          </h2>
          <p className="text-base leading-relaxed">
            Thank you, <strong>{success.name}</strong>. Your loan enquiry has been received. Our team will review your
            application and respond within <strong>24 hours</strong>.
          </p>
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: "rgba(201,168,76,0.08)", border: `1px solid ${BORDER}` }}
          >
            <p className="text-sm" style={{ color: TEXT_DIM }}>Reference</p>
            <p className="text-lg font-mono font-bold" style={{ color: GOLD }}>
              {success.ref}
            </p>
          </div>
          <div className="space-y-1 pt-2">
            <p className="text-sm" style={{ color: TEXT_DIM }}>Questions? Get in touch:</p>
            <p className="text-sm">
              📞 <a href="tel:07454753318" style={{ color: GOLD }}>07454 753318</a>
            </p>
            <p className="text-sm">
              💬 <a href="https://wa.me/447454753318" style={{ color: GOLD }} target="_blank" rel="noopener noreferrer">
                WhatsApp: 07454 753318
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: `1px solid ${BORDER}`,
    borderRadius: "6px",
    color: TEXT,
    padding: "9px 12px",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    color: TEXT_DIM,
    marginBottom: "4px",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#ef4444",
    marginTop: "3px",
  };

  function Field({
    label,
    required,
    error,
    children,
  }: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
  }) {
    return (
      <div>
        <label style={labelStyle}>
          {label}
          {required && <span style={{ color: GOLD }}> *</span>}
        </label>
        {children}
        {error && <p style={errorStyle}>{error}</p>}
      </div>
    );
  }

  function Select({
    field,
    options,
  }: {
    field: keyof FormData;
    options: { value: string; label: string }[];
  }) {
    return (
      <select
        value={form[field] as string}
        onChange={(e) => set(field, e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ backgroundColor: SURFACE }}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  function YesNo({ field }: { field: keyof FormData }) {
    return (
      <div className="flex gap-4">
        {["no", "yes"].map((v) => (
          <label key={v} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={field}
              value={v}
              checked={form[field] === v}
              onChange={() => set(field, v)}
              style={{ accentColor: GOLD }}
            />
            <span style={{ fontSize: "14px", color: TEXT }}>{v === "yes" ? "Yes" : "No"}</span>
          </label>
        ))}
      </div>
    );
  }

  const sectionTitles = ["Loan Requirements", "Property Security", "Applicant Details", "Financial Background"];

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh", color: TEXT }}>
      {/* Header */}
      <div
        className="w-full py-6 px-6"
        style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: SURFACE }}
      >
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo.png"
            alt="Midas"
            width={120}
            height={40}
            style={{ objectFit: "contain" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <h1 className="text-xl font-semibold" style={{ color: GOLD }}>
            Private Bridging Loan Application
          </h1>
          <p className="text-sm" style={{ color: TEXT_DIM }}>
            Midas Property Auctions — London
          </p>
          <p className="text-sm max-w-md" style={{ color: TEXT_DIM }}>
            Complete this form to submit your loan enquiry. We respond within 24 hours.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Section tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto">
          {sectionTitles.map((title, idx) => {
            const s = (idx + 1) as Section;
            const active = s === section;
            const done = s < section;
            return (
              <button
                key={s}
                onClick={() => { if (done || active) setSection(s); }}
                className="flex-1 rounded-md py-2 px-3 text-xs font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: active
                    ? "rgba(201,168,76,0.15)"
                    : done
                    ? "rgba(201,168,76,0.06)"
                    : "transparent",
                  color: active ? GOLD : done ? "rgba(201,168,76,0.7)" : TEXT_DIM,
                  border: `1px solid ${active ? BORDER : "transparent"}`,
                  minWidth: "100px",
                }}
              >
                {done ? "✓ " : ""}{title}
              </button>
            );
          })}
        </div>

        {/* Section 1 — Loan Requirements */}
        {section === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold" style={{ color: GOLD }}>
              Section 1 — Loan Requirements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Loan Type" required>
                <Select
                  field="loan_type"
                  options={[
                    { value: "bridging", label: "Bridging (No Works)" },
                    { value: "refurb", label: "Light Refurbishment" },
                    { value: "commercial", label: "Commercial" },
                    { value: "rebridging", label: "Re-bridge" },
                  ]}
                />
              </Field>
              <Field label="Loan Purpose" required>
                <Select
                  field="loan_purpose"
                  options={[
                    { value: "purchase", label: "Purchase" },
                    { value: "refinance", label: "Refinance" },
                    { value: "rebridge", label: "Re-bridge" },
                    { value: "cap_raise", label: "Capital Raise" },
                  ]}
                />
              </Field>
              <Field label="Loan Amount £" required error={errors.loan_amount}>
                <input
                  type="number"
                  placeholder="e.g. 120000"
                  value={form.loan_amount}
                  onChange={(e) => set("loan_amount", e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Loan Term" required>
                <Select
                  field="loan_term_months"
                  options={[
                    { value: "3", label: "3 months" },
                    { value: "6", label: "6 months" },
                    { value: "9", label: "9 months" },
                    { value: "12", label: "12 months" },
                    { value: "18", label: "18 months" },
                    { value: "24", label: "24 months" },
                  ]}
                />
              </Field>
              <Field label="Repayment Method" required>
                <Select
                  field="repayment_method"
                  options={[
                    { value: "sale", label: "Sale" },
                    { value: "refinance", label: "Refinance" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </Field>
              <Field label="Estimated Rental Income £/mo (optional)">
                <input
                  type="number"
                  placeholder="e.g. 1200"
                  value={form.estimated_rental}
                  onChange={(e) => set("estimated_rental", e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Section 2 — Property Security */}
        {section === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold" style={{ color: GOLD }}>
              Section 2 — Property Security
            </h2>
            <Field label="Property Address" required error={errors.property_address}>
              <input
                type="text"
                placeholder="Full property address"
                value={form.property_address}
                onChange={(e) => set("property_address", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Property Type">
                <Select
                  field="property_type"
                  options={[
                    { value: "Residential", label: "Residential" },
                    { value: "HMO", label: "HMO" },
                    { value: "Commercial", label: "Commercial" },
                    { value: "Mixed Use", label: "Mixed Use" },
                    { value: "Land", label: "Land" },
                    { value: "Development", label: "Development" },
                  ]}
                />
              </Field>
              <Field label="Property Status">
                <Select
                  field="property_status"
                  options={[
                    { value: "owned", label: "Already Owned" },
                    { value: "purchasing", label: "Being Purchased" },
                  ]}
                />
              </Field>
              <Field label="Estimated Property Value £" required error={errors.property_value}>
                <input
                  type="number"
                  placeholder="e.g. 175000"
                  value={form.property_value}
                  onChange={(e) => set("property_value", e.target.value)}
                  style={inputStyle}
                />
              </Field>
              {form.property_status === "purchasing" && (
                <Field label="Purchase Price £">
                  <input
                    type="number"
                    placeholder="e.g. 160000"
                    value={form.purchase_price}
                    onChange={(e) => set("purchase_price", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              )}
              <Field label="Charge Type">
                <Select
                  field="charge_type"
                  options={[
                    { value: "first", label: "First Charge" },
                    { value: "second", label: "Second Charge" },
                  ]}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Section 3 — Applicant Details */}
        {section === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold" style={{ color: GOLD }}>
              Section 3 — Applicant Details
            </h2>
            <Field label="Application Type">
              <div className="flex gap-4">
                {["personal", "corporate"].map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={t}
                      checked={form.applicant_type === t}
                      onChange={() => set("applicant_type", t)}
                      style={{ accentColor: GOLD }}
                    />
                    <span style={{ fontSize: "14px", color: TEXT }}>
                      {t === "personal" ? "Personal" : "Corporate"}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            {form.applicant_type === "personal" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Title">
                  <Select
                    field="title"
                    options={[
                      { value: "", label: "Select..." },
                      { value: "Mr", label: "Mr" },
                      { value: "Mrs", label: "Mrs" },
                      { value: "Miss", label: "Miss" },
                      { value: "Ms", label: "Ms" },
                      { value: "Dr", label: "Dr" },
                    ]}
                  />
                </Field>
                <Field label="First Name" required error={errors.first_name}>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => set("first_name", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Surname" required error={errors.surname}>
                  <input
                    type="text"
                    value={form.surname}
                    onChange={(e) => set("surname", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Date of Birth">
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => set("dob", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Mobile">
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => set("mobile", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Email" required error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Current Address">
                    <input
                      type="text"
                      value={form.current_address}
                      onChange={(e) => set("current_address", e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company Name" required error={errors.company_name}>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) => set("company_name", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Company Type">
                  <Select
                    field="company_type"
                    options={[
                      { value: "Ltd", label: "Ltd" },
                      { value: "LLP", label: "LLP" },
                      { value: "Partnership", label: "Partnership" },
                    ]}
                  />
                </Field>
                <Field label="Company Reg Number">
                  <input
                    type="text"
                    value={form.company_reg}
                    onChange={(e) => set("company_reg", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Directors Names">
                  <input
                    type="text"
                    placeholder="Comma-separated"
                    value={form.directors}
                    onChange={(e) => set("directors", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Contact Name">
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Position">
                  <input
                    type="text"
                    value={form.contact_position}
                    onChange={(e) => set("contact_position", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.company_phone}
                    onChange={(e) => set("company_phone", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Email" required error={errors.company_email}>
                  <input
                    type="email"
                    value={form.company_email}
                    onChange={(e) => set("company_email", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Registered Address">
                    <input
                      type="text"
                      value={form.registered_address}
                      onChange={(e) => set("registered_address", e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 4 — Financial Background */}
        {section === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: GOLD }}>
              Section 4 — Financial Background
            </h2>
            <div className="space-y-5">
              {(
                [
                  { field: "refused_mortgage" as const, label: "Have you ever been refused a mortgage?" },
                  { field: "has_ccj" as const, label: "Have you ever had a CCJ recorded against you?" },
                  { field: "has_bankruptcy" as const, label: "Have you ever been declared bankrupt or entered an IVA?" },
                  { field: "missed_payments" as const, label: "Have you ever failed to keep up mortgage or loan payments?" },
                  { field: "has_arrears" as const, label: "Do you have any current arrears?" },
                ] as const
              ).map(({ field, label }) => (
                <div key={field} className="flex items-start justify-between gap-4">
                  <span style={{ fontSize: "14px", color: TEXT, flex: 1 }}>{label}</span>
                  <YesNo field={field} />
                </div>
              ))}
            </div>

            <div
              className="rounded-lg p-4 space-y-4 mt-4"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}
            >
              <p className="text-sm font-medium" style={{ color: TEXT_DIM }}>
                Broker (optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Broker Name">
                  <input
                    type="text"
                    value={form.broker_name}
                    onChange={(e) => set("broker_name", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Broker Email">
                  <input
                    type="email"
                    value={form.broker_email}
                    onChange={(e) => set("broker_email", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}
            >
              <label className="flex gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  style={{ accentColor: GOLD, marginTop: "2px", flexShrink: 0 }}
                />
                <span style={{ fontSize: "13px", color: TEXT_DIM, lineHeight: "1.6" }}>
                  I confirm that the information provided is accurate and I consent to Midas Property Auctions
                  processing my application in accordance with their privacy policy.
                </span>
              </label>
              {errors.consent && <p style={errorStyle}>{errors.consent}</p>}
            </div>

            {serverError && (
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <p style={{ fontSize: "13px", color: "#ef4444" }}>{serverError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8 pt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
          {section > 1 ? (
            <button
              onClick={() => setSection((s) => (s > 1 ? ((s - 1) as Section) : s))}
              className="px-4 py-2 rounded-md text-sm transition-colors"
              style={{ color: TEXT_DIM, border: `1px solid ${BORDER}` }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {section < 4 ? (
            <button
              onClick={nextSection}
              className="px-6 py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: GOLD, color: "#0F0F13" }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: GOLD, color: "#0F0F13" }}
            >
              {submitting ? "Submitting…" : "Submit Loan Enquiry →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
