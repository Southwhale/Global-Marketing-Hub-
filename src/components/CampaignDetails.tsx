import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Megaphone, Target, TrendingUp, DollarSign, 
  Globe2, Calendar, Activity, Zap, Sparkles, 
  BarChart2, Users, ShoppingBag, MessageSquare,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, AlertCircle, Circle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { REGION_COLORS } from '../constants';

export const CampaignDetails: React.FC = () => {
  const { 
    selectedCampaignId, 
    setSelectedCampaignId, 
    setSelectedKpiId,
    setActiveScreen, 
    setSelectedTaskId,
    campaigns,
    tasks,
    kpis,
    updateCampaign,
    theme
  } = useStore();

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState('');
  const [isEditingTargetRevenue, setIsEditingTargetRevenue] = React.useState(false);
  const [editedTargetRevenue, setEditedTargetRevenue] = React.useState(0);

  const campaign = campaigns.find(c => c.id === selectedCampaignId);

  const roiData = React.useMemo(() => {
    if (!campaign?.performanceOverTime) return [];
    return campaign.performanceOverTime.map(item => ({
      ...item,
      roi: item.spend > 0 ? parseFloat((((item.revenue - item.spend) / item.spend) * 100).toFixed(1)) : 0
    }));
  }, [campaign?.performanceOverTime]);

  React.useEffect(() => {
    if (campaign) {
      setEditedName(campaign.name);
      setEditedTargetRevenue(campaign.targetRevenue || 0);
    }
  }, [campaign]);

  if (!campaign) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Campaign Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => setActiveScreen('dashboard')}
            className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const campaignTasks = tasks.filter(t => t.campaignId === campaign.id);
  const campaignKpis = kpis.filter(k => k.campaigns.includes(campaign.id));

  const totalRegRevenue = Object.values(campaign.regionalRevenue || {}).reduce((sum, val) => sum + (val || 0), 0);
  const totalRegCost = Object.values(campaign.regionalCost || {}).reduce((sum, val) => sum + (val || 0), 0);

  const regionalData = Object.entries(campaign.regionalRevenue || {}).map(([region, revenue]) => {
    const cost = (campaign.regionalCost as any)?.[region] || 0;
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
    return {
      name: region,
      revenue,
      cost,
      roi: parseFloat(roi.toFixed(1)),
      color: (REGION_COLORS as any)[region] || '#94a3b8'
    };
  });

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveScreen('dashboard')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                {campaign.name.charAt(0)}
              </div>
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-emerald-500 focus:outline-none bg-transparent"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        updateCampaign(campaign.id, { name: editedName });
                        setIsEditingName(false);
                      }}
                      className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditedName(campaign.name);
                      }}
                      className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{campaign.name}</h1>
                    <button 
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Target Revenue:</span>
                  {isEditingTargetRevenue ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editedTargetRevenue}
                        onChange={(e) => setEditedTargetRevenue(Number(e.target.value))}
                        className="w-24 text-xs font-bold text-slate-900 dark:text-white border-b border-emerald-500 focus:outline-none bg-transparent"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          updateCampaign(campaign.id, { targetRevenue: editedTargetRevenue });
                          setIsEditingTargetRevenue(false);
                        }}
                        className="text-emerald-500 hover:text-emerald-600 transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingTargetRevenue(false);
                          setEditedTargetRevenue(campaign.targetRevenue || 0);
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/target">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        ${(campaign.targetRevenue || 0).toLocaleString()}
                      </span>
                      <button 
                        onClick={() => setIsEditingTargetRevenue(true)}
                        className="p-1 text-slate-400 hover:text-emerald-600 opacity-0 group-hover/target:opacity-100 transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    campaign.status === 'active' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : 
                    campaign.status === 'paused' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}>
                    {campaign.status}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase">
                    <Target className="w-3 h-3" />
                    ROI: {campaign.roi.toFixed(1)}%
                  </span>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">• {campaign.channel}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert('Edit Campaign feature coming soon!')}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Edit Campaign
            </button>
            <button 
              onClick={() => alert('Generating report...')}
              className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">+12.5%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${totalRegRevenue.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">+5.2%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Marketing ROI</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{campaign.roi.toFixed(1)}%</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-lg">-2.4%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Spend</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${campaign.spent.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">+8.1%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Leads</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{(campaign.leads || 0).toLocaleString()}</h3>
          </div>

          {campaign.targetRevenue && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <Target className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-lg",
                    totalRegRevenue >= campaign.targetRevenue ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                  )}>
                    {((totalRegRevenue / campaign.targetRevenue) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Goal Progress</span>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Target Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${campaign.targetRevenue.toLocaleString()}</h3>
            </div>
          )}

          {campaign.q4Target && (
            <>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg">Q4 Target</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Q4 Target Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${campaign.q4Target.toLocaleString()}</h3>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-lg",
                      (campaign.q4Actual || 0) >= (campaign.q4Target || 0) ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                    )}>
                      {(((campaign.q4Actual || 0) / (campaign.q4Target || 1)) * 100).toFixed(1)}%
                    </span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Achievement</span>
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Q4 Actual Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${(campaign.q4Actual || 0).toLocaleString()}</h3>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Overview */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance Over Time</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Revenue vs Spend trend for this campaign</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-full" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Spend</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={campaign.performanceOverTime || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="period" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }}
                      tickFormatter={(val) => `Month ${val + 1}`}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }}
                      tickFormatter={(val) => `$${val / 1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                      }}
                      itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="spend" 
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* ROI Trend */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">ROI Trend</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Return on Investment percentage over time</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">ROI %</span>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={roiData}>
                    <defs>
                      <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="period" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }}
                      tickFormatter={(val) => `Month ${val + 1}`}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                      }}
                      itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                      formatter={(value: number) => [`${value}%`, 'ROI']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="roi" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRoi)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Regional Breakdown */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8">Regional Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionalData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="revenue"
                      >
                        {regionalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {regionalData.map((region) => (
                    <div key={region.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: region.color }} />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{region.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">${region.revenue.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{region.roi}% ROI</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Campaign Tasks */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campaign Tasks</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Operational tasks for this campaign</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{campaignTasks.length} Total Tasks</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Task Name</th>
                      <th className="pb-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="pb-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Owner</th>
                      <th className="pb-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Due Date</th>
                      <th className="pb-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {campaignTasks.map(task => (
                      <tr 
                        key={task.id} 
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedTaskId(task.id);
                        }}
                      >
                        <td className="py-4 pr-4">
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{task.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{task.id}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            task.status === 'completed' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                            task.status === 'in-progress' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                            task.status === 'delayed' ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" :
                            "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          )}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {task.owner.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{task.owner}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{task.dueDate || 'No date'}</span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">${(task.budget || 0).toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                    {campaignTasks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <p className="text-sm text-slate-400 italic">No tasks assigned to this campaign</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategic Alignment - Linked KPIs */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Strategic Alignment</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">KPIs supported by this campaign</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaignKpis.map(kpi => (
                  <div 
                    key={kpi.id} 
                    className="p-6 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all group bg-slate-50/30 dark:bg-slate-800/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">{kpi.id}</span>
                        <h4 
                          onClick={() => {
                            setSelectedKpiId(kpi.id);
                            setActiveScreen('kpi-details');
                          }}
                          className="text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors flex items-center gap-2"
                        >
                          {kpi.name}
                          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                      </div>
                      <div className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                        {kpi.pillar}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
                      Theme: <span className="text-slate-700 dark:text-slate-300">{kpi.theme}</span>
                    </p>
                    
                    <div className="grid grid-cols-5 gap-2 mb-6">
                      {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                        const target = (kpi.targets as any)[q.toLowerCase()];
                        return (
                          <div key={q} className="text-center p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">{q}</p>
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white">
                              {kpi.unit === 'USD' || kpi.unit === 'KRW' ? '$' : ''}
                              {target.toLocaleString()}
                              {kpi.unit === '%' ? '%' : ''}
                            </p>
                          </div>
                        );
                      })}
                      <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">Year</p>
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {kpi.unit === 'USD' || kpi.unit === 'KRW' ? '$' : ''}
                          {(kpi.yearlyTarget || 0).toLocaleString()}
                          {kpi.unit === '%' ? '%' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-slate-400 dark:text-slate-500">Overall Progress</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {kpi.yearlyTarget && kpi.yearlyTarget > 0 
                            ? ((kpi.historicalPerformance?.[kpi.historicalPerformance.length - 1] || 0) / kpi.yearlyTarget * 100).toFixed(1)
                            : '0.0'}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, kpi.yearlyTarget && kpi.yearlyTarget > 0 ? (kpi.historicalPerformance?.[kpi.historicalPerformance.length - 1] || 0) / kpi.yearlyTarget * 100 : 0)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {campaignKpis.length === 0 && (
                <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Target className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No KPIs linked to this campaign</p>
                </div>
              )}
            </div>

            {/* Budget Allocation Stacked Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Budget Allocation by Region & Channel</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Stacked view of costs across all project campaigns</p>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const projectCampaigns = campaigns.filter(c => c.projectId === campaign.projectId);
                      const activeRegions = Array.from(new Set(projectCampaigns.flatMap(c => Object.keys(c.regionalCost || {})))) as any[];
                      return activeRegions.map(region => {
                        const data: any = { region };
                        projectCampaigns.forEach(c => {
                          if (c.regionalCost?.[region as any]) {
                            data[c.channel] = (data[c.channel] || 0) + (c.regionalCost as any)[region];
                          }
                        });
                        return data;
                      });
                    })()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="region" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }}
                      tickFormatter={(val) => `$${val / 1000}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }}
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                      }}
                    />
                    <Legend />
                    {Array.from(new Set(campaigns.filter(c => c.projectId === campaign.projectId).map(c => c.channel))).map((channel, index) => (
                      <Bar 
                        key={channel} 
                        dataKey={channel} 
                        stackId="a" 
                        fill={[
                          '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', 
                          '#ec4899', '#f43f5e', '#f59e0b', '#14b8a6'
                        ][index % 8]} 
                        radius={index === 0 ? [0, 0, 4, 4] : [0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Campaign Tasks Detailed List */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campaign Tasks</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Detailed list of all tasks for this campaign</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {campaignTasks.length} Tasks
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left pb-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Task Name</th>
                      <th className="text-left pb-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="text-left pb-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Owner</th>
                      <th className="text-left pb-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {campaignTasks.map(task => (
                      <tr 
                        key={task.id} 
                        onClick={() => setSelectedTaskId(task.id)}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                              task.status === 'completed' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                              task.status === 'in-progress' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" :
                              task.status === 'delayed' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" :
                              "bg-slate-50 dark:bg-slate-800 text-slate-400"
                            )}>
                              {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                               task.status === 'in-progress' ? <Clock className="w-4 h-4" /> :
                               task.status === 'delayed' ? <AlertCircle className="w-4 h-4" /> :
                               <Activity className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{task.name}</p>
                              {task.priority && (
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-1 inline-block",
                                  task.priority === 'high' ? "bg-amber-500 text-white" :
                                  task.priority === 'medium' ? "bg-blue-500 text-white" :
                                  "bg-slate-400 text-white"
                                )}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            task.status === 'completed' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                            task.status === 'in-progress' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                            task.status === 'delayed' ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" :
                            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          )}>
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              task.status === 'completed' ? "bg-emerald-500" :
                              task.status === 'in-progress' ? "bg-blue-500" :
                              task.status === 'delayed' ? "bg-rose-500" :
                              "bg-slate-400"
                            )} />
                            {task.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {task.owner.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{task.owner}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{task.dueDate || 'No date'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {campaignTasks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <Activity className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                          <p className="text-sm text-slate-400 italic">No tasks associated with this campaign</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            {/* Insights */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">Campaign Insights</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Top Performer</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {regionalData.sort((a, b) => b.roi - a.roi)[0]?.name} is showing the highest ROI at {regionalData.sort((a, b) => b.roi - a.roi)[0]?.roi}%.
                  </p>
                </div>
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Budget Status</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {((campaign.spent / campaign.budget) * 100).toFixed(0)}% of budget utilized. On track for completion.
                  </p>
                </div>
              </div>
            </div>

            {/* Associated KPIs */}
            {/* Strategic Alignment section moved to main column */}

            {/* Tasks */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white">Execution Tasks</h3>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{campaignTasks.length} Total</span>
              </div>
              <div className="space-y-3">
                {campaignTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => setSelectedTaskId(task.id)}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                      {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                       task.status === 'in-progress' ? <Clock className="w-4 h-4 text-blue-500" /> :
                       task.status === 'delayed' ? <AlertCircle className="w-4 h-4 text-rose-500" /> :
                       <Activity className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{task.name}</p>
                        {task.priority && (
                          <span className={cn(
                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                            task.priority === 'high' ? "bg-amber-500 text-white" :
                            task.priority === 'medium' ? "bg-blue-500 text-white" :
                            "bg-slate-400 text-white"
                          )}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">${task.spent.toLocaleString()} spent</p>
                        <span className="text-[8px] text-slate-300 dark:text-slate-700">•</span>
                        <span className={cn(
                          "text-[8px] font-bold uppercase",
                          task.status === 'completed' ? "text-emerald-500" :
                          task.status === 'in-progress' ? "text-blue-500" :
                          task.status === 'delayed' ? "text-rose-500" :
                          "text-slate-400"
                        )}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  </div>
                ))}
                {campaignTasks.length === 0 && (
                  <p className="text-sm text-slate-400 italic text-center py-4">No tasks found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
