import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Check, 
  X, 
  AlertCircle,
  ChevronDown,
  Eye,
  Loader2,
  Plus,
  MoreVertical,
  Filter,
  RefreshCw,
  Pencil,
  Trash2
} from 'lucide-react';
import { cn, normalizeBirthdayIncentiveResponse } from '../lib/utils';
import { API_URL } from '../lib/config';
import BenefitsProfileModal from './BenefitsProfileModal';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface BirthdayIncentiveManagementProps {
  hideHeader?: boolean;
}

export default function BirthdayIncentiveManagement({ 
  hideHeader = false
}: BirthdayIncentiveManagementProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isUpdatingDisbursement, setIsUpdatingDisbursement] = useState<number | null>(null);
  const [pendingDisbursements, setPendingDisbursements] = useState<Record<number, string>>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
    type: 'danger' | 'primary' | 'success';
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDisbursementStatus, setBulkDisbursementStatus] = useState<string>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const lastFetchRef = useRef<number>(0);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role ? Number(user.role) : 0;

  const BARANGAYS = [
    'Addition Hills', 'Balong-Bato', 'Batis', 'Corazon de Jesus', 'Ermitaño', 
    'Greenhills', 'Isabelita', 'Kabayanan', 'Little Baguio', 'Maytunas', 
    'Onse', 'Pasadena', 'Pedro Cruz', 'Progreso', 'Rivera', 'Saint Joseph', 
    'Salapan', 'San Perfecto', 'Santa Lucia', 'Tibagan', 'West Crame'
  ];

  const fetchApplications = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 15000) return;
    lastFetchRef.current = now;

    setIsLoading(true);
    setApplications([]); // Reset state before fetch
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/birthday-incentives`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      const apps = normalizeBirthdayIncentiveResponse(data);
      setApplications(apps);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getCleanPath = (file: any) => {
    if (!file) return "";
    if (typeof file === "string" && file.startsWith("[")) {
      try {
        const parsed = JSON.parse(file);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const item = parsed[0];
          if (typeof item === 'string') return item;
          return item.path || item.file_path || file;
        }
      } catch (e) {}
    }
    if (Array.isArray(file) && file.length > 0) {
      const item = file[0];
      if (typeof item === 'string') return item;
      return item.path || item.file_path || "";
    }
    if (typeof file === "string" && file.startsWith("http")) {
       const parts = file.split('/storage/');
       if (parts.length > 1) return parts[1];
    }
    return file;
  };

  const getDisplayStatus = (status: string) => {
    if (!status) return "Pending";
    const s = String(status).toLowerCase();
    if (s === 'pending') return 'Pending';
    if (s === 'for release') return 'For Release';
    if (s === 'claimed') return 'Claimed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const updateDisbursementStatus = async (id: number) => {
    const app = applications.find(a => a.id === id);
    if (!app || (app.status || "").toLowerCase() !== 'approved') {
      toast.error("Disbursement can only be updated for approved records");
      return;
    }

    const status = pendingDisbursements[id];
    if (!status) return;

    setIsUpdatingDisbursement(id);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        disbursement_status: status,
      };

      const response = await fetch(`${API_URL}/birthday-incentives/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const item = data.data || data;
        const updatedStatus = String(item.disbursement?.status || item.disbursement_status || status).toLowerCase();

        setApplications(prev => prev.map(app => 
          app.id === id ? { ...app, disbursement_status: updatedStatus } : app
        ));
        setPendingDisbursements(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else {
        const error = await response.json();
        alert("Failed to update disbursement: " + (error.message || response.statusText));
      }
    } catch (error) {
      console.error("Disbursement update error:", error);
    } finally {
      setIsUpdatingDisbursement(null);
    }
  };

  const handleBulkDisbursementUpdate = async () => {
    if (selectedIds.length === 0 || !bulkDisbursementStatus) return;

    // Only update disbursement for approved applications
    const approvedSelectedIds = selectedIds.filter(id => {
      const app = applications.find(a => a.id === id);
      return (app?.status || "").toLowerCase() === 'approved';
    });

    if (approvedSelectedIds.length === 0) {
      toast.error("No approved records found in selection. Disbursement status can only be updated for approved records.");
      return;
    }

    setIsBulkUpdating(true);
    const toastId = toast.loading(`Updating ${approvedSelectedIds.length} approved records...`);
    
    try {
      const token = localStorage.getItem("token");
      
      const updatePromises = approvedSelectedIds.map(id => 
        fetch(`${API_URL}/birthday-incentives/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ disbursement_status: bulkDisbursementStatus })
        })
      );

      const results = await Promise.all(updatePromises);
      const successfulCount = results.filter(r => r.ok).length;

      if (successfulCount > 0) {
        setApplications(prev => prev.map(app => 
          approvedSelectedIds.includes(app.id) ? { ...app, disbursement_status: bulkDisbursementStatus.toLowerCase() } : app
        ));
        setSelectedIds([]);
        setBulkDisbursementStatus('');
        
        if (approvedSelectedIds.length < selectedIds.length) {
          toast.success(`Updated ${successfulCount} approved records. Some records were skipped because they are not yet approved.`, { id: toastId, duration: 5000 });
        } else {
          toast.success(`Successfully updated ${successfulCount} records`, { id: toastId });
        }
      } else {
        toast.error("Failed to update records", { id: toastId });
      }
    } catch (error) {
      console.error("Bulk update error:", error);
      toast.error("An error occurred during bulk update", { id: toastId });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredApplications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplications.map(app => app.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateStatus = async (id: number, selectedStatus: string) => {
    setIsProcessingAction(true);
    const mapStatus = (status: string) => {
      const s = String(status || '').toLowerCase();
      if (s === 'approved') return 'Approved';
      if (s === 'disapproved' || s === 'rejected') return 'Disapproved';
      return 'Pending';
    };

    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        status: mapStatus(selectedStatus)
      };

      const response = await fetch(`${API_URL}/birthday-incentives/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const updatedData = result.data || result;

      if (response.ok) {
        await fetchApplications(true);
        setOpenDropdownId(null);
        setIsConfirmModalOpen(false);
        const displayStatus = selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1);
        toast.success(`Record marked as ${displayStatus} successfully`);
      } else {
        console.error("API error:", updatedData);
        toast.error("Failed to update status: " + (updatedData.message || response.statusText));
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An error occurred");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleStatusChangeClick = (id: number, status: string) => {
    setConfirmConfig({
      title: 'Confirm Action',
      message: `Are you sure you want to change the status to ${status}?`,
      action: () => updateStatus(id, status),
      type: status === 'approved' ? 'success' : 'danger'
    });
    setIsConfirmModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleMoveToPendingClick = (id: number) => {
    setConfirmConfig({
      title: 'Move to Pending',
      message: 'Are you sure you want to move this record back to Pending status?',
      action: () => updateStatus(id, 'pending'),
      type: 'primary'
    });
    setIsConfirmModalOpen(true);
    setOpenDropdownId(null);
  };

  const [isEditMode, setIsEditMode] = useState(false);

  const handleNewEntry = () => {
    const newApp: any = {
      id: undefined,
      citizen_id: "",
      scid_number: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      birth_date: "",
      age: "",
      contact_number: "",
      barangay: "",
      city_municipality: "",
      province: "",
      incentive_tier: "",
      reg_status: "pending"
    };
    setSelectedApp(newApp);
    setIsEditMode(true);
    setIsProfileModalOpen(true);
  };

  const handleSave = async (updatedApp: any, files?: File[]) => {
    try {
      const token = localStorage.getItem("token");
      const isNew = !updatedApp.id;
      const url = isNew 
        ? `${API_URL}/birthday-incentives` 
        : `${API_URL}/birthday-incentives/${updatedApp.id}`;
      
      const mapStatus = (status: string) => {
        const s = String(status || '').toLowerCase();
        if (s === 'approved') return 'Approved';
        if (s === 'disapproved' || s === 'rejected') return 'Disapproved';
        return 'Pending';
      };

      let response: Response;

      if (isNew) {
        const fd = new FormData();
        
        // Strict required fields filtering
        const requiredFields = [
          "citizen_id", "scid_number", "first_name", "middle_name", "last_name", 
          "birth_date", "age", "contact_number", "barangay", 
          "city_municipality", "province", "incentive_tier"
        ];

        requiredFields.forEach(field => {
          const val = updatedApp[field];
          if (val !== undefined && val !== null) {
            fd.append(field, String(val));
          } else {
            fd.append(field, "");
          }
        });

        // Use status instead of reg_status for consistency with requirements
        fd.append("status", mapStatus(updatedApp.status || updatedApp.reg_status));

        // Handle Files - Only birthcertificate is allowed
        if (files && files.length > 0) {
          const birthCertFile = files.find(f => 
            (f.name.toLowerCase().includes("birth") || f.name.toLowerCase().includes("certificate") || f.name === "document") && 
            f.name !== "captured_photo.jpg"
          );
          if (birthCertFile) fd.append("birthcertificate", birthCertFile);
        }

        response = await fetch(url, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: fd
        });
      } else {
        const payload = {
          status: mapStatus(updatedApp.status || updatedApp.reg_status)
        };

        response = await fetch(url, {
          method: "PUT",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        await fetchApplications();
        setIsProfileModalOpen(false);
        setSelectedApp(null);
        alert(isNew ? "New application created successfully" : "Profile updated successfully");
      } else {
        const data = await response.json();
        alert(data.message || `Failed to ${isNew ? 'create' : 'update'} profile`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred during save");
    }
  };

  const handleDelete = async (id: number) => {
    setIsProcessingAction(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/birthday-incentives/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchApplications(true);
        setOpenDropdownId(null);
        setIsConfirmModalOpen(false);
        toast.success("Record deleted successfully");
      } else {
        toast.error("Failed to delete application");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred during deletion");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setConfirmConfig({
      title: 'Delete Record',
      message: 'Are you sure you want to delete this record? This action cannot be undone.',
      action: () => handleDelete(id),
      type: 'danger'
    });
    setIsConfirmModalOpen(true);
    setOpenDropdownId(null);
  };

  const filteredApplications = applications.filter(app => {
    const fullName = (app.full_name || `${app.first_name || ''} ${app.last_name || ''}`).toLowerCase();
    const scid = app.scid_number || "";
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || scid.includes(searchTerm);
    const matchesBarangay = barangayFilter === 'All' || app.barangay === barangayFilter;
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter.toLowerCase();
    return matchesSearch && matchesBarangay && matchesStatus;
  });

  const handleViewProfile = async (app: any, isEdit = false) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/birthday-incentives/${app.id}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const record = data.data || data;
        setSelectedApp({
          ...record,
          registration_type: "Birthday Cash Incentive"
        });
        setIsEditMode(isEdit);
        setIsProfileModalOpen(true);
      } else {
        alert("Failed to fetch application details");
      }
    } catch (error) {
      console.error("Fetch details error:", error);
      alert("Error fetching details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="space-y-8">
      {!hideHeader && (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Birthday Cash Incentive</h2>
            <p className="text-slate-500 font-medium mt-1">Benefit Application Registry</p>
          </div>
          {userRole !== 3 && (
            <button 
              className="flex items-center gap-2 px-6 py-3 bg-[#ef4444] text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all shadow-sm"
              onClick={handleNewEntry}
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>
          )}
        </header>
      )}

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                {selectedIds.length} Selected
              </div>
              <p className="text-sm text-slate-300 font-medium">Batch Update Disbursement Status</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                value={bulkDisbursementStatus}
                onChange={(e) => setBulkDisbursementStatus(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-semibold text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer min-w-[160px]"
              >
                <option value="" className="text-slate-900">Select Status...</option>
                <option value="Pending" className="text-slate-900">Pending</option>
                <option value="For Release" className="text-slate-900">For Release</option>
                <option value="Claimed" className="text-slate-900">Claimed</option>
              </select>
              
              <button
                onClick={handleBulkDisbursementUpdate}
                disabled={!bulkDisbursementStatus || isBulkUpdating || userRole === 4}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
              >
                {isBulkUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Apply to Selected
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setSelectedIds([])}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Clear Selection"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or SCID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <select 
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all cursor-pointer min-w-[200px] shadow-sm"
          >
            <option value="All">All Barangays</option>
            {BARANGAYS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all cursor-pointer min-w-[160px] shadow-sm"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Disapproved">Disapproved</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox"
                    checked={selectedIds.length === filteredApplications.length && filteredApplications.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-[#ef4444] focus:ring-[#ef4444] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Applied Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Tier</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Disbursement Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 text-[#EF4444] animate-spin" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Applications...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <AlertCircle className="w-16 h-16 text-slate-100" />
                      <p className="text-slate-400 font-medium text-lg">No records found matching criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => {
                  const status = (app.status || "pending").toLowerCase();
                  return (
                    <tr key={app.id || `app-${index}`} className={cn(
                      "hover:bg-slate-50 transition-colors",
                      selectedIds.includes(app.id) && "bg-slate-50/80"
                    )}>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#ef4444] focus:ring-[#ef4444] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-slate-500">{formatDate(app.applied_date)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {app.full_name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-medium text-slate-600 font-mono tracking-wider">{app.tier}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                        app.status === 'approved' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                        app.status === 'pending' && "bg-amber-50 text-amber-600 border-amber-100",
                        (app.status === 'rejected' || app.status === 'disapproved') && "bg-rose-50 text-rose-600 border-rose-100",
                      )}>
                        {app.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <select
                          disabled={userRole === 4}
                          value={pendingDisbursements[app.id] || getDisplayStatus(app.disbursement_status)}
                          onChange={(e) => setPendingDisbursements(prev => ({ ...prev, [app.id]: e.target.value }))}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider rounded border px-2 py-1 outline-none transition-colors",
                            userRole === 4 ? "bg-slate-50 cursor-not-allowed opacity-70" : "",
                            (pendingDisbursements[app.id]?.toLowerCase() || String(app.disbursement_status).toLowerCase()) === 'claimed' && "bg-blue-50 text-blue-600 border-blue-100",
                            (pendingDisbursements[app.id]?.toLowerCase() || String(app.disbursement_status).toLowerCase()) === 'for release' && "bg-indigo-50 text-indigo-600 border-indigo-100",
                            (pendingDisbursements[app.id]?.toLowerCase() === 'pending' || String(app.disbursement_status).toLowerCase() === 'pending' || !app.disbursement_status) && "bg-amber-50 text-amber-600 border-amber-100"
                          )}
                        >
                          <option value="Pending">Pending</option>
                          <option value="For Release">For Release</option>
                          <option value="Claimed">Claimed</option>
                        </select>
                        
                        {pendingDisbursements[app.id] && pendingDisbursements[app.id]?.toLowerCase() !== String(app.disbursement_status).toLowerCase() && (
                          <button
                            onClick={() => updateDisbursementStatus(app.id)}
                            disabled={isUpdatingDisbursement === app.id}
                            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors disabled:opacity-50"
                            title="Save Changes"
                          >
                            {isUpdatingDisbursement === app.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === app.id ? null : app.id);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                        
                        <AnimatePresence>
                          {openDropdownId === app.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-30" 
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-40"
                              >
                                  <button 
                                    onClick={() => {
                                      handleViewProfile(app, false);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 transition-all"
                                  >
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    View Details
                                  </button>
                                  {userRole !== 3 && (
                                    <button 
                                      onClick={() => {
                                        handleViewProfile(app, true);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-indigo-600 transition-all"
                                    >
                                      <Pencil className="w-4 h-4 text-indigo-400" />
                                      Edit Profile
                                    </button>
                                  )}
                                  
                                  {status === 'pending' ? (
                                    <>
                                      {userRole !== 4 && (
                                        <>
                                          <button 
                                            onClick={() => handleStatusChangeClick(app.id, 'approved')}
                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-600 transition-all"
                                          >
                                            <Check className="w-4 h-4" />
                                            Approve
                                          </button>
                                          <button 
                                            onClick={() => handleStatusChangeClick(app.id, 'disapproved')}
                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-rose-50 rounded-lg text-xs font-semibold text-rose-600 transition-all"
                                          >
                                            <X className="w-4 h-4" />
                                            Disapprove
                                          </button>
                                        </>
                                      )}
                                      
                                      {(userRole === 1 || userRole === 2 || (userRole === 4 && status === 'pending')) && (
                                        <button 
                                          onClick={() => handleDeleteClick(app.id)}
                                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-rose-50 rounded-lg text-xs font-semibold text-rose-500 transition-all border-t border-slate-100"
                                        >
                                          <Trash2 className="w-4 h-4 py-0.5" />
                                          Delete Record
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    userRole !== 4 && (
                                      <button 
                                        onClick={() => handleMoveToPendingClick(app.id)}
                                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 rounded-lg text-xs font-semibold text-blue-600 transition-all"
                                      >
                                        <RefreshCw className="w-4 h-4" />
                                        Move to Pending
                                      </button>
                                    )
                                  )}
                                </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isProfileModalOpen && selectedApp && (
          <BenefitsProfileModal 
            application={selectedApp}
            isOpen={isProfileModalOpen}
            onClose={() => {
              setIsProfileModalOpen(false);
              setIsEditMode(false);
            }}
            onSave={handleSave} 
            initialIsEditing={isEditMode}
          />
        )}
      </AnimatePresence>

      {/* Action Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && confirmConfig && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessingAction && setIsConfirmModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    confirmConfig.type === 'danger' ? "bg-rose-50" : "bg-emerald-50"
                  )}>
                    {confirmConfig.type === 'danger' ? (
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                    ) : (
                      <Check className="w-6 h-6 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      {confirmConfig.title}
                    </h2>
                  </div>
                </div>
              </div>
    
              <div className="p-8">
                <p className="text-sm font-semibold text-slate-600 leading-relaxed text-center">
                  {confirmConfig.message}
                </p>
              </div>
    
              <div className="p-8 pt-0 flex gap-3">
                <button
                  disabled={isProcessingAction}
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.1em] hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isProcessingAction}
                  onClick={confirmConfig.action}
                  className={cn(
                    "flex-1 py-4 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none",
                    confirmConfig.type === 'danger' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                  )}
                >
                  {isProcessingAction ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
