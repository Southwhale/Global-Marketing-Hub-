import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Target, TrendingUp, DollarSign, 
  Users, Calendar, Activity, Zap, Sparkles, 
  BarChart2, Megaphone, CheckCircle2,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  FileText, Plus, Search, Filter, X, Edit2, AlertTriangle,
  MessageSquare, Send, Trash2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { useStore } from '../store';
import { cn } from '../lib/utils';

const InlineEdit = ({ value, onChange, className, type = "text", placeholder = "", min }: { value: string | number, onChange: (val: string) => void, className?: string, type?: string, placeholder?: string, min?: number }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [val, setVal] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setVal(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (val !== value) {
      if (type === "number" && min !== undefined && Number(val) < min) {
        setVal(value);
        return;
      }
      onChange(val.toString());
    }
  };

  return isEditing ? (
    <input
      ref={inputRef}
      type={type}
      value={val}
      min={min}
      onChange={e => setVal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={e => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
          setVal(value);
          setIsEditing(false);
        }
      }}
      onClick={e => e.stopPropagation()}
      className={cn("border border-emerald-500 rounded px-1.5 py-0.5 outline-none bg-white text-slate-900", className)}
    />
  ) : (
    <span 
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
      className={cn("cursor-pointer hover:bg-slate-100 rounded px-1.5 py-0.5 transition-colors border border-transparent hover:border-slate-200 group relative", className)}
    >
      {value || placeholder}
      <Edit2 className="w-3 h-3 absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400" />
    </span>
  );
};

export const KpiDetails: React.FC = () => {
  const { 
    selectedKpiId, 
    setSelectedKpiId, 
    setSelectedCampaignId,
    setActiveScreen, 
    kpis,
    campaigns,
    tasks,
    teamMembers,
    setSelectedTaskId,
    addTask,
    updateKpi,
    updateTask,
    currentProjectId
  } = useStore();

  const [isEditing, setIsEditing] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [filterOwner, setFilterOwner] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editData, setEditData] = React.useState({ 
    name: '', 
    statement: '', 
    pillar: '',
    theme: '',
    unit: '',
    campaigns: [] as string[],
    owners: [] as string[],
    defaultBudget: 0,
    regionalCost: {} as Record<string, number>
  });

  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string, type: 'task' | 'campaign' } | null>(null);
  const [taskColumnWidths, setTaskColumnWidths] = React.useState<Record<string, number>>({
    name: 200,
    campaign: 150,
    kpi: 150,
    status: 100,
    priority: 100,
    owner: 120,
    budget: 100,
    spent: 100,
    dueDate: 130,
    progress: 120,
    comments: 100,
    action: 80
  });

  const [expandedTaskId, setExpandedTaskId] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState<Record<string, string>>({});

  const renderCommentText = (text: string, taskId: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            onClick={() => {
              const currentText = commentText[taskId] || '';
              const newText = currentText ? `${currentText.trim()} ${part} ` : `${part} `;
              setCommentText(prev => ({ ...prev, [taskId]: newText }));
            }}
            className="text-emerald-600 font-bold cursor-pointer hover:underline"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const [campaignColumnWidths, setCampaignColumnWidths] = React.useState<Record<string, number>>({
    name: 250,
    action: 100
  });

  const [taskRowHeight, setTaskRowHeight] = React.useState(64);
  const [campaignRowHeight, setCampaignRowHeight] = React.useState(56);

  const handleTaskResize = (column: string, width: number) => {
    setTaskColumnWidths(prev => ({ ...prev, [column]: Math.max(60, width) }));
  };

  const handleCampaignResize = (column: string, width: number) => {
    setCampaignColumnWidths(prev => ({ ...prev, [column]: Math.max(60, width) }));
  };

  const handleRowResize = (type: 'task' | 'campaign', e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.pageY;
    const startHeight = type === 'task' ? taskRowHeight : campaignRowHeight;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newHeight = Math.max(40, startHeight + (moveEvent.pageY - startY));
      if (type === 'task') setTaskRowHeight(newHeight);
      else setCampaignRowHeight(newHeight);
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleDeleteTask = (id: string) => {
    setDeleteConfirm({ id, type: 'task' });
  };

  const handleUnlinkCampaign = (id: string) => {
    setDeleteConfirm({ id, type: 'campaign' });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      if (deleteConfirm.type === 'task') {
        const { deleteTask } = useStore.getState();
        deleteTask(deleteConfirm.id);
      } else {
        const { updateKpi } = useStore.getState();
        if (kpi) {
          updateKpi(kpi.id, { campaigns: kpi.campaigns.filter(id => id !== deleteConfirm.id) });
        }
      }
      setDeleteConfirm(null);
    }
  };

  const kpi = kpis.find(k => k.id === selectedKpiId);

  React.useEffect(() => {
    if (kpi) {
      setEditData({ 
        name: kpi.name, 
        statement: kpi.statement, 
        pillar: kpi.pillar || '',
        theme: kpi.theme || '',
        unit: kpi.unit || '',
        campaigns: kpi.campaigns,
        owners: kpi.owners || [],
        defaultBudget: kpi.defaultBudget || 0,
        regionalCost: kpi.regionalCost || {}
      });
    }
  }, [kpi]);

  if (!kpi) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">KPI Not Found</h2>
          <p className="text-slate-500 mb-6">The KPI you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => setActiveScreen('kpi')}
            className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Back to KPI Tracker
          </button>
        </div>
      </div>
    );
  }

  const handleEditKpi = () => {
    if (isEditing) {
      updateKpi(kpi.id, { 
        name: editData.name, 
        statement: editData.statement,
        pillar: editData.pillar,
        theme: editData.theme,
        unit: editData.unit,
        campaigns: editData.campaigns,
        owners: editData.owners,
        defaultBudget: editData.defaultBudget,
        regionalCost: editData.regionalCost
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleUpdatePerformance = () => {
    const newVal = Math.floor(Math.random() * 20) + 80;
    const newPerformance = [...(kpi.historicalPerformance || [0, 0, 0, 0])];
    newPerformance[newPerformance.length - 1] = newVal;
    updateKpi(kpi.id, { historicalPerformance: newPerformance });
  };

  const handleAddTask = () => {
    const campaignId = kpi.campaigns[0] || 'c1';
    const newTask: any = {
      id: `task-${Date.now()}`,
      campaignId,
      kpiId: kpi.id,
      name: 'New Strategic Task',
      owner: teamMembers[0]?.name || 'Unassigned',
      status: 'todo',
      priority: 'medium',
      budget: 1000,
      spent: 0,
      regionCosts: {},
      schedules: [],
      comments: [],
      description: ''
    };
    addTask(newTask);
    setSelectedTaskId(newTask.id);
  };

  const kpiCampaigns = campaigns.filter(c => kpi.campaigns.includes(c.id));
  const kpiTasks = tasks.filter(t => {
    const matchesKpi = t.kpiId === kpi.id;
    const query = searchQuery.toLowerCase();
    const matchesName = t.name.toLowerCase().includes(query);
    const matchesDescription = t.description?.toLowerCase().includes(query) || false;
    const matchesComments = t.comments?.some(c => c.text.toLowerCase().includes(query)) || false;
    const matchesSchedules = t.schedules?.some(s => s.description?.toLowerCase().includes(query)) || false;
    const matchesSearch = matchesName || matchesDescription || matchesComments || matchesSchedules;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesOwner = filterOwner === 'all' || t.owner === filterOwner;
    return matchesKpi && matchesSearch && matchesStatus && matchesOwner;
  });

  const totalBudget = kpiTasks.reduce((sum, t) => sum + t.budget, 0);
  const totalSpent = kpiTasks.reduce((sum, t) => sum + t.spent, 0);
  const budgetExecution = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const performanceData = kpi.historicalPerformance?.map((v, i) => ({
    name: `Q${i + 1}`,
    actual: v,
    target: Object.values(kpi.targets)[i] || 0
  })) || [];

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveScreen('kpi')}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input 
                      value={editData.name}
                      onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="text-xl font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  ) : (
                    <h1 className="text-xl font-bold text-slate-900">{kpi.name}</h1>
                  )}
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {kpi.id}
                  </span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      list="pillars-list"
                      value={editData.pillar}
                      onChange={e => setEditData(prev => ({ ...prev, pillar: e.target.value }))}
                      className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Pillar"
                    />
                    <datalist id="pillars-list">
                      {Array.from(new Set(kpis.map(k => k.pillar))).map(p => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                    <span className="text-slate-300">•</span>
                    <input 
                      list="themes-list"
                      value={editData.theme}
                      onChange={e => setEditData(prev => ({ ...prev, theme: e.target.value }))}
                      className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Theme"
                    />
                    <datalist id="themes-list">
                      {Array.from(new Set(kpis.map(k => k.theme))).map(t => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                    <span className="text-slate-300">•</span>
                    <input 
                      value={editData.unit}
                      onChange={e => setEditData(prev => ({ ...prev, unit: e.target.value }))}
                      className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Unit"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{kpi.pillar} • {kpi.theme} • {kpi.unit}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleEditKpi}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-xl transition-colors border",
                isEditing 
                  ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              {isEditing ? 'Save KPI' : 'Edit KPI'}
            </button>
            <button 
              onClick={handleUpdatePerformance}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              Update Performance
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Statement & Owners */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">KPI Statement</h3>
            {isEditing ? (
              <textarea 
                value={editData.statement}
                onChange={e => setEditData(prev => ({ ...prev, statement: e.target.value }))}
                className="w-full text-lg text-slate-700 leading-relaxed italic bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[100px]"
              />
            ) : (
              <p className="text-lg text-slate-700 leading-relaxed italic">"{kpi.statement}"</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Owners</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {editData.owners.map(owner => (
                    <div key={owner} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                      <span className="text-xs font-bold text-emerald-700">{owner}</span>
                      <button 
                        onClick={() => setEditData(prev => ({
                          ...prev,
                          owners: prev.owners.filter(o => o !== owner)
                        }))}
                        className="text-emerald-400 hover:text-emerald-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <select 
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  onChange={(e) => {
                    const name = e.target.value;
                    if (name && !editData.owners.includes(name)) {
                      setEditData(prev => ({
                        ...prev,
                        owners: [...prev.owners, name]
                      }));
                    }
                    e.target.value = "";
                  }}
                  value=""
                >
                  <option value="" disabled>Add an owner...</option>
                  {teamMembers
                    .filter(tm => !editData.owners.includes(tm.name))
                    .map(tm => (
                      <option key={tm.id} value={tm.name}>{tm.name} ({tm.role})</option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {kpi.owners.map(owner => {
                  const member = teamMembers.find(tm => tm.name === owner);
                  return (
                    <div key={owner} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                      {member?.avatar ? (
                        <img 
                          src={member.avatar} 
                          alt={owner} 
                          className="w-6 h-6 rounded-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {owner.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-bold text-slate-700">{owner}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Strategic Categorization */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Strategic Categorization</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit</label>
              {isEditing ? (
                <input 
                  value={editData.unit}
                  onChange={e => setEditData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g., %, $, count"
                />
              ) : (
                <p className="text-sm font-bold text-slate-700">{kpi.unit || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pillar</label>
              {isEditing ? (
                <input 
                  list="pillars-list"
                  value={editData.pillar}
                  onChange={e => setEditData(prev => ({ ...prev, pillar: e.target.value }))}
                  className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Strategic Pillar"
                />
              ) : (
                <p className="text-sm font-bold text-slate-700">{kpi.pillar || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Theme</label>
              {isEditing ? (
                <input 
                  list="themes-list"
                  value={editData.theme}
                  onChange={e => setEditData(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Strategic Theme"
                />
              ) : (
                <p className="text-sm font-bold text-slate-700">{kpi.theme || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Performance Trend
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-slate-500">Actual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-slate-200 rounded-full" />
                  <span className="text-slate-500">Target</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                  <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Budget Tracking</h3>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">KPI Total:</span>
                    <input 
                      type="number"
                      value={editData.defaultBudget}
                      onChange={e => setEditData(prev => ({ ...prev, defaultBudget: Number(e.target.value) }))}
                      className="w-24 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* KPI Total Budget */}
                <div>
                  <div className="flex items-end justify-between mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">KPI Total Budget</p>
                    <p className="text-sm font-bold text-slate-900">${(kpi.defaultBudget || 0).toLocaleString()}</p>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 w-full" />
                  </div>
                </div>

                {/* Planned (Sum of Task Budgets) */}
                <div>
                  <div className="flex items-end justify-between mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Planned (Tasks)</p>
                    <p className="text-sm font-bold text-slate-900">${totalBudget.toLocaleString()}</p>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (totalBudget / (kpi.defaultBudget || 1)) * 100)}%` }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {((totalBudget / (kpi.defaultBudget || 1)) * 100).toFixed(1)}% of total budget
                  </p>
                </div>

                {/* Executed (Sum of Task Spent) */}
                <div>
                  <div className="flex items-end justify-between mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Executed (Spent)</p>
                    <p className="text-sm font-bold text-emerald-600">${totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (totalSpent / (kpi.defaultBudget || 1)) * 100)}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {((totalSpent / (kpi.defaultBudget || 1)) * 100).toFixed(1)}% of total budget
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Linked Campaigns</h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {editData.campaigns.map(id => {
                      const camp = campaigns.find(c => c.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                          <span className="text-xs font-bold text-emerald-700">{camp?.name || id}</span>
                          <button 
                            onClick={() => setEditData(prev => ({
                              ...prev,
                              campaigns: prev.campaigns.filter(cid => cid !== id)
                            }))}
                            className="text-emerald-400 hover:text-emerald-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <select 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id && !editData.campaigns.includes(id)) {
                        setEditData(prev => ({
                          ...prev,
                          campaigns: [...prev.campaigns, id]
                        }));
                      }
                      e.target.value = "";
                    }}
                    value=""
                  >
                    <option value="" disabled>Link a campaign...</option>
                    {campaigns
                      .filter(c => !editData.campaigns.includes(c.id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-slate-100 relative group/row-resize">
                        <th style={{ width: campaignColumnWidths.name }} className="pb-2 text-[10px] font-bold text-slate-400 uppercase relative group/resize">
                          Campaign Name
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                            onMouseDown={(e) => {
                              const startX = e.pageX;
                              const startWidth = campaignColumnWidths.name;
                              const onMouseMove = (moveEvent: MouseEvent) => handleCampaignResize('name', startWidth + (moveEvent.pageX - startX));
                              const onMouseUp = () => {
                                document.removeEventListener('mousemove', onMouseMove);
                                document.removeEventListener('mouseup', onMouseUp);
                              };
                              document.addEventListener('mousemove', onMouseMove);
                              document.addEventListener('mouseup', onMouseUp);
                            }}
                          />
                          <div 
                            className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-emerald-500/30 transition-colors opacity-0 group-hover/row-resize:opacity-100"
                            onMouseDown={(e) => handleRowResize('campaign', e)}
                          />
                        </th>
                        <th style={{ width: campaignColumnWidths.action }} className="pb-2 text-[10px] font-bold text-slate-400 uppercase text-right relative group/resize">
                          Action
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                            onMouseDown={(e) => {
                              const startX = e.pageX;
                              const startWidth = campaignColumnWidths.action;
                              const onMouseMove = (moveEvent: MouseEvent) => handleCampaignResize('action', startWidth + (moveEvent.pageX - startX));
                              const onMouseUp = () => {
                                document.removeEventListener('mousemove', onMouseMove);
                                document.removeEventListener('mouseup', onMouseUp);
                              };
                              document.addEventListener('mousemove', onMouseMove);
                              document.addEventListener('mouseup', onMouseUp);
                            }}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {kpiCampaigns.map(campaign => (
                        <tr key={campaign.id} style={{ height: campaignRowHeight }} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-3">
                            <button 
                              onClick={() => {
                                setSelectedCampaignId(campaign.id);
                                setActiveScreen('campaign-details');
                              }}
                              className="flex items-center gap-3 truncate hover:text-emerald-600 transition-colors group/camp"
                            >
                              <Megaphone className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-sm font-bold text-slate-700 truncate group-hover/camp:text-emerald-600">{campaign.name}</span>
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleUnlinkCampaign(campaign.id)}
                                className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                title="Unlink Campaign"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Regional Cost Breakdown</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Regional:</span>
                  <span className="text-sm font-bold text-emerald-600">
                    ${Object.values(isEditing ? editData.regionalCost : (kpi.regionalCost || {})).reduce((a, b) => a + (b || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {['ASIA', 'MENA', 'EU', 'CIS', 'LATAM', 'NA', 'OCEANIA', 'RUS', 'GLOBAL', 'KOREA', 'VINA'].map((region) => (
                  <div key={region} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-600">{region}</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">$</span>
                        <input 
                          type="number"
                          value={editData.regionalCost[region] || 0}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setEditData(prev => ({
                              ...prev,
                              regionalCost: {
                                ...prev.regionalCost,
                                [region]: val
                              }
                            }));
                          }}
                          className="w-20 text-right text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-900">
                        ${(kpi.regionalCost?.[region as any] || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Historical Performance</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="actual" name="Actual" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="target" name="Target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#94a3b8' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tasks Section */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div>
              <h3 className="text-lg font-bold text-slate-900">KPI Detailed Tasks</h3>
              <p className="text-sm text-slate-500">All activities contributing to this KPI</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
                <select 
                  value={filterOwner}
                  onChange={e => setFilterOwner(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">All Owners</option>
                  {Array.from(new Set(tasks.filter(t => t.kpiId === kpi.id).map(t => t.owner))).map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleAddTask}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/50 relative group/row-resize">
                  <th style={{ width: taskColumnWidths.name }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Task Name
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.name;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('name', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                    <div 
                      className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-emerald-500/30 transition-colors opacity-0 group-hover/row-resize:opacity-100"
                      onMouseDown={(e) => handleRowResize('task', e)}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.campaign }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Campaign
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.campaign;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('campaign', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.kpi }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Linked KPI
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.kpi;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('kpi', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.status }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Status
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.status;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('status', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.priority }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Priority
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.priority;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('priority', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.owner }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Owner
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.owner;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('owner', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.budget }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Budget
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.budget;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('budget', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.spent }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Spent
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.spent;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('spent', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.dueDate }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Due Date
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.dueDate;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('dueDate', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.progress }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Progress
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.progress;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('progress', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.comments }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                    Comments
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.comments;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('comments', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                  <th style={{ width: taskColumnWidths.action }} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                    Action
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                      onMouseDown={(e) => {
                        const startX = e.pageX;
                        const startWidth = taskColumnWidths.action;
                        const onMouseMove = (moveEvent: MouseEvent) => handleTaskResize('action', startWidth + (moveEvent.pageX - startX));
                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      }}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpiTasks.map(task => {
                  const campaign = campaigns.find(c => c.id === task.campaignId);
                  const execution = task.budget > 0 ? (task.spent / task.budget) * 100 : 0;
                  
                  return (
                    <React.Fragment key={task.id}>
                      <tr style={{ height: taskRowHeight }} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-700 text-sm truncate">{task.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={task.campaignId}
                          onChange={(e) => updateTask(task.id, { campaignId: e.target.value })}
                          className="w-full text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md border-none outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer truncate"
                        >
                          {campaigns.filter(c => c.projectId === currentProjectId).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={task.kpiId || ''}
                          onChange={(e) => updateTask(task.id, { kpiId: e.target.value })}
                          className="w-full text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border-none outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer truncate"
                        >
                          {kpis.map(k => (
                            <option key={k.id} value={k.id}>{k.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            task.status === 'completed' ? "bg-emerald-500" :
                            task.status === 'in-progress' ? "bg-blue-500" :
                            task.status === 'delayed' ? "bg-rose-500" :
                            "bg-slate-400"
                          )} />
                          <select 
                            value={task.status}
                            onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                            className={cn(
                              "text-[10px] font-bold uppercase px-2 py-1 rounded-full border-none outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer truncate",
                              task.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                              task.status === 'in-progress' ? "bg-blue-100 text-blue-700" :
                              task.status === 'delayed' ? "bg-rose-100 text-rose-700" :
                              "bg-slate-100 text-slate-600"
                            )}
                          >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="delayed">Delayed</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {task.priority === 'high' && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                          <select 
                            value={task.priority || 'medium'}
                            onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
                            className={cn(
                              "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border-none outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm transition-all hover:scale-105",
                              task.priority === 'high' ? "bg-rose-500 text-white" :
                              task.priority === 'medium' ? "bg-amber-500 text-white" :
                              "bg-blue-500 text-white"
                            )}
                          >
                            <option value="low" className="bg-white text-slate-900">Low</option>
                            <option value="medium" className="bg-white text-slate-900">Medium</option>
                            <option value="high" className="bg-white text-slate-900">High</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                            {task.owner.charAt(0)}
                          </div>
                          <span className="text-xs text-slate-600 truncate">{task.owner}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group/input min-w-[100px]">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="number"
                            value={task.budget}
                            min={0}
                            onChange={(e) => updateTask(task.id, { budget: Number(e.target.value) })}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group/input min-w-[100px]">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="number"
                            value={task.spent}
                            min={0}
                            onChange={(e) => updateTask(task.id, { spent: Number(e.target.value) })}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group/input min-w-[120px]">
                          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="date"
                            value={task.dueDate || ''}
                            onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400">{execution.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${execution}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all",
                            expandedTaskId === task.id 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          )}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-[10px] font-bold">{(task.comments || []).length}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedTaskId(task.id)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                            title="View Task Details"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Task"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedTaskId === task.id && (
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <td colSpan={11} className="px-6 py-4">
                          <div className="max-w-3xl mx-auto">
                            <div className="flex items-center gap-2 mb-4">
                              <MessageSquare className="w-4 h-4 text-emerald-600" />
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Task Comments</h4>
                            </div>
                            
                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                              {(task.comments || []).length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-4 text-center">No comments yet. Start the conversation!</p>
                              ) : (
                                (task.comments || []).map(comment => (
                                  <div key={comment.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm group/comment">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                                          {comment.author.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-700">{comment.author}</span>
                                        <span className="text-[9px] text-slate-400">{new Date(comment.timestamp).toLocaleString()}</span>
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const updatedComments = (task.comments || []).filter(c => c.id !== comment.id);
                                          updateTask(task.id, { comments: updatedComments });
                                        }}
                                        className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/comment:opacity-100 transition-all"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{renderCommentText(comment.text, task.id)}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <textarea
                                  value={commentText[task.id] || ''}
                                  onChange={(e) => setCommentText(prev => ({ ...prev, [task.id]: e.target.value }))}
                                  placeholder="Write a comment..."
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none min-h-[60px]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      const text = commentText[task.id];
                                      if (!text?.trim()) return;
                                      
                                      const newComment = {
                                        id: `comment-${Date.now()}`,
                                        author: 'Current User', // Mock user
                                        text: text.trim(),
                                        timestamp: new Date().toISOString()
                                      };
                                      
                                      updateTask(task.id, { 
                                        comments: [...(task.comments || []), newComment] 
                                      });
                                      setCommentText(prev => ({ ...prev, [task.id]: '' }));
                                    }
                                  }}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const text = commentText[task.id];
                                  if (!text?.trim()) return;
                                  
                                  const newComment = {
                                    id: `comment-${Date.now()}`,
                                    author: 'Current User', // Mock user
                                    text: text.trim(),
                                    timestamp: new Date().toISOString()
                                  };
                                  
                                  updateTask(task.id, { 
                                    comments: [...(task.comments || []), newComment] 
                                  });
                                  setCommentText(prev => ({ ...prev, [task.id]: '' }));
                                }}
                                disabled={!commentText[task.id]?.trim()}
                                className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
                {kpiTasks.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-slate-200" />
                        <p className="text-sm font-bold text-slate-400 italic">No tasks found for this KPI.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={deleteConfirm?.type === 'task' ? "Delete Task" : "Unlink Campaign"}
        message={deleteConfirm?.type === 'task' 
          ? "Are you sure you want to delete this task? This action cannot be undone." 
          : "Are you sure you want to unlink this campaign from this KPI? The campaign itself will not be deleted."}
      />
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="p-6 bg-slate-50 flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
