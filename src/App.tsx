import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, LogIn, Mail, Chrome, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Team } from './components/Team';
import { KpiTracker } from './components/KpiTracker';
import { PerformanceTracker } from './components/PerformanceTracker';
import { CRM } from './components/CRM';
import { CampaignDetails } from './components/CampaignDetails';
import { KpiDetails } from './components/KpiDetails';
import { Support } from './components/Support';
import { NotificationDrawer } from './components/NotificationDrawer';
import { TaskModal } from './components/TaskModal';
import { WelcomeModal } from './components/WelcomeModal';
import { Screen } from './types';
import { useStore } from './store';

const Login = () => {
  const { login, loginWithEmail, signUpWithEmail } = useStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUpWithEmail(email, password, displayName);
    } else {
      await loginWithEmail(email, password);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
            <LogIn className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 text-center text-sm">
            {isSignUp ? 'Join our platform to manage your marketing hub' : 'Access your team dashboard and real-time analytics'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {isSignUp && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-slate-500 font-bold tracking-widest">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={() => login('google')}
          className="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98]"
        >
          <Chrome className="w-5 h-5 text-blue-600" />
          Google
        </button>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-500 leading-relaxed">
          By continuing, you agree to our <span className="text-emerald-400 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-emerald-400 hover:underline cursor-pointer">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
};

export default function App() {
  const { 
    activeScreen, 
    setActiveScreen, 
    selectedTaskId, 
    setSelectedTaskId, 
    tasks, 
    notifications,
    user,
    isAuthReady,
    initializeAuth,
    setCurrentProjectId,
    fetchProjectById,
    joinProjectByToken,
    theme
  } = useStore();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    
    if (inviteToken && isAuthReady && user) {
      const join = async () => {
        setIsJoining(true);
        try {
          await joinProjectByToken(inviteToken);
          // Clear the URL parameter after successful join
          window.history.replaceState({}, document.title, "/");
        } catch (error: any) {
          setJoinError(error.message || 'Failed to join project');
        } finally {
          setIsJoining(false);
        }
      };
      join();
    }
  }, [isAuthReady, user, joinProjectByToken]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Check for shared mode
  const params = new URLSearchParams(window.location.search);
  const isShared = params.get('shared') === 'true';
  const sharedProjectId = params.get('projectId');

  useEffect(() => {
    if (isShared && sharedProjectId) {
      fetchProjectById(sharedProjectId);
    }
  }, [isShared, sharedProjectId, fetchProjectById]);

  const handleScreenChange = (screen: Screen) => {
    if (screen === 'alerts') {
      setIsNotifOpen(true);
    } else {
      setActiveScreen(screen as Screen);
    }
  };

  const renderScreen = () => {
    if (isShared) {
      return <Dashboard isShared={true} />;
    }

    switch (activeScreen as Screen) {
      case 'dashboard':
        return <Dashboard />;
      case 'kpi':
        return <KpiTracker />;
      case 'performance':
        return <PerformanceTracker />;
      case 'settings':
        return <Settings />;
      case 'team':
        return <Team />;
      case 'crm':
        return <CRM />;
      case 'campaign-details':
        return <CampaignDetails />;
      case 'kpi-details':
        return <KpiDetails />;
      case 'support':
        return <Support />;
      default:
        return <Dashboard />;
    }
  };

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  if (isJoining) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Joining Team...</h2>
        <p className="text-slate-400">Please wait while we set up your access.</p>
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/20 rounded-3xl flex items-center justify-center mb-6">
          <Lock className="text-rose-500 w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Invitation Error</h2>
        <p className="text-slate-400 mb-8 max-w-md">{joinError}</p>
        <button 
          onClick={() => {
            setJoinError(null);
            window.history.replaceState({}, document.title, "/");
          }}
          className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !isShared) {
    return <Login />;
  }

  if (isShared) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased overflow-hidden flex flex-col">
        <main className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
          <Dashboard isShared={true} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased overflow-hidden">
      <Sidebar activeScreen={activeScreen} onScreenChange={handleScreenChange} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      
      <WelcomeModal />
      
      {selectedTaskId && selectedTask && (
        <TaskModal 
          task={selectedTask} 
          onClose={() => setSelectedTaskId(null)} 
        />
      )}
    </div>
  );
}
