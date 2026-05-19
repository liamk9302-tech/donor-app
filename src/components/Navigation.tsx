import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { signInWithGoogle, auth } from '../lib/firebase';
import { LogOut, Layout, User as UserIcon } from 'lucide-react';

export function Navigation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      navigate('/');
    }
  };

  return (
    <nav className="h-16 flex items-center justify-between px-8 bg-white border-b border-natural-border sticky top-0 z-50">
      <div className="flex items-center gap-3 group">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-r-transparent flex items-center justify-center transition-transform group-hover:rotate-12">
            <div className="w-4 h-4 rounded-full border-t-2 border-primary opacity-50"></div>
          </div>
          <span className="text-xl font-medium tracking-tight text-natural-text-dark font-sans">GoodCircle</span>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link to="/dashboard" className="text-sm font-medium text-natural-text-muted hover:text-primary transition-colors">
              My Drives
            </Link>
            <div className="flex items-center gap-3">
               {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-natural-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-natural-accent flex items-center justify-center text-xs font-bold text-primary">
                  {user.displayName?.substring(0, 2).toUpperCase() || '??'}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-natural-text">{user.displayName}</span>
              <button
                onClick={handleLogout}
                className="p-2 text-natural-text-muted hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="inline-flex items-center px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-all active:scale-95"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
