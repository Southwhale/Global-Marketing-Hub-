import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Megaphone, Plus, ArrowRight, Building2, Users, Target } from 'lucide-react';
import { useStore } from '../store';

export const WelcomeModal: React.FC = () => {
  const { user, projects, invitations, createProject, acceptInvitation } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Only show if user is logged in and has no projects
  const showModal = user && projects.length === 0;

  if (!showModal) return null;

  const handleCreate = async () => {
    if (!projectName.trim()) return;
    setIsLoading(true);
    try {
      await createProject(projectName, 'My first marketing team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Side - Visual/Intro */}
            <div className="md:w-5/12 bg-emerald-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold leading-tight mb-4">Welcome to MarketingHub!</h2>
                <p className="text-emerald-50 text-sm leading-relaxed opacity-90">
                  Ready to supercharge your marketing performance? Let's get your first team set up.
                </p>
              </div>

              <div className="relative z-10 mt-8 space-y-4">
                <div className="flex items-center gap-3 text-xs font-medium bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <Target className="w-4 h-4" />
                  <span>Track KPIs & Strategy</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <Users className="w-4 h-4" />
                  <span>Collaborate with Team</span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-50" />
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-400 rounded-full blur-2xl opacity-30" />
            </div>

            {/* Right Side - Actions */}
            <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
              {invitations.length > 0 ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">You have invitations!</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Someone has already invited you to join their team. You can accept it below or create your own.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {invitations.map(inv => (
                      <div key={inv.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{inv.teamName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Pending Invitation</p>
                          </div>
                        </div>
                        <button
                          onClick={() => acceptInvitation(inv.id)}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold tracking-widest">Or create new</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {!isCreating ? (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Start your journey</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      To begin using MarketingHub, you need to create a team project. This will be your workspace for all campaigns and KPIs.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full group flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-3xl transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">Create New Team</p>
                        <p className="text-xs text-slate-500">Set up your workspace in seconds</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Name your team</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Give your workspace a name. You can always change this later.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="e.g. Global Marketing Team"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsCreating(false)}
                        className="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={!projectName.trim() || isLoading}
                        className="flex-[2] py-4 px-6 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Create Team</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
