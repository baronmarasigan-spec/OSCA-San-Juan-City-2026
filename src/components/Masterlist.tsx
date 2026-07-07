import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  ClipboardList,
  User,
  RefreshCw,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit3,
  Key,
  X,
  Trash2,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, exportToCSV } from '../lib/utils';
import { Application } from '../App';
import { API_URL } from '../lib/config';

interface MasterlistProps {
  onViewProfile: (app: Application) => void;
  refreshTrigger?: number;
  onMoveToPending: (citizenId: number) => void;
  onResetPassword: (id: number) => void;
  onDeleteRecord?: (id: number) => void;
  onUnauthorized?: () => void;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export default function Masterlist({ onViewProfile, refreshTrigger, onMoveToPending, onResetPassword, onDeleteRecord, onUnauthorized }: MasterlistProps) {
  const [masterlistData, setMasterlistData] = useState<any[]>([]);
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role ? Number(user.role) : 0;
  const canEdit = [1, 2].includes(userRole);
  const canMoveToPending = [1, 2, 3].includes(userRole);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVitalStatuses, setSelectedVitalStatuses] = useState<string[]>([]);
  const [barangay, setBarangay] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Transfer and Filter states
  const [transferFilter, setTransferFilter] = useState<'all' | 'san-juan' | 'transferred'>('san-juan');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferItem, setSelectedTransferItem] = useState<any | null>(null);
  const [dateOfTransfer, setDateOfTransfer] = useState('');
  const [transferredTo, setTransferredTo] = useState('');
  const [transferredToCustom, setTransferredToCustom] = useState('');
  const [proofOfTransfer, setProofOfTransfer] = useState<File | null>(null);
  const [proofOfTransferBase64, setProofOfTransferBase64] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showMoveConfirmModal, setShowMoveConfirmModal] = useState(false);
  const [selectedMoveItem, setSelectedMoveItem] = useState<any | null>(null);
  const [isMovingToSanJuan, setIsMovingToSanJuan] = useState(false);

  const lastFetchRef = useRef<number>(0);

  const fetchMasterlist = useCallback(async () => {
    // Throttle: don't fetch more than once every 30 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 30000) return;
    lastFetchRef.current = now;

    setIsLoading(true);
    setMasterlistData([]); // Reset data on fetch start
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch a large enough dataset for local filtering
      const url = `${API_URL}/masterlist?per_page=5000`;
      const response = await fetch(url, { headers });
      
      if (response.status === 429) {
        setError("Rate limit reached. Please wait a moment.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      let data = [];
      if (result.data && Array.isArray(result.data.data)) {
        data = result.data.data;
      } else if (Array.isArray(result.data)) {
        data = result.data;
      } else if (Array.isArray(result)) {
        data = result;
      }
      setMasterlistData(data);
    } catch (err: any) {
      console.error("FETCH MASTERLIST ERROR:", err);
      if (err.message?.includes('401') && onUnauthorized) {
        onUnauthorized();
      }
      setError("Failed to load masterlist data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    fetchMasterlist();
  }, [fetchMasterlist, refreshTrigger]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId !== null) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  const toggleVitalStatus = (status: string) => {
    setSelectedVitalStatuses(prev => 
      prev.includes(status) 
        ? [] 
        : [status]
    );
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setBarangay('');
    setSelectedVitalStatuses([]);
    setTransferFilter('all');
    setCurrentPage(1);
  };

  const existingTransferredTo = React.useMemo(() => {
    const list = masterlistData
      .map(item => (item.transferred_to || '').toString().trim())
      .filter(Boolean);
    return Array.from(new Set(list)).sort() as string[];
  }, [masterlistData]);

  const defaultCities = ["Mandaluyong", "Pasig", "Quezon City", "Manila", "Makati", "Taguig", "Pasay"];
  const combinedTransferredOptions = React.useMemo(() => {
    return Array.from(new Set([...existingTransferredTo, ...defaultCities])).sort() as string[];
  }, [existingTransferredTo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofOfTransfer(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofOfTransferBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransferItem) return;
    if (!dateOfTransfer) {
      alert("Please specify the date of transfer");
      return;
    }
    const finalTransferredTo = transferredTo === 'Other' ? transferredToCustom : transferredTo;
    if (!finalTransferredTo) {
      alert("Please specify the transfer destination");
      return;
    }

    setIsTransferring(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const id = selectedTransferItem.id || selectedTransferItem.citizen_id;
      const endpoint = `${API_URL}/masterlist/${id}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          date_of_transfer: dateOfTransfer,
          transferred_to: finalTransferredTo,
          proof_of_transfer: proofOfTransferBase64 || (proofOfTransfer ? proofOfTransfer.name : '')
        })
      });

      if (res.ok) {
        alert("Transfer details successfully updated");
        setShowTransferModal(false);
        setDateOfTransfer('');
        setTransferredTo('');
        setTransferredToCustom('');
        setProofOfTransfer(null);
        setProofOfTransferBase64(null);
        setSelectedTransferItem(null);
        
        lastFetchRef.current = 0; // Bypass throttle
        fetchMasterlist();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to save transfer details: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Transfer error:", err);
      alert("An error occurred during transfer updating");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleMoveToSanJuan = (item: any) => {
    setSelectedMoveItem(item);
    setShowMoveConfirmModal(true);
  };

  const handleMoveToSanJuanConfirm = async () => {
    if (!selectedMoveItem) return;
    setIsMovingToSanJuan(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const id = selectedMoveItem.id || selectedMoveItem.citizen_id;
      const endpoint = `${API_URL}/masterlist/${id}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          date_of_transfer: null,
          transferred_to: null,
          proof_of_transfer: null
        })
      });

      if (res.ok) {
        alert("Citizen moved back to San Juan successfully");
        setShowMoveConfirmModal(false);
        setSelectedMoveItem(null);
        lastFetchRef.current = 0; // Bypass throttle
        fetchMasterlist();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to move back to San Juan: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Move to San Juan error:", err);
      alert("An error occurred while moving back to San Juan");
    } finally {
      setIsMovingToSanJuan(false);
    }
  };

  const formatFullName = (item: any) => {
    const parts = [
      item.first_name,
      item.middle_name,
      item.last_name,
      item.suffix
    ].filter(Boolean);
    return parts.join(' ').toUpperCase();
  };

  const getBarangayFromAddress = (address?: string) => {
    if (!address) return 'N/A';
    const parts = address.split(',');
    return parts[0].trim();
  };

  // Local Filtering Logic
  const filteredData = React.useMemo(() => {
    return masterlistData.filter(item => {
      const fullName = formatFullName(item).toLowerCase();
      const scid = (item.scid_number || '').toString().toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        fullName.includes(searchLower) || 
        scid.includes(searchLower);

      const itemVitalStatus = (item.vital_status || '').toString().toLowerCase();
      const matchesVitalStatus = selectedVitalStatuses.length === 0 || 
        selectedVitalStatuses.some(s => s.toLowerCase() === itemVitalStatus);

      const brgy = getBarangayFromAddress(item.barangay);
      const matchesBarangay = barangay === '' || brgy === barangay;

      // Transfer Filter Logic:
      // San Juan = is blank; Transferred = is not blank
      const transToVal = (item.transferred_to || '').toString().trim();
      const matchesTransfer = transferFilter === 'all' || 
        (transferFilter === 'san-juan' && transToVal === '') ||
        (transferFilter === 'transferred' && transToVal !== '');

      return matchesSearch && matchesVitalStatus && matchesBarangay && matchesTransfer;
    });
  }, [masterlistData, searchTerm, selectedVitalStatuses, barangay, transferFilter]);

  // Dynamic Barangay Counts based on OTHER filters
  const barangayCounts = React.useMemo(() => {
    // We want counts for each barangay after applying search, vital status, and transfer filters
    const baseFiltered = masterlistData.filter(item => {
      const fullName = formatFullName(item).toLowerCase();
      const scid = (item.scid_number || '').toString().toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        fullName.includes(searchLower) || 
        scid.includes(searchLower);

      const itemVitalStatus = (item.vital_status || '').toString().toLowerCase();
      const matchesVitalStatus = selectedVitalStatuses.length === 0 || 
        selectedVitalStatuses.some(s => s.toLowerCase() === itemVitalStatus);

      const transToVal = (item.transferred_to || '').toString().trim();
      const matchesTransfer = transferFilter === 'all' || 
        (transferFilter === 'san-juan' && transToVal === '') ||
        (transferFilter === 'transferred' && transToVal !== '');

      return matchesSearch && matchesVitalStatus && matchesTransfer;
    });

    return baseFiltered.reduce((acc, item) => {
      const brgy = getBarangayFromAddress(item.barangay);
      if (brgy) {
        acc[brgy] = (acc[brgy] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [masterlistData, searchTerm, selectedVitalStatuses, transferFilter]);

  const availableBarangays = React.useMemo(() => {
    return Object.keys(barangayCounts).sort();
  }, [barangayCounts]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchMasterlistPage = (page: number) => {
    setCurrentPage(page);
  };

  const updateStatus = async (id: number, status: string) => {
    // ... existing updateStatus remains for other status changes if needed
    // but we'll use handleMoveToPending for the specific action
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // In Masterlist, we are always dealing with masterlist records
      const endpoint = `${API_URL}/masterlist/${id}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers,
        body: JSON.stringify({ reg_status: status })
      });

      if (res.ok) {
        alert(`Status updated to ${status}`);
        fetchMasterlist();
      } else {
        const data = await res.json();
        alert(`Update failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Update failed");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Local search, no need to fetch
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const handleViewProfileClick = (item: any) => {
    // Map the fields to match the Application interface expected by ProfileModal
    // Ensure all fields from API response are preserved exactly
    const mappedApp: Application = {
      ...item,
      id: item.application_id || item.id || item.citizen_id,
      application_id: item.application_id || item.id,
      citizen_id: item.citizen_id,
      // Ensure support_inkind_details is used if kind_support_details is present
      support_inkind_details: item.support_inkind_details || item.kind_support_details,
    };
    
    onViewProfile(mappedApp);
  };

  const handleExportCSV = () => {
    const headers = [
      'SCID Number',
      'Name',
      'Birth Date',
      'Barangay',
      'Registration Type',
      'Issued ID'
    ];

    const dataToExport = filteredData.map(item => ({
      'SCID Number': item.scid_number || '',
      'Name': formatFullName(item),
      'Birth Date': formatDate(item.birth_date),
      'Barangay': item.barangay || '',
      'Registration Type': item.registration_type || 'OFFICIAL',
      'Issued ID': item.id_status === 'new' ? 'Not Issued' : 'Issued'
    }));

    exportToCSV(dataToExport, headers, 'masterlist.csv');
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Masterlist</h2>
        <p className="text-slate-500 font-medium mt-1">Official Registry (SCID Protocol)</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by full name or SCID Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => toggleVitalStatus('active')}
                className={cn(
                  "px-5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  selectedVitalStatuses.includes('active')
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Active
              </button>
              <button
                onClick={() => toggleVitalStatus('deceased')}
                className={cn(
                  "px-5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  selectedVitalStatuses.includes('deceased')
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Deceased
              </button>
            </div>

            {/* San Juan / Transferred Residence Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTransferFilter('all');
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  transferFilter === 'all'
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                All
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setTransferFilter('san-juan');
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  transferFilter === 'san-juan'
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-700"
                )}
                title="transferred_to is blank"
              >
                San Juan
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setTransferFilter('transferred');
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  transferFilter === 'transferred'
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-700"
                )}
                title="transferred_to is not blank"
              >
                Transferred
              </button>
            </div>

            <div className="relative">
              <select 
                value={barangay}
                onChange={(e) => {
                  setBarangay(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 appearance-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all cursor-pointer"
              >
                <option value="">All Barangays ({filteredData.length})</option>
                {availableBarangays.map(bg => (
                  <option key={bg} value={bg}>{bg} ({barangayCounts[bg]})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {searchTerm || barangay || selectedVitalStatuses.length > 0 ? (
              <button 
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-[#ef4444] transition-colors text-xs font-black uppercase tracking-widest bg-slate-50 rounded-xl"
              >
                <X className="w-4 h-4" />
                Remove All Filters
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCSV}
              disabled={isLoading || masterlistData.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {transferFilter === 'transferred' ? (
                  <>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">SCID Number</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Birth Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Previous Barangay</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Transferred To</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Date Transferred</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Action</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">SCID Number</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Birth Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Barangay</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Date Approved</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">ID Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Action</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={transferFilter === 'transferred' ? 7 : 8} className="px-8 py-32 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <p className="font-medium text-sm">Fetching registry...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={transferFilter === 'transferred' ? 7 : 8} className="px-8 py-32 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-500 font-medium">{error}</p>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={transferFilter === 'transferred' ? 7 : 8} className="px-8 py-32 text-center text-slate-400 font-medium">
                    No registry records found
                  </td>
                </tr>
              ) : (
                currentData.map((item) => {
                  const isTransferredRow = (item.transferred_to || '').toString().trim() !== '';
                  const rowId = item.id || item.citizen_id;
                  
                  return (
                    <tr key={rowId} className="hover:bg-slate-50 transition-colors">
                      {transferFilter === 'transferred' ? (
                        <>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-[#ef4444] font-mono">
                              {item.scid_number || '---'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatFullName(item)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-medium text-slate-600">
                              {formatDate(item.birth_date)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-semibold text-slate-700">
                              {getBarangayFromAddress(item.barangay)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-medium text-slate-700">
                              {item.transferred_to || 'N/A'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-medium text-slate-500">
                              {formatDate(item.date_of_transfer)}
                            </p>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-[#ef4444] font-mono">
                              {item.scid_number || '---'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatFullName(item)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-medium text-slate-600">
                              {formatDate(item.birth_date)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-semibold text-slate-700">
                              {getBarangayFromAddress(item.barangay)}
                            </p>
                            {item.transferred_to && (
                              <div className="mt-1">
                                <span className="inline-block text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md">
                                  To: {item.transferred_to}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-medium text-slate-500">
                              {formatDate(item.date_created)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 tracking-wider">
                            {item.registration_type || 'OFFICIAL'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              (() => {
                                const status = (item.id_status || 'NEW').toString().toLowerCase();
                                if (status === 'new' || status === 'pending') return "bg-amber-50 text-amber-600 border border-amber-200";
                                if (status === 'printed') return "bg-blue-50 text-blue-600 border border-blue-200";
                                if (status === 'released' || status === 'issued') return "bg-indigo-50 text-indigo-600 border border-indigo-200";
                                if (status === 'for releasing') return "bg-blue-50 text-blue-600 border border-blue-200"; // Same as printed
                                if (status === 'rejected' || status === 'cancelled' || status === 'disapproved') return "bg-rose-50 text-rose-600 border border-rose-200";
                                if (status === 'approved') return "bg-emerald-50 text-emerald-600 border border-emerald-200";
                                return "bg-slate-50 text-slate-600 border border-slate-200";
                              })()
                            )}>
                              {item.id_status || 'NEW'}
                            </span>
                          </td>
                        </>
                      )}
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const rowId = item.id || item.citizen_id;
                              setOpenDropdownId(openDropdownId === rowId ? null : rowId);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>

                          <AnimatePresence>
                            {openDropdownId === (item.id || item.citizen_id) && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: 10 }}
                                className="absolute right-12 top-1/2 -translate-y-1/2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden origin-right"
                              >
                                {isTransferredRow ? (
                                  <>
                                    <button 
                                      onClick={() => {
                                        handleViewProfileClick(item);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Profile
                                    </button>
                                    {canEdit && (
                                      <button 
                                        onClick={() => {
                                          handleMoveToSanJuan(item);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 transition-colors"
                                      >
                                        <MapPin className="w-4 h-4 text-rose-500" />
                                        Move to San Juan
                                      </button>
                                    )}
                                    {canEdit && onDeleteRecord && (
                                      <button 
                                        onClick={() => {
                                          onDeleteRecord(item.citizen_id || item.id);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-red-600 uppercase tracking-widest hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Record
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => {
                                        handleViewProfileClick(item);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Profile
                                    </button>

                                    {canEdit && (
                                      <>
                                        <button 
                                          onClick={() => {
                                            handleViewProfileClick(item);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                          Edit Profile
                                        </button>
                                        <button 
                                          onClick={() => {
                                            onResetPassword(item.id || item.citizen_id);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                        >
                                          <Key className="w-4 h-4" />
                                          Reset Password
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setSelectedTransferItem(item);
                                            setDateOfTransfer(item.date_of_transfer || '');
                                            setTransferredTo(item.transferred_to || '');
                                            if (item.transferred_to && !combinedTransferredOptions.includes(item.transferred_to)) {
                                              setTransferredTo('Other');
                                              setTransferredToCustom(item.transferred_to);
                                            } else {
                                              setTransferredToCustom('');
                                            }
                                            setShowTransferModal(true);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                        >
                                          <RefreshCw className="w-4 h-4 text-slate-400" />
                                          Transfer
                                        </button>
                                      </>
                                    )}

                                    {canMoveToPending && (
                                      <>
                                        <div className="h-px bg-slate-50 my-1" />
                                        <button 
                                          onClick={() => {
                                            onMoveToPending(item.citizen_id);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-amber-600 uppercase tracking-widest hover:bg-amber-50 transition-colors"
                                        >
                                          <RefreshCw className="w-4 h-4" />
                                          Move to Pending
                                        </button>
                                      </>
                                    )}

                                    {canEdit && onDeleteRecord && (
                                      <button 
                                        onClick={() => {
                                          onDeleteRecord(item.citizen_id || item.id);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-red-600 uppercase tracking-widest hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Record
                                      </button>
                                    )}
                                  </>
                                )}
                              </motion.div>
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

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing page {currentPage} of {totalPages} ({filteredData.length} total)
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchMasterlistPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = currentPage - 2 + i;
                  if (currentPage <= 2) pageNum = i + 1;
                  if (currentPage >= totalPages - 1) pageNum = totalPages - 4 + i;
                  
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchMasterlistPage(pageNum)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-xs font-black transition-all",
                          currentPage === pageNum 
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                            : "text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => fetchMasterlistPage(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && selectedTransferItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isTransferring) setShowTransferModal(false); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl z-20"
            >
              <button 
                type="button"
                onClick={() => setShowTransferModal(false)}
                disabled={isTransferring}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer border border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 font-sans">Transfer Record</h3>
                <p className="text-slate-500 text-sm mt-1 font-sans">
                  Record transfer of citizen <span className="font-semibold text-slate-800">{formatFullName(selectedTransferItem)}</span> to another location.
                </p>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-5 font-sans">
                {/* Date of transfer */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Date of Transfer <span className="text-[#ef4444]">*</span>
                  </label>
                  <input 
                    type="date"
                    required
                    value={dateOfTransfer}
                    onChange={(e) => setDateOfTransfer(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all"
                  />
                </div>

                {/* Transferred to */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Transferred To <span className="text-[#ef4444]">*</span>
                  </label>
                  <select 
                    value={transferredTo}
                    onChange={(e) => {
                      setTransferredTo(e.target.value);
                      if (e.target.value !== 'Other') {
                        setTransferredToCustom('');
                      }
                    }}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select Municipality/City...</option>
                    {combinedTransferredOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="Other">Other / Not Listed (Type below)</option>
                  </select>

                  {(transferredTo === 'Other' || (!combinedTransferredOptions.includes(transferredTo) && transferredTo !== '')) && (
                    <input 
                      type="text"
                      required
                      placeholder="Specify municipality/city name..."
                      value={transferredToCustom}
                      onChange={(e) => setTransferredToCustom(e.target.value)}
                      className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all"
                    />
                  )}
                </div>

                {/* Proof of transfer */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Proof of Transfer (Attachment)
                  </label>
                  
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center cursor-pointer">
                    <input 
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*,application/pdf"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">
                        {proofOfTransfer ? proofOfTransfer.name : 'Click to select proof of transfer'}
                      </p>
                      <p className="text-xs text-slate-400">
                        PDF, JPG, JPEG, or PNG up to 5MB
                      </p>
                    </div>
                  </div>

                  {proofOfTransferBase64 && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                      <span className="text-xs font-medium text-slate-600 truncate max-w-[80%]">
                        Proof File Loaded ({Math.round(proofOfTransferBase64.length / 1024)} KB)
                      </span>
                      <button 
                        type="button"
                        onClick={() => {
                          setProofOfTransfer(null);
                          setProofOfTransferBase64(null);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit / Cancel */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    disabled={isTransferring}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isTransferring}
                    className="flex-1 px-4 py-3 bg-[#ef4444] hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isTransferring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Transfer'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Move to San Juan Confirmation Modal */}
      <AnimatePresence>
        {showMoveConfirmModal && selectedMoveItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isMovingToSanJuan) setShowMoveConfirmModal(false); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl z-20"
            >
              <button 
                type="button"
                onClick={() => setShowMoveConfirmModal(false)}
                disabled={isMovingToSanJuan}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer border border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mt-4">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
                  <MapPin className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 font-sans">Move back to San Juan?</h3>
                <p className="text-slate-500 text-sm mt-3 font-sans leading-relaxed">
                  Are you sure you want to move <span className="font-semibold text-slate-800">{formatFullName(selectedMoveItem)}</span> back to San Juan masterlist?
                </p>
                <p className="text-xs text-rose-500 font-semibold mt-2 font-sans bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 max-w-xs">
                  This will clear all transfer details (Date of transfer, Transferred to, and Proof of transfer).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMoveConfirmModal(false)}
                  disabled={isMovingToSanJuan}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMoveToSanJuanConfirm}
                  disabled={isMovingToSanJuan}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isMovingToSanJuan ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Moving...
                    </>
                  ) : (
                    'Confirm Move'
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

function ChevronDown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
