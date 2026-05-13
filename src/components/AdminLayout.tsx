import React, { useState } from 'react';
import { LayoutDashboard, Database, BarChart3, LogOut, User, FolderTree, Menu, X } from 'lucide-react';
import { useAuth } from '../App';
import { logout } from '../firebase';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'prompts' | 'analytics' | 'categories';
  setView: (view: 'dashboard' | 'prompts' | 'analytics' | 'categories') => void;
}

export default function AdminLayout({ children, currentView, setView }: AdminLayoutProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'prompts', label: 'Prompts', icon: Database },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ] as const;

  const handleNavClick = (viewId: typeof currentView) => {
    setView(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-bg-deep overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/5 glass flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-emerald rounded-lg flex items-center justify-center">
            <span className="font-bold text-bg-deep text-lg">P</span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Prompt Bajar</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-white/5 flex flex-col p-6 space-y-8 glass transition-transform duration-300 md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-2 md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-emerald rounded-lg flex items-center justify-center">
              <span className="font-bold text-bg-deep text-lg">P</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden md:block">Prompt Bajar</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                currentView === item.id 
                  ? "bg-brand-emerald text-bg-deep shadow-lg shadow-brand-emerald/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Admin'} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_40%)] pt-16 md:pt-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
