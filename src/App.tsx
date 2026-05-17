import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, loginWithGoogle, logout, db, doc, getDoc, collection, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import AdminLayout from './components/AdminLayout';
import Dashboard from './components/Dashboard';
import PromptList from './components/PromptList';
import Analytics from './components/Analytics';
import CategoryManager from './components/CategoryManager';
import { LogIn, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'prompts' | 'analytics' | 'categories';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
      } catch (error: any) {
        if (error.code === 'auth/unauthorized-domain') {
          const domain = window.location.hostname;
          setAuthError(`Unauthorized domain: ${domain}. Please add this domain to authorized domains in Firebase Console.`);
        } else {
          setAuthError(error.message || "Failed to login on redirect");
        }
      }
    };
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Check if admin: either bootstrap email or in admins collection
          if (user.email === 'mainalhaque19@gmail.com') {
            setIsAdmin(true);
          } else {
            const adminRef = doc(db, 'admins', user.uid);
            const adminSnap = await getDoc(adminRef);
            setIsAdmin(adminSnap.exists());
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `admins/${user.uid}`);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setAuthError(`Unauthorized domain: ${domain}. Please add this domain to authorized domains in Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else {
        setAuthError(error.message || "Failed to login");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-emerald animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass p-6 md:p-8 rounded-3xl text-center space-y-6 mx-auto"
        >
          <div className="w-16 h-16 bg-brand-emerald/20 flex items-center justify-center rounded-2xl mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-brand-emerald" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Bajar Admin</h1>
          <p className="text-gray-400">Please sign in with your authorized admin account to access the dashboard.</p>
          
          {authError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl text-sm">
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-brand-emerald hover:bg-emerald-600 text-bg-deep font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
          >
            <LogIn size={20} />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
        <div className="max-w-md w-full glass p-6 md:p-8 rounded-3xl text-center space-y-4 mx-auto">
          <ShieldCheck className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-400">Your account ({user.email}) is not authorized for admin access.</p>
          <button 
            onClick={() => logout()}
            className="text-brand-emerald hover:underline font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      <AdminLayout currentView={currentView} setView={setCurrentView}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-auto h-full"
          >
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'prompts' && <PromptList />}
            {currentView === 'analytics' && <Analytics />}
            {currentView === 'categories' && <CategoryManager />}
          </motion.div>
        </AnimatePresence>
      </AdminLayout>
    </AuthContext.Provider>
  );
}
