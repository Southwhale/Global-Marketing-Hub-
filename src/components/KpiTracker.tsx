import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Target, Plus, ChevronRight, ChevronDown, Calendar, Users, DollarSign, MessageSquare, Megaphone, Edit2, TrendingUp, ArrowRight, ExternalLink, ArrowUpRight, Trash2, X, AlertTriangle, Settings2, Download, CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useStore } from '../store';
import { TeamMemberSelect } from './TeamMemberSelect';
import { SingleMemberSelect } from './SingleMemberSelect';
import { KPI, Task, Region, Screen } from '../types';
import { cn } from '../lib/utils';

const InlineEdit = ({ value, onChange, className, type = "text", placeholder = "" }: { value: string | number, onChange: (val: string) => void, className?: string, type?: string, placeholder?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (val !== value) {
      onChange(val.toString());
    }
  };

  return isEditing ? (
    <input
      ref={inputRef}
      type={type}
      value={val}
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
      className={cn("border border-emerald-500 rounded px-1.5 py-0.5 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white", className)}
    />
  ) : (
    <span 
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
      className={cn("cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1.5 py-0.5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group relative", className)}
    >
      {value || placeholder}
      <Edit2 className="w-3 h-3 absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500" />
    </span>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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

export const KpiTracker: React.FC = () => {
  const { 
    kpis, 
    setKpis, 
    tasks, 
    campaigns, 
    teamMembers, 
    addTask, 
    setSelectedTaskId, 
    updateKpi, 
    updateCampaign, 
    updateTask, 
    deleteTask,
    setActiveScreen, 
    setSelectedCampaignId,
    setSelectedKpiId,
    addKpi,
    deleteKpi,
    bulkAddKpis,
    bulkDeleteKpis,
    currentProjectId,
    regions
  } = useStore();

  const [isAddingKpi, setIsAddingKpi] = useState(false);
  const [selectedKpis, setSelectedKpis] = useState<string[]>([]);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    name: '',
    statement: '',
    pillar: '',
    theme: '',
    unit: '',
    targetQ1: '',
    targetQ2: '',
    targetQ3: '',
    targetQ4: ''
  });
  const [newKpiData, setNewKpiData] = useState({
    id: '',
    name: '',
    statement: '',
    pillar: '',
    theme: '',
    unit: '%',
    targets: { q1: 0, q2: 0, q3: 0, q4: 0 },
    owners: [] as string[]
  });
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({});
  const [expandedThemes, setExpandedThemes] = useState<Record<string, boolean>>({});
  const [expandedKpis, setExpandedKpis] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'kpi' | 'task' | 'unlink', campaignName?: string } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 300,
    owners: 150,
    trend: 120,
    targets: 100
  });

  const handleResize = (column: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [column]: Math.max(100, width) }));
  };

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setActiveScreen('campaign-details');
  };

  const handleViewKpi = (kpiId: string) => {
    setSelectedKpiId(kpiId);
    setActiveScreen('kpi-details');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          setCsvData(results.data);
          
          // Auto-guess mapping
          const guessMapping: Record<string, string> = {
            name: '', statement: '', pillar: '', theme: '', unit: '', targetQ1: '', targetQ2: '', targetQ3: '', targetQ4: ''
          };
          headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes('name')) guessMapping.name = h;
            else if (lower.includes('statement')) guessMapping.statement = h;
            else if (lower.includes('pillar')) guessMapping.pillar = h;
            else if (lower.includes('theme')) guessMapping.theme = h;
            else if (lower.includes('unit')) guessMapping.unit = h;
            else if (lower.includes('q1')) guessMapping.targetQ1 = h;
            else if (lower.includes('q2')) guessMapping.targetQ2 = h;
            else if (lower.includes('q3')) guessMapping.targetQ3 = h;
            else if (lower.includes('q4')) guessMapping.targetQ4 = h;
          });
          setColumnMapping(guessMapping);
          setIsMappingModalOpen(true);
        }
      },
    });
    // Reset input
    event.target.value = '';
  };

  const handleImportMappedKpis = () => {
    if (!columnMapping.name) {
      alert("KPI Name column is required.");
      return;
    }

    const newKpis: KPI[] = csvData.map((row) => {
      const id = `KPI-${Math.floor(Math.random() * 10000)}`;
      return {
        id,
        projectId: currentProjectId || 'p1',
        name: row[columnMapping.name] || 'Unnamed KPI',
        statement: columnMapping.statement ? row[columnMapping.statement] : 'Enter strategic statement here',
        owners: ['Unassigned'],
        targets: {
          q1: columnMapping.targetQ1 ? Number(row[columnMapping.targetQ1]) || 0 : 0,
          q2: columnMapping.targetQ2 ? Number(row[columnMapping.targetQ2]) || 0 : 0,
          q3: columnMapping.targetQ3 ? Number(row[columnMapping.targetQ3]) || 0 : 0,
          q4: columnMapping.targetQ4 ? Number(row[columnMapping.targetQ4]) || 0 : 0,
        },
        unit: columnMapping.unit ? row[columnMapping.unit] : '%',
        pillar: columnMapping.pillar ? row[columnMapping.pillar] : 'Strategic Pillar',
        theme: columnMapping.theme ? row[columnMapping.theme] : 'Strategic Theme',
        campaigns: campaigns.length > 0 ? [campaigns[0].id] : [],
        historicalPerformance: [0, 0, 0, 0]
      };
    });

    bulkAddKpis(newKpis);
    setIsMappingModalOpen(false);
    setCsvData([]);
    setCsvHeaders([]);
  };

  const togglePillar = (pillar: string) => setExpandedPillars(prev => ({ ...prev, [pillar]: !prev[pillar] }));
  const toggleTheme = (theme: string) => setExpandedThemes(prev => ({ ...prev, [theme]: !prev[theme] }));
  const toggleKpi = (kpiId: string) => setExpandedKpis(prev => ({ ...prev, [kpiId]: !prev[kpiId] }));

  const pillars = Array.from(new Set(kpis.map(k => k.pillar)));

  const handleOpenTask = (task: Task) => {
    setSelectedTaskId(task.id);
  };

  const handleCreateTask = (kpiId: string, campaignId: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: currentProjectId,
      campaignId,
      kpiId,
      name: 'New Task',
      owner: 'Unassigned',
      status: 'todo',
      budget: 0,
      spent: 0,
      regionCosts: regions.reduce((acc, r) => ({ ...acc, [r]: 0 }), {} as Record<Region, number>),
      schedules: [],
      comments: [],
      description: ''
    };
    addTask(newTask);
    setSelectedTaskId(newTask.id);
  };

  const handleAddKpi = () => {
    if (newKpiData.id) {
      updateKpi(newKpiData.id, {
        name: newKpiData.name,
        statement: newKpiData.statement,
        pillar: newKpiData.pillar,
        theme: newKpiData.theme,
        unit: newKpiData.unit,
        targets: newKpiData.targets
      });
    } else {
      const newKpi: KPI = {
        id: `KPI-${Math.floor(Math.random() * 1000)}`,
        name: newKpiData.name || 'New KPI',
        statement: newKpiData.statement || 'Enter strategic statement here',
        owners: ['Unassigned'],
        targets: newKpiData.targets,
        unit: newKpiData.unit,
        pillar: newKpiData.pillar || 'Strategic Pillar',
        theme: newKpiData.theme || 'Strategic Theme',
        projectId: currentProjectId || 'p1',
        campaigns: campaigns.length > 0 ? [campaigns[0].id] : [],
        historicalPerformance: [0, 0, 0, 0]
      };
      addKpi(newKpi);
    }
    setIsAddingKpi(false);
    setNewKpiData({
      id: '',
      name: '',
      statement: '',
      pillar: '',
      theme: '',
      unit: '%',
      targets: { q1: 0, q2: 0, q3: 0, q4: 0 },
      owners: []
    });
  };

  const handleEditKpi = (kpi: KPI) => {
    setNewKpiData({
      id: kpi.id,
      name: kpi.name,
      statement: kpi.statement,
      pillar: kpi.pillar,
      theme: kpi.theme,
      unit: kpi.unit,
      targets: { ...kpi.targets },
      owners: kpi.owners || []
    });
    setIsAddingKpi(true);
  };

  const handleDeleteKpi = (id: string) => {
    setDeleteConfirm({ id, type: 'kpi' });
  };

  const handleDeleteTask = (id: string) => {
    setDeleteConfirm({ id, type: 'task' });
  };

  const handleUnlinkCampaign = (kpiId: string, campaignId: string, campaignName: string) => {
    setDeleteConfirm({ id: `${kpiId}:${campaignId}`, type: 'unlink', campaignName });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'kpi') {
      deleteKpi(deleteConfirm.id);
    } else if (deleteConfirm.type === 'task') {
      deleteTask(deleteConfirm.id);
    } else if (deleteConfirm.type === 'unlink') {
      const [kpiId, campaignId] = deleteConfirm.id.split(':');
      const kpi = kpis.find(k => k.id === kpiId);
      if (kpi) {
        updateKpi(kpiId, { campaigns: kpi.campaigns.filter(id => id !== campaignId) });
      }
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KPI & Strategy Tracker</h1>
          <p className="text-slate-500 dark:text-slate-400">Upload CSV to track Pillars, Themes, Campaigns, and Tasks</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedKpis.length > 0 && (
            <button
              onClick={() => {
                bulkDeleteKpis(selectedKpis);
                setSelectedKpis([]);
              }}
              className="flex items-center gap-2 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-4 py-2 rounded-xl font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedKpis.length})
            </button>
          )}
          <button 
            onClick={() => setIsAddingKpi(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add KPI
          </button>
          <a 
            href="data:text/csv;charset=utf-8,KPI Name,KPI Statement,Strategic Pillar,Strategic Theme,Unit,Q1 Target,Q2 Target,Q3 Target,Q4 Target%0AExample KPI,Increase user retention,Growth,Retention,%,10,15,20,25" 
            download="kpi_template.csv"
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Template
          </a>
          <label className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {kpis.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <Target className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No KPIs Loaded</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Upload your KPI Tracker CSV to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
            <input 
              type="checkbox" 
              checked={selectedKpis.length === kpis.length && kpis.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedKpis(kpis.map(k => k.id));
                } else {
                  setSelectedKpis([]);
                }
              }}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Select All KPIs</span>
          </div>
          {pillars.map(pillar => {
            const pillarKpis = kpis.filter(k => k.pillar === pillar);
            const themes = Array.from(new Set(pillarKpis.map(k => k.theme)));
            
            return (
              <div key={pillar} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div 
                  className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => togglePillar(pillar)}
                >
                  {expandedPillars[pillar] ? <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                  <h2 className="font-bold text-slate-900 dark:text-white text-lg">{pillar}</h2>
                  <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {pillarKpis.length} KPIs
                  </span>
                </div>

                {expandedPillars[pillar] && (
                  <div className="pl-8 pr-4 py-2">
                    {themes.map(theme => {
                      const themeKpis = pillarKpis.filter(k => k.theme === theme);
                      
                      return (
                        <div key={theme} className="mb-4 last:mb-0">
                          <div 
                            className="flex items-center gap-2 py-2 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            onClick={() => toggleTheme(theme)}
                          >
                            {expandedThemes[theme] ? <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300">{theme}</h3>
                          </div>

                          {expandedThemes[theme] && (
                            <div className="pl-6 space-y-4 mt-2">
                              {themeKpis.map(kpi => (
                                <div key={kpi.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-start gap-4">
                                  <div className="pt-1">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedKpis.includes(kpi.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedKpis([...selectedKpis, kpi.id]);
                                        } else {
                                          setSelectedKpis(selectedKpis.filter(id => id !== kpi.id));
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div 
                                      className="flex items-start justify-between cursor-pointer group/kpi"
                                      onClick={() => toggleKpi(kpi.id)}
                                    >
                                    <div 
                                      className="relative group/resize"
                                      style={{ width: columnWidths.name }}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewKpi(kpi.id);
                                          }}
                                          className="font-bold text-slate-900 dark:text-white text-base truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
                                        >
                                          {kpi.name}
                                        </button>
                                      </div>
                                      <InlineEdit 
                                        value={kpi.statement}
                                        onChange={val => updateKpi(kpi.id, { statement: val })}
                                        className="text-sm text-slate-500 dark:text-slate-400 block w-full truncate"
                                      />
                                      <div 
                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                                        onMouseDown={(e) => {
                                          const startX = e.pageX;
                                          const startWidth = columnWidths.name;
                                          const onMouseMove = (moveEvent: MouseEvent) => {
                                            handleResize('name', startWidth + (moveEvent.pageX - startX));
                                          };
                                          const onMouseUp = () => {
                                            document.removeEventListener('mousemove', onMouseMove);
                                            document.removeEventListener('mouseup', onMouseUp);
                                          };
                                          document.addEventListener('mousemove', onMouseMove);
                                          document.addEventListener('mouseup', onMouseUp);
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center gap-4 text-sm flex-1">
                                      <div style={{ width: columnWidths.owners }} className="text-right hidden md:block relative group/resize">
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Owners</p>
                                        <InlineEdit 
                                          value={kpi.owners.join(', ')}
                                          onChange={val => updateKpi(kpi.id, { owners: val.split(',').map(s => s.trim()) })}
                                          className="font-medium text-slate-700 dark:text-slate-300 truncate block"
                                        />
                                        <div 
                                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                                          onMouseDown={(e) => {
                                            const startX = e.pageX;
                                            const startWidth = columnWidths.owners;
                                            const onMouseMove = (moveEvent: MouseEvent) => {
                                              handleResize('owners', startWidth + (moveEvent.pageX - startX));
                                            };
                                            const onMouseUp = () => {
                                              document.removeEventListener('mousemove', onMouseMove);
                                              document.removeEventListener('mouseup', onMouseUp);
                                            };
                                            document.addEventListener('mousemove', onMouseMove);
                                            document.addEventListener('mouseup', onMouseUp);
                                          }}
                                        />
                                      </div>
                                      {kpi.historicalPerformance && (
                                        <div style={{ width: columnWidths.trend }} className="text-right relative group/resize">
                                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase mb-1">Trend</p>
                                          <div className="h-8 w-full bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-100 dark:border-slate-800">
                                            <ResponsiveContainer width="100%" height="100%">
                                              <LineChart data={kpi.historicalPerformance.map((v, i) => ({ v, i }))}>
                                                <Line 
                                                  type="monotone" 
                                                  dataKey="v" 
                                                  stroke="#10b981" 
                                                  strokeWidth={2} 
                                                  dot={false} 
                                                />
                                              </LineChart>
                                            </ResponsiveContainer>
                                          </div>
                                          <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                                            onMouseDown={(e) => {
                                              const startX = e.pageX;
                                              const startWidth = columnWidths.trend;
                                              const onMouseMove = (moveEvent: MouseEvent) => {
                                                handleResize('trend', startWidth + (moveEvent.pageX - startX));
                                              };
                                              const onMouseUp = () => {
                                                document.removeEventListener('mousemove', onMouseMove);
                                                document.removeEventListener('mouseup', onMouseUp);
                                              };
                                              document.addEventListener('mousemove', onMouseMove);
                                              document.addEventListener('mouseup', onMouseUp);
                                            }}
                                          />
                                        </div>
                                      )}
                                      {['q1', 'q2', 'q3', 'q4'].map((q, qIndex) => (
                                        <div key={`${kpi.id}-${q}-${qIndex}`} style={{ width: columnWidths.targets }} className="text-right relative group/resize">
                                          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">{q} Target</p>
                                          <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 justify-end">
                                            <InlineEdit 
                                              type="number"
                                              value={kpi.targets[q as keyof typeof kpi.targets]} 
                                              onChange={val => updateKpi(kpi.id, { targets: { ...kpi.targets, [q]: Number(val) } })} 
                                              className="w-12 text-right"
                                            />
                                            <span className="text-[10px]">{kpi.unit}</span>
                                          </div>
                                          <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                                            onMouseDown={(e) => {
                                              const startX = e.pageX;
                                              const startWidth = columnWidths.targets;
                                              const onMouseMove = (moveEvent: MouseEvent) => {
                                                handleResize('targets', startWidth + (moveEvent.pageX - startX));
                                              };
                                              const onMouseUp = () => {
                                                document.removeEventListener('mousemove', onMouseMove);
                                                document.removeEventListener('mouseup', onMouseUp);
                                              };
                                              document.addEventListener('mousemove', onMouseMove);
                                              document.addEventListener('mouseup', onMouseUp);
                                            }}
                                          />
                                        </div>
                                      ))}
                                      <div className="ml-2 flex items-center gap-2 shrink-0">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleEditKpi(kpi); }}
                                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                          title="Edit KPI Settings"
                                        >
                                          <Settings2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleViewKpi(kpi.id); }}
                                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                        >
                                          <Target className="w-3 h-3" /> View Details
                                        </button>
                                        {expandedKpis[kpi.id] ? <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteKpi(kpi.id); }}
                                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                          title="Delete KPI"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {expandedKpis[kpi.id] && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                      <div className="mb-4 flex items-center justify-between px-1">
                                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Linked Campaigns & Tasks</h4>
                                        <select 
                                          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                                          onChange={(e) => {
                                            const id = e.target.value;
                                            if (id && !kpi.campaigns.includes(id)) {
                                              updateKpi(kpi.id, { campaigns: [...kpi.campaigns, id] });
                                            }
                                            e.target.value = "";
                                          }}
                                          value=""
                                        >
                                          <option value="" disabled>+ Link Campaign</option>
                                          {campaigns
                                            .filter(c => !kpi.campaigns.includes(c.id))
                                            .map(c => (
                                              <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                      </div>
                                      {kpi.campaigns.map((campaignId, cIndex) => {
                                        const campaign = campaigns.find(c => c.id === campaignId);
                                        const campaignTasks = tasks.filter(t => t.campaignId === campaignId && t.kpiId === kpi.id);
                                        
                                        if (!campaign) return null;

                                        return (
                                          <div key={`${kpi.id}-${campaignId}-${cIndex}`} className="mb-4">
                                            <div className="flex items-center justify-between mb-3 px-1">
                                              <div className="flex items-center gap-2">
                                                <Megaphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                <button 
                                                  onClick={() => handleViewCampaign(campaign.id)}
                                                  className="font-bold text-slate-700 dark:text-slate-300 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 group/camp"
                                                >
                                                  {campaign.name}
                                                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/camp:opacity-100 transition-opacity" />
                                                </button>
                                                <button 
                                                  onClick={() => handleUnlinkCampaign(kpi.id, campaign.id, campaign.name)}
                                                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                                                  title="Unlink Campaign"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                              <button 
                                                onClick={() => handleCreateTask(kpi.id, campaign.id)}
                                                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                              >
                                                <Plus className="w-3 h-3" /> Add Task
                                              </button>
                                            </div>

                                            <div className="space-y-2">
                                              {campaignTasks.map(task => (
                                                <div 
                                                  key={task.id} 
                                                  onClick={() => handleOpenTask(task)}
                                                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
                                                >
                                                  <div className="flex items-center gap-3">
                                                    {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                                     task.status === 'in-progress' ? <Clock className="w-4 h-4 text-blue-500" /> :
                                                     task.status === 'delayed' ? <AlertCircle className="w-4 h-4 text-rose-500" /> :
                                                     <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0 mx-1" />}
                                                    <InlineEdit 
                                                      value={task.name}
                                                      onChange={val => updateTask(task.id, { name: val })}
                                                      className="text-sm font-bold text-slate-800 dark:text-slate-200"
                                                    />
                                                  </div>
                                                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                                     <SingleMemberSelect 
                                                       value={task.owner}
                                                       onChange={val => updateTask(task.id, { owner: val })}
                                                       className="min-w-[120px]"
                                                     />
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {task.schedules.length}</span>
                                                    <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                                      <DollarSign className="w-3 h-3"/> 
                                                      <InlineEdit 
                                                        type="number"
                                                        value={task.spent}
                                                        onChange={val => updateTask(task.id, { spent: Number(val) })}
                                                        className="w-16"
                                                      />
                                                      / 
                                                      <InlineEdit 
                                                        type="number"
                                                        value={task.budget}
                                                        onChange={val => updateTask(task.id, { budget: Number(val) })}
                                                        className="w-16"
                                                      />
                                                    </span>
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                                                    >
                                                      <X className="w-3 h-3" />
                                                    </button>
                                                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                                  </div>
                                                </div>
                                              ))}
                                              {campaignTasks.length === 0 && (
                                                <p className="text-xs text-slate-400 italic px-1">No tasks assigned yet.</p>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New KPI Modal */}
      {isAddingKpi && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-emerald-500" />
                {newKpiData.id ? 'Edit KPI Settings' : 'Create New KPI'}
              </h3>
              <button onClick={() => setIsAddingKpi(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">KPI Name</label>
                <input 
                  autoFocus
                  value={newKpiData.name}
                  onChange={e => setNewKpiData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Brand Awareness Index"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Strategic Pillar</label>
                  <div className="relative">
                    <input 
                      list="pillars-list"
                      value={newKpiData.pillar}
                      onChange={e => setNewKpiData(prev => ({ ...prev, pillar: e.target.value }))}
                      placeholder="Select or Add Pillar"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <datalist id="pillars-list">
                      {Array.from(new Set(kpis.map(k => k.pillar))).map(p => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Strategic Theme</label>
                  <div className="relative">
                    <input 
                      list="themes-list"
                      value={newKpiData.theme}
                      onChange={e => setNewKpiData(prev => ({ ...prev, theme: e.target.value }))}
                      placeholder="Select or Add Theme"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <datalist id="themes-list">
                      {Array.from(new Set(kpis.map(k => k.theme))).map(t => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">KPI Statement</label>
                <textarea 
                  value={newKpiData.statement}
                  onChange={e => setNewKpiData(prev => ({ ...prev, statement: e.target.value }))}
                  placeholder="Describe the objective of this KPI..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all h-20 resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Unit</label>
                  <input 
                    value={newKpiData.unit}
                    onChange={e => setNewKpiData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="%, $, etc."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Q4 Target</label>
                  <input 
                    type="number"
                    value={newKpiData.targets.q4}
                    onChange={e => setNewKpiData(prev => ({ ...prev, targets: { ...prev.targets, q4: Number(e.target.value) } }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Owners</label>
                <TeamMemberSelect
                  selectedIds={newKpiData.owners}
                  onChange={owners => setNewKpiData(prev => ({ ...prev, owners }))}
                  placeholder="Select KPI owners..."
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsAddingKpi(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddKpi}
                disabled={!newKpiData.name || !newKpiData.pillar || !newKpiData.theme}
                className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newKpiData.id ? 'Save Changes' : 'Create KPI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isMappingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Map CSV Columns</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Match your CSV headers to KPI fields</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMappingModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {[
                  { key: 'name', label: 'KPI Name (Required)' },
                  { key: 'statement', label: 'KPI Statement' },
                  { key: 'pillar', label: 'Strategic Pillar' },
                  { key: 'theme', label: 'Strategic Theme' },
                  { key: 'unit', label: 'Unit (e.g., %, $)' },
                  { key: 'targetQ1', label: 'Q1 Target' },
                  { key: 'targetQ2', label: 'Q2 Target' },
                  { key: 'targetQ3', label: 'Q3 Target' },
                  { key: 'targetQ4', label: 'Q4 Target' },
                ].map(field => (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-1/3 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {field.label}
                    </div>
                    <div className="flex-1">
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                      >
                        <option value="">-- Ignore this field --</option>
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsMappingModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleImportMappedKpis}
                disabled={!columnMapping.name}
                className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {csvData.length} KPIs
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={
          deleteConfirm?.type === 'kpi' ? 'Delete KPI' : 
          deleteConfirm?.type === 'task' ? 'Delete Task' : 
          'Unlink Campaign'
        }
        message={
          deleteConfirm?.type === 'kpi' ? 'Are you sure you want to delete this KPI? This action cannot be undone.' :
          deleteConfirm?.type === 'task' ? 'Are you sure you want to delete this task? This action cannot be undone.' :
          `Are you sure you want to unlink "${deleteConfirm?.campaignName}" from this KPI?`
        }
      />
    </div>
  );
};
