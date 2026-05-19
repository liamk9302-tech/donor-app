import React, { useState } from 'react';
import { Mail, Smartphone, Phone, CheckCircle2, Download, Edit3, Save, X, Trash2, Sparkles, Loader2, PlusCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';

export function MessageReview({ 
  messages, 
  donors, 
  campaignId, 
  onDelete, 
  onGenerateSingle,
  isGenerating 
}: { 
  messages: any[], 
  donors: any[], 
  campaignId: string, 
  onDelete: (id: string) => void,
  onGenerateSingle?: (donorId: string) => void,
  isGenerating?: boolean
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(5);

  const pendingDonors = donors.filter(d => !messages.some(m => m.donorId === d.id));

  // Only show messages where we have a corresponding donor record
  const validMessages = messages.filter(m => donors.some(d => d.id === m.donorId));

  const totalItems = validMessages.length;
  const actualPageSize = pageSize === 'all' ? totalItems : pageSize;
  const totalPages = Math.ceil(totalItems / actualPageSize);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const startIndex = (currentPage - 1) * actualPageSize;
  const endIndex = startIndex + actualPageSize;
  const displayedMessages = validMessages.slice(startIndex, endIndex);

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setEditValues({
      subject: m.subject,
      emailBody: m.emailBody,
      smsBody: m.smsBody,
      callPoints: m.callPoints
    });
  };

  const handleSave = async (id: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'campaigns', campaignId, 'messages', id), editValues);
    setEditingId(null);
  };

  const openInEmail = (m: any, d: any, type: 'gmail' | 'mailto' = 'mailto') => {
    const subject = encodeURIComponent(m.subject);
    const body = encodeURIComponent(m.emailBody);
    const email = d?.email || '';
    
    if (type === 'gmail') {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`, '_blank', 'noreferrer');
    } else {
      // mailto: can sometimes be finicky in iframes, window.open is usually safer
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showEmailOptions, setShowEmailOptions] = useState<string | null>(null);
  const [showBulkSuccess, setShowBulkSuccess] = useState(false);

  const copyBCCList = () => {
    const list = validMessages
      .map(m => donors.find(d => d.id === m.donorId)?.email)
      .filter(email => !!email)
      .join(', ');
    
    if (list) {
      navigator.clipboard.writeText(list);
      setShowBulkSuccess(true);
      setTimeout(() => setShowBulkSuccess(false), 3000);
    }
  };

  const exportData = (type: 'email' | 'sms' | 'call' | 'csv') => {
    const data = validMessages.map(m => {
      const donor = donors.find(d => d.id === m.donorId);
      return {
        Donor: donor?.name || 'Unknown',
        Subject: m.subject,
        Email: m.emailBody,
        SMS: m.smsBody,
        'Call Notes': m.callPoints
      };
    });

    if (type === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `GoodCircle_Export_${campaignId}.csv`);
      link.click();
      return;
    }

    // For other types, we can generate a text file or specific structure
    let content = '';
    data.forEach(d => {
      content += `DONOR: ${d.Donor}\n`;
      if (type === 'email') {
        content += `SUBJECT: ${d.Subject}\nBODY:\n${d.Email}\n\n`;
      } else if (type === 'sms') {
        content += `SMS: ${d.SMS}\n\n`;
      } else if (type === 'call') {
        content += `CALL NOTES:\n${d['Call Notes']}\n\n`;
      }
      content += `------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GoodCircle_${type}_${campaignId}.txt`);
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl italic font-serif text-natural-text-dark flex items-center gap-3">
             <CheckCircle2 size={24} className="text-primary opacity-80" />
             Review Messages
          </h3>
          <p className="text-xs font-bold text-natural-text-muted mt-1 uppercase tracking-widest pl-9">{validMessages.length} messages ready for review</p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-4">
            <div className="flex flex-wrap gap-3 items-center">
                <button
                    onClick={copyBCCList}
                    className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95 shadow-sm uppercase tracking-widest border",
                        showBulkSuccess 
                            ? "bg-green-500 text-white border-green-500" 
                            : "bg-primary text-white border-primary hover:bg-primary-dark"
                    )}
                >
                    {showBulkSuccess ? <CheckCircle2 size={12} /> : <Mail size={12} />}
                    {showBulkSuccess ? "BCC Copied!" : "Send to All (BCC)"}
                </button>

                <div className="flex items-center gap-2 bg-white border border-natural-border px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="text-[10px] font-bold text-natural-text-muted uppercase tracking-widest">Show:</span>
                    {[5, 10, 15, 'all'].map((size) => (
                        <button
                            key={size}
                            onClick={() => {
                                setPageSize(size as any);
                                setCurrentPage(1);
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                                pageSize === size 
                                    ? "bg-primary text-white" 
                                    : "text-natural-text-muted hover:text-primary hover:bg-natural-accent"
                            }`}
                        >
                            {size === 'all' ? 'All' : size}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
               {[
                 { label: 'Emails', icon: Mail, type: 'email' },
                 { label: 'SMS', icon: Smartphone, type: 'sms' },
                 { label: 'Calls', icon: Phone, type: 'call' },
                 { label: 'CSV', icon: Download, type: 'csv' },
               ].map((btn) => (
                 <button
                   key={btn.label}
                   onClick={() => exportData(btn.type as any)}
                   className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-natural-border rounded-lg text-[10px] font-bold text-natural-text-muted hover:bg-natural-surface hover:text-primary transition-all active:scale-95 shadow-sm uppercase tracking-widest"
                 >
                   <btn.icon size={12} />
                   {btn.label}
                 </button>
               ))}
            </div>
        </div>
      </div>

      <div className="space-y-8">
        {pendingDonors.length > 0 && (
          <div className="bg-natural-accent border border-dashed border-primary/30 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
               <PlusCircle size={20} className="text-primary" />
               <h4 className="text-sm font-bold text-natural-text-dark uppercase tracking-widest">Pending Generation ({pendingDonors.length})</h4>
            </div>
            <div className="flex flex-wrap gap-3">
              {pendingDonors.map(d => (
                <button
                  key={d.id}
                  onClick={() => onGenerateSingle?.(d.id)}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-3 px-4 py-2.5 bg-white border border-natural-border rounded-xl text-xs font-bold text-natural-text-dark hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {displayedMessages.map((m) => {
          const donor = donors.find(d => d.id === m.donorId);
          const isEditing = editingId === m.id;

          return (
            <div key={m.id} className="bg-white rounded-2xl border border-natural-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="bg-natural-surface px-6 py-4 flex justify-between items-center border-b border-natural-border">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary border border-natural-border shadow-sm font-bold text-xs uppercase tracking-tighter">
                     {donor?.name?.substring(0, 2) || '??'}
                   </div>
                   <h4 className="font-bold text-natural-text-dark tracking-tight text-sm uppercase tracking-[0.1em]">{donor?.name || 'Unknown Donor'}</h4>
                </div>
                {!isEditing ? (
                  <div className="flex items-center gap-2">
                    {confirmDelete === m.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-[10px] font-bold uppercase tracking-widest text-natural-text-muted hover:text-natural-text transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onDelete(m.id);
                            setConfirmDelete(null);
                          }}
                          className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-red-600 transition-colors shadow-sm"
                        >
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <button 
                            onClick={() => setShowEmailOptions(showEmailOptions === m.id ? null : m.id)}
                            className="p-2 text-green-600 hover:text-green-700 transition-colors border border-green-200 bg-green-50 rounded-lg flex items-center gap-1.5 px-3"
                            title="Open in Email"
                          >
                            <ExternalLink size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Send Email</span>
                          </button>
                          
                          {showEmailOptions === m.id && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-natural-border rounded-xl shadow-xl z-[100] py-2 overflow-hidden animate-in fade-in slide-in-from-top-1">
                              <button 
                                onClick={() => {
                                  openInEmail(m, donor, 'gmail');
                                  setShowEmailOptions(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs font-bold text-natural-text-dark hover:bg-natural-surface flex items-center gap-2"
                              >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-3 h-3" />
                                Open in Gmail
                              </button>
                              <button 
                                onClick={() => {
                                  openInEmail(m, donor, 'mailto');
                                  setShowEmailOptions(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs font-bold text-natural-text-dark hover:bg-natural-surface flex items-center gap-2"
                              >
                                <Mail size={12} className="text-natural-text-muted" />
                                Default Mail App
                              </button>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => onGenerateSingle?.(m.donorId)} 
                          disabled={isGenerating}
                          className="p-2 text-primary hover:text-primary-dark transition-colors border border-primary/20 bg-primary/5 rounded-lg flex items-center gap-1.5 px-3"
                          title="Regenerate this message"
                        >
                          {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          <span className="text-[10px] font-bold uppercase tracking-widest">Regenerate</span>
                        </button>
                        <button onClick={() => handleEdit(m)} className="p-2 text-natural-text-muted hover:text-primary transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => setConfirmDelete(m.id)} className="p-2 text-natural-text-muted hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(m.id)} className="p-2 text-green-600 hover:text-green-700 transition-colors">
                      <Save size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-natural-text-muted hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Email Content */}
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-natural-text-muted uppercase tracking-[0.2em] mb-3">
                      <Mail size={12} />
                      Email Draft
                    </label>
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editValues.subject}
                          onChange={e => setEditValues({ ...editValues, subject: e.target.value })}
                          className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                          placeholder="Subject"
                        />
                        <textarea
                          rows={8}
                          value={editValues.emailBody}
                          onChange={e => setEditValues({ ...editValues, emailBody: e.target.value })}
                          className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-lg text-sm leading-relaxed outline-none resize-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="font-bold text-sm text-natural-text-dark border-b border-natural-accent pb-3 tracking-tight">{m.subject}</div>
                        <div className="text-base text-natural-text leading-relaxed whitespace-pre-wrap font-serif">
                          {m.emailBody}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Formats */}
                <div className="space-y-8">
                   <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-natural-text-muted uppercase tracking-[0.2em] mb-3">
                      <Smartphone size={12} />
                      SMS / Card Text
                      {donor?.phone && <span className="ml-2 font-mono text-[9px] opacity-60">({donor.phone})</span>}
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={editValues.smsBody}
                        onChange={e => setEditValues({ ...editValues, smsBody: e.target.value })}
                        className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg text-sm italic outline-none resize-none focus:ring-1 focus:ring-primary"
                      />
                    ) : (
                      <div className="text-sm text-natural-text-muted italic p-5 bg-natural-accent rounded-xl border border-natural-border/50 leading-relaxed font-serif">
                        "{m.smsBody}"
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-natural-text-muted uppercase tracking-[0.2em] mb-3">
                      <Phone size={12} />
                      Call Talking Points
                      {donor?.phone && <span className="ml-2 font-mono text-[9px] opacity-60">({donor.phone})</span>}
                    </label>
                    {isEditing ? (
                       <textarea
                        rows={4}
                        value={editValues.callPoints}
                        onChange={e => setEditValues({ ...editValues, callPoints: e.target.value })}
                        className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg text-sm font-mono outline-none resize-none focus:ring-1 focus:ring-primary"
                      />
                    ) : (
                      <div className="text-xs text-natural-text-muted font-mono p-5 bg-natural-accent rounded-xl border border-natural-border/50 whitespace-pre-wrap leading-loose">
                        {m.callPoints}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>

      {pageSize !== 'all' && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12 pb-12">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-natural-border bg-white text-natural-text-dark disabled:opacity-30 hover:bg-natural-surface transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] h-8 text-[10px] font-bold rounded-lg border transition-all ${
                      currentPage === page
                        ? "bg-primary border-primary text-white shadow-sm"
                        : "bg-white border-natural-border text-natural-text-dark hover:border-primary hover:text-primary"
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-1 text-natural-text-muted">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-natural-border bg-white text-natural-text-dark disabled:opacity-30 hover:bg-natural-surface transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
