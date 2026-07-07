import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft,
  ChevronLeft,
  ArrowRight, 
  Upload, 
  CheckCircle2, 
  User, 
  Briefcase, 
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Heart,
  AlertCircle,
  ClipboardList,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { API_URL } from './lib/config';

import { Application } from './App';

export default function RegistrationForm({ 
  onComplete, 
  onBack,
  initialData,
  isLcrVerified = false,
  lcrName = "",
  registrationType = "Online"
}: { 
  onComplete: (newApp: Application) => void, 
  onBack: () => void,
  initialData?: Partial<any>,
  isLcrVerified?: boolean,
  lcrName?: string,
  registrationType?: "Online" | "Walk-in"
}) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  // Parse initial birth date if provided
  const getInitialBirthDate = () => {
    if (initialData?.birthDate) {
      const [year, month, day] = initialData.birthDate.split('-');
      return { year, month: parseInt(month).toString(), day: parseInt(day).toString() };
    }
    return { year: '', month: '', day: '' };
  };

  const [formData, setFormData] = useState({
    lastName: initialData?.lastName || '',
    firstName: initialData?.firstName || '',
    middleName: initialData?.middleName || '',
    extensionName: initialData?.suffix || '',
    birthDate: getInitialBirthDate(),
    age: initialData?.age || '',
    placeOfBirth: '',
    gender: '',
    civilStatus: '',
    citizenship: 'Filipino',
    address: '',
    province: 'Metro Manila',
    cityMunicipality: 'San Juan City',
    district: '',
    barangay: '',
    region: 'NCR',
    email: '',
    contactNumber: '',
    
    // Database schema fields
    bloodType: '',
    religion: '',
    educationalAttainment: '',
    employmentStatus: '',
    occupation: '',
    annualIncome: '',
    houseNumber: '',
    street: '',
    gsisNumber: '',
    sssNumber: '',
    tinNumber: '',
    philhealthNumber: '',
    healthCondition: '',
    disability: '',
    
    // Socio-economic
    livingArrangement: '',
    isPensioner: false,
    pensionGSIS: false,
    pensionSSS: false,
    pensionAFPSLAI: false,
    pensionOthers: '',
    pensionAmount: '',
    hasPermanentIncome: false,
    incomeSource: '',
    hasRegularSupport: false,
    supportCash: false,
    supportCashAmount: '',
    supportCashFrequency: '',
    supportInKind: false,
    supportDetails: '',
    hasIllness: false,
    illnessDetails: '',
    hospitalized: false,
    
    // Boolean fields
    isIndigent: false,
    isPwd: false,
    isSoloParent: false,
    isVeteran: false,
    isVoter: false,
    hasHealthInsurance: false,
    hasSupportFromFamily: false,
    attachments: [] as File[]
  });

  useEffect(() => {
    // Removed body overflow hidden as it breaks mobile scrolling
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const calculateAge = (birth_date: string) => {
    if (!birth_date) return '';
    const today = new Date();
    const birth = new Date(birth_date);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const clean = (val: any) => (val === "" || val === undefined ? null : val);

  const handleBirthDateChange = (type: 'year' | 'month' | 'day', value: string) => {
    const newBirthDate = { ...formData.birthDate, [type]: value };
    const birthDateStr = `${newBirthDate.year}-${newBirthDate.month.padStart(2, '0')}-${newBirthDate.day.padStart(2, '0')}`;
    const newAge = calculateAge(birthDateStr);
    setFormData({ ...formData, birthDate: newBirthDate, age: newAge });
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.lastName.trim()) newErrors.lastName = "Required";
      if (!formData.firstName.trim()) newErrors.firstName = "Required";
      if (!formData.birthDate.year || !formData.birthDate.month || !formData.birthDate.day) {
        newErrors.birthDate = "Required";
      }
      if (!formData.placeOfBirth.trim()) newErrors.placeOfBirth = "Required";
      if (!formData.gender) newErrors.gender = "Required";
      if (!formData.civilStatus) newErrors.civilStatus = "Required";
      if (!formData.address.trim()) newErrors.address = "Required";
      if (!formData.district) newErrors.district = "Required";
      if (!formData.barangay) newErrors.barangay = "Required";
      if (!formData.email.trim()) {
        newErrors.email = "Required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    } else if (currentStep === 2) {
      if (!formData.livingArrangement) newErrors.livingArrangement = "Required";
      if (formData.isPensioner && !formData.pensionAmount.trim()) {
        newErrors.pensionAmount = "Required";
      }
      if (formData.supportCash && !formData.supportCashAmount.trim()) {
        newErrors.supportCashAmount = "Required";
      }
    } else if (currentStep === 3) {
      if (formData.attachments.length === 0) newErrors.attachments = "Required";
      if (!formData.contactNumber.trim()) {
        newErrors.contactNumber = "Required";
      } else if (formData.contactNumber.length !== 11) {
        newErrors.contactNumber = "Must be 11 digits";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('.text-sm.font-normal.mt-1');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return false;
    }

    return true;
  };

  const buildPayload = (data: typeof formData) => {
    const birthDateStr = `${data.birthDate.year}-${data.birthDate.month.padStart(2, '0')}-${data.birthDate.day.padStart(2, '0')}`;
    const computedAge = Number(calculateAge(birthDateStr));
    
    const payload = new FormData();
    
    // Helper for strict null handling and type conversion
    const appendField = (key: string, value: any) => {
      if (!key || value === undefined || value === null || value === "") return;
      
      if (typeof value === 'boolean') {
        // User requested: "Boolean → 1 / 0"
        payload.append(key, value ? "1" : "0");
      } else {
        payload.append(key, String(value));
      }
    };

    // Basic Info
    appendField('first_name', data.firstName);
    appendField('middle_name', data.middleName);
    appendField('last_name', data.lastName);
    appendField('suffix', data.extensionName);
    appendField('birth_date', birthDateStr);
    appendField('age', computedAge);
    appendField('sex', data.gender);
    appendField('civil_status', data.civilStatus);
    appendField('citizenship', data.citizenship);
    appendField('birth_place', data.placeOfBirth);
    appendField('address', data.address);
    appendField('barangay', data.barangay);
    appendField('city_municipality', data.cityMunicipality);
    appendField('district', data.district);
    appendField('province', data.province);
    appendField('email', data.email);
    appendField('living_arrangement', data.livingArrangement);
    appendField('contact_number', data.contactNumber);
    
    // Pension Logic
    const isPensioner = !!data.isPensioner;
    appendField('is_pensioner', isPensioner);
    if (isPensioner) {
      appendField('pension_source_gsis', !!data.pensionGSIS);
      appendField('pension_source_sss', !!data.pensionSSS);
      appendField('pension_source_afpslai', !!data.pensionAFPSLAI);
      appendField('pension_source_others', data.pensionOthers);
      appendField('pension_amount', data.pensionAmount ? Number(data.pensionAmount).toFixed(2) : "0.00");
    } else {
      appendField('pension_source_gsis', false);
      appendField('pension_source_sss', false);
      appendField('pension_source_afpslai', false);
      appendField('pension_source_others', null);
      appendField('pension_amount', null);
    }

    // Permanent Income Logic
    const hasPermanentIncome = !!data.hasPermanentIncome;
    appendField('has_permanent_income', hasPermanentIncome);
    appendField('permanent_income_source', hasPermanentIncome ? data.incomeSource : null);

    // Regular Support Logic
    const hasRegularSupport = !!data.hasRegularSupport;
    appendField('has_regular_support', hasRegularSupport);
    if (hasRegularSupport) {
      appendField('support_type_cash', !!data.supportCash);
      appendField('support_type_inkind', !!data.supportInKind);
      appendField('support_cash_amount', data.supportCashAmount);
      appendField('support_cash_frequency', data.supportCashFrequency);
      appendField('kind_support_details', data.supportDetails);
    } else {
      appendField('support_type_cash', false);
      appendField('support_type_inkind', false);
      appendField('support_cash_amount', null);
      appendField('support_cash_frequency', null);
      appendField('kind_support_details', null);
    }

    // Illness Logic
    const hasIllness = !!data.hasIllness;
    appendField('has_illness', hasIllness);
    appendField('illness_details', hasIllness ? data.illnessDetails : null);
    appendField('hospitalized_last_6_months', !!data.hospitalized);
    
    // ENUM & CONSTANTS
    appendField('registration_type', registrationType);
    appendField('reg_status', 'pending');

    // ATTACHMENTS
    if (data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        payload.append("document[]", file);
        
        // Backward compatibility for specific fields
        if (index === 0) {
          payload.append("birth_certificate", file);
        } else if (index === 1) {
          payload.append("barangay_certificate", file);
        }
      });
    }

    return payload;
  };

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (formData.attachments.length === 0) {
      alert("Please upload at least one attachment (e.g., Birth Certificate, ID)");
      return;
    }

    if (!validateStep(3)) return;
    setIsSubmitting(true);
    setError(null);

    const payload = buildPayload(formData);

    try {
      const response = await fetch(`${API_URL}/applications`, {
        method: "POST",
        headers: {
          "Accept": "application/json"
        },
        body: payload
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
        return;
      }

      if (!response.ok) {
        let errorMessage = data?.message || `Failed to submit registration (Status: ${response.status})`;
        if (data?.errors) {
          const detailedErrors = Object.values(data.errors).flat().join(' ');
          errorMessage = `${errorMessage} ${detailedErrors}`;
        }
        throw new Error(errorMessage);
      }

      // Success
      alert('Registration submitted successfully');
      
      // Map formData to Application for fallback
      const fallbackApp: Application = {
        id: Date.now(),
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        suffix: formData.extensionName,
        birth_date: `${formData.birthDate.year}-${formData.birthDate.month.padStart(2, '0')}-${formData.birthDate.day.padStart(2, '0')}`,
        age: Number(formData.age),
        barangay: formData.barangay,
        registration_type: registrationType,
        reg_status: 'pending',
        document: []
      };
      
      // Call onComplete with the new application data
      onComplete(data.data || fallbackApp);
      
      // Reset form state
      setFormData({
        lastName: '',
        firstName: '',
        middleName: '',
        extensionName: '',
        birthDate: { year: '', month: '', day: '' },
        age: '',
        placeOfBirth: '',
        gender: '',
        civilStatus: '',
        citizenship: 'Filipino',
        address: '',
        province: 'Metro Manila',
        cityMunicipality: 'San Juan City',
        district: '',
        barangay: '',
        region: 'NCR',
        email: '',
        contactNumber: '',
        bloodType: '',
        religion: '',
        educationalAttainment: '',
        employmentStatus: '',
        occupation: '',
        annualIncome: '',
        houseNumber: '',
        street: '',
        gsisNumber: '',
        sssNumber: '',
        tinNumber: '',
        philhealthNumber: '',
        healthCondition: '',
        disability: '',
        livingArrangement: '',
        isPensioner: false,
        pensionGSIS: false,
        pensionSSS: false,
        pensionAFPSLAI: false,
        pensionOthers: '',
        pensionAmount: '',
        hasPermanentIncome: false,
        incomeSource: '',
        hasRegularSupport: false,
        supportCash: false,
        supportCashAmount: '',
        supportCashFrequency: '',
        supportInKind: false,
        supportDetails: '',
        hasIllness: false,
        illnessDetails: '',
        hospitalized: false,
        isIndigent: false,
        isPwd: false,
        isSoloParent: false,
        isVeteran: false,
        isVoter: false,
        hasHealthInsurance: false,
        hasSupportFromFamily: false,
        attachments: []
      });
      setStep(1);
      setErrors({});
      setError(null);
    } catch (err: any) {
      console.error("Submission Error:", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 3));
    }
  };

  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(s => Math.max(s - 1, 1));
  };

  const steps = [
    { id: 1, label: 'Profile', icon: User },
    { id: 2, label: 'Socio-economic & Health', icon: Briefcase },
    { id: 3, label: 'Final Verification', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-slate-900 lg:overflow-hidden relative">
      {/* Sidebar Decor */}
      {registrationType !== "Walk-in" && (
        <div className="w-full lg:w-[450px] bg-gradient-to-b from-[#EF4444] to-[#fecaca] p-6 lg:p-8 flex flex-col relative overflow-hidden transition-all duration-500 lg:overflow-hidden shrink-0">
          <div className="relative z-10 space-y-4 lg:space-y-6">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 lg:gap-3 text-white hover:text-white/80 text-sm lg:text-base font-normal transition-colors"
            >
              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full border border-white flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              Back to home
            </button>
            
            <div className="space-y-2 lg:space-y-4">
              <h2 className="text-3xl lg:text-6xl font-normal text-white tracking-tight leading-none">Mabuhay !</h2>
              <p className="text-sm lg:text-base font-normal leading-relaxed opacity-95">
                Mag-rehistro na at tangkilikin ang Senior Citizen Benefits para sa mas mabilis na diskwento, healthcare support, at mga programang handog ng pamahalaan.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center mt-4 lg:mt-auto gap-4 lg:gap-8 hidden md:flex">
            <div className="w-full max-w-[280px] lg:max-w-[340px] aspect-[4/3] rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <img 
                src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777023641/631356312_10162799760103163_1721113509013160733_n_z625pe.jpg" 
                alt="Senior Citizen Group" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="w-full flex justify-center pb-2">
              <img src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777960918/Group-74_hnbnr8.png" className="h-14 lg:h-20 w-auto object-contain" referrerPolicy="no-referrer" />
            </div>
          </div>

          <div className="md:hidden relative z-10 flex justify-center mt-4 pb-2">
            <img src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777960918/Group-74_hnbnr8.png" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
          </div>

          {/* Decorative background elements - subtle */}
          <div className="absolute top-0 right-0 w-full h-[60%] bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Form Content */}
      <div className="flex-1 flex flex-col lg:overflow-y-auto">
        {/* Progress Header */}
        <div className="py-3 px-4 lg:px-10 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="w-20 lg:w-32">
              {registrationType === "Walk-in" && (
                <button 
                  onClick={onBack}
                  className="flex items-center gap-2 text-slate-400 hover:text-[#ef4444] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Back</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 lg:gap-4">
              {steps.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-xs lg:text-sm transition-all duration-500",
                      step >= s.id ? "bg-[#EF4444] text-white shadow-lg shadow-red-100" : "bg-slate-100 text-slate-400"
                    )}>
                      {step > s.id ? <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" /> : s.id}
                    </div>
                    <span className={cn(
                      "text-[10px] lg:text-[11px] font-bold uppercase tracking-wider",
                      step >= s.id ? "text-[#EF4444]" : "text-slate-300"
                    )}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      "w-8 lg:w-16 h-[2px] mb-4.5 transition-all duration-500",
                      step > s.id ? "bg-[#EF4444]" : "bg-slate-100"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="w-20 lg:w-32" />
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex-1 lg:overflow-y-auto py-6 pb-24 px-4 lg:px-10 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {registrationType === "Walk-in" && isLcrVerified && lcrName && (
                    <div className="p-8 bg-[#ECFDF5] border border-[#D1FAE5] rounded-[2rem] flex items-center justify-between mb-12">
                      <div className="space-y-2">
                        <p className="text-sm text-[#059669] tracking-wider font-medium">LCR Verified Record</p>
                        <h3 className="text-4xl text-[#0F172A] tracking-tight">{lcrName}</h3>
                      </div>
                      <div className="px-6 py-4 bg-[#10B981] text-white rounded-2xl flex items-center gap-3 shadow-xl shadow-emerald-100">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="text-base tracking-wide font-medium">Verified Registry</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl tracking-tight mb-2 text-[#EF4444]">Identify Profile</h1>
                    <p className="text-slate-400 font-normal text-base">Please provide your basic information as it appears on your birth certificate.</p>
                  </div>                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="Last Name"
                          readOnly={registrationType === "Walk-in" && isLcrVerified}
                          value={formData.lastName}
                          onChange={(e) => {
                            setFormData({...formData, lastName: e.target.value.toUpperCase()});
                            if (errors.lastName) setErrors(prev => {
                              const n = {...prev};
                              delete n.lastName;
                              return n;
                            });
                          }}
                          className={cn(
                            "w-full px-6 py-3 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium text-[#0F172A] placeholder:text-slate-300 text-base h-[56px]",
                            errors.lastName ? "border-red-500" : "border-slate-100",
                            registrationType === "Walk-in" && isLcrVerified && "bg-slate-100/50 cursor-not-allowed"
                          )}
                        />
                        {errors.lastName && <p className="text-red-500 text-sm font-semibold mt-1 ml-1">{errors.lastName}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="First Name"
                          value={formData.firstName}
                          readOnly={registrationType === "Walk-in" && isLcrVerified}
                          onChange={(e) => {
                            setFormData({...formData, firstName: e.target.value.toUpperCase()});
                            if (errors.firstName) setErrors(prev => {
                              const n = {...prev};
                              delete n.firstName;
                              return n;
                            });
                          }}
                          className={cn(
                            "w-full px-6 py-3 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium text-[#0F172A] placeholder:text-slate-300 text-base h-[56px]",
                            errors.firstName ? "border-red-500" : "border-slate-100",
                            registrationType === "Walk-in" && isLcrVerified && "bg-slate-100/50 cursor-not-allowed"
                          )}
                        />
                        {errors.firstName && <p className="text-red-500 text-sm font-semibold mt-1 ml-1">{errors.firstName}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Middle Name</label>
                        <input 
                          type="text" 
                          placeholder="Middle Name"
                          value={formData.middleName}
                          onChange={(e) => setFormData({...formData, middleName: e.target.value.toUpperCase()})}
                          className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium text-[#0F172A] placeholder:text-slate-300 text-base h-[56px]"
                        />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Suffix</label>
                      <input 
                        type="text" 
                        placeholder="Jr."
                        value={formData.extensionName}
                        onChange={(e) => setFormData({...formData, extensionName: e.target.value.toUpperCase()})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-[#0F172A] placeholder:text-slate-300 font-medium text-base h-[56px]"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                        Birth Date <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <select 
                          value={formData.birthDate.year}
                          disabled={registrationType === "Walk-in" && isLcrVerified}
                          onChange={(e) => {
                            handleBirthDateChange('year', e.target.value);
                            if (errors.birthDate) setErrors(prev => {
                              const n = {...prev};
                              delete n.birthDate;
                              return n;
                            });
                          }}
                          className={cn(
                            "px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-medium text-[#0F172A] appearance-none text-base h-[56px]",
                            errors.birthDate ? "border-rose-500" : "border-slate-100",
                            registrationType === "Walk-in" && isLcrVerified && "bg-slate-100/50 cursor-not-allowed"
                          )}
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 60 - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <select 
                          value={formData.birthDate.month}
                          disabled={registrationType === "Walk-in" && isLcrVerified}
                          onChange={(e) => {
                            handleBirthDateChange('month', e.target.value);
                            if (errors.birthDate) setErrors(prev => {
                              const n = {...prev};
                              delete n.birthDate;
                              return n;
                            });
                          }}
                          className={cn(
                            "px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-medium text-[#0F172A] appearance-none text-base h-[56px]",
                            errors.birthDate ? "border-rose-500" : "border-slate-100",
                            registrationType === "Walk-in" && isLcrVerified && "bg-slate-100/50 cursor-not-allowed"
                          )}
                        >
                          <option value="">Month</option>
                          {[
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                          ].map((monthName, i) => (
                            <option key={i + 1} value={i + 1}>{monthName}</option>
                          ))}
                        </select>
                        <select 
                          value={formData.birthDate.day}
                          disabled={registrationType === "Walk-in" && isLcrVerified}
                          onChange={(e) => {
                            handleBirthDateChange('day', e.target.value);
                            if (errors.birthDate) setErrors(prev => {
                              const n = {...prev};
                              delete n.birthDate;
                              return n;
                            });
                          }}
                          className={cn(
                            "px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-medium text-[#0F172A] appearance-none text-base h-[56px]",
                            errors.birthDate ? "border-rose-500" : "border-slate-100",
                            registrationType === "Walk-in" && isLcrVerified && "bg-slate-100/50 cursor-not-allowed"
                          )}
                        >
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                      {errors.birthDate && <p className="text-rose-500 text-sm font-semibold mt-1 ml-1">{errors.birthDate}</p>}
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider text-nowrap ml-1">
                        Age <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="number" 
                        placeholder="Age"
                        value={formData.age}
                        readOnly
                        className="w-full px-6 py-4 bg-slate-100 border border-slate-100 rounded-2xl outline-none font-medium text-slate-500 cursor-not-allowed text-base h-[56px]"
                      />
                    </div>
                  </div>                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          Birth Place <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          <input 
                            type="text" 
                            placeholder="City / Province"
                            value={formData.placeOfBirth}
                            onChange={(e) => {
                              setFormData({...formData, placeOfBirth: e.target.value.toUpperCase()});
                              if (errors.placeOfBirth) setErrors(prev => {
                                const n = {...prev};
                                delete n.placeOfBirth;
                                return n;
                              });
                            }}
                            className={cn(
                              "w-full pl-14 pr-6 py-4 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium text-base h-[56px]",
                              errors.placeOfBirth ? "border-rose-500" : "border-slate-100"
                            )}
                          />
                        </div>
                        {errors.placeOfBirth && <p className="text-red-500 text-sm font-semibold mt-1 ml-1">{errors.placeOfBirth}</p>}
                      </div>
                      <div className="md:col-span-1 space-y-2">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          Gender <span className="text-rose-500">*</span>
                        </label>
                        <select 
                          value={formData.gender}
                          onChange={(e) => {
                            setFormData({...formData, gender: e.target.value});
                            if (errors.gender) setErrors(prev => {
                              const n = {...prev};
                              delete n.gender;
                              return n;
                            });
                          }}
                          className={cn(
                            "w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none font-medium appearance-none text-base h-[56px]",
                            errors.gender ? "border-rose-500" : "border-slate-100"
                          )}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        {errors.gender && <p className="text-red-500 text-sm font-normal mt-1 text-center w-full">{errors.gender}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                        Civil Status <span className="text-rose-500">*</span>
                      </label>
                      <select 
                        value={formData.civilStatus}
                        onChange={(e) => {
                          setFormData({...formData, civilStatus: e.target.value});
                          if (errors.civilStatus) setErrors(prev => {
                            const n = {...prev};
                            delete n.civilStatus;
                            return n;
                          });
                        }}
                        className={cn(
                          "w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none font-medium appearance-none text-base h-[56px]",
                          errors.civilStatus ? "border-rose-500" : "border-slate-100"
                        )}
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                      </select>
                      {errors.civilStatus && <p className="text-rose-500 text-sm font-semibold mt-1 ml-1">{errors.civilStatus}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                        Citizenship <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300">🌐</div>
                        <input 
                          type="text" 
                          value={formData.citizenship}
                          onChange={(e) => setFormData({...formData, citizenship: e.target.value.toUpperCase()})}
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium text-base h-[56px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[#E11D48]" />
                      </div>
                      <h3 className="text-lg text-slate-900 font-semibold uppercase tracking-widest">Residential Address</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          Address (House No. & Street) <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. 123 F. Blumentritt St."
                          value={formData.address}
                          onChange={(e) => {
                            setFormData({...formData, address: e.target.value.toUpperCase()});
                            if (errors.address) setErrors(prev => {
                              const n = {...prev};
                              delete n.address;
                              return n;
                            });
                          }}
                          className={cn(
                            "w-full px-6 py-4 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium text-base h-[56px]",
                            errors.address ? "border-rose-500" : "border-slate-100"
                          )}
                        />
                        {errors.address && <p className="text-red-500 text-sm font-semibold mt-1 ml-1">{errors.address}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          Province <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          value={formData.province}
                          readOnly
                          className="w-full px-6 py-4 bg-slate-100 border border-slate-100 rounded-2xl outline-none font-medium text-slate-500 text-base h-[56px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          City / Municipality <span className="text-rose-500">*</span>
                        </label>
                        <select 
                          value={formData.cityMunicipality}
                          onChange={(e) => setFormData({...formData, cityMunicipality: e.target.value})}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium appearance-none text-base h-[56px]"
                        >
                          <option value="San Juan City">San Juan City</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          Barangay <span className="text-rose-500">*</span>
                        </label>
                        <select 
                          value={formData.barangay}
                          onChange={(e) => {
                            const selectedBarangay = e.target.value;
                            const districtMap: Record<string, string> = {
                              'Balong-Bato': 'District 1', 'Corazon de Jesus': 'District 1', 'Ermitaño': 'District 1', 
                              'Isabelita': 'District 1', 'Kabayanan': 'District 1', 'Onse': 'District 1', 
                              'Pasadena': 'District 1', 'Pedro Cruz': 'District 1', 'Progreso': 'District 1', 
                              'Rivera': 'District 1', 'Salapan': 'District 1', 'San Perfecto': 'District 1', 
                              'Tibagan': 'District 1', 'Addition Hills': 'District 2', 'Batis': 'District 2', 
                              'Greenhills': 'District 2', 'Little Baguio': 'District 2', 'Maytunas': 'District 2', 
                              'Saint Joseph': 'District 2', 'Santa Lucia': 'District 2', 'West Crame': 'District 2'
                            };
                            const autoDistrict = districtMap[selectedBarangay] || '';
                            setFormData({...formData, barangay: selectedBarangay, district: autoDistrict});
                            
                            if (errors.barangay) setErrors(prev => {
                              const n = {...prev};
                              delete n.barangay;
                              return n;
                            });
                            if (autoDistrict && errors.district) setErrors(prev => {
                              const n = {...prev};
                              delete n.district;
                              return n;
                            });
                          }}
                          className={cn(
                            "w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none font-medium appearance-none text-base h-[56px]",
                            errors.barangay ? "border-rose-500" : "border-slate-100"
                          )}
                        >
                          <option value="">Select Barangay</option>
                          {[
                            'Balong-Bato', 'Corazon de Jesus', 'Ermitaño', 'Isabelita', 'Kabayanan', 
                            'Onse', 'Pasadena', 'Pedro Cruz', 'Progreso', 'Rivera', 'Salapan', 
                            'San Perfecto', 'Tibagan', 'Addition Hills', 'Batis', 'Greenhills', 
                            'Little Baguio', 'Maytunas', 'Saint Joseph', 'Santa Lucia', 'West Crame'
                          ].sort().map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                        {errors.barangay && <p className="text-red-500 text-sm font-semibold mt-1 ml-1">{errors.barangay}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          District <span className="text-rose-500">*</span>
                        </label>
                        <select 
                          value={formData.district}
                          onChange={(e) => {
                            setFormData({...formData, district: e.target.value});
                            if (errors.district) setErrors(prev => {
                              const n = {...prev};
                              delete n.district;
                              return n;
                            });
                          }}
                          className={cn(
                            "w-full px-6 py-4 bg-slate-100 border rounded-2xl outline-none font-medium appearance-none text-base h-[56px] cursor-not-allowed",
                            errors.district ? "border-rose-500" : "border-slate-100"
                          )}
                          disabled
                        >
                          <option value="">Select District</option>
                          <option value="District 1">District 1</option>
                          <option value="District 2">District 2</option>
                        </select>
                        {errors.district && <p className="text-red-500 text-sm font-semibold mt-1 ml-1">{errors.district}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <label className="text-base font-semibold text-slate-500 uppercase tracking-wider ml-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input 
                        type="email" 
                        placeholder="juan.delacruz@email.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({...formData, email: e.target.value});
                          if (errors.email) setErrors(prev => {
                            const n = {...prev};
                            delete n.email;
                            return n;
                          });
                        }}
                        className={cn(
                          "w-full pl-14 pr-6 py-4 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium text-base h-[56px]",
                          errors.email ? "border-rose-500" : "border-slate-100"
                        )}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm font-semibold mt-1 ml-1">{errors.email}</p>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-3xl font-normal tracking-tight mb-2 text-[#EF4444]">Socio-Economic & Health</h1>
                    <p className="text-slate-400 font-normal text-base">This helps us determine eligibility for various assistance programs.</p>
                  </div>

                  <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-[#E11D48]" />
                      </div>
                      <h3 className="text-base text-slate-900 font-normal">Economic Status</h3>
                    </div>

                    <div className="space-y-6">
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                        Living Arrangement <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Owned', 'Rent', 'Living with Relatives', 'Others'].map((opt) => (
                          <button 
                            key={opt}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, livingArrangement: opt});
                              if (errors.livingArrangement) setErrors(prev => {
                                const n = {...prev};
                                delete n.livingArrangement;
                                return n;
                              });
                            }}
                            className={cn(
                              "px-4 py-6 rounded-2xl border text-base font-normal transition-all",
                              formData.livingArrangement === opt 
                                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xl shadow-slate-200" 
                                : "bg-white text-slate-400 border-slate-100 hover:border-slate-200",
                              errors.livingArrangement && formData.livingArrangement !== opt && "border-rose-500"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {errors.livingArrangement && <p className="text-red-500 text-sm font-normal mt-1">{errors.livingArrangement}</p>}
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                          <span className="text-lg font-normal text-slate-700">Are you a Pensioner?</span>
                          <button 
                            onClick={() => {
                              const newVal = !formData.isPensioner;
                              setFormData({...formData, isPensioner: newVal});
                              if (!newVal && errors.pensionAmount) {
                                setErrors(prev => {
                                  const n = {...prev};
                                  delete n.pensionAmount;
                                  return n;
                                });
                              }
                            }}
                            className={cn(
                              "w-16 h-8 rounded-full p-1 transition-colors duration-300",
                              formData.isPensioner ? "bg-emerald-500" : "bg-slate-200"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300",
                              formData.isPensioner ? "translate-x-8" : "translate-x-0"
                            )} />
                          </button>
                        </div>
                        
                        {formData.isPensioner && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-6 bg-white rounded-3xl border border-slate-100 space-y-6"
                          >
                            <label className="text-base font-semibold text-slate-500 uppercase tracking-wider ml-1">Pension Source</label>
                            <div className="flex flex-wrap gap-6">
                              {['GSIS', 'SSS', 'AFPSLAI'].map(source => (
                                <label key={source} className="flex items-center gap-3 cursor-pointer group">
                                  <div className="relative flex items-center">
                                    <input 
                                      type="checkbox" 
                                      checked={formData[`pension${source}` as keyof typeof formData] as boolean}
                                      onChange={() => setFormData({...formData, [`pension${source}` as keyof typeof formData]: !formData[`pension${source}` as keyof typeof formData]})}
                                      className="w-6 h-6 rounded border-slate-300 text-rose-500 focus:ring-rose-500 transition-all cursor-pointer"
                                    />
                                  </div>
                                  <span className="text-lg font-normal text-slate-600 group-hover:text-[#EF4444] transition-colors">{source}</span>
                                </label>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <input 
                                type="text" 
                                placeholder="Other Source"
                                value={formData.pensionOthers}
                                onChange={(e) => setFormData({...formData, pensionOthers: e.target.value.toUpperCase()})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-medium h-[56px] outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                              />
                              <div className="space-y-1">
                                <input 
                                  type="number" 
                                  placeholder="Monthly Amount"
                                  value={formData.pensionAmount}
                                  onChange={(e) => {
                                    setFormData({...formData, pensionAmount: e.target.value});
                                    if (errors.pensionAmount) setErrors(prev => {
                                      const n = {...prev};
                                      delete n.pensionAmount;
                                      return n;
                                    });
                                  }}
                                  className={cn(
                                    "w-full px-6 py-4 bg-slate-50 border rounded-2xl text-base font-medium transition-all h-[56px] outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500",
                                    errors.pensionAmount ? "border-rose-500" : "border-slate-100"
                                  )}
                                />
                                {errors.pensionAmount && <p className="text-red-500 text-xs font-semibold mt-1 ml-1">{errors.pensionAmount}</p>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                          <span className="text-lg font-normal text-slate-700">Permanent Source of Income?</span>
                          <button 
                            onClick={() => setFormData({...formData, hasPermanentIncome: !formData.hasPermanentIncome})}
                            className={cn(
                              "w-16 h-8 rounded-full p-1 transition-colors duration-300",
                              formData.hasPermanentIncome ? "bg-emerald-500" : "bg-slate-200"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300",
                              formData.hasPermanentIncome ? "translate-x-8" : "translate-x-0"
                            )} />
                          </button>
                        </div>
                         {formData.hasPermanentIncome && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-6 bg-white rounded-3xl border border-slate-100 space-y-6"
                          >
                            <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Source of Income</label>
                            <input 
                              type="text" 
                              placeholder="Specify Source"
                              value={formData.incomeSource}
                              onChange={(e) => setFormData({...formData, incomeSource: e.target.value.toUpperCase()})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-medium h-[56px] outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                            />
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                          <span className="text-lg font-normal text-slate-700">Regular Support from Family?</span>
                          <button 
                            onClick={() => {
                              const newVal = !formData.hasRegularSupport;
                              setFormData({...formData, hasRegularSupport: newVal});
                              if (!newVal && errors.supportCashAmount) {
                                setErrors(prev => {
                                  const n = {...prev};
                                  delete n.supportCashAmount;
                                  return n;
                                });
                              }
                            }}
                            className={cn(
                              "w-16 h-8 rounded-full p-1 transition-colors duration-300",
                              formData.hasRegularSupport ? "bg-emerald-500" : "bg-slate-200"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300",
                              formData.hasRegularSupport ? "translate-x-8" : "translate-x-0"
                            )} />
                          </button>
                        </div>
                        {formData.hasRegularSupport && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 bg-white rounded-2xl border border-slate-100 space-y-6"
                          >
                            <div className="space-y-6">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={formData.supportCash}
                                  onChange={() => {
                                    const newVal = !formData.supportCash;
                                    setFormData({...formData, supportCash: newVal});
                                    if (!newVal && errors.supportCashAmount) {
                                      setErrors(prev => {
                                        const n = {...prev};
                                        delete n.supportCashAmount;
                                        return n;
                                      });
                                    }
                                  }}
                                  className="w-6 h-6 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                                />
                                <span className="text-lg font-normal text-slate-600">Cash Support</span>
                              </label>
                              {formData.supportCash && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-1 lg:ml-8">
                                  <div className="space-y-2">
                                    <input 
                                      type="number" 
                                      placeholder="Amount"
                                      value={formData.supportCashAmount}
                                      onChange={(e) => {
                                        setFormData({...formData, supportCashAmount: e.target.value});
                                        if (errors.supportCashAmount) setErrors(prev => {
                                          const n = {...prev};
                                          delete n.supportCashAmount;
                                          return n;
                                        });
                                      }}
                                      className={cn(
                                        "w-full px-6 py-4 bg-slate-50 border rounded-2xl text-base font-medium transition-all h-[56px] outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500",
                                        errors.supportCashAmount ? "border-rose-500" : "border-slate-100"
                                      )}
                                    />
                                    {errors.supportCashAmount && <p className="text-red-500 text-xs font-semibold mt-1 ml-1">{errors.supportCashAmount}</p>}
                                  </div>
                                  <select 
                                    value={formData.supportCashFrequency}
                                    onChange={(e) => setFormData({...formData, supportCashFrequency: e.target.value})}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-medium h-[56px] outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 appearance-none"
                                  >
                                    <option value="">Frequency</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Yearly">Yearly</option>
                                  </select>
                                </div>
                              )}
                            </div>
                            <div className="space-y-6">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={formData.supportInKind}
                                  onChange={() => setFormData({...formData, supportInKind: !formData.supportInKind})}
                                  className="w-6 h-6 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                                />
                                <span className="text-lg font-normal text-slate-600">In-Kind Support</span>
                              </label>
                              {formData.supportInKind && (
                                 <div className="ml-1 lg:ml-8">
                                   <input 
                                     type="text" 
                                     placeholder="Details (e.g. groceries, medicine)"
                                     value={formData.supportDetails}
                                     onChange={(e) => setFormData({...formData, supportDetails: e.target.value.toUpperCase()})}
                                     className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-medium h-[56px] outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                   />
                                 </div>
                               )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-[#E11D48]" />
                      </div>
                      <h3 className="text-base text-slate-900 font-normal">Health Condition</h3>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                          <span className="text-lg font-normal text-slate-700">Has Existing Illness?</span>
                          <button 
                            onClick={() => setFormData({...formData, hasIllness: !formData.hasIllness})}
                            className={cn(
                              "w-16 h-8 rounded-full p-1 transition-colors duration-300",
                              formData.hasIllness ? "bg-emerald-500" : "bg-slate-200"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300",
                              formData.hasIllness ? "translate-x-8" : "translate-x-0"
                            )} />
                          </button>
                        </div>
                         {formData.hasIllness && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-6 bg-white rounded-3xl border border-slate-100"
                          >
                            <label className="text-base font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Illness Details</label>
                            <input 
                              type="text" 
                              placeholder="Describe your existing illness..."
                              value={formData.illnessDetails}
                              onChange={(e) => setFormData({...formData, illnessDetails: e.target.value.toUpperCase()})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-normal h-[64px] outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-center"
                            />
                          </motion.div>
                        )}
                      </div>

                      <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                        <span className="text-lg font-normal text-slate-700">Hospitalized within the last six months?</span>
                        <button 
                          onClick={() => setFormData({...formData, hospitalized: !formData.hospitalized})}
                          className={cn(
                            "w-16 h-8 rounded-full p-1 transition-colors duration-300",
                            formData.hospitalized ? "bg-emerald-500" : "bg-slate-200"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300",
                            formData.hospitalized ? "translate-x-8" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-3xl font-normal tracking-tight mb-2 text-[#EF4444]">Final Verification</h1>
                    <p className="text-slate-400 font-normal text-base">Upload documents and provide contact details to complete registration.</p>
                  </div>

                  <div className="bg-slate-50/50 rounded-[48px] p-8 md:p-10 border border-slate-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                      {/* Left Side: Requirements & Acceptable Documents */}
                      <div className="flex flex-col h-full space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-6 h-6 text-[#E11D48]" />
                          </div>
                          <div>
                            <h3 className="text-xl text-slate-800 font-bold">Requirements <span className="text-rose-500">*</span></h3>
                            <p className="text-sm text-slate-400 font-medium">Please provide one of the following</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 flex flex-col justify-center">
                          <p className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-4">Acceptable Documents:</p>
                          <ul className="grid grid-cols-1 gap-4">
                            {[
                              'Passport',
                              'Driver license',
                              'Voter\'s I.D / Voters',
                              'UMID I.D',
                              'Postal I.D',
                              'BIR Identification Card',
                              'Barangay I.D'
                            ].map((doc, i) => (
                              <li key={i} className="flex items-center gap-4 text-base text-slate-600 font-semibold group">
                                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0 group-hover:scale-125 transition-transform"></div>
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Right Side: Upload Area */}
                      <div className="flex flex-col h-full space-y-6">
                        <div className="flex items-center gap-3 lg:justify-end">
                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-full">
                            <Upload className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Upload multiple files if needed</span>
                          </div>
                        </div>

                        <div className={cn(
                          "flex-1 border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative min-h-[340px] shadow-sm",
                          errors.attachments 
                            ? "border-rose-500 bg-rose-50/20" 
                            : "border-slate-200 bg-white hover:bg-slate-50/50 hover:border-rose-300"
                        )}>
                          <input 
                            type="file" 
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;
                              
                              const newFiles = Array.from(files) as File[];
                              const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                              
                              const invalidType = newFiles.find((f: File) => !allowedTypes.includes(f.type));
                              if (invalidType) {
                                setError("Invalid file type. Only PDF, JPG, and PNG are allowed.");
                                return;
                              }

                              const oversized = newFiles.find((f: File) => f.size > 5 * 1024 * 1024);
                              if (oversized) {
                                setError(`File ${oversized.name} is too large. Max size is 5MB.`);
                                return;
                              }

                              setError(null);
                              setFormData(prev => ({ 
                                ...prev, 
                                attachments: [...prev.attachments, ...newFiles] 
                              }));
                              
                              if (errors.attachments) setErrors(prev => {
                                const n = {...prev};
                                delete n.attachments;
                                return n;
                              });
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-20 h-20 bg-rose-50/50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-10 h-10 text-[#E11D48]" />
                          </div>
                          <h4 className="text-2xl tracking-tight mb-2 font-bold text-slate-800">Drop files here</h4>
                          <p className="text-lg text-slate-400 font-medium">or click to browse your files</p>
                          <div className="mt-8 flex flex-wrap justify-center gap-2">
                             {['PDF', 'JPG', 'PNG'].map(fmt => (
                               <span key={fmt} className="px-4 py-1.5 bg-slate-100 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest">{fmt}</span>
                             ))}
                          </div>
                        </div>

                        {formData.attachments.length > 0 && (
                          <div className="mt-6 space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                            {formData.attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[20px] group hover:border-rose-100 transition-colors animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-4 overflow-hidden">
                                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                  </div>
                                  <span className="text-sm font-bold text-slate-700 truncate">{file.name}</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setFormData(prev => ({
                                      ...prev,
                                      attachments: prev.attachments.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {errors.attachments && <p className="text-rose-500 text-sm font-bold mt-2 ml-4 flex items-center gap-2">
                          <X className="w-4 h-4" /> {errors.attachments}
                        </p>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0F172A] rounded-[32px] p-6 shadow-xl shadow-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg text-white font-normal">Contact Info <span className="text-rose-500">*</span></h3>
                    </div>

                    <div className="space-y-6">
                      <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        Mobile Number (11 Digits) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                        <input 
                          type="tel" 
                          placeholder="09171234567"
                          maxLength={11}
                          pattern="[0-9]*"
                          value={formData.contactNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                            setFormData({...formData, contactNumber: val});
                            if (errors.contactNumber) setErrors(prev => {
                              const n = {...prev};
                              delete n.contactNumber;
                              return n;
                            });
                          }}
                          className={cn(
                            "w-full pl-16 pr-6 py-4 bg-white/5 border rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-white placeholder:text-slate-600 font-medium text-base h-[56px]",
                            errors.contactNumber ? "border-rose-500" : "border-white/10"
                          )}
                        />
                      </div>
                      {errors.contactNumber && <p className="text-red-500 text-sm font-semibold mt-1 ml-1">{errors.contactNumber}</p>}
                    </div>
                  </div>

                  {error && (
                    <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-600">
                      <AlertCircle className="w-6 h-6 flex-shrink-0" />
                      <p className="text-sm font-normal">{error}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="py-6 px-4 lg:px-10 border-t border-slate-100 bg-white/80 backdrop-blur-md sticky bottom-0 z-20">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            {step > 1 ? (
              <button 
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 text-base font-normal transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button 
                type="button"
                onClick={handleNext}
                className="flex items-center gap-3 px-10 py-4 bg-red-100 text-[#EF4444] rounded-full font-normal text-base hover:bg-red-200 transition-all"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                   "flex items-center gap-3 px-10 py-4 rounded-full font-normal text-base transition-all",
                  isSubmitting 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20"
                )}
              >
                {isSubmitting ? 'Submitting...' : 'Finish Registration'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
