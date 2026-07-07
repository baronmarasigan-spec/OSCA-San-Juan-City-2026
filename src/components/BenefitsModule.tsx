import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, ChevronRight, Search, AlertCircle, ArrowLeft, Gift, Wallet, Cake, Loader2, CheckCircle2, MoreVertical, Filter, RefreshCw, ChevronLeft, ChevronDown, X, ChevronRight as ChevronRightIcon, Check, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/config';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import AnnualCashGiftManagement from './AnnualCashGiftManagement';
import SocialPensionManagement from './SocialPensionManagement';
import WeddingAnniversaryManagement from './WeddingAnniversaryManagement';
import BirthdayIncentiveManagement from './BirthdayIncentiveManagement';
import ExpandedCentenariansActManagement from './ExpandedCentenariansActManagement';
import { AnnualCashGiftForm, SocialPensionForm, WeddingAnniversaryForm, BirthdayIncentiveForm } from '../CitizenPortal';

const benefitsList = [
  { 
    id: 'annual-cash-gift', 
    name: 'Annual Cash Gift', 
    icon: Gift, 
    color: 'bg-rose-50 text-rose-600',
    description: 'Yearly financial assistance for senior citizens'
  },
  { 
    id: 'social-pension', 
    name: 'Social Pension', 
    icon: Wallet, 
    color: 'bg-blue-50 text-blue-600',
    description: 'Monthly/quarterly social pension assistance'
  },
  { 
    id: '50th-wedding-anniversary-incentive', 
    name: '50th Wedding Anniversary Incentive', 
    icon: Heart, 
    color: 'bg-amber-50 text-amber-600',
    description: 'One-time incentive for golden wedding couples'
  },
  { 
    id: 'birthday-cash-incentives', 
    name: 'Birthday Cash Incentives (LGU)', 
    icon: Cake, 
    color: 'bg-emerald-50 text-emerald-600',
    description: 'Milestone birthday financial rewards'
  },
  { 
    id: 'expanded-centenarians-act-benefit-program', 
    name: 'Expanded Centenarians Act Benefit Program (National)', 
    icon: Award, 
    color: 'bg-indigo-50 text-indigo-600',
    description: 'National cash gifts for senior milestones at 80, 85, 90, 95, 100'
  },
];

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
        <div className="overflow-y-auto no-scrollbar p-6 lg:p-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

import { CitizenSelectionTable } from './CitizenSelectionTable';

function BenefitsMenu() {
  return (
    <div className="space-y-6">
      <header className="mb-10 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Benefits Module</h2>
        <p className="text-slate-500 font-medium mt-1">Select a benefit to manage</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benefitsList.map((benefit) => (
          <Link 
            key={benefit.id}
            to={`/benefits/${benefit.id}`}
            className="group bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 hover:border-[#ef4444] hover:shadow-xl transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105",
                benefit.color
              )}>
                <benefit.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{benefit.name}</h3>
                <p className="text-slate-500 font-medium text-xs mt-1">{benefit.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#ef4444] group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function BenefitManagement() {
  const { benefit } = useParams();
  const navigate = useNavigate();

  const renderManagementView = () => {
    switch (benefit) {
      case 'annual-cash-gift':
        return <AnnualCashGiftManagement hideHeader={true} />;
      case 'social-pension':
        return <SocialPensionManagement hideHeader={true} />;
      case '50th-wedding-anniversary-incentive':
        return <WeddingAnniversaryManagement hideHeader={true} />;
      case 'birthday-cash-incentives':
        return <BirthdayIncentiveManagement hideHeader={true} />;
      case 'expanded-centenarians-act-benefit-program':
        return <ExpandedCentenariansActManagement hideHeader={true} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest">Management Module Not Found</p>
          </div>
        );
    }
  };

  const benefitData = benefitsList.find(b => b.id === benefit);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/benefits')}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#0F172A] hover:shadow-lg transition-all border border-slate-100 shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {benefitData?.name || 'Benefit Management'}
            </h2>
            <p className="text-slate-500 font-medium mt-1">Registry and Action Management</p>
          </div>
        </div>
        {!['expanded-centenarians-act-benefit-program', 'social-pension', 'annual-cash-gift'].includes(benefit || '') && (
          <Link 
            to={['50th-wedding-anniversary-incentive', 'birthday-cash-incentives'].includes(benefit || '') ? `/benefits/${benefit}/new` : `/benefits/${benefit}/new-entry`}
            className="px-6 py-3 bg-[#ef4444] text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all shadow-sm flex items-center gap-2"
          >
            <Gift className="w-4 h-4" />
            New Entry
          </Link>
        )}
      </header>

      {renderManagementView()}
    </div>
  );
}

function BenefitFormWrapper() {
  const { benefit } = useParams();
  const [searchParams] = useSearchParams();
  const citizenId = searchParams.get('citizen_id');
  
  const navigate = useNavigate();

  switch (benefit) {
    case 'annual-cash-gift':
      return <AnnualCashGiftForm mode="admin" data={{ citizen_id: citizenId }} isReadOnly={false} />;
    case 'social-pension':
      return <SocialPensionForm mode="admin" data={{ citizen_id: citizenId }} isReadOnly={false} />;
    case '50th-wedding-anniversary-incentive':
      return <WeddingAnniversaryForm mode="admin" data={{ citizen_id: citizenId }} isReadOnly={false} />;
    case 'birthday-cash-incentives':
      return <BirthdayIncentiveForm mode="admin" data={{ citizen_id: citizenId }} isReadOnly={false} />;
    default:
      return <div>Form not found</div>;
  }
}

export default function BenefitsModule() {
  return (
    <Routes>
      <Route index element={<BenefitsMenu />} />
      <Route path=":benefit" element={<BenefitManagement />} />
      <Route path=":benefit/new" element={<CitizenSelectionTable />} />
      <Route path=":benefit/new/forms" element={<BenefitFormWrapper />} />
      {/* Fallback for existing links if any */}
      <Route path=":benefit/new-entry" element={<BenefitFormWrapper />} />
    </Routes>
  );
}
