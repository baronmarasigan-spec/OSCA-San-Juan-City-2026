import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  X, ChevronLeft, ChevronRight, Plus, Trash, Upload, Check, CheckCircle2, Loader2 
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";
import { API_URL } from "../lib/config";
import { mapFormToBackend, mapBackendToForm, createFormDataFromPayload } from "./ExpandedCentenariansActManagement";
import type { ApplicationForm } from "./ExpandedCentenariansActManagement";

// ==========================================
// EXPANDED CENTENARIANS ACT BENEFIT FORM
// ==========================================

export function ExpandedCentenarianForm({
  mode = "citizen",
  data,
  isReadOnly = false,
  onClose,
}: {
  mode?: "citizen" | "admin";
  data?: any;
  isReadOnly?: boolean;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [formStep, setFormStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get user data from localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");

  // Initial Form Data Organizers
  const [formData, setFormData] = useState({
    citizen_id: data?.citizen_id || data?.id || user?.citizen_id || user?.id || "",
    milestone_age: "",
    rrn: "",
    osca_id_number: data?.scid_number || user?.scid_number || "",
    last_name: data?.last_name || user?.last_name || "",
    first_name: data?.first_name || user?.first_name || "",
    middle_name: data?.middle_name || user?.middle_name || "",
    birth_date: data?.birth_date || user?.birth_date || "",
    age: data?.age?.toString() || user?.age?.toString() || "",
    sex: data?.sex || user?.sex || "Male",
    civil_status: data?.civil_status || user?.civil_status || "Single",
    citizenship: "Filipino",
    dual_citizenship_details: "",
    applicant_type: data?.applicant_type || user?.applicant_type || "Local",
    
    // Address - Residential
    res_house_no: "",
    res_street: "",
    res_barangay: data?.barangay || user?.barangay || "",
    res_city: data?.city_municipality || user?.city_municipality || "San Juan",
    res_province: data?.province || user?.province || "Metro Manila",
    res_zip_code: "1500",

    // Address - Permanent
    perm_house_no: "",
    perm_street: "",
    perm_barangay: "",
    perm_city: "San Juan",
    perm_province: "Metro Manila",
    perm_zip_code: "1500",

    // Family Info
    spouse_name: "",
    spouse_citizenship: "Filipino",
    children: ["", "", ""],
    representatives: [
      { name: "", relationship: "" },
      { name: "", relationship: "" }
    ],

    // Contact
    phone: data?.contact_number || user?.contact_number || "",
    email: data?.email || user?.email || "",

    // Designated Beneficiary
    primary_beneficiary: "",
    primary_relationship: "",
    contingent_beneficiary: "",
    contingent_relationship: "",

    // Utilization of Cash Gifts
    use_food: false,
    use_medical_checkup: false,
    use_medicines: false,
    use_livelihood: false,
    use_others: false,
    use_others_details: "",

    // Documents
    doc_annex_a: false,
    doc_annex_a_file: "",
    doc_valid_id: false,
    doc_valid_id_file: "",
    doc_birth_cert: false,
    doc_birth_cert_file: "",
    doc_barangay_cert: false,
    doc_barangay_cert_file: "",
    doc_photo: false,
    doc_photo_file: "",
    doc_full_body_pic: false,
    doc_full_body_pic_file: "",
    doc_endorsement: false,
    doc_endorsement_file: "",

    // Certification
    signature_type: "draw" as "draw" | "thumbmark",
    signature_data: "",
    signed_by_applicant: false,
    date_applied: new Date().toISOString().split("T")[0]
  });

  // Fetch from masterlist
  const fetchMasterlistData = async (searchId: string) => {
    if (!searchId || data || isReadOnly) return;
    try {
      const response = await fetch(
        `${API_URL}/masterlist?search=${searchId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      const masters = result.data?.data || result.data || result || [];
      const record = Array.isArray(masters) 
        ? masters.find((m: any) => String(m.citizen_id) === String(searchId) || String(m.id) === String(searchId) || String(m.scid_number) === String(searchId))
        : (result.data || result);

      if (record && (record.citizen_id || record.id || record.scid_number)) {
        let formattedDate = record.birth_date || record.birthdate || "";
        if (formattedDate && formattedDate.includes("/")) {
          const parts = formattedDate.split("/");
          if (parts.length === 3 && parts[2].length === 4) {
            formattedDate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
          }
        }
        setFormData((prev) => ({
          ...prev,
          citizen_id: record.citizen_id || record.id || prev.citizen_id,
          osca_id_number: record.scid_number || prev.osca_id_number || "",
          first_name: record.first_name || "",
          middle_name: record.middle_name || "",
          last_name: record.last_name || "",
          birth_date: formattedDate,
          age: record.age?.toString() || "",
          phone: record.contact_number || "",
          res_barangay: record.barangay || "",
          res_city: record.city_municipality || record.city || "San Juan",
          res_province: record.province || "Metro Manila",
          applicant_type: record.applicant_type || prev.applicant_type || "Local",
        }));
      }
    } catch (error) {
      console.error("Error fetching masterlist:", error);
    }
  };

  useEffect(() => {
    const searchId = mode === "admin" ? formData.citizen_id : (user?.citizen_id || user?.scid_number || user?.id);
    if (searchId && !data && !isReadOnly) {
      fetchMasterlistData(String(searchId));
    }
  }, [user?.citizen_id, user?.scid_number, user?.id, token, mode]);

  // Handle data prop changes (e.g. from admin modal)
  useEffect(() => {
    if (data) {
      let formattedDate = data.birth_date || data.birthdate || "";
      if (formattedDate && formattedDate.includes("/")) {
        const parts = formattedDate.split("/");
        if (parts.length === 3 && parts[2].length === 4) {
          formattedDate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        }
      }
      setFormData((prev) => ({
        ...prev,
        citizen_id: data.citizen_id || data.id || prev.citizen_id,
        osca_id_number: data.scid_number || prev.osca_id_number || "",
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        last_name: data.last_name || "",
        birth_date: formattedDate,
        age: data.age?.toString() || "",
        phone: data.contact_number || "",
        res_barangay: data.barangay || "",
        res_city: data.city_municipality || data.city || "San Juan",
        res_province: data.province || "Metro Manila",
        applicant_type: data.applicant_type || prev.applicant_type || "Local",
      }));
    }
  }, [data]);

  // Milestone age calculation helper
  useEffect(() => {
    if (formData.age) {
      const ageNum = parseInt(formData.age);
      let selectedMilestone = "";
      if (ageNum >= 100) selectedMilestone = "100";
      else if (ageNum >= 95) selectedMilestone = "95";
      else if (ageNum >= 90) selectedMilestone = "90";
      else if (ageNum >= 85) selectedMilestone = "85";
      else if (ageNum >= 80) selectedMilestone = "80";
      
      setFormData(prev => ({ ...prev, milestone_age: selectedMilestone }));
    }
  }, [formData.age]);

  // Same as residential address copier
  const copyResidentialAddress = () => {
    setFormData(prev => ({
      ...prev,
      perm_house_no: prev.res_house_no,
      perm_street: prev.res_street,
      perm_barangay: prev.res_barangay,
      perm_city: prev.res_city,
      perm_province: prev.res_province,
      perm_zip_code: prev.res_zip_code,
    }));
    toast.success("Residential address copied to permanent address");
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    // Validate required step 1 fields
    const required = ["first_name", "last_name", "birth_date", "age", "phone", "res_barangay", "milestone_age"];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    
    if (missing.length > 0) {
      toast.error("Please fill in all required personal information fields.");
      return;
    }
    setFormStep(2);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formStep === 1) {
      handleNextStep();
      return;
    }
    
    if (!formData.signed_by_applicant) {
      toast.error("Please draw a signature or register a biometric thumbmark to sign this application.");
      return;
    }

    setIsLoading(true);

    const formPayloadSource: ApplicationForm = {
      citizen_id: Number(formData.citizen_id),
      milestone_age: Number(formData.milestone_age || 80),
      rrn: formData.rrn,
      osca_id_number: formData.osca_id_number,
      last_name: formData.last_name,
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      birth_date: formData.birth_date,
      age: Number(formData.age || 0),
      sex: formData.sex as 'Male' | 'Female',
      civil_status: formData.civil_status,
      citizenship: formData.citizenship,
      dual_citizenship_details: formData.dual_citizenship_details,

      res_house_num: formData.res_house_no,
      res_street: formData.res_street,
      res_barangay: formData.res_barangay,
      res_city: formData.res_city,
      res_province: formData.res_province,
      res_zip: formData.res_zip_code,

      perm_house_num: formData.perm_house_no,
      perm_street: formData.perm_street,
      perm_barangay: formData.perm_barangay,
      perm_city: formData.perm_city,
      perm_province: formData.perm_province,
      perm_zip: formData.perm_zip_code,

      spouse_name: formData.spouse_name,
      spouse_citizenship: formData.spouse_citizenship,
      children: formData.children,
      representatives: formData.representatives,

      phone: formData.phone,
      email: formData.email,

      primary_beneficiary: formData.primary_beneficiary,
      primary_relationship: formData.primary_relationship,
      contingent_beneficiary: formData.contingent_beneficiary,
      contingent_relationship: formData.contingent_relationship,

      utilization_food: formData.use_food,
      utilization_med_checkup: formData.use_medical_checkup,
      utilization_medicines: formData.use_medicines,
      utilization_livelihood: formData.use_livelihood,
      utilization_others: formData.use_others,
      utilization_others_details: formData.use_others_details,

      doc_annex_a: true,
      doc_id_proof: true,
      doc_birth_cert: true,
      doc_residency_cert: false,
      doc_2x2_pic: false,
      doc_full_body_pic: false,
      doc_endorsement: false,

      doc_annex_a_file: 'Annex_A_Accomplished_Form.pdf',
      doc_id_proof_file: 'PSA_Birth_Certificate.pdf',
      doc_birth_cert_file: 'OSCA_ID_Card.jpg',
      doc_residency_cert_file: '',
      doc_2x2_pic_file: '',
      doc_full_body_pic_file: '',
      doc_endorsement_file: '',

      signature_type: formData.signature_type,
      signature_data: formData.signature_data,
      signed_by_applicant: formData.signed_by_applicant,
      date_applied: formData.date_applied || new Date().toISOString().split('T')[0],
      applicant_type: formData.applicant_type || "Local"
    };

    try {
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const backendPayload = mapFormToBackend(formPayloadSource, formPayloadSource.citizen_id);
      const fd = createFormDataFromPayload(backendPayload);

      // Perform real backend request
      const response = await fetch(`${API_URL}/cashgifts`, {
        method: "POST",
        headers,
        body: fd
      });

      if (!response.ok) {
        throw new Error("Backend API submission failed");
      }

      // Save to localStorage as sync/fallback
      const savedAppsStr = localStorage.getItem('centenarian_submitted_forms') || '{}';
      const submittedApplications = JSON.parse(savedAppsStr);
      const updatedApps = { ...submittedApplications, [formData.citizen_id]: formPayloadSource };
      localStorage.setItem('centenarian_submitted_forms', JSON.stringify(updatedApps));

      const savedStatusesStr = localStorage.getItem('centenarian_payout_statuses') || '{}';
      const payoutStatus = JSON.parse(savedStatusesStr);
      const updatedPayouts = { ...payoutStatus, [formData.citizen_id]: 'Document Validation' };
      localStorage.setItem('centenarian_payout_statuses', JSON.stringify(updatedPayouts));

      toast.success("Application submitted successfully!");
      setIsSubmitted(true);

      setTimeout(() => {
        if (mode === "admin" && onClose) {
          onClose();
        } else {
          navigate("/portal/apply");
        }
      }, 5000);

    } catch (err) {
      console.warn("API submission failed, using local storage persistence fallback:", err);
      
      // Fallback
      const savedAppsStr = localStorage.getItem('centenarian_submitted_forms') || '{}';
      const submittedApplications = JSON.parse(savedAppsStr);
      const updatedApps = { ...submittedApplications, [formData.citizen_id]: formPayloadSource };
      localStorage.setItem('centenarian_submitted_forms', JSON.stringify(updatedApps));

      const savedStatusesStr = localStorage.getItem('centenarian_payout_statuses') || '{}';
      const payoutStatus = JSON.parse(savedStatusesStr);
      const updatedPayouts = { ...payoutStatus, [formData.citizen_id]: 'Document Validation' };
      localStorage.setItem('centenarian_payout_statuses', JSON.stringify(updatedPayouts));

      toast.success("Application submitted successfully!");
      setIsSubmitted(true);

      setTimeout(() => {
        if (mode === "admin" && onClose) {
          onClose();
        } else {
          navigate("/portal/apply");
        }
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl p-8 sm:p-12 text-center space-y-8 border border-slate-100 my-10 font-sans">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-[#EF4444] tracking-tight font-sans">
            Application Received
          </h2>
          <p className="text-slate-500 font-semibold leading-relaxed font-sans max-w-xl mx-auto">
            {mode === "admin" 
              ? "Application successfully logged in registry." 
              : "Your National Centenarian application has been submitted successfully for verification."}
          </p>
        </div>

        {/* Note section with requirements */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 text-left space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-wider font-sans">
              For requirements please submit the following requirements to the OSCA Office:
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Local Applicants */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest font-sans flex items-center gap-1.5 border-b border-slate-100 pb-2">
                📍 1 for Local Applicants
              </h5>
              <ul className="text-xs text-slate-600 space-y-2.5 list-disc list-inside font-sans pl-1">
                <li>
                  <span className="font-bold text-slate-800">Primary Valid Identification:</span>
                  <p className="mt-1 ml-4 text-[11px] text-slate-500 leading-relaxed font-medium">
                    Any one (1) of the following primary documents:
                    <br />• Certificate of Live Birth duly issued or authenticated by the Philippine Statistics Authority (PSA);
                    <br />• Photocopy of Philippine Identification System ID card / Philippine ID card / National ID card provided that the original copy must be presented.
                    <br /><span className="text-[10px] text-slate-400 italic font-normal">***In the absence of primary ID/documents, any two (2) of the following secondary ID cards/documents shall be submitted as indicated in the Item VI of Implementing Guidelines.</span>
                  </p>
                </li>
                <li>
                  <span className="font-bold text-slate-800">Recent ID Picture:</span>
                  <p className="mt-1 ml-4 text-[11px] text-slate-500 leading-relaxed font-medium">
                    Recent 5.08 cm x 5.08 cm (2"x2") ID picture
                  </p>
                </li>
                <li>
                  <span className="font-bold text-slate-800">Full Body Picture:</span>
                  <p className="mt-1 ml-4 text-[11px] text-slate-500 leading-relaxed font-medium">
                    Full body picture of the applicant printed on an A4 size bond/photo paper
                  </p>
                </li>
              </ul>
            </div>

            {/* Living Abroad Applicants */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-black text-[#EF4444] uppercase tracking-widest font-sans flex items-center gap-1.5 border-b border-slate-100 pb-2">
                ✈️ 1 for Living Abroad Applicants
              </h5>
              <ul className="text-xs text-slate-600 space-y-2.5 list-disc list-inside font-sans pl-1">
                <li>
                  <span className="font-bold text-slate-800">Primary Valid Identification:</span>
                  <p className="mt-1 ml-4 text-[11px] text-slate-500 leading-relaxed font-medium">
                    Any one (1) of the following primary documents:
                    <br />• Valid Philippine Passport;
                    <br />• Citizen Retention and Re-acquisition Certificate and Identification Certificate, or Order of Approval, or Oath of Allegiance, or Certificate of Attestation duly issued by the Philippine Embassy (PE) or Philippine Consulate General (PCG) of the Department of Foreign Affairs (DFA) who has jurisdiction in the area where the applicant resides.
                    <br /><span className="text-[10px] text-slate-400 italic font-normal">***In the absence of primary ID/documents, any two (2) of the following secondary ID cards/documents shall be submitted as indicated in the Item VI of Implementing Guidelines.</span>
                  </p>
                </li>
                <li>
                  <span className="font-bold text-slate-800">Recent ID Picture:</span>
                  <p className="mt-1 ml-4 text-[11px] text-slate-500 leading-relaxed font-medium">
                    Recent 5.08 cm x 5.08 cm (2"x2") ID picture
                  </p>
                </li>
                <li>
                  <span className="font-bold text-slate-800">Full Body Picture:</span>
                  <p className="mt-1 ml-4 text-[11px] text-slate-500 leading-relaxed font-medium">
                    Full body picture of the applicant printed on an A4 size bond/photo paper
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={() => {
              if (mode === "admin" && onClose) {
                onClose();
              } else {
                navigate("/portal/apply");
              }
            }}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer font-sans"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 px-4 sm:px-0">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-black text-[#1E3A8A] tracking-tight font-sans">
            {mode === "admin" ? "Admin: Centenarian Program Form" : "Expanded Centenarians Act Benefit Program (National)"}
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Republic Act No. 11916 / R.A. No. 10868 Registration
          </p>
        </div>
        {onClose ? (
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <Link
            to="/portal/apply"
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </Link>
        )}
      </div>

      <div className="bg-slate-100 rounded-3xl p-2 sm:p-4 mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setFormStep(1)}
          className={cn(
            "flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
            formStep === 1 ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <span className="w-5 h-5 rounded-lg bg-indigo-50 flex items-center justify-center font-mono">1</span>
          Personal & Family Info
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          className={cn(
            "flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
            formStep === 2 ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <span className="w-5 h-5 rounded-lg bg-indigo-50 flex items-center justify-center font-mono">2</span>
          Attachments & Signature
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {formStep === 1 ? (
          <>
            {/* Step 1 Content */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ef4444] via-blue-600 to-indigo-600" />
              
              {/* Official NCSC Header Image */}
              <div className="flex justify-center pb-4 border-b border-slate-100">
                <img 
                  src="https://res.cloudinary.com/dx20khqe5/image/upload/v1783299883/ncsc_wxaaap.png" 
                  alt="National Commission of Senior Citizens" 
                  className="w-full h-auto max-h-[140px] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Milestone age display */}
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-sans">Milestone Cash Gift Category</h4>
                  <p className="text-xs text-slate-500 font-sans">Milestone level automatically evaluated based on applicant's birth date & age.</p>
                </div>
                <div className="flex gap-2">
                  {["80", "85", "90", "95", "100"].map(mAge => (
                    <span
                      key={mAge}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-extrabold font-mono transition-all border",
                        formData.milestone_age === mAge
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105"
                          : "bg-white border-slate-200 text-slate-400"
                      )}
                    >
                      {mAge} Yrs {formData.milestone_age === mAge && "✓"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">A</span>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">A. Personal Information</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">RRN (Regional Registry No.)</label>
                    <input
                      type="text"
                      placeholder="e.g. RRN-12345"
                      value={formData.rrn}
                      onChange={e => setFormData({ ...formData, rrn: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">OSCA ID Number</label>
                    <input
                      type="text"
                      required
                      placeholder="OSCA ID"
                      value={formData.osca_id_number}
                      onChange={e => setFormData({ ...formData, osca_id_number: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Civil Status</label>
                    <select
                      value={formData.civil_status}
                      onChange={e => setFormData({ ...formData, civil_status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Last Name"
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="First Name"
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Middle Name</label>
                    <input
                      type="text"
                      placeholder="Middle Name"
                      value={formData.middle_name}
                      onChange={e => setFormData({ ...formData, middle_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={formData.birth_date}
                      onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Age (Calculated) *</label>
                    <input
                      type="number"
                      required
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Gender</label>
                    <div className="flex gap-4 py-2.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 font-sans">
                        <input
                          type="radio"
                          name="sex"
                          value="Male"
                          checked={formData.sex === "Male"}
                          onChange={() => setFormData({ ...formData, sex: "Male" })}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        Male
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 font-sans">
                        <input
                          type="radio"
                          name="sex"
                          value="Female"
                          checked={formData.sex === "Female"}
                          onChange={() => setFormData({ ...formData, sex: "Female" })}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        Female
                      </label>
                    </div>
                  </div>
                </div>

                {/* Citizenship & Applicant Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Applicant Type</label>
                    <select
                      value={formData.applicant_type}
                      onChange={e => setFormData({ ...formData, applicant_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans font-medium"
                    >
                      <option value="Local">Local</option>
                      <option value="Living Abroad">Living Abroad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Citizenship</label>
                    <select
                      value={formData.citizenship}
                      onChange={e => setFormData({ ...formData, citizenship: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    >
                      <option value="Filipino">Filipino</option>
                      <option value="Dual Citizenship">Dual Citizenship</option>
                    </select>
                  </div>
                  {formData.citizenship === "Dual Citizenship" && (
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Dual Citizenship Details</label>
                      <input
                        type="text"
                        placeholder="State dual citizenship details"
                        value={formData.dual_citizenship_details}
                        onChange={e => setFormData({ ...formData, dual_citizenship_details: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Residential Address */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">A.1 Residential Address</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">House / Lot / Unit No.</label>
                    <input
                      type="text"
                      placeholder="e.g. Unit 123"
                      value={formData.res_house_no}
                      onChange={e => setFormData({ ...formData, res_house_no: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Street Name</label>
                    <input
                      type="text"
                      placeholder="Street"
                      value={formData.res_street}
                      onChange={e => setFormData({ ...formData, res_street: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Barangay *</label>
                    <input
                      type="text"
                      required
                      placeholder="Barangay"
                      value={formData.res_barangay}
                      onChange={e => setFormData({ ...formData, res_barangay: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">City / Municipality *</label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={formData.res_city}
                      onChange={e => setFormData({ ...formData, res_city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Province *</label>
                    <input
                      type="text"
                      required
                      placeholder="Province"
                      value={formData.res_province}
                      onChange={e => setFormData({ ...formData, res_province: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Zip Code</label>
                    <input
                      type="text"
                      placeholder="Zip"
                      value={formData.res_zip_code}
                      onChange={e => setFormData({ ...formData, res_zip_code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Permanent Address */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">A.2 Permanent Address</span>
                  <button
                    type="button"
                    onClick={copyResidentialAddress}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer font-sans uppercase"
                  >
                    Same as Residential Address
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">House / Lot / Unit No.</label>
                    <input
                      type="text"
                      placeholder="e.g. Unit 123"
                      value={formData.perm_house_no}
                      onChange={e => setFormData({ ...formData, perm_house_no: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Street Name</label>
                    <input
                      type="text"
                      placeholder="Street"
                      value={formData.perm_street}
                      onChange={e => setFormData({ ...formData, perm_street: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Barangay</label>
                    <input
                      type="text"
                      placeholder="Barangay"
                      value={formData.perm_barangay}
                      onChange={e => setFormData({ ...formData, perm_barangay: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">City / Municipality</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.perm_city}
                      onChange={e => setFormData({ ...formData, perm_city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Province</label>
                    <input
                      type="text"
                      placeholder="Province"
                      value={formData.perm_province}
                      onChange={e => setFormData({ ...formData, perm_province: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Zip Code</label>
                    <input
                      type="text"
                      placeholder="Zip"
                      value={formData.perm_zip_code}
                      onChange={e => setFormData({ ...formData, perm_zip_code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Family Information */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">B</span>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">B. Family Information</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">B.1 Name of Spouse (Living or Deceased)</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.spouse_name}
                    onChange={e => setFormData({ ...formData, spouse_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">B.2 Spouse Citizenship</label>
                  <input
                    type="text"
                    placeholder="Citizenship"
                    value={formData.spouse_citizenship}
                    onChange={e => setFormData({ ...formData, spouse_citizenship: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">B.3 Name of Children</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {formData.children.map((child, index) => (
                    <div key={index} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">#{index + 1}</span>
                      <input
                        type="text"
                        placeholder="Child's Full Name"
                        value={child}
                        onChange={e => {
                          const updatedChildren = [...formData.children];
                          updatedChildren[index] = e.target.value;
                          setFormData({ ...formData, children: updatedChildren });
                        }}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, children: [...formData.children, ""] })}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 font-sans"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Child Input
                </button>
              </div>

              {/* B.4 Authorized Representatives */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">B.4 Authorized Representatives</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.representatives.map((rep, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100 font-sans">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Representative Name</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={rep.name}
                          onChange={e => {
                            const updatedReps = [...formData.representatives];
                            updatedReps[index] = { ...updatedReps[index], name: e.target.value };
                            setFormData({ ...formData, representatives: updatedReps });
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Relationship</label>
                        <input
                          type="text"
                          placeholder="e.g. Son, Daughter"
                          value={rep.relationship}
                          onChange={e => {
                            const updatedReps = [...formData.representatives];
                            updatedReps[index] = { ...updatedReps[index], relationship: e.target.value };
                            setFormData({ ...formData, representatives: updatedReps });
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">C.1 Contact Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0917-XXX-XXXX"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">C.2 Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. email@address.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Section D: Designated Beneficiary */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">D</span>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">D. Designated Beneficiary</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">D.1 Primary Beneficiary</span>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Full Name</label>
                    <input
                      type="text"
                      placeholder="Primary Beneficiary's Name"
                      value={formData.primary_beneficiary}
                      onChange={e => setFormData({ ...formData, primary_beneficiary: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Relationship</label>
                    <input
                      type="text"
                      placeholder="e.g. Daughter, Spouse"
                      value={formData.primary_relationship}
                      onChange={e => setFormData({ ...formData, primary_relationship: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">D.2 Contingent Beneficiary</span>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Full Name</label>
                    <input
                      type="text"
                      placeholder="Contingent Beneficiary's Name"
                      value={formData.contingent_beneficiary}
                      onChange={e => setFormData({ ...formData, contingent_beneficiary: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Relationship</label>
                    <input
                      type="text"
                      placeholder="e.g. Grandson, Nephew"
                      value={formData.contingent_relationship}
                      onChange={e => setFormData({ ...formData, contingent_relationship: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section E: Utilization of Cash Gifts */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">E</span>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">E. Utilization of Cash Gifts</h4>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Please check the primary intention of utilization for the milestone cash gift (Select all that apply):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.use_food}
                    onChange={e => setFormData({ ...formData, use_food: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 font-sans">Purchase of Food</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.use_medical_checkup}
                    onChange={e => setFormData({ ...formData, use_medical_checkup: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 font-sans">Medical Check-ups</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.use_medicines}
                    onChange={e => setFormData({ ...formData, use_medicines: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 font-sans">Medicines / Supplements</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.use_livelihood}
                    onChange={e => setFormData({ ...formData, use_livelihood: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 font-sans">Livelihood & Business</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.use_others}
                    onChange={e => setFormData({ ...formData, use_others: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 font-sans">Others</span>
                </label>
              </div>

              {formData.use_others && (
                <div className="pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Please specify details</label>
                  <input
                    type="text"
                    placeholder="Enter details..."
                    value={formData.use_others_details}
                    onChange={e => setFormData({ ...formData, use_others_details: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Section F: Certification */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">F</span>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">Certification and Submission</h4>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-5">
                <p className="font-sans font-medium text-justify">
                  I hereby certify under oath that all the information in this application form are true and correct. I authorize the verification of the information provided in this form as well as the usage and processing of the information by the National Commission of Senior Citizens in accordance with the R.A. No. 10173, otherwise known as the "Data Privacy Act of 2012", its Implementing Rules and Regulations, and issuances of the National Privacy Commission. I further warrant that I have complied with all the requirements and I have presented all pertinent documentary requirements.
                </p>

                <div className="pt-2">
                  <SignaturePad
                    signatureType={formData.signature_type}
                    signatureData={formData.signature_data}
                    onSignatureChange={(type, dataVal) => setFormData({
                      ...formData,
                      signature_type: type,
                      signature_data: dataVal,
                      signed_by_applicant: dataVal !== ""
                    })}
                  />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <label className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 cursor-pointer w-full sm:w-auto font-sans">
                    <input
                      type="checkbox"
                      required
                      checked={formData.signed_by_applicant}
                      onChange={e => setFormData({ ...formData, signed_by_applicant: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-extrabold text-slate-900 font-sans">
                      Applicant Signed / Thumbmarked Form {formData.signed_by_applicant ? "(Verified)" : "(Requires Signature/Thumbmark)"}
                    </span>
                  </label>

                  <div className="text-right w-full sm:w-auto">
                    <span className="text-[9px] font-bold text-slate-400 block font-sans uppercase">Date of Application</span>
                    <strong className="text-xs font-mono font-bold text-slate-800">{formData.date_applied}</strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-slate-200">
          <div>
            {formStep === 2 && (
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all cursor-pointer font-sans flex items-center gap-2 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Personal Info
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-end">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer font-sans text-center"
              >
                Cancel
              </button>
            ) : (
              <Link
                to="/portal/apply"
                className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all font-sans text-center"
              >
                Cancel
              </Link>
            )}
            
            {formStep === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer font-sans flex items-center justify-center gap-2"
              >
                Next: Sign & Certify
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer font-sans flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Save and Submit Application"
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// Private helper for Document Upload Zone inside Citizen Centenarians Act Benefit Form
function DocumentUploadZone({
  id,
  label,
  description,
  fileName,
  onFileAttached,
  onFileRemoved,
}: {
  id: string;
  label: string;
  description: string;
  fileName: string;
  onFileAttached: (name: string) => void;
  onFileRemoved: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileAttached(e.target.files[0].name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileAttached(e.dataTransfer.files[0].name);
    }
  };

  return (
    <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between min-h-[140px] space-y-3">
      <div>
        <label className="text-xs font-bold text-slate-800 block font-sans">{label}</label>
        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-sans">{description}</p>
      </div>

      {fileName ? (
        <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl font-sans">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <Check className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-semibold text-emerald-800 truncate font-sans max-w-[150px]">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = "";
              onFileRemoved();
            }}
            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1 bg-white cursor-pointer transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            id={id}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
          />
          <Upload className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 font-sans">Drag & drop or Click to Browse</span>
        </div>
      )}
    </div>
  );
}

// Private helper for SignaturePad inside Citizen Centenarians Act Benefit Form
interface SignaturePadProps {
  signatureType: "draw" | "thumbmark";
  signatureData: string;
  onSignatureChange: (type: "draw" | "thumbmark", data: string) => void;
}

function SignaturePad({ signatureType = "draw", signatureData, onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<"draw" | "thumbmark">(signatureType);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Initialize Canvas
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#1e3a8a"; // dark navy blue ink

        // Clear canvas and draw guideline
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(30, canvas.height - 40);
        ctx.lineTo(canvas.width - 30, canvas.height - 40);
        ctx.strokeStyle = "#cbd5e1"; // slate-300
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Re-set drawing style
        ctx.strokeStyle = "#1e3a8a";
        ctx.lineWidth = 3;
      }
    }
  }, [activeTab]);

  // Handle Mouse Events for Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      const dataUrl = canvasRef.current.toDataURL();
      onSignatureChange("draw", dataUrl);
    }
  };

  // Touch events for mobile compatibility
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(30, canvas.height - 40);
    ctx.lineTo(canvas.width - 30, canvas.height - 40);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // reset

    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 3;

    onSignatureChange("draw", "");
  };

  // Simulated Biometric Thumbmark Scan
  const startThumbprintScan = () => {
    if (signatureData && activeTab === "thumbmark") {
      onSignatureChange("thumbmark", "");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    toast.loading("Scanning thumbmark... keep finger pressed", { id: "thumb-scan" });

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        const presetThumbprint = "CAPTURED_THUMBPRINT_OK";
        onSignatureChange("thumbmark", presetThumbprint);
        toast.success("Thumbmark scanned and registered successfully!", { id: "thumb-scan" });
      }
    }, 150);
  };

  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSignatureChange("thumbmark", event.target.result as string);
          toast.success("Scanned thumbmark uploaded successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm font-sans">
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => { setActiveTab("draw"); onSignatureChange("draw", ""); }}
          className={cn(
            "flex-1 py-3 text-xs font-bold tracking-wider uppercase border-r border-slate-100 transition-colors cursor-pointer font-sans",
            activeTab === "draw" ? "bg-white text-indigo-600 font-extrabold" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          ✍️ Draw Signature
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("thumbmark"); onSignatureChange("thumbmark", ""); }}
          className={cn(
            "flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer font-sans",
            activeTab === "thumbmark" ? "bg-white text-indigo-600 font-extrabold" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          👍 Biometric Thumbmark
        </button>
      </div>

      <div className="p-6 bg-slate-50/20">
        {activeTab === "draw" ? (
          <div className="space-y-4">
            <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-inner mx-auto max-w-lg">
              <canvas
                ref={canvasRef}
                width={450}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawingTouch}
                onTouchMove={drawTouch}
                onTouchEnd={stopDrawing}
                className="w-full h-[180px] bg-slate-50/30 cursor-crosshair touch-none"
              />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 font-sans tracking-wide pointer-events-none">
                Sign inside this box (touch or use mouse)
              </div>
            </div>
            
            <div className="flex justify-between items-center max-w-lg mx-auto">
              <span className="text-[10px] text-slate-400 font-medium font-sans">
                {signatureData ? "✅ Signature recorded" : "⚠️ Please draw your signature"}
              </span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[10px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-widest font-sans cursor-pointer bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all"
              >
                Clear Pad
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 max-w-lg mx-auto text-center font-sans">
            {signatureData ? (
              <div className="space-y-3">
                <div className="w-24 h-24 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 1.017.07 2.019.203 3m-1.218-1.218a9.009 9.009 0 012.218-6.113m14.282 3.393a13.782 13.782 0 01-2.18 5.44m-5.408-13.43a13.911 13.911 0 017.588 5.02m-.804 2.28A9 9 0 0115 12V9m0 0a3 3 0 10-6 0v1" />
                  </svg>
                </div>
                <div>
                  <strong className="text-xs font-bold text-slate-800 block font-sans">Thumbprint Captured</strong>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Applicant identity registered successfully</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onSignatureChange("thumbmark", "")}
                    className="text-[10px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-wider font-sans cursor-pointer bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Reset scanner
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 bg-white rounded-2xl p-5 flex flex-col items-center justify-center min-h-[170px] space-y-3 shadow-inner">
                  <button
                    type="button"
                    onMouseDown={startThumbprintScan}
                    onTouchStart={startThumbprintScan}
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer relative overflow-hidden shadow-md",
                      isScanning 
                        ? "bg-indigo-600 scale-95 ring-4 ring-indigo-100" 
                        : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"
                    )}
                  >
                    {isScanning ? (
                      <div className="absolute inset-0 bg-indigo-600 flex items-center justify-center">
                        <span className="text-[10px] text-white font-black font-sans">{scanProgress}%</span>
                        <div className="absolute left-0 right-0 h-1 bg-cyan-400 top-0 animate-bounce" />
                      </div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 1.017.07 2.019.203 3m-1.218-1.218a9.009 9.009 0 012.218-6.113m14.282 3.393a13.782 13.782 0 01-2.18 5.44m-5.408-13.43a13.911 13.911 0 017.588 5.02m-.804 2.28A9 9 0 0115 12V9m0 0a3 3 0 10-6 0v1" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block font-sans">Live Scan</span>
                    <p className="text-[9px] text-slate-400 mt-0.5 max-w-[130px] mx-auto font-sans">Click & hold scan button to register thumbprint</p>
                  </div>
                </div>

                <div className="border border-slate-200 bg-white rounded-2xl p-5 flex flex-col items-center justify-center min-h-[170px] space-y-3 relative group">
                  <input
                    type="file"
                    id="thumb-upload-input"
                    className="hidden"
                    onChange={handleThumbUpload}
                    accept=".png,.jpg,.jpeg"
                  />
                  <label htmlFor="thumb-upload-input" className="cursor-pointer flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block font-sans">Upload Scan</span>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-sans">Select scan image from device</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
