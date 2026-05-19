import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { signInWithGoogle } from '../lib/firebase';
import { Heart, Upload, Sparkles, Send } from 'lucide-react';
import { motion } from 'motion/react';

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative isolate pt-14 px-4 lg:px-8 min-h-[80vh] flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-4xl"
      >
        <div className="flex justify-center mb-12">
          <div className="w-20 h-20 rounded-full border-2 border-primary border-r-transparent flex items-center justify-center p-2">
            <div className="w-full h-full rounded-full border-t-2 border-primary opacity-30 animate-[spin_10s_linear_infinite]"></div>
          </div>
        </div>

        <h1 className="text-5xl font-serif italic text-natural-text-dark sm:text-7xl mb-8 leading-tight">
          Meaningful Gratitude, <br /><span className="text-primary not-italic font-sans font-medium">at Scale.</span>
        </h1>
        <p className="text-lg leading-relaxed text-natural-text-muted max-w-2xl mx-auto mb-12 font-sans">
          GoodCircle transforms donor lists into human-centered, personalized year-end stewardship messages. No CRM bloat, just pure gratitude.
        </p>

        <div className="flex items-center justify-center gap-4">
          {user ? (
            <Link
              to="/dashboard"
              className="px-10 py-4 bg-primary text-white text-lg font-medium rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="px-10 py-4 bg-primary text-white text-lg font-medium rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
            >
              Get Started with Google
            </button>
          )}
        </div>
      </motion.div>

      <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-3 w-full max-w-6xl">
        {[
          { icon: Upload, title: 'Keep it Personal', text: 'Import CSV or manual records. We stick strictly to the data you provide.' },
          { icon: Sparkles, title: 'Natural Voice', text: 'Generate warm, human messages without the robotic nonprofit clichés.' },
          { icon: Send, title: 'Review & Send', text: 'Finalize drafts and export for your existing communication tools.' }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="p-8 bg-white rounded-2xl border border-natural-border shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-natural-surface flex items-center justify-center text-primary mb-6">
              <feature.icon size={24} />
            </div>
            <h3 className="text-lg font-semibold text-natural-text-dark mb-3 leading-tight">{feature.title}</h3>
            <p className="text-sm text-natural-text-muted leading-relaxed font-sans">{feature.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
