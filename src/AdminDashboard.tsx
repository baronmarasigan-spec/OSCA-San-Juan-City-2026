import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  UserPlus, 
  IdCard, 
  Heart, 
  Stethoscope, 
  ClipboardList, 
  MessageSquare,
  LogOut, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight, 
  Search, 
  BarChart3,
  Check,
  X,
  AlertCircle,
  MoreVertical,
  Eye,
  RefreshCw,
  Loader2,
  Download,
  Edit3,
  Trash2,
  CheckCircle2,
  Bell,
  Megaphone,
  Users
} from 'lucide-react';
import { cn, normalizeCashGiftResponse, normalizeWeddingIncentiveResponse, normalizeBirthdayIncentiveResponse } from './lib/utils';
import { API_URL, LCR_API_URL } from './lib/config';
import { useNavigate, useLocation } from 'react-router-dom';

import { Application } from './App';
import RegistrationForm from './RegistrationForm';
import LcrRegistry, { LcrRecord } from './components/LcrRegistry';
import WalkInEnrollment from './components/WalkInEnrollment';
import Masterlist from './components/Masterlist';
import RegistrationProfileModal from './components/RegistrationProfileModal';
import MasterlistProfileModal from './components/MasterlistProfileModal';
import BenefitsModule from './components/BenefitsModule';
import FeedbackConcern from './components/FeedbackConcern';
import IdIssuanceModule from './components/IdIssuanceModule';
import UserManagement from './components/UserManagement';
import { motion, AnimatePresence } from 'motion/react';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardStats {
  registration: {
    total: number;
    pending: number;
    approved: number;
    disapproved: number;
  };
  masterlist: {
    total: number;
    active: number;
    deceased: number;
    released: number;
  };
  benefits: {
    annualCashGift: number;
    socialPension: number;
    weddingIncentive: number;
    birthdayIncentive: number;
  };
  feedback: {
    total: number;
    resolved: number;
    pending: number;
  };
}

export default function AdminDashboard({ 
  applications, 
  setApplications, 
  fetchApplications,
  onSignOut 
}: { 
  applications: Application[],
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>,
  fetchApplications: () => Promise<void>,
  onSignOut: () => void 
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role ? Number(user.role) : 0;

  const [activeTab, setActiveTab] = useState('Management');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('isSidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isSidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const formatDate = (dateString: string) => {
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

  const formatDateLong = (dateString: string | null | undefined) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatName = (app: Application) => {
    return `${app.last_name}, ${app.first_name} ${app.middle_name || ''}`.trim();
  };

  const getAttachments = (attachments: any) => {
    if (Array.isArray(attachments)) return attachments;
    if (typeof attachments === 'string') {
      try {
        const parsed = JSON.parse(attachments);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const fileBaseURL = `${API_URL}/view-file?path=`;

  const getBarangayFromAddress = (address?: string) => {
    if (!address) return 'N/A';
    const parts = address.split(',');
    return parts[0].trim();
  };

  const NotificationBox = ({ icon, count, onClick, active, enabled }: { 
    icon: React.ReactNode, 
    count: number, 
    onClick: () => void, 
    active: boolean,
    enabled: boolean
  }) => (
    <button 
      onClick={onClick}
      className={cn(
        "w-12 h-12 bg-white border rounded-[18px] flex items-center justify-center relative transition-all group focus:outline-none",
        active ? "border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.1)] bg-white" : "border-slate-100 shadow-sm",
        !enabled && "opacity-60"
      )}
    >
      <div className={cn("transition-colors", active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600")}>
        {icon}
      </div>
      {count > 0 && enabled && (
        <span className="absolute -top-2 -right-2 w-[22px] h-[22px] bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 leading-none">
          {count}
        </span>
      )}
      {!enabled && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center border-2 border-white">
          <div className="w-1.5 h-0.5 bg-white rounded-full uppercase" />
        </div>
      )}
    </button>
  );

  const NotificationCard = ({ 
    icon, 
    title, 
    subtitle, 
    newCount,
    pendingCount, 
    onToggle, 
    enabled, 
    onView, 
    onClose 
  }: { 
    icon: React.ReactNode, 
    title: string, 
    subtitle: string, 
    newCount: number,
    pendingCount: number, 
    onToggle: () => void, 
    enabled: boolean, 
    onView: () => void,
    onClose: () => void
  }) => (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute top-16 right-0 w-[280px] bg-white rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.12)] py-5 px-6 z-50 border border-slate-50"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f8fafc] rounded-xl flex items-center justify-center text-slate-600 border border-slate-100">
              {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1e293b] leading-tight mb-0.5">{title}</h4>
              <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.05em]">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onToggle}
            className={cn(
              "w-10 h-6 rounded-full p-1 transition-all duration-300 relative focus:outline-none flex items-center",
              enabled ? "bg-[#10b981]" : "bg-slate-200"
            )}
          >
            <div className={cn(
              "w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300",
              enabled ? "translate-x-4" : "translate-x-0"
            )} />
          </button>
        </div>

        <div className="bg-[#f8fafc] rounded-[18px] py-3 px-4 mb-6 border border-slate-50 flex flex-col gap-2">
          <p className="text-[14px] font-bold text-[#475569]">
            {pendingCount} pending submissions
          </p>
          {newCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse" />
              <p className="text-[11px] font-semibold text-[#10b981]">
                {newCount} new entries
              </p>
            </div>
          )}
          {newCount === 0 && pendingCount === 0 && (
            <p className="text-[12px] font-semibold text-[#94a3b8]">
              No pending items
            </p>
          )}
        </div>

        <button 
          onClick={onView}
          className="w-full py-3 bg-[#ef4444] text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-[0_8px_20px_rgba(239,68,68,0.3)] hover:bg-[#dc2626] transition-all transform active:scale-[0.98] active:shadow-md"
        >
          View Submissions
        </button>
      </motion.div>
    </>
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isIdIssuanceOpen, setIsIdIssuanceOpen] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    registration: { total: 0, pending: 0, approved: 0, disapproved: 0 },
    masterlist: { total: 0, active: 0, deceased: 0, released: 0 },
    benefits: { annualCashGift: 0, socialPension: 0, weddingIncentive: 0, birthdayIncentive: 0 },
    feedback: { total: 0, resolved: 0, pending: 0 }
  });

  const [notifications, setNotifications] = useState({
    registration: { new: 0, pending: 0 },
    idIssuance: { new: 0, pending: 0 },
    benefits: { new: 0, pending: 0 },
    feedback: { new: 0, pending: 0 },
    total: 0
  });
  const [openNotificationTab, setOpenNotificationTab] = useState<string | null>(null);
  const [segmentToggles, setSegmentToggles] = useState<Record<string, boolean>>({
    registration: true,
    idIssuance: true,
    benefits: true,
    feedback: true
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const lastFetchNotifications = useRef<number>(0);
  const lastFetchStats = useRef<number>(0);

  const fetchNotifications = useCallback(async () => {
    // Throttle: don't fetch more than once every 10 seconds unless forced
    const now = Date.now();
    if (now - lastFetchNotifications.current < 10000) return;
    lastFetchNotifications.current = now;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };

      const now = new Date();
      const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;

      // 1. Pending Registrations
      const newReg = applications.filter(a => {
        const date = a.created_at || a.registration_date;
        return date && new Date(date).getTime() > oneDayAgo;
      }).length;
      const pendingReg = applications.filter(a => a.reg_status === 'pending').length;

      // 2. Pending ID Issuances
      let idList: any[] = [];
      try {
        const idRes = await fetch(`${API_URL}/id-issuances`, { headers });
        if (idRes.status === 401) {
          onSignOut();
          return;
        }
        if (idRes.status === 429) {
          console.warn("Throttled: ID fetch returned 429");
        } else if (idRes.ok) {
          const idData = await idRes.json();
          const idListRaw = idData.data?.data || idData.data || idData;
          idList = Array.isArray(idListRaw) ? idListRaw : [];
        } else {
          console.error(`ID fetch failed: ${idRes.status}`);
        }
      } catch (e) {
        console.error("Error fetching ID issuances:", e);
      }
      
      const newId = idList.filter((i: any) => {
        const date = i.created_at || i.updated_at;
        return date && new Date(date).getTime() > oneDayAgo;
      }).length;
      const pendingId = idList.filter((i: any) => (i.status?.issuance_status || i.id_status || '').toLowerCase() === 'pending').length;

      // 3. Pending Benefits (Aggregated from enabled benefit types)
      let appsArray: any[] = [];
      
      // 3a. Annual Cash Gift (defensive)
      try {
        const annualRes = await fetch(`${API_URL}/benefit-applications`, { headers });
        if (annualRes.ok) {
          const annualData = await annualRes.json();
          const annualApps = normalizeCashGiftResponse(annualData);
          if (Array.isArray(annualApps)) {
            appsArray.push(...annualApps);
          }
        }
      } catch (e) {
        console.error("Error fetching annual cash gift for notifications:", e);
      }

      // 3b. Social Pension (defensive)
      try {
        const pensionRes = await fetch(`${API_URL}/social-pension`, { headers });
        if (pensionRes.ok) {
          const pensionData = await pensionRes.json();
          const pensionApps = normalizeCashGiftResponse(pensionData); // identical format
          if (Array.isArray(pensionApps)) {
            appsArray.push(...pensionApps);
          }
        }
      } catch (e) {
        console.error("Error fetching social pension for notifications:", e);
      }

      // 3c. Birthday Cash Incentives
      try {
        const birthdayRes = await fetch(`${API_URL}/birthday-incentives`, { headers });
        if (birthdayRes.ok) {
          const birthdayData = await birthdayRes.json();
          const birthdayApps = normalizeBirthdayIncentiveResponse(birthdayData);
          if (Array.isArray(birthdayApps)) {
            appsArray.push(...birthdayApps);
          }
        }
      } catch (e) {
        console.error("Error fetching birthday incentives for notifications:", e);
      }

      // 3d. 50th Wedding Anniversary Incentive
      try {
        const weddingRes = await fetch(`${API_URL}/wedding-anniversary-incentives`, { headers });
        if (weddingRes.ok) {
          const weddingData = await weddingRes.json();
          const weddingApps = normalizeWeddingIncentiveResponse(weddingData);
          if (Array.isArray(weddingApps)) {
            appsArray.push(...weddingApps);
          }
        }
      } catch (e) {
        console.error("Error fetching wedding incentives for notifications:", e);
      }
      
      const newBenefits = appsArray.filter((a: any) => {
        const date = a.created_at || a.updated_at || a.applied_date;
        return date && new Date(date).getTime() > oneDayAgo;
      }).length;
      const pendingBenefits = appsArray.filter((a: any) => {
        const statStr = (a.status || a.reg_status || '').toLowerCase();
        return statStr === 'pending';
      }).length;

      // 4. Feedback
      let feedbacks: any[] = [];
      try {
        const feedbackRes = await fetch(`${API_URL}/feedback-concerns`, { headers });
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          feedbacks = Array.isArray(feedbackData.data) ? feedbackData.data : [];
        } else {
          console.error(`Feedback fetch failed: ${feedbackRes.status}`);
        }
      } catch (e) {
        console.error("Error fetching feedback:", e);
      }
      
      const localFeedbacks = JSON.parse(localStorage.getItem('local_feedback_concerns') || '[]');
      const filteredLocal = localFeedbacks.filter((localItem: any) => 
        !feedbacks.some((remoteItem: any) => 
          remoteItem.id === localItem.id || 
          (remoteItem.message === localItem.message && remoteItem.category?.toLowerCase() === localItem.category?.toLowerCase())
        )
      );
      const combinedFeedbacks = [...filteredLocal, ...feedbacks];
      
      const newFeedback = combinedFeedbacks.filter((f: any) => {
        const date = f.created_at || f.updated_at || f.submitted_at;
        return date && new Date(date).getTime() > oneDayAgo;
      }).length;
      const pendingFeedback = combinedFeedbacks.filter((f: any) => (f.status || '').toLowerCase() === 'pending').length;

      setNotifications({
        registration: { new: newReg, pending: pendingReg },
        idIssuance: { new: newId, pending: pendingId },
        benefits: { new: newBenefits, pending: pendingBenefits },
        feedback: { new: newFeedback, pending: pendingFeedback },
        total: pendingReg + pendingId + pendingBenefits + pendingFeedback
      });
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      if (error.message?.includes('401')) {
        onSignOut();
      }
    }
  }, [applications, onSignOut]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Fetch every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const [lcrPagination, setLcrPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const fetchLcrData = useCallback(async (page: number = 1, search: string = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (search) {
        params.append('search', search);
        params.append('name', search);
      }
      
      const response = await fetch(`${LCR_API_URL}?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch LCR data through proxy");
      const result = await response.json();
      
      const dataArray = Array.isArray(result.data) ? result.data : [];
      
      const mappedData: LcrRecord[] = dataArray.map((item: any, index: number) => ({
        id: (page - 1) * (result.meta?.per_page || 15) + index + 1,
        full_name: item.name || item.full_name || 'N/A',
        birth_date: item.birthday || item.birth_date || 'N/A',
        age: item.age || item.current_age || 0
      }));
      
      setLcrData(mappedData);
      setLcrPagination({
        currentPage: result.meta?.current_page || page,
        totalPages: result.meta?.last_page || 1,
        totalItems: result.meta?.total || mappedData.length
      });
    } catch (error) {
      console.error("Error fetching LCR data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLcrSearch = useCallback((query: string) => {
    fetchLcrData(1, query);
  }, [fetchLcrData]);

  const fetchDashboardStats = useCallback(async () => {
    // Throttle: don't fetch stats more than once every 15 seconds
    const now = Date.now();
    if (now - lastFetchStats.current < 15000) return;
    lastFetchStats.current = now;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };

      // 1. Registration Stats (from applications prop/fetch)
      const reg = {
        total: applications.length,
        pending: applications.filter(a => a.reg_status === 'pending').length,
        approved: applications.filter(a => a.reg_status === 'approved').length,
        disapproved: applications.filter(a => a.reg_status === 'disapproved' || a.reg_status === 'rejected').length
      };

      // 2. Masterlist Stats
      let masterArray: any[] = [];
      try {
        const masterRes = await fetch(`${API_URL}/masterlist`, { headers });
        if (masterRes.status === 401) {
          onSignOut();
          return;
        }
        if (masterRes.status === 429) {
          console.warn("Throttled: Masterlist fetch returned 429");
        } else if (masterRes.ok) {
          const masterData = await masterRes.json();
          const masterArrayRaw = masterData.data?.data || masterData.data || masterData;
          masterArray = Array.isArray(masterArrayRaw) ? masterArrayRaw : [];
        } else {
          console.error(`Masterlist fetch failed: ${masterRes.status}`);
        }
      } catch (e) {
        console.error("Error fetching masterlist stats:", e);
      }
      
      const mStats = {
        total: masterArray.length,
        active: masterArray.filter((a: any) => (a.vital_status || 'active').toLowerCase() === 'active').length,
        deceased: masterArray.filter((a: any) => (a.vital_status || '').toLowerCase() === 'deceased').length,
        released: masterArray.filter((a: any) => (a.id_status || '').toLowerCase() === 'released').length
      };

      // 3. Benefit Stats
      let annualCount = 0;
      try {
        const annualRes = await fetch(`${API_URL}/benefit-applications`, { headers });
        if (annualRes.ok) {
          const annualData = await annualRes.json();
          const annualApps = normalizeCashGiftResponse(annualData);
          annualCount = Array.isArray(annualApps) ? annualApps.length : 0;
        }
      } catch (e) {}

      let pensionCount = 0;
      try {
        const pensionRes = await fetch(`${API_URL}/social-pension`, { headers });
        if (pensionRes.ok) {
          const pensionData = await pensionRes.json();
          const pensionArray = pensionData.data?.data || pensionData.data || pensionData;
          pensionCount = Array.isArray(pensionArray) ? pensionArray.length : 0;
        }
      } catch (e) {}
      
      let weddingCount = 0;
      try {
        const weddingRes = await fetch(`${API_URL}/wedding-anniversary-incentives`, { headers });
        if (weddingRes.ok) {
          const weddingData = await weddingRes.json();
          const weddingArray = weddingData.data?.data || weddingData.data || weddingData;
          weddingCount = Array.isArray(weddingArray) ? weddingArray.length : 0;
        }
      } catch (e) {}

      let birthdayCount = 0;
      try {
        const birthdayRes = await fetch(`${API_URL}/birthday-incentives`, { headers });
        if (birthdayRes.ok) {
          const birthdayData = await birthdayRes.json();
          const birthdayArray = birthdayData.data?.data || birthdayData.data || birthdayData;
          birthdayCount = Array.isArray(birthdayArray) ? birthdayArray.length : 0;
        }
      } catch (e) {}

      // Feedback Stats
      let feedbacks: any[] = [];
      try {
        const feedbackRes = await fetch(`${API_URL}/feedback-concerns`, { headers });
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          const feedbacksRaw = feedbackData.data || [];
          feedbacks = Array.isArray(feedbacksRaw) ? feedbacksRaw : [];
        }
      } catch (e) {}
      
      const localFeedbacksStats = JSON.parse(localStorage.getItem('local_feedback_concerns') || '[]');
      const filteredLocalStats = localFeedbacksStats.filter((localItem: any) => 
        !feedbacks.some((remoteItem: any) => 
          remoteItem.id === localItem.id || 
          (remoteItem.message === localItem.message && remoteItem.category?.toLowerCase() === localItem.category?.toLowerCase())
        )
      );
      const combinedFeedbacksStats = [...filteredLocalStats, ...feedbacks];
      
      const fStats = {
        total: combinedFeedbacksStats.length,
        resolved: combinedFeedbacksStats.filter((f: any) => (f.status || '').toLowerCase() === 'resolved').length,
        pending: combinedFeedbacksStats.filter((f: any) => (f.status || '').toLowerCase() === 'pending').length
      };

      setStats({
        registration: reg,
        masterlist: mStats,
        benefits: {
          annualCashGift: annualCount,
          socialPension: pensionCount,
          weddingIncentive: weddingCount,
          birthdayIncentive: birthdayCount
        },
        feedback: fStats
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      if (error.message?.includes('401')) {
        onSignOut();
      }
    }
  }, [applications, onSignOut]);

  useEffect(() => {
    if (activeTab === 'Dashboard') {
      fetchDashboardStats();
    }
  }, [activeTab, fetchDashboardStats]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') setActiveTab('Dashboard');
    else if (path === '/registration/management') {
      setActiveTab('Management');
      setIsRegistrationOpen(true);
    }
    else if (path === '/registration/walk-in') {
      setActiveTab('Walk-in');
      setIsRegistrationOpen(true);
    }
    else if (path === '/masterlist') setActiveTab('Masterlist');
    else if (path === '/id-issuance/management') {
      setActiveTab('IdManagement');
      setIsIdIssuanceOpen(true);
    }
    else if (path === '/id-issuance/walk-in') {
      setActiveTab('IdWalkIn');
      setIsIdIssuanceOpen(true);
    }
    else if (path.startsWith('/benefits')) setActiveTab('Benefits');
    else if (path === '/feedback-and-concern') setActiveTab('FeedbackConcern');
    else if (path === '/registry') setActiveTab('LcrRegistry');
    else if (path === '/users' && [1, 2].includes(userRole)) setActiveTab('UserManagement');
    else if (path === '/users') setActiveTab('Management');
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'Dashboard': navigate('/dashboard'); break;
      case 'Management': navigate('/registration/management'); break;
      case 'Walk-in': navigate('/registration/walk-in'); break;
      case 'Masterlist': navigate('/masterlist'); break;
      case 'IdManagement': navigate('/id-issuance/management'); break;
      case 'IdWalkIn': navigate('/id-issuance/walk-in'); break;
      case 'Benefits': navigate('/benefits'); break;
      case 'FeedbackConcern': navigate('/feedback-and-concern'); break;
      case 'LcrRegistry': navigate('/registry'); break;
      case 'UserManagement': navigate('/users'); break;
    }
  };
  
  const [lcrData, setLcrData] = useState<LcrRecord[]>([]);
  
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [modalInitialIsEditing, setModalInitialIsEditing] = useState(false);
  const [isMasterlistModalOpen, setIsMasterlistModalOpen] = useState(false);
  const [masterlistRefreshKey, setMasterlistRefreshKey] = useState(0);

  const [isDisapproveModalOpen, setIsDisapproveModalOpen] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [disapprovingId, setDisapprovingId] = useState<number | null>(null);

  const [isWalkInFormOpen, setIsWalkInFormOpen] = useState(false);
  const [selectedLcrRecord, setSelectedLcrRecord] = useState<LcrRecord | null>(null);

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Move to Pending State
  const [isMoveToPendingModalOpen, setIsMoveToPendingModalOpen] = useState(false);
  const [pendingCitizenId, setPendingCitizenId] = useState<number | null>(null);
  const [isMovingToPending, setIsMovingToPending] = useState(false);

  // Reset Password State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Pagination State for Registration Module
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Rejection Remarks Modal State
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState('');

  // Filters State
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All record');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId !== null) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    const handleFetch = async () => {
      setIsLoading(true);
      setApplications([]); // Reset state before fetch
      try {
        await fetchApplications();
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'Management') {
      handleFetch();
    }
    
    if (activeTab === 'LcrRegistry') {
      fetchLcrData(1);
    }
    
    // Reset filters on tab change
    setBarangayFilter('All');
    setStatusFilter('All record');
    setSearchQuery('');
    setDateRange({ from: '', to: '' });
    setCurrentPage(1);
    
  }, [activeTab, fetchApplications]);

  useEffect(() => {
    if (activeTab === 'Masterlist') {
      setMasterlistRefreshKey(prev => prev + 1);
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [barangayFilter, statusFilter, dateRange, searchQuery]);

  const barangayCounts = applications.reduce((acc, app) => {
    const brgy = getBarangayFromAddress(app.barangay);
    acc[brgy] = (acc[brgy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueBarangaysLabels = Object.keys(barangayCounts).sort();

  const filteredApplications = applications.filter(app => {
    const fullName = formatName(app).toLowerCase();
    const matchesSearch = searchQuery === '' || fullName.includes(searchQuery.toLowerCase());
    const appBrgy = getBarangayFromAddress(app.barangay);
    const matchesBarangay = barangayFilter === 'All' || appBrgy === barangayFilter;
    
    let matchesStatus = true;
    if (statusFilter !== 'All record') {
      const statusMap: Record<string, string> = {
        'For Approval (pending)': 'pending',
        'Approved': 'approved',
        'Rejected': 'disapproved'
      };
      matchesStatus = app.reg_status === statusMap[statusFilter];
    }

    const regDate = app.registration_date ? new Date(app.registration_date) : null;
    let matchesDate = true;
    if (dateRange.from && regDate) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && regDate >= fromDate;
    }
    if (dateRange.to && regDate) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && regDate <= toDate;
    }

    return matchesSearch && matchesBarangay && matchesStatus && matchesDate;
  });

  const handleExport = () => {
    if (filteredApplications.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Full Name", "Barangay", "Birthdate", "Registration Date", "Type", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredApplications.map(app => [
        `"${formatName(app)}"`,
        `"${app.barangay}"`,
        `"${formatDateLong(app.birth_date)}"`,
        `"${formatDate(app.registration_date || '')}"`,
        `"${app.registration_type}"`,
        `"${app.reg_status.toUpperCase()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registration_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateStatus = async (id: number, status: 'approved' | 'disapproved' | 'pending', remarks?: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const body: any = {
        reg_status: status
      };

      if (remarks) {
        body.rejection_remarks = remarks;
      }

      // In Registration Management, we are always dealing with applications
      const endpoint = `${API_URL}/applications/${id}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers,
        body: JSON.stringify(body)
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
        return;
      }

      if (res.ok) {
        alert("Status updated successfully");
        if (activeTab === 'Masterlist') {
          setMasterlistRefreshKey(prev => prev + 1);
        }
        await fetchApplications();
      } else {
        alert(`Update failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Update failed");
    }
  };

  const handleViewProfile = (app: Application) => {
    setSelectedApp(app);
    if (activeTab === 'Masterlist') {
      setIsMasterlistModalOpen(true);
    } else {
      setIsRegistrationModalOpen(true);
    }
  };

  const handleSaveProfile = async (updatedApp: Application, newFiles?: File[], removedFiles?: string[]) => {
    if (!updatedApp.id && !updatedApp.citizen_id) {
      alert("Error: Record ID is missing");
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

      // Use FormData only if there are new files to upload
      let body: any;
      let method = "PUT";
      let contentType: string | undefined = "application/json";

      if (newFiles && newFiles.length > 0) {
        const formData = new FormData();
        
        // For multipart/form-data updates, many backends require POST with _method=PUT
        formData.append("_method", "PUT");
        method = "POST";
        
        // Append all fields from updatedApp
        Object.entries(updatedApp).forEach(([key, value]) => {
          if (key === 'document') return; // Handle documents separately
          if (value === null || value === undefined) {
            formData.append(key, "");
          } else if (typeof value === 'boolean') {
            formData.append(key, value ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        });

        // Append new files
        newFiles.forEach(file => {
          if (file instanceof File) {
            if (file.name === "captured_photo.jpg") {
              formData.append("id_photo", file);
            } else {
              formData.append("document[]", file);
            }
          }
        });

        // Append existing documents info (filtered by removedFiles)
        const docField = updatedApp.document;
        let docArray: any[] = [];
        if (Array.isArray(docField)) {
          docArray = docField;
        } else if (typeof docField === 'string' && docField.trim()) {
          try {
            const parsed = JSON.parse(docField);
            docArray = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            docArray = [];
          }
        }
        
        const currentDocs = docArray.filter(doc => !removedFiles?.includes(doc.path));
        formData.append("existing_documents", JSON.stringify(currentDocs));

        body = formData;
        contentType = undefined; // Let the browser set it for FormData
      } else {
        // Use JSON for updates without new files
        // If there are removed files, filter the document array
        const docField = updatedApp.document;
        let docArray: any[] = [];
        if (Array.isArray(docField)) {
          docArray = docField;
        } else if (typeof docField === 'string' && docField.trim()) {
          try {
            const parsed = JSON.parse(docField);
            docArray = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            docArray = [];
          }
        }

        const currentDocs = docArray.filter(doc => !removedFiles?.includes(doc.path));
        
        const payload: any = {
          ...updatedApp,
          existing_documents: currentDocs,
          reg_status: updatedApp.reg_status || "pending"
        };
        
        // Omit the 'document' field from JSON payload because it contains objects,
        // but the backend validation expects it to be an array of files.
        delete payload.document;
        
        body = JSON.stringify(payload);
      }

      const fetchOptions: RequestInit = {
        method,
        headers: contentType ? { ...headers, "Content-Type": contentType } : headers,
        body
      };

      // Determine endpoint and ID
      const targetId = updatedApp.citizen_id || updatedApp.id;
      const endpoint = updatedApp.citizen_id 
        ? `${API_URL}/masterlist/${targetId}`
        : `${API_URL}/applications/${targetId}`;

      const res = await fetch(endpoint, fetchOptions);

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to update application");
      }

      alert("Changes saved successfully");
      setIsRegistrationModalOpen(false);
      setIsMasterlistModalOpen(false);
      setSelectedApp(null);
      if (activeTab === 'Masterlist') {
        setMasterlistRefreshKey(prev => prev + 1);
      }
      await fetchApplications();
    } catch (err) {
      console.error("Update error:", err);
      alert(err instanceof Error ? err.message : "An error occurred while saving changes");
    }
  };

  const handleDisapproveClick = (id: number) => {
    setDisapprovingId(id);
    setRejectionRemarks('');
    setIsDisapproveModalOpen(true);
  };

  const submitDisapproval = async () => {
    if (disapprovingId) {
      await updateStatus(disapprovingId, 'disapproved', rejectionRemarks);
      setIsDisapproveModalOpen(false);
      setDisapprovingId(null);
      setRejectionRemarks('');
    }
  };

  const handleApproveClick = (id: number) => {
    setApprovingId(id);
    setIsApproveModalOpen(true);
  };

  const submitApproval = async () => {
    if (approvingId) {
      await updateStatus(approvingId, 'approved');
      setIsApproveModalOpen(false);
      setApprovingId(null);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const submitDelete = async () => {
    if (!deletingId) return;
    
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Check if we are deleting from Masterlist (using activeTab)
      const endpoint = activeTab === 'Masterlist' 
        ? `${API_URL}/masterlist/${deletingId}`
        : `${API_URL}/applications/${deletingId}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
      }

      if (res.ok) {
        alert("Record deleted successfully");
        if (activeTab === 'Masterlist') {
          setMasterlistRefreshKey(prev => prev + 1);
        }
        await fetchApplications();
      } else {
        alert(`Delete failed: ${data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const triggerMoveToPending = (citizenId: number) => {
    setPendingCitizenId(citizenId);
    setIsMoveToPendingModalOpen(true);
  };

  const handleMoveToPending = async () => {
    if (!pendingCitizenId || isMovingToPending) return;
    
    const citizenId = pendingCitizenId;
    setIsMovingToPending(true);
    setIsMoveToPendingModalOpen(false);
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/masterlist/move-to-pending/${citizenId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setPendingCitizenId(null);
        setMasterlistRefreshKey(prev => prev + 1);
        await fetchApplications();
        alert("Successfully moved to pending.");
      } else {
        alert(response.data.message || "Failed to move to pending.");
      }
    } catch (error: any) {
      console.error("Move to pending error:", error);
      const errorMessage = error.response?.data?.message || "An error occurred while moving the record to pending.";
      alert(errorMessage);
    } finally {
      setIsMovingToPending(false);
    }
  };

  const triggerResetPassword = (id: number) => {
    setResetPasswordUserId(id);
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || isResettingPassword) return;
    
    const userId = resetPasswordUserId;
    setIsResettingPassword(true);
    setIsResetPasswordModalOpen(false);
    
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/auth/admin/reset-password/${userId}`, {
        method: "POST",
        headers
      });

      if (res.ok) {
        alert("Password reset successfully");
        setResetPasswordUserId(null);
      } else {
        const data = await res.json();
        alert(`Reset failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      alert("Reset password failed");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FB] font-sans text-[#1E293B] overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-white border-r border-slate-200 flex flex-col z-[70] transition-all duration-300 outline-none h-full",
        isSidebarCollapsed ? "lg:w-20 w-72" : "w-72",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Desktop Collapse Toggle (Floating Outside Sidebar) */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute top-[42px] -right-3.5 w-7 h-7 bg-[#ef4444] rounded-full border border-[#ef4444] shadow-md items-center justify-center text-white hover:bg-[#dc2626] hover:border-[#dc2626] transition-colors z-[80] cursor-pointer focus:outline-none"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={cn(
          "flex items-center justify-between transition-all duration-300",
          isSidebarCollapsed ? "lg:p-4 lg:flex-col lg:gap-3 lg:items-center" : "p-8"
        )}>
          <div className={cn("flex items-center gap-4", isSidebarCollapsed && "lg:flex-col lg:gap-2")}>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg shadow-red-100 shrink-0 overflow-hidden border border-slate-100 p-0.5">
              <img 
                src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777035946/Seal_of_San_Juan__Metro_Manila_1_k5lmzn.png" 
                alt="Seal of San Juan" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="transition-opacity duration-200">
                <h1 className="font-bold text-lg tracking-tight text-[#0F172A] whitespace-nowrap">OSCA - San Juan</h1>
                <p className="text-xs text-slate-500 font-semibold tracking-wide">Administrator</p>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="lg:hidden">
                <h1 className="font-bold text-lg tracking-tight text-[#0F172A] whitespace-nowrap">OSCA - San Juan</h1>
                <p className="text-xs text-slate-500 font-semibold tracking-wide">Administrator</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className={cn(
          "flex-1 space-y-2 px-6 transition-all duration-300",
          isSidebarCollapsed ? "lg:px-3 lg:overflow-hidden" : "overflow-y-auto overflow-x-hidden"
        )}>
          <button 
            onClick={() => handleTabChange('Dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group text-left",
              activeTab === 'Dashboard' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50",
              isSidebarCollapsed && "lg:justify-center lg:px-0"
            )}
          >
            {activeTab === 'Dashboard' && (
              <div className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-r-full",
                isSidebarCollapsed && "lg:h-8 lg:w-1"
              )} />
            )}
            <LayoutDashboard className={cn("w-5 h-5 shrink-0", activeTab === 'Dashboard' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            {!isSidebarCollapsed && <span>Dashboard</span>}
            <span className="lg:hidden">Dashboard</span>

            {/* Custom Tooltip */}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                Dashboard
              </div>
            )}
          </button>

          <div className="space-y-1">
            <button 
              onClick={() => setIsRegistrationOpen(!isRegistrationOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group text-left relative",
                activeTab === 'Management' || activeTab === 'Walk-in' ? "text-[#ef4444]" : "text-slate-500 hover:bg-slate-50",
                isSidebarCollapsed && "lg:justify-center lg:px-0"
              )}
            >
              <div className={cn("flex items-center gap-3", isSidebarCollapsed && "lg:justify-center")}>
                <UserPlus className={cn("w-5 h-5 shrink-0", (activeTab === 'Management' || activeTab === 'Walk-in') ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
                {!isSidebarCollapsed && <span>Registration</span>}
                <span className="lg:hidden">Registration</span>
              </div>
              {!isSidebarCollapsed && <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", isRegistrationOpen && "rotate-180")} />}
              <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0 lg:hidden", isRegistrationOpen && "rotate-180")} />

              {/* Custom Tooltip */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                  Registration
                </div>
              )}
            </button>
            {isRegistrationOpen && (
              <div className={cn("space-y-1 transition-all duration-300", isSidebarCollapsed ? "ml-0 flex flex-col items-center lg:ml-0 lg:space-y-2 lg:py-1" : "ml-12")}>
                <button 
                  onClick={() => handleTabChange('Management')}
                  className={cn(
                    "w-full text-left py-2 text-sm font-semibold transition-colors relative flex items-center",
                    isSidebarCollapsed ? "lg:justify-center lg:px-0" : "px-4",
                    activeTab === 'Management' ? "text-[#ef4444]" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {activeTab === 'Management' && (
                    <div className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-full",
                      isSidebarCollapsed ? "lg:left-0 lg:h-6" : "left-[-12px]"
                    )} />
                  )}
                  {isSidebarCollapsed ? (
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border transition-all relative group",
                      activeTab === 'Management' 
                        ? "bg-red-50 border-red-200 text-[#ef4444] shadow-sm font-black" 
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    )}>
                      M
                      <div className="absolute left-full ml-5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                        Registration Management
                      </div>
                    </div>
                  ) : (
                    <span>Management</span>
                  )}
                  <span className="lg:hidden">Management</span>
                </button>
                {[1, 2, 4].includes(userRole) && (
                  <button 
                    onClick={() => handleTabChange('Walk-in')}
                    className={cn(
                      "w-full text-left py-2 text-sm font-semibold transition-colors relative flex items-center",
                      isSidebarCollapsed ? "lg:justify-center lg:px-0" : "px-4",
                      activeTab === 'Walk-in' ? "text-[#ef4444]" : "text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {activeTab === 'Walk-in' && (
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-full",
                        isSidebarCollapsed ? "lg:left-0 lg:h-6" : "left-[-12px]"
                      )} />
                    )}
                    {isSidebarCollapsed ? (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border transition-all relative group",
                        activeTab === 'Walk-in' 
                          ? "bg-red-50 border-red-200 text-[#ef4444] shadow-sm font-black" 
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      )}>
                        W
                        <div className="absolute left-full ml-5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                          Walk-in Registration
                        </div>
                      </div>
                    ) : (
                      <span>Walk-in</span>
                    )}
                    <span className="lg:hidden">Walk-in</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={() => handleTabChange('Masterlist')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group text-left",
              activeTab === 'Masterlist' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50",
              isSidebarCollapsed && "lg:justify-center lg:px-0"
            )}
          >
            {activeTab === 'Masterlist' && (
              <div className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full",
                isSidebarCollapsed && "lg:h-8 lg:w-1"
              )} />
            )}
            <ClipboardList className={cn("w-5 h-5 shrink-0", activeTab === 'Masterlist' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            {!isSidebarCollapsed && <span>Masterlist</span>}
            <span className="lg:hidden">Masterlist</span>

            {/* Custom Tooltip */}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                Masterlist
              </div>
            )}
          </button>

          <div className="space-y-1">
            <button 
              onClick={() => setIsIdIssuanceOpen(!isIdIssuanceOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group text-left relative",
                activeTab === 'IdManagement' || activeTab === 'IdWalkIn' ? "text-[#ef4444]" : "text-slate-500 hover:bg-slate-50",
                isSidebarCollapsed && "lg:justify-center lg:px-0"
              )}
            >
              <div className={cn("flex items-center gap-3", isSidebarCollapsed && "lg:justify-center")}>
                <IdCard className={cn("w-5 h-5 shrink-0", (activeTab === 'IdManagement' || activeTab === 'IdWalkIn') ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
                {!isSidebarCollapsed && <span>ID Issuance</span>}
                <span className="lg:hidden">ID Issuance</span>
              </div>
              {!isSidebarCollapsed && <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", isIdIssuanceOpen && "rotate-180")} />}
              <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0 lg:hidden", isIdIssuanceOpen && "rotate-180")} />

              {/* Custom Tooltip */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                  ID Issuance
                </div>
              )}
            </button>
            {isIdIssuanceOpen && (
              <div className={cn("space-y-1 transition-all duration-300", isSidebarCollapsed ? "ml-0 flex flex-col items-center lg:ml-0 lg:space-y-2 lg:py-1" : "ml-12")}>
                <button 
                  onClick={() => handleTabChange('IdManagement')}
                  className={cn(
                    "w-full text-left py-2 text-sm font-semibold transition-colors relative flex items-center",
                    isSidebarCollapsed ? "lg:justify-center lg:px-0" : "px-4",
                    activeTab === 'IdManagement' ? "text-[#ef4444]" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {activeTab === 'IdManagement' && (
                    <div className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-full",
                      isSidebarCollapsed ? "lg:left-0 lg:h-6" : "left-[-12px]"
                    )} />
                  )}
                  {isSidebarCollapsed ? (
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border transition-all relative group",
                      activeTab === 'IdManagement' 
                        ? "bg-red-50 border-red-200 text-[#ef4444] shadow-sm font-black" 
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    )}>
                      M
                      <div className="absolute left-full ml-5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                        ID Management
                      </div>
                    </div>
                  ) : (
                    <span>Management</span>
                  )}
                  <span className="lg:hidden">Management</span>
                </button>
                {userRole !== 3 && (
                  <button 
                    onClick={() => handleTabChange('IdWalkIn')}
                    className={cn(
                      "w-full text-left py-2 text-sm font-semibold transition-colors relative flex items-center",
                      isSidebarCollapsed ? "lg:justify-center lg:px-0" : "px-4",
                      activeTab === 'IdWalkIn' ? "text-[#ef4444]" : "text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {activeTab === 'IdWalkIn' && (
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-full",
                        isSidebarCollapsed ? "lg:left-0 lg:h-6" : "left-[-12px]"
                      )} />
                    )}
                    {isSidebarCollapsed ? (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border transition-all relative group",
                        activeTab === 'IdWalkIn' 
                          ? "bg-red-50 border-red-200 text-[#ef4444] shadow-sm font-black" 
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      )}>
                        W
                        <div className="absolute left-full ml-5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                          Walk-in ID Issuance
                        </div>
                      </div>
                    ) : (
                      <span>Walk-in</span>
                    )}
                    <span className="lg:hidden">Walk-in</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={() => handleTabChange('Benefits')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group text-left",
              activeTab === 'Benefits' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50",
              isSidebarCollapsed && "lg:justify-center lg:px-0"
            )}
          >
            {activeTab === 'Benefits' && (
              <div className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full",
                isSidebarCollapsed && "lg:h-8 lg:w-1"
              )} />
            )}
            <Heart className={cn("w-5 h-5 shrink-0", activeTab === 'Benefits' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            {!isSidebarCollapsed && <span>Benefits</span>}
            <span className="lg:hidden">Benefits</span>

            {/* Custom Tooltip */}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                Benefits
              </div>
            )}
          </button>

          <button 
            onClick={() => handleTabChange('FeedbackConcern')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group text-left",
              activeTab === 'FeedbackConcern' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50",
              isSidebarCollapsed && "lg:justify-center lg:px-0"
            )}
          >
            {activeTab === 'FeedbackConcern' && (
              <div className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full",
                isSidebarCollapsed && "lg:h-8 lg:w-1"
              )} />
            )}
            <MessageSquare className={cn("w-5 h-5 shrink-0", activeTab === 'FeedbackConcern' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            {!isSidebarCollapsed && <span>Feedback and Concern</span>}
            <span className="lg:hidden">Feedback & Concern</span>

            {/* Custom Tooltip */}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                Feedback & Concern
              </div>
            )}
          </button>

          <div className={cn("pt-10 pb-2 transition-all duration-300", isSidebarCollapsed ? "lg:pt-6 lg:pb-1 lg:flex lg:justify-center" : "pt-10 pb-2")}>
            {isSidebarCollapsed ? (
              <div className="hidden lg:block w-8 h-[1px] bg-slate-100" />
            ) : (
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Registry Reference</p>
            )}
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest lg:hidden">Registry Reference</p>
          </div>

          <button 
            onClick={() => handleTabChange('LcrRegistry')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group text-left",
              activeTab === 'LcrRegistry' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50",
              isSidebarCollapsed && "lg:justify-center lg:px-0"
            )}
          >
            {activeTab === 'LcrRegistry' && (
              <div className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full",
                isSidebarCollapsed && "lg:h-8 lg:w-1"
              )} />
            )}
            <BarChart3 className={cn("w-5 h-5 shrink-0", activeTab === 'LcrRegistry' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            {!isSidebarCollapsed && <span>LCR/PWD Registry</span>}
            <span className="lg:hidden">LCR/PWD Registry</span>

            {/* Custom Tooltip */}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                LCR/PWD Registry
              </div>
            )}
          </button>

          {[1, 2].includes(userRole) && (
            <button 
              onClick={() => handleTabChange('UserManagement')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group text-left",
                activeTab === 'UserManagement' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50",
                isSidebarCollapsed && "lg:justify-center lg:px-0"
              )}
            >
              {activeTab === 'UserManagement' && (
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full",
                  isSidebarCollapsed && "lg:h-8 lg:w-1"
                )} />
              )}
              <Users className={cn("w-5 h-5 shrink-0", activeTab === 'UserManagement' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
              {!isSidebarCollapsed && <span>User Management</span>}
              <span className="lg:hidden">User Management</span>

              {/* Custom Tooltip */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                  User Management
                </div>
              )}
            </button>
          )}
        </nav>

        <div className={cn("p-6 mt-auto border-t border-slate-100 transition-all duration-300", isSidebarCollapsed && "lg:p-4 lg:flex lg:justify-center")}>
          <button 
            onClick={onSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all group relative text-left",
              isSidebarCollapsed && "lg:justify-center lg:px-0"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
            <span className="lg:hidden">Sign Out</span>

            {/* Custom Tooltip */}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl z-[100] border border-slate-800 hidden lg:block">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative bg-[#F8F9FB] transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
      )}>
        {/* Top Header */}
        <div className="flex items-center justify-between lg:justify-end mb-8 py-2">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-3 bg-white border border-slate-100 rounded-xl shadow-sm mr-4"
          >
            <LayoutDashboard className="w-6 h-6 text-slate-600" />
          </button>
          
          <div className="relative">
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2 md:py-3 pr-4">
              {/* Segmented Notification Icons */}
              <NotificationBox 
                icon={<UserPlus className="w-4 h-4" />} 
                count={notifications.registration.pending} 
                onClick={() => setOpenNotificationTab(openNotificationTab === 'registration' ? null : 'registration')}
                active={openNotificationTab === 'registration'}
                enabled={segmentToggles.registration}
              />
              <NotificationBox 
                icon={<IdCard className="w-4 h-4" />} 
                count={notifications.idIssuance.pending} 
                onClick={() => setOpenNotificationTab(openNotificationTab === 'idIssuance' ? null : 'idIssuance')}
                active={openNotificationTab === 'idIssuance'}
                enabled={segmentToggles.idIssuance}
              />
              <NotificationBox 
                icon={<Heart className="w-4 h-4" />} 
                count={notifications.benefits.pending} 
                onClick={() => setOpenNotificationTab(openNotificationTab === 'benefits' ? null : 'benefits')}
                active={openNotificationTab === 'benefits'}
                enabled={segmentToggles.benefits}
              />
              <NotificationBox 
                icon={<Megaphone className="w-4 h-4" />} 
                count={notifications.feedback.pending} 
                onClick={() => setOpenNotificationTab(openNotificationTab === 'feedback' ? null : 'feedback')}
                active={openNotificationTab === 'feedback'}
                enabled={segmentToggles.feedback}
              />
            </div>

            {/* Notification Popover Cards - Moved outside overflow container */}
            <AnimatePresence>
              {openNotificationTab === 'registration' && (
                <NotificationCard 
                  icon={<UserPlus />}
                  title="Registrations"
                  subtitle="AWAITING ACTION"
                  newCount={notifications.registration.new}
                  pendingCount={notifications.registration.pending}
                  enabled={segmentToggles.registration}
                  onToggle={() => setSegmentToggles(prev => ({ ...prev, registration: !prev.registration }))}
                  onView={() => { handleTabChange('Management'); setOpenNotificationTab(null); }}
                  onClose={() => setOpenNotificationTab(null)}
                />
              )}
              {openNotificationTab === 'idIssuance' && (
                <NotificationCard 
                  icon={<IdCard />}
                  title="ID Issuances"
                  subtitle="PENDING REQUESTS"
                  newCount={notifications.idIssuance.new}
                  pendingCount={notifications.idIssuance.pending}
                  enabled={segmentToggles.idIssuance}
                  onToggle={() => setSegmentToggles(prev => ({ ...prev, idIssuance: !prev.idIssuance }))}
                  onView={() => { handleTabChange('IdManagement'); setOpenNotificationTab(null); }}
                  onClose={() => setOpenNotificationTab(null)}
                />
              )}
              {openNotificationTab === 'benefits' && (
                <NotificationCard 
                  icon={<Heart />}
                  title="Benefits"
                  subtitle="NEW APPLICATIONS"
                  newCount={notifications.benefits.new}
                  pendingCount={notifications.benefits.pending}
                  enabled={segmentToggles.benefits}
                  onToggle={() => setSegmentToggles(prev => ({ ...prev, benefits: !prev.benefits }))}
                  onView={() => { handleTabChange('Benefits'); setOpenNotificationTab(null); }}
                  onClose={() => setOpenNotificationTab(null)}
                />
              )}
              {openNotificationTab === 'feedback' && (
                <NotificationCard 
                  icon={<Megaphone />}
                  title="Feedback"
                  subtitle="CONCERNS RAISED"
                  newCount={notifications.feedback.new}
                  pendingCount={notifications.feedback.pending}
                  enabled={segmentToggles.feedback}
                  onToggle={() => setSegmentToggles(prev => ({ ...prev, feedback: !prev.feedback }))}
                  onView={() => { handleTabChange('FeedbackConcern'); setOpenNotificationTab(null); }}
                  onClose={() => setOpenNotificationTab(null)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {activeTab === 'Management' && (
          <>
            <header className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Registration Management</h2>
              <p className="text-slate-500 font-medium mt-1">Central Enrollment Registry</p>
            </header>

            <div className="space-y-6 mb-8">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
                  <label className="text-xs font-semibold text-slate-500 tracking-wide ml-1">Search Record</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text"
                      placeholder="Search by full name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-semibold text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm h-[52px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
                  <label className="text-xs font-semibold text-slate-500 tracking-wide ml-1">Date Range</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm h-[52px]">
                    <input 
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="bg-transparent text-sm font-semibold text-slate-900 outline-none w-full"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="bg-transparent text-sm font-semibold text-slate-900 outline-none w-full"
                    />
                    {(dateRange.from || dateRange.to) && (
                      <button 
                        onClick={() => setDateRange({ from: '', to: '' })}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1.5 flex-1 max-w-[280px]">
                  <label className="text-xs font-semibold text-slate-500 tracking-wide ml-1">Barangay</label>
                  <div className="relative">
                    <select 
                      value={barangayFilter}
                      onChange={(e) => setBarangayFilter(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-base font-semibold text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all cursor-pointer shadow-sm pr-10 h-[52px]"
                    >
                      <option value="All">All Barangays ({applications.length})</option>
                      {uniqueBarangaysLabels.map(brgy => (
                        <option key={brgy} value={brgy}>
                          {brgy} ({barangayCounts[brgy]})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 max-w-[280px]">
                  <label className="text-xs font-semibold text-slate-500 tracking-wide ml-1">Status</label>
                  <div className="relative">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-base font-semibold text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all cursor-pointer shadow-sm pr-10 h-[52px]"
                    >
                      <option value="All record">All Records</option>
                      <option value="For Approval (pending)">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-3 self-end">
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-8 py-3 bg-[#ef4444] text-white rounded-xl text-base font-semibold hover:bg-red-600 transition-all shadow-sm shadow-red-100"
                  >
                    <Download className="w-5 h-5" />
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider">Full Name</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Barangay</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Birthdate</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Registration Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Type</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-[#EF4444] animate-spin" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading records...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <AlertCircle className="w-16 h-16 text-slate-100" />
                            <p className="text-slate-400 font-medium text-lg">No records found.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatName(app)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-semibold text-slate-700">
                              {getBarangayFromAddress(app.barangay)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-medium text-slate-600">{formatDateLong(app.birth_date)}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-medium text-slate-500">{formatDate(app.registration_date || '')}</p>
                          </td>
                          <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 tracking-wider">
                            {app.registration_type}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-tight shadow-sm",
                                app.reg_status === 'approved' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                                app.reg_status === 'pending' && "bg-amber-50 text-amber-600 border-amber-100",
                                app.reg_status === 'disapproved' && "bg-rose-50 text-rose-600 border-rose-100",
                              )}>
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  app.reg_status === 'approved' && "bg-emerald-500",
                                  app.reg_status === 'pending' && "bg-amber-500 animate-pulse",
                                  app.reg_status === 'disapproved' && "bg-rose-500",
                                )} />
                                {app.reg_status === 'disapproved' ? 'Disapproved' : (app.reg_status === 'approved' ? 'Approved' : (app.reg_status?.charAt(0).toUpperCase() + app.reg_status?.slice(1)))}
                              </div>
                              {app.reg_status === 'disapproved' && (
                                <button 
                                  onClick={() => {
                                    setSelectedRemarks(app.rejection_remarks || 'No remarks provided.');
                                    setIsRemarksModalOpen(true);
                                  }}
                                  className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline mt-1"
                                >
                                  View Remarks
                                </button>
                              )}
                              {(app.reg_status === 'approved' || app.reg_status === 'disapproved') && app.date_reviewed && (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                  Reviewed: {formatDateLong(app.date_reviewed)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === app.id ? null : app.id);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </button>

                              <AnimatePresence>
                                {openDropdownId === app.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.1, ease: "easeOut" }}
                                    className="absolute right-12 top-1/2 -translate-y-1/2 z-30 w-44 bg-white border border-slate-100 rounded-xl shadow-lg py-1 overflow-hidden origin-right"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button 
                                      onClick={() => {
                                        handleViewProfile(app);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 cursor-pointer transition-colors"
                                    >
                                      <Eye className="w-4 h-4 text-slate-400" />
                                      View Profile
                                    </button>
                                    
                                    {app.reg_status === 'pending' && (
                                      <>
                                        <button 
                                          onClick={() => {
                                            setSelectedApp(app);
                                            setModalInitialIsEditing(true);
                                            setIsRegistrationModalOpen(true);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                          <Edit3 className="w-4 h-4 text-slate-400" />
                                          Edit Profile
                                        </button>
                                        <div className="h-px bg-slate-50 my-1" />
                                        {userRole !== 4 && (
                                          <>
                                            <button 
                                              onClick={() => {
                                                handleApproveClick(app.id);
                                                setOpenDropdownId(null);
                                              }}
                                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                            >
                                              <Check className="w-4 h-4" />
                                              Approve
                                            </button>
                                            <button 
                                              onClick={() => {
                                                handleDisapproveClick(app.id);
                                                setOpenDropdownId(null);
                                              }}
                                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                            >
                                              <X className="w-4 h-4" />
                                              Disapprove
                                            </button>
                                          </>
                                        )}
                                        <>
                                          <div className="h-px bg-slate-50 my-1" />
                                          <button 
                                            onClick={() => {
                                              handleDeleteClick(app.id);
                                              setOpenDropdownId(null);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Record
                                          </button>
                                        </>
                                      </>
                                    )}

                                    {(app.reg_status === 'disapproved' || app.reg_status === 'rejected') && (
                                      <>
                                        <div className="h-px bg-slate-50 my-1" />
                                        <button 
                                          onClick={() => {
                                            updateStatus(app.id, 'pending');
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-amber-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                          <RefreshCw className="w-4 h-4" />
                                          Move to Pending
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setSelectedRemarks(app.rejection_remarks || "No remarks provided");
                                            setIsRemarksModalOpen(true);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                          <Eye className="w-4 h-4" />
                                          View Remarks
                                        </button>
                                      </>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredApplications.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500">
                    Showing <span className="text-slate-900 font-semibold">{Math.min(filteredApplications.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-slate-900 font-semibold">{Math.min(filteredApplications.length, currentPage * itemsPerPage)}</span> of <span className="text-slate-900 font-semibold">{filteredApplications.length}</span> records
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all font-semibold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(filteredApplications.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-9 h-9 rounded-lg text-xs font-bold transition-all",
                            currentPage === page 
                              ? "bg-[#ef4444] text-white shadow-sm" 
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredApplications.length / itemsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(filteredApplications.length / itemsPerPage)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all font-semibold"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'Walk-in' && (
          !isWalkInFormOpen ? (
            <WalkInEnrollment 
              lcrData={lcrData}
              onProceed={(record) => {
                setSelectedLcrRecord(record);
                setIsWalkInFormOpen(true);
              }}
              onBack={() => handleTabChange('Management')}
              onSearch={handleLcrSearch}
              isLoading={isLoading}
            />
          ) : (
            <RegistrationForm 
              registrationType="Walk-in"
              isLcrVerified={!!selectedLcrRecord}
              lcrName={selectedLcrRecord?.full_name || ""}
              initialData={selectedLcrRecord ? {
                lastName: selectedLcrRecord.full_name.split(' ').slice(-1)[0],
                firstName: selectedLcrRecord.full_name.split(' ').slice(0, -1).join(' '),
                birthDate: selectedLcrRecord.birth_date,
                age: selectedLcrRecord.age
              } : undefined}
              onComplete={() => {
                fetchApplications();
                setIsWalkInFormOpen(false);
                setSelectedLcrRecord(null);
                handleTabChange('Management');
              }}
              onBack={() => {
                setIsWalkInFormOpen(false);
                setSelectedLcrRecord(null);
              }}
            />
          )
        )}

        {activeTab === 'IdManagement' && (
          <IdIssuanceModule 
            type="Management" 
            applications={applications} 
            onUnauthorized={onSignOut}
          />
        )}

        {activeTab === 'IdWalkIn' && userRole !== 3 && (
          <IdIssuanceModule 
            type="Walk-In" 
            applications={applications} 
            onUnauthorized={onSignOut}
          />
        )}

        {activeTab === 'Benefits' && (
          <BenefitsModule />
        )}

        {activeTab === 'LcrRegistry' && (
          <LcrRegistry 
            lcrData={lcrData}
            onRefresh={() => fetchLcrData(lcrPagination.currentPage)}
            isLoading={isLoading}
            currentPage={lcrPagination.currentPage}
            totalPages={lcrPagination.totalPages}
            onPageChange={fetchLcrData}
          />
        )}

        {activeTab === 'Masterlist' && (
          <Masterlist 
            onViewProfile={handleViewProfile}
            refreshTrigger={masterlistRefreshKey}
            onMoveToPending={triggerMoveToPending}
            onResetPassword={triggerResetPassword}
            onDeleteRecord={handleDeleteClick}
            onUnauthorized={onSignOut}
          />
        )}

        {activeTab === 'FeedbackConcern' && (
          <FeedbackConcern />
        )}

        {activeTab === 'UserManagement' && (
          <UserManagement />
        )}

        {activeTab === 'Dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
              <p className="text-slate-500 font-medium mt-1">Live OSCA System Module Analytics</p>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { 
                  title: 'Total Registrations', 
                  value: stats.registration.total, 
                  sub: `${stats.registration.pending} Pending Approval`, 
                  icon: UserPlus, 
                  color: 'text-blue-600', 
                  bg: 'bg-blue-50' 
                },
                { 
                  title: 'Masterlist Records', 
                  value: stats.masterlist.total, 
                  sub: `${stats.masterlist.released} IDs Released`, 
                  icon: ClipboardList, 
                  color: 'text-[#ef4444]', 
                  bg: 'bg-red-50' 
                },
                { 
                  title: 'Benefit Applications', 
                  value: stats.benefits.weddingIncentive + stats.benefits.birthdayIncentive, 
                  sub: 'Total Service Requests', 
                  icon: Heart, 
                  color: 'text-rose-600', 
                  bg: 'bg-rose-50' 
                },
                { 
                  title: 'Citizen Feedbacks', 
                  value: stats.feedback.total, 
                  sub: `${stats.feedback.pending} Awaiting Response`, 
                  icon: MessageSquare, 
                  color: 'text-amber-600', 
                  bg: 'bg-amber-50' 
                },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-4xl font-black text-slate-900 mb-2">{stat.value.toLocaleString()}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Registration Breakdown */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Registration Status Analytics</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Approved</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Pending</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Approved', value: stats.registration.approved, fill: '#10b981' },
                      { name: 'Pending', value: stats.registration.pending, fill: '#f59e0b' },
                      { name: 'Rejected', value: stats.registration.disapproved, fill: '#ef4444' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Masterlist Vitality */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Vitality Index</h3>
                <div className="flex-1 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: stats.masterlist.active, color: '#0ea5e9' },
                          { name: 'Deceased', value: stats.masterlist.deceased, color: '#94a3b8' },
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { color: '#0ea5e9' },
                          { color: '#94a3b8' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-10px]">
                    <span className="text-2xl font-black text-slate-900">{stats.masterlist.total}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                   <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-sky-500" />
                         <span className="text-xs font-bold text-slate-700">Active Members</span>
                      </div>
                      <span className="text-xs font-black text-sky-600">{stats.masterlist.active}</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-slate-400" />
                         <span className="text-xs font-bold text-slate-700">Deceased Records</span>
                      </div>
                      <span className="text-xs font-black text-slate-500">{stats.masterlist.deceased}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Benefits & Feedback Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Service Usage */}
              <div className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">System Service Requests</h3>
                    <p className="text-slate-400 text-xs font-medium mt-1">Application volume for each benefit type</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-2xl">
                    <Heart className="w-6 h-6 text-rose-500" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  {[
                    { label: 'Birthday Cash Incentives (LGU)', value: stats.benefits.birthdayIncentive, color: 'bg-emerald-500', total: Math.max(1, stats.benefits.weddingIncentive + stats.benefits.birthdayIncentive) },
                    { label: '50th Wedding Anniversary Incentive', value: stats.benefits.weddingIncentive, color: 'bg-amber-500', total: Math.max(1, stats.benefits.weddingIncentive + stats.benefits.birthdayIncentive) },
                  ].map((service, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-slate-200">{service.label}</span>
                        <span className="text-sm font-black text-white">{service.value}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(service.value / service.total) * 100}%` }}
                          transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                          className={cn("h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]", service.color)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleTabChange('Benefits')}
                  className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all border border-white/10"
                >
                  Manage All Benefits
                </button>
              </div>

              {/* Recent Feedback Feed */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">Feedback Summary</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1">Communication monitoring</p>
                  </div>
                  <div className="px-4 py-2 bg-amber-50 rounded-xl text-amber-600 font-bold text-xs">
                    {stats.feedback.pending} PENDING
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 h-full">
                   <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      <span className="text-2xl font-black text-slate-900">{stats.feedback.resolved}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolved</span>
                   </div>
                   <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                      <span className="text-2xl font-black text-slate-900">{stats.feedback.pending}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                   </div>
                </div>
                
                <button 
                  onClick={() => handleTabChange('FeedbackConcern')}
                  className="w-full mt-10 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-widest transition-all border border-slate-200"
                >
                  View Engagement Logs
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isRegistrationModalOpen && selectedApp && (
            <RegistrationProfileModal 
              application={selectedApp}
              isOpen={isRegistrationModalOpen}
              initialIsEditing={modalInitialIsEditing}
              onClose={() => {
                setIsRegistrationModalOpen(false);
                setModalInitialIsEditing(false);
              }}
              onSave={handleSaveProfile}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isMasterlistModalOpen && selectedApp && (
            <MasterlistProfileModal 
              application={selectedApp}
              isOpen={isMasterlistModalOpen}
              onClose={() => setIsMasterlistModalOpen(false)}
              onSave={handleSaveProfile}
              onRefresh={() => {
                setMasterlistRefreshKey(prev => prev + 1);
                fetchApplications();
              }}
              onMoveToPending={triggerMoveToPending}
              onResetPassword={triggerResetPassword}
            />
          )}
        </AnimatePresence>

        {/* Disapprove Modal */}
        <AnimatePresence>
          {isDisapproveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Disapprove Application</h3>
                    <button 
                      onClick={() => setIsDisapproveModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-slate-500 tracking-wide ml-1">Rejection Remarks</label>
                      <textarea 
                        value={rejectionRemarks}
                        onChange={(e) => setRejectionRemarks(e.target.value)}
                        placeholder="Enter reason for disapproval..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all min-h-[120px] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setIsDisapproveModalOpen(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitDisapproval}
                      className="flex-1 px-6 py-3.5 bg-red-500 text-white rounded-2xl font-semibold text-sm hover:bg-red-600 transition-all shadow-sm shadow-red-200"
                    >
                      Disapprove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Approve Modal */}
        <AnimatePresence>
          {isApproveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Approve Application</h3>
                    <button 
                      onClick={() => setIsApproveModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <p className="text-slate-600 font-medium">Are you sure you want to approve this application? This will mark the citizen as an official senior citizen member.</p>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button 
                      onClick={() => setIsApproveModalOpen(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitApproval}
                      className="flex-1 px-6 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                    >
                      Confirm Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Delete Record</h3>
                    <button 
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <p className="text-slate-600 font-medium">Are you sure you want to delete this record? This action cannot be undone and all data associated with this application will be permanently removed.</p>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button 
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitDelete}
                      className="flex-1 px-6 py-3.5 bg-rose-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Move to Pending Confirmation Modal */}
        <AnimatePresence>
          {isMoveToPendingModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
                    Confirm Action
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-8">
                    Are you sure you want to move this record to pending?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsMoveToPendingModalOpen(false)}
                      className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMoveToPending}
                      disabled={isMovingToPending}
                      className="flex-1 px-6 py-4 bg-amber-600 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all disabled:opacity-50"
                    >
                      {isMovingToPending ? "Moving..." : "Confirm"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Reset Password Confirmation Modal */}
        <AnimatePresence>
          {isResetPasswordModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
                    Confirm Action
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-8">
                    Are you sure you want to reset this user's password?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsResetPasswordModalOpen(false)}
                      className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                      className="flex-1 px-6 py-4 bg-blue-600 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                    >
                      {isResettingPassword ? "Resetting..." : "Confirm"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Rejection Remarks Modal */}
        <AnimatePresence>
          {isRemarksModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
                    Rejection Details
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                    <p className="text-slate-600 leading-relaxed italic">
                      "{selectedRemarks}"
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRemarksModalOpen(false)}
                    className="w-full px-6 py-4 bg-slate-900 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
