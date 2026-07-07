import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Check, 
  X, 
  AlertCircle,
  Filter, 
  RefreshCw, 
  Award, 
  Sparkles,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Info,
  CheckCircle2,
  ChevronDown,
  User,
  Plus,
  Trash2,
  FileText,
  Building,
  Heart,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Upload,
  Paperclip,
  MoreVertical
} from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/config';
import toast from 'react-hot-toast';

interface Citizen {
  id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  birth_date: string;
  age: number;
  barangay: string;
  contact_number?: string;
  is_verified?: boolean;
  sex?: string;
  id_status?: string;
  scid_number?: string;
  civil_status?: string;
  city_municipality?: string;
  province?: string;
  address?: string;
  house_number?: string;
  street?: string;
  birthdate?: string;
}

export interface ApplicationForm {
  citizen_id: number;
  user_id?: number;
  milestone_age: number; // 80, 85, 90, 95, 100
  rrn?: string;
  osca_id_number?: string;
  last_name: string;
  first_name: string;
  middle_name?: string;
  birth_date: string;
  age: number;
  sex: 'Male' | 'Female';
  civil_status: string;
  citizenship: string;
  applicant_type?: 'Local' | 'Living Abroad';
  dual_citizenship_details?: string;
  
  // Addresses
  res_house_num?: string;
  res_street?: string;
  res_barangay: string;
  res_city: string;
  res_province: string;
  res_zip?: string;
  
  perm_house_num?: string;
  perm_street?: string;
  perm_barangay?: string;
  perm_city?: string;
  perm_province?: string;
  perm_zip?: string;

  // Family
  spouse_name?: string;
  spouse_citizenship?: string;
  children: string[]; // Up to 5 children
  representatives: { name: string; relationship: string }[]; // Up to 3 reps

  // Contact
  phone?: string;
  email?: string;

  // Beneficiaries
  primary_beneficiary?: string;
  primary_relationship?: string;
  contingent_beneficiary?: string;
  contingent_relationship?: string;

  // Utilization
  utilization_food: boolean;
  utilization_med_checkup: boolean;
  utilization_medicines: boolean;
  utilization_livelihood: boolean;
  utilization_others: boolean;
  utilization_others_details?: string;

  // Documentary Checklists
  doc_annex_a: boolean;
  doc_id_proof: boolean;
  doc_birth_cert: boolean;
  doc_residency_cert: boolean;
  doc_2x2_pic: boolean;
  doc_full_body_pic: boolean;
  doc_endorsement: boolean;

  // File names for attachments
  doc_annex_a_file?: string;
  doc_id_proof_file?: string;
  doc_birth_cert_file?: string;
  doc_residency_cert_file?: string;
  doc_2x2_pic_file?: string;
  doc_full_body_pic_file?: string;
  doc_endorsement_file?: string;

  // Signatures or Thumbmarks
  signature_type?: 'draw' | 'thumbmark';
  signature_data?: string; // base64 representation of drawing or thumbmark
  signature?: string;
  thumbmark?: string;
  req_b_url?: string;
  req_c_url?: string;

  // Signatures / Thumbmarks (mock indicators)
  signed_by_applicant: boolean;
  date_applied: string;

  status?: string;
  disapproval_reason?: string;
  disbursement_status?: string;
  created_at?: string;
  updated_at?: string;
}

export function dataURLtoFile(dataurl: string, filename: string): File | null {
  let targetUrl = dataurl;
  if (dataurl === 'CAPTURED_THUMBPRINT_OK') {
    targetUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('data:')) {
    return null;
  }
  try {
    const arr = targetUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (err) {
    console.error('Failed to convert base64 to file', err);
    return null;
  }
}

export function createFormDataFromPayload(payload: any): FormData {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    // Exclude req_b_url and req_c_url
    if (key === 'req_b_url' || key === 'req_c_url') {
      return;
    }
    if (value === null || value === undefined) {
      fd.append(key, "");
      return;
    }
    if (key === 'signature') {
      const file = dataURLtoFile(value as string, 'signature.png');
      if (file) {
        fd.append(key, file);
      }
      return;
    }
    if (key === 'thumbmark') {
      const file = dataURLtoFile(value as string, 'thumbmark.png');
      if (file) {
        fd.append(key, file);
      }
      return;
    }
    if (typeof value === 'boolean') {
      fd.append(key, value ? "1" : "0");
      return;
    }
    fd.append(key, String(value));
  });
  return fd;
}

interface AuthenticatedSignatureImageProps {
  path: any;
  alt: string;
  style?: React.CSSProperties;
}

export function AuthenticatedSignatureImage({ path, alt, style }: AuthenticatedSignatureImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeObjectURL: string | null = null;

    if (!path) {
      setLoading(false);
      return;
    }

    // Handle case where path is a File or Blob object directly
    if (path instanceof File || path instanceof Blob) {
      const objectUrl = URL.createObjectURL(path);
      activeObjectURL = objectUrl;
      setUrl(objectUrl);
      setLoading(false);
      return () => {
        if (activeObjectURL) {
          URL.revokeObjectURL(activeObjectURL);
        }
      };
    }

    if (typeof path !== 'string') {
      setLoading(false);
      return;
    }

    if (path.startsWith('data:')) {
      setUrl(path);
      setLoading(false);
      return;
    }

    const fetchFile = async () => {
      try {
        const token = localStorage.getItem('token');
        let cleanPath = path;
        if (path.includes('/storage/')) {
          cleanPath = path.split('/storage/')[1];
        }

        const response = await fetch(`${API_URL}/view-file?path=${encodeURIComponent(cleanPath)}`, {
          method: "GET",
          headers: {
            'Accept': 'application/json',
            ...(token && token !== 'undefined' && token !== 'null' ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const objUrl = URL.createObjectURL(blob);
          activeObjectURL = objUrl;
          setUrl(objUrl);
        } else {
          if (path.startsWith('http')) {
            setUrl(path);
          } else {
            setUrl(`${API_URL}/../storage/${cleanPath}`);
          }
        }
      } catch (e) {
        console.error("Failed to load signature image", e);
        if (path.startsWith('http')) {
          setUrl(path);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
    return () => {
      if (activeObjectURL) {
        URL.revokeObjectURL(activeObjectURL);
      }
    };
  }, [path]);

  if (loading) {
    return <span style={{ fontSize: '8px', color: '#64748b' }}>Loading...</span>;
  }

  if (!url) {
    return null;
  }

  return (
    <img
      src={url}
      alt={alt}
      style={{
        ...style,
        mixBlendMode: 'multiply',
        opacity: 0.95
      }}
    />
  );
}

export function mapFormToBackend(form: ApplicationForm, userId: number): any {
  return {
    application_id: Number(form.citizen_id),
    user_id: form.user_id ? Number(form.user_id) : (userId ? Number(userId) : Number(form.citizen_id)),
    ncs_registration_reference_no: form.rrn || null,
    scid_number: form.osca_id_number || null,
    milestone_age: String(form.milestone_age),
    last_name: form.last_name,
    first_name: form.first_name,
    middle_name: form.middle_name || null,
    birthdate: form.birth_date ? (form.birth_date.includes('T') ? form.birth_date : `${form.birth_date}T00:00:00.000000Z`) : null,
    age: Number(form.age || 0),
    gender: form.sex || 'Male',
    civil_status: form.civil_status || 'Single',
    citizenship: form.citizenship || 'Filipino',
    applicant_type: form.applicant_type || 'Local',

    house_number: form.res_house_num || null,
    res_house_no: form.res_house_num || null,
    res_street: form.res_street || '',
    res_barangay: form.res_barangay || null,
    res_city: form.res_city || null,
    res_province: form.res_province || null,
    res_zip_code: form.res_zip || '1500',

    perm_house_no: form.perm_house_num || null,
    perm_street: form.perm_street || '',
    perm_barangay: form.perm_barangay || null,
    perm_city: form.perm_city || null,
    perm_province: form.perm_province || null,
    perm_zip_code: form.perm_zip || '1500',

    spouse_name: form.spouse_name || null,
    spouse_citizenship: form.spouse_citizenship || null,

    children_names: form.children && form.children.length > 0 ? JSON.stringify(form.children) : JSON.stringify(['', '', '']),

    rep1_name: form.representatives?.[0]?.name || null,
    rep1_relationship: form.representatives?.[0]?.relationship || null,

    rep2_name: form.representatives?.[1]?.name || null,
    rep2_relationship: form.representatives?.[1]?.relationship || null,

    contact_numbers: form.phone || null,
    email_address: form.email || null,

    primary_beneficiary_name: form.primary_beneficiary || null,
    primary_relationship: form.primary_relationship || null,

    contingent_beneficiary_name: form.contingent_beneficiary || null,
    contingent_relationship: form.contingent_relationship || null,

    use_food: form.utilization_food || false,
    use_medical_checkup: form.utilization_med_checkup || false,
    use_medicines: form.utilization_medicines || false,
    use_livelihood: form.utilization_livelihood || false,
    use_entrepreneurial: form.utilization_livelihood || false,
    use_others: form.utilization_others_details || (form.utilization_others ? 'Others' : null),

    application_date: form.date_applied || new Date().toISOString().split('T')[0],
    application_status: form.status || 'Pending',
    disapproval_reason: form.disapproval_reason || null,
    disbursement_status: form.disbursement_status || 'Pending',

    signature: form.signature_type === 'draw' ? (form.signature_data || null) : (form.signature || null),
    thumbmark: form.signature_type === 'thumbmark' ? (form.signature_data || null) : (form.thumbmark || null),

    created_at: form.created_at || new Date().toISOString(),
    updated_at: form.updated_at || new Date().toISOString()
  };
}

export function mapBackendToForm(payload: any): ApplicationForm {
  let children: string[] = ['', '', ''];
  if (payload.children_names) {
    try {
      const parsed = JSON.parse(payload.children_names);
      if (Array.isArray(parsed)) {
        children = [...parsed];
        while (children.length < 3) children.push('');
      }
    } catch {
      children = [payload.children_names, '', ''];
    }
  }

  const representatives = [
    { name: payload.rep1_name || '', relationship: payload.rep1_relationship || '' },
    { name: payload.rep2_name || '', relationship: payload.rep2_relationship || '' }
  ];

  let birthDate = '';
  if (payload.birthdate) {
    birthDate = payload.birthdate.split('T')[0];
  } else if (payload.birth_date) {
    birthDate = payload.birth_date.split('T')[0];
  }

  return {
    citizen_id: Number(payload.application_id || payload.id || payload.citizen_id || payload.user_id),
    user_id: payload.user_id ? Number(payload.user_id) : undefined,
    milestone_age: Number(payload.milestone_age || 80),
    rrn: payload.ncs_registration_reference_no || '',
    osca_id_number: payload.scid_number || '',
    last_name: payload.last_name || '',
    first_name: payload.first_name || '',
    middle_name: payload.middle_name || '',
    birth_date: birthDate,
    age: Number(payload.age || 0),
    sex: payload.gender === 'Female' ? 'Female' : 'Male',
    civil_status: payload.civil_status || 'Single',
    citizenship: payload.citizenship || 'Filipino',
    applicant_type: payload.applicant_type || 'Local',
    dual_citizenship_details: '',

    res_house_num: payload.house_number || payload.res_house_no || '',
    res_street: payload.res_street || '',
    res_barangay: payload.res_barangay || '',
    res_city: payload.res_city || 'San Juan',
    res_province: payload.res_province || 'Metro Manila',
    res_zip: payload.res_zip_code || '1500',

    perm_house_num: payload.perm_house_no || '',
    perm_street: payload.perm_street || '',
    perm_barangay: payload.perm_barangay || '',
    perm_city: payload.perm_city || 'San Juan',
    perm_province: payload.perm_province || 'Metro Manila',
    perm_zip: payload.perm_zip_code || '1500',

    spouse_name: payload.spouse_name || '',
    spouse_citizenship: payload.spouse_citizenship || 'Filipino',
    children,
    representatives,

    phone: payload.contact_numbers || '',
    email: payload.email_address || '',

    primary_beneficiary: payload.primary_beneficiary_name || '',
    primary_relationship: payload.primary_relationship || '',
    contingent_beneficiary: payload.contingent_beneficiary_name || '',
    contingent_relationship: payload.contingent_relationship || '',

    utilization_food: Boolean(payload.use_food),
    utilization_med_checkup: Boolean(payload.use_medical_checkup),
    utilization_medicines: Boolean(payload.use_medicines),
    utilization_livelihood: Boolean(payload.use_livelihood),
    utilization_others: Boolean(payload.use_others),
    utilization_others_details: payload.use_others || '',

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

    signature_type: (payload.thumbmark || payload.req_c_url) ? 'thumbmark' : 'draw',
    signature_data: payload.thumbmark || payload.signature || payload.req_c_url || payload.req_b_url || '',
    signature: payload.signature || payload.req_b_url || '',
    thumbmark: payload.thumbmark || payload.req_c_url || '',
    req_b_url: payload.signature || payload.req_b_url || '',
    req_c_url: payload.thumbmark || payload.req_c_url || '',
    signed_by_applicant: true,
    date_applied: payload.application_date || new Date().toISOString().split('T')[0],

    status: payload.application_status || payload.reg_status || payload.status || 'Pending',
    disapproval_reason: payload.disapproval_reason || '',
    disbursement_status: payload.disbursement_status || 'Pending',
    created_at: payload.created_at || undefined,
    updated_at: payload.updated_at || undefined
  };
}

// Reusable custom document upload zone with drag-and-drop support
interface DocumentUploadZoneProps {
  id: string;
  label: string;
  description: string;
  fileName?: string;
  onFileAttached: (fileName: string) => void;
  onFileRemoved: () => void;
}

function DocumentUploadZone({ id, label, description, fileName, onFileAttached, onFileRemoved }: DocumentUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onFileAttached(file.name);
      toast.success(`Attached ${file.name}`);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileAttached(file.name);
      toast.success(`Attached ${file.name}`);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all min-h-[140px]",
        fileName 
          ? "border-emerald-200 bg-emerald-50/25" 
          : isDragActive 
            ? "border-indigo-500 bg-indigo-50/40" 
            : "border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50/60"
      )}
    >
      <input
        type="file"
        id={id}
        className="hidden"
        onChange={handleFileInput}
        accept=".pdf,.png,.jpg,.jpeg"
      />
      
      {fileName ? (
        <div className="space-y-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block font-sans">{label}</span>
            <p className="text-xs font-bold text-slate-800 truncate max-w-xs mx-auto mt-0.5 font-mono">{fileName}</p>
            <p className="text-[10px] text-slate-400 font-medium font-sans mt-0.5">Attached successfully</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onFileRemoved}
              className="text-[10px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-wider font-sans cursor-pointer bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); toast.success(`Viewing ${fileName}`); }}
              className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider font-sans cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              Preview
            </button>
          </div>
        </div>
      ) : (
        <label htmlFor={id} className="cursor-pointer space-y-2 block w-full h-full">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto group-hover:text-slate-600 transition-colors">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block font-sans">{label}</span>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto font-sans leading-normal">{description}</p>
          </div>
          <div className="inline-block mt-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest font-sans bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all">
            Browse File
          </div>
        </label>
      )}
    </div>
  );
}

// Beautiful signature drawing pad and biometric thumbmark scanner
interface SignaturePadProps {
  signatureType?: 'draw' | 'thumbmark';
  signatureData?: string;
  onSignatureChange: (type: 'draw' | 'thumbmark', data: string) => void;
}

function SignaturePad({ signatureType = 'draw', signatureData, onSignatureChange }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'thumbmark'>(signatureType);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Initialize Canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e3a8a'; // dark navy blue ink

        // Clear canvas and draw guideline
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(30, canvas.height - 40);
        ctx.lineTo(canvas.width - 30, canvas.height - 40);
        ctx.strokeStyle = '#cbd5e1'; // slate-300
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Re-set drawing style
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 3;
      }
    }
  }, [activeTab]);

  // Handle Mouse Events for Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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
    const ctx = canvas.getContext('2d');
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
      // Save canvas state
      const dataUrl = canvasRef.current.toDataURL();
      onSignatureChange('draw', dataUrl);
    }
  };

  // Touch events for mobile compatibility
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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
    const ctx = canvas.getContext('2d');
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw guideline again
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(30, canvas.height - 40);
    ctx.lineTo(canvas.width - 30, canvas.height - 40);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // reset

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;

    onSignatureChange('draw', '');
  };

  // Simulated Biometric Thumbmark Scan
  const startThumbprintScan = () => {
    if (signatureData && activeTab === 'thumbmark') {
      onSignatureChange('thumbmark', '');
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
        // Beautiful preset thumbprint
        const presetThumbprint = "CAPTURED_THUMBPRINT_OK";
        onSignatureChange('thumbmark', presetThumbprint);
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
          onSignatureChange('thumbmark', event.target.result as string);
          toast.success("Scanned thumbmark uploaded successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => { setActiveTab('draw'); onSignatureChange('draw', ''); }}
          className={cn(
            "flex-1 py-3 text-xs font-bold tracking-wider uppercase border-r border-slate-100 transition-colors cursor-pointer font-sans",
            activeTab === 'draw' ? "bg-white text-indigo-600" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          ✍️ Draw Signature
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('thumbmark'); onSignatureChange('thumbmark', ''); }}
          className={cn(
            "flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer font-sans",
            activeTab === 'thumbmark' ? "bg-white text-indigo-600" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          👍 Biometric Thumbmark
        </button>
      </div>

      <div className="p-6 bg-slate-50/20">
        {activeTab === 'draw' ? (
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
          <div className="space-y-5 max-w-lg mx-auto text-center">
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
                    onClick={() => onSignatureChange('thumbmark', '')}
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
                        <span className="text-[10px] text-white font-black">{scanProgress}%</span>
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
                      <span className="text-xs font-bold text-slate-800 block font-sans">Upload Scanned</span>
                      <p className="text-[9px] text-slate-400 mt-0.5 max-w-[130px] mx-auto font-sans">Drag & drop or upload PNG/JPG file</p>
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

export default function ExpandedCentenariansActManagement({ hideHeader = false }: { hideHeader?: boolean }) {
  // Tabs: 'management' or 'applicants'
  const [activeTab, setActiveTab] = useState<'management' | 'applicants'>('management');

  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [allMasterlist, setAllMasterlist] = useState<Citizen[]>([]);
  const [filteredCitizens, setFilteredCitizens] = useState<Citizen[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<Citizen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [milestoneFilter, setMilestoneFilter] = useState('All');
  const [payoutStatus, setPayoutStatus] = useState<Record<number, string>>({});
  
  // Applications list
  const [submittedApplications, setSubmittedApplications] = useState<Record<number, ApplicationForm>>({});

  // Cash gifts applications list fetched from API
  const [cashGifts, setCashGifts] = useState<any[]>([]);
  const [filteredCashGifts, setFilteredCashGifts] = useState<any[]>([]);

  // Form states
  const [selectedCitizenForForm, setSelectedCitizenForForm] = useState<Citizen | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<ApplicationForm | null>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const [selectedCitizenForDetails, setSelectedCitizenForDetails] = useState<Citizen | null>(null);
  const [selectedCitizenForPreview, setSelectedCitizenForPreview] = useState<Citizen | null>(null);

  const [openMenuCitizenId, setOpenMenuCitizenId] = useState<number | null>(null);
  const [statusModalCitizen, setStatusModalCitizen] = useState<Citizen | null>(null);
  const [deleteConfirmCitizen, setDeleteConfirmCitizen] = useState<Citizen | null>(null);
  const [requiredFormModalCitizen, setRequiredFormModalCitizen] = useState<Citizen | null>(null);
  const [disapprovalModalCitizen, setDisapprovalModalCitizen] = useState<Citizen | null>(null);
  const [disapprovalInputReason, setDisapprovalInputReason] = useState<string>('');
  const [historyModalApp, setHistoryModalApp] = useState<any | null>(null);

  const getCleanStatus = (citizenId: number): 'Pending' | 'Completed' | 'Submitted' | 'Approved' | 'Disapproved' => {
    const rawStatus = String(payoutStatus[citizenId] || 'Pending').toLowerCase();
    if (rawStatus === 'pending' || rawStatus === 'pending national payout') return 'Pending';
    if (rawStatus === 'requirements completed' || rawStatus === 'completed' || rawStatus === 'document validation') return 'Completed';
    if (rawStatus === 'submitted') return 'Submitted';
    if (rawStatus === 'approved' || rawStatus === 'disbursed / paid' || rawStatus === 'disbursed' || rawStatus === 'paid') return 'Approved';
    if (rawStatus === 'disapproved' || rawStatus === 'lgu disapproved' || rawStatus === 'rejected') return 'Disapproved';
    return 'Pending';
  };

  const getStatusHistory = (app: any) => {
    const citizenId = Number(app.application_id || app.id || app.citizen_id || app.user_id);
    const rawStatus = app.application_status || 'Pending';
    const currentStatus = (rawStatus === 'Completed' || rawStatus === 'Requirements Completed') ? 'Requirements Completed' : rawStatus;
    const lastUpdatedStr = app.updated_at || app.created_at || new Date().toISOString();
    const lastUpdated = new Date(lastUpdatedStr);

    // Check if we have manually tracked histories in localStorage
    const savedHistoryJSON = localStorage.getItem('centenarian_status_histories');
    if (savedHistoryJSON) {
      try {
        const savedHistories = JSON.parse(savedHistoryJSON);
        if (savedHistories[citizenId] && Array.isArray(savedHistories[citizenId])) {
          return savedHistories[citizenId];
        }
      } catch (e) {
        console.error("Error reading saved status histories", e);
      }
    }

    // Otherwise, auto-generate a realistic sequence based on current status
    const history = [];

    // Always starts with registered / pending
    const datePending = new Date(lastUpdated.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    history.push({
      status: 'Pending',
      updated_at: datePending.toISOString(),
      notes: 'Application registered and placed in queue.'
    });

    if (currentStatus === 'Pending') {
      // Just show pending, but set the actual updated_at
      history[0].updated_at = lastUpdatedStr;
      return history;
    }

    // Requirements Completed
    const dateCompleted = new Date(lastUpdated.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    history.push({
      status: 'Requirements Completed',
      updated_at: currentStatus === 'Requirements Completed' ? lastUpdatedStr : dateCompleted.toISOString(),
      notes: 'All mandatory requirements and files compiled and verified.'
    });

    if (currentStatus === 'Requirements Completed') {
      return history;
    }

    // Submitted
    const dateSubmitted = new Date(lastUpdated.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    history.push({
      status: 'Submitted',
      updated_at: currentStatus === 'Submitted' ? lastUpdatedStr : dateSubmitted.toISOString(),
      notes: 'Application submitted to national office for program approval.'
    });

    if (currentStatus === 'Submitted') {
      return history;
    }

    // Approved or Disapproved
    if (currentStatus === 'Approved') {
      history.push({
        status: 'Approved',
        updated_at: lastUpdatedStr,
        notes: 'Benefit application officially approved by the OSCA office.'
      });
    } else if (currentStatus === 'Disapproved') {
      history.push({
        status: 'Disapproved',
        updated_at: lastUpdatedStr,
        notes: app.disapproval_reason || 'Incomplete or mismatching civil documents.'
      });
    }

    return history;
  };

  const handleDeleteApplication = async (citizenId: number) => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await fetch(`${API_URL}/cashgifts/${citizenId}`, {
        method: "DELETE",
        headers
      });

      // Update state
      const updatedApps = { ...submittedApplications };
      delete updatedApps[citizenId];
      setSubmittedApplications(updatedApps);
      localStorage.setItem('centenarian_submitted_forms', JSON.stringify(updatedApps));

      // Reset status to Pending
      const updatedPayouts = { ...payoutStatus, [citizenId]: 'Pending' };
      setPayoutStatus(updatedPayouts);
      localStorage.setItem('centenarian_payout_statuses', JSON.stringify(updatedPayouts));
      
      toast.success("Application deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      // Fallback
      const updatedApps = { ...submittedApplications };
      delete updatedApps[citizenId];
      setSubmittedApplications(updatedApps);
      localStorage.setItem('centenarian_submitted_forms', JSON.stringify(updatedApps));

      const updatedPayouts = { ...payoutStatus, [citizenId]: 'Pending' };
      setPayoutStatus(updatedPayouts);
      localStorage.setItem('centenarian_payout_statuses', JSON.stringify(updatedPayouts));
      toast.success("Application deleted (local database fallback)");
    } finally {
      setDeleteConfirmCitizen(null);
    }
  };

  // Milestone categories helper
  const getMilestoneCategory = (age: number): string => {
    if (age >= 100) return '100+ (Centenarian)';
    if (age >= 95 && age < 100) return '95 Years Old';
    if (age >= 90 && age < 95) return '90 Years Old';
    if (age >= 85 && age < 90) return '85 Years Old';
    if (age >= 80 && age < 85) return '80 Years Old';
    return 'Under Age';
  };

  const BARANGAYS = [
    'Addition Hills', 'Balong-Bato', 'Batis', 'Corazon de Jesus', 'Ermitaño', 
    'Greenhills', 'Isabelita', 'Kabayanan', 'Little Baguio', 'Maytunas', 
    'Onse', 'Pasadena', 'Pedro Cruz', 'Progreso', 'Rivera', 'Saint Joseph', 
    'Salapan', 'San Perfecto', 'Santa Lucia', 'Tibagan', 'West Crame'
  ];

  const MILESTONES = [
    'All', '80 Years Old', '85 Years Old', '90 Years Old', '95 Years Old', '100+ (Centenarian)'
  ];

  const fetchCitizens = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = `${API_URL}/masterlist?per_page=5000`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      let rawData: any[] = [];
      if (result.data && Array.isArray(result.data.data)) {
        rawData = result.data.data;
      } else if (Array.isArray(result.data)) {
        rawData = result.data;
      } else if (Array.isArray(result)) {
        rawData = result;
      }

      // Ensure every citizen has a valid numeric id and citizen_id
      const data: Citizen[] = rawData.map((c: any) => {
        const idVal = Number(c.id || c.citizen_id || 0);
        const bDate = c.birthdate || c.birth_date || '';
        return {
          ...c,
          id: idVal,
          citizen_id: idVal,
          birth_date: bDate,
          birthdate: bDate
        };
      });

      setAllMasterlist(data);

      // Filter seniors who are 80+ for Management registry program
      const eligibleSeniors = data.filter((c: Citizen) => c.age >= 80);
      setCitizens(eligibleSeniors);

      // Load mock/local payout statuses from localStorage for persistence in preview
      const savedStatuses = localStorage.getItem('centenarian_payout_statuses');
      if (savedStatuses) {
        setPayoutStatus(JSON.parse(savedStatuses));
      } else {
        setPayoutStatus({});
      }

      // Load submitted applications from backend API
      try {
        const appsResponse = await fetch(`${API_URL}/cashgifts`, {
          method: "GET",
          headers
        });
        if (appsResponse.ok) {
          const result = await appsResponse.json();
          let appsPayloads: any[] = [];
          if (result) {
            if (Array.isArray(result)) {
              appsPayloads = result;
            } else if (result.data) {
              if (Array.isArray(result.data)) {
                appsPayloads = result.data;
              } else if (result.data.data && Array.isArray(result.data.data)) {
                appsPayloads = result.data.data;
              } else if (typeof result.data === 'object') {
                appsPayloads = [result.data];
              }
            } else if (typeof result === 'object') {
              appsPayloads = [result];
            }
          }

          const mappedApps: Record<number, ApplicationForm> = {};
          const syncedPayouts = savedStatuses ? JSON.parse(savedStatuses) : {};

          appsPayloads.forEach((payload: any) => {
            const mappedForm = mapBackendToForm(payload);
            mappedApps[mappedForm.citizen_id] = mappedForm;
            // Align status if exists
            const statusVal = payload.application_status || payload.reg_status || payload.status;
            if (statusVal) {
              syncedPayouts[mappedForm.citizen_id] = statusVal;
            }
          });

          localStorage.setItem('centenarian_submitted_forms', JSON.stringify(mappedApps));
          setSubmittedApplications(mappedApps);
          setCashGifts(appsPayloads);

          if (Object.keys(syncedPayouts).length > 0) {
            setPayoutStatus(syncedPayouts);
            localStorage.setItem('centenarian_payout_statuses', JSON.stringify(syncedPayouts));
          }
        } else {
          throw new Error("API failed");
        }
      } catch (apiErr) {
        console.warn("Could not fetch centenarian apps from API, falling back to localStorage", apiErr);
        // Load submitted applications
        const savedApplications = localStorage.getItem('centenarian_submitted_forms');
        if (savedApplications) {
          const parsedApps = JSON.parse(savedApplications);
          setSubmittedApplications(parsedApps);
          setCashGifts(Object.values(parsedApps));
        } else {
          setSubmittedApplications({});
          setCashGifts([]);
        }
      }

    } catch (err: any) {
      console.error("Failed to load eligible citizens:", err);
      toast.error("Failed to load candidate registry");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCitizens();
  }, [fetchCitizens]);

  // Handle filtering
  useEffect(() => {
    // 1. Management Filter
    // Show all candidate citizens so the administrator can see who has registered and register/apply for others
    let managementResult = citizens;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      managementResult = managementResult.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(term) ||
        (c.middle_name && c.middle_name.toLowerCase().includes(term))
      );
    }
    if (barangayFilter !== 'All') {
      managementResult = managementResult.filter(c => c.barangay === barangayFilter);
    }
    if (milestoneFilter !== 'All') {
      managementResult = managementResult.filter(c => getMilestoneCategory(c.age) === milestoneFilter);
    }
    setFilteredCitizens(managementResult);

    // 1.5 CashGifts Management Filter (Displays actual centenarian applications from /api/cashgifts)
    let cashGiftsResult = cashGifts;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      cashGiftsResult = cashGiftsResult.filter(app => {
        const fullName = `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase();
        const scid = (app.scid_number || '').toLowerCase();
        const rrn = (app.ncs_registration_reference_no || '').toLowerCase();
        return fullName.includes(term) || scid.includes(term) || rrn.includes(term);
      });
    }
    if (barangayFilter !== 'All') {
      cashGiftsResult = cashGiftsResult.filter(app => {
        const b = String(app.res_barangay || app.perm_barangay || '').toLowerCase();
        return b === barangayFilter.toLowerCase();
      });
    }
    if (milestoneFilter !== 'All') {
      cashGiftsResult = cashGiftsResult.filter(app => {
        const milestoneAgeStr = String(app.milestone_age || '');
        if (milestoneFilter.includes('80') && milestoneAgeStr === '80') return true;
        if (milestoneFilter.includes('85') && milestoneAgeStr === '85') return true;
        if (milestoneFilter.includes('90') && milestoneAgeStr === '90') return true;
        if (milestoneFilter.includes('95') && milestoneAgeStr === '95') return true;
        if (milestoneFilter.includes('100') && (milestoneAgeStr === '100' || Number(milestoneAgeStr) >= 100)) return true;
        return false;
      });
    }
    setFilteredCashGifts(cashGiftsResult);

    // 2. Applicants Table Filter (Display masterlist citizens having approved ID and released status)
    let applicantsResult = allMasterlist.filter(c => {
      const idStatus = (c.id_status || '').toLowerCase();
      const isApprovedOrReleased = idStatus === 'released' || idStatus === 'approved';
      const is80OrAbove = c.age >= 80;
      if (!isApprovedOrReleased || !is80OrAbove) return false;

      // Determine c's milestone eligibility
      let cMilestoneAge = 80;
      if (c.age >= 100) cMilestoneAge = 100;
      else if (c.age >= 95) cMilestoneAge = 95;
      else if (c.age >= 90) cMilestoneAge = 90;
      else if (c.age >= 85) cMilestoneAge = 85;
      else cMilestoneAge = 80;

      // Exclude if there is a record in management (cashGifts) with the same SCID number and the same milestone age
      const hasDuplicateInManagement = cashGifts.some(app => {
        const appScid = (app.scid_number || '').trim().toLowerCase();
        const cScid = (c.scid_number || '').trim().toLowerCase();
        if (!cScid || !appScid) return false;

        const isSameScid = appScid === cScid;
        const appMilestoneAge = Number(app.milestone_age || 80);
        return isSameScid && appMilestoneAge === cMilestoneAge;
      });

      return !hasDuplicateInManagement;
    });
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      applicantsResult = applicantsResult.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(term) ||
        (c.middle_name && c.middle_name.toLowerCase().includes(term))
      );
    }
    if (barangayFilter !== 'All') {
      applicantsResult = applicantsResult.filter(c => c.barangay === barangayFilter);
    }
    setFilteredApplicants(applicantsResult);

  }, [citizens, allMasterlist, cashGifts, searchTerm, barangayFilter, milestoneFilter, submittedApplications]);

  const updateStatus = async (citizenId: number, status: string, reason?: string) => {
    const updated = { ...payoutStatus, [citizenId]: status };
    setPayoutStatus(updated);
    localStorage.setItem('centenarian_payout_statuses', JSON.stringify(updated));

    // Track in centenarian_status_histories
    try {
      const savedHistoryJSON = localStorage.getItem('centenarian_status_histories');
      const savedHistories = savedHistoryJSON ? JSON.parse(savedHistoryJSON) : {};
      
      const app = cashGifts.find(item => Number(item.application_id || item.id || item.citizen_id || item.user_id) === citizenId) || {};
      const currentHist = savedHistories[citizenId] || getStatusHistory({
        ...app,
        application_id: citizenId,
        application_status: app.application_status || 'Pending'
      });
      
      const cleanStatusLabel = status === 'Completed' ? 'Requirements Completed' : status;
      const newEntry = {
        status: cleanStatusLabel,
        updated_at: new Date().toISOString(),
        notes: cleanStatusLabel === 'Disapproved' && reason 
          ? reason 
          : (cleanStatusLabel === 'Approved' 
            ? 'Benefit application officially approved by the OSCA office.' 
            : (cleanStatusLabel === 'Submitted'
              ? 'Application submitted to national office for program approval.'
              : `Status updated to ${cleanStatusLabel}.`))
      };
      
      // Update or push
      const latest = currentHist[currentHist.length - 1];
      if (latest && latest.status === newEntry.status) {
        currentHist[currentHist.length - 1] = newEntry;
      } else {
        currentHist.push(newEntry);
      }
      
      savedHistories[citizenId] = currentHist;
      localStorage.setItem('centenarian_status_histories', JSON.stringify(savedHistories));
    } catch (historyErr) {
      console.error("Failed to update status history log:", historyErr);
    }

    // Update locally first for high responsiveness
    const existingForm = submittedApplications[citizenId];
    if (existingForm) {
      const updatedForm = { ...existingForm, status, disapproval_reason: reason || '' };
      const updatedApps = { ...submittedApplications, [citizenId]: updatedForm };
      setSubmittedApplications(updatedApps);
      localStorage.setItem('centenarian_submitted_forms', JSON.stringify(updatedApps));
    }

    // Update cashGifts state immediately
    setCashGifts(prev => prev.map(item => {
      const itemCitizenId = Number(item.application_id || item.id || item.citizen_id || item.user_id);
      if (itemCitizenId === citizenId) {
        return {
          ...item,
          application_status: status,
          disapproval_reason: reason || item.disapproval_reason,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    }));

    // Try to sync with backend if application exists
    const rawApp = cashGifts.find(item => Number(item.application_id || item.id || item.citizen_id || item.user_id) === citizenId);

    if (rawApp || existingForm) {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Accept": "application/json"
        };
        if (token && token !== 'undefined' && token !== 'null') {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const updatedAtTimestamp = new Date().toISOString();
        const payload: any = {
          application_id: Number(rawApp?.application_id || citizenId || existingForm?.citizen_id),
          application_status: status,
          updated_at: updatedAtTimestamp
        };
        if (reason) {
          payload.disapproval_reason = reason;
        }

        await fetch(`${API_URL}/cashgifts/${citizenId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed to sync status to backend:", err);
      }
    }
    toast.success("Validation status updated successfully");
  };

  const updateDisbursementStatus = async (citizenId: number, dispStatus: string) => {
    // Update cashGifts state immediately
    setCashGifts(prev => prev.map(item => {
      const itemCitizenId = Number(item.application_id || item.id || item.citizen_id || item.user_id);
      if (itemCitizenId === citizenId) {
        return {
          ...item,
          disbursement_status: dispStatus,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    }));

    // Update locally first
    const existingForm = submittedApplications[citizenId];
    if (existingForm) {
      const updatedForm = { ...existingForm, disbursement_status: dispStatus };
      const updatedApps = { ...submittedApplications, [citizenId]: updatedForm };
      setSubmittedApplications(updatedApps);
      localStorage.setItem('centenarian_submitted_forms', JSON.stringify(updatedApps));
    }

    // Try to sync with backend if application exists
    const rawApp = cashGifts.find(item => Number(item.application_id || item.id || item.citizen_id || item.user_id) === citizenId);

    if (rawApp || existingForm) {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Accept": "application/json"
        };
        if (token && token !== 'undefined' && token !== 'null') {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const updatedAtTimestamp = new Date().toISOString();
        const payload: any = {
          application_id: Number(rawApp?.application_id || citizenId || existingForm?.citizen_id),
          disbursement_status: dispStatus,
          updated_at: updatedAtTimestamp
        };

        await fetch(`${API_URL}/cashgifts/${citizenId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed to sync disbursement status to backend:", err);
      }
    }
    toast.success("Disbursement status updated successfully");
  };

  const handleApplyClick = (citizen: Citizen) => {
    let defaultMilestone = 80;
    if (citizen.age >= 100) defaultMilestone = 100;
    else if (citizen.age >= 95) defaultMilestone = 95;
    else if (citizen.age >= 90) defaultMilestone = 90;
    else if (citizen.age >= 85) defaultMilestone = 85;
    else defaultMilestone = 80;

    const existingForm = submittedApplications[citizen.id];

    if (existingForm) {
      setFormData({
        ...existingForm,
        user_id: existingForm.user_id || citizen.user_id,
        birth_date: (existingForm.birth_date || '').split('T')[0]
      });
    } else {
      const resAddressCombined = citizen.address || [
        (citizen as any).res_house_no || citizen.house_number || (citizen as any).res_house_num || (citizen as any).house_no || '',
        (citizen as any).res_street || citizen.street || ''
      ].filter(Boolean).join(' ');

      const permAddressCombined = citizen.address || [
        (citizen as any).perm_house_no || (citizen as any).perm_house_num || '',
        (citizen as any).perm_street || ''
      ].filter(Boolean).join(' ');

      setFormData({
        citizen_id: citizen.id,
        user_id: citizen.user_id,
        milestone_age: Number((citizen as any).milestone_age || defaultMilestone),
        rrn: (citizen as any).ncs_registration_reference_no || '',
        osca_id_number: citizen.scid_number || `OSCA-SJ-${citizen.id.toString().padStart(5, '0')}`,
        last_name: citizen.last_name,
        first_name: citizen.first_name,
        middle_name: citizen.middle_name || '',
        birth_date: (citizen.birth_date || citizen.birthdate || '').split('T')[0],
        age: citizen.age,
        sex: (citizen.sex === 'Female' || citizen.sex === 'F' || (citizen as any).gender === 'Female' || (citizen as any).gender === 'F') ? 'Female' : 'Male',
        civil_status: citizen.civil_status || 'Single',
        citizenship: (citizen as any).citizenship || 'Filipino',
        applicant_type: (citizen as any).applicant_type || 'Local',
        dual_citizenship_details: '',
        
        res_house_num: resAddressCombined,
        res_street: '',
        res_barangay: citizen.barangay || (citizen as any).res_barangay || '',
        res_city: citizen.city_municipality || (citizen as any).res_city || 'San Juan',
        res_province: citizen.province || (citizen as any).res_province || 'Metro Manila',
        res_zip: (citizen as any).res_zip_code || (citizen as any).res_zip || '1500',

        perm_house_num: permAddressCombined || resAddressCombined,
        perm_street: '',
        perm_barangay: citizen.barangay || (citizen as any).perm_barangay || '',
        perm_city: citizen.city_municipality || (citizen as any).perm_city || 'San Juan',
        perm_province: citizen.province || (citizen as any).perm_province || 'Metro Manila',
        perm_zip: (citizen as any).perm_zip_code || (citizen as any).perm_zip || '1500',

        spouse_name: (citizen as any).spouse_name || '',
        spouse_citizenship: (citizen as any).spouse_citizenship || 'Filipino',
        children: ['', '', ''],
        representatives: [
          { name: '', relationship: '' },
          { name: '', relationship: '' }
        ],

        phone: citizen.contact_number || (citizen as any).contact_numbers || '',
        email: (citizen as any).email_address || (citizen as any).email || '',

        primary_beneficiary: '',
        primary_relationship: '',
        contingent_beneficiary: '',
        contingent_relationship: '',

        utilization_food: true,
        utilization_med_checkup: true,
        utilization_medicines: true,
        utilization_livelihood: false,
        utilization_others: false,
        utilization_others_details: '',

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

        signature_type: 'draw',
        signature_data: '',
        signature: '',
        thumbmark: '',
        req_b_url: '',
        req_c_url: '',

        signed_by_applicant: true,
        date_applied: new Date().toISOString().split('T')[0]
      });
    }

    setSelectedCitizenForForm(citizen);
    setFormStep(1);
    setIsFormOpen(true);
    setIsFormSubmitted(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    if (formStep === 1) {
      const form = document.getElementById('expanded-centenarian-form') as HTMLFormElement | null;
      if (form) {
        if (form.reportValidity()) {
          setFormStep(2);
          form.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setFormStep(2);
      }
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = mapFormToBackend(formData, formData.citizen_id);

      const isEditing = !!submittedApplications[formData.citizen_id];
      const url = isEditing ? `${API_URL}/cashgifts/${formData.citizen_id}` : `${API_URL}/cashgifts`;

      const fd = createFormDataFromPayload(payload);
      if (isEditing) {
        fd.append('_method', 'PUT');
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: fd
      });

      if (!response.ok) {
        let errDetail = "";
        try {
          const errData = await response.json();
          if (errData && errData.errors) {
            errDetail = Object.entries(errData.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join(' | ');
          } else if (errData && errData.message) {
            errDetail = errData.message;
          } else if (errData) {
            errDetail = JSON.stringify(errData);
          }
        } catch (_) {
          try {
            errDetail = await response.text();
          } catch (_) {}
        }
        throw new Error(`Failed with status ${response.status}${errDetail ? ': ' + errDetail : ''}`);
      }

      const responseData = await response.json();
      const rawApp = responseData?.data || responseData;
      const mappedForm = mapBackendToForm(rawApp);

      // Save submission to state and localStorage
      const updatedApps = { ...submittedApplications, [mappedForm.citizen_id]: mappedForm };
      setSubmittedApplications(updatedApps);
      localStorage.setItem('centenarian_submitted_forms', JSON.stringify(updatedApps));

      // Update cashGifts state to reflect in management immediately
      setCashGifts(prev => {
        const index = prev.findIndex(item => Number(item.application_id || item.id || item.citizen_id || item.user_id) === mappedForm.citizen_id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = rawApp;
          return updated;
        } else {
          return [...prev, rawApp];
        }
      });

      // Update payout registry status to "Document Validation"
      const updatedPayouts = { ...payoutStatus, [formData.citizen_id]: 'Document Validation' };
      setPayoutStatus(updatedPayouts);
      localStorage.setItem('centenarian_payout_statuses', JSON.stringify(updatedPayouts));

      toast.success(`NCSC Application Form Annex "A" saved successfully for ${formData.first_name} ${formData.last_name}`);
      setIsFormSubmitted(true);
      fetchCitizens();
    } catch (err: any) {
      console.error("Failed to submit form:", err);
      toast.error(`API submission failed: ${err.message || err}. Saved to local storage fallback.`);
      
      // Fallback
      const updatedApps = { ...submittedApplications, [formData.citizen_id]: formData };
      setSubmittedApplications(updatedApps);
      localStorage.setItem('centenarian_submitted_forms', JSON.stringify(updatedApps));

      const updatedPayouts = { ...payoutStatus, [formData.citizen_id]: 'Document Validation' };
      setPayoutStatus(updatedPayouts);
      localStorage.setItem('centenarian_payout_statuses', JSON.stringify(updatedPayouts));
      setIsFormSubmitted(true);
    }
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const form = document.getElementById('expanded-centenarian-form') as HTMLFormElement | null;
    if (form) {
      if (form.reportValidity()) {
        setFormStep(2);
        form.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setFormStep(2);
    }
  };

  // Stats calculation
  const stats = {
    total: citizens.length,
    centenarians: citizens.filter(c => c.age >= 100).length,
    nonagenarians: citizens.filter(c => c.age >= 90 && c.age < 100).length,
    octogenarians: citizens.filter(c => c.age >= 80 && c.age < 90).length,
    paid: Object.values(payoutStatus).filter(s => s === 'Disbursed / Paid').length,
    pending: Object.values(payoutStatus).filter(s => s === 'Pending National Payout' || s === 'Document Validation').length,
    applicationsSubmitted: Object.keys(submittedApplications).length,
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <header className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Expanded Centenarians Act Benefit Program (National)</h2>
          <p className="text-slate-500 font-medium mt-1">Registry of local candidates for National milestone cash gifts (80, 85, 90, 95, 100+ years old)</p>
        </header>
      )}

      {/* Info Banner hidden */}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Eligible Candidate Pool</span>
            <strong className="text-3xl font-black text-slate-950 mt-1 block">{isLoading ? '...' : stats.total}</strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">NCSC Annex "A" Forms</span>
            <strong className="text-3xl font-black text-indigo-600 mt-1 block">{isLoading ? '...' : stats.applicationsSubmitted}</strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Octo & Nona-genarians</span>
            <strong className="text-3xl font-black text-amber-600 mt-1 block">{isLoading ? '...' : stats.octogenarians + stats.nonagenarians}</strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Submissions Validated</span>
            <strong className="text-3xl font-black text-emerald-600 mt-1 block">{isLoading ? '...' : stats.paid}</strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('management'); setSearchTerm(''); }}
          className={cn(
            "py-3 px-6 font-bold text-sm tracking-wide border-b-2 transition-all cursor-pointer font-sans",
            activeTab === 'management'
              ? "border-[#ef4444] text-[#ef4444]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Management
        </button>
        <button
          onClick={() => { setActiveTab('applicants'); setSearchTerm(''); }}
          className={cn(
            "py-3 px-6 font-bold text-sm tracking-wide border-b-2 transition-all cursor-pointer font-sans",
            activeTab === 'applicants'
              ? "border-[#ef4444] text-[#ef4444]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Applicant Table
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        {/* Filter Toolbar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'management' ? "Search candidates by name..." : "Search released/approved ID citizens by name..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-sans"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchCitizens}
              className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 font-medium text-xs font-sans"
              title="Refresh Registry"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Masterlist</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Milestone Filter - only show in candidate management tab */}
            {activeTab === 'management' && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Milestone:</span>
                <select
                  value={milestoneFilter}
                  onChange={(e) => setMilestoneFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer font-sans"
                >
                  {MILESTONES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Barangay Filter */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Barangay:</span>
              <select
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer font-sans"
              >
                <option value="All">All Barangays</option>
                {BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Citizens List - Management Tab */}
        {activeTab === 'management' && (
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="font-bold text-slate-500 text-xs uppercase tracking-widest font-sans">Loading candidates list...</p>
              </div>
            ) : filteredCashGifts.length === 0 ? (
              <div className="py-24 text-center text-slate-400">
                <AlertCircle className="w-12 h-12 opacity-20 mx-auto mb-4" />
                <p className="font-bold text-slate-500 text-xs uppercase tracking-widest font-sans">No applications found matching the filters</p>
                <p className="text-xs text-slate-400 mt-1 font-sans">Try resetting your search or filter inputs</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">Applied date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">SCID Number</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">Fullname</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">Age & Birthdate</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">Barangay</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">Program Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">Applicant Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">Disbursement Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider font-sans">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCashGifts.map((app) => {
                    const citizenId = Number(app.application_id || app.id || app.citizen_id || app.user_id);
                    const milestoneAge = app.milestone_age || '80';
                    const milestone = `${milestoneAge} Years Old` + (Number(milestoneAge) >= 100 ? ' (Centenarian)' : '');
                    
                    const appliedDateStr = app.application_date ? app.application_date.split('T')[0] : (app.created_at ? new Date(app.created_at).toISOString().split('T')[0] : 'N/A');
                    const statusVal = app.application_status || 'Pending';
                    const fullName = `${app.last_name || ''}, ${app.first_name || ''} ${app.middle_name || ''}`.trim();
                    const scidNumber = app.scid_number || 'N/A';
                    const barangay = app.res_barangay || app.perm_barangay || 'N/A';
                    const birthdate = app.birthdate ? app.birthdate.split('T')[0] : 'N/A';
                    const age = app.age || Number(milestoneAge) || 80;

                    const virtualCitizen: Citizen = {
                      id: citizenId,
                      first_name: app.first_name || '',
                      last_name: app.last_name || '',
                      middle_name: app.middle_name || '',
                      birth_date: birthdate,
                      age: age,
                      barangay: barangay,
                      scid_number: app.scid_number || undefined,
                      civil_status: app.civil_status || undefined,
                    };

                    return (
                      <tr key={app.application_id || citizenId} className="hover:bg-slate-50/50 transition-colors">
                        {/* Applied date */}
                        <td className="px-6 py-4">
                          <p className="text-xs font-medium text-slate-500 font-sans">{appliedDateStr}</p>
                        </td>

                        {/* SCID Number */}
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-600 font-mono tracking-wider">{scidNumber}</p>
                        </td>

                        {/* Fullname */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900 font-sans">{fullName}</p>
                        </td>

                        {/* Age & Birthdate */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-800 font-sans">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{age} y/o</span>
                          </div>
                          <div className="text-xs font-medium text-slate-400 mt-0.5 font-sans">
                            {birthdate !== 'N/A' ? new Date(birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No Birthdate'}
                          </div>
                        </td>

                        {/* Barangay */}
                        <td className="px-6 py-4">
                          <p className="text-xs font-medium text-slate-500 font-sans">{barangay}</p>
                        </td>

                        {/* Program Category */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wider font-sans",
                            age >= 100 ? "text-indigo-600" : "text-amber-600"
                          )}>
                            {milestone}
                          </span>
                        </td>

                        {/* Applicant Type */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wider font-sans",
                            (app.applicant_type || 'Local').toLowerCase() === 'living abroad'
                              ? "text-rose-600"
                              : "text-teal-600"
                          )}>
                            {app.applicant_type || 'Local'}
                          </span>
                        </td>

                         {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryModalApp(app);
                            }}
                            className="group inline-flex flex-col items-center gap-1 cursor-pointer text-center focus:outline-none"
                            title="Click to view status history"
                          >
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider font-sans shadow-sm transition-all group-hover:scale-105",
                              statusVal === 'Pending' && "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100",
                              (statusVal === 'Requirements Completed' || statusVal === 'Completed') && "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100",
                              statusVal === 'Submitted' && "bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-100",
                              statusVal === 'Approved' && "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100",
                              statusVal === 'Disapproved' && "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100"
                            )}>
                              {statusVal === 'Pending' ? "Pending" : 
                               (statusVal === 'Requirements Completed' || statusVal === 'Completed') ? "Requirements Completed" : 
                               statusVal === 'Submitted' ? "Submitted" : 
                               statusVal === 'Approved' ? "Approved" : 
                               statusVal === 'Disapproved' ? "Disapproved" : statusVal}
                            </span>
                            <span className="text-[9px] text-slate-400 font-sans group-hover:text-slate-600 transition-colors">
                              View History
                            </span>
                          </button>
                        </td>

                        {/* Disbursement Status */}
                        <td className="px-6 py-4 text-center">
                          {statusVal === 'Approved' ? (
                            <select
                              value={['Pending', 'For Release', 'Claimed'].find(
                                s => s.toLowerCase() === (app.disbursement_status || 'Pending').toLowerCase()
                              ) || 'Pending'}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateDisbursementStatus(citizenId, e.target.value);
                              }}
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider rounded border px-2 py-1 outline-none transition-all cursor-pointer font-sans shadow-sm",
                                (app.disbursement_status || 'Pending').toLowerCase() === 'claimed' && "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/50",
                                (app.disbursement_status || 'Pending').toLowerCase() === 'for release' && "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100/50",
                                ((app.disbursement_status || 'Pending').toLowerCase() === 'pending' || !app.disbursement_status) && "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50"
                              )}
                            >
                              <option value="Pending">Pending</option>
                              <option value="For Release">For Release</option>
                              <option value="Claimed">Claimed</option>
                            </select>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider font-sans bg-slate-50 text-slate-400 border-slate-200">
                              Pending (Locked)
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 relative">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuCitizenId(openMenuCitizenId === citizenId ? null : citizenId);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-800 focus:outline-none"
                              aria-label="Actions"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuCitizenId === citizenId && (
                              <>
                                {/* Click Backdrop to Close Menu */}
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuCitizenId(null);
                                  }} 
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 mt-1 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl z-20 p-1.5 text-left divide-y divide-slate-50">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setSelectedCitizenForDetails(virtualCitizen);
                                        setOpenMenuCitizenId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <FileText className="w-4 h-4 text-slate-400" />
                                      <span>View Details</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        handleApplyClick(virtualCitizen);
                                        setOpenMenuCitizenId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <ClipboardList className="w-4 h-4 text-slate-400" />
                                      <span>Edit Form Annex A</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setOpenMenuCitizenId(null);
                                        setStatusModalCitizen(virtualCitizen);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <Clock className="w-4 h-4 text-slate-400" />
                                      <span>Change Status</span>
                                    </button>

                                    {(statusVal === 'Requirements Completed' || statusVal === 'Completed' || statusVal === 'Approved' || statusVal === 'Submitted') && (
                                      <button
                                        onClick={() => {
                                          setSelectedCitizenForPreview(virtualCitizen);
                                          setOpenMenuCitizenId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                        <span>Preview forms</span>
                                      </button>
                                    )}
                                  </div>

                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setDeleteConfirmCitizen(virtualCitizen);
                                        setOpenMenuCitizenId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4 text-rose-500" />
                                      <span>Delete Application</span>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Citizens List - Applicant Table Tab */}
        {activeTab === 'applicants' && (
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="font-bold text-slate-500 text-xs uppercase tracking-widest font-sans">Loading applicant masterlist...</p>
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="py-24 text-center text-slate-400">
                <AlertCircle className="w-12 h-12 opacity-20 mx-auto mb-4" />
                <p className="font-bold text-slate-500 text-xs uppercase tracking-widest font-sans">No citizens with approved and released ID found</p>
                <p className="text-xs text-slate-400 mt-1 font-sans">Ensure citizens in the masterlist have their senior IDs issued & released.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6 font-sans">SCID Number</th>
                    <th className="py-4 px-6 font-sans">Fullname</th>
                    <th className="py-4 px-6 font-sans">Age & Birthdate</th>
                    <th className="py-4 px-6 font-sans">Barangay</th>
                    <th className="py-4 px-6 font-sans">Centenarian Milestone Eligibility</th>
                    <th className="py-4 px-6 text-center font-sans">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplicants.map((c) => {
                    const isAgeEligible = c.age >= 80;
                    const milestone = getMilestoneCategory(c.age);
                    const hasAnnexA = submittedApplications[c.id];
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* SCID Number */}
                        <td className="py-4 px-6 font-mono text-xs text-slate-600">
                          {c.scid_number || 'N/A'}
                        </td>

                        {/* Fullname */}
                        <td className="py-4 px-6 font-bold text-slate-900 font-sans">
                          {c.last_name}, {c.first_name} {c.middle_name || ''}
                        </td>

                        {/* Age & Birthdate */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 font-sans">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.age} years old</span>
                          </div>
                          <div className="text-xs font-medium text-slate-400 mt-0.5 font-sans">
                            {c.birth_date ? new Date(c.birth_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No Birthdate'}
                          </div>
                        </td>

                        {/* Barangay */}
                        <td className="py-4 px-6 font-medium text-slate-700 font-sans text-xs">
                          {c.barangay}
                        </td>

                        {/* Centenarian Milestone Eligibility */}
                        <td className="py-4 px-6">
                          {isAgeEligible ? (
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans">
                                Eligible ({milestone})
                              </span>
                              <div className="text-[10px] font-semibold text-slate-400 font-sans">Qualifying milestone age reached</div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block bg-slate-100 text-slate-500 border border-slate-200 font-sans">
                                Ineligible
                              </span>
                              <div className="text-[10px] font-semibold text-slate-400 font-sans">Under Age 80</div>
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-6 text-center">
                          {hasAnnexA ? (
                            <button
                              onClick={() => handleApplyClick(c)}
                              className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans shadow-sm border border-indigo-200 flex items-center gap-1.5 mx-auto justify-center"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              <span>Edit Application</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApplyClick(c)}
                              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer font-sans shadow-md flex items-center gap-1.5 mx-auto justify-center"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Apply</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Footer info counts */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500">
          <div>
            {activeTab === 'management' ? (
              <span>Showing <strong className="text-slate-800">{filteredCitizens.length}</strong> of <strong className="text-slate-800">{citizens.length}</strong> candidates</span>
            ) : (
              <span>Showing <strong className="text-slate-800">{filteredApplicants.length}</strong> of <strong className="text-slate-800">{allMasterlist.filter(item => ['released', 'approved'].includes((item.id_status || '').toLowerCase())).length}</strong> approved/released senior citizens</span>
            )}
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Octogenarians: {citizens.filter(c => c.age >= 80 && c.age < 90).length}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Nonagenarians: {citizens.filter(c => c.age >= 90 && c.age < 100).length}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Centenarians: {citizens.filter(c => c.age >= 100).length}</span>
          </div>
        </div>
      </div>

      {/* Official NCSC Application Form Modal */}
      {isFormOpen && formData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col my-8 max-h-[92vh] border border-slate-100">
            {isFormSubmitted ? (
              <>
                {/* Header banner */}
                <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-sans">NCSC National Registry System</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold">RA 11982 Expanded Centenarians Act</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsFormOpen(false); setSelectedCitizenForForm(null); setFormData(null); }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-8 sm:p-12 space-y-8 bg-slate-50/30 text-center flex flex-col items-center justify-center font-sans">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-2 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-2xl font-black text-[#EF4444] tracking-tight font-sans">
                      Application Received
                    </h4>
                    <p className="text-slate-500 font-semibold text-xs font-sans max-w-md">
                      Application successfully logged in registry.
                    </p>
                  </div>

                  {/* Note section with requirements */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left space-y-6 max-w-4xl w-full shadow-sm">
                    <div className="border-b border-slate-200 pb-3">
                      <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-wider font-sans">
                        For requirements please submit the following requirements to the OSCA Office:
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Local Applicants */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
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
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
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
                      onClick={() => { setIsFormOpen(false); setSelectedCitizenForForm(null); setFormData(null); }}
                      className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer font-sans"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Header banner */}
                <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-sans">NCSC National Registry System</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold">RA 11982 Expanded Centenarians Act</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsFormOpen(false); setSelectedCitizenForForm(null); setFormData(null); }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step progress bar */}
            <div className="bg-slate-905 bg-[#0f172a] px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 shrink-0 text-white select-none shadow-md">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-sans font-extrabold tracking-wide">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className={cn(
                    "flex items-center gap-2.5 pb-1 border-b-2 transition-all cursor-pointer",
                    formStep === 1 ? "border-indigo-500 text-indigo-300 font-black" : "border-transparent text-slate-400 hover:text-slate-200 font-medium"
                  )}
                >
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-black", formStep === 1 ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20" : "bg-slate-800 text-slate-400")}>1</span>
                  Applicant Profile & Milestone Info
                </button>
                <div className="hidden sm:block h-5 w-[1px] bg-slate-800" />
                <button
                  type="button"
                  onClick={(e) => {
                    const form = document.getElementById('expanded-centenarian-form') as HTMLFormElement | null;
                    if (form && formStep === 1) {
                      if (form.reportValidity()) {
                        setFormStep(2);
                        form.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    } else {
                      setFormStep(2);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2.5 pb-1 border-b-2 transition-all cursor-pointer",
                    formStep === 2 ? "border-indigo-500 text-indigo-300 font-black" : "border-transparent text-slate-400 hover:text-slate-200 font-medium"
                  )}
                >
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-black", formStep === 2 ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20" : "bg-slate-800 text-slate-400")}>2</span>
                  Sign & Certify
                </button>
              </div>
              <div className="text-[10px] text-indigo-300 font-mono font-bold uppercase tracking-widest bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-900/60 shadow-inner shrink-0">
                Page {formStep} of 2
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form id="expanded-centenarian-form" onSubmit={handleFormSubmit} className="overflow-y-auto flex-1 p-8 md:p-12 space-y-8 bg-slate-50/30">
              
              {formStep === 1 && (
                <>
                  {/* Paper Application Header Mimic */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ef4444] via-blue-600 to-indigo-600" />
                <span className="absolute top-4 right-6 text-[10px] font-bold text-slate-400 font-sans tracking-widest uppercase">Annex "A"</span>
                
                {/* Official NCSC Header Image */}
                <div className="flex justify-center pb-4 border-b border-slate-100">
                  <img 
                    src="https://res.cloudinary.com/dx20khqe5/image/upload/v1783299883/ncsc_wxaaap.png" 
                    alt="National Commission of Senior Citizens" 
                    className="w-full h-auto max-h-[140px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-center space-y-1 py-2">
                  <h3 className="text-xl font-black text-slate-900 font-sans tracking-wide">APPLICATION FORM</h3>
                  <p className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-widest font-sans">OCTOGENARIAN, NONAGENARIAN AND CENTENARIAN BENEFIT PROGRAM</p>
                  <p className="text-xs text-slate-600 max-w-2xl mx-auto pt-1 font-sans">
                    <strong>PURPOSE:</strong> To claim the benefits under Republic Act (R.A.) No. 11982.
                  </p>
                </div>

                {/* Milestone age selection blocks */}
                <div className="bg-indigo-50/20 p-6 rounded-2xl border border-indigo-100/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-indigo-900/60 uppercase tracking-wider block font-sans">Applicant Milestone Age (Automated based on Current Age)</span>
                    <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                      Auto-Calculated
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { age: 80, prize: "₱10,000.00", label: "Octogenarian" },
                      { age: 85, prize: "₱10,000.00", label: "Octo-Milestone" },
                      { age: 90, prize: "₱10,000.00", label: "Nonagenarian" },
                      { age: 95, prize: "₱10,000.00", label: "Nona-Milestone" },
                      { age: 100, prize: "₱100,000.00", label: "Centenarian" }
                    ].map(item => {
                      const active = formData.milestone_age === item.age;
                      return (
                        <div
                          key={item.age}
                          className={cn(
                            "p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[105px] font-sans relative",
                            active 
                              ? "bg-gradient-to-b from-indigo-50 to-white border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/10 shadow-sm scale-[1.02]" 
                              : "bg-white border-slate-100 opacity-60 text-slate-400"
                          )}
                        >
                          {active && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white" title="Active Milestone">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <strong className="text-lg font-black">{item.age}</strong>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1.5",
                            active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                          )}>{item.prize}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-3 font-sans text-right">The cash gift milestone is automatically determined by the applicant's current age ({formData.age} years old).</p>
                </div>
              </div>

              {/* SECTION A: PERSONAL INFORMATION */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">A</span>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">Personal Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">NCSC Registration Reference Number (RRN) (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. RRN-2026-XXXXX"
                      value={formData.rrn || ''}
                      onChange={e => setFormData({ ...formData, rrn: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">OSCA ID Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 12-3456-7890"
                      value={formData.osca_id_number || ''}
                      onChange={e => setFormData({ ...formData, osca_id_number: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">A.1 Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">A.2 Given Name</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">A.3 Middle Name</label>
                    <input
                      type="text"
                      value={formData.middle_name || ''}
                      onChange={e => setFormData({ ...formData, middle_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">A.4 Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={formData.birth_date}
                      onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">A.5 Age</label>
                    <input
                      type="number"
                      required
                      value={formData.age}
                      onChange={e => {
                        const newAge = Number(e.target.value);
                        let mAge = 80;
                        if (newAge >= 100) mAge = 100;
                        else if (newAge >= 95) mAge = 95;
                        else if (newAge >= 90) mAge = 90;
                        else if (newAge >= 85) mAge = 85;
                        else mAge = 80;
                        setFormData({
                          ...formData,
                          age: newAge,
                          milestone_age: mAge
                        });
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">A.8 Gender</label>
                    <select
                      value={formData.sex}
                      onChange={e => setFormData({ ...formData, sex: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer font-sans"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">A.9 Civil Status</label>
                    <select
                      value={formData.civil_status}
                      onChange={e => setFormData({ ...formData, civil_status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer font-sans"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Applicant Type</label>
                    <select
                      value={formData.applicant_type || 'Local'}
                      onChange={e => setFormData({ ...formData, applicant_type: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer font-sans"
                    >
                      <option value="Local">Local</option>
                      <option value="Living Abroad">Living Abroad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">A.10 Citizenship</label>
                    <select
                      value={formData.citizenship}
                      onChange={e => setFormData({ ...formData, citizenship: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer font-sans"
                    >
                      <option value="Filipino">Filipino</option>
                      <option value="Dual citizen">Dual citizen (Specify below)</option>
                    </select>
                  </div>
                  {formData.citizenship !== 'Filipino' && (
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">Dual Citizenship Details</label>
                      <input
                        type="text"
                        placeholder="Please specify country/details"
                        value={formData.dual_citizenship_details || ''}
                        onChange={e => setFormData({ ...formData, dual_citizenship_details: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                      />
                    </div>
                  )}
                </div>

                {/* Residential Address Details */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">A.6 Residential Address / Address Abroad</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">Address (House Number & Street)</label>
                      <input
                        type="text"
                        placeholder="House Number and Street"
                        value={formData.res_house_num || ''}
                        onChange={e => setFormData({ ...formData, res_house_num: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">Barangay</label>
                      <input
                        type="text"
                        required
                        value={formData.res_barangay}
                        onChange={e => setFormData({ ...formData, res_barangay: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">City / Municipality</label>
                      <input
                        type="text"
                        required
                        value={formData.res_city}
                        onChange={e => setFormData({ ...formData, res_city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">Province</label>
                      <input
                        type="text"
                        required
                        value={formData.res_province || ''}
                        onChange={e => setFormData({ ...formData, res_province: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  </div>
                  <div className="w-1/3 sm:w-1/4">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">Zip Code</label>
                    <input
                      type="text"
                      value={formData.res_zip || ''}
                      onChange={e => setFormData({ ...formData, res_zip: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>

                {/* Permanent Address Details */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">A.7 Permanent Address in the Philippines</h5>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          perm_house_num: formData.res_house_num,
                          perm_barangay: formData.res_barangay,
                          perm_city: formData.res_city,
                          perm_province: formData.res_province,
                          perm_zip: formData.res_zip
                        });
                        toast.success("Copied residential address");
                      }}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-sans self-start"
                    >
                      <span>Same as Residential</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">Address (House Number & Street)</label>
                      <input
                        type="text"
                        placeholder="House Number and Street"
                        value={formData.perm_house_num || ''}
                        onChange={e => setFormData({ ...formData, perm_house_num: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">Barangay</label>
                      <input
                        type="text"
                        value={formData.perm_barangay || ''}
                        onChange={e => setFormData({ ...formData, perm_barangay: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">City / Municipality</label>
                      <input
                        type="text"
                        value={formData.perm_city || ''}
                        onChange={e => setFormData({ ...formData, perm_city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">Province</label>
                      <input
                        type="text"
                        value={formData.perm_province || ''}
                        onChange={e => setFormData({ ...formData, perm_province: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  </div>
                  <div className="w-1/3 sm:w-1/4">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-sans">Zip Code</label>
                    <input
                      type="text"
                      value={formData.perm_zip || ''}
                      onChange={e => setFormData({ ...formData, perm_zip: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: FAMILY INFORMATION & SECTION C: CONTACTS */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">B</span>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">Family & Contact Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">B.1 Name of Spouse (Last Name, First Name, Middle Name)</label>
                    <input
                      type="text"
                      placeholder="Enter spouse's name if applicable"
                      value={formData.spouse_name || ''}
                      onChange={e => setFormData({ ...formData, spouse_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">B.2 Citizenship of Spouse</label>
                    <input
                      type="text"
                      value={formData.spouse_citizenship || ''}
                      onChange={e => setFormData({ ...formData, spouse_citizenship: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>

                {/* B.3 Name of Children list */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">B.3 Name of Children (List names)</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {formData.children.map((child, index) => (
                      <div key={index} className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">#{index + 1}</span>
                        <input
                          type="text"
                          placeholder="Last, First, Middle Name"
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
                    onClick={() => setFormData({ ...formData, children: [...formData.children, ''] })}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Child Input</span>
                  </button>
                </div>

                {/* B.4 Authorized Representatives */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">B.4 Authorized Representatives</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.representatives.map((rep, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
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

                {/* SECTION C: CONTACTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">C.1 Contact Number (Telephone / Mobile)</label>
                    <input
                      type="text"
                      placeholder="e.g. 0917-XXX-XXXX"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans">C.2 Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. citizen@email.com"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: DESIGNATED BENEFICIARY */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">D</span>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">Designated Beneficiary</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">D.1 Primary Beneficiary</span>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Full Name</label>
                      <input
                        type="text"
                        placeholder="Primary Beneficiary's Name"
                        value={formData.primary_beneficiary || ''}
                        onChange={e => setFormData({ ...formData, primary_beneficiary: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Relationship</label>
                      <input
                        type="text"
                        placeholder="e.g. Daughter, Spouse"
                        value={formData.primary_relationship || ''}
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
                        value={formData.contingent_beneficiary || ''}
                        onChange={e => setFormData({ ...formData, contingent_beneficiary: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1 font-sans">Relationship</label>
                      <input
                        type="text"
                        placeholder="e.g. Grandson, Nephew"
                        value={formData.contingent_relationship || ''}
                        onChange={e => setFormData({ ...formData, contingent_relationship: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION E: UTILIZATION OF CASH GIFTS */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">E</span>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">Utilization of Cash Gifts</h4>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">How will the milestone cash gift be utilized? (Kindly check all that apply)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/60 cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.utilization_food}
                        onChange={e => setFormData({ ...formData, utilization_food: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-800 font-sans">Food / Nutritional Supplies</span>
                    </label>

                    <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/60 cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.utilization_med_checkup}
                        onChange={e => setFormData({ ...formData, utilization_med_checkup: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-800 font-sans">Medical Check-up / Hospitalization</span>
                    </label>

                    <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/60 cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.utilization_medicines}
                        onChange={e => setFormData({ ...formData, utilization_medicines: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-800 font-sans">Medicines / Vitamins</span>
                    </label>

                    <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/60 cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.utilization_livelihood}
                        onChange={e => setFormData({ ...formData, utilization_livelihood: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-800 font-sans">Livelihood & Entrepreneurial Activities</span>
                    </label>

                    <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/60 cursor-pointer hover:bg-slate-50/50 transition-colors sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={formData.utilization_others}
                        onChange={e => setFormData({ ...formData, utilization_others: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-800 font-sans">Others (Please specify details)</span>
                    </label>
                  </div>

                  {formData.utilization_others && (
                    <div className="pt-2 animate-fadeIn">
                      <textarea
                        rows={2}
                        placeholder="Detail other financial allocations..."
                        value={formData.utilization_others_details || ''}
                        onChange={e => setFormData({ ...formData, utilization_others_details: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {formStep === 2 && (
            <>
              {/* SECTION F: CERTIFICATION & SIGNATURE SIGN-OFF */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center font-mono">F</span>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans">Certification and Submission</h4>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-5">
                  <p className="font-sans font-medium text-justify">
                    I hereby certify under oath that all the information in this application form are true and correct. I authorize the verification of the information provided in this form as well as the usage and processing of the information by the National Commission of Senior Citizens in accordance with the R.A. No. 10173, otherwise known as the "Data Privacy Act of 2012", its Implementing Rules and Regulations, and issuances of the National Privacy Commission. I further warrant that I have complied with all the requirements and I have presented all pertinent documentary requirements.
                  </p>

                  {/* Dynamic Signature Drawing / Biometric thumbprint Pad */}
                  <div className="pt-2">
                    <SignaturePad
                      signatureType={formData.signature_type}
                      signatureData={formData.signature_data}
                      onSignatureChange={(type, data) => setFormData({
                        ...formData,
                        signature_type: type,
                        signature_data: data,
                        signature: type === 'draw' ? data : formData.signature,
                        thumbmark: type === 'thumbmark' ? data : formData.thumbmark,
                        req_b_url: type === 'draw' ? data : formData.req_b_url,
                        req_c_url: type === 'thumbmark' ? data : formData.req_c_url,
                        signed_by_applicant: data !== ''
                      })}
                    />
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <label className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 cursor-pointer">
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

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 block font-sans uppercase">Date of Application</span>
                      <strong className="text-xs font-mono font-bold text-slate-800">{formData.date_applied}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-slate-200">
            <div>
              {formStep === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormStep(1);
                    const form = document.getElementById('expanded-centenarian-form');
                    if (form) form.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all cursor-pointer font-sans flex items-center gap-2 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Personal Info
                </button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setSelectedCitizenForForm(null); setFormData(null); }}
                className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              
              {formStep === 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-8 py-3 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer font-sans flex items-center gap-2"
                >
                  Next: Sign & Certify
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-8 py-3 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer font-sans"
                >
                  Save and Submit Application
                </button>
              )}
            </div>
          </div>

            </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedCitizenForDetails && (
        (() => {
          const appDetails = submittedApplications[selectedCitizenForDetails.id];
          if (!appDetails) return null;
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="text-lg font-black text-slate-950 font-sans uppercase tracking-wider">
                      Application Details
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 font-sans">
                      RA 11982 Centennial Program Application Info
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCitizenForDetails(null)}
                    className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto">
                  {/* Status Ribbon */}
                  {(() => {
                    const statusVal = appDetails.status || 'Pending';
                    const isDisapproved = statusVal === 'Disapproved';
                    return (
                      <div className={cn(
                        "p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans",
                        statusVal === 'Pending' && "bg-amber-50/50 border-amber-200 text-amber-900",
                        (statusVal === 'Requirements Completed' || statusVal === 'Completed') && "bg-blue-50/50 border-blue-200 text-blue-900",
                        statusVal === 'Submitted' && "bg-purple-50/50 border-purple-200 text-purple-900",
                        statusVal === 'Approved' && "bg-emerald-50/50 border-emerald-200 text-emerald-900",
                        isDisapproved && "bg-rose-50/50 border-rose-200 text-rose-900"
                      )}>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Current Program Status</span>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black uppercase tracking-wider">
                              {statusVal === 'Pending' && "⌛ Pending National Payout"}
                              {(statusVal === 'Requirements Completed' || statusVal === 'Completed') && "📑 Requirements Completed"}
                              {statusVal === 'Submitted' && "✉️ Submitted to National"}
                              {statusVal === 'Approved' && "✅ Approved & Settled"}
                              {isDisapproved && "❌ Disapproved"}
                            </span>
                          </div>
                          {isDisapproved && appDetails.disapproval_reason && (
                            <div className="mt-2 text-xs font-semibold bg-rose-100/60 text-rose-800 border border-rose-200/40 p-3 rounded-xl max-w-2xl leading-relaxed">
                              <span className="font-extrabold uppercase text-[10px] tracking-wider block mb-1">Disapproval Reason / Remarks:</span>
                              {appDetails.disapproval_reason}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0">
                          <button
                            onClick={() => {
                              setSelectedCitizenForDetails(null);
                              setStatusModalCitizen(selectedCitizenForDetails);
                            }}
                            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            ✏️ Update Status
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Grid layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Column 1: Personal Info */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest border-b border-indigo-100 pb-1.5 font-sans">
                        A. General Personal Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Full Name</span>
                          <span className="text-sm font-extrabold text-slate-900 font-sans">
                            {appDetails.last_name}, {appDetails.first_name} {appDetails.middle_name || ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Milestone Category</span>
                          <span className="text-sm font-extrabold text-slate-900 font-sans">
                            {appDetails.milestone_age} Years Old
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Birthdate</span>
                          <span className="text-sm font-bold text-slate-800 font-sans">
                            {new Date(appDetails.birth_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Age & Sex</span>
                          <span className="text-sm font-bold text-slate-800 font-sans">
                            {appDetails.age} years old ({appDetails.sex})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Civil Status</span>
                          <span className="text-sm font-bold text-slate-800 font-sans">
                            {appDetails.civil_status || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Citizenship</span>
                          <span className="text-sm font-bold text-slate-800 font-sans">
                            {appDetails.citizenship || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Addresses & Contact */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest border-b border-indigo-100 pb-1.5 font-sans">
                        B. Residence & Contact Info
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Residential Address</span>
                          <span className="text-xs font-bold text-slate-800 font-sans leading-relaxed block">
                            {[
                              appDetails.res_house_num,
                              appDetails.res_street,
                              appDetails.res_barangay,
                              appDetails.res_city,
                              appDetails.res_province,
                              appDetails.res_zip
                            ].filter(Boolean).join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Permanent Address</span>
                          <span className="text-xs font-bold text-slate-800 font-sans leading-relaxed block">
                            {appDetails.perm_barangay ? [
                              appDetails.perm_house_num,
                              appDetails.perm_street,
                              appDetails.perm_barangay,
                              appDetails.perm_city,
                              appDetails.perm_province,
                              appDetails.perm_zip
                            ].filter(Boolean).join(', ') : 'Same as Residential'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Phone Number</span>
                            <span className="text-xs font-bold text-slate-800 font-mono">
                              {appDetails.phone || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Email Address</span>
                            <span className="text-xs font-bold text-slate-800 font-sans">
                              {appDetails.email || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section C: Family Composition */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest border-b border-indigo-100 pb-1.5 font-sans">
                      C. Family Composition & Representatives
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block mb-1">Spouse Name</span>
                        <span className="text-sm font-bold text-slate-800 font-sans">
                          {appDetails.spouse_name || 'No living spouse listed'}
                        </span>

                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block mt-4 mb-1">Children</span>
                        {appDetails.children && appDetails.children.filter(Boolean).length > 0 ? (
                          <ul className="list-disc list-inside text-xs font-medium text-slate-700 space-y-1 font-sans">
                            {appDetails.children.filter(Boolean).map((child, i) => (
                              <li key={i}>{child}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No children listed</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block mb-1">Authorized Representatives</span>
                        {appDetails.representatives && appDetails.representatives.filter(r => r.name).length > 0 ? (
                          <div className="space-y-2">
                            {appDetails.representatives.filter(r => r.name).map((rep, i) => (
                              <div key={i} className="text-xs font-medium text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="font-bold">{rep.name}</span>
                                <span className="text-slate-400 font-semibold block uppercase text-[9px] mt-0.5 tracking-wider">{rep.relationship}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No representatives listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section D: Beneficiaries & Financial Plan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest border-b border-indigo-100 pb-1.5 font-sans">
                        D. Primary Beneficiaries
                      </h4>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Primary Beneficiary</span>
                        <span className="text-sm font-bold text-slate-800 font-sans">
                          {appDetails.primary_beneficiary || 'N/A'} {appDetails.primary_relationship ? `(${appDetails.primary_relationship})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">Contingent Beneficiary</span>
                        <span className="text-sm font-bold text-slate-800 font-sans">
                          {appDetails.contingent_beneficiary || 'N/A'} {appDetails.contingent_relationship ? `(${appDetails.contingent_relationship})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest border-b border-indigo-100 pb-1.5 font-sans">
                        E. Financial Allocation Plan
                      </h4>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {appDetails.utilization_food && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-bold uppercase font-sans">Food / Nutritional Support</span>
                        )}
                        {appDetails.utilization_medicines && (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold uppercase font-sans">Medicines</span>
                        )}
                        {appDetails.utilization_med_checkup && (
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-bold uppercase font-sans">Medical Checkup / Hospitalization</span>
                        )}
                        {appDetails.utilization_livelihood && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase font-sans">Livelihood support</span>
                        )}
                        {appDetails.utilization_others && (
                          <div className="w-full">
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-100 rounded-lg text-[10px] font-bold uppercase font-sans block">Others: {appDetails.utilization_others_details}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section F: Certificate & Signature */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Date Applied</span>
                      <strong className="text-sm font-mono text-slate-800">{appDetails.date_applied}</strong>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 items-center md:items-end justify-end">
                      <div className="text-center md:text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 font-sans">Signature</span>
                        {appDetails.signature ? (
                          <div className="border border-slate-200 bg-white p-2 rounded-xl shadow-inner inline-block max-w-[200px]">
                            <AuthenticatedSignatureImage path={appDetails.signature} alt="Applicant Signature" style={{ maxHeight: '64px', width: 'auto' }} />
                          </div>
                        ) : appDetails.req_b_url ? (
                          <div className="border border-slate-200 bg-white p-2 rounded-xl shadow-inner inline-block max-w-[200px]">
                            <AuthenticatedSignatureImage path={appDetails.req_b_url} alt="Applicant Signature" style={{ maxHeight: '64px', width: 'auto' }} />
                          </div>
                        ) : (appDetails.signature_type === 'draw' && appDetails.signature_data) ? (
                          <div className="border border-slate-200 bg-white p-2 rounded-xl shadow-inner inline-block max-w-[200px]">
                            <AuthenticatedSignatureImage path={appDetails.signature_data} alt="Applicant Signature" style={{ maxHeight: '64px', width: 'auto' }} />
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 font-bold font-sans block">No signature digitized</span>
                        )}
                      </div>
                      <div className="text-center md:text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 font-sans">Thumbmark</span>
                        {appDetails.thumbmark ? (
                          <div className="border border-slate-200 bg-white p-2 rounded-xl shadow-inner inline-block max-w-[200px]">
                            <AuthenticatedSignatureImage path={appDetails.thumbmark} alt="Applicant Thumbmark" style={{ maxHeight: '64px', width: 'auto' }} />
                          </div>
                        ) : appDetails.req_c_url ? (
                          <div className="border border-slate-200 bg-white p-2 rounded-xl shadow-inner inline-block max-w-[200px]">
                            <AuthenticatedSignatureImage path={appDetails.req_c_url} alt="Applicant Thumbmark" style={{ maxHeight: '64px', width: 'auto' }} />
                          </div>
                        ) : (appDetails.signature_type === 'thumbmark' && appDetails.signature_data) ? (
                          <div className="border border-slate-200 bg-white p-2 rounded-xl shadow-inner inline-block max-w-[200px]">
                            <AuthenticatedSignatureImage path={appDetails.signature_data} alt="Applicant Thumbmark" style={{ maxHeight: '64px', width: 'auto' }} />
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 font-bold font-sans block">No thumbmark digitized</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setSelectedCitizenForDetails(null)}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all cursor-pointer font-sans"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* PRINT / PREVIEW FORMS MODAL */}
      {selectedCitizenForPreview && (
        (() => {
          const appPreview = submittedApplications[selectedCitizenForPreview.id];
          if (!appPreview) return null;
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="text-lg font-black text-slate-950 font-sans uppercase tracking-wider">
                      Official Form Annex "A" Preview
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 font-sans">
                      Formatted printable version of NCSC Application Form
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const printContent = document.getElementById('printable-annex-a')?.innerHTML;
                        if (printContent) {
                          const win = window.open('', '_blank');
                          if (win) {
                            win.document.write(`
                              <html>
                                <head>
                                  <title>Annex A Form - ${appPreview.first_name} ${appPreview.last_name}</title>
                                  <script src="https://cdn.tailwindcss.com"></script>
                                  <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono&display=swap');
                                    body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                    /* Adjust text sizing to be more visible without changing layout of tables */
                                    [style*="font-size"][style*="7px"] { font-size: 8.5px !important; }
                                    [style*="font-size"][style*="8px"] { font-size: 10px !important; }
                                    [style*="font-size"][style*="9px"] { font-size: 11px !important; }
                                    [style*="font-size"][style*="10px"] { font-size: 11.5px !important; }
                                    [style*="font-size"][style*="11px"] { font-size: 12.5px !important; }
                                    [style*="font-size"][style*="12px"] { font-size: 13.5px !important; }
                                    [style*="font-size"][style*="13px"] { font-size: 14.5px !important; }
                                    [style*="font-size"][style*="28px"] { font-size: 30px !important; }
                                    /* Ensure pure black high contrast text colors */
                                    td, div, span, p {
                                      color: #000000 !important;
                                    }
                                    /* Restore white text for titles/headers with blue background */
                                    div[style*="1e3a8a"],
                                    div[style*="rgb(30, 58, 138)"],
                                    div[style*="1e3a8a"] *,
                                    div[style*="rgb(30, 58, 138)"] * {
                                      color: #ffffff !important;
                                    }
                                    td {
                                      border-color: #000000 !important;
                                    }
                                    table {
                                      border-color: #000000 !important;
                                    }
                                  </style>
                                </head>
                                <body onload="window.print(); window.close();">
                                  <div style="width: 210mm; margin: 0 auto; background: white;">
                                    ${printContent}
                                  </div>
                                </body>
                              </html>
                            `);
                            win.document.close();
                          }
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all cursor-pointer font-sans shadow-md inline-flex items-center gap-1.5"
                    >
                      Print Form
                    </button>
                    <button
                      onClick={() => setSelectedCitizenForPreview(null)}
                      className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-8 overflow-y-auto bg-slate-100 flex flex-col items-center gap-8">
                  {/* Paper Simulation */}
                  <style>{`
                    #printable-annex-a [style*="font-size"][style*="7px"] { font-size: 8.5px !important; }
                    #printable-annex-a [style*="font-size"][style*="8px"] { font-size: 10px !important; }
                    #printable-annex-a [style*="font-size"][style*="9px"] { font-size: 11px !important; }
                    #printable-annex-a [style*="font-size"][style*="10px"] { font-size: 11.5px !important; }
                    #printable-annex-a [style*="font-size"][style*="11px"] { font-size: 12.5px !important; }
                    #printable-annex-a [style*="font-size"][style*="12px"] { font-size: 13.5px !important; }
                    #printable-annex-a [style*="font-size"][style*="13px"] { font-size: 14.5px !important; }
                    #printable-annex-a [style*="font-size"][style*="28px"] { font-size: 30px !important; }
                    /* Ensure pure black high contrast text colors */
                    #printable-annex-a td, #printable-annex-a div, #printable-annex-a span, #printable-annex-a p {
                      color: #000000 !important;
                    }
                    /* Restore white text for titles/headers with blue background */
                    #printable-annex-a div[style*="1e3a8a"],
                    #printable-annex-a div[style*="rgb(30, 58, 138)"],
                    #printable-annex-a div[style*="1e3a8a"] *,
                    #printable-annex-a div[style*="rgb(30, 58, 138)"] * {
                      color: #ffffff !important;
                    }
                    #printable-annex-a td {
                      border-color: #000000 !important;
                    }
                    #printable-annex-a table {
                      border-color: #000000 !important;
                    }
                  `}</style>
                  <div id="printable-annex-a" className="flex flex-col gap-8 print:gap-0">
                    {/* PAGE 1 */}
                    <div className="bg-white p-8 w-[210mm] shadow-lg border border-slate-300 text-slate-900 font-sans min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                      <div>
                      {/* Official Header Image */}
                      <div className="text-center pb-3 mb-3" style={{ borderBottom: '3px solid black' }}>
                        <div className="flex justify-center">
                          <img 
                            src="https://res.cloudinary.com/dx20khqe5/image/upload/v1783299883/ncsc_wxaaap.png" 
                            alt="National Commission of Senior Citizens" 
                            className="w-full h-auto max-h-[220px] object-contain"
                            style={{ display: 'block', margin: '0 auto', maxHeight: '155px' }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Form Title & No Annex A Header */}
                      <div className="text-center space-y-2 py-2 relative">
                        <h2 className="text-3xl font-black uppercase tracking-wider text-slate-950 font-sans m-0" style={{ fontWeight: 950, letterSpacing: '0.75px', fontSize: '28px' }}>APPLICATION FORM</h2>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-sans m-0" style={{ fontWeight: 900, fontSize: '13px', letterSpacing: '0.5px' }}>OCTOGENARIAN, NONAGENARIAN AND CENTENARIAN BENEFIT PROGRAM</h3>
                      </div>

                      {/* Purpose, Instructions & Milestone Box */}
                      <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '75%', border: '1px solid black', padding: '10px', verticalAlign: 'top', fontFamily: 'sans-serif', fontSize: '11px' }}>
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontWeight: 'bold' }}>PURPOSE:</span> To claim the benefits under Republic Act (R.A.) No. 11982.
                              </div>
                              <div style={{ marginBottom: '10px' }}>
                                <span style={{ fontWeight: 'bold' }}>INSTRUCTIONS:</span>
                                <div style={{ paddingLeft: '12px', marginTop: '2px' }}>1. Fill out this form completely and correctly.</div>
                                <div style={{ paddingLeft: '12px' }}>2. Do not leave any blank space. If not applicable, kindly indicate "N/A".</div>
                                <div style={{ paddingLeft: '12px' }}>3. Write in CAPITAL letters.</div>
                              </div>
                              <div style={{ marginTop: '12px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Applicant for milestone age: <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>(Kindly check whichever applies)</span></div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                  {["80", "85", "90", "95", "100"].map((age) => {
                                    const matchesAge = String(appPreview.milestone_age) === age || 
                                                       (age === "100" && Number(appPreview.age) >= 100) || 
                                                       (age === "95" && Number(appPreview.age) >= 95 && Number(appPreview.age) < 100) || 
                                                       (age === "90" && Number(appPreview.age) >= 90 && Number(appPreview.age) < 95) || 
                                                       (age === "85" && Number(appPreview.age) >= 85 && Number(appPreview.age) < 90) || 
                                                       (age === "80" && Number(appPreview.age) >= 80 && Number(appPreview.age) < 85);
                                    return (
                                      <div key={age} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                        <span style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '16px',
                                          height: '16px',
                                          border: '1px solid black',
                                          backgroundColor: '#fff',
                                          color: '#000',
                                          fontSize: '11px',
                                          fontWeight: 'bold',
                                          fontFamily: 'monospace'
                                        }}>
                                          {matchesAge ? '✓' : ''}
                                        </span>
                                        <span>{age}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                            <td style={{ width: '25%', border: '1px solid black', height: '140px', textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#f8fafc', padding: '4px', position: 'relative' }}>
                              {selectedCitizenForPreview.photo_url ? (
                                <img 
                                  src={selectedCitizenForPreview.photo_url} 
                                  alt="Applicant" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', fontStyle: 'italic' }}>
                                  "2X2 ID Picture"
                                </div>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ textAlign: 'right', fontSize: '9px', fontWeight: 'bold', color: '#475569', marginTop: '2px', fontStyle: 'italic', textTransform: 'uppercase' }}>
                        This application form is not for sale.
                      </div>

                      {/* A. PERSONAL INFORMATION HEADER */}
                      <div style={{
                        backgroundColor: '#1e3a8a',
                        color: '#ffffff',
                        padding: '4px 10px',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        marginTop: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        A. PERSONAL INFORMATION
                      </div>

                      {/* PERSONAL INFORMATION GRID */}
                      <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <tbody>
                          
                          {/* Row 1: NCSC RRN & OSCA ID */}
                          <tr>
                            <td style={{ width: '50%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>NCSC REGISTRATION REFERENCE NUMBER (RRN) <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>(Optional)</span></div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', fontFamily: 'monospace', marginTop: '2px' }}>
                                {appPreview.rrn || `NCSC-SJ-${selectedCitizenForPreview.id.toString().padStart(6, '0')}-CENT`}
                              </div>
                            </td>
                            <td style={{ width: '50%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>OSCA ID NUMBER</div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', fontFamily: 'monospace', marginTop: '2px' }}>
                                {selectedCitizenForPreview.scid_number || appPreview.osca_id_number || 'N/A'}
                              </div>
                            </td>
                          </tr>

                          {/* Row 2: A.1 LAST NAME */}
                          <tr>
                            <td colSpan={2} style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>A.1 LAST NAME</div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                                {appPreview.last_name || selectedCitizenForPreview.last_name}
                              </div>
                            </td>
                          </tr>

                          {/* Row 3: A.2 GIVEN NAME & A.3 MIDDLE NAME */}
                          <tr>
                            <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>A.2 GIVEN NAME</div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                                {appPreview.first_name || selectedCitizenForPreview.first_name}
                              </div>
                            </td>
                            <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>A.3 MIDDLE NAME</div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                                {appPreview.middle_name || selectedCitizenForPreview.middle_name || 'N/A'}
                              </div>
                            </td>
                          </tr>

                          {/* Row 4: A.4 DATE OF BIRTH & A.5 AGE */}
                          <tr>
                            <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>A.4 DATE OF BIRTH <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>(Month/Day/Year)</span></div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', fontFamily: 'monospace', marginTop: '2px' }}>
                                {(() => {
                                  const rawDate = appPreview.birth_date || selectedCitizenForPreview.birth_date;
                                  if (!rawDate) return 'N/A';
                                  if (rawDate.includes('-')) {
                                    const parts = rawDate.split('-');
                                    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
                                  }
                                  return rawDate;
                                })()}
                              </div>
                            </td>
                            <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>A.5 AGE</div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', fontFamily: 'monospace', marginTop: '2px' }}>
                                {appPreview.age || selectedCitizenForPreview.age}
                              </div>
                            </td>
                          </tr>

                          {/* Row 5: A.6 RESIDENTIAL ADDRESS/ADDRESS ABROAD */}
                          <tr>
                            <td colSpan={2} style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>A.6 RESIDENTIAL ADDRESS/ADDRESS ABROAD</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>House Number</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.res_house_num || appPreview.res_house_no || 'N/A'}</span>
                                </div>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Street</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.res_street || 'N/A'}</span>
                                </div>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Barangay</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.res_barangay || selectedCitizenForPreview.barangay || 'N/A'}</span>
                                </div>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>City/Municipality</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.res_city || selectedCitizenForPreview.city_municipality || 'N/A'}</span>
                                </div>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Province</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.res_province || 'N/A'}</span>
                                </div>
                                <div>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Zip Code</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.res_zip || appPreview.res_zip_code || '1500'}</span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Row 6: A.7 PERMANENT ADDRESS IN THE PHILIPPINES */}
                          <tr>
                            <td colSpan={2} style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>A.7 PERMANENT ADDRESS IN THE PHILIPPINES</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>House Number</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.perm_house_num || appPreview.perm_house_no || 'N/A'}</span>
                                </div>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Street</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.perm_street || 'N/A'}</span>
                                </div>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Barangay</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.perm_barangay || 'N/A'}</span>
                                </div>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>City/Municipality</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.perm_city || 'N/A'}</span>
                                </div>
                                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '4px' }}>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Province</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.perm_province || 'N/A'}</span>
                                </div>
                                <div>
                                  <span style={{ fontSize: '7px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Zip Code</span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{appPreview.perm_zip || appPreview.perm_zip_code || '1500'}</span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Row 7: SEX, CIVIL STATUS, CITIZENSHIP */}
                          <tr>
                            <td colSpan={2} style={{ padding: '0', border: 'none' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: 'none' }}>
                                <tbody>
                                  <tr>
                                    {/* SEX CELL */}
                                    <td style={{ width: '33.33%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                      <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>A.8 SEX</div>
                                      <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '14px',
                                            height: '14px',
                                            border: '1px solid black',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            fontSize: '9px',
                                            fontFamily: 'monospace'
                                          }}>
                                            {String(appPreview.sex).toLowerCase() === 'male' ? '✓' : ''}
                                          </span>
                                          <span>Male</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '14px',
                                            height: '14px',
                                            border: '1px solid black',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            fontSize: '9px',
                                            fontFamily: 'monospace'
                                          }}>
                                            {String(appPreview.sex).toLowerCase() === 'female' ? '✓' : ''}
                                          </span>
                                          <span>Female</span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* CIVIL STATUS CELL */}
                                    <td style={{ width: '33.33%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                      <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>A.9 CIVIL STATUS</div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '12px',
                                            height: '12px',
                                            border: '1px solid black',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            fontSize: '8px',
                                            fontFamily: 'monospace'
                                          }}>
                                            {String(appPreview.civil_status).toLowerCase() === 'single' ? '✓' : ''}
                                          </span>
                                          <span>Single</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '12px',
                                            height: '12px',
                                            border: '1px solid black',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            fontSize: '8px',
                                            fontFamily: 'monospace'
                                          }}>
                                            {String(appPreview.civil_status).toLowerCase() === 'widowed' ? '✓' : ''}
                                          </span>
                                          <span>Widowed</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '12px',
                                            height: '12px',
                                            border: '1px solid black',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            fontSize: '8px',
                                            fontFamily: 'monospace'
                                          }}>
                                            {String(appPreview.civil_status).toLowerCase() === 'married' ? '✓' : ''}
                                          </span>
                                          <span>Married</span>
                                        </div>
                                        <div style={{ fontSize: '8px', gridColumn: 'span 2', marginTop: '2px', color: '#475569' }}>
                                          Others: <span style={{ borderBottom: '1px solid black', fontWeight: 'bold', padding: '0 4px' }}>
                                            {!['single', 'widowed', 'married'].includes(String(appPreview.civil_status).toLowerCase()) ? appPreview.civil_status : '_______'}
                                          </span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* CITIZENSHIP CELL */}
                                    <td style={{ width: '33.33%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                      <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>A.10 CITIZENSHIP</div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '12px',
                                            height: '12px',
                                            border: '1px solid black',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            fontSize: '8px',
                                            fontFamily: 'monospace'
                                          }}>
                                            {String(appPreview.citizenship).toLowerCase() === 'filipino' ? '✓' : ''}
                                          </span>
                                          <span>Filipino</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '12px',
                                            height: '12px',
                                            border: '1px solid black',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            fontSize: '8px',
                                            fontFamily: 'monospace'
                                          }}>
                                            {String(appPreview.citizenship).toLowerCase() !== 'filipino' ? '✓' : ''}
                                          </span>
                                          <span>Dual citizen</span>
                                        </div>
                                        {String(appPreview.citizenship).toLowerCase() !== 'filipino' && (
                                          <div style={{ fontSize: '8px', color: '#475569' }}>
                                            Details: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{appPreview.dual_citizenship_details || appPreview.citizenship}</span>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>

                        </tbody>
                      </table>

                      {/* B. FAMILY INFORMATION HEADER */}
                      <div style={{
                        backgroundColor: '#1e3a8a',
                        color: '#ffffff',
                        padding: '4px 10px',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        marginTop: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        B. FAMILY INFORMATION
                      </div>

                      {/* B. FAMILY INFORMATION GRID */}
                      <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '70%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                B.1 NAME OF SPOUSE <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>(LAST NAME, GIVEN NAME, MIDDLE NAME, EXT.)</span>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                                {appPreview.spouse_name || 'N/A'}
                              </div>
                            </td>
                            <td style={{ width: '30%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>B.2 CITIZENSHIP</div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                                {appPreview.spouse_citizenship || 'FILIPINO'}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* PAGE 1 FOOTER BAR */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '15px',
                        paddingTop: '6px',
                        borderTop: '1px solid #cbd5e1',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#475569'
                      }}>
                        <div>Page 1 of 4</div>
                        <div>01.31.2025</div>
                      </div>

                    </div>
                    {/* CLOSE PAGE 1 */}
                    </div>

                    {/* PAGE 2 */}
                    <div className="bg-white p-8 w-[210mm] shadow-lg border border-slate-300 text-slate-900 font-sans min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                      <div>
                        {/* Official Header Image */}
                        <div className="text-center pb-3 mb-3" style={{ borderBottom: '3px solid black' }}>
                          <div className="flex justify-center">
                            <img 
                              src="https://res.cloudinary.com/dx20khqe5/image/upload/v1783299883/ncsc_wxaaap.png" 
                              alt="National Commission of Senior Citizens" 
                              className="w-full h-auto max-h-[220px] object-contain"
                              style={{ display: 'block', margin: '0 auto', maxHeight: '155px' }}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>

                        {/* B. FAMILY INFORMATION (CONTINUED) HEADER */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          B. FAMILY INFORMATION (CONTINUED)
                        </div>

                        <div style={{
                          border: '1px solid black',
                          borderBottom: 'none',
                          padding: '4px 8px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          backgroundColor: '#f1f5f9'
                        }}>
                          B.3 NAME OF CHILDREN <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>(LAST NAME, GIVEN NAME, MIDDLE NAME, EXT.)</span>
                        </div>

                        <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <tbody>
                            <tr>
                              {/* Left Column (Children 1-5) */}
                              <td style={{ width: '50%', border: '1px solid black', padding: '0', verticalAlign: 'top' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <tbody>
                                    {[1, 2, 3, 4, 5].map((num) => {
                                      const childVal = appPreview.children && appPreview.children[num - 1];
                                      return (
                                        <tr key={num}>
                                          <td style={{ padding: '6px', borderBottom: num < 5 ? '1px solid #cbd5e1' : 'none', verticalAlign: 'top', display: 'flex', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#475569', minWidth: '15px' }}>{num}.</span>
                                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{childVal || ''}</span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </td>
                              {/* Right Column (Children 6-10) */}
                              <td style={{ width: '50%', border: '1px solid black', padding: '0', verticalAlign: 'top' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <tbody>
                                    {[6, 7, 8, 9, 10].map((num) => {
                                      const childVal = appPreview.children && appPreview.children[num - 1];
                                      return (
                                        <tr key={num}>
                                          <td style={{ padding: '6px', borderBottom: num < 10 ? '1px solid #cbd5e1' : 'none', verticalAlign: 'top', display: 'flex', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#475569', minWidth: '15px' }}>{num}.</span>
                                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{childVal || ''}</span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{
                          borderLeft: '1px solid black',
                          borderRight: '1px solid black',
                          padding: '4px 8px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          backgroundColor: '#f1f5f9'
                        }}>
                          B.4 AUTHORIZED REPRESENTATIVES <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>(LAST NAME, GIVEN NAME, MIDDLE NAME, EXT.)</span>
                        </div>

                        <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                              <th style={{ width: '70%', border: '1px solid black', padding: '4px 8px', fontSize: '9px', textAlign: 'left', fontWeight: 'bold' }}>Name of Representatives</th>
                              <th style={{ width: '30%', border: '1px solid black', padding: '4px 8px', fontSize: '9px', textAlign: 'left', fontWeight: 'bold' }}>Relationship</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3].map((num, i) => {
                              const rep = appPreview.representatives && appPreview.representatives[i];
                              return (
                                <tr key={num}>
                                  <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                      <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold' }}>B.4.{num}</span>
                                      <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{rep?.name || ''}</span>
                                    </div>
                                  </td>
                                  <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>{rep?.relationship || ''}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* C. CONTACT INFORMATION */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          C. CONTACT INFORMATION
                        </div>

                        <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '50%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>C.1. CONTACT NUMBERS (TELEPHONE AND MOBILE NUMBERS)</div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', fontFamily: 'monospace', marginTop: '2px' }}>
                                  {appPreview.phone || 'N/A'}
                                </div>
                              </td>
                              <td style={{ width: '50%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>C.2 EMAIL ADDRESS</div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', fontFamily: 'monospace', marginTop: '2px' }}>
                                  {appPreview.email || 'N/A'}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* D. DESIGNATED BENEFICIARY */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          D. DESIGNATED BENEFICIARY
                        </div>

                        <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '70%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>D.1 PRIMARY</div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                                  {appPreview.primary_beneficiary || 'N/A'}
                                </div>
                              </td>
                              <td style={{ width: '30%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>D.1.1 RELATIONSHIP</div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                                  {appPreview.primary_relationship || 'N/A'}
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ width: '70%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>D.2 CONTINGENT</div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                                  {appPreview.contingent_beneficiary || 'N/A'}
                                </div>
                              </td>
                              <td style={{ width: '30%', border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>D.2.2 RELATIONSHIP</div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                                  {appPreview.contingent_relationship || 'N/A'}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* E. UTILIZATION OF CASH GIFTS */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          E. UTILIZATION OF CASH GIFTS
                        </div>

                        <div style={{ border: '1px solid black', padding: '10px', fontSize: '11px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', alignItems: 'start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContainer: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                height: '16px',
                                border: '1px solid black',
                                backgroundColor: '#fff',
                                color: '#000',
                                fontFamily: 'monospace',
                                fontSize: '11px'
                              }}>{appPreview.utilization_food ? '✓' : ''}</span>
                              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Food</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContainer: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                height: '16px',
                                border: '1px solid black',
                                backgroundColor: '#fff',
                                color: '#000',
                                fontFamily: 'monospace',
                                fontSize: '11px'
                              }}>{appPreview.utilization_med_checkup ? '✓' : ''}</span>
                              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Medical check-up</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContainer: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                height: '16px',
                                border: '1px solid black',
                                backgroundColor: '#fff',
                                color: '#000',
                                fontFamily: 'monospace',
                                fontSize: '11px'
                              }}>{appPreview.utilization_medicines ? '✓' : ''}</span>
                              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Medicines/Vitamins</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContainer: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                height: '16px',
                                border: '1px solid black',
                                backgroundColor: '#fff',
                                color: '#000',
                                fontFamily: 'monospace',
                                fontSize: '11px'
                              }}>{appPreview.utilization_livelihood ? '✓' : ''}</span>
                              <span style={{ fontSize: '10px', fontWeight: 'bold', lineHeight: '1.2' }}>Livelihood<br/>Entrepreneurial<br/>Activities</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContainer: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                height: '16px',
                                border: '1px solid black',
                                backgroundColor: '#fff',
                                color: '#000',
                                fontFamily: 'monospace',
                                fontSize: '11px'
                              }}>{appPreview.utilization_others ? '✓' : ''}</span>
                              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Others: <span style={{ textDecoration: 'underline' }}>{appPreview.utilization_others_details || '(Kindly specify)'}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* F. CERTIFICATION */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          F. CERTIFICATION
                        </div>

                        <div style={{ border: '1px solid black', padding: '8px', fontSize: '9px', textAlign: 'justify', color: '#1e293b', lineHeight: '1.4' }}>
                          I hereby certify under oath that all the information in this application form are true and correct. I authorize the verification of the information provided in this form as well as the usage and processing of the information by the National Commission of Senior Citizens in accordance with the R.A. No. 10173, otherwise known as the "Data Privacy Act of 2012", its Implementing Rules and Regulations, and issuances of the National Privacy Commission. I further warrant that I have complied with all the requirements and I have presented all pertinent documentary requirements. I understand that my application shall not be processed if any statement herein made is found to be false, or if any document I submitted is found to have been falsified, or if I fail to comply with all the requirements with respect to my application, without prejudice to whatever actions that may be taken against me in accordance with the applicable laws of the Republic of the Philippines. Further, I hereby certify that I have not commenced the application/processing for the cash benefits as provided for under R.A. No. 11982 before any government agency.
                        </div>

                        <table style={{ width: '100%', border: '1px solid black', borderTop: 'none', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '100%', border: '1px solid black', padding: '12px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b', marginBottom: '10px' }}>
                                  NAME AND SIGNATURE/THUMBMARK OF APPLICANT
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto', padding: '10px 0' }}>
                                  <div style={{ position: 'relative', width: '100%', minHeight: '65px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {/* The absolute overlay of signature/thumbmark for transparent overprinting */}
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '10px',
                                      display: 'flex',
                                      justifyContent: 'center',
                                      gap: '30px',
                                      alignItems: 'center',
                                      pointerEvents: 'none',
                                      zIndex: 10,
                                      width: '100%'
                                    }}>
                                      {appPreview.signature ? (
                                        <AuthenticatedSignatureImage path={appPreview.signature} alt="Signature" style={{ maxHeight: '65px', width: 'auto' }} />
                                      ) : appPreview.req_b_url ? (
                                        <AuthenticatedSignatureImage path={appPreview.req_b_url} alt="Signature" style={{ maxHeight: '65px', width: 'auto' }} />
                                      ) : (appPreview.signature_type === 'draw' && appPreview.signature_data) ? (
                                        <AuthenticatedSignatureImage path={appPreview.signature_data} alt="Signature" style={{ maxHeight: '65px', width: 'auto' }} />
                                      ) : null}

                                      {appPreview.thumbmark ? (
                                        <AuthenticatedSignatureImage path={appPreview.thumbmark} alt="Thumbmark" style={{ maxHeight: '65px', width: 'auto' }} />
                                      ) : appPreview.req_c_url ? (
                                        <AuthenticatedSignatureImage path={appPreview.req_c_url} alt="Thumbmark" style={{ maxHeight: '65px', width: 'auto' }} />
                                      ) : (appPreview.signature_type === 'thumbmark' && appPreview.signature_data) ? (
                                        <AuthenticatedSignatureImage path={appPreview.signature_data} alt="Thumbmark" style={{ maxHeight: '65px', width: 'auto' }} />
                                      ) : null}
                                    </div>

                                    {/* Underlined Printed Name */}
                                    <div style={{
                                      fontSize: '13px',
                                      fontWeight: 'bold',
                                      textTransform: 'uppercase',
                                      color: '#000',
                                      borderBottom: '1px solid #000',
                                      width: '100%',
                                      textAlign: 'center',
                                      paddingBottom: '2px',
                                      position: 'relative',
                                      zIndex: 1
                                    }}>
                                      {`${appPreview.first_name} ${appPreview.middle_name ? appPreview.middle_name + ' ' : ''}${appPreview.last_name}`}
                                    </div>
                                  </div>

                                  <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', marginTop: '6px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                    Signature / Thumbmark of Applicant over Printed Name
                                  </div>

                                  {!appPreview.signature && !appPreview.thumbmark && !appPreview.req_b_url && !appPreview.req_c_url && !appPreview.signature_data && (
                                    <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>FILED DIGITALLY</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ width: '100%', border: '1px solid black', padding: '8px', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b', marginBottom: '6px' }}>
                                  DATE OF APPLICATION
                                </div>
                                <div style={{ minHeight: '25px', display: 'flex', alignItems: 'center', paddingLeft: '8px', fontWeight: 'bold', color: '#000', fontFamily: 'monospace' }}>
                                  {appPreview.date_applied ? (
                                    (() => {
                                      try {
                                        if (appPreview.date_applied.includes('T')) {
                                          return appPreview.date_applied.split('T')[0];
                                        }
                                        return appPreview.date_applied;
                                      } catch (e) {
                                        return appPreview.date_applied;
                                      }
                                    })()
                                  ) : new Date().toLocaleDateString('en-US')}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* SUBSCRIBED AND SWORN TO BEFORE ME BOX */}
                        <div style={{ border: '1.5px solid black', padding: '10px', marginTop: '10px', fontSize: '10px', backgroundColor: '#fdfdfd' }}>
                          <p style={{ margin: '0 0 10px 0', lineHeight: '1.6', textAlign: 'justify' }}>
                            <span style={{ fontWeight: 'bold' }}>SUBSCRIBED AND SWORN TO BEFORE ME</span>, this <span style={{ borderBottom: '1px solid black', padding: '0 12px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> day of <span style={{ borderBottom: '1px solid black', padding: '0 25px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, <span style={{ borderBottom: '1px solid black', padding: '0 10px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, at <span style={{ borderBottom: '1px solid black', padding: '0 30px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, the affiant exhibited to me his/her <span style={{ borderBottom: '1px solid black', padding: '0 20px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> with ID number <span style={{ borderBottom: '1px solid black', padding: '0 20px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, issued at <span style={{ borderBottom: '1px solid black', padding: '0 20px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> on <span style={{ borderBottom: '1px solid black', padding: '0 15px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, valid until <span style={{ borderBottom: '1px solid black', padding: '0 15px' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.
                          </p>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9px', width: '45%' }}>
                              <div>Government ID: <span style={{ borderBottom: '1px solid black', display: 'inline-block', width: '150px' }}>&nbsp;</span></div>
                              <div>ID Number: &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ borderBottom: '1px solid black', display: 'inline-block', width: '150px' }}>&nbsp;</span></div>
                              <div>Date Issued: &nbsp;<span style={{ borderBottom: '1px solid black', display: 'inline-block', width: '150px' }}>&nbsp;</span></div>
                            </div>
                            
                            <div style={{ width: '50%', textAlign: 'center' }}>
                              <div style={{ borderBottom: '1px solid black', width: '90%', margin: '0 auto', minHeight: '20px' }}>&nbsp;</div>
                              <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px' }}>Signature over Printed Name of Person Administering the Oath</div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* PAGE 2 FOOTER BAR */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '15px',
                        paddingTop: '6px',
                        borderTop: '1px solid #cbd5e1',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#475569'
                      }}>
                        <div>Page 2 of 4</div>
                        <div>01.31.2025</div>
                      </div>
                    </div>

                    {/* PAGE 3 */}
                    <div className="bg-white p-8 w-[210mm] shadow-lg border border-slate-300 text-slate-900 font-sans min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                      <div>
                        {/* Official Header Image */}
                        <div className="text-center pb-3 mb-3" style={{ borderBottom: '3px solid black' }}>
                          <div className="flex justify-center">
                            <img 
                              src="https://res.cloudinary.com/dx20khqe5/image/upload/v1783299883/ncsc_wxaaap.png" 
                              alt="National Commission of Senior Citizens" 
                              className="w-full h-auto max-h-[220px] object-contain"
                              style={{ display: 'block', margin: '0 auto', maxHeight: '155px' }}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>

                        {/* G. DOCUMENTARY REQUIREMENTS HEADER */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          G. DOCUMENTARY REQUIREMENTS <span style={{ fontWeight: 'normal', fontSize: '9px', textTransform: 'none', fontStyle: 'italic' }}>(to be filled-up by NCSC personnel only)</span>
                        </div>

                        <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', fontSize: '10px', marginTop: '10px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                              <th style={{ border: '1px solid black', padding: '6px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '15%' }} rowSpan={2}>Applicants</th>
                              <th style={{ border: '1px solid black', padding: '6px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '50%' }} rowSpan={2}>Requirements</th>
                              <th style={{ border: '1px solid black', padding: '6px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '15%' }} colSpan={2}>Complied</th>
                              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', width: '20%' }} rowSpan={2}>
                                Remarks
                                <div style={{ fontSize: '8px', fontWeight: 'normal', fontStyle: 'italic', marginTop: '2px', textTransform: 'none' }}>
                                  In the absence of primary ID, kindly cite secondary documents presented.
                                </div>
                              </th>
                            </tr>
                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                              <th style={{ border: '1px solid black', padding: '4px', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', width: '7.5%' }}>Yes</th>
                              <th style={{ border: '1px solid black', padding: '4px', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', width: '7.5%' }}>No</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Local Applicants */}
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', backgroundColor: '#fafafa' }} rowSpan={5}>
                                Local Applicants
                              </td>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>a.)</span> Duly accomplished application form <span style={{ fontWeight: 'bold' }}>"Annex A"</span>;
                              </td>
                              <td style={{ border: '1px solid black', width: '7.5%', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', width: '7.5%', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', width: '20%', padding: '6px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>b.)</span> Any one (1) of the following primary documents:
                                <div style={{ paddingLeft: '15px', marginTop: '4px', textIndent: '-15px' }}>
                                  1. Certificate of Live Birth duly issued or authenticated by the Philippine Statistics Authority (PSA);
                                </div>
                                <div style={{ paddingLeft: '15px', marginTop: '4px', textIndent: '-15px' }}>
                                  2. Photocopy of Philippine Identification System ID card / Philippine ID card / National ID card provided that the original copy must be presented.
                                </div>
                                <div style={{ marginTop: '8px', fontStyle: 'italic', fontSize: '8.5px', color: '#475569', lineHeight: '1.3' }}>
                                  ***In the absence of primary ID/documents, any two (2) of the following secondary ID cards/documents shall be submitted as indicated in the Item VI of Implementing Guidelines.
                                </div>
                              </td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', padding: '6px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>c.)</span> Recent 5.08 cm x 5.08 cm (2" x 2") ID picture
                              </td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', padding: '6px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>d.)</span> Full body picture of the applicant printed on an A4 size bond/photo paper; and
                              </td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', padding: '6px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>e.)</span> Applicant's inclusion to the endorsed list for validation issued by the Local Chief Executive.
                              </td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', padding: '6px' }}></td>
                            </tr>

                            {/* Applicants Living Abroad */}
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', backgroundColor: '#fafafa' }} rowSpan={2}>
                                Applicants Living Abroad
                              </td>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>a.)</span> Duly accomplished application form <span style={{ fontWeight: 'bold' }}>"Annex A"</span>;
                              </td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', padding: '6px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>b.)</span> Any one (1) of the following primary documents:
                                <div style={{ paddingLeft: '15px', marginTop: '4px', textIndent: '-15px' }}>
                                  1. Valid Philippine Passport;
                                </div>
                                <div style={{ paddingLeft: '15px', marginTop: '4px', textIndent: '-15px' }}>
                                  2. Citizen Retention and Re-acquisition Certificate and Identification Certificate, or Order of Approval, or Oath of Allegiance, or Certificate of Attestation duly issued by the Philippine Embassy (PE) or Philippine Consulate General (PCG) of the Department of Foreign Affairs (DFA) who has jurisdiction in the area where the applicant resides.
                                </div>
                                <div style={{ marginTop: '8px', fontStyle: 'italic', fontSize: '8.5px', color: '#475569', lineHeight: '1.3' }}>
                                  ***In the absence of primary ID/documents, any two (2) of the following secondary ID cards/documents shall be submitted as indicated in the Item VI of Implementing Guidelines.
                                </div>
                              </td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', padding: '6px' }}></td>
                            </tr>
                          </tbody>
                        </table>

                      </div>

                      {/* PAGE 3 FOOTER BAR */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '15px',
                        paddingTop: '6px',
                        borderTop: '1px solid #cbd5e1',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#475569'
                      }}>
                        <div>Page 3 of 4</div>
                        <div>01.31.2025</div>
                      </div>
                    </div>

                    {/* PAGE 4 */}
                    <div className="bg-white p-8 w-[210mm] shadow-lg border border-slate-300 text-slate-900 font-sans min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0">
                      <div>
                        {/* Official Header Image */}
                        <div className="text-center pb-3 mb-3" style={{ borderBottom: '3px solid black' }}>
                          <div className="flex justify-center">
                            <img 
                              src="https://res.cloudinary.com/dx20khqe5/image/upload/v1783299883/ncsc_wxaaap.png" 
                              alt="National Commission of Senior Citizens" 
                              className="w-full h-auto max-h-[220px] object-contain"
                              style={{ display: 'block', margin: '0 auto', maxHeight: '155px' }}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>

                        {/* G. DOCUMENTARY REQUIREMENTS HEADER (CONTINUED) */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          G. DOCUMENTARY REQUIREMENTS (CONTINUED) <span style={{ fontWeight: 'normal', fontSize: '9px', textTransform: 'none', fontStyle: 'italic' }}>(to be filled-up by NCSC personnel only)</span>
                        </div>

                        <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', fontSize: '10px', marginTop: '10px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                              <th style={{ border: '1px solid black', padding: '6px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '15%' }} rowSpan={2}>Applicants</th>
                              <th style={{ border: '1px solid black', padding: '6px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '50%' }} rowSpan={2}>Requirements</th>
                              <th style={{ border: '1px solid black', padding: '6px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '15%' }} colSpan={2}>Complied</th>
                              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', width: '20%' }} rowSpan={2}>
                                Remarks
                                <div style={{ fontSize: '8px', fontWeight: 'normal', fontStyle: 'italic', marginTop: '2px', textTransform: 'none' }}>
                                  In the absence of primary ID, kindly cite secondary documents presented.
                                </div>
                              </th>
                            </tr>
                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                              <th style={{ border: '1px solid black', padding: '4px', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', width: '7.5%' }}>Yes</th>
                              <th style={{ border: '1px solid black', padding: '4px', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', width: '7.5%' }}>No</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Applicants Living Abroad */}
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', backgroundColor: '#fafafa' }} rowSpan={3}>
                                Applicants Living Abroad
                              </td>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>c.)</span> Recent 5.08 cm x 5.08 cm (2" x 2") ID picture
                              </td>
                              <td style={{ border: '1px solid black', width: '7.5%', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', width: '7.5%', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', width: '20%', padding: '6px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>d.)</span> Full body picture of the applicant printed on an A4 size bond/photo paper; and
                              </td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', padding: '6px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 'bold' }}>e.)</span> Applicant's inclusion to the endorsed list issued by the PE/Consulate or the DFA or the Department of Migrant Workers (DMW) or the Commission on Filipinos Overseas (CFO).
                              </td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid black', padding: '6px' }}></td>
                            </tr>
                          </tbody>
                        </table>

                        {/* H. VALIDATION ASSESSMENT REPORT */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          H. VALIDATION ASSESSMENT REPORT <span style={{ fontWeight: 'normal', fontSize: '9px', textTransform: 'none', fontStyle: 'italic' }}>(to be filled-up by NCSC personnel only)</span>
                        </div>

                        {/* H.1 FINDINGS/CONCERNS/RECOMMENDATIONS */}
                        <div style={{ border: '1px solid black', borderBottom: 'none', marginTop: '10px' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', borderBottom: '1px solid black' }}>
                            H.1 FINDINGS/CONCERNS/RECOMMENDATIONS
                          </div>
                          <div style={{ minHeight: '100px', padding: '8px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                            &nbsp;
                          </div>
                        </div>

                        {/* H.2 INITIAL ASSESSMENT */}
                        <div style={{ border: '1px solid black', borderBottom: 'none' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', borderBottom: '1px solid black' }}>
                            H.2 INITIAL ASSESSMENT
                          </div>
                          <div style={{ display: 'flex', gap: '40px', padding: '8px 15px', fontSize: '11px', fontWeight: 'bold' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid black' }}></span>
                              Eligible
                            </label>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid black' }}></span>
                              Ineligible
                            </label>
                          </div>
                        </div>

                        {/* VALIDATED BY */}
                        <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', fontSize: '10px' }}>
                          <tbody>
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                              <td style={{ border: '1px solid black', padding: '4px 8px', fontWeight: 'bold', width: '20%' }} colSpan={1}>
                                VALIDATED BY <span style={{ fontWeight: 'normal', fontSize: '8px', fontStyle: 'italic', textTransform: 'none' }}>(to be filled-up by NCSC personnel only)</span>
                              </td>
                              <td style={{ border: '1px solid black', padding: '4px 8px', width: '80%' }}></td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid black', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'middle' }}>Name</td>
                              <td style={{ border: '1px solid black', padding: '6px 8px', verticalAlign: 'middle', height: '40px' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '9px', color: '#64748b', fontStyle: 'italic', width: '100%', paddingRight: '20px' }}>
                                  (Signature over printed name)
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid black', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'middle' }}>Date Validated</td>
                              <td style={{ border: '1px solid black', padding: '6px 8px', verticalAlign: 'middle', height: '24px' }}></td>
                            </tr>
                          </tbody>
                        </table>

                        {/* APPLICANT NAME AND SIGNATURE */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          APPLICANT NAME AND SIGNATURE
                        </div>

                        <div style={{ border: '1px solid black', padding: '12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b', marginBottom: '10px' }}>
                            NAME AND SIGNATURE/THUMBMARK OF APPLICANT
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto', padding: '10px 0' }}>
                            <div style={{ position: 'relative', width: '100%', minHeight: '65px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {/* The absolute overlay of signature/thumbmark for transparent overprinting */}
                              <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '30px',
                                alignItems: 'center',
                                pointerEvents: 'none',
                                zIndex: 10,
                                width: '100%'
                              }}>
                                {appPreview.signature ? (
                                  <AuthenticatedSignatureImage path={appPreview.signature} alt="Signature" style={{ maxHeight: '65px', width: 'auto' }} />
                                ) : appPreview.req_b_url ? (
                                  <AuthenticatedSignatureImage path={appPreview.req_b_url} alt="Signature" style={{ maxHeight: '65px', width: 'auto' }} />
                                ) : (appPreview.signature_type === 'draw' && appPreview.signature_data) ? (
                                  <AuthenticatedSignatureImage path={appPreview.signature_data} alt="Signature" style={{ maxHeight: '65px', width: 'auto' }} />
                                ) : null}

                                {appPreview.thumbmark ? (
                                  <AuthenticatedSignatureImage path={appPreview.thumbmark} alt="Thumbmark" style={{ maxHeight: '65px', width: 'auto' }} />
                                ) : appPreview.req_c_url ? (
                                  <AuthenticatedSignatureImage path={appPreview.req_c_url} alt="Thumbmark" style={{ maxHeight: '65px', width: 'auto' }} />
                                ) : (appPreview.signature_type === 'thumbmark' && appPreview.signature_data) ? (
                                  <AuthenticatedSignatureImage path={appPreview.signature_data} alt="Thumbmark" style={{ maxHeight: '65px', width: 'auto' }} />
                                ) : null}
                              </div>

                              {/* Underlined Printed Name */}
                              <div style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                color: '#000',
                                borderBottom: '1px solid #000',
                                width: '100%',
                                textAlign: 'center',
                                paddingBottom: '2px',
                                position: 'relative',
                                zIndex: 1
                              }}>
                                {`${appPreview.first_name} ${appPreview.middle_name ? appPreview.middle_name + ' ' : ''}${appPreview.last_name}`}
                              </div>
                            </div>

                            <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', marginTop: '6px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                              Signature / Thumbmark of Applicant over Printed Name
                            </div>

                            {!appPreview.signature && !appPreview.thumbmark && !appPreview.req_b_url && !appPreview.req_c_url && !appPreview.signature_data && (
                              <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>FILED DIGITALLY</span>
                            )}
                          </div>
                        </div>

                        {/* DATA PRIVACY */}
                        <div style={{
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          marginTop: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          DATA PRIVACY
                        </div>

                        <div style={{ border: '1px solid black', padding: '8px', fontSize: '9px', textAlign: 'justify', color: '#1e293b', lineHeight: '1.4', marginTop: '10px' }}>
                          In compliance with the provisions of R.A. No. 10173, otherwise known as the "Data Privacy Act of 2012", its Implementing Rules and Regulations, and issuances of the National Privacy Commission, the National Commission of Senior Citizens ensures that the personal information provided is collected, used, and processed by its authorized personnel and shall only be used for the implementation of R.A. No. 11982.
                        </div>

                      </div>

                      {/* PAGE 4 FOOTER BAR */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '15px',
                        paddingTop: '6px',
                        borderTop: '1px solid #cbd5e1',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#475569'
                      }}>
                        <div>Page 4 of 4</div>
                        <div>01.31.2025</div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setSelectedCitizenForPreview(null)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all cursor-pointer font-sans"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* REQUIRED FORM WARNING MODAL */}
      {requiredFormModalCitizen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden transform transition-all duration-300 scale-100">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mx-auto border border-amber-100 shadow-sm animate-pulse">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900 font-sans uppercase tracking-wider">
                  NCSC Application Form Required
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  To manage or update the status of <span className="font-extrabold text-slate-800">{requiredFormModalCitizen.first_name} {requiredFormModalCitizen.last_name}</span> under RA 11982, they must first have an accomplished and submitted official **Form Annex "A"**.
                </p>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  const citizen = requiredFormModalCitizen;
                  setRequiredFormModalCitizen(null);
                  handleApplyClick(citizen);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer font-sans shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Apply & Complete Form Now</span>
              </button>
              <button
                onClick={() => setRequiredFormModalCitizen(null)}
                className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer font-sans"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS SELECTION MODAL */}
      {statusModalCitizen && (
        (() => {
          const currentStatus = getCleanStatus(statusModalCitizen.id);
          const citizenId = statusModalCitizen.id;
          
          const STATUS_OPTIONS = [
            {
              value: 'Pending',
              label: 'Pending',
              icon: '⌛',
              bgClass: 'bg-amber-50 hover:bg-amber-100/60 border-amber-200 text-amber-800',
              activeClass: 'ring-2 ring-amber-500 bg-amber-50/80 border-amber-300',
              desc: 'Applicant is newly registered. Waiting for official verification or files.'
            },
            {
              value: 'Completed',
              label: 'Requirements Completed',
              icon: '📑',
              bgClass: 'bg-blue-50 hover:bg-blue-100/60 border-blue-200 text-blue-800',
              activeClass: 'ring-2 ring-blue-500 bg-blue-50/80 border-blue-300',
              desc: 'Official Annex A form and mandatory files are successfully uploaded and compiled.'
            },
            {
              value: 'Submitted',
              label: 'Submitted',
              icon: '✉️',
              bgClass: 'bg-purple-50 hover:bg-purple-100/60 border-purple-200 text-purple-800',
              activeClass: 'ring-2 ring-purple-500 bg-purple-50/80 border-purple-300',
              desc: 'Application details have been officially endorsed and transmitted to the national database.'
            },
            {
              value: 'Approved',
              label: 'Approved',
              icon: '✅',
              bgClass: 'bg-emerald-50 hover:bg-emerald-100/60 border-emerald-200 text-emerald-800',
              activeClass: 'ring-2 ring-emerald-500 bg-emerald-50/80 border-emerald-300',
              desc: 'National validation approved. Milestone benefits are verified and disbursed.'
            },
            {
              value: 'Disapproved',
              label: 'Disapproved',
              icon: '❌',
              bgClass: 'bg-rose-50 hover:bg-rose-100/60 border-rose-200 text-rose-800',
              activeClass: 'ring-2 ring-rose-500 bg-rose-50/80 border-rose-300',
              desc: 'Candidate is verified and declared ineligible for the milestone benefit program.'
            }
          ];

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-slate-950 font-sans uppercase tracking-wider">
                      Change Program Status
                    </h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider font-sans">
                      {statusModalCitizen.first_name} {statusModalCitizen.last_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setStatusModalCitizen(null)}
                    className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="text-xs text-slate-500 font-sans leading-relaxed mb-2">
                    Select a new status to progress this registered citizen's Centenarians Act (RA 11982) benefit program:
                  </div>

                  <div className="space-y-3">
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive = currentStatus === opt.value;
                      const isBtnDisabled = (currentStatus === 'Pending' && (opt.value === 'Submitted' || opt.value === 'Approved')) ||
                                            (currentStatus === 'Completed' && opt.value === 'Approved');
                      return (
                        <button
                          key={opt.value}
                          disabled={isBtnDisabled}
                          onClick={() => {
                            if (opt.value === 'Disapproved') {
                              setDisapprovalModalCitizen(statusModalCitizen);
                              setDisapprovalInputReason('');
                              setStatusModalCitizen(null);
                            } else {
                              updateStatus(citizenId, opt.value);
                              setStatusModalCitizen(null);
                            }
                          }}
                          className={cn(
                            "w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all font-sans relative",
                            isActive ? opt.activeClass : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm cursor-pointer",
                            isBtnDisabled && "opacity-45 bg-slate-50 border-slate-100 cursor-not-allowed pointer-events-none select-none"
                          )}
                        >
                          <span className="text-xl shrink-0 pt-0.5">
                            {isBtnDisabled ? '🔒' : opt.icon}
                          </span>
                          <div className="space-y-1">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              opt.bgClass
                            )}>
                              {opt.label}
                            </span>
                            <p className="text-xs text-slate-500 leading-normal font-sans font-medium">
                              {opt.desc}
                            </p>
                            {isBtnDisabled && (
                              <p className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider mt-1 font-sans">
                                ⚠️ Transition locked: {currentStatus === 'Pending' ? 'Requirements must be completed first' : 'Must be submitted first'}
                              </p>
                            )}
                          </div>
                          {isActive && (
                            <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  <button
                    onClick={() => setStatusModalCitizen(null)}
                    className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* REASON FOR DISAPPROVAL MODAL */}
      {disapprovalModalCitizen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-rose-950 font-sans uppercase tracking-wider flex items-center gap-2">
                  <span>❌</span> Reason for Disapproval
                </h3>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider font-sans">
                  {disapprovalModalCitizen.first_name} {disapprovalModalCitizen.last_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setDisapprovalModalCitizen(null);
                  setStatusModalCitizen(disapprovalModalCitizen);
                }}
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="text-xs font-bold text-slate-700 font-sans uppercase tracking-wider block">
                Disapproval Reason / Remarks
              </label>
              <textarea
                value={disapprovalInputReason}
                onChange={(e) => setDisapprovalInputReason(e.target.value)}
                placeholder="Specify details (e.g., incorrect birth certificate information, mismatching details on valid ID, candidate has already received benefits, etc.)"
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-sans font-medium text-slate-800 placeholder-slate-400 resize-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 leading-normal font-sans italic">
                This disapproval reason will be saved in the masterlist database and displayed to administrators when checking this senior citizen's benefit eligibility.
              </p>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => {
                  setDisapprovalModalCitizen(null);
                  setStatusModalCitizen(disapprovalModalCitizen);
                }}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer font-sans"
              >
                Back
              </button>
              <button
                onClick={() => {
                  updateStatus(disapprovalModalCitizen.id, 'Disapproved', disapprovalInputReason);
                  setDisapprovalModalCitizen(null);
                }}
                disabled={!disapprovalInputReason.trim()}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all font-sans",
                  disapprovalInputReason.trim()
                    ? "bg-rose-600 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-100 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed pointer-events-none"
                )}
              >
                Confirm Disapproval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirmCitizen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scale-up">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto border border-rose-100 shadow-sm">
                <Trash2 className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900 font-sans uppercase tracking-wider">
                  Delete Application Form?
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Are you sure you want to delete the submitted NCSC Application Form (Annex A) for <strong className="font-extrabold text-slate-800">{deleteConfirmCitizen.first_name} {deleteConfirmCitizen.last_name}</strong>?
                </p>
                <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-3 text-[11px] font-medium leading-relaxed font-sans text-left mt-2">
                  ⚠️ **Warning:** This action is irreversible. All completed form fields, digitised signatures, biometric files, and attachments will be permanently deleted, and their validation status will reset to **Pending**.
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmCitizen(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer font-sans"
              >
                No, Keep Form
              </button>
              <button
                onClick={() => handleDeleteApplication(deleteConfirmCitizen.id)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer font-sans shadow-md"
              >
                Yes, Delete Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS HISTORY MODAL */}
      {historyModalApp && (
        (() => {
          const citizenId = Number(historyModalApp.application_id || historyModalApp.id || historyModalApp.citizen_id || historyModalApp.user_id);
          const fullName = `${historyModalApp.last_name || ''}, ${historyModalApp.first_name || ''} ${historyModalApp.middle_name || ''}`.trim();
          const scidNumber = historyModalApp.scid_number || 'N/A';
          const historyList = getStatusHistory(historyModalApp);

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-sans uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-5 h-5 text-sky-600" /> Status History
                    </h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider font-sans">
                      {fullName} (SCID: {scidNumber})
                    </p>
                  </div>
                  <button
                    onClick={() => setHistoryModalApp(null)}
                    className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                  <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
                    {historyList.map((step: any, idx: number) => {
                      const isLast = idx === historyList.length - 1;
                      const stepStatus = step.status;
                      const dateStr = step.updated_at
                        ? new Date(step.updated_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A';

                      return (
                        <div key={idx} className="relative">
                          {/* Timeline Marker */}
                          <div className={cn(
                            "absolute -left-[35px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shadow-sm",
                            stepStatus === 'Pending' && "bg-amber-50 border-amber-300 text-amber-600",
                            (stepStatus === 'Requirements Completed' || stepStatus === 'Completed') && "bg-blue-50 border-blue-300 text-blue-600",
                            stepStatus === 'Submitted' && "bg-purple-50 border-purple-300 text-purple-600",
                            stepStatus === 'Approved' && "bg-emerald-50 border-emerald-300 text-emerald-600",
                            stepStatus === 'Disapproved' && "bg-rose-50 border-rose-300 text-rose-600"
                          )}>
                            {stepStatus === 'Pending' && "⌛"}
                            {(stepStatus === 'Requirements Completed' || stepStatus === 'Completed') && "📑"}
                            {stepStatus === 'Submitted' && "✉️"}
                            {stepStatus === 'Approved' && "✅"}
                            {stepStatus === 'Disapproved' && "❌"}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                                stepStatus === 'Pending' && "bg-amber-50 text-amber-700 border border-amber-100",
                                (stepStatus === 'Requirements Completed' || stepStatus === 'Completed') && "bg-blue-50 text-blue-700 border border-blue-100",
                                stepStatus === 'Submitted' && "bg-purple-50 text-purple-700 border border-purple-100",
                                stepStatus === 'Approved' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                                stepStatus === 'Disapproved' && "bg-rose-50 text-rose-700 border-rose-100"
                              )}>
                                {stepStatus === 'Completed' ? 'Requirements Completed' : stepStatus}
                              </span>
                              {isLast && (
                                <span className="bg-sky-50 text-sky-700 border border-sky-100 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded animate-pulse">
                                  Current Status
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 font-sans font-medium leading-relaxed">
                              {step.notes}
                            </p>

                            <div className="text-[10px] text-slate-400 font-mono font-medium">
                              last_updated: {dateStr}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
                  <button
                    onClick={() => setHistoryModalApp(null)}
                    className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer font-sans"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
