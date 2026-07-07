import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { Application } from "./App";
import {
  User,
  Heart,
  LogOut,
  Bell,
  LayoutDashboard,
  ChevronRight,
  FileText,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Camera,
  RefreshCw,
  Info,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  ClipboardList,
  MessageSquare,
  CreditCard,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Send,
  Ticket,
  Clock,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  IdCard,
  Plus,
  Award,
  Sparkles,
  Check,
  ChevronLeft,
  Trash,
} from "lucide-react";
import toast from "react-hot-toast";
import { 
  cn, 
  normalizeCashGiftResponse, 
  normalizeWeddingIncentiveResponse, 
  normalizeBirthdayIncentiveResponse 
} from "./lib/utils";
import { API_URL } from "./lib/config";
import { motion, AnimatePresence } from "motion/react";
import WalkInIdIssuanceModal from "./components/WalkInIdIssuanceModal";
import { IdPreviewModal } from "./components/IdIssuanceModule";
import { IDCard } from "./components/IDCard";
import { ExpandedCentenarianForm } from "./components/CitizenExpandedCentenariansForm";
import { QRCodeSVG } from "qrcode.react";

const benefitsList = [
  "50th Wedding Anniversary Incentive",
  "Birthday Cash Incentives (LGU)",
  "Social Pension",
  "Annual Cash Gift",
  "Expanded Centenarians Act Benefit Program (National)",
];

const slugify = (text: any) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
};

const base64ToFile = (base64: string, filename: string) => {
  if (!base64 || !base64.includes(",")) return null;
  try {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    console.error("Base64 to File conversion failed:", e);
    return null;
  }
};

const calculateAge = (birthDateStr: string): string => {
  if (!birthDateStr) return "";
  try {
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return (calculatedAge > 0 && calculatedAge < 150) ? calculatedAge.toString() : "";
  } catch (e) {
    return "";
  }
};

export function AnnualCashGiftForm({
  annualCashGiftApplications,
  setAnnualCashGiftApplications,
  mode = "citizen",
  initialCitizenId,
  data,
  isReadOnly = false,
  onClose,
}: {
  annualCashGiftApplications?: any[];
  setAnnualCashGiftApplications?: React.Dispatch<React.SetStateAction<any[]>>;
  mode?: "citizen" | "admin";
  initialCitizenId?: string;
  data?: any;
  isReadOnly?: boolean;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});

  // Get user data from localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    citizen_id: initialCitizenId || data?.citizen_id || data?.id || user?.citizen_id || user?.id || "",
    scid_number: data?.scid_number || user?.scid_number || "",
    first_name: data?.first_name || user?.first_name || "",
    middle_name: data?.middle_name || user?.middle_name || "",
    last_name: data?.last_name || user?.last_name || "",
    suffix: data?.suffix || user?.suffix || "",
    birth_date: data?.birth_date || user?.birth_date || "",
    age: data?.age?.toString() || user?.age?.toString() || "",
    sex: data?.sex || user?.sex || "",
    civil_status: data?.civil_status || user?.civil_status || "",
    contact_number: data?.contact_number || user?.contact_number || "",
    address: data?.address || user?.address || "",
    barangay: data?.barangay || user?.barangay || "",
    city_municipality: data?.city_municipality || user?.city_municipality || "",
    province: data?.province || user?.province || "",
    citizenship: data?.citizenship || user?.citizenship || "",
    birth_place: data?.birth_place || user?.birth_place || "",
    district: data?.district || user?.district || "",
    email: data?.email || user?.email || "",
    living_arrangement: data?.living_arrangement || user?.living_arrangement || "",
    benefit_type: "annual-cash-gift",
    status: "pending",
  });

  // Sync data prop to formData
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
        scid_number: data.scid_number || prev.scid_number || "",
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        last_name: data.last_name || "",
        birth_date: formattedDate,
        age: data.age?.toString() || "",
        sex: data.sex || "",
        civil_status: data.civil_status || "",
        contact_number: data.contact_number || "",
        address: data.address || "",
        barangay: data.barangay || "",
        city_municipality: data.city_municipality || data.city || "",
        province: data.province || "",
      }));
    }
  }, [data]);

  // File upload and Camera state
  const [birthCertificate, setBirthCertificate] = useState<File | null>(null);
  const [barangayCertificate, setBarangayCertificate] = useState<File | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const requirementsStatus = {
    birth_certificate: birthCertificate !== null,
    barangay_certificate: barangayCertificate !== null,
    photo: !!capturedPhoto,
  };

  const startCamera = async () => {
    setIsCapturing(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Camera access failed. Please allow camera permission and ensure you are on a secure (HTTPS) connection.");
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  // Auto-fetch from masterlist (ONLY for citizen mode or if data not provided)
  const fetchMasterlistData = async (searchIdOverride?: string) => {
    const searchId = searchIdOverride || (mode === "admin" ? formData.citizen_id : (user?.citizen_id || user?.scid_number || user?.id));
    if (!searchId) return;

    try {
      const response = await fetch(
        `${API_URL}/masterlist?search=${searchId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
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

        const calculatedAgeVal = calculateAge(formattedDate);

        setIsAutofilled(true);
        setFormData((prev) => ({
          ...prev,
          citizen_id: record.citizen_id || record.id || prev.citizen_id,
          scid_number: record.scid_number || prev.scid_number || "",
          first_name: record.first_name || prev.first_name,
          middle_name: record.middle_name || prev.middle_name,
          last_name: record.last_name || prev.last_name,
          birth_date: formattedDate || prev.birth_date,
          age: record.age?.toString() || calculatedAgeVal || prev.age,
          sex: record.sex || prev.sex,
          civil_status: record.civil_status || prev.civil_status,
          contact_number: record.contact_number || record.contact_no || prev.contact_number,
          address: record.address || prev.address,
          barangay: record.barangay || prev.barangay,
          city_municipality: record.city_municipality || record.city || prev.city_municipality,
          province: record.province || prev.province,
          // Fetch additional fields if they exist in masterlist
          suffix: record.suffix || prev.suffix || "",
          citizenship: record.citizenship || prev.citizenship || "",
          birth_place: record.birth_place || prev.birth_place || "",
          district: record.district || prev.district || "",
          email: record.email || prev.email || "",
          living_arrangement: record.living_arrangement || prev.living_arrangement || "",
        }));
      } else if (mode === "admin" && searchIdOverride) {
        alert("No record found in masterlist.");
      }
    } catch (error) {
      console.error("Error fetching masterlist:", error);
    }
  };

  useEffect(() => {
    if (data || isReadOnly || mode === "admin") return;
    fetchMasterlistData();
  }, [user?.citizen_id, user?.scid_number, user?.id, token, mode, data, isReadOnly]);

  useEffect(() => {
    if (formData.birth_date) {
      const newAge = calculateAge(formData.birth_date);
      if (newAge && newAge !== formData.age) {
        setFormData((prev) => ({ ...prev, age: newAge }));
      }
    }
  }, [formData.birth_date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors({});

    const requiredFields = [
      { name: "first_name", label: "First Name" },
      { name: "last_name", label: "Last Name" },
      { name: "birth_date", label: "Birthdate" },
      { name: "contact_number", label: "Contact Number" },
      { name: "barangay", label: "Barangay" },
    ];

    setIsLoading(true);

    try {
      const fd = new FormData();

      // Append text fields
      fd.append("citizen_id", formData.citizen_id);
      fd.append("scid_number", formData.scid_number);
      fd.append("first_name", formData.first_name);
      fd.append("middle_name", formData.middle_name || "");
      fd.append("last_name", formData.last_name);
      fd.append("suffix", formData.suffix || "");
      fd.append("birth_date", formData.birth_date);
      fd.append("age", formData.age.toString());
      fd.append("sex", formData.sex || "");
      fd.append("civil_status", formData.civil_status || "");
      fd.append("contact_number", formData.contact_number);
      fd.append("address", formData.address || "");
      fd.append("barangay", formData.barangay);
      fd.append("city_municipality", formData.city_municipality);
      fd.append("province", formData.province);
      fd.append("citizenship", formData.citizenship || "");
      fd.append("birth_place", formData.birth_place || "");
      fd.append("district", formData.district || "");
      fd.append("email", formData.email || "");
      fd.append("living_arrangement", formData.living_arrangement || "");
      fd.append("benefit_type", "annual-cash-gift");
      fd.append("reg_status", "pending");

      // Append new files
      if (birthCertificate) fd.append("birth_certificate", birthCertificate);
      if (barangayCertificate) fd.append("barangay_certificate", barangayCertificate);
      
      // Backward compatibility: append to document[]
      if (birthCertificate) fd.append("document[]", birthCertificate);
      if (barangayCertificate) fd.append("document[]", barangayCertificate);

      // Append captured photo
      if (capturedPhoto) {
        const photoFile = base64ToFile(capturedPhoto, "captured_photo.jpg");
        if (photoFile) fd.append("photo", photoFile);
      }

      const response = await fetch(
        `${API_URL}/benefit-applications`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        },
      );

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        if (setAnnualCashGiftApplications) {
          const normalized = normalizeCashGiftResponse(data);
          setAnnualCashGiftApplications((prev) => [...normalized, ...prev]);
        }
        setTimeout(() => {
          if (mode === "admin") {
            navigate("/benefits/annual-cash-gift");
          } else {
            navigate("/portal");
          }
        }, 3000);
      } else if (response.status === 422) {
        setApiErrors(data.errors || {});
        const errorMsgs = Object.values(data.errors || {})
          .flat()
          .join("\n");
        alert("Validation Errors:\n" + errorMsgs);
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred during submission.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[2rem] shadow-xl p-12 text-center space-y-6 border border-slate-100">
        <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-[#EF4444] tracking-tight">
          Success!
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          {mode === "admin" 
            ? "Application successfully created. Redirecting back to management..." 
            : "Application submitted successfully. Redirecting you back to the portal..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex justify-between items-start mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-4xl font-bold text-[#EF4444] tracking-tight">
            {mode === "admin" ? "New Entry: Annual Cash Gift" : "Annual Cash Gift"}
          </h1>
          {mode === "admin" && (
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Walk-in Application</p>
          )}
        </div>
        {onClose || isReadOnly ? (
          <button
            onClick={() => onClose ? onClose() : navigate(-1)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <Link
            to={mode === "admin" ? "/benefits/annual-cash-gift" : "/portal/apply"}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Information Section */}
      <section className="bg-blue-50 border border-blue-100 rounded-2xl md:rounded-[2rem] p-5 md:p-8 flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start mx-4 sm:mx-0 mb-8 text-center sm:text-left">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
          <Info className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold uppercase tracking-widest text-blue-600">
            Program Overview
          </h3>
          <p className="text-lg font-medium text-blue-900/80 leading-relaxed max-w-2xl">
            The Annual Cash Gift provides financial assistance to qualified
            senior citizens in San Juan City, helping support their daily needs
            such as food, medicine, and other basic expenses.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
        {/* Left Column: Requirements */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 space-y-8">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <CheckCircle className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-widest text-blue-600">
                Eligibility
              </h3>
            </div>
            <ul className="space-y-5">
              {[
                {
                  label: "Birth Certificate",
                  status: requirementsStatus.birth_certificate,
                },
                {
                  label: "Barangay Certificate",
                  status: requirementsStatus.barangay_certificate,
                },
                {
                  label: "Recent photograph",
                  status: requirementsStatus.photo,
                },
              ].map((req, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      req.status ? "bg-emerald-50" : "bg-slate-50",
                    )}
                  >
                    {req.status ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-200" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-lg font-medium leading-tight",
                        req.status ? "text-slate-600" : "text-slate-400",
                      )}
                    >
                      {req.label}
                    </span>
                    <p
                      className={cn(
                        "text-sm font-bold uppercase tracking-wider mt-0.5",
                        req.status ? "text-emerald-500" : "text-slate-300",
                      )}
                    >
                      {req.status ? "Verified" : "Pending"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 lg:p-12 border border-slate-100 space-y-12"
          >
            {/* Personal Information */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#EF4444]">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold uppercase tracking-widest text-[#EF4444]">
                  Personal Information
                </h3>
              </div>

              {/* Auto-Fetch Helper for Admin */}
              {mode === "admin" && !isReadOnly && (
                <div className="p-5 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 w-full space-y-2">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                      Search by SCID Number
                    </label>
                    <input 
                      type="text"
                      placeholder="Enter ID to auto-populate..."
                      value={formData.citizen_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, citizen_id: e.target.value }))}
                      className="w-full px-5 md:px-6 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-base font-bold text-[#0F172A] outline-none focus:border-[#EF4444]"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => fetchMasterlistData(formData.citizen_id)}
                    className="w-full md:w-auto px-8 py-3 md:py-4 bg-[#0F172A] text-white rounded-xl md:rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Fetch Data
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-base font-bold text-slate-500 tracking-wider ml-1">
                    SCID Number
                  </label>
                  <input
                    type="text"
                    name="scid_number"
                    value={data?.scid_number || formData.scid_number}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-lg font-bold outline-none transition-all font-mono",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 tracking-wider ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={data?.first_name || formData.first_name}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-3 border border-slate-200 rounded-2xl text-base font-medium outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.first_name && (
                    <p className="text-xs text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.first_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 tracking-wider ml-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={data?.middle_name || formData.middle_name}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-3 border border-slate-200 rounded-2xl text-base font-medium outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 tracking-wider ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={data?.last_name || formData.last_name}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-3 border border-slate-200 rounded-2xl text-base font-medium outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.last_name && (
                    <p className="text-xs text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.last_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-base font-bold text-slate-500 tracking-wider ml-1">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    value={data?.birth_date || formData.birth_date}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-lg font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.birth_date && (
                    <p className="text-xs text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.birth_date[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-base font-bold text-slate-500 tracking-wider ml-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={data?.age || formData.age}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-lg font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.age && (
                    <p className="text-xs text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.age[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-base font-bold text-slate-500 tracking-wider ml-1">
                    Sex
                  </label>
                  <input
                    type="text"
                    name="sex"
                    value={data?.sex || formData.sex}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-lg font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-bold text-slate-500 tracking-wider ml-1">
                    Civil Status
                  </label>
                  <input
                    type="text"
                    name="civil_status"
                    value={data?.civil_status || formData.civil_status}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-lg font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-[#EF4444]">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold uppercase tracking-widest text-[#EF4444]">
                  Contact
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 tracking-wider ml-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={data?.contact_number || formData.contact_number}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-3 border border-slate-200 rounded-2xl text-base font-medium outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.contact_number && (
                    <p className="text-xs text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.contact_number[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#EF4444]">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#EF4444]">
                  Location
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                <div className="md:col-span-2 lg:col-span-3 space-y-2">
                  <label className="text-sm font-semibold text-slate-500 tracking-wider ml-1">
                    Full Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={data?.address || formData.address}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-3 border border-slate-200 rounded-2xl text-base font-medium outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 tracking-wider ml-1">
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="barangay"
                    value={data?.barangay || formData.barangay}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-3 border border-slate-200 rounded-2xl text-base font-medium outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.barangay && (
                    <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.barangay[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 tracking-wider ml-1">
                    City/Municipality
                  </label>
                  <input
                    type="text"
                    name="city_municipality"
                    value={data?.city_municipality || data?.city || formData.city_municipality}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-3 border border-slate-200 rounded-2xl text-base font-medium outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-500 tracking-wider ml-1">
                    Province
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={data?.province || formData.province}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-3 border border-slate-200 rounded-2xl text-base font-medium outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#EF4444]">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#EF4444]">
                  Attachments & Photo
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Photo Capture */}
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 tracking-wider ml-1">
                    Photo Capture
                  </label>
                  <div
                    className={cn(
                      "relative aspect-video rounded-3xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all",
                      capturedPhoto || isCapturing
                        ? "border-emerald-500 bg-white"
                        : "border-slate-300 bg-slate-50",
                      isReadOnly && "pointer-events-none opacity-60"
                    )}
                  >
                    {capturedPhoto ? (
                      <>
                        <img
                          src={capturedPhoto}
                          alt="Captured"
                          className="w-full h-full object-cover"
                        />
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => setCapturedPhoto(null)}
                            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur shadow-sm rounded-xl text-red-500 hover:bg-white transition-all z-10"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : isCapturing ? (
                      <div className="relative w-full h-full">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="flex-1 max-w-[140px] h-11 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            <Camera className="w-4 h-4" />
                            Capture
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="flex-1 max-w-[140px] h-11 bg-white/90 backdrop-blur text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex flex-col items-center gap-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Camera className="w-10 h-10 mb-2 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Click to launch camera
                        </span>
                      </button>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Birth Certificate Upload */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold text-slate-500 tracking-wider ml-1">
                      Birth Certificate <span className="text-rose-500">*</span>
                    </label>
                    <label className={cn(
                      "flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-3xl transition-all group",
                      birthCertificate ? "bg-emerald-50/50 border-emerald-500" : "bg-slate-50/50 border-slate-300 hover:bg-slate-50 hover:border-red-500",
                      isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                    )}>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setBirthCertificate(file);
                        }}
                      />
                      {birthCertificate ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-700 max-w-[200px] truncate">{birthCertificate.name}</span>
                          {!isReadOnly && <span className="text-[10px] text-slate-400">Click to change</span>}
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-300 group-hover:text-red-500 group-hover:scale-110 transition-all mb-2" />
                          <span className="text-xs font-bold text-slate-400 group-hover:text-red-500">
                            {isReadOnly ? "No Birth Certificate Uploaded" : "Upload Birth Certificate"}
                          </span>
                          <span className="text-[10px] text-slate-300 uppercase tracking-widest font-black">PDF, JPG, PNG (MAX. 5MB)</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Barangay Certificate Upload */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold text-slate-500 tracking-wider ml-1">
                      Barangay Certificate <span className="text-rose-500">*</span>
                    </label>
                    <label className={cn(
                      "flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-3xl transition-all group",
                      barangayCertificate ? "bg-emerald-50/50 border-emerald-500" : "bg-slate-50/50 border-slate-300 hover:bg-slate-50 hover:border-red-500",
                      isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                    )}>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setBarangayCertificate(file);
                        }}
                      />
                      {barangayCertificate ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-700 max-w-[200px] truncate">{barangayCertificate.name}</span>
                          {!isReadOnly && <span className="text-[10px] text-slate-400">Click to change</span>}
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-300 group-hover:text-red-500 group-hover:scale-110 transition-all mb-2" />
                          <span className="text-xs font-bold text-slate-400 group-hover:text-red-500">
                            {isReadOnly ? "No Barangay Certificate Uploaded" : "Upload Barangay Certificate"}
                          </span>
                          <span className="text-[10px] text-slate-300 uppercase tracking-widest font-black">PDF, JPG, PNG (MAX. 5MB)</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn(
              "sticky bottom-0 bg-white pt-6 pb-2 border-t border-slate-100 z-20 -mx-8 lg:-mx-12 px-8 lg:px-12 mt-12",
              !onClose && "relative bg-transparent border-none p-0"
            )}>
              {isReadOnly ? (
                <button
                  type="button"
                  onClick={() => onClose ? onClose() : navigate(-1)}
                  className="w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 bg-[#0F172A] text-white hover:bg-slate-800"
                >
                  Close View
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-2",
                    isLoading
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-[#EF4444]",
                  )}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  {isLoading ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CitizenHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [issuanceRecord, setIssuanceRecord] = useState<any>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchIdRecord(u);
    }
  }, []);

  const fetchIdRecord = async (user: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!user || !token) {
        setIsLoadingRecord(false);
        return;
      }
      const idRes = await fetch(
        `${API_URL}/id-issuances?search=${user.citizen_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (idRes.ok) {
        const idData = await idRes.json();
        const issuances = idData.data?.data || idData.data || idData || [];
        const userIssuances = issuances.filter(
          (i: any) => String(i.citizen_id) === String(user.citizen_id),
        );
        if (userIssuances.length > 0) {
          const latestRecord = userIssuances.sort((a: any, b: any) => {
            return (
              new Date(b.request_details?.application_date || 0).getTime() -
              new Date(a.request_details?.application_date || 0).getTime()
            );
          })[0];
          setIssuanceRecord(latestRecord);
        }
      }
    } catch (err) {
      console.error("Failed to fetch ID record:", err);
    } finally {
      setIsLoadingRecord(false);
    }
  };

  const getRenewCondition = () => {
    if (!issuanceRecord || !issuanceRecord.dates?.expiration) return false;
    const today = new Date();
    const expiration = new Date(issuanceRecord.dates.expiration);
    const threeMonthsBefore = new Date(expiration);
    threeMonthsBefore.setMonth(threeMonthsBefore.getMonth() - 3);
    return today >= threeMonthsBefore;
  };

  const canRenew = getRenewCondition();

  const serviceCards = [
    {
      label: "My Profile",
      href: "/portal/profile",
      icon: "https://res.cloudinary.com/dx20khqe5/image/upload/v1777023874/Vector_q9aiuj.png",
    },
    {
      label: "Benefits",
      href: "/portal/apply",
      icon: "https://res.cloudinary.com/dx20khqe5/image/upload/v1777023873/Vector1_sbclgp.png",
    },
    {
      label: "ID Services",
      href: "/portal/id-services",
      icon: "https://res.cloudinary.com/dx20khqe5/image/upload/v1777023873/Vector3_rmt83p.png",
    },
    {
      label: "Citizen Concerns",
      href: "/portal/feedback",
      icon: "https://res.cloudinary.com/dx20khqe5/image/upload/v1777023874/Vector4_xsuljm.png",
    },
  ];

  const userObj = user?.data || user;
  const getFirstName = () => {
    const fName = userObj?.first_name || userObj?.firstName || "";
    if (fName && fName.toLowerCase() !== "citizen") return fName;

    const name = userObj?.name || "";
    if (name && name.toLowerCase() !== "citizen") return name.split(" ")[0];

    const userN = userObj?.username || "";
    if (userN && userN.toLowerCase() !== "citizen")
      return userN.charAt(0).toUpperCase() + userN.slice(1);

    return "Juan";
  };

  const firstName = getFirstName();

  return (
    <div className="relative flex-1 w-full flex flex-col items-center">
      {/* Background Textured Building */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777961326/citizenbg_yjcg7u.png"
          alt="Background"
          className="w-full h-full object-cover opacity-[0.45] grayscale brightness-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-white/30" />
        {/* Subtle Paper Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'url("https://www.transparenttextures.com/patterns/felt.png")',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center pt-4 md:pt-8 pb-10 md:pb-20 px-4 md:px-6">
        {/* Welcome Text */}
        <div className="text-center mb-6 md:mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[32px] sm:text-[40px] md:text-[48px] font-bold text-[#EF4444] tracking-tight mb-1 md:mb-2"
          >
            Welcome, {firstName}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-2xl text-slate-700 font-normal tracking-tight"
          >
            What would you like to do today?
          </motion.p>
        </div>

        {/* ID Status Banner/Note */}
        {!isLoadingRecord && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-6 md:mb-10"
          >
            {!issuanceRecord ? (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                    <IdCard className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h4 className="text-rose-900 font-bold text-lg md:text-xl leading-tight md:leading-normal">No Active ID Record</h4>
                    <p className="text-rose-600/80 text-sm md:text-base font-medium max-w-[320px]">You currently have no ID application. Please apply to get your Senior Citizen ID.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/portal/application-id-form", { state: { request_type: "New ID" } })}
                  className="w-full md:w-auto px-8 md:px-10 py-4 bg-rose-500 text-white rounded-xl md:rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 whitespace-nowrap"
                >
                  Apply ID
                </button>
              </div>
            ) : canRenew ? (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                    <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h4 className="text-blue-900 font-bold text-sm md:text-base leading-tight md:leading-normal">ID Subject for Renewal</h4>
                    <p className="text-blue-600/80 text-[11px] md:text-xs font-medium max-w-[280px]">Your ID is due for renewal. You may now proceed with renewal application.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/portal/application-id-form", { state: { request_type: "Renewal" } })}
                  className="w-full md:w-auto px-6 md:px-8 py-3 bg-blue-500 text-white rounded-xl md:rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 whitespace-nowrap"
                >
                  Renew ID
                </button>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Service Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-16 md:gap-24 w-full max-w-4xl px-4 md:px-6 mb-32">
          {serviceCards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center group"
            >
              <Link
                to={card.href}
                className="w-full flex flex-col items-center"
              >
                <div className="w-full aspect-square bg-white rounded-2xl md:rounded-[25px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-center p-3 group-hover:shadow-[0_20px_40px_rgba(239,68,68,0.12)] group-hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img
                    src={card.icon}
                    alt={card.label}
                    className="w-10 h-10 md:w-14 md:h-14 object-contain relative z-10"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="mt-3 md:mt-5 text-base md:text-lg lg:text-[19px] font-bold text-[#1e3a8a] tracking-tight text-center whitespace-nowrap group-hover:text-[#EF4444] transition-colors">
                  {card.label}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-[28px] shadow-xl border border-white/60 py-6 md:py-4 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6"
        >
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#3B82F6] flex items-center justify-center text-white shadow-sm shrink-0">
              <img
                src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777023873/Vector3_rmt83p.png"
                alt="Senior ID Icon"
                className="w-6 h-6 md:w-7 md:h-7 object-contain invert brightness-0"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <h4 className="text-xs md:text-base font-bold text-[#EF4444] uppercase tracking-wide">
                Senior Citizen ID / SCID
              </h4>
              <p className="text-slate-800 font-bold text-base sm:text-lg md:text-xl">
                {user?.scid_number || user?.citizen_id || user?.id || "CID-2024-XXXX"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center md:text-right border-t border-slate-100 md:border-none pt-4 md:pt-0 w-full md:w-auto justify-center md:justify-end">
            <div className="flex flex-col items-center md:items-end">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-0.5">
                Assistance Hotline
              </span>
              <p className="text-xl md:text-[26px] font-bold text-[#1e293b] tracking-tight">
                Call <span className="text-[#EF4444]">(02) 8888-9900</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Red Strip at Bottom */}
      <div className="h-1.5 bg-[#EF4444] w-full mt-auto" />
    </div>
  );
}

const benefitsDetails: Record<
  string,
  { category: string; description: string }
> = {
  "Annual Cash Gift": {
    category: "FINANCIAL SUPPORT",
    description:
      "Annual financial gift provided to eligible senior citizens of the city as a token of appreciation.",
  },
  "Social Pension": {
    category: "SOCIAL ASSISTANCE",
    description:
      "Monthly stipend provided by DSWD for indigent senior citizens to augment daily subsistence.",
  },
  "50th Wedding Anniversary Incentive": {
    category: "SPECIAL RECOGNITION",
    description:
      "One-time cash incentive for couples celebrating their Golden Wedding Anniversary.",
  },
  "Birthday Cash Incentives (LGU)": {
    category: "FINANCIAL SUPPORT",
    description:
      "Special cash gift provided during the birth month of qualified senior residents.",
  },
  "Expanded Centenarians Act Benefit Program (National)": {
    category: "NATIONAL RECOGNITION",
    description:
      "Cash gift and national recognition for senior citizens reaching milestone ages of 80, 85, 90, 95, and 100.",
  },
};

export function BirthdayIncentivesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedOrdinance, setSelectedOrdinance] = useState<"81" | "23" | "43">("81");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-8"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Milestones Birthday Incentives
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    City Incentive Programs & Ordinances
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto space-y-8">
              {/* Image-based Table Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">
                  Ordinance Milestone Map (Click an ordinance to view details)
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                  <table className="w-full border-collapse text-sm text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="border-r border-slate-200 px-6 py-4 font-bold text-slate-900 text-center uppercase tracking-wider text-xs">
                          Age
                        </th>
                        <th className="border-r border-slate-200 px-6 py-4 font-bold text-slate-900 text-center uppercase tracking-wider text-xs">
                          City - LGU
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-900 text-center uppercase tracking-wider text-xs">
                          Ordinance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className={cn(selectedOrdinance === "81" && "bg-amber-50/20")}>
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-bold text-slate-700">
                          70
                        </td>
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-black text-slate-900">
                          ₱3,000
                        </td>
                        <td
                          rowSpan={3}
                          className={cn(
                            "px-6 py-4 text-center align-middle transition-all border-l border-slate-200",
                            selectedOrdinance === "81"
                              ? "bg-amber-50/60 text-amber-900 border border-amber-300"
                              : "text-blue-600 hover:text-red-600 hover:bg-slate-50/80 cursor-pointer font-bold"
                          )}
                          onClick={() => setSelectedOrdinance("81")}
                        >
                          <button
                            type="button"
                            className="font-bold underline cursor-pointer text-xs uppercase tracking-wider text-blue-600"
                          >
                            City Ordinance No. 81, Series of 2020
                          </button>
                        </td>
                      </tr>
                      <tr className={cn(selectedOrdinance === "81" && "bg-amber-50/20")}>
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-bold text-slate-700">
                          80
                        </td>
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-black text-slate-900">
                          ₱5,000
                        </td>
                      </tr>
                      <tr className={cn(selectedOrdinance === "81" && "bg-amber-50/20")}>
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-bold text-slate-700">
                          90
                        </td>
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-black text-slate-900">
                          ₱8,000
                        </td>
                      </tr>
                      <tr
                        className={cn(
                          selectedOrdinance === "23"
                            ? "bg-amber-50/60"
                            : "hover:bg-slate-50/50"
                        )}
                      >
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-bold text-slate-700">
                          91-99
                        </td>
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-black text-slate-900">
                          ₱2,000 per year
                        </td>
                        <td
                          className={cn(
                            "px-6 py-4 text-center transition-all border-l border-slate-200",
                            selectedOrdinance === "23"
                              ? "bg-amber-50/60 text-amber-950 font-bold"
                              : "text-blue-600 hover:text-red-600 cursor-pointer font-bold"
                          )}
                          onClick={() => setSelectedOrdinance("23")}
                        >
                          <button
                            type="button"
                            className="font-bold underline cursor-pointer text-xs uppercase tracking-wider text-blue-600"
                          >
                            City Ordinance No. 23, Series of 2023
                          </button>
                        </td>
                      </tr>
                      <tr
                        className={cn(
                          selectedOrdinance === "43"
                            ? "bg-amber-50/60"
                            : "hover:bg-slate-50/50"
                        )}
                      >
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-bold text-slate-700">
                          100
                        </td>
                        <td className="border-r border-slate-200 px-6 py-4 text-center font-black text-slate-900">
                          ₱50,000
                        </td>
                        <td
                          className={cn(
                            "px-6 py-4 text-center transition-all border-l border-slate-200",
                            selectedOrdinance === "43"
                              ? "bg-amber-50/60 text-amber-950 font-bold"
                              : "text-blue-600 hover:text-red-600 cursor-pointer font-bold"
                          )}
                          onClick={() => setSelectedOrdinance("43")}
                        >
                          <button
                            type="button"
                            className="font-bold underline cursor-pointer text-xs uppercase tracking-wider text-blue-600"
                          >
                            City Ordinance No. 43, Series of 2017
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic Ordinance Details Container */}
              <div className="border border-slate-200 rounded-[2rem] overflow-hidden shadow-lg bg-slate-50/30">
                {/* Active Ordinance Header Banner */}
                <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                    Currently Viewing Details
                  </span>
                  <span className="text-xs sm:text-sm font-bold bg-white/20 px-3.5 py-1 rounded-full text-white">
                    {selectedOrdinance === "81" && "City Ordinance No. 81, Series of 2020"}
                    {selectedOrdinance === "23" && "City Ordinance No. 23, Series of 2023"}
                    {selectedOrdinance === "43" && "City Ordinance No. 43, Series of 2017"}
                  </span>
                </div>

                <div className="p-6 sm:p-8 space-y-6 text-slate-600 leading-relaxed text-sm text-left">
                  {selectedOrdinance === "23" && (
                    <>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                          Nonagenarian Financial Assistance Program
                        </h4>
                        <p className="font-medium text-slate-700">
                          The City Government of San Juan, through City Ordinance No. 23, Series of 2023, provides financial assistance to qualified nonagenarian senior citizens as recognition of their longevity and contribution to the community.
                        </p>
                      </div>

                      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-2">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Benefit Amount</span>
                        </div>
                        <p className="text-amber-900/80 font-medium">
                          Qualified senior citizens aged 91 to 99 years old are entitled to receive a financial assistance grant of <strong className="text-amber-900 font-extrabold text-lg">Two Thousand Pesos (₱2,000.00)</strong>.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-3">
                          <h5 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-[#EF4444] flex items-center gap-2">
                            <Check className="w-4 h-4" /> Eligibility Requirements
                          </h5>
                          <ul className="space-y-2.5">
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Be a resident of the City of San Juan</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Be between 91 and 99 years old</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Be a registered member of the Office of the Senior Citizens Affairs (OSCA)</span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-blue-600 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Documentary Requirements
                          </h5>
                          <ul className="space-y-2.5">
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                                <span className="text-[10px] font-black">1</span>
                              </div>
                              <span>Birth Certificate or Baptismal Record</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                                <span className="text-[10px] font-black">2</span>
                              </div>
                              <span>One (1) valid government-issued ID (SSS, GSIS, UMID, PhilID, COMELEC Voter's ID, or Voter's Certification)</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                                <span className="text-[10px] font-black">3</span>
                              </div>
                              <span>OSCA ID</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                                <span className="text-[10px] font-black">4</span>
                              </div>
                              <span>Barangay Clearance</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                                <span className="text-[10px] font-black">5</span>
                              </div>
                              <span>Endorsement from the Senior Citizen President</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-slate-100 pt-5">
                        <h5 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-slate-500 flex items-center gap-2">
                          <Info className="w-4 h-4" /> Additional Information
                        </h5>
                        <p className="text-slate-500 pl-1 list-disc">
                          Funding for this program is subject to the availability of city funds and applicable government auditing and accounting regulations. The ordinance took effect in January 2024.
                        </p>
                      </div>
                    </>
                  )}

                  {selectedOrdinance === "81" && (
                    <>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                          Milestone Age Financial Assistance Program
                        </h4>
                        <p className="font-medium text-slate-700">
                          The City Government of San Juan, through City Ordinance No. 81, Series of 2020, provides financial assistance to qualified senior citizens who reach significant milestone ages in recognition of their contributions to the community and to help support their healthcare and personal needs.
                        </p>
                      </div>

                      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-2">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Benefit Amount</span>
                        </div>
                        <p className="text-amber-900/80 font-medium">
                          Qualified senior citizens are entitled to receive a one-time financial assistance based on the following age milestones:
                        </p>
                        <div className="grid grid-cols-3 gap-3 pt-1">
                          <div className="bg-white p-3 rounded-xl border border-amber-200/50 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">70 Years Old</p>
                            <p className="text-base sm:text-lg font-black text-amber-800">₱3,000.00</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-amber-200/50 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">80 Years Old</p>
                            <p className="text-base sm:text-lg font-black text-amber-800">₱5,000.00</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-amber-200/50 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">90 Years Old</p>
                            <p className="text-base sm:text-lg font-black text-amber-800">₱8,000.00</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-3">
                          <h5 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-[#EF4444] flex items-center gap-2">
                            <Check className="w-4 h-4" /> Eligibility Requirements
                          </h5>
                          <ul className="space-y-2.5">
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Be a registered senior citizen of the City of San Juan</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Be registered with the Office of the Senior Citizens Affairs (OSCA)</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Have reached the qualifying milestone age of 70, 80, or 90 years old</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Comply with the documentary and verification requirements prescribed by the City Government and OSCA</span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-blue-600 flex items-center gap-2">
                            <Award className="w-4 h-4" /> Purpose of the Program
                          </h5>
                          <ul className="space-y-2.5">
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Recognize the valuable contributions of senior citizens to the community</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Provide financial assistance for medicines, healthcare, and other essential needs</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Promote the welfare and well-being of senior citizens in the City of San Juan</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-slate-100 pt-5">
                        <h5 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-slate-500 flex items-center gap-2">
                          <Info className="w-4 h-4" /> Important Information
                        </h5>
                        <p className="text-slate-500 pl-1 list-disc">
                          The financial assistance is granted once upon reaching the applicable milestone age and is subject to verification, approval, and the availability of city funds.
                        </p>
                      </div>
                    </>
                  )}

                  {selectedOrdinance === "43" && (
                    <>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                          Centenarian Cash Incentive Program
                        </h4>
                        <p className="font-medium text-slate-700">
                          The City Government of San Juan, through City Ordinance No. 43, Series of 2017, honors qualified centenarian residents by providing additional financial assistance and recognition for reaching one hundred (100) years of age.
                        </p>
                      </div>

                      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Benefit Amount</span>
                          </div>
                          <p className="text-amber-900/80 font-medium">
                            Qualified centenarians are entitled to receive an additional cash incentive of <strong className="text-amber-900 font-extrabold text-lg">Fifty Thousand Pesos (₱50,000.00)</strong>, in addition to the benefits provided under the Centenarians Act of 2016 (Republic Act No. 10868).
                          </p>
                        </div>
                        <div className="border-t border-amber-200/50 pt-3 space-y-2">
                          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span>Additional Recognition</span>
                          </div>
                          <p className="text-amber-900/80 font-medium">
                            Beneficiaries will also receive a <strong className="text-amber-900 font-bold">Plaque of Recognition</strong> from the City Government of San Juan in honor of their longevity and contribution to the community.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-3">
                          <h5 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-[#EF4444] flex items-center gap-2">
                            <Check className="w-4 h-4" /> Eligibility Requirements
                          </h5>
                          <ul className="space-y-2.5">
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Be a resident of the City of San Juan</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Have reached one hundred (100) years of age</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                              <span>Be verified and recognized as a qualified centenarian by the Office of the Senior Citizens Affairs (OSCA) and the City Social Welfare Development Office (CSWDO)</span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-blue-600 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Program Administration
                          </h5>
                          <p className="font-semibold text-slate-800 text-xs">The identification, verification, and notification of beneficiaries shall be conducted by:</p>
                          <ul className="space-y-2 pl-1">
                            <li className="flex items-start gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                              <span>Office of the Senior Citizens Affairs (OSCA)</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                              <span>City Social Welfare Development Office (CSWDO)</span>
                            </li>
                          </ul>
                          <p className="text-xs text-slate-500 italic pl-1">These offices shall coordinate with relevant organizations and stakeholders in accordance with existing guidelines and regulations.</p>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-slate-100 pt-5">
                        <h5 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-slate-500 flex items-center gap-2">
                          <Info className="w-4 h-4" /> Important Information
                        </h5>
                        <p className="text-slate-500 pl-1 list-disc">
                          The program is implemented pursuant to Republic Act No. 10868 (Centenarians Act of 2016) and City Ordinance No. 43, Series of 2017.
                        </p>
                      </div>
                    </>
                  )}

                  <div className="bg-white rounded-2xl p-5 border border-slate-100 text-xs text-slate-500 text-center shadow-inner">
                    For inquiries and assistance, please contact the <strong className="text-slate-800">Office of the Senior Citizens Affairs (OSCA)</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#EF4444] transition-all cursor-pointer shadow-md"
              >
                Got it, Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SocialPensionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-8"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Social Pension
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    City Ordinance No. 9, Series of 2017
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6 text-slate-600 leading-relaxed text-sm text-left">
              <section className="space-y-2">
                <h4 className="text-base font-bold text-slate-900">
                  Indigent Senior Citizen Financial Assistance Program
                </h4>
                <p className="font-medium text-slate-700">
                  The City Government of San Juan, through City Ordinance No. 9, Series of 2017, provides annual financial assistance to qualified indigent senior citizens to help support their healthcare, medicines, and other essential needs.
                </p>
              </section>

              <section className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Benefit Amount</span>
                </div>
                <p className="text-amber-900/80 font-medium">
                  Qualified beneficiaries are receive an annual financial assistance of (₱2,000.00) yearly.
                </p>
              </section>

              <section className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-[#EF4444] flex items-center gap-2">
                  <Check className="w-4 h-4" /> Eligibility Requirements
                </h4>
                <p className="font-semibold text-slate-800">To qualify for the benefit, applicants must:</p>
                <ul className="space-y-3 pl-1">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Be a Filipino citizen</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Be at least sixty (60) years old</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Be a resident of the City of San Juan</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Be registered with the Office of the Senior Citizens Affairs (OSCA) and/or the City Social Welfare Department (CSWD)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <span>Not be receiving a pension from:</span>
                      <ul className="mt-1.5 space-y-1 list-disc pl-5 text-xs text-slate-500">
                        <li>Social Security System (SSS)</li>
                        <li>Government Service Insurance System (GSIS)</li>
                        <li>Armed Forces of the Philippines (AFP)</li>
                        <li>Philippine National Police (PNP)</li>
                        <li>Any other pension-providing institution</li>
                      </ul>
                    </div>
                  </li>
                </ul>
              </section>

              <section className="space-y-2 border-t border-slate-100 pt-5">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-blue-600 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-blue-500" /> Purpose of the Program
                </h4>
                <p className="text-slate-500 pl-1">
                  This program aims to recognize the contributions of senior citizens and provide financial assistance to those with limited income-generating opportunities after retirement.
                </p>
              </section>

              <section className="space-y-2 border-t border-slate-100 pt-5">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-blue-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" /> Important Information
                </h4>
                <p className="text-slate-500 pl-1">
                  The qualification, verification, and implementation of the program are administered by the Office of the Senior Citizens Affairs (OSCA) and the City Social Welfare Department (CSWD) in accordance with the guidelines established by the City Government of San Juan.
                </p>
              </section>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-xs text-slate-500 text-center">
                For inquiries and assistance, please contact the <strong className="text-slate-800">Office of the Senior Citizens Affairs (OSCA)</strong>.
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#EF4444] transition-all cursor-pointer shadow-md"
              >
                Got it, Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function AnnualCashGiftModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-8"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Annual Cash Gift
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Program Details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6 text-slate-600 leading-relaxed text-sm text-left font-sans">
              <section className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Benefit Details</span>
                </div>
                <p className="text-slate-800 font-medium text-base leading-relaxed">
                  Qualified beneficiaries are receive an annual financial assistance of (₱2,000.00) yearly.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#EF4444] transition-all cursor-pointer shadow-md"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ExpandedCentenariansModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-8"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Expanded Centenarians Act
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Republic Act No. 11982
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6 text-slate-600 leading-relaxed text-sm text-left">
              <section className="space-y-2">
                <h4 className="text-base font-bold text-slate-900">
                  Expanded Centenarians Act Benefit Program (Republic Act No. 11982)
                </h4>
                <p className="font-medium text-slate-700">
                  The Expanded Centenarians Act of 2024 (Republic Act No. 11982) grants cash gifts and recognition to Filipino senior citizens who reach significant milestone ages in recognition of their longevity and contributions to society.
                </p>
              </section>

              <section className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Benefit Amount</span>
                </div>
                <p className="text-xs font-semibold text-amber-900">Qualified senior citizens are entitled to receive the following cash gifts:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-slate-700 font-medium">
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-100/50">
                    <span className="text-xs text-slate-400 font-bold block">80 YEARS OLD</span>
                    <strong className="text-amber-900 text-base">₱10,000.00 cash gift</strong>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-100/50">
                    <span className="text-xs text-slate-400 block font-bold">85 YEARS OLD</span>
                    <strong className="text-amber-900 text-base">₱10,000.00 cash gift</strong>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-100/50">
                    <span className="text-xs text-slate-400 block font-bold">90 YEARS OLD</span>
                    <strong className="text-amber-900 text-base">₱10,000.00 cash gift</strong>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-100/50">
                    <span className="text-xs text-slate-400 block font-bold">95 YEARS OLD</span>
                    <strong className="text-amber-900 text-base">₱10,000.00 cash gift</strong>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-100/50 sm:col-span-2">
                    <span className="text-xs text-slate-400 block font-bold">100 YEARS OLD AND ABOVE</span>
                    <strong className="text-amber-950 text-lg block">₱100,000.00 cash gift</strong>
                  </div>
                </div>
              </section>

              <section className="space-y-2 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-500" /> Additional Recognition
                </h4>
                <p className="text-xs text-blue-900/90 font-medium">
                  Senior citizens who reach one hundred (100) years old and above shall receive a <strong className="text-blue-950">Letter of Felicitation from the President of the Republic of the Philippines</strong>.
                </p>
              </section>

              <section className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-[#EF4444] flex items-center gap-2">
                  <Check className="w-4 h-4" /> Eligibility Requirements
                </h4>
                <p className="font-semibold text-slate-800">To qualify for the benefit, applicants must:</p>
                <ul className="space-y-3 pl-1">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Be a Filipino citizen, whether residing in the Philippines or abroad</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Have reached the qualifying milestone age of 80, 85, 90, 95, or 100 years old</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Submit the required documentary requirements and application forms</span>
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-[#EF4444] flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Documentary Requirements
                </h4>
                <p className="font-semibold text-slate-800">Applicants must submit:</p>
                <ul className="space-y-3 pl-1">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Duly accomplished application form</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Proof of age and identity (primary or secondary identification documents)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Endorsement letter from the Local Chief Executive, OSCA, LSWDO, or appropriate government office</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Additional supporting documents as may be required by the National Commission of Senior Citizens (NCSC)</span>
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-[#EF4444] flex items-center gap-2">
                  <Info className="w-4 h-4" /> Application Process
                </h4>
                <p className="text-slate-700 pl-1 font-medium">
                  Applications may be filed through the Office for Senior Citizens Affairs (OSCA) or the Local Social Welfare Development Office (LSWDO).
                </p>
              </section>

              <section className="space-y-2 border-t border-slate-100 pt-5">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-blue-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" /> Important Information
                </h4>
                <ul className="space-y-2 pl-1 text-xs text-slate-500 list-disc list-inside">
                  <li>Benefits must be claimed within one (1) year from the date the senior citizen reaches the qualifying age milestone.</li>
                  <li>Unclaimed benefits beyond the prescribed period shall be handled in accordance with government auditing rules and regulations.</li>
                  <li>The program is administered by the National Commission of Senior Citizens (NCSC) in coordination with local government units and relevant government agencies.</li>
                </ul>
              </section>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-xs text-slate-500 text-center">
                For assistance and application inquiries, please contact the <strong className="text-slate-800">Office of the Senior Citizens Affairs (OSCA)</strong>.
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#EF4444] transition-all cursor-pointer shadow-md font-sans"
              >
                Got it, Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function BenefitSelection() {
  const navigate = useNavigate();
  const [showIdAlert, setShowIdAlert] = useState(false);
  const [idStatus, setIdStatus] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [appliedBenefits, setAppliedBenefits] = useState<Record<string, string>>({});
  const [showWeddingModal, setShowWeddingModal] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showSocialPensionModal, setShowSocialPensionModal] = useState(false);
  const [showAnnualCashGiftModal, setShowAnnualCashGiftModal] = useState(false);
  const [showCentenarianModal, setShowCentenarianModal] = useState(false);
  const [userAge, setUserAge] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingStatus(true);
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!storedUser || !token) {
        setIsLoadingStatus(false);
        return;
      }
      const user = JSON.parse(storedUser);
      let foundAge = 0;
      let matchedCitizen = null;

      // 1. Try to fetch from masterlist by user.citizen_id first
      if (user.citizen_id) {
        try {
          const mlRes = await fetch(`${API_URL}/masterlist?search=${user.citizen_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (mlRes.ok) {
            const mlData = await mlRes.json();
            const masters = mlData.data?.data || mlData.data || mlData || [];
            matchedCitizen = masters.find(
              (m: any) => String(m.citizen_id) === String(user.citizen_id)
            );
          }
        } catch (e) {
          console.error("Error fetching masterlist by citizen_id", e);
        }
      }

      // 2. If not found by citizen_id, fetch all masterlist records and find by user_id
      if (!matchedCitizen && user.id) {
        try {
          const mlRes = await fetch(`${API_URL}/masterlist?per_page=5000`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (mlRes.ok) {
            const mlData = await mlRes.json();
            const masters = mlData.data?.data || mlData.data || mlData || [];
            matchedCitizen = masters.find(
              (m: any) => m.user_id === user.id || String(m.user_id) === String(user.id)
            );
          }
        } catch (e) {
          console.error("Error fetching all masterlist", e);
        }
      }

      // 3. Resolve age from matched citizen record
      if (matchedCitizen) {
        const rawAge = matchedCitizen.age || (matchedCitizen.birth_date ? calculateAge(matchedCitizen.birth_date) : "");
        if (rawAge) {
          foundAge = parseInt(rawAge);
        }
      }

      // 4. Fallback to localStorage user object
      if (!foundAge) {
        const rawAge = user.age || (user.birth_date ? calculateAge(user.birth_date) : "");
        foundAge = rawAge ? parseInt(rawAge) : 0;
      }

      setUserAge(foundAge);
      
      try {
        // Fetch ID Status
        const idRes = await fetch(
          `${API_URL}/id-issuances?search=${user.citizen_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (idRes.ok) {
          const idData = await idRes.json();
          const issuances = idData.data?.data || idData.data || idData || [];
          const userIssuances = issuances.filter(
            (i: any) => String(i.citizen_id) === String(user.citizen_id),
          );
          if (userIssuances.length > 0) {
            const latestRecord = userIssuances.sort((a: any, b: any) => {
              return (
                new Date(b.request_details?.application_date || 0).getTime() -
                new Date(a.request_details?.application_date || 0).getTime()
              );
            })[0];
            setIdStatus(latestRecord.status?.issuance_status || latestRecord.id_status || null);
          }
        }

        // Fetch All Benefit Applications in parallel
        const endpoints = [
          { url: `${API_URL}/benefit-applications`, type: "benefit-applications" },
          { url: `${API_URL}/social-pension`, type: "social-pension" },
          { url: `${API_URL}/birthday-incentives`, type: "birthday-incentives" },
          { url: `${API_URL}/wedding-anniversary-incentives`, type: "wedding-anniversary-incentives" }
        ];

        const results = await Promise.all(
          endpoints.map(e => fetch(e.url, { headers: { Authorization: `Bearer ${token}` } }))
        );

        const statusMap: Record<string, string> = {};

        for (let i = 0; i < results.length; i++) {
          const res = results[i];
          const type = endpoints[i].type;
          
          if (res.ok) {
            const data = await res.json();
            let apps: any[] = [];
            
            if (type === "benefit-applications") {
              apps = normalizeCashGiftResponse(data);
            } else if (type === "social-pension") {
              // Social pension uses direct array or .data
              const rawData = data.data?.data || data.data || data || [];
              apps = Array.isArray(rawData) ? rawData : [rawData];
            } else if (type === "birthday-incentives") {
              apps = normalizeBirthdayIncentiveResponse(data);
            } else if (type === "wedding-anniversary-incentives") {
              apps = normalizeWeddingIncentiveResponse(data);
            }

            const userApps = apps.filter((a: any) => 
              String(a.citizen_id) === String(user.citizen_id) || 
              String(a.ids?.citizen_id) === String(user.citizen_id) ||
              String(a.husband?.citizen_id) === String(user.citizen_id) ||
              String(a.wife?.citizen_id) === String(user.citizen_id)
            );
            
            userApps.forEach((app: any) => {
              const status = (app.reg_status || app.status || "pending").toLowerCase();
              if (type === "benefit-applications") {
                if (app.benefit_type) statusMap[app.benefit_type] = status;
              } else if (type === "social-pension") {
                statusMap["social-pension"] = status;
              } else if (type === "birthday-incentives") {
                statusMap["birthday-cash-incentives"] = status;
              } else if (type === "wedding-anniversary-incentives") {
                statusMap["50th-wedding-anniversary-incentive"] = status;
              }
            });
          }
        }
        // Also check centenarian local storage
        try {
          const centenarianForms = localStorage.getItem('centenarian_submitted_forms');
          if (centenarianForms) {
            const forms = JSON.parse(centenarianForms);
            const userForm = forms[user.citizen_id] || forms[user.id];
            if (userForm) {
              const centenarianPayouts = localStorage.getItem('centenarian_payout_statuses');
              let status = "pending";
              if (centenarianPayouts) {
                const payouts = JSON.parse(centenarianPayouts);
                const rawStatus = payouts[user.citizen_id] || payouts[user.id];
                if (rawStatus) {
                  const lowerStatus = rawStatus.toLowerCase();
                  if (lowerStatus.includes('disapproved') || lowerStatus.includes('rejected')) status = "disapproved";
                  else if (lowerStatus.includes('approved') || lowerStatus.includes('completed') || lowerStatus.includes('released')) status = "approved";
                  else status = "pending";
                }
              }
              statusMap["expanded-centenarians-act-benefit-program-national"] = status;
              statusMap["expanded-centenarians-act-benefit-program"] = status;
            }
          }
        } catch (e) {
          console.error("Failed to parse centenarian forms", e);
        }
        setAppliedBenefits(statusMap);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoadingStatus(false);
      }
    };
    fetchData();
  }, []);

  const handleApply = (benefit: string) => {
    if (idStatus?.toLowerCase() === "released") {
      navigate(`/portal/apply/${slugify(benefit)}`);
    } else {
      setShowIdAlert(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex justify-between items-start mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold text-[#EF4444] tracking-tight">
            Benefits
          </h1>
        </div>
        <Link
          to="/portal"
          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 px-4 sm:px-0">
        {benefitsList.map((benefit) => {
          const detail = benefitsDetails[benefit] || {
            category: "GENERAL ASSISTANCE",
            description: "City program providing support to senior residents.",
          };
          return (
            <div
              key={benefit}
              className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between group hover:shadow-2xl transition-all gap-6 md:gap-8"
            >
              <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8 flex-grow">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                  <Heart className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="space-y-1.5 md:space-y-2 text-center md:text-left">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                    {benefit}
                  </h3>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                    {detail.category}
                  </p>
                  <p className="text-base md:text-lg text-slate-400 font-medium max-w-xl leading-relaxed">
                    {detail.description}
                    {benefit === "50th Wedding Anniversary Incentive" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowWeddingModal(true);
                        }}
                        className="text-[#EF4444] hover:text-red-700 underline font-extrabold cursor-pointer transition-colors ml-1.5 focus:outline-none inline-flex items-center gap-0.5"
                      >
                        See more
                      </button>
                    )}
                    {benefit === "Birthday Cash Incentives (LGU)" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBirthdayModal(true);
                        }}
                        className="text-[#EF4444] hover:text-red-700 underline font-extrabold cursor-pointer transition-colors ml-1.5 focus:outline-none inline-flex items-center gap-0.5"
                      >
                        See more
                      </button>
                    )}
                    {benefit === "Social Pension" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSocialPensionModal(true);
                        }}
                        className="text-[#EF4444] hover:text-red-700 underline font-extrabold cursor-pointer transition-colors ml-1.5 focus:outline-none inline-flex items-center gap-0.5"
                      >
                        See more
                      </button>
                    )}
                    {benefit === "Expanded Centenarians Act Benefit Program (National)" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCentenarianModal(true);
                        }}
                        className="text-[#EF4444] hover:text-red-700 underline font-extrabold cursor-pointer transition-colors ml-1.5 focus:outline-none inline-flex items-center gap-0.5"
                      >
                        See more
                      </button>
                    )}
                  </p>
                  {benefit === "Expanded Centenarians Act Benefit Program (National)" && (
                    <div className={cn(
                      "mt-2 text-xs font-semibold px-4 py-2.5 rounded-xl border w-fit font-sans flex items-center gap-2",
                      userAge >= 80 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    )}>
                      {userAge >= 80 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Eligible: You are {userAge} years old (80 years old and above can send request).</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Not Eligible: You are only {userAge} years old. This program is exclusive to senior citizens who are 80 years old and above.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {benefit === "Social Pension" || benefit === "Annual Cash Gift" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (benefit === "Social Pension") setShowSocialPensionModal(true);
                    else if (benefit === "Annual Cash Gift") setShowAnnualCashGiftModal(true);
                  }}
                  className="w-full md:w-auto px-10 md:px-12 py-5 md:py-6 bg-[#EF4444] text-white rounded-xl md:rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-xl shadow-red-100 text-center whitespace-nowrap cursor-pointer focus:outline-none"
                >
                  See Details
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (benefit === "Expanded Centenarians Act Benefit Program (National)" && userAge < 80) {
                      toast.error("You must be 80 years old or above to apply for this program.");
                      return;
                    }
                    handleApply(benefit);
                  }}
                  disabled={
                    isLoadingStatus || 
                    !!appliedBenefits[slugify(benefit)] || 
                    (benefit === "Expanded Centenarians Act Benefit Program (National)" && userAge < 80)
                  }
                  className={cn(
                    "w-full md:w-auto px-10 md:px-12 py-5 md:py-6 text-white rounded-xl md:rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.2em] transition-all text-center whitespace-nowrap shadow-xl",
                    (benefit === "Expanded Centenarians Act Benefit Program (National)" && userAge < 80)
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-[#1E3A8A] hover:bg-blue-900 shadow-blue-100 cursor-pointer",
                    (isLoadingStatus || !!appliedBenefits[slugify(benefit)]) && "opacity-50 cursor-not-allowed",
                    appliedBenefits[slugify(benefit)] === "approved" && "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100",
                    appliedBenefits[slugify(benefit)] === "pending" && "bg-amber-500 hover:bg-amber-600 shadow-amber-100",
                    appliedBenefits[slugify(benefit)] === "disapproved" && "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                  )}
                >
                  {isLoadingStatus ? "Checking..." : appliedBenefits[slugify(benefit)] ? (
                    <div className="flex items-center gap-2">
                      {appliedBenefits[slugify(benefit)] === "approved" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : appliedBenefits[slugify(benefit)] === "pending" ? (
                        <Clock className="w-4 h-4" />
                      ) : appliedBenefits[slugify(benefit)] === "disapproved" ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span className="capitalize">{appliedBenefits[slugify(benefit)]}</span>
                    </div>
                  ) : "Send Request"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ID Status Alert Modal */}
      <AnimatePresence>
        {showIdAlert && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">
                  ID Required
                </h3>
                <p className="text-slate-500 font-medium mb-8">
                  You need to have a released Senior Citizen ID before you can apply for benefits.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowIdAlert(false);
                      navigate("/portal/id-services");
                    }}
                    className="w-full py-5 bg-[#EF4444] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200"
                  >
                    Go to ID Services
                  </button>
                  <button
                    onClick={() => setShowIdAlert(false)}
                    className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWeddingModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      Golden Wedding Anniversary
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Incentive Program Details
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeddingModal(false)}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6 text-slate-600 leading-relaxed text-sm text-left">
                <section className="space-y-2">
                  <p className="font-medium text-slate-700">
                    The City Government of San Juan, through City Ordinance No. 39, Series of 2022, provides a financial incentive to qualified married couples celebrating their 50th Wedding Anniversary in recognition of their enduring commitment to marriage and family values.
                  </p>
                </section>

                <section className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Benefit Amount</span>
                  </div>
                  <p className="text-amber-900/80 font-medium">
                    Qualified couples are entitled to receive a Golden Wedding Anniversary Incentive of <strong className="text-amber-900 font-extrabold text-lg">Fifty Thousand Pesos (₱50,000.00)</strong>, subject to the availability of city funds.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-[#EF4444] flex items-center gap-2">
                    <Check className="w-4 h-4" /> Eligibility Requirements
                  </h4>
                  <p className="font-semibold text-slate-800">To qualify for the incentive, applicants must:</p>
                  <ul className="space-y-3 pl-1">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Be legally married and celebrating their 50th Wedding Anniversary</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Be permanent residents of the City of San Juan for at least ten (10) years</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>If residing temporarily outside the city for employment or work-related reasons, at least one (1) spouse must have maintained residency in San Juan City for at least three (3) years immediately preceding the anniversary celebration</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3 border-t border-slate-100 pt-5">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-blue-600 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Important Information
                  </h4>
                  <ul className="space-y-2 list-disc pl-5 text-slate-500">
                    <li>Applications are subject to verification and approval by the appropriate city offices.</li>
                    <li>The incentive is granted in accordance with the provisions of City Ordinance No. 39, Series of 2022.</li>
                    <li>Release of funds is subject to the availability of appropriated funds and compliance with applicable government rules and regulations.</li>
                  </ul>
                </section>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-xs text-slate-500 text-center">
                  For assistance and application details, please contact the <strong className="text-slate-800">Office of the Senior Citizens Affairs (OSCA)</strong>.
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowWeddingModal(false)}
                  className="px-6 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#EF4444] transition-all cursor-pointer shadow-md"
                >
                  Got it, Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BirthdayIncentivesModal isOpen={showBirthdayModal} onClose={() => setShowBirthdayModal(false)} />
      <SocialPensionModal isOpen={showSocialPensionModal} onClose={() => setShowSocialPensionModal(false)} />
      <AnnualCashGiftModal isOpen={showAnnualCashGiftModal} onClose={() => setShowAnnualCashGiftModal(false)} />
      <ExpandedCentenariansModal isOpen={showCentenarianModal} onClose={() => setShowCentenarianModal(false)} />
    </div>
  );
}

export function BirthdayIncentiveForm({
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  // Get user data from localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    citizen_id: data?.citizen_id || data?.id || user?.citizen_id || user?.id || "",
    scid_number: data?.scid_number || user?.scid_number || "",
    first_name: data?.first_name || user?.first_name || "",
    middle_name: data?.middle_name || user?.middle_name || "",
    last_name: data?.last_name || user?.last_name || "",
    birth_date: data?.birth_date || user?.birth_date || "",
    age: data?.age?.toString() || user?.age?.toString() || "",
    contact_number: data?.contact_number || user?.contact_number || "",
    barangay: data?.barangay || user?.barangay || "",
    city_municipality: data?.city_municipality || user?.city_municipality || "",
    province: data?.province || user?.province || "",
    incentive_tier: "",
    birthcertificate: null as File | string | null,
  });

  // Sync data prop to formData
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
        scid_number: data.scid_number || prev.scid_number || "",
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        last_name: data.last_name || "",
        birth_date: formattedDate,
        age: data.age?.toString() || "",
        contact_number: data.contact_number || "",
        barangay: data.barangay || "",
        city_municipality: data.city_municipality || data.city || "",
        province: data.province || "",
      }));
    }
  }, [data]);

  // Auto-fetch from masterlist using citizen_id
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
        },
      );

      const result = await response.json();
      const masterlist = result.data?.data || result.data || result || [];

      const record = Array.isArray(masterlist)
        ? masterlist.find(
          (r: any) => 
            String(r.citizen_id) === String(searchId) || 
            String(r.scid_number) === String(searchId) ||
            String(r.id) === String(searchId)
        )
        : (result.data || result);

      if (record && (record.citizen_id || record.id || record.scid_number)) {
          let formattedDate = record.birth_date || record.birthdate || "";
          if (formattedDate && formattedDate.includes("/")) {
            const parts = formattedDate.split("/");
            if (parts.length === 3 && parts[2].length === 4) {
              formattedDate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
            }
          }

          const calculatedAgeVal = calculateAge(formattedDate);

          setIsAutofilled(true);
          setFormData((prev) => ({
            ...prev,
            citizen_id: record.citizen_id || prev.citizen_id,
            scid_number: record.scid_number || prev.scid_number || "",
            first_name: record.first_name || "",
            middle_name: record.middle_name || "",
            last_name: record.last_name || "",
            birth_date: formattedDate,
            age: record.age?.toString() || calculatedAgeVal || "",
            contact_number: record.contact_number || "",
            barangay: record.barangay || "",
            city_municipality: record.city_municipality || record.city || "",
            province: record.province || "",
          }));
        } else if (mode === "admin" && searchId) {
          alert("No record found in masterlist.");
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

  const handleCitizenIdSearch = () => {
    if (formData.citizen_id) {
      fetchMasterlistData(formData.citizen_id);
    }
  };

  // Auto-calculate age and incentive tier
  useEffect(() => {
    if (formData.age) {
      const ageNum = parseInt(formData.age);
      let tier = "";
      if (ageNum >= 100) tier = "100";
      else if (ageNum >= 91 && ageNum <= 99) tier = ageNum.toString();
      else if (ageNum >= 90 && ageNum < 100) tier = "90";
      else if (ageNum >= 80 && ageNum < 90) tier = "80";
      else if (ageNum >= 70 && ageNum < 80) tier = "70";
      
      if (tier && tier !== formData.incentive_tier) {
        setFormData(prev => ({ ...prev, incentive_tier: tier }));
      }
    }
  }, [formData.age]);

  useEffect(() => {
    if (formData.birth_date) {
      const newAge = calculateAge(formData.birth_date);
      if (newAge && newAge !== formData.age) {
        setFormData((prev) => ({ ...prev, age: newAge }));
      }
    }
  }, [formData.birth_date]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, birthcertificate: files[0] }));
    }
  };

  // Incentive Logic
  const getIncentiveAmount = (tier: string) => {
    const age = parseInt(tier);
    if (age === 70) return "₱3,000";
    if (age === 80) return "₱5,000";
    if (age === 90) return "₱8,000";
    if (age >= 91 && age <= 99) return "₱2,000";
    if (age >= 100) return "₱100,000";
    return null;
  };

  const isTierValid = (tier: number) => {
    const currentAge = parseInt(formData.age);
    if (isNaN(currentAge)) return true; // Allow selection if age not set yet
    
    // Milestones: 70, 80, 90, 100+
    if (tier === 70) return currentAge >= 70 && currentAge < 80;
    if (tier === 80) return currentAge >= 80 && currentAge < 90;
    if (tier === 90) return currentAge >= 90 && currentAge < 100;
    if (tier >= 91 && tier <= 99) return currentAge >= 91 && currentAge <= 99;
    if (tier >= 100) return currentAge >= 100;
    
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors({});

    const requiredFields = [
      "incentive_tier",
      "first_name",
      "last_name",
      "birth_date",
      "age",
      "barangay",
      "city_municipality",
      "province",
      "contact_number",
    ];

    const missingFields = requiredFields.filter(
      (f) => !formData[f as keyof typeof formData],
    );
    if (missingFields.length > 0) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'birthcertificate') {
          if (value instanceof File) {
            fd.append(key, value);
            // Backward compatibility
            fd.append("document[]", value);
          }
        } else {
          fd.append(key, String(value));
        }
      });
      fd.append("reg_status", "pending");

      const response = await fetch(
        `${API_URL}/birthday-incentives`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        },
      );

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          if (mode === "admin") {
            navigate("/benefits/birthday-cash-incentives");
          } else {
            navigate("/portal");
          }
        }, 3000);
      } else if (response.status === 422) {
        setApiErrors(data.errors || {});
        const errorMsgs = Object.values(data.errors || {})
          .flat()
          .join("\n");
        alert("Validation Errors:\n" + errorMsgs);
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred during submission.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[2rem] shadow-xl p-12 text-center space-y-6 border border-slate-100">
        <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-[#EF4444] tracking-tight">
          Success!
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          {mode === "admin" 
            ? "Application successfully created. Redirecting back to management..." 
            : "Application submitted successfully. Redirecting you back to the portal..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex justify-between items-start mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-4xl font-bold text-[#EF4444] tracking-tight">
            {mode === "admin" ? "New Entry: Birthday Cash Incentives (LGU)" : "Birthday Cash Incentives (LGU)"}
          </h1>
          {mode === "admin" && (
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Walk-in Application</p>
          )}
        </div>
        {onClose || isReadOnly ? (
          <button
            onClick={() => onClose ? onClose() : navigate(-1)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <Link
            to={mode === "admin" ? "/benefits/birthday-cash-incentives" : "/portal/apply"}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Program Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white border border-slate-100 rounded-2xl md:rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 space-y-6 md:space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <CheckCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">
                Incentive Tiers
              </h3>
            </div>
            <div className="space-y-4">
              <p className="text-base font-medium text-slate-500 leading-relaxed">
                Cash incentives are provided to senior citizens reaching
                significant milestones:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {[
                  { age: "70", amount: "₱3,000" },
                  { age: "80", amount: "₱5,000" },
                  { age: "90", amount: "₱8,000" },
                  { age: "91-99", amount: "₱2,000" },
                  { age: "100+", amount: "₱100,000" },
                ].map((tier) => (
                  <div
                    key={tier.age}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-xl font-bold text-slate-900">
                        {tier.age}
                      </span>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Years Old
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-emerald-600">
                        {tier.amount}
                      </span>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Incentive
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowBirthdayModal(true)}
                  className="w-full py-3.5 px-4 bg-slate-50 hover:bg-slate-100 text-[#EF4444] hover:text-red-700 font-bold text-xs uppercase tracking-widest rounded-2xl border border-dashed border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>See Ordinance Map (See more)</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 md:p-8 lg:p-12 border border-slate-100 space-y-10 md:space-y-12"
          >
            {/* Auto-Fetch Helper for Admin */}
            {mode === "admin" && (
              <div className="p-5 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 w-full space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                    Search by SCID Number
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter ID to auto-populate..."
                    value={formData.citizen_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, citizen_id: e.target.value }))}
                    className="w-full px-5 md:px-6 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-base font-bold text-[#0F172A] outline-none focus:border-[#EF4444]"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleCitizenIdSearch}
                  className="w-full md:w-auto px-8 py-3 md:py-4 bg-[#0F172A] text-white rounded-xl md:rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Fetch Data
                </button>
              </div>
            )}

            {/* Incentive Selection */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
                  <Ticket className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-amber-600">
                  Incentive Selection
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Incentive Tier
                  </label>
                  <select
                    name="incentive_tier"
                    value={formData.incentive_tier}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all appearance-none",
                      isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  >
                    <option value="">Select Tier</option>
                    {[70, 80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100].map(
                      (val) => {
                        const valid = isTierValid(val);
                        return (
                          <option key={val} value={val.toString()} disabled={(!valid && formData.age !== "") || isReadOnly}>
                            {val} Years Old {!valid && formData.age !== "" ? "(Not Eligible)" : ""}
                          </option>
                        );
                      }
                    )}
                  </select>
                  {apiErrors.incentive_tier && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">
                      {apiErrors.incentive_tier[0]}
                    </p>
                  )}
                </div>
                {formData.incentive_tier && (
                  <div className="flex items-center">
                    <div className="px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl w-full">
                      <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Incentive Amount</p>
                      <p className="text-3xl font-black text-emerald-700">{getIncentiveAmount(formData.incentive_tier)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#EF4444]">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#EF4444]">
                  Personal Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    SCID Number
                  </label>
                  <input
                    type="text"
                    name="scid_number"
                    value={formData.scid_number}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all font-mono",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.first_name && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">
                      {apiErrors.first_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.last_name && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">
                      {apiErrors.last_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.birth_date && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">
                      {apiErrors.birth_date[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Location & Contact */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">
                  Location & Contact
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#0F172A]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 tracking-wider ml-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city_municipality"
                    value={formData.city_municipality}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#0F172A]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 tracking-wider ml-1">
                    Province
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#0F172A]/30"
                    )}
                  />
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <label className="text-[11px] font-bold text-slate-500 tracking-wider ml-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#0F172A]/30"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Document */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                  Verification Document
                </h3>
              </div>
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e.target.files)}
                  disabled={isReadOnly}
                  className={cn(
                    "absolute inset-0 w-full h-full opacity-0 z-10",
                    isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                  )}
                />
                <div
                  className={cn(
                    "w-full px-8 py-6 border-2 border-dashed rounded-3xl flex items-center justify-between transition-all",
                    formData.birthcertificate
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-100 group-hover:border-emerald-500 group-hover:bg-emerald-50",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Upload
                      className={cn(
                        "w-6 h-6",
                        formData.birthcertificate
                          ? "text-emerald-500"
                          : "text-slate-400",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-bold text-slate-500",
                      )}
                    >
                      {formData.birthcertificate instanceof File
                        ? formData.birthcertificate.name
                        : formData.birthcertificate
                          ? "Document Uploaded"
                          : "Upload Birth Certificate"}
                    </span>
                  </div>
                  {formData.birthcertificate && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                        Uploaded
                      </span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>
              {parseInt(formData.incentive_tier) >= 90 && (
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest ml-1 bg-amber-50 p-2 rounded-lg border border-amber-100">
                  Birth certificate is mandatory for tiers 90 and above.
                </p>
              )}
            </div>

            {isReadOnly ? (
              <button
                type="button"
                onClick={() => onClose ? onClose() : navigate(-1)}
                className="w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 bg-[#0F172A] text-white hover:bg-slate-800"
              >
                Close View
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3",
                  isLoading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-[#EF4444]",
                )}
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLoading ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </form>
        </div>
      </div>

      <BirthdayIncentivesModal isOpen={showBirthdayModal} onClose={() => setShowBirthdayModal(false)} />
    </div>
  );
}

export function WeddingAnniversaryForm({
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});
  const [showProgramDetails, setShowProgramDetails] = useState(false);

  // Get user data from localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");

  const applicantGender = user?.sex || "Male";

  const [formData, setFormData] = useState({
    husband_first_name: data?.husband_first_name || (applicantGender === 'Male' ? data?.first_name : "") || "",
    husband_middle_name: data?.husband_middle_name || (applicantGender === 'Male' ? data?.middle_name : "") || "",
    husband_last_name: data?.husband_last_name || (applicantGender === 'Male' ? data?.last_name : "") || "",
    husband_birth_date: data?.husband_birth_date || (applicantGender === 'Male' ? data?.birth_date : "") || "",
    husband_age: data?.husband_age?.toString() || (applicantGender === 'Male' ? data?.age?.toString() : "") || "",
    husband_contact_number: data?.husband_contact_number || (applicantGender === 'Male' ? data?.contact_number : "") || "",
    wife_first_name: data?.wife_first_name || (applicantGender === 'Female' ? data?.first_name : "") || "",
    wife_middle_name: data?.wife_middle_name || (applicantGender === 'Female' ? data?.middle_name : "") || "",
    wife_last_name: data?.wife_last_name || (applicantGender === 'Female' ? data?.last_name : "") || "",
    wife_birth_date: data?.wife_birth_date || (applicantGender === 'Female' ? data?.birth_date : "") || "",
    wife_age: data?.wife_age?.toString() || (applicantGender === 'Female' ? data?.age?.toString() : "") || "",
    wife_contact_number: data?.wife_contact_number || (applicantGender === 'Female' ? data?.contact_number : "") || "",
    marriage_date: data?.marriage_date || "",
    barangay: data?.barangay || "",
    city_municipality: data?.city_municipality || "",
    province: data?.province || "",
    marriage_certificate_path: null as File | string | null,
  });

  const [isHusbandAutofilled, setIsHusbandAutofilled] = useState(false);
  const [isWifeAutofilled, setIsWifeAutofilled] = useState(false);

  // Sync data prop to formData
  useEffect(() => {
    if (data) {
      if (data.husband_first_name || data.wife_first_name) {
         setFormData(prev => ({
           ...prev,
           husband_first_name: data.husband_first_name || prev.husband_first_name,
           husband_middle_name: data.husband_middle_name || prev.husband_middle_name,
           husband_last_name: data.husband_last_name || prev.husband_last_name,
           husband_birth_date: data.husband_birth_date || prev.husband_birth_date,
           husband_age: data.husband_age?.toString() || (data.husband_birth_date ? calculateAge(data.husband_birth_date) : prev.husband_age),
           husband_contact_number: data.husband_contact_number || prev.husband_contact_number,
           wife_first_name: data.wife_first_name || prev.wife_first_name,
           wife_middle_name: data.wife_middle_name || prev.wife_middle_name,
           wife_last_name: data.wife_last_name || prev.wife_last_name,
           wife_birth_date: data.wife_birth_date || prev.wife_birth_date,
           wife_age: data.wife_age?.toString() || (data.wife_birth_date ? calculateAge(data.wife_birth_date) : prev.wife_age),
           wife_contact_number: data.wife_contact_number || prev.wife_contact_number,
           marriage_date: data.marriage_date || prev.marriage_date,
           barangay: data.barangay || prev.barangay,
           city_municipality: data.city_municipality || prev.city_municipality,
           province: data.province || prev.province,
         }));
      } else {
        const gender = data.sex || applicantGender;
        if (gender === 'Male') {
          setFormData(prev => ({
            ...prev,
            husband_first_name: data.first_name || prev.husband_first_name,
            husband_middle_name: data.middle_name || prev.husband_middle_name,
            husband_last_name: data.last_name || prev.husband_last_name,
            husband_birth_date: data.birth_date || prev.husband_birth_date,
            husband_age: data.age?.toString() || (data.birth_date ? calculateAge(data.birth_date) : prev.husband_age),
            husband_contact_number: data.contact_number || prev.husband_contact_number,
            barangay: data.barangay || prev.barangay,
            city_municipality: data.city_municipality || data.city || prev.city_municipality,
            province: data.province || prev.province,
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            wife_first_name: data.first_name || prev.wife_first_name,
            wife_middle_name: data.middle_name || prev.wife_middle_name,
            wife_last_name: data.last_name || prev.wife_last_name,
            wife_birth_date: data.birth_date || prev.wife_birth_date,
            wife_age: data.age?.toString() || (data.birth_date ? calculateAge(data.birth_date) : prev.wife_age),
            wife_contact_number: data.contact_number || prev.wife_contact_number,
            barangay: data.barangay || prev.barangay,
            city_municipality: data.city_municipality || data.city || prev.city_municipality,
            province: data.province || prev.province,
          }));
        }
      }
    }
  }, [data]);

  useEffect(() => {
    if (formData.husband_birth_date) {
      const newAge = calculateAge(formData.husband_birth_date);
      if (newAge && newAge !== formData.husband_age) {
        setFormData((prev) => ({ ...prev, husband_age: newAge }));
      }
    }
  }, [formData.husband_birth_date]);

  useEffect(() => {
    if (formData.wife_birth_date) {
      const newAge = calculateAge(formData.wife_birth_date);
      if (newAge && newAge !== formData.wife_age) {
        setFormData((prev) => ({ ...prev, wife_age: newAge }));
      }
    }
  }, [formData.wife_birth_date]);

  useEffect(() => {
    if (user && mode === "citizen" && !data) {
      if (applicantGender === "Male") {
        setFormData((prev) => ({
          ...prev,
          husband_first_name: user.first_name || "",
          husband_middle_name: user.middle_name || "",
          husband_last_name: user.last_name || "",
          husband_birth_date: user.birth_date || "",
          husband_age: user.age?.toString() || "",
          husband_contact_number: user.contact_number || "",
          barangay: user.barangay || "",
          city_municipality: user.city_municipality || "",
          province: user.province || "",
        }));
      } else if (applicantGender === "Female") {
        setFormData((prev) => ({
          ...prev,
          wife_first_name: user.first_name || "",
          wife_middle_name: user.middle_name || "",
          wife_last_name: user.last_name || "",
          wife_birth_date: user.birth_date || "",
          wife_age: user.age?.toString() || "",
          wife_contact_number: user.contact_number || "",
          barangay: user.barangay || "",
          city_municipality: user.city_municipality || "",
          province: user.province || "",
        }));
      }
    }
  }, [storedUser, mode]);

  // Auto-fetch from masterlist
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
        },
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

        const gender = record.sex || applicantGender;
        
        if (gender === "Male") {
          setIsHusbandAutofilled(true);
          setFormData((prev) => ({
            ...prev,
            husband_first_name: record.first_name || prev.husband_first_name,
            husband_middle_name: record.middle_name || prev.husband_middle_name,
            husband_last_name: record.last_name || prev.husband_last_name,
            husband_birth_date: formattedDate || prev.husband_birth_date,
            husband_age: record.age?.toString() || (formattedDate ? calculateAge(formattedDate) : prev.husband_age),
            husband_contact_number: record.contact_number || record.contact_no || prev.husband_contact_number,
            barangay: record.barangay || prev.barangay,
            city_municipality: record.city_municipality || record.city || prev.city_municipality,
            province: record.province || prev.province,
          }));
        } else {
          setIsWifeAutofilled(true);
          setFormData((prev) => ({
            ...prev,
            wife_first_name: record.first_name || prev.wife_first_name,
            wife_middle_name: record.middle_name || prev.wife_middle_name,
            wife_last_name: record.last_name || prev.wife_last_name,
            wife_birth_date: formattedDate || prev.wife_birth_date,
            wife_age: record.age?.toString() || (formattedDate ? calculateAge(formattedDate) : prev.wife_age),
            wife_contact_number: record.contact_number || record.contact_no || prev.wife_contact_number,
            barangay: record.barangay || prev.barangay,
            city_municipality: record.city_municipality || record.city || prev.city_municipality,
            province: record.province || prev.province,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching masterlist:", error);
    }
  };

  useEffect(() => {
    const searchId = mode === "admin" ? "" : (user?.citizen_id || user?.scid_number || user?.id);
    if (searchId && !data && !isReadOnly) {
      fetchMasterlistData(String(searchId));
    }
  }, [user?.citizen_id, user?.scid_number, user?.id, token, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, marriage_certificate_path: files[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors({});

    const requiredFields = [
      "husband_first_name",
      "husband_last_name",
      "husband_birth_date",
      "husband_contact_number",
      "wife_first_name",
      "wife_last_name",
      "wife_birth_date",
      "wife_contact_number",
      "marriage_date",
      "barangay",
    ];

    const missingFields = requiredFields.filter(
      (f) => !formData[f as keyof typeof formData],
    );
    if (missingFields.length > 0) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!formData.marriage_certificate_path) {
      alert("Marriage Certificate is required.");
      return;
    }

    const marriageYear = new Date(formData.marriage_date).getFullYear();
    const currentYear = new Date().getFullYear();
    if (currentYear - marriageYear < 50) {
      alert("You are not eligible for this benefit.");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();

      // Flat FormData fields
      fd.append("husband_first_name", formData.husband_first_name);
      fd.append("husband_middle_name", formData.husband_middle_name);
      fd.append("husband_last_name", formData.husband_last_name);
      fd.append("husband_birth_date", formData.husband_birth_date);
      fd.append("husband_age", formData.husband_age || "0");
      fd.append("husband_contact_number", formData.husband_contact_number);
      
      fd.append("wife_first_name", formData.wife_first_name);
      fd.append("wife_middle_name", formData.wife_middle_name);
      fd.append("wife_last_name", formData.wife_last_name);
      fd.append("wife_birth_date", formData.wife_birth_date);
      fd.append("wife_age", formData.wife_age || "0");
      fd.append("wife_contact_number", formData.wife_contact_number);
      
      fd.append("marriage_date", formData.marriage_date);
      fd.append("barangay", formData.barangay);
      fd.append("city_municipality", formData.city_municipality);
      fd.append("province", formData.province);
      fd.append("status", "pending");

      if (formData.marriage_certificate_path instanceof File) {
        fd.append("marriage_certificate_file", formData.marriage_certificate_path);
      }

      const response = await fetch(
        `${API_URL}/wedding-anniversary-incentives`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        },
      );

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          if (mode === "admin") {
            navigate("/benefits/50th-wedding-anniversary-incentive");
          } else {
            navigate("/portal");
          }
        }, 3000);
      } else if (response.status === 422) {
        setApiErrors(data.errors || {});
        const errorMsgs = Object.values(data.errors || {})
          .flat()
          .join("\n");
        alert("Validation Errors:\n" + errorMsgs);
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred during submission.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[2rem] shadow-xl p-12 text-center space-y-6 border border-slate-100">
        <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-[#EF4444] tracking-tight">
          Success!
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          {mode === "admin" 
            ? "Application successfully created. Redirecting back to management..." 
            : "Application submitted successfully. Redirecting you back to the portal..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex justify-between items-start mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-4xl font-bold text-[#EF4444] tracking-tight">
            {mode === "admin" ? "New Entry: Wedding Anniversary Incentive" : "Wedding Anniversary Incentive"}
          </h1>
          {mode === "admin" && (
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Walk-in Application</p>
          )}
        </div>
        {onClose || isReadOnly ? (
          <button
            onClick={() => onClose ? onClose() : navigate(-1)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <Link
            to={mode === "admin" ? "/benefits/50th-wedding-anniversary-incentive" : "/portal/apply"}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </Link>
        )}
      </div>

      <section className="bg-blue-50 border border-blue-100 rounded-2xl md:rounded-[2rem] p-6 md:p-8 flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start mx-4 sm:mx-0 mb-8 text-center sm:text-left">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
          <Info className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-blue-600">
            Program Overview
          </h3>
          <p className="text-[13px] md:text-sm font-bold text-blue-900/80 leading-relaxed max-w-2xl">
            This program grants a cash incentive to legally married couples who
            have reached their golden (50th) wedding anniversary.
            <button
              type="button"
              onClick={() => setShowProgramDetails(true)}
              className="text-[#EF4444] hover:text-red-700 underline font-extrabold cursor-pointer transition-colors ml-1.5 focus:outline-none inline-flex items-center gap-0.5"
            >
              See more
            </button>
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-8 px-4 sm:px-0">
        <div className="w-full space-y-6">
          <section className="bg-white border border-slate-100 rounded-2xl md:rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 space-y-6 md:space-y-8">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <CheckCircle className="w-4 h-4" />
              </div>
              <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-blue-600">
                Eligibility
              </h3>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <li className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    formData.marriage_certificate_path
                      ? "bg-emerald-50"
                      : "bg-slate-50",
                  )}
                >
                  {formData.marriage_certificate_path ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-200" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-base font-bold leading-tight",
                      formData.marriage_certificate_path
                        ? "text-slate-600"
                        : "text-slate-400",
                    )}
                  >
                    Marriage Certificate
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    new Date().getFullYear() -
                      (formData.marriage_date
                        ? new Date(formData.marriage_date).getFullYear()
                        : new Date().getFullYear()) >=
                      50
                      ? "bg-emerald-50"
                      : "bg-slate-50",
                  )}
                >
                  {new Date().getFullYear() -
                    (formData.marriage_date
                      ? new Date(formData.marriage_date).getFullYear()
                      : new Date().getFullYear()) >=
                  50 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-200" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-base font-bold leading-tight",
                      new Date().getFullYear() -
                        (formData.marriage_date
                          ? new Date(formData.marriage_date).getFullYear()
                          : new Date().getFullYear()) >=
                        50
                        ? "text-slate-600"
                        : "text-slate-400",
                    )}
                  >
                    50 Years Married
                  </span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Currently:{" "}
                    {formData.marriage_date
                      ? new Date().getFullYear() -
                        new Date(formData.marriage_date).getFullYear()
                      : 0}{" "}
                    years
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <div className="w-full space-y-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 md:p-8 lg:p-12 border border-slate-100 space-y-10 md:space-y-12"
          >
            {/* Husband Information */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">
                  Husband Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="husband_first_name"
                    value={formData.husband_first_name}
                    onChange={handleInputChange}
                    readOnly={isHusbandAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isHusbandAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-blue-500"
                    )}
                  />
                  {apiErrors.husband_first_name && (
                    <p className="text-base text-red-500 font-bold ml-1">
                      {apiErrors.husband_first_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="husband_middle_name"
                    value={formData.husband_middle_name}
                    onChange={handleInputChange}
                    readOnly={isHusbandAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isHusbandAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-blue-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="husband_last_name"
                    value={formData.husband_last_name}
                    onChange={handleInputChange}
                    readOnly={isHusbandAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isHusbandAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-blue-500"
                    )}
                  />
                  {apiErrors.husband_last_name && (
                    <p className="text-sm text-red-500 font-bold ml-1">
                      {apiErrors.husband_last_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    name="husband_birth_date"
                    value={formData.husband_birth_date}
                    onChange={handleInputChange}
                    readOnly={isHusbandAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isHusbandAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-blue-500"
                    )}
                  />
                  {apiErrors.husband_birth_date && (
                    <p className="text-base text-red-500 font-bold ml-1">
                      {apiErrors.husband_birth_date[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="husband_age"
                    value={formData.husband_age}
                    onChange={handleInputChange}
                    readOnly={isHusbandAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isHusbandAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-blue-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="husband_contact_number"
                    value={formData.husband_contact_number}
                    onChange={handleInputChange}
                    readOnly={isHusbandAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isHusbandAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-blue-500"
                    )}
                  />
                  {apiErrors.husband_contact_number && (
                    <p className="text-base text-red-500 font-bold ml-1">
                      {apiErrors.husband_contact_number[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Wife Information */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold uppercase tracking-widest text-[#EF4444]">
                  Wife Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="wife_first_name"
                    value={formData.wife_first_name}
                    onChange={handleInputChange}
                    readOnly={isWifeAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isWifeAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-rose-500"
                    )}
                  />
                  {apiErrors.wife_first_name && (
                    <p className="text-base text-red-500 font-bold ml-1">
                      {apiErrors.wife_first_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="wife_middle_name"
                    value={formData.wife_middle_name}
                    onChange={handleInputChange}
                    readOnly={isWifeAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isWifeAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-rose-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="wife_last_name"
                    value={formData.wife_last_name}
                    onChange={handleInputChange}
                    readOnly={isWifeAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isWifeAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-rose-500"
                    )}
                  />
                  {apiErrors.wife_last_name && (
                    <p className="text-base text-red-500 font-bold ml-1">
                      {apiErrors.wife_last_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    name="wife_birth_date"
                    value={formData.wife_birth_date}
                    onChange={handleInputChange}
                    readOnly={isWifeAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isWifeAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-rose-500"
                    )}
                  />
                  {apiErrors.wife_birth_date && (
                    <p className="text-base text-red-500 font-bold ml-1">
                      {apiErrors.wife_birth_date[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="wife_age"
                    value={formData.wife_age}
                    onChange={handleInputChange}
                    readOnly={isWifeAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isWifeAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-rose-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="wife_contact_number"
                    value={formData.wife_contact_number}
                    onChange={handleInputChange}
                    readOnly={isWifeAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      isWifeAutofilled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-rose-500"
                    )}
                  />
                  {apiErrors.wife_contact_number && (
                    <p className="text-base text-red-500 font-bold ml-1">
                      {apiErrors.wife_contact_number[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Marriage Details */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
                  <Heart className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-amber-600">
                  Marriage Details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Marriage Date
                  </label>
                  <input
                    type="date"
                    name="marriage_date"
                    value={formData.marriage_date}
                    onChange={handleInputChange}
                    readOnly={isReadOnly}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-700 outline-none focus:border-amber-500 transition-all"
                  />
                  {apiErrors.marriage_date && (
                    <p className="text-base text-red-500 font-bold ml-1">
                      {apiErrors.marriage_date[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
                  Location
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 tracking-wider ml-1">
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    readOnly={isHusbandAutofilled || isWifeAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-sm font-bold outline-none transition-all",
                      (isHusbandAutofilled || isWifeAutofilled) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-blue-500"
                    )}
                  />
                  {apiErrors.barangay && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">
                      {apiErrors.barangay[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 tracking-wider ml-1">
                    City/Municipality
                  </label>
                  <input
                    type="text"
                    name="city_municipality"
                    value={formData.city_municipality}
                    onChange={handleInputChange}
                    readOnly={isHusbandAutofilled || isWifeAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-sm font-bold outline-none transition-all",
                      (isHusbandAutofilled || isWifeAutofilled) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-blue-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 tracking-wider ml-1">
                    Province
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    readOnly={isHusbandAutofilled || isWifeAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-sm font-bold outline-none transition-all",
                      (isHusbandAutofilled || isWifeAutofilled) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-blue-500"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Document */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#EF4444]">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#EF4444]">
                  Marriage Certificate
                </h3>
              </div>
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e.target.files)}
                  disabled={isReadOnly}
                  className={cn(
                    "absolute inset-0 w-full h-full opacity-0 z-10",
                    isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                  )}
                />
                <div
                  className={cn(
                    "w-full px-8 py-6 border-2 border-dashed rounded-3xl flex items-center justify-between transition-all",
                    formData.marriage_certificate_path
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-100 group-hover:border-amber-500 group-hover:bg-amber-50",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Upload
                      className={cn(
                        "w-6 h-6",
                        formData.marriage_certificate_path
                          ? "text-emerald-500"
                          : "text-slate-400",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-bold text-slate-500",
                      )}
                    >
                      {formData.marriage_certificate_path instanceof File
                        ? formData.marriage_certificate_path.name
                        : formData.marriage_certificate_path
                          ? "Document Uploaded"
                          : "Upload Marriage Certificate"}
                    </span>
                  </div>
                  {formData.marriage_certificate_path && (
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                        Uploaded
                      </span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isReadOnly ? (
              <button
                type="button"
                onClick={() => onClose ? onClose() : navigate(-1)}
                className="w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 bg-[#0F172A] text-white hover:bg-slate-800"
              >
                Close View
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3",
                  isLoading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-[#EF4444]",
                )}
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLoading ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </form>
        </div>
      </div>

      <AnimatePresence>
        {showProgramDetails && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      Golden Wedding Anniversary
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Incentive Program Details
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProgramDetails(false)}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6 text-slate-600 leading-relaxed text-sm text-left">
                <section className="space-y-2">
                  <p className="font-medium text-slate-700">
                    The City Government of San Juan, through City Ordinance No. 39, Series of 2022, provides a financial incentive to qualified married couples celebrating their 50th Wedding Anniversary in recognition of their enduring commitment to marriage and family values.
                  </p>
                </section>

                <section className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Benefit Amount</span>
                  </div>
                  <p className="text-amber-900/80 font-medium">
                    Qualified couples are entitled to receive a Golden Wedding Anniversary Incentive of <strong className="text-amber-900 font-extrabold text-lg">Fifty Thousand Pesos (₱50,000.00)</strong>, subject to the availability of city funds.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-[#EF4444] flex items-center gap-2">
                    <Check className="w-4 h-4" /> Eligibility Requirements
                  </h4>
                  <p className="font-semibold text-slate-800">To qualify for the incentive, applicants must:</p>
                  <ul className="space-y-3 pl-1">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Be legally married and celebrating their 50th Wedding Anniversary</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Be permanent residents of the City of San Juan for at least ten (10) years</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>If residing temporarily outside the city for employment or work-related reasons, at least one (1) spouse must have maintained residency in San Juan City for at least three (3) years immediately preceding the anniversary celebration</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3 border-t border-slate-100 pt-5">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs text-blue-600 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Important Information
                  </h4>
                  <ul className="space-y-2 list-disc pl-5 text-slate-500">
                    <li>Applications are subject to verification and approval by the appropriate city offices.</li>
                    <li>The incentive is granted in accordance with the provisions of City Ordinance No. 39, Series of 2022.</li>
                    <li>Release of funds is subject to the availability of appropriated funds and compliance with applicable government rules and regulations.</li>
                  </ul>
                </section>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-xs text-slate-500 text-center">
                  For assistance and application details, please contact the <strong className="text-slate-800">Office of the Senior Citizens Affairs (OSCA)</strong>.
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowProgramDetails(false)}
                  className="px-6 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#EF4444] transition-all cursor-pointer shadow-md"
                >
                  Got it, Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ApplicationForm({
  annualCashGiftApplications,
  setAnnualCashGiftApplications,
  socialPensionApplications,
  setSocialPensionApplications,
}: {
  annualCashGiftApplications: any[];
  setAnnualCashGiftApplications: React.Dispatch<React.SetStateAction<any[]>>;
  socialPensionApplications: any[];
  setSocialPensionApplications: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const { benefit } = useParams();
  const navigate = useNavigate();

  if (benefit === "annual-cash-gift") {
    return (
      <AnnualCashGiftForm
        annualCashGiftApplications={annualCashGiftApplications}
        setAnnualCashGiftApplications={setAnnualCashGiftApplications}
      />
    );
  }

  if (benefit === "social-pension") {
    return (
      <SocialPensionForm
        socialPensionApplications={socialPensionApplications}
        setSocialPensionApplications={setSocialPensionApplications}
      />
    );
  }

  if (benefit === "50th-wedding-anniversary-incentive") {
    return <WeddingAnniversaryForm />;
  }

  if (benefit === "birthday-cash-incentives" || benefit === "birthday-cash-incentives-lgu") {
    return <BirthdayIncentiveForm />;
  }

  if (benefit === "expanded-centenarians-act-benefit-program-national" || benefit === "expanded-centenarians-act-benefit-program") {
    return <ExpandedCentenarianForm />;
  }

  return (
    <div className="max-w-6xl mx-auto py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-4">
        Benefit Program Not Found
      </h1>
      <Link
        to="/portal/apply"
        className="text-[#EF4444] font-bold uppercase tracking-widest text-[10px] hover:underline"
      >
        Back to Benefit Selection
      </Link>
    </div>
  );
}

export function SocialPensionForm({
  socialPensionApplications,
  setSocialPensionApplications,
  mode = "citizen",
  data,
  isReadOnly = false,
  onClose,
}: {
  socialPensionApplications?: any[];
  setSocialPensionApplications?: React.Dispatch<React.SetStateAction<any[]>>;
  mode?: "citizen" | "admin";
  data?: any;
  isReadOnly?: boolean;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});

  // Get user data from localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    citizen_id: data?.citizen_id || data?.id || user?.citizen_id || user?.id || "",
    scid_number: data?.scid_number || user?.scid_number || "",
    first_name: data?.first_name || user?.first_name || "",
    middle_name: data?.middle_name || user?.middle_name || "",
    last_name: data?.last_name || user?.last_name || "",
    suffix: data?.suffix || user?.suffix || "",
    birth_date: data?.birth_date || user?.birth_date || "",
    age: data?.age?.toString() || user?.age?.toString() || "",
    sex: data?.sex || user?.sex || "",
    civil_status: data?.civil_status || user?.civil_status || "",
    contact_number: data?.contact_number || user?.contact_number || "",
    address: data?.address || user?.address || "",
    barangay: data?.barangay || user?.barangay || "",
    city_municipality: data?.city_municipality || user?.city_municipality || "",
    province: data?.province || user?.province || "",
    citizenship: data?.citizenship || user?.citizenship || "",
    birth_place: data?.birth_place || user?.birth_place || "",
    district: data?.district || user?.district || "",
    email: data?.email || user?.email || "",
    living_arrangement: data?.living_arrangement || user?.living_arrangement || "",
    reg_status: "pending",
  });

  // Sync data prop to formData
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
        scid_number: data.scid_number || prev.scid_number || "",
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        last_name: data.last_name || "",
        birth_date: formattedDate,
        age: data.age?.toString() || "",
        contact_number: data.contact_number || "",
        barangay: data.barangay || "",
        city_municipality: data.city_municipality || data.city || "",
        province: data.province || "",
      }));
    }
  }, [data]);

  const requirementsStatus = {
    personal_info: !!formData.first_name && !!formData.last_name,
    contact_info: !!formData.contact_number,
    location_info: !!formData.barangay,
  };

  // Auto-fetch from masterlist
  const fetchMasterlistData = async (searchIdOverride?: string) => {
    const searchId = searchIdOverride || (mode === "admin" ? (formData.citizen_id || formData.scid_number) : (user?.citizen_id || user?.scid_number || user?.id));
    if (!searchId) return;

    try {
      const response = await fetch(
        `${API_URL}/masterlist?search=${searchId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
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

        const calculatedAgeVal = calculateAge(formattedDate);

        setIsAutofilled(true);
        setFormData((prev) => ({
          ...prev,
          citizen_id: record.citizen_id || record.id || prev.citizen_id,
          scid_number: record.scid_number || prev.scid_number || "",
          first_name: record.first_name || prev.first_name,
          middle_name: record.middle_name || prev.middle_name,
          last_name: record.last_name || prev.last_name,
          birth_date: formattedDate || prev.birth_date,
          age: record.age?.toString() || calculatedAgeVal || prev.age,
          contact_number: record.contact_number || record.contact_no || prev.contact_number,
          barangay: record.barangay || prev.barangay,
          city_municipality: record.city_municipality || record.city || prev.city_municipality,
          province: record.province || prev.province,
          // Fetch additional fields if they exist in masterlist
          suffix: record.suffix || prev.suffix || "",
          sex: record.sex || prev.sex || "",
          civil_status: record.civil_status || prev.civil_status || "",
          address: record.address || prev.address || "",
          email: record.email || prev.email || "",
          district: record.district || prev.district || "",
          citizenship: record.citizenship || prev.citizenship || "",
          birth_place: record.birth_place || prev.birth_place || "",
          living_arrangement: record.living_arrangement || prev.living_arrangement || "",
        }));
      } else if (mode === "admin" && searchIdOverride) {
        alert("No record found in masterlist.");
      }
    } catch (error) {
      console.error("Error fetching masterlist:", error);
    }
  };

  useEffect(() => {
    if (data || isReadOnly || mode === "admin") return;
    fetchMasterlistData();
  }, [user?.citizen_id, user?.scid_number, user?.id, token, mode]);

  // Auto-calculate age
  useEffect(() => {
    if (formData.birth_date) {
      const newAge = calculateAge(formData.birth_date);
      if (newAge && newAge !== formData.age) {
        setFormData((prev) => ({ ...prev, age: newAge }));
      }
    }
  }, [formData.birth_date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors({});

    // Pre-submission validation
    const requiredFields = [
      { name: "first_name", label: "First Name" },
      { name: "last_name", label: "Last Name" },
      { name: "birth_date", label: "Birthdate" },
      { name: "contact_number", label: "Contact Number" },
    ];

    const missingFields = requiredFields.filter(
      (f) => !formData[f.name as keyof typeof formData],
    );
    
    if (missingFields.length > 0) {
      alert(
        `Please fill in the following required fields: ${missingFields.map((f) => f.label).join(", ")}.`,
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        citizen_id: formData.citizen_id,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        suffix: formData.suffix,
        birth_date: formData.birth_date,
        age: Number(formData.age) || 0,
        sex: formData.sex,
        civil_status: formData.civil_status,
        contact_number: formData.contact_number,
        address: formData.address,
        barangay: formData.barangay,
        city_municipality: formData.city_municipality,
        province: formData.province,
        citizenship: formData.citizenship,
        birth_place: formData.birth_place,
        district: formData.district,
        email: formData.email,
        living_arrangement: formData.living_arrangement,
        scid_number: formData.scid_number,
        reg_status: formData.reg_status
      };

      const response = await fetch(
        `${API_URL}/social-pension`,
        {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        if (setSocialPensionApplications) {
          setSocialPensionApplications((prev) => [data.data || formData, ...prev]);
        }
        setTimeout(() => {
          if (mode === "admin") {
            navigate("/benefits/social-pension");
          } else {
            navigate("/portal");
          }
        }, 3000);
      } else if (response.status === 422) {
        setApiErrors(data.errors || {});
        const errorMsgs = Object.values(data.errors || {})
          .flat()
          .join("\n");
        alert("Validation Errors:\n" + errorMsgs);
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred during submission.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[2rem] shadow-xl p-12 text-center space-y-6 border border-slate-100">
        <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-[#EF4444] tracking-tight">
          Success!
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          {mode === "admin" 
            ? "Application successfully created. Redirecting back to management..." 
            : "Application submitted successfully. Redirecting you back to the portal..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex justify-between items-start mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-4xl font-bold text-[#EF4444] tracking-tight">
            {mode === "admin" ? "New Entry: Social Pension (DSWD)" : "Social Pension (DSWD)"}
          </h1>
          {mode === "admin" && (
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Walk-in Application</p>
          )}
        </div>
        {onClose || isReadOnly ? (
          <button
            onClick={() => onClose ? onClose() : navigate(-1)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <Link
            to={mode === "admin" ? "/benefits/social-pension" : "/portal/apply"}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Program Overview */}
      <section className="bg-blue-50 border border-blue-100 rounded-2xl md:rounded-[2rem] p-6 md:p-8 flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start mx-4 sm:mx-0 mb-8 text-center sm:text-left">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
          <Info className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-blue-600">
            Program Overview
          </h3>
          <p className="text-[13px] md:text-sm font-bold text-blue-900/80 leading-relaxed max-w-2xl">
            This program is funded and approved by the Department of Social
            Welfare and Development (DSWD) to provide additional financial
            assistance to indigent senior citizens.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
        {/* Left Column: Eligibility info */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white border border-slate-100 rounded-2xl md:rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 space-y-6 md:space-y-8">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <CheckCircle className="w-4 h-4" />
              </div>
              <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-blue-600">
                Eligibility
              </h3>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {[
                {
                  label: "Resident of San Juan",
                  status: true,
                },
              ].map((req, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-emerald-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold leading-tight text-slate-600">
                      {req.label}
                    </span>
                    <p className="text-xs font-bold uppercase tracking-wider mt-0.5 text-emerald-500">
                      Required
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 md:p-8 lg:p-12 border border-slate-100 space-y-10 md:space-y-12"
          >
            {/* Personal Information */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#EF4444]">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#EF4444]">
                  Personal Information
                </h3>
              </div>

              {/* Auto-Fetch Helper for Admin */}
              {mode === "admin" && !isReadOnly && (
                <div className="p-5 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 w-full space-y-2">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                      Search by SCID Number
                    </label>
                    <input 
                      type="text"
                      placeholder="Enter ID to auto-populate..."
                      value={formData.citizen_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, citizen_id: e.target.value }))}
                      className="w-full px-5 md:px-6 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-base font-bold text-[#0F172A] outline-none focus:border-[#EF4444]"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => fetchMasterlistData(formData.citizen_id)}
                    className="w-full md:w-auto px-8 py-3 md:py-4 bg-[#0F172A] text-white rounded-xl md:rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Fetch Data
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    SCID Number
                  </label>
                  <input
                    type="text"
                    name="scid_number"
                    value={formData.scid_number}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all font-mono",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.first_name && (
                    <p className="text-sm text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.first_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.last_name && (
                    <p className="text-sm text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.last_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.birth_date && (
                    <p className="text-sm text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.birth_date[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.age && (
                    <p className="text-sm text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.age[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#EF4444]">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#EF4444]">
                  Contact
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.contact_number && (
                    <p className="text-sm text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.contact_number[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#EF4444]">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#EF4444]">
                  Location
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                  {apiErrors.barangay && (
                    <p className="text-sm text-red-500 font-bold ml-1 uppercase">
                      {apiErrors.barangay[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    City/Municipality
                  </label>
                  <input
                    type="text"
                    name="city_municipality"
                    value={formData.city_municipality}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 tracking-wider ml-1">
                    Province
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    readOnly={isAutofilled || isReadOnly}
                    className={cn(
                      "w-full px-6 py-4 border border-slate-200 rounded-2xl text-base font-bold outline-none transition-all",
                      (isAutofilled || isReadOnly) ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-700 focus:border-[#EF4444]/30"
                    )}
                  />
                </div>
              </div>
            </div>

            {isReadOnly ? (
              <button
                type="button"
                onClick={() => onClose ? onClose() : navigate(-1)}
                className="w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 bg-[#0F172A] text-white hover:bg-slate-800"
              >
                Close View
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-2",
                  isLoading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-[#EF4444]",
                )}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function FeedbackForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    category: "Feedback",
    description: "",
  });

  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (!token) return;
    try {
      const response = await fetch(
        `${API_URL}/feedback-concerns`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
      const result = await response.json();
      const remoteData = response.ok ? (result.data || []) : [];
      const localData = JSON.parse(localStorage.getItem('local_feedback_concerns') || '[]');
      
      const user_id = user?.id ?? user?.data?.id ?? "";
      const userLocal = localData.filter((item: any) => String(item.user_id) === String(user_id));
      
      const filteredLocal = userLocal.filter((localItem: any) => 
        !remoteData.some((remoteItem: any) => 
          remoteItem.id === localItem.id || 
          (remoteItem.message === localItem.message && remoteItem.category?.toLowerCase() === localItem.category?.toLowerCase())
        )
      );
      
      setHistory([...filteredLocal, ...remoteData]);
    } catch (err) {
      console.error("Error fetching history:", err);
      // Fallback to local storage on error
      const localData = JSON.parse(localStorage.getItem('local_feedback_concerns') || '[]');
      const user_id = user?.id ?? user?.data?.id ?? "";
      const userLocal = localData.filter((item: any) => String(item.user_id) === String(user_id));
      setHistory(userLocal);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const token = localStorage.getItem("token");

      if (!user || !token) {
        setError("Session expired. Please log in again.");
        return;
      }

      const formDataToSend = new FormData();

      let citizen_id = "";
      try {
        const mlResponse = await fetch("/api/masterlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mlResponse.ok) {
          const masterlist = await mlResponse.json();
          const match = masterlist.find((m: any) => m.user_id === user.id);
          if (match) {
            citizen_id = match.citizen_id;
          }
        }
      } catch (err) {
        console.error("Error fetching masterlist:", err);
      }

      if (!citizen_id) {
        citizen_id = user.citizen_id ?? user.data?.citizen_id ?? "";
      }

      const user_id = user.id ?? user.data?.id ?? "";
      const scid_number = user.scid_number || user.scid || "N/A";
      const uFirst = user.first_name || user.username || "Citizen";
      const uLast = user.last_name || "";

      formDataToSend.append("citizen_id", String(citizen_id));
      formDataToSend.append("user_id", String(user_id));
      formDataToSend.append("scid_number", String(scid_number));
      formDataToSend.append("first_name", String(uFirst));
      formDataToSend.append("last_name", String(uLast));
      formDataToSend.append("address", String(user.address || "N/A"));
      formDataToSend.append("contact_number", String(user.contact_number || "0000000000"));
      formDataToSend.append("email", user.email || "default@email.com");
      formDataToSend.append("category", formData.category.toLowerCase());
      formDataToSend.append("subject", `${formData.category} Submission`);
      formDataToSend.append("message", formData.description);

      // Save a local storage copy for instant notification & sync inside preview
      const localNewFeedback = {
        id: Date.now(),
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        user_id: String(user_id),
        sender_name: `${uFirst} ${uLast}`.trim(),
        first_name: uFirst,
        last_name: uLast,
        scid_number: scid_number,
        message: formData.description,
        category: formData.category,
        status: 'pending',
        email: user.email || 'default@email.com',
        contact_number: user.contact_number || '0000000000',
        barangay: user.barangay || 'N/A',
        contact: {
          address: user.address || 'N/A',
          barangay: user.barangay || 'N/A',
          contact_number: user.contact_number || '0000000000',
          email: user.email || 'default@email.com',
        }
      };

      const existingLocal = JSON.parse(localStorage.getItem('local_feedback_concerns') || '[]');
      localStorage.setItem('local_feedback_concerns', JSON.stringify([localNewFeedback, ...existingLocal]));

      const response = await fetch(
        `${API_URL}/feedback-concerns`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formDataToSend,
        },
      );

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setFormData((prev) => ({ ...prev, description: "" }));
        fetchHistory();
        setTimeout(() => {
          setIsSubmitted(false);
        }, 3000);
      } else {
        setError(
          data.message || "Failed to submit feedback. Saving locally. Please check admin.",
        );
        fetchHistory();
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-4xl font-bold text-[#EF4444] tracking-tight">
            Citizen Concerns
          </h1>
        </div>
        <Link
          to="/portal"
          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0">
        {isSubmitted ? (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] shadow-xl p-12 text-center space-y-6 border border-slate-100 animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold text-[#EF4444] tracking-tight">
                Success!
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Thank you for your submission. We have received your concern.
              </p>
              <p className="text-xs text-slate-400 font-medium italic">
                Redirecting you back to the portal...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* New Submission Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    New Submission
                  </h3>
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="px-3 md:px-4 py-1.5 md:py-2 bg-white text-[#EF4444] rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider outline-none cursor-pointer"
                    >
                      <option value="Feedback">Feedback</option>
                      <option value="Concern">Concern</option>
                    </select>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 md:space-y-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Detailed Description
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Please provide specific details to help our administrators process your request faster."
                      className="w-full px-5 md:px-6 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-base font-medium focus:ring-4 focus:ring-red-500/10 focus:border-[#EF4444] outline-none transition-all resize-none placeholder:text-slate-300"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-[10px] md:text-xs uppercase tracking-tight">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 md:py-5 bg-[#EF4444] text-white rounded-xl md:rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Submitting..." : "Submit Concern"}
                  </button>
                </form>
              </div>
            </div>

            {/* Concern History Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Ticket className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                  Concern History
                </h3>
              </div>

              <div className="space-y-4">
                {[...history].reverse().map((concern) => (
                  <div
                    key={concern.id}
                    className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-rose-50 text-xs font-bold text-[#EF4444] rounded-full uppercase tracking-widest border border-rose-100">
                          {concern.category}
                        </span>
                        <span className="text-xs font-bold text-slate-300 tracking-wider">
                          #{concern.id}
                        </span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        concern.status === 'Resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        concern.status === 'Closed' ? "bg-slate-100 text-slate-500 border-slate-200" :
                        "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        <Clock className="w-3 h-3" />
                        <span>{concern.status || "Pending"}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-base text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        {concern.message}
                      </p>
                      
                      {(concern.response || concern.response_message || concern.admin_response?.response_message || concern.admin_response?.response) && (
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Response from OSCA</span>
                          </div>
                          <p className="text-sm text-emerald-900 font-semibold leading-relaxed">
                            {concern.admin_response?.response_message || concern.admin_response?.response || concern.response || concern.response_message}
                          </p>
                          {(concern.assigned_to || concern.admin_response?.assigned_to) && (
                            <div className="pt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-t border-emerald-100">
                              <span className="text-emerald-600/50">Responded by:</span>
                              <span className="text-emerald-700 bg-white px-2 py-0.5 rounded shadow-sm">{concern.admin_response?.assigned_to || concern.assigned_to}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        {new Date(concern.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Info Note */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 flex gap-4 items-start shadow-sm shadow-slate-100">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Complaints are monitored by the PWD Affairs Grievance
                    Committee. Standard response time is 3-5 working days. For
                    urgent medical emergencies, please use the hotline numbers
                    provided on the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [masterRecord, setMasterRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(
    "https://res.cloudinary.com/dx20khqe5/image/upload/v1777023994/Group-260-e1773292822209_ismech.png",
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!storedUser) {
        setLoading(false);
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const userObj = parsedUser?.data || parsedUser;
      if (userObj?.photo_url) {
        setProfileImage(userObj.photo_url);
      } else if (userObj?.files?.photo_url) {
        setProfileImage(userObj.files.photo_url);
      }

      let matchedCitizen = null;
      // 1. Try to fetch from masterlist by userObj.citizen_id first
      if (userObj.citizen_id) {
        try {
          const mlRes = await fetch(`${API_URL}/masterlist?search=${userObj.citizen_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (mlRes.ok) {
            const mlData = await mlRes.json();
            const masters = mlData.data?.data || mlData.data || mlData || [];
            matchedCitizen = masters.find(
              (m: any) => String(m.citizen_id) === String(userObj.citizen_id)
            );
          }
        } catch (e) {
          console.error("Error fetching masterlist by citizen_id in Profile", e);
        }
      }

      // 2. If not found by citizen_id, fetch all masterlist records and find by user_id
      if (!matchedCitizen && userObj.id) {
        try {
          const mlRes = await fetch(`${API_URL}/masterlist?per_page=5000`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (mlRes.ok) {
            const mlData = await mlRes.json();
            const masters = mlData.data?.data || mlData.data || mlData || [];
            matchedCitizen = masters.find(
              (m: any) => m.user_id === userObj.id || String(m.user_id) === String(userObj.id)
            );
          }
        } catch (e) {
          console.error("Error fetching all masterlist in Profile", e);
        }
      }

      if (matchedCitizen) {
        setMasterRecord(matchedCitizen);
      }
      setLoading(false);
    };

    fetchProfileData();
  }, []);

  if (loading) return null;

  const userObj = user?.data || user;

  // Resolve fields preferring masterRecord (masterlist data)
  const activeRecord = masterRecord || userObj;

  const firstName = activeRecord?.first_name || "";
  const middleName = activeRecord?.middle_name || "";
  const lastName = activeRecord?.last_name || "";
  const suffix = activeRecord?.suffix || "";

  const fullNameParts = [firstName, middleName, lastName, suffix].filter(Boolean);
  const fullName = fullNameParts.length > 0
    ? fullNameParts.join(" ").toUpperCase()
    : (activeRecord?.name || activeRecord?.username || "Juan Dela Cruz").toUpperCase();

  const rawBirthDate = activeRecord?.birth_date || "1995-03-15";
  const formatBirthDate = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };
  const birthDate = formatBirthDate(rawBirthDate);

  const address = activeRecord?.address ||
    [activeRecord?.barangay, activeRecord?.city_municipality, activeRecord?.province]
      .filter(Boolean)
      .join(", ") ||
    "155 F. Blumentritt, San Juan";

  const civilStatus = activeRecord?.civil_status || "Married";
  const mobileNumber = activeRecord?.contact_number || activeRecord?.phone || "0917 000 0000";
  const emailIdentity = activeRecord?.email || "juan@email.com";

  const memberSince = activeRecord?.created_at
    ? new Date(activeRecord.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "January 15, 2024";

  const controlNo = activeRecord?.citizen_id || activeRecord?.id || "000-000-00-00";

  const profilePic =
    "https://res.cloudinary.com/dx20khqe5/image/upload/v1777023994/Group-260-e1773292822209_ismech.png";

  // Profile Picture Handler

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleProfilePicChange}
      />

      {/* Page Header */}
      <div className="flex justify-between items-start mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold text-[#EF4444] tracking-tight">
            Citizen Profile
          </h1>
        </div>
        <Link
          to="/portal"
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#EF4444] transition-all shadow-xl"
        >
          Back to Portal
        </Link>
      </div>

      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Header Card */}
          <div className="lg:col-span-3 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div
              className="h-40 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://res.cloudinary.com/dx20khqe5/image/upload/v1777087275/Group_272_iokmeq.png')",
              }}
            />
            <div className="px-5 sm:px-10 pb-6 md:pb-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 -mt-10 md:-mt-10 text-center md:text-left">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl md:rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 relative">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1 pb-2 md:pb-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#EF4444] mb-2 md:mb-3">
                  {fullName}
                </h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                  <div className="flex items-center gap-2 px-4 md:px-5 py-1.5 md:py-2 bg-emerald-50 border border-emerald-100 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-emerald-600 tracking-wider">
                    Active Account
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Personal Records */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-10 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-10 pb-4 border-b border-slate-50">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-[#EF4444]">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold tracking-widest text-[#EF4444]">
                  Personal Records
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-500 tracking-wider">
                    Full Legal Name
                  </label>
                  <p className="text-lg font-bold text-slate-900 break-words">{fullName}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-500 tracking-wider">
                    Birth Date
                  </label>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-lg font-bold text-slate-900">
                    <Calendar className="w-5 h-5 text-slate-300 shrink-0" />
                    <span>{birthDate}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-500 tracking-wider">
                    Home Address
                  </label>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-lg font-bold text-slate-900">
                    <MapPin className="w-5 h-5 text-slate-300 shrink-0" />
                    <span className="break-words text-left">{address}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-500 tracking-wider">
                    Civil Status
                  </label>
                  <p className="text-lg font-bold text-slate-900 break-words">
                    {civilStatus}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-500 tracking-wider">
                    Mobile Number
                  </label>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-lg font-bold text-slate-900">
                    <Phone className="w-5 h-5 text-slate-300 shrink-0" />
                    <span>{mobileNumber}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-500 tracking-wider">
                    Email Identity
                  </label>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-base sm:text-lg font-bold text-slate-900 w-full min-w-0">
                    <Mail className="w-5 h-5 text-slate-300 shrink-0" />
                    <span className="break-all text-left">{emailIdentity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Registry Information */}
            <div className="bg-[#EF4444] rounded-[2rem] shadow-xl shadow-red-200/50 border border-red-500/10 p-10 text-white text-center sm:text-left">
              <h3 className="text-xs font-semibold tracking-widest mb-12 opacity-80">
                Registry Information
              </h3>

              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold tracking-wider opacity-70">
                    Control No.
                  </p>
                  <p className="text-xl font-bold tracking-tight">{controlNo}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-bold tracking-wider opacity-70">
                    Member Since
                  </p>
                  <p className="text-xl font-bold tracking-tight">
                    {memberSince}
                  </p>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/20">
                <p className="text-[11px] font-medium leading-relaxed opacity-70 italic">
                  This profile is synced with the Local Civil Registry (LCR) of
                  San Juan City
                </p>
              </div>
            </div>

          {/* Data Privacy Notice */}
          <div className="bg-blue-50/50 rounded-[2rem] border border-blue-100 p-8 flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-blue-600 tracking-wider">
                Data Privacy Notice
              </h4>
              <p className="text-[11px] font-medium leading-relaxed text-blue-900/80">
                Your personal information is protected under the Data Privacy
                Act of 2012. Only authorized OSCA personnel can access full
                record details for benefit verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

function ApplicationIdForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const requestType = (searchParams.get("type") || "New ID") as
    | "New ID"
    | "Renewal"
    | "Replacement";

  const [citizenRecord, setCitizenRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCitizen = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const token = localStorage.getItem("token");

        if (!user || !token) {
          navigate("/");
          return;
        }

        const mlRes = await fetch(
          `${API_URL}/masterlist?search=${user.citizen_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!mlRes.ok) throw new Error("Failed to fetch citizen record.");
        const mlData = await mlRes.json();
        const masters = mlData.data?.data || mlData.data || mlData || [];
        const match = masters.find(
          (m: any) => String(m.citizen_id) === String(user.citizen_id),
        );

        if (!match) throw new Error("Citizen record not found.");
        setCitizenRecord(match);
      } catch (err) {
        console.error(err);
        setError("Could not load your record. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCitizen();
  }, []);

  if (isLoading)
    return (
      <div className="max-w-6xl mx-auto py-20 text-center">
        <Loader2 className="w-12 h-12 text-[#EF4444] animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Loading Application Form...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="max-w-6xl mx-auto py-20 text-center">
        <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
        <p className="text-slate-600 font-bold mb-4">{error}</p>
        <button
          onClick={() => navigate("/portal")}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl"
        >
          Back to Portal
        </button>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex justify-between items-start mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-4xl font-bold text-[#EF4444] tracking-tight">
            ID Application
          </h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">
            {requestType}
          </p>
        </div>
        <button
          onClick={() => navigate("/portal")}
          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <WalkInIdIssuanceModal
        isOpen={true}
        onClose={() => navigate("/portal")}
        citizen={citizenRecord}
        initialTab={requestType}
        modality="Online"
        onSuccess={() => {
          navigate("/portal/id-services");
        }}
      />
    </div>
  );
}

function IdServiceFlow() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [issuance, setIssuance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const token = localStorage.getItem("token");

        if (!user || !token) {
          setError("Session not found.");
          setLoading(false);
          return;
        }

        const idRes = await fetch(
          `${API_URL}/id-issuances?search=${user.citizen_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!idRes.ok) throw new Error("Failed to fetch ID issuance records.");

        const idData = await idRes.json();
        const issuances = idData.data?.data || idData.data || idData || [];
        const userIssuances = issuances.filter(
          (i: any) => String(i.citizen_id) === String(user.citizen_id),
        );

        // Match condition: item.citizen_id === currentUser.citizen_id
        if (userIssuances.length === 0) {
          // NO RECORD FOUND -> Redirect to application form (New ID)
          navigate("/portal/application-id-form?type=New ID");
          return;
        }

        // Get the latest application
        const latestRecord = userIssuances.sort((a: any, b: any) => {
          return (
            new Date(b.request_details?.application_date || 0).getTime() -
            new Date(a.request_details?.application_date || 0).getTime()
          );
        })[0];
        setIssuance(latestRecord);
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading ID services.");
      } finally {
        setLoading(false);
      }
    };

    fetchIdData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center">
        <Loader2 className="w-12 h-12 text-[#EF4444] animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Fetching ID Information
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center">
        <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
        <p className="text-slate-600 font-bold">{error}</p>
        <button
          onClick={() => navigate("/portal")}
          className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl"
        >
          Back to Portal
        </button>
      </div>
    );
  }

  if (!issuance) return null;

  const status =
    issuance.status?.issuance_status || issuance.id_status || "pending";
  const today = new Date();
  const expirationStr = issuance.dates?.expiration;
  const expirationDate = expirationStr ? new Date(expirationStr) : null;

  let allowRenewal = false;
  if (expirationDate) {
    const threeMonthsBefore = new Date(expirationDate);
    threeMonthsBefore.setMonth(threeMonthsBefore.getMonth() - 3);
    allowRenewal = today >= threeMonthsBefore;
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex justify-between items-start mb-6 px-4 sm:px-0">
        <div>
          <h1 className="text-4xl font-bold text-[#EF4444] tracking-tight">
            ID Card Services
          </h1>
        </div>
        <Link
          to="/portal"
          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-[#EF4444] shadow-sm border border-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex flex-col items-center px-4 sm:px-0">
        {/* Status & Actions */}
        <div className="w-full max-w-[500px] space-y-6">
          {/* Validity Status Card */}
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50">
            <div className="flex items-center gap-3 text-slate-400 mb-6 md:mb-10 font-black text-xs md:text-sm uppercase tracking-[0.25em]">
              <IdCard className="w-4 h-4" />
              ID VALIDITY STATUS
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-end pb-4 border-b border-slate-50">
                <span className="text-slate-400 font-bold text-base uppercase tracking-widest">Expiration Date</span>
                <span className={cn(
                  "text-3xl font-bold tracking-tight",
                  expirationDate && expirationDate < today ? "text-rose-500" : "text-slate-800"
                )}>
                  {expirationStr ? new Date(expirationStr).toLocaleDateString('en-CA') : '---'}
                </span>
              </div>

              {/* Status Badge Area */}
              <div className={cn(
                "rounded-2xl p-6 flex items-start gap-4 transition-all duration-500",
                status === "released" || status === "approved" 
                  ? "bg-emerald-50/50 border border-emerald-100" 
                  : status === "pending"
                    ? "bg-amber-50/50 border border-amber-100"
                    : "bg-slate-50/50 border border-slate-100"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  status === "released" || status === "approved" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {status === "released" || status === "approved" ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <h4 className={cn(
                    "text-xl font-black uppercase tracking-widest leading-none",
                    status === "released" || status === "approved" ? "text-emerald-900" : "text-amber-900"
                  )}>
                    {status === "released" ? "VALID CREDENTIAL" : status === "approved" ? "APPROVED FOR ISSUANCE" : "PENDING REVIEW"}
                  </h4>
                  <p className="text-base font-medium text-slate-500 leading-relaxed">
                    {status === "released" 
                      ? "Your OSCA ID is active and recognized for mandatory discounts." 
                      : status === "approved"
                        ? "Your application was approved. Please visit the OSCA office to claim your physical ID."
                        : "Your application is currently being reviewed by the OSCA department."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/portal/application-id-form?type=Renewal")}
              disabled={status === 'pending' || !allowRenewal}
              className={cn(
                "w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95",
                status === 'released' && allowRenewal 
                  ? "bg-[#1e40af] text-white hover:bg-[#1e3a8a] shadow-blue-200" 
                  : "bg-slate-100 text-slate-300 shadow-none cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-5 h-5", allowRenewal && "animate-spin-slow")} />
              Renew OSCA ID
            </button>
            {status === 'released' && !allowRenewal && expirationDate && (
              <p className="text-center text-sm font-black text-rose-400 uppercase tracking-widest">
                  AVAILABLE 3 MONTHS BEFORE EXPIRATION
               </p>
            )}

            <button
              onClick={() => navigate("/portal/application-id-form?type=Replacement")}
              disabled={status === 'pending'}
              className={cn(
                "w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 border transition-all active:scale-95",
                status !== 'pending'
                  ? "bg-white text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-500 shadow-sm"
                  : "bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed shadow-none"
              )}
            >
              <AlertCircle className="w-5 h-5" />
              Lost or Damaged ID
            </button>
          </div>
        </div>
      </div>

      {/* Support Info */}
      <div className="mt-12 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[2rem] p-6 md:p-8 flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start mx-4 sm:mx-0 text-center sm:text-left">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-blue-200 shadow-sm">
          <Info className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm md:text-base font-black uppercase tracking-widest text-blue-600">
            Need Assistance?
          </h4>
          <p className="text-base font-bold text-blue-900/70 leading-relaxed">
            If you have any questions about your ID status or encountered
            issues with your application, please visit our office during
            office hours or call our hotline.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CitizenPortal({
  onLogout,
  annualCashGiftApplications,
  setAnnualCashGiftApplications,
  socialPensionApplications,
  setSocialPensionApplications,
}: {
  onLogout: () => void;
  annualCashGiftApplications: any[];
  setAnnualCashGiftApplications: React.Dispatch<React.SetStateAction<any[]>>;
  socialPensionApplications: any[];
  setSocialPensionApplications: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChanging, setIsChanging] = useState(false);
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);
  const [changeError, setChangeError] = useState("");

  const isHome =
    location.pathname === "/portal" || location.pathname === "/portal/";
  const userObj = user?.data || user;

  const getFullName = () => {
    if (!userObj) return "Juan Dela Cruz";

    const fName = userObj.first_name || userObj.firstName || "";
    const lName = userObj.last_name || userObj.lastName || "";

    if (fName && lName && fName.toLowerCase() !== "citizen") {
      return `${fName} ${lName}`;
    }

    if (userObj.name && userObj.name.toLowerCase() !== "citizen") {
      return userObj.name;
    }

    if (userObj.username && userObj.username.toLowerCase() !== "citizen") {
      return (
        userObj.username.charAt(0).toUpperCase() + userObj.username.slice(1)
      );
    }

    return "Juan Dela Cruz";
  };

  const fullName = getFullName();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!storedUser || !token) return;
      const user = JSON.parse(storedUser);
      const citizenId = user.citizen_id;

      const newNotifs: any[] = [];

      // 1. Welcome Message
      let welcomeDate = localStorage.getItem(`welcome_date_${user.id}`);
      if (!welcomeDate) {
        welcomeDate = new Date().toISOString();
        localStorage.setItem(`welcome_date_${user.id}`, welcomeDate);
      }
      
      newNotifs.push({
        id: 'welcome',
        title: 'Welcome to OSCA Portal!',
        message: 'You have successfully logged in. Explore your benefits and services here.',
        type: 'info',
        date: welcomeDate,
        isRead: false
      });

      try {
        // 2. ID Status and Renewal
        const idRes = await fetch(`${API_URL}/id-issuances?search=${citizenId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (idRes.ok) {
          const idData = await idRes.json();
          const issuances = idData.data?.data || idData.data || idData || [];
          const userIdRecord = issuances.sort((a: any, b: any) => 
            new Date(b.request_details?.application_date || 0).getTime() - 
            new Date(a.request_details?.application_date || 0).getTime()
          )[0];

          if (userIdRecord) {
            const status = userIdRecord.status?.issuance_status || userIdRecord.id_status;
            if (['approved', 'released', 'disapproved'].includes(status)) {
              newNotifs.push({
                id: `id_status_${userIdRecord.id}_${status}`,
                title: 'ID Status Update',
                message: `Your ID application status is now: ${status.toUpperCase()}`,
                type: status === 'disapproved' ? 'error' : 'success',
                date: userIdRecord.updated_at || new Date().toISOString(),
                isRead: false
              });
            }

            // Renewal Reminder
            const exp = userIdRecord.dates?.expiration;
            if (exp) {
              const expDate = new Date(exp);
              const threeMonthsBefore = new Date(expDate);
              threeMonthsBefore.setMonth(threeMonthsBefore.getMonth() - 3);
              if (new Date() >= threeMonthsBefore) {
                newNotifs.push({
                  id: `id_renewal_${userIdRecord.id}`,
                  title: 'ID Renewal Reminder',
                  message: `Your ID will expire on ${expDate.toLocaleDateString()}. You can now apply for renewal.`,
                  type: 'warning',
                  date: new Date().toISOString(),
                  isRead: false
                });
              }
            }
          }
        }

        // 3. Benefit Applications
        const benRes = await fetch(`${API_URL}/benefit-applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (benRes.ok) {
          const benData = await benRes.json();
          const apps = normalizeCashGiftResponse(benData);
          const userApps = apps.filter((a: any) => String(a.citizen_id) === String(citizenId));

          userApps.forEach((app: any) => {
            const status = app.reg_status?.toLowerCase();
            if (['approved', 'disapproved'].includes(status)) {
              newNotifs.push({
                id: `ben_status_${app.id}_${status}`,
                title: `${app.benefit_type?.replace(/-/g, ' ').toUpperCase() || 'Benefit'} Update`,
                message: `Your application for ${app.benefit_type || 'benefit'} has been ${status}.`,
                type: status === 'disapproved' ? 'error' : 'success',
                date: app.updated_at || new Date().toISOString(),
                isRead: false
              });
            }
          });
        }
      } catch (err) {
        console.error("Notif fetch error:", err);
      }

      // Filter duplicates and merge with existing read status
      const readNotifs = JSON.parse(localStorage.getItem(`read_notifs_${user.id}`) || '[]');
      const finalNotifs = newNotifs.map(n => ({
        ...n,
        isRead: readNotifs.includes(n.id)
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setNotifications(finalNotifs);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const user = JSON.parse(storedUser);
    const readIds = notifications.map(n => n.id);
    localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(readIds));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const user = JSON.parse(storedUser);
    const currentRead = JSON.parse(localStorage.getItem(`read_notifs_${user.id}`) || '[]');
    if (!currentRead.includes(id)) {
      const updatedRead = [...currentRead, id];
      localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(updatedRead));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      // Check if it's first login (has_changed = 0)
      if (u.has_changed === 0) {
        setShowChangePassword(true);
      }
    }
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChanging(true);
    setChangeError("");

    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setChangeError("New passwords do not match");
      setIsChanging(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setChangeError("Password must be at least 8 characters long");
      setIsChanging(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(passwordData),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Update user in localStorage to mark first login as complete
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.has_changed = 1;
          localStorage.setItem("user", JSON.stringify(userObj));
          // Update local state to reflect change immediately
          setUser(userObj);
        }
        setIsPasswordSuccess(true);
        setTimeout(() => {
          setShowChangePassword(false);
          setIsPasswordSuccess(false);
          setPasswordData({
            current_password: "",
            new_password: "",
            new_password_confirmation: "",
          });
        }, 2000);
      } else {
        setChangeError(data.message || "Failed to change password");
      }
    } catch (err) {
      setChangeError("An error occurred. Please try again.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div
      className={cn(
        "relative min-h-screen flex flex-col",
        isHome ? "bg-white" : "bg-slate-50",
      )}
    >
      {/* Red Header Bar */}
      <header className="sticky top-0 h-20 flex-shrink-0 bg-[#EF4444] px-4 md:px-6 flex items-center justify-center z-50 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-4xl w-full flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
            <img
              src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777960918/Group-74_hnbnr8.png"
              alt="San Juan Branding"
              className="h-8 md:h-10 lg:h-12 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex items-center gap-3 md:gap-4 lg:gap-8">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all relative border border-white/20 group"
              >
                <Bell className={cn("w-5 h-5 transition-transform", unreadCount > 0 && "animate-tada group-hover:scale-110")} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 text-slate-900 text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-[#EF4444] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotifOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                      className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                    >
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                          {unreadCount > 0 && (
                             <span className="px-2 py-0.5 bg-rose-100 text-rose-500 rounded-md text-[8px] font-black uppercase tracking-wider">
                               {unreadCount} NEW
                             </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-[30rem] overflow-y-auto no-scrollbar">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-slate-50">
                            {notifications.map((notif) => (
                              <div 
                                key={notif.id}
                                onClick={() => markAsRead(notif.id)}
                                className={cn(
                                  "py-3.5 px-5 hover:bg-slate-50 transition-all cursor-pointer flex gap-4 relative group",
                                  !notif.isRead && "bg-blue-50/30"
                                )}
                              >
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                                  notif.type === 'error' ? 'bg-rose-100 text-rose-500' :
                                  notif.type === 'success' ? 'bg-emerald-100 text-emerald-500' :
                                  notif.type === 'warning' ? 'bg-amber-100 text-amber-500' :
                                  'bg-blue-100 text-blue-500'
                                )}>
                                  {notif.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                                   notif.type === 'warning' ? <Clock className="w-5 h-5" /> :
                                   <Bell className="w-5 h-5" />}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className={cn("text-xs font-bold leading-tight", notif.isRead ? "text-slate-600" : "text-slate-950")}>
                                      {notif.title}
                                    </h4>
                                    <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap">
                                      {new Date(notif.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className={cn("text-[11px] leading-relaxed", notif.isRead ? "text-slate-400" : "text-slate-600 font-medium")}>
                                    {notif.message}
                                  </p>
                                </div>
                                {!notif.isRead && (
                                  <span className="absolute right-4 bottom-4 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 px-10 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-200">
                              <Bell className="w-8 h-8 opacity-20" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">All caught up!</p>
                              <p className="text-[11px] font-medium text-slate-400 mt-1">No new notifications at the moment.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <span className="hidden lg:block text-white font-normal text-base tracking-tight">
                {fullName}
              </span>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#3B82F6] flex items-center justify-center text-white border border-white/20 transition-all">
                <User className="w-4 h-4 md:w-5 md:h-5 fill-white" />
              </div>
            </div>
            <div className="h-6 w-px bg-white/30 hidden sm:block" />
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 md:gap-2.5 text-white hover:text-white/80 transition-all group"
            >
              <span className="hidden sm:block font-normal text-sm">Exit</span>
              <LogOut className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className={cn("flex-grow flex flex-col", !isHome && "p-4 lg:p-6")}>
        <Routes>
          <Route index element={<CitizenHome />} />
          <Route path="apply" element={<BenefitSelection />} />
          <Route
            path="apply/:benefit"
            element={
              <ApplicationForm
                annualCashGiftApplications={annualCashGiftApplications}
                setAnnualCashGiftApplications={setAnnualCashGiftApplications}
                socialPensionApplications={socialPensionApplications}
                setSocialPensionApplications={setSocialPensionApplications}
              />
            }
          />
          <Route path="id-services" element={<IdServiceFlow />} />
          <Route path="application-id-form" element={<ApplicationIdForm />} />
          <Route path="feedback" element={<FeedbackForm />} />
          <Route path="profile" element={<UserProfile />} />
        </Routes>
      </main>

      {/* Forced Password Change Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">
                  Security Update
                </h3>
                {isPasswordSuccess ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto shadow-sm">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase">Password Updated</h4>
                      <p className="text-slate-500 font-medium text-sm">Your security settings have been successfully updated.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-500 font-medium mb-8">
                      This is your first login. Please update your password to
                      continue.
                    </p>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        required
                        value={passwordData.current_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            current_password: e.target.value,
                          })
                        }
                        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-red-500 transition-all pr-14"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex justify-between">
                      <span>New Password</span>
                      <span className="text-red-400 normal-case font-medium">Minimum 8 characters</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        required
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password: e.target.value,
                          })
                        }
                        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-red-500 transition-all pr-14"
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        required
                        value={passwordData.new_password_confirmation}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password_confirmation: e.target.value,
                          })
                        }
                        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-red-500 transition-all pr-14"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {changeError && (
                    <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-3 rounded-xl">
                      {changeError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isChanging}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 mt-4"
                  >
                    {isChanging ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
