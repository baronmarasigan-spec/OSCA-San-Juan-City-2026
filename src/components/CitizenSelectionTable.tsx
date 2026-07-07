import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, AlertCircle, ArrowLeft, Loader2, Check, X, ChevronDown } from 'lucide-react';
import { cn, normalizeCashGiftResponse } from '../lib/utils';
import { API_URL } from '../lib/config';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { AnnualCashGiftForm, SocialPensionForm, WeddingAnniversaryForm, BirthdayIncentiveForm } from '../CitizenPortal';

function SelectionModal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all z-50 shadow-sm border border-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="overflow-y-auto flex-1 p-8 md:p-12">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function CitizenSelectionTable({ 
  embedded = false,
  benefitTypeOverride
}: { 
  embedded?: boolean;
  benefitTypeOverride?: string;
}) {
  const { benefit: routeBenefit } = useParams();
  const benefit = benefitTypeOverride || routeBenefit;
  const navigate = useNavigate();
  
  const [data, setData] = useState<any[]>([]);
  const [existingApplications, setExistingApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All');
  
  // Selection states
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isBulkEligibleLoading, setIsBulkEligibleLoading] = useState(false);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState<any | null>(null);

  // Confirmation states
  const [selectedYear, setSelectedYear] = useState('2026');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [citizenToApply, setCitizenToApply] = useState<any | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const lastFetchRef = useRef<number>(0);

  const getCitizenKey = (item: any) => String(item.citizen_id || item.id || '');

  const fetchExistingApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/benefit-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        const normalized = normalizeCashGiftResponse(result);
        setExistingApplications(normalized);
      }
    } catch (err) {
      console.error("Fetch existing applications error:", err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setData([]); // Reset data before fetch to prevent stale view
    try {
      await fetchExistingApplications();

      const token = localStorage.getItem('token');
      // Fetch a larger dataset for selection
      const response = await fetch(`${API_URL}/masterlist?per_page=5000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 429) {
        console.warn("Throttled benefits citizen selection");
        return;
      }

      const result = await response.json();
      const masterlist = result.data?.data || result.data || result || [];
      
      // Apply condition: id_status = 'released' ONLY (case-insensitive)
      const releasedList = (Array.isArray(masterlist) ? masterlist : []).filter(item => 
        (item.id_status || '').toString().toLowerCase() === 'released'
      );
      setData(releasedList);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [benefit]); // Reset/refetch when benefit changes

  const filteredData = data.filter(item => {
    if (benefit === 'annual-cash-gift') {
      const scid = (item.scid_number || '').trim().toLowerCase();
      const citizenId = String(item.citizen_id || item.id || '').trim();
      
      const hasExisting = existingApplications.some(app => {
        const appScid = (app.scid_number || '').trim().toLowerCase();
        const appCitizenId = String(app.citizen_id || app.id || '').trim();
        
        let appYear = String(app.year || app.annual_year || app.disbursement_year || '').trim();
        if (!appYear && app.created_at) {
          const date = new Date(app.created_at);
          if (!isNaN(date.getTime())) {
            appYear = String(date.getFullYear());
          }
        }
        
        const isSameYear = appYear === selectedYear;
        if (!isSameYear) return false;
        
        // Match by SCID if available and valid
        if (scid && scid !== 'n/a' && scid !== 'none' && scid !== 'null' && appScid && appScid !== 'n/a' && appScid !== 'none' && appScid !== 'null') {
          if (appScid === scid) return true;
        }
        
        // Fallback match: if citizen_id matches
        if (citizenId && appCitizenId && citizenId === appCitizenId) {
          return true;
        }
        
        return false;
      });
      
      if (hasExisting) {
        return false;
      }
    }

    const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
    const scid = (item.scid_number || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(search) || scid.includes(search);
    const matchesBarangay = barangayFilter === 'All' || item.barangay === barangayFilter;
    return matchesSearch && matchesBarangay;
  });

  const uniqueBarangays = ['All', ...Array.from(new Set(data.map(item => item.barangay).filter(Boolean)))].sort();

  const handleApply = (item: any) => {
    if (benefit === 'annual-cash-gift') {
      setCitizenToApply(item);
      setShowConfirmModal(true);
    } else {
      setSelectedData(item);
      setOpenModal(true);
    }
  };

  const confirmEligibilitySave = async () => {
    if (!citizenToApply) return;
    setIsApplying(true);
    const toastId = toast.loading(`Saving eligibility for ${citizenToApply.first_name}...`);
    const token = localStorage.getItem('token');
    
    try {
      const c = citizenToApply;
      const payload = {
        citizen_id: String(c.citizen_id || c.id || ""),
        first_name: c.first_name || "",
        middle_name: c.middle_name || "",
        last_name: c.last_name || "",
        full_name: `${c.first_name || ""} ${c.middle_name ? c.middle_name + " " : ""}${c.last_name || ""}`.trim(),
        birth_date: c.birth_date || "",
        age: Number(c.age) || 0,
        contact_number: c.contact_number || "",
        barangay: c.barangay || "",
        city_municipality: c.city_municipality || c.city || "",
        province: c.province || "",
        scid_number: c.scid_number || "",
        reg_status: "Pending Documents",
        disbursement: "Pending",
        benefit_type: "annual-cash-gift",
        year: selectedYear,
        annual_year: selectedYear,
        disbursement_year: selectedYear
      };

      const id = c.id || c.citizen_id;
      const res = await fetch(`${API_URL}/masterlist/mark-as-eligible/${id}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Successfully saved eligibility for ${c.first_name} ${c.last_name} for year ${selectedYear}.`, { id: toastId });
        setShowConfirmModal(false);
        setCitizenToApply(null);
        fetchData(); // Reload table
      } else {
        const errResult = await res.json().catch(() => ({}));
        console.error("API error:", errResult);
        toast.error(errResult.message || `Failed to mark citizen as eligible`, { id: toastId });
      }
    } catch (err) {
      console.error("Single eligibility save error:", err);
      toast.error("An error occurred during save", { id: toastId });
    } finally {
      setIsApplying(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedKeys.length === filteredData.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(filteredData.map(item => getCitizenKey(item)));
    }
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleBulkEligible = async () => {
    if (selectedKeys.length === 0) return;
    
    setIsBulkEligibleLoading(true);
    const toastId = toast.loading(`Processing eligibility for ${selectedKeys.length} citizens...`);
    const token = localStorage.getItem('token');
    const selectedCitizens = data.filter(item => selectedKeys.includes(getCitizenKey(item)));
    
    try {
      const promises = selectedCitizens.map(async (c) => {
        if (benefit === 'annual-cash-gift') {
          const payload = {
            citizen_id: String(c.citizen_id || c.id || ""),
            first_name: c.first_name || "",
            middle_name: c.middle_name || "",
            last_name: c.last_name || "",
            full_name: `${c.first_name || ""} ${c.middle_name ? c.middle_name + " " : ""}${c.last_name || ""}`.trim(),
            birth_date: c.birth_date || "",
            age: Number(c.age) || 0,
            contact_number: c.contact_number || "",
            barangay: c.barangay || "",
            city_municipality: c.city_municipality || c.city || "",
            province: c.province || "",
            scid_number: c.scid_number || "",
            reg_status: "Pending Documents",
            disbursement: "Pending",
            benefit_type: "annual-cash-gift",
            year: selectedYear,
            annual_year: selectedYear,
            disbursement_year: selectedYear
          };

          const id = c.id || c.citizen_id;
          const res = await fetch(`${API_URL}/masterlist/mark-as-eligible/${id}`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          return res.ok;
        } else if (benefit === 'social-pension') {
          const payload = {
            citizen_id: String(c.citizen_id || c.id || ""),
            first_name: c.first_name || "",
            middle_name: c.middle_name || "",
            last_name: c.last_name || "",
            suffix: c.suffix || "",
            birth_date: c.birth_date || "",
            age: Number(c.age) || 0,
            sex: c.sex || "",
            civil_status: c.civil_status || "",
            contact_number: c.contact_number || "0000000000",
            address: c.address || "",
            barangay: c.barangay || "",
            city_municipality: c.city_municipality || c.city || "San Juan",
            province: c.province || "Metro Manila",
            citizenship: c.citizenship || "Filipino",
            scid_number: c.scid_number || "N/A",
            reg_status: "pending"
          };

          const res = await fetch(`${API_URL}/social-pension`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          return res.ok;
        } else if (benefit === '50th-wedding-anniversary-incentive') {
          const fd = new FormData();
          fd.append("husband[citizen_id]", String(c.citizen_id || c.id || ""));
          fd.append("husband[first_name]", c.first_name || "");
          fd.append("husband[last_name]", c.last_name || "");
          fd.append("husband[birth_date]", c.birth_date || "");
          fd.append("husband[scid_number]", c.scid_number || "");
          fd.append("reg_status", "pending");

          const res = await fetch(`${API_URL}/wedding-anniversary-incentives`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: fd
          });
          return res.ok;
        } else {
          const fd = new FormData();
          fd.append("citizen_id", String(c.citizen_id || c.id || ""));
          fd.append("scid_number", c.scid_number || "N/A");
          fd.append("first_name", c.first_name || "");
          fd.append("last_name", c.last_name || "");
          fd.append("birth_date", c.birth_date || "");
          fd.append("age", String(c.age || 0));
          fd.append("reg_status", "pending");

          const res = await fetch(`${API_URL}/birthday-cash-incentives`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: fd
          });
          return res.ok;
        }
      });
      
      const results = await Promise.all(promises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount === selectedKeys.length) {
        toast.success(`Successfully added ${successCount} citizens as Eligible.`, { id: toastId });
      } else {
        toast.success(`Processed selection. ${successCount} successful, ${selectedKeys.length - successCount} failed or already applied.`, { id: toastId, duration: 5050 });
      }
      setSelectedKeys([]);
      fetchData();
    } catch (err) {
      console.error("Bulk eligible error:", err);
      toast.error("Failed to process bulk eligibility", { id: toastId });
    } finally {
      setIsBulkEligibleLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {!embedded && (
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(`/benefits/${benefit}`)}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#0F172A] hover:shadow-lg transition-all border border-slate-100 shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">Select Citizen</h2>
              <p className="text-slate-500 font-medium mt-1 font-sans">Apply benefits for released records</p>
            </div>
          </div>
        </header>
      )}

      {/* Bulk Actions for Selection */}
      <AnimatePresence>
        {selectedKeys.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider font-sans">
                {selectedKeys.length} Selected
              </div>
              <p className="text-sm text-slate-300 font-medium font-sans">Apply bulk eligibility registry</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkEligible}
                disabled={isBulkEligibleLoading}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                {isBulkEligibleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Mark as Eligible
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setSelectedKeys([])}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
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
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm font-sans"
          />
        </div>
        {benefit === 'annual-cash-gift' && (
          <div className="relative">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all cursor-pointer min-w-[160px] shadow-sm font-sans"
            >
              {Array.from({ length: 25 }, (_, i) => 2026 + i).map(year => (
                <option key={year} value={String(year)}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
        <div className="relative">
          <select 
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all cursor-pointer min-w-[160px] shadow-sm font-sans"
          >
            {uniqueBarangays.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px] font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox"
                    checked={selectedKeys.length === filteredData.length && filteredData.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-[#ef4444] focus:ring-[#ef4444] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">SCID Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Birthdate</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Barangay</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 text-[#EF4444] animate-spin" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Masterlist...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <AlertCircle className="w-16 h-16 text-slate-100" />
                      <p className="text-slate-400 font-medium text-lg">No released records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const key = getCitizenKey(item);
                  const isChecked = selectedKeys.includes(key);
                  return (
                    <tr key={key || `citizen-${index}`} className={cn(
                      "hover:bg-slate-50 transition-colors",
                      isChecked && "bg-slate-50/80"
                    )}>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(key)}
                          className="w-4 h-4 rounded border-slate-300 text-[#ef4444] focus:ring-[#ef4444] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-[#ef4444] tracking-wider">{item.scid_number || '---'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900 border-none">
                          {item.last_name}, {item.first_name} {item.middle_name || ''}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-xs font-medium text-slate-600">{item.birth_date || '---'}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-xs font-semibold text-slate-700">{item.barangay}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleApply(item)}
                          className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-all shadow-sm cursor-pointer"
                        >
                          Eligible
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benefits Form Modal */}
      <AnimatePresence>
        {openModal && (
          <SelectionModal onClose={() => setOpenModal(false)}>
            {benefit === 'annual-cash-gift' && (
              <AnnualCashGiftForm 
                mode="admin" 
                data={selectedData} 
                isReadOnly={false}
                onClose={() => setOpenModal(false)}
              />
            )}
            {benefit === 'social-pension' && (
              <SocialPensionForm 
                mode="admin" 
                data={selectedData} 
                isReadOnly={false}
                onClose={() => setOpenModal(false)}
              />
            )}
            {benefit === '50th-wedding-anniversary-incentive' && (
              <WeddingAnniversaryForm 
                mode="admin" 
                data={selectedData} 
                isReadOnly={false}
                onClose={() => setOpenModal(false)}
              />
            )}
            {benefit === 'birthday-cash-incentives' && (
              <BirthdayIncentiveForm 
                mode="admin" 
                data={selectedData} 
                isReadOnly={false}
                onClose={() => setOpenModal(false)}
              />
            )}
          </SelectionModal>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && citizenToApply && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isApplying) setShowConfirmModal(false); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl z-20 text-center"
            >
              <div className="w-16 h-16 bg-[#ef4444]/10 text-[#ef4444] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 font-sans">Confirm Eligibility</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed font-sans">
                Are you sure you want to mark <span className="font-semibold text-slate-800">{citizenToApply.first_name} {citizenToApply.last_name}</span> as eligible for the <span className="font-semibold text-slate-800">{selectedYear}</span> Annual Cash Gift?
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isApplying}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmEligibilitySave}
                  disabled={isApplying}
                  className="px-4 py-3 bg-[#ef4444] hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Confirm'
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
