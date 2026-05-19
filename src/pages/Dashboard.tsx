import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Calendar, ChevronRight, MessageSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, deleteDoc } from 'firebase/firestore';

export function Dashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (!db || !user) return;

    const q = query(
      collection(db, 'campaigns'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !db || !user) return;

    await addDoc(collection(db, 'campaigns'), {
      title: newTitle,
      userId: user.uid,
      createdAt: serverTimestamp(),
      summary: '',
      totalRaised: '',
      programs: '',
      impactDescription: ''
    });

    setNewTitle('');
    setShowModal(false);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }

    if (!db) return;

    // Optimistic update
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);

    try {
      await deleteDoc(doc(db, 'campaigns', id));
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      // The onSnapshot will restore the state if the deletion failed or was reverted
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif italic text-natural-text-dark">Appreciation Drives</h2>
          <p className="text-natural-text-muted mt-1 font-sans">Manage your stewardship sessions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-all active:scale-95"
        >
          <Plus size={18} />
          New Drive
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-natural-border p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-natural-surface flex items-center justify-center text-primary mx-auto mb-6">
             <Calendar size={32} />
          </div>
          <h3 className="text-xl font-bold text-natural-text-dark mb-2">No drives yet</h3>
          <p className="text-natural-text-muted mb-8 max-w-sm mx-auto font-sans">Upload your first donor list and start generating personalized thank-you messages.</p>
          <button
             onClick={() => setShowModal(true)}
             className="text-primary font-bold hover:underline underline-offset-4"
          >
            Create your first drive
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {campaigns.map((c, i) => (
              <motion.div
                 key={c.id}
                 layout
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 transition={{ delay: i * 0.05 }}
                 className="group relative"
              >
                <div className="bg-white rounded-2xl border border-natural-border shadow-sm hover:shadow-md transition-all hover:border-primary/20 flex flex-col overflow-hidden">
                  <Link
                    to={`/campaign/${c.id}`}
                    className="p-8 flex-1"
                  >
                    <div className="flex justify-between items-start mb-6">
                       <h4 className="font-bold text-lg text-natural-text-dark group-hover:text-primary transition-colors tracking-tight pr-4">{c.title}</h4>
                       <ChevronRight className="text-natural-text-muted group-hover:text-primary transition-transform group-hover:translate-x-1 shrink-0" size={18} />
                    </div>
                    
                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-natural-text-muted font-bold">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {c.createdAt?.toDate().toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageSquare size={12} />
                        Session
                      </span>
                    </div>
                  </Link>
                  
                  <div className="px-8 py-3 bg-natural-surface border-t border-natural-border flex justify-between items-center">
                    {deletingId === c.id ? (
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-[10px] font-bold uppercase tracking-[0.1em] text-natural-text-muted hover:text-natural-text transition-colors"
                      >
                        Cancel
                      </button>
                    ) : <div />}
                    <button
                      onClick={(e) => handleDelete(e, c.id)}
                      className={`text-[10px] font-bold uppercase tracking-[0.1em] transition-all flex items-center gap-1.5 px-3 py-1 rounded-md ${
                        deletingId === c.id 
                          ? "bg-red-500 text-white hover:bg-red-600 shadow-sm" 
                          : "text-red-400 hover:text-red-600"
                      }`}
                      title={deletingId === c.id ? "Click again to confirm" : "Delete this drive"}
                    >
                      <Trash2 size={12} />
                      {deletingId === c.id ? "Confirm Delete" : "Delete Drive"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-natural-text-dark/20 backdrop-blur-sm">
           <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 overflow-hidden relative border border-natural-border"
           >
              <h3 className="text-2xl font-serif italic text-natural-text-dark mb-6">New Drive</h3>
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-2">Drive Title</label>
                  <input
                    autoFocus
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. 2025 Year-End Gratitude"
                    className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl focus:ring-1 focus:ring-primary focus:bg-white outline-none transition-all text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-natural-border text-natural-text font-medium rounded-lg hover:bg-natural-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all active:scale-95 font-medium shadow-lg shadow-primary/10"
                  >
                    Create
                  </button>
                </div>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
}
