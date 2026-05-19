import React, { useState } from 'react';
import { User, Trash2, Calendar, DollarSign, StickyNote, Mail, ChevronLeft, ChevronRight, Phone, Sparkles } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export function DonorList({ donors, onDelete }: { donors: any[], onDelete: (id: string) => void }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(5);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  if (donors.length === 0) {
    return (
      <div className="bg-natural-surface rounded-2xl p-12 text-center border border-natural-border">
        <p className="text-natural-text-muted font-bold text-xs uppercase tracking-widest">No donor data uploaded yet</p>
      </div>
    );
  }

  const totalItems = donors.length;
  const actualPageSize = pageSize === 'all' ? totalItems : pageSize;
  const totalPages = Math.ceil(totalItems / actualPageSize);
  
  // Ensure current page is valid if list shrinks
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const startIndex = (currentPage - 1) * actualPageSize;
  const endIndex = startIndex + actualPageSize;
  const displayedDonors = donors.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h4 className="text-[10px] font-bold text-natural-text-muted uppercase tracking-[0.2em] pl-1">
          Donors ({donors.length})
          {pageSize !== 'all' && (
            <span className="ml-2 lowercase font-normal opacity-60">
              Showing {startIndex + 1}–{Math.min(endIndex, totalItems)}
            </span>
          )}
        </h4>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-natural-text-muted uppercase tracking-widest">Show:</span>
            {[5, 10, 15, 'all'].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPageSize(size as any);
                  setCurrentPage(1);
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
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
      </div>

      <div className="divide-y divide-natural-accent bg-white rounded-2xl border border-natural-border shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage + String(pageSize)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {displayedDonors.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-5 group hover:bg-natural-surface transition-colors border-b border-natural-accent last:border-0"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-natural-accent flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-natural-text-dark truncate leading-tight flex items-center gap-2">
                      {d.name}
                      {d.email && (
                        <span className="font-normal text-[10px] text-natural-text-muted lowercase tracking-normal flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Mail size={10} />
                          {d.email}
                        </span>
                      )}
                      {d.phone && (
                        <span className="font-normal text-[10px] text-natural-text-muted lowercase tracking-normal flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Phone size={10} />
                          {d.phone}
                        </span>
                      )}
                      {d.salutation && (
                         <span className="font-normal text-[10px] text-primary lowercase tracking-normal flex items-center gap-1 opacity-80">
                           <Sparkles size={10} />
                           Salutation: {d.salutation}
                         </span>
                      )}
                    </h5>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {d.addressee && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-natural-text-muted uppercase tracking-wider">
                          Addressee: {d.addressee}
                        </span>
                      )}
                      {d.address && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-natural-text-muted uppercase tracking-wider">
                          Address: {d.address}
                        </span>
                      )}
                      {d.amount && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary bg-natural-accent px-2 py-0.5 rounded">
                          <DollarSign size={10} />
                          {d.amount}
                        </span>
                      )}
                      {d.visited && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-natural-text-muted uppercase tracking-wider">
                          <Calendar size={10} />
                          {d.visited}
                        </span>
                      )}
                      {d.interests && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-natural-text-muted uppercase tracking-wider">
                          <StickyNote size={10} />
                          {d.interests}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {d.notes && (
                    <div className="hidden sm:block text-xs text-natural-text-muted max-w-[200px] italic truncate font-serif">
                      "{d.notes}"
                    </div>
                  )}
                  {confirmDelete === d.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] font-bold uppercase tracking-widest text-natural-text-muted hover:text-natural-text transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onDelete(d.id);
                          setConfirmDelete(null);
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-red-600 transition-colors shadow-sm"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(d.id)}
                      className="p-2 text-natural-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Donor"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {pageSize !== 'all' && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-natural-border bg-white text-natural-text-dark disabled:opacity-30 hover:bg-natural-surface transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Simple pagination logic: show current, first, last, and neighbors
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
