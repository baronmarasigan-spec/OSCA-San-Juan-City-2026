import React, { useState } from 'react';
import { Search, UserPlus, ChevronRight, X, AlertCircle, CheckCircle2, ArrowRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LcrRecord } from './LcrRegistry';

interface WalkInEnrollmentProps {
  lcrData: LcrRecord[];
  onProceed: (record: LcrRecord | null) => void;
  onBack: () => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

export default function WalkInEnrollment({ 
  lcrData, 
  onProceed, 
  onBack, 
  onSearch, 
  isLoading = false 
}: WalkInEnrollmentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<LcrRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Requirement: Only search if at least 4 characters
  const isSearchActive = searchQuery.trim().length >= 4;

  // Sync search with server if onSearch is provided
  React.useEffect(() => {
    if (onSearch && isSearchActive) {
      const timer = setTimeout(() => {
        onSearch(searchQuery.trim());
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [searchQuery, onSearch, isSearchActive]);

  const filteredRecords = !isSearchActive 
    ? [] 
    : lcrData.filter(record => {
        const fullName = (record?.full_name || '').toString().toLowerCase();
        const search = (searchQuery || '').toLowerCase();
        // Requirement: Only display 60 years old and above
        return fullName.includes(search) && record.age >= 60;
      });

  const handleRecordClick = (record: LcrRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const formatDateLong = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#ef4444] hover:border-[#ef4444] transition-all shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Walk-in Enrollment</h2>
            <p className="text-slate-500 font-medium mt-1">Initiate enrollment by searching the Local Civil Registry (LCR).</p>
          </div>
        </div>
        <button 
          onClick={() => onProceed(null)}
          className="flex items-center gap-2 px-8 py-3 bg-[#ef4444] text-white rounded-xl text-base font-semibold hover:bg-red-600 transition-all shadow-sm shadow-red-100"
        >
          <UserPlus className="w-5 h-5" />
          New Manual Entry
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Search Bar */}
          <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100 relative">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 text-[#ef4444] animate-spin" />
                ) : (
                  <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                )}
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search citizen by name in LCR database..."
                className="w-full pl-14 pr-8 py-4 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            {!isSearchActive && searchQuery.trim().length > 0 && (
              <div className="absolute -bottom-6 left-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <AlertCircle className="w-3 h-3" />
                Please enter at least 4 characters to search...
              </div>
            )}
          </div>

          {/* Results */}
          <AnimatePresence>
            {isSearchActive && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="rounded-2xl border border-slate-100 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Senior LCR Matches ({filteredRecords.length})
                  </p>
                  {isLoading && (
                    <span className="text-[10px] font-bold text-[#ef4444] animate-pulse uppercase tracking-widest">
                      Searching Registry...
                    </span>
                  )}
                </div>
                
                <div className="divide-y divide-slate-50 min-h-[100px]">
                  {isLoading && filteredRecords.length === 0 ? (
                    <div className="px-6 py-12 flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-[#ef4444] animate-spin mb-4" />
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Accessing Registry database...</p>
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-slate-400 font-semibold mb-2">No senior matches found in LCR database.</p>
                      <button 
                        onClick={() => onProceed(null)}
                        className="text-[#ef4444] font-bold text-sm uppercase tracking-wider hover:underline"
                      >
                        Proceed with manual entry instead
                      </button>
                    </div>
                  ) : (
                    filteredRecords.map((record) => (
                      <button 
                        key={record.id}
                        onClick={() => handleRecordClick(record)}
                        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-[#ef4444] group-hover:bg-[#ef4444] group-hover:text-white transition-colors">
                            <UserPlus className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{record.full_name}</h4>
                            <div className="flex items-center gap-3 mt-0.5 text-slate-500 font-medium text-xs">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                {record.birth_date}
                              </span>
                              <span>•</span>
                              <span>{record.age} Years Old</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-[#ef4444] group-hover:translate-x-1 transition-all" />
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {isModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-8 top-8 p-3 hover:bg-slate-100 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>

              <div className="p-12">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-2 mb-6 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">LCR Verified</span>
                  </div>
                  <h3 className="text-5xl font-black text-[#0F172A] uppercase tracking-tighter leading-none mb-10">
                    {selectedRecord.full_name}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Birthdate</p>
                      <p className="text-xl font-black text-[#0F172A]">{selectedRecord.birth_date}</p>
                    </div>
                    <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Age</p>
                      <p className="text-xl font-black text-[#0F172A]">{selectedRecord.age} Years Old</p>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50 p-6 rounded-3xl flex gap-4 border border-rose-100 mb-10">
                  <AlertCircle className="w-6 h-6 text-[#E11D48] shrink-0" />
                  <p className="text-sm font-bold text-[#E11D48] leading-relaxed">
                    By proceeding, you trust the <span className="font-black">Birthdate</span> and <span className="font-black">Age</span> provided by the Local Civil Registry for this enrollment.
                  </p>
                </div>

                <button 
                  onClick={() => onProceed(selectedRecord)}
                  className="w-full py-6 bg-[#0F172A] text-white rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3"
                >
                  Proceed to Enrollment
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
