import React, { useState } from 'react';
import { LayoutDashboard, Megaphone, BarChart3, Settings, Users, Bell, HelpCircle, LogOut, Building2, Target, Database, ChevronDown, Plus, ShieldCheck, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Screen, Project } from '../types';
import { useStore } from '../store';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onScreenChange }) => {
  const { 
    projects, 
    currentProjectId, 
    setCurrentProjectId, 
    invitations, 
    acceptInvitation,
    user,
    logout,
    createProject
  } = useStore();
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  // Check if user is owner of current project
  const isOwner = currentProject?.ownerId === user?.uid; 

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kpi', label: 'KPI & Strategy', icon: Target },
    { id: 'performance', label: 'Performance Input', icon: BarChart3 },
    { id: 'crm', label: 'CRM & Customers', icon: Database },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'settings', label: 'Project Settings', icon: Settings },
  ];

  const bottomItems = [
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await createProject(newProjectName, 'New team project');
    setNewProjectName('');
    setIsCreatingProject(false);
  };

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm z-20">
      {/* Brand & Project Selector */}
      <div className="p-6 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
            <Megaphone className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">MarketingHub</span>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsProjectListOpen(!isProjectListOpen)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-1">Current Team</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{currentProject?.name || 'No Project'}</p>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isProjectListOpen && "rotate-180")} />
          </button>

          {isProjectListOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-60 overflow-y-auto space-y-1">
                {projects.map((p) => {
                  const isProjectOwner = p.ownerId === user?.uid;
                  return (
                    <div key={p.id} className="group/item relative">
                      <button
                        onClick={() => {
                          setCurrentProjectId(p.id);
                          setIsProjectListOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left pr-16",
                          currentProjectId === p.id 
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          currentProjectId === p.id ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                        )} />
                        <span className="text-sm truncate">{p.name}</span>
                      </button>
                      
                      {isProjectOwner && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const newName = prompt('Enter new team name:', p.name);
                              if (newName && newName !== p.name) {
                                useStore.getState().updateProject(p.id, { name: newName });
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete "${p.name}"? This action cannot be undone.`)) {
                                useStore.getState().deleteProject(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {isCreatingProject ? (
                  <div className="p-2 space-y-2">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Team Name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-900 dark:text-slate-100"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleCreateProject}
                        className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg"
                      >
                        Create
                      </button>
                      <button 
                        onClick={() => setIsCreatingProject(false)}
                        className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsCreatingProject(true)}
                    className="w-full flex items-center gap-2 p-3 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all text-sm font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Team
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">Pending Invitations</p>
            {invitations.map(inv => (
              <div key={inv.id} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-100">{inv.teamName}</span>
                </div>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mb-2">Role: {inv.role}</p>
                <button 
                  onClick={() => acceptInvitation(inv.id)}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                >
                  Accept & Join
                </button>
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Project Owner</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <div className="px-4 mb-4">
          <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Main Menu</p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onScreenChange(item.id as Screen)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  activeScreen === item.id 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm shadow-emerald-100/50 dark:shadow-none" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors", 
                  activeScreen === item.id ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}`} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700"
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user.displayName || 'User'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">System</p>
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id as Screen)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all",
              activeScreen === item.id && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium"
            )}
          >
            <item.icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-4 group"
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-600" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
