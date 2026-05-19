import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, addDoc, getDocs, serverTimestamp, orderBy, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { generateMessages } from '../lib/gemini';
import { CampaignSummaryForm } from '../components/CampaignSummaryForm';
import { DonorUpload } from '../components/DonorUpload';
import { DonorList } from '../components/DonorList';
import { MessageReview } from '../components/MessageReview';
import { Sparkles, ChevronLeft, Loader2, AlertCircle, History } from 'lucide-react';
import { motion } from 'motion/react';

export function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !user) return;

    // Persist user profile
    const userRef = doc(db, 'users', user.uid);
    updateDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      lastLogin: serverTimestamp()
    }).catch(() => {
      // If document doesn't exist, create it
      setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: serverTimestamp()
      });
    });

    const unsubCampaign = onSnapshot(doc(db, 'campaigns', id), (doc) => {
      if (doc.exists()) setCampaign({ id: doc.id, ...doc.data() });
      else navigate('/dashboard');
      setLoading(false);
    });

    const unsubDonors = onSnapshot(
      query(
        collection(db, 'campaigns', id, 'donors'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        setDonors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubMessages = onSnapshot(
      query(
        collection(db, 'campaigns', id, 'messages'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      unsubCampaign();
      unsubDonors();
      unsubMessages();
    };
  }, [id, navigate, user]);

  const handleGenerate = async () => {
    if (!campaign || donors.length === 0 || !db || !id) return;

    setGenerating(true);
    setError(null);

    try {
      const pendingDonors = donors.filter(d => !messages.some(m => m.donorId === d.id));

      if (pendingDonors.length === 0) {
        setError("All donors already have messages generated. Delete existing messages to re-generate.");
        setGenerating(false);
        return;
      }

      const results = await generateMessages(campaign, pendingDonors);

      for (const res of results) {
        await addDoc(collection(db, 'campaigns', id, 'messages'), {
          ...res,
          donorId: res.donorId,
          userId: user?.uid,
          campaignId: id,
          createdAt: serverTimestamp(),
        });
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSingle = async (donorId: string) => {
    if (!campaign || !db || !id || !user) return;
    
    setGenerating(true);
    try {
      const donor = donors.find(d => d.id === donorId);
      if (!donor) return;

      const results = await generateMessages(campaign, [donor]);
      if (results.length > 0) {
        // If a message already exists, we should probably delete it or update it?
        // Actually, the user might want multiple drafts, but usually they want one fresh one.
        // Let's check for existing and delete if it exists to replace it.
        const existingMessage = messages.find(m => m.donorId === donorId);
        if (existingMessage) {
          await deleteDoc(doc(db, 'campaigns', id, 'messages', existingMessage.id));
        }

        await addDoc(collection(db, 'campaigns', id, 'messages'), {
          ...results[0],
          donorId: donor.id,
          userId: user.uid,
          campaignId: id,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      console.error('Failed to generate single message:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteDonor = async (donorId: string) => {
    if (!db || !id) return;
    
    // Optimistic update
    setDonors(prev => prev.filter(d => d.id !== donorId));
    // Also remove associated messages optimistically
    setMessages(prev => prev.filter(m => m.donorId !== donorId));

    try {
      await deleteDoc(doc(db, 'campaigns', id, 'donors', donorId));
    } catch (err) {
      console.error('Failed to delete donor:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!db || !id) return;

    // Optimistic update
    setMessages(prev => prev.filter(m => m.id !== messageId));

    try {
      await deleteDoc(doc(db, 'campaigns', id, 'messages', messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="group flex items-center gap-2 text-sm font-medium text-natural-text-muted hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Drives
        </button>
        <div className="flex items-center gap-3 px-4 py-1.5 bg-natural-accent rounded-lg">
           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
           <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Active stewardship Session</span>
        </div>
      </div>

      <div>
        <h2 className="text-4xl font-serif italic text-natural-text-dark tracking-tight">{campaign.title}</h2>
        <div className="flex items-center gap-4 mt-3 text-xs font-bold text-natural-text-muted uppercase tracking-widest">
           <span className="flex items-center gap-1.5"><History size={14} /> Created {campaign.createdAt?.toDate().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
        <div className="xl:col-span-2 space-y-12">
          {/* Step 1: Summary */}
          <section>
            <CampaignSummaryForm campaign={campaign} />
          </section>

          {/* Step 2: Donors */}
          <section className="space-y-8">
            <h3 className="text-[10px] font-bold text-natural-text-muted uppercase tracking-[0.2em] pl-1">Donor Data</h3>
            <DonorUpload campaignId={campaign.id} />
            <DonorList donors={donors} onDelete={handleDeleteDonor} />
          </section>

          {/* Step 4: Results */}
          {messages.length > 0 && (
            <section id="review">
              <MessageReview 
                messages={messages} 
                donors={donors} 
                campaignId={campaign.id} 
                onDelete={handleDeleteMessage}
                onGenerateSingle={handleGenerateSingle}
                isGenerating={generating}
              />
            </section>
          )}
        </div>

        {/* Action Sidebar */}
        <div className="sticky top-24 space-y-6">
          <div className="bg-primary rounded-2xl p-8 text-white shadow-xl shadow-primary/10">
            <h4 className="text-xl font-serif italic mb-4 flex items-center gap-2">
               <Sparkles size={24} />
               Ready to go?
            </h4>
            <p className="opacity-80 text-sm leading-relaxed mb-8 font-sans">
              Generate heart-centered thank you messages based on your campaign summary and donor history.
            </p>

            <button
              onClick={handleGenerate}
              disabled={donors.length === 0 || generating}
              className="w-full py-4 bg-white text-primary rounded-xl font-bold hover:bg-natural-accent transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-3 text-sm tracking-tight"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Messages
                </>
              )}
            </button>

            {donors.length === 0 && (
              <p className="mt-4 text-[10px] opacity-70 font-bold text-center uppercase tracking-[0.15em]">
                Upload data to enable
              </p>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-400/20 backdrop-blur-sm rounded-lg flex items-start gap-2 border border-red-400/30">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium leading-normal">{error}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 border border-natural-border shadow-sm">
            <h4 className="font-bold text-natural-text-dark mb-5 uppercase tracking-[0.2em] text-[10px]">Stewardship Pulse</h4>
            <div className="space-y-5">
               <div className="flex justify-between items-center pb-4 border-b border-natural-accent text-sm">
                  <span className="text-natural-text-muted">Total Donors</span>
                  <span className="font-bold text-natural-text-dark">{donors.length}</span>
               </div>
               <div className="flex justify-between items-center pb-4 border-b border-natural-accent text-sm">
                  <span className="text-natural-text-muted">Messages Generated</span>
                  <span className="font-bold text-primary font-mono">{messages.length}</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold pt-2 uppercase tracking-widest text-natural-text-muted">
                  <span>Progress</span>
                  <span className="text-primary">{donors.length > 0 ? Math.round((messages.length / donors.length) * 100) : 0}%</span>
               </div>
               <div className="w-full bg-natural-accent h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${donors.length > 0 ? (messages.length / donors.length) * 100 : 0}%` }}
                    className="h-full bg-primary"
                  />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
