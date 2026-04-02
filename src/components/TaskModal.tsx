import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Calendar, Users, DollarSign, MessageSquare, Bell, MapPin, Paperclip, FileText, TrendingUp, AlertTriangle, CheckCircle2, Clock, AlertCircle, Circle, Activity } from 'lucide-react';
import { Task, Schedule, Comment, Region } from '../types';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { TagInput } from './TagInput';
import { TeamMemberSelect } from './TeamMemberSelect';
import { SingleMemberSelect } from './SingleMemberSelect';
import { RegionCustomerSelect } from './RegionCustomerSelect';

const STATUS_CONFIG = {
  todo: { label: 'To Do', icon: Circle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', accent: 'bg-slate-500' },
  'in-progress': { label: 'In Progress', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', accent: 'bg-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500' },
  delayed: { label: 'Delayed', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', accent: 'bg-rose-500' },
};

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task: initialTask, onClose }) => {
  const { addTask, updateTask, kpis, regions } = useStore();
  const [task, setTask] = useState<Task>(initialTask);
  const [activeTab, setActiveTab] = useState<'details' | 'schedules' | 'comments'>('details');
  const [newComment, setNewComment] = useState('');

  const isNew = !task.id.startsWith('task-'); // Simple check if it's a new task, though we generated an ID in KpiTracker

  const handleKpiChange = (kpiId: string) => {
    const selectedKpi = kpis.find(k => k.id === kpiId);
    if (selectedKpi) {
      setTask({
        ...task,
        kpiId,
        budget: selectedKpi.defaultBudget || task.budget,
        targetRevenue: selectedKpi.defaultTargetRevenue || task.targetRevenue
      });
    } else {
      setTask({ ...task, kpiId: undefined });
    }
  };

  const handleSave = () => {
    const finalTask = { ...task, spent: calculatedSpent, roi: calculatedRoi };
    if (useStore.getState().tasks.some(t => t.id === task.id)) {
      updateTask(task.id, finalTask);
    } else {
      addTask(finalTask);
    }
    onClose();
  };

  const addSchedule = () => {
    const newSchedule: Schedule = {
      id: `sched-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      assignee: '',
      alarm: false,
      cost: 0,
      description: '',
      regionCosts: regions.reduce((acc, r) => ({ ...acc, [r]: 0 }), {})
    };
    setTask({ ...task, schedules: [...(task.schedules || []), newSchedule] });
  };

  const updateSchedule = (id: string, updates: Partial<Schedule>) => {
    setTask({
      ...task,
      schedules: (task.schedules || []).map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const updateScheduleRegionCost = (scheduleId: string, region: Region, cost: number) => {
    setTask({
      ...task,
      schedules: (task.schedules || []).map(s => {
        if (s.id === scheduleId) {
          return {
            ...s,
            regionCosts: { ...(s.regionCosts || {}), [region]: cost }
          };
        }
        return s;
      })
    });
  };

  const removeSchedule = (id: string) => {
    setTask({
      ...task,
      schedules: (task.schedules || []).filter(s => s.id !== id)
    });
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    
    const mentions = newComment.match(/@\w+/g) || [];
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      author: 'Current User', // Mock user
      text: newComment,
      timestamp: new Date().toISOString(),
      mentions: mentions
    };
    
    setTask({ ...task, comments: [...(task.comments || []), comment] });
    
    // Create notifications for mentions
    mentions.forEach(mention => {
      useStore.getState().addNotification({
        id: `notif-${Date.now()}-${Math.random()}`,
        taskId: task.id,
        message: `Current User mentioned you in "${task.name}"`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'mention'
      });
    });
    
    setNewComment('');
  };

  const updateRegionCost = (region: Region, cost: number) => {
    setTask({
      ...task,
      regionCosts: { ...(task.regionCosts || {}), [region]: cost } as Record<Region, number>
    });
  };

  const removeRegionCost = (region: Region) => {
    const newRegionCosts = { ...task.regionCosts };
    delete newRegionCosts[region];
    setTask({
      ...task,
      regionCosts: newRegionCosts as Record<Region, number>
    });
  };

  const safeSchedules = task.schedules || [];
  const safeComments = task.comments || [];
  const safeRegionCosts: Record<string, number> = task.regionCosts || {};

  const totalScheduleCost: number = safeSchedules.reduce((sum: number, s) => {
    const base = Number(s.cost) || 0;
    const reg = Object.values(s.regionCosts || {}).reduce((rSum: number, c) => rSum + (Number(c) || 0), 0);
    return sum + base + reg;
  }, 0);
  const totalRegionCost: number = Object.values(safeRegionCosts).reduce((sum: number, c: number) => sum + (Number(c) || 0), 0);
  const totalActualCost = (task.activityCost || 0) + (task.executionCost || 0) + totalRegionCost + totalScheduleCost;
  const calculatedSpent = totalActualCost;

  const calculatedRoi = calculatedSpent > 0 ? (((task.actualRevenue || 0) - calculatedSpent) / calculatedSpent) * 100 : 0;

  // Auto-save task when it changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const finalTask = { ...task, spent: calculatedSpent, roi: calculatedRoi };
      if (useStore.getState().tasks.some(t => t.id === task.id)) {
        updateTask(task.id, finalTask);
      }
    }, 1000); // Debounce save
    return () => clearTimeout(timer);
  }, [task, calculatedSpent, calculatedRoi]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{task.name === 'New Task' ? 'Create Task' : 'Edit Task'}</h2>
              <p className="text-sm text-slate-500 mt-1">Manage budget, schedules, and collaboration</p>
            </div>
            {(() => {
              const config = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.todo;
              const StatusIcon = config.icon;
              return (
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm border transition-all duration-300",
                  config.bg, config.color, config.border
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </div>
              );
            })()}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {[
            { id: 'details', label: 'Details & Budget', icon: DollarSign },
            { id: 'schedules', label: 'Schedules', icon: Calendar },
            { id: 'comments', label: 'Comments', icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-4 font-bold text-sm border-b-2 transition-colors",
                activeTab === tab.id 
                  ? "border-emerald-600 text-emerald-600" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'schedules' && safeSchedules.length > 0 && (
                <span className="ml-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{safeSchedules.length}</span>
              )}
              {tab.id === 'comments' && safeComments.length > 0 && (
                <span className="ml-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{safeComments.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={cn(
                "p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-all duration-500",
                STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG].bg,
                STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG].border
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                    STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG].accent,
                    "text-white"
                  )}>
                    {React.createElement(STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG].icon, { className: "w-6 h-6" })}
                  </div>
                  <div>
                    <h3 className={cn("text-sm font-black uppercase tracking-wider", STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG].color)}>
                      {STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG].label}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Task is currently {STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG].label.toLowerCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-2xl font-black",
                    STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG].color
                  )}>
                    {task.status === 'completed' ? '100%' : task.status === 'in-progress' ? '50%' : task.status === 'delayed' ? '50%' : '0%'}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion</p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Visual Timeline</h3>
                  <div className="flex gap-1">
                    {['todo', 'in-progress', 'completed'].map((s) => (
                      <div 
                        key={s}
                        className={cn(
                          "w-8 h-1.5 rounded-full transition-all duration-500",
                          (task.status === 'completed' || (task.status === 'in-progress' && s !== 'completed') || (task.status === 'todo' && s === 'todo'))
                            ? STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG].accent
                            : "bg-slate-100"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500 ease-out rounded-full",
                      task.status === 'completed' ? "bg-emerald-500 w-full" :
                      task.status === 'in-progress' ? "bg-blue-500 w-1/2" :
                      task.status === 'delayed' ? "bg-rose-500 w-1/2" :
                      "bg-slate-300 w-0"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Associated KPI</label>
                  <select
                    value={task.kpiId || ''}
                    onChange={e => handleKpiChange(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="">No KPI Associated</option>
                    {kpis.map(kpi => (
                      <option key={kpi.id} value={kpi.id}>
                        {kpi.id}: {kpi.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Task Name</label>
                  <input 
                    type="text" 
                    value={task.name}
                    onChange={e => setTask({...task, name: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Task Description</label>
                  <textarea 
                    value={task.description || ''}
                    onChange={e => setTask({...task, description: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[80px]"
                    placeholder="Enter task description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Task Owner</label>
                  <SingleMemberSelect
                    value={task.owner || ''}
                    onChange={(name) => setTask({ ...task, owner: name })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <label className="block text-sm font-bold text-slate-700">Status</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG['todo']][]).map(([key, config]) => {
                        const StatusIcon = config.icon;
                        const isSelected = task.status === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setTask({ ...task, status: key })}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                              isSelected 
                                ? cn(config.bg, config.color, config.border, "shadow-sm scale-[1.02]")
                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                            )}
                          >
                            <StatusIcon className={cn("w-3.5 h-3.5", isSelected ? config.color : "text-slate-300")} />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-bold text-slate-700">Priority</label>
                      {task.priority === 'high' && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                    </div>
                    <select
                      value={task.priority || 'medium'}
                      onChange={e => setTask({...task, priority: e.target.value as any})}
                      className={cn(
                        "w-full px-4 py-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer font-bold uppercase text-xs",
                        task.priority === 'high' ? "bg-rose-100 text-rose-700" :
                        task.priority === 'medium' ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      )}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Cost Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Regional Cost</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">${totalRegionCost.toLocaleString()}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Activity Cost</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="number" 
                          value={task.activityCost || ''}
                          onChange={e => setTask({...task, activityCost: Number(e.target.value)})}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Execution Cost</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="number" 
                          value={task.executionCost || ''}
                          onChange={e => setTask({...task, executionCost: Number(e.target.value)})}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Revenue & ROI
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Actual Revenue</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="number" 
                          value={task.actualRevenue || ''}
                          onChange={e => setTask({...task, actualRevenue: Number(e.target.value)})}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Total Actual Cost</span>
                        <span className="text-sm font-bold text-slate-900">${calculatedSpent.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">Actual ROI</span>
                        <span className={cn("text-lg font-black", calculatedRoi >= 0 ? "text-emerald-600" : "text-red-500")}>
                          {calculatedRoi.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Total Budget</label>
                  <div className="relative flex items-center gap-2">
                    <select 
                      value={task.currency || 'USD'} 
                      onChange={e => setTask({...task, currency: e.target.value})}
                      className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-slate-700"
                    >
                      <option value="USD">USD</option>
                      <option value="KRW">KRW</option>
                      <option value="EUR">EUR</option>
                      <option value="JPY">JPY</option>
                    </select>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="number" 
                        value={task.budget}
                        onChange={e => setTask({...task, budget: Number(e.target.value)})}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-lg"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                  <label className="block text-sm font-bold text-emerald-700 mb-2">Calculated Spent</label>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-emerald-600">{task.currency === 'KRW' ? '₩' : task.currency === 'EUR' ? '€' : task.currency === 'JPY' ? '¥' : '$'}{calculatedSpent.toLocaleString()}</span>
                    <span className="text-sm font-medium text-emerald-600/70">/ {task.budget.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-emerald-600/70 mt-1">Sum of schedules, regional & task costs</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="date" 
                      value={task.dueDate || ''}
                      onChange={e => setTask({...task, dueDate: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
                <RegionCustomerSelect
                  selectedRegions={task.regions || []}
                  selectedCustomers={task.customers || []}
                  onChange={(regions, customers) => setTask({ ...task, regions: regions as Region[], customers })}
                />
                <TeamMemberSelect
                  label="Collaborators"
                  selectedIds={task.collaborators || []}
                  onChange={(ids) => setTask({ ...task, collaborators: ids })}
                  placeholder="Select collaborators..."
                />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Regional Cost Settings
                  </h3>
                  <button
                    onClick={() => {
                      const region = prompt(`Enter region name (${regions.join(', ')}):`);
                      if (region && regions.includes(region as Region) && !safeRegionCosts[region as Region]) {
                        updateRegionCost(region as Region, 0);
                      }
                    }}
                    className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Region
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(safeRegionCosts).length === 0 && (
                    <div className="col-span-2 text-center py-4 text-sm text-slate-500">
                      No regional costs added yet.
                    </div>
                  )}
                  {Object.keys(safeRegionCosts).map(region => (
                    <div key={region} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-700">{region}</span>
                      <div className="flex items-center gap-2">
                        <div className="relative w-32">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input 
                            type="number" 
                            value={safeRegionCosts[region as Region] || ''}
                            onChange={e => updateRegionCost(region as Region, Number(e.target.value))}
                            placeholder="0"
                            className="w-full pl-6 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-right font-medium"
                          />
                        </div>
                        <button
                          onClick={() => removeRegionCost(region as Region)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {Object.keys(safeRegionCosts).length > 0 && (
                    <div className="col-span-2 mt-2 pt-4 border-t border-slate-100 flex justify-between items-center px-2">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Regional Cost</span>
                      <span className="text-lg font-black text-emerald-600">${totalRegionCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    Attachments
                  </h3>
                  <button 
                    onClick={() => {
                      const name = prompt('Enter file name:');
                      if (name) {
                        const newAttachment = {
                          id: Date.now().toString(),
                          name,
                          url: '#',
                          type: 'document',
                          size: 1200000,
                          uploadedAt: new Date().toISOString()
                        };
                        setTask({...task, attachments: [...(task.attachments || []), newAttachment]});
                      }
                    }}
                    className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Add File
                  </button>
                </div>
                
                {(!task.attachments || task.attachments.length === 0) ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm text-slate-500 font-medium">No attachments yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {task.attachments.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                            <p className="text-xs text-slate-400">{file.size}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setTask({...task, attachments: task.attachments?.filter(a => a.id !== file.id)})}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedules' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button 
                  onClick={addSchedule}
                  className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Schedule
                </button>
              </div>

              {safeSchedules.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No schedules added yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safeSchedules.map((schedule, index) => {
                    const baseCost = Number(schedule.cost) || 0;
                    const regionalCost = Object.values(schedule.regionCosts || {}).reduce((sum, c) => sum + (Number(c) || 0), 0);
                    const totalCost = baseCost + regionalCost;

                    return (
                    <div key={schedule.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group">
                      <button 
                        onClick={() => removeSchedule(schedule.id)}
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          Schedule {index + 1}
                        </h4>
                        <div className="flex items-center gap-4 mr-8">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Base Cost</p>
                            <p className="text-sm font-medium text-slate-700">${baseCost.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Regional Costs</p>
                            <p className="text-sm font-medium text-slate-700">${regionalCost.toLocaleString()}</p>
                          </div>
                          <div className="text-right pl-4 border-l border-slate-200">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Cost</p>
                            <p className="text-base font-black text-emerald-600">${totalCost.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                          <input 
                            type="date" 
                            value={schedule.date}
                            onChange={e => updateSchedule(schedule.id, { date: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Assignee</label>
                          <div className="relative">
                            <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Name"
                              value={schedule.assignee}
                              onChange={e => updateSchedule(schedule.id, { assignee: e.target.value })}
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            />
                          </div>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Base Cost</label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="number" 
                              placeholder="0"
                              value={schedule.cost || ''}
                              onChange={e => updateSchedule(schedule.id, { cost: Number(e.target.value) })}
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 flex items-end pb-1.5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={schedule.alarm}
                              onChange={e => updateSchedule(schedule.id, { alarm: e.target.checked })}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                              <Bell className={cn("w-3.5 h-3.5", schedule.alarm ? "text-amber-500" : "text-slate-400")} />
                              Alarm
                            </span>
                          </label>
                        </div>
                        <div className="col-span-12">
                          <input 
                            type="text" 
                            placeholder="Task description / notes..."
                            value={schedule.description}
                            onChange={e => updateSchedule(schedule.id, { description: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          />
                        </div>
                        <div className="col-span-12 mt-2 border-t border-slate-100 pt-3">
                          <label className="block text-xs font-bold text-slate-500 mb-2">Regional Costs</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {regions.map(region => (
                              <div key={region} className="relative">
                                <span className="absolute left-2 top-[-8px] bg-white px-1 text-[10px] font-bold text-slate-400 z-10">{region}</span>
                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input 
                                  type="number" 
                                  placeholder="0"
                                  value={schedule.regionCosts?.[region] || ''}
                                  onChange={e => updateScheduleRegionCost(schedule.id, region, Number(e.target.value))}
                                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

          {activeTab === 'comments' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4 mb-6">
                {safeComments.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No comments yet. Start the conversation!</p>
                ) : (
                  safeComments.map(comment => (
                    <div key={comment.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-sm">{comment.author}</span>
                        <span className="text-xs text-slate-400">{new Date(comment.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">
                        {comment.text.split(/(@\w+)/g).map((part, i) => 
                          part.startsWith('@') ? (
                            <span key={i} className="font-bold text-emerald-600 bg-emerald-50 px-1 rounded">{part}</span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-end gap-2">
                <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment for collaborators..."
                  className="flex-1 max-h-32 min-h-[44px] p-3 bg-transparent border-none focus:ring-0 resize-none text-sm outline-none"
                  rows={1}
                />
                <button 
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
};
