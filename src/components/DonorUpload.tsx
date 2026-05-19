import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Upload, FileText, Check, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function DonorUpload({ campaignId }: { campaignId: string }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualDonor, setManualDonor] = useState({ name: '', email: '', phone: '', addressee: '', salutation: '', address: '', amount: '', visited: '', interests: '', notes: '' });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !db || !user) return;

    setUploading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: async (results: any) => {
  try {
    const rows = Array.isArray(results.data) ? results.data : [];

    const getVal = (d: any, keys: string[]) => {
      const key = Object.keys(d).find((k) =>
        keys.includes(k.toLowerCase().replace(/[^a-z]/g, ""))
      );
      return key ? d[key] : "";
    };

    const batch = rows.map((d: any) => {
      const firstName = getVal(d, ["firstname", "first"]);
      const lastName = getVal(d, ["lastname", "last"]);
      const name =
        getVal(d, ["name", "donor", "donorname", "fullname", "names", "addressee"]) ||
        `${firstName} ${lastName}`.trim() ||
        "Unknown";

      return {
        name,
        firstName,
        lastName,
        email: getVal(d, ["email", "emailaddress", "mail"]),
        phone: getVal(d, ["phone", "phonenumber", "cell", "mobile", "tel"]),
        addressee: getVal(d, ["addressee", "mailingname", "formattedname"]),
        salutation: getVal(d, ["salutation", "dear", "informalname"]),
        address: getVal(d, ["address", "mailingaddress", "streetaddress", "street"]),
        amount: getVal(d, ["amount", "gift", "total", "raised", "contribution", "donationamount"]),
        visited: getVal(d, ["visited", "lastvisited", "visitdate"]),
        interests: getVal(d, ["interests", "interest", "tags"]),
        notes: getVal(d, ["notes", "staffnotes", "comments", "comment"]),
        campaignId,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };
    });
  return {
    name,
    email,
    phone,
    addressee,
    salutation,
    address,
    amount,
    visited,
    interests,
    notes,
  };
});
            return {
              campaignId,
              userId: user.uid,
              name,
              email,
              phone,
              addressee,
              salutation,
              address,
              amount,
              visited,
              interests,
              status: 'pending',
              notes,
              createdAt: serverTimestamp()
            };
          });

          for (const donor of batch) {
            await addDoc(collection(db, 'campaigns', campaignId, 'donors'), donor);
          }
          setUploading(false);
        } catch (err: any) {
          setError(err.message);
          setUploading(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setUploading(false);
      }
    });
  }, [campaignId, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  } as any);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDonor.name || !db || !user) return;

    await addDoc(collection(db, 'campaigns', campaignId, 'donors'), {
      ...manualDonor,
      campaignId,
      userId: user.uid,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    setManualDonor({ name: '', email: '', phone: '', addressee: '', salutation: '', address: '', amount: '', visited: '', interests: '', notes: '' });
    setShowManual(false);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          {...getRootProps()}
          className={cn(
            "relative group flex flex-col items-center justify-center p-12 border border-natural-border rounded-2xl transition-all cursor-pointer",
            isDragActive ? "bg-natural-accent border-primary" : "bg-white hover:bg-natural-surface hover:border-primary/30"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-full bg-natural-accent flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <Upload size={28} />
          </div>
          <h4 className="text-base font-bold text-natural-text-dark mb-1">Upload CSV</h4>
          <p className="text-xs text-natural-text-muted text-center max-w-xs font-medium uppercase tracking-wider">
            Drag and drop or click to browse.
          </p>
          {uploading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Processing...</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowManual(true)}
          className="flex flex-col items-center justify-center p-12 border border-natural-border rounded-2xl transition-all cursor-pointer bg-white hover:bg-natural-surface hover:border-primary/30 group text-center"
        >
          <div className="w-14 h-14 rounded-full bg-natural-accent flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-all">
            <Plus size={28} />
          </div>
          <h4 className="text-base font-bold text-natural-text-dark mb-1">Add Manual</h4>
          <p className="text-xs text-natural-text-muted text-center max-w-xs font-medium uppercase tracking-wider">
            Enter a single donor manually.
          </p>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <span className="text-xs font-semibold">{error}</span>
        </div>
      )}

      {showManual && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-natural-text-dark/20 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-natural-border">
              <h3 className="text-2xl font-serif italic text-natural-text-dark mb-6">Add Donor Manually</h3>
              <form onSubmit={handleManualAdd} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Donor Name</label>
                  <input
                    required
                    type="text"
                    value={manualDonor.name}
                    onChange={e => setManualDonor({...manualDonor, name: e.target.value})}
                    placeholder="e.g. Jane Smith"
                    className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Email Address</label>
                  <input
                    type="email"
                    value={manualDonor.email}
                    onChange={e => setManualDonor({...manualDonor, email: e.target.value})}
                    placeholder="e.g. jane@example.com"
                    className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={manualDonor.phone}
                    onChange={e => setManualDonor({...manualDonor, phone: e.target.value})}
                    placeholder="e.g. (555) 000-0000"
                    className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Addressee</label>
                    <input
                      type="text"
                      value={manualDonor.addressee}
                      onChange={e => setManualDonor({...manualDonor, addressee: e.target.value})}
                      placeholder="e.g. Mr. and Mrs. Smith"
                      className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Salutation</label>
                    <input
                      type="text"
                      value={manualDonor.salutation}
                      onChange={e => setManualDonor({...manualDonor, salutation: e.target.value})}
                      placeholder="e.g. Bob and Jane"
                      className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Mailing Address</label>
                  <input
                    type="text"
                    value={manualDonor.address}
                    onChange={e => setManualDonor({...manualDonor, address: e.target.value})}
                    placeholder="123 Main St, City, ST 12345"
                    className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Amount</label>
                    <input
                      type="text"
                      value={manualDonor.amount}
                      onChange={e => setManualDonor({...manualDonor, amount: e.target.value})}
                      placeholder="$100"
                      className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Last Visited</label>
                    <input
                      type="text"
                      value={manualDonor.visited}
                      onChange={e => setManualDonor({...manualDonor, visited: e.target.value})}
                      placeholder="e.g. Oct 2024"
                      className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Interests</label>
                  <input
                    type="text"
                    value={manualDonor.interests}
                    onChange={e => setManualDonor({...manualDonor, interests: e.target.value})}
                    placeholder="e.g. Education, Local Arts"
                    className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-natural-text-muted uppercase tracking-widest mb-1">Staff Notes</label>
                  <textarea
                    rows={3}
                    value={manualDonor.notes}
                    onChange={e => setManualDonor({...manualDonor, notes: e.target.value})}
                    placeholder="Any personal details or context..."
                    className="w-full px-4 py-2 bg-natural-surface border border-natural-border rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none text-sm leading-relaxed"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowManual(false)} className="flex-1 py-2 font-bold text-sm text-natural-text-muted hover:text-natural-text-dark">Cancel</button>
                   <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark shadow-lg shadow-primary/10 transition-all active:scale-95">Save Donor</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
