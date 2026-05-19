import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Save, Info } from 'lucide-react';

export function CampaignSummaryForm({ campaign }: { campaign: any }) {
  const [data, setData] = useState({
    summary: campaign.summary || '',
    totalRaised: campaign.totalRaised || '',
    programs: campaign.programs || '',
    impactDescription: campaign.impactDescription || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'campaigns', campaign.id), data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-natural-border shadow-sm">
      <div className="flex items-center gap-2 mb-8 pb-4 border-b border-natural-accent">
        <h3 className="text-lg font-serif italic text-natural-text-dark">Appreciation Drive Summary</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-2">Narrative Summary</label>
          <textarea
            rows={3}
            value={data.summary}
            onChange={e => setData({ ...data, summary: e.target.value })}
            placeholder="A brief overview of what this drive accomplished and why it matters."
            className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl focus:ring-1 focus:ring-primary focus:bg-white outline-none transition-all text-sm resize-none leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-2">Total Raised</label>
            <input
              type="text"
              value={data.totalRaised}
              onChange={e => setData({ ...data, totalRaised: e.target.value })}
              placeholder="e.g. $250,000"
              className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl focus:ring-1 focus:ring-primary focus:bg-white outline-none transition-all text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-2">Programs Supported</label>
            <input
              type="text"
              value={data.programs}
              onChange={e => setData({ ...data, programs: e.target.value })}
              placeholder="e.g. Literacy, Clean Water, Arts"
              className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl focus:ring-1 focus:ring-primary focus:bg-white outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-2">Overall Impact Description</label>
          <textarea
            rows={4}
            value={data.impactDescription}
            onChange={e => setData({ ...data, impactDescription: e.target.value })}
            placeholder="Describe the overall change this campaign facilitated."
            className="w-full px-4 py-3 bg-natural-surface border border-natural-border rounded-xl focus:ring-1 focus:ring-primary focus:bg-white outline-none transition-all text-sm resize-none leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-natural-text-dark text-white rounded-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50 font-medium text-sm"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Summary'}
          </button>
        </div>
      </form>
    </div>
  );
}
