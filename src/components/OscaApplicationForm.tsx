import React, { useState } from 'react';
import { Printer, Download, X, ZoomIn, ZoomOut, Search } from 'lucide-react';

interface OscaApplicationFormProps {
  record: any;
  isOpen: boolean;
  onClose: () => void;
}

export const OscaApplicationForm = ({ record, isOpen, onClose }: OscaApplicationFormProps) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Standard web way to "Download as PDF" without specialized backend is to trigger print dialog
    // Most browsers have "Save as PDF" as default or available destination
    const originalTitle = document.title;
    document.title = `OSCA_Application_${record.scid_number || record.last_name || 'Form'}`;
    window.print();
    document.title = originalTitle;
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-6 md:p-10 overflow-hidden print:p-0 print:bg-white print:block">
      <div className="bg-white w-full max-w-[820px] max-h-[95vh] rounded-2xl shadow-2xl relative flex flex-col overflow-hidden print:shadow-none print:w-full print:max-w-none print:min-h-0 print:rounded-none">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">OSCA Application Form</h3>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs font-bold uppercase tracking-widest border border-rose-100">
              New ID Template
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200 mr-1">
              <button 
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={resetZoom}
                className="px-2 py-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-900 text-[9px] font-black uppercase tracking-widest min-w-[50px]"
                title="Reset Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button 
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto bg-slate-500/5 flex items-start justify-center p-8 print:p-0 print:bg-white print:overflow-visible no-scrollbar">
          <div 
            id="printable-form" 
            className="bg-white p-[35px] text-black font-poppins leading-none shadow-sm origin-top transition-transform duration-200 print:shadow-none print:transform-none print:p-0 print:m-0 print:w-full"
            style={{ 
              width: '720px',
              minHeight: '1020px',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              marginBottom: zoom > 1 ? `${(zoom - 1) * 1020}px` : '0',
            }}
          >
          <div className="flex flex-col items-center text-center">
            {/* Header Logos */}
            <div className="flex items-center justify-center gap-8 mb-3">
              <img 
                src="https://res.cloudinary.com/dx20khqe5/image/upload/v1777035946/Seal_of_San_Juan__Metro_Manila_1_k5lmzn.png" 
                className="w-16 h-16 object-contain" 
                alt="San Juan Seal"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <h1 className="text-[10px] font-semibold uppercase tracking-tight">REPUBLIC OF THE PHILIPPINES</h1>
            <h2 className="text-base font-bold uppercase mt-0.5">OFFICE OF THE SENIOR CITIZENS AFFAIRS (OSCA)</h2>
            <p className="text-[10px] font-medium mt-0.5">City of San Juan, Metro Manila</p>
            
            <div className="mt-3 mb-5 py-1.5 border-y border-black/20 w-full">
              <h3 className="text-xs font-bold uppercase tracking-tight italic">APPLICATION FORM FOR NEW SENIOR CITIZEN</h3>
            </div>
          </div>

          <div className="space-y-4 text-[11px]">
            {/* Top Row */}
            <div className="flex justify-between items-end gap-8">
              <div className="flex-1 min-h-[1.8rem] flex items-end">
                <span className="font-bold pr-1">FMZ-</span>
                <div className="flex-1 border-b border-black pb-0.5 text-left font-poppins min-h-[1.3rem]" />
              </div>
              <div className="flex-1 min-h-[1.8rem] flex items-end">
                <span className="font-bold whitespace-nowrap pr-2">DATE APPLIED:</span>
                <div className="flex-1 border-b border-black pb-0.5 text-center font-bold min-h-[1.3rem]">
                  {formatDate(record.application_date)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end gap-8">
              <div className="flex-1 min-h-[1.8rem] flex items-end">
                <span className="font-bold whitespace-nowrap pr-2">OSCA ID NO:</span>
                <div className="flex-1 border-b border-black pb-0.5 text-center font-poppins font-bold tracking-tight min-h-[1.3rem]">
                  {record.scid_number || ''}
                </div>
              </div>
              <div className="flex-1 min-h-[1.8rem] flex items-end">
                <span className="font-bold whitespace-nowrap pr-2">SENIOR CONTACT NO.:</span>
                <div className="flex-1 border-b border-black pb-0.5 text-center font-poppins min-h-[1.3rem]">
                  {record.contact_number || ''}
                </div>
              </div>
            </div>

            {/* Name Row */}
            <div className="flex flex-col gap-1">
               <div className="flex items-end min-h-[2.2rem]">
                  <span className="font-bold pr-2 whitespace-nowrap">NAME:</span>
                  <div className="flex-1 border-b border-black pb-0.5 text-center uppercase font-bold text-sm min-h-[1.5rem]">
                    {record.full_name || `${record.last_name || ''}, ${record.first_name || ''} ${record.middle_name || ''}`}
                  </div>
               </div>
               <div className="flex text-[9px] font-bold text-center italic">
                  <span className="w-[50px]"></span>
                  <div className="flex-1 flex justify-between">
                     <span className="flex-1">(LASTNAME)</span>
                     <span className="flex-1">(FIRSTNAME)</span>
                     <span className="flex-1">(MIDDLENAME)</span>
                  </div>
               </div>
            </div>

            {/* Demographics Row */}
            <div className="flex items-end gap-6 h-auto">
               <div className="w-[15%] min-h-[2.2rem] flex items-end">
                  <span className="font-bold pr-1">SEX:</span>
                  <div className="flex-1 border-b border-black pb-0.5 text-center uppercase min-h-[1.3rem]">
                    {record.sex || ''}
                  </div>
               </div>
               <div className="flex-1 flex flex-col">
                  <div className="flex items-end min-h-[2.2rem]">
                    <span className="font-bold whitespace-nowrap pr-2">DATE OF BIRTH:</span>
                    <div className="flex-1 border-b border-black text-center pb-0.5 uppercase min-h-[1.3rem]">
                      {formatDate(record.birth_date)}
                    </div>
                  </div>
                  <div className="flex text-[9px] font-bold text-center italic mt-1">
                    <span className="w-[95px]"></span>
                    <span className="flex-1">(MM/DD/YYYY)</span>
                  </div>
               </div>
               <div className="flex-[1.5] flex items-end min-h-[2.2rem]">
                  <span className="font-bold whitespace-nowrap pr-2">PLACE OF BIRTH:</span>
                  <div className="flex-1 border-b border-black text-center pb-0.5 uppercase truncate min-h-[1.3rem]">
                    {record.birth_place || ''}
                  </div>
               </div>
               <div className="w-[12%] flex items-end min-h-[2.2rem]">
                  <span className="font-bold pr-1">AGE:</span>
                  <div className="flex-1 border-b border-black text-center pb-0.5 min-h-[1.3rem]">
                    {record.age || ''}
                  </div>
               </div>
            </div>

            {/* Address Row */}
            <div className="flex items-end gap-10">
               <div className="flex-[3] min-h-[2.2rem] flex items-end">
                  <span className="font-bold pr-2 whitespace-nowrap">ADDRESS:</span>
                  <div className="flex-1 border-b border-black pb-0.5 uppercase text-center min-h-[1.3rem]">
                    {record.address || ''}
                  </div>
               </div>
               <div className="flex-1 min-h-[2.2rem] flex items-end">
                  <span className="font-bold pr-2 whitespace-nowrap">CITIZENSHIP:</span>
                  <div className="flex-1 border-b border-black pb-0.5 uppercase text-center min-h-[1.3rem]">
                    {record.citizenship || ''}
                  </div>
               </div>
            </div>

            {/* Civil Status Row */}
            <div className="flex items-center pt-1">
               <span className="font-bold mr-4">CIVIL STATUS:</span>
               <div className="flex items-center gap-5 font-bold uppercase text-[10px]">
                  <span className="flex items-center gap-1 font-poppins text-[10px]">({record.civil_status?.toLowerCase() === 'single' ? '✓' : ' '}) SINGLE</span>
                  <span className="flex items-center gap-1 font-poppins text-[10px]">({record.civil_status?.toLowerCase() === 'married' ? '✓' : ' '}) MARRIED</span>
                  <span className="flex items-center gap-1 font-poppins text-[10px]">({record.civil_status?.toLowerCase() === 'widow' ? '✓' : ' '}) WIDOW</span>
                  <span className="flex items-center gap-1 font-poppins text-[10px]">({record.civil_status?.toLowerCase() === 'widower' ? '✓' : ' '}) WIDOWER</span>
                  <span className="flex items-center gap-1 font-poppins text-[10px]">({record.civil_status?.toLowerCase() === 'separated' || record.civil_status?.toLowerCase() === 'seperated' ? '✓' : ' '}) SEPERATED</span>
               </div>
            </div>

            {/* Emergency Contact */}
            <div className="flex items-end gap-10">
               <div className="flex-[2] min-h-[2.2rem] flex items-end">
                 <span className="font-bold pr-2 whitespace-nowrap">CONTACT PERSON INCASE OF EMERGENCY:</span>
                 <div className="flex-1 border-b border-black pb-0.5 uppercase text-center min-h-[1.3rem]">
                   {record.emergency_contact_person || ''}
                 </div>
               </div>
               <div className="flex-1 min-h-[2.2rem] flex items-end">
                 <span className="font-bold pr-2 whitespace-nowrap">CONTACT NO.:</span>
                 <div className="flex-1 border-b border-black pb-0.5 text-center min-h-[1.3rem]">
                   {record.emergency_contact_number || ''}
                 </div>
               </div>
            </div>

            {/* Question */}
            <div className="pt-2 space-y-1.5">
              <p className="font-bold leading-relaxed text-[11px]">
                ARE YOU WILLING TO BE A MEMBER OF THE FEDERATION OF SENIOR CITIZEN ASSOCIATION IN YOUR BARANGAY?
              </p>
              <div className="flex gap-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold">YES</span>
                  <div className="w-[120px] border-b border-black h-4"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">NO</span>
                  <div className="w-[120px] border-b border-black h-4"></div>
                </div>
              </div>
            </div>

            {/* Certification */}
            <div className="pt-4">
              <p className="leading-relaxed font-semibold text-[11px]">
                I HEREBY CERTIFY THAT THE FOREGOING FACTS ARE TRUTHFUL STATEMENT OF MY CITIZENSHIP AND AGE.
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-5 items-end">
               <div className="col-span-2 col-start-3 text-center space-y-1.5">
                  <div className="h-10 flex items-center justify-center">
                    {record.signature_url && (
                      <img src={record.signature_url} className="h-10 object-contain" alt="Signature" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="border-t border-black w-full"></div>
                  <p className="text-[10px] font-bold uppercase tracking-tight">APPLICANT SIGNATURE</p>
               </div>
            </div>

            <div className="pt-8 grid grid-cols-5">
              <div className="col-span-2 col-start-3 text-center space-y-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider">APPROVED BY:</p>
                  
                  <div className="space-y-0.5">
                    <div className="border-b border-black w-full min-w-[200px] mb-1 pb-1">
                      <p className="text-sm font-bold uppercase tracking-tight">JAMES L. CHOA</p>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider leading-none">OIC-OSCA</p>
                  </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-form, #printable-form * {
            visibility: visible !important;
          }
          #printable-form {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            transform: none !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};
