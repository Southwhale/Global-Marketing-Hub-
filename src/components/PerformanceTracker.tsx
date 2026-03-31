import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  ChevronDown, 
  Calendar, 
  Globe, 
  Building2, 
  Target, 
  Megaphone, 
  Save, 
  X, 
  Trash2, 
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Papa from 'papaparse';
import { useStore } from '../store';
import { KPI, Campaign, Region, PerformanceEntry } from '../types';
import { REGIONS } from '../constants';
import { cn } from '../lib/utils';

export const PerformanceTracker: React.FC = () => {
  const { 
    kpis, 
    campaigns, 
    performanceEntries, 
    addPerformanceEntry, 
    updatePerformanceEntry, 
    deletePerformanceEntry,
    customers
  } = useStore();

  const [selectedKpiId, setSelectedKpiId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<Region | 'All'>('All');

  const [newEntry, setNewEntry] = useState<Partial<PerformanceEntry>>({
    date: new Date().toISOString().split('T')[0],
    region: 'ASIA',
    revenue: 0,
    cost: 0,
    leads: 0,
    mqls: 0,
    sqls: 0,
    customers: 0,
    clicks: 0,
    impressions: 0,
    engagement: 0,
    subscribers: 0
  });

  const selectedKpi = useMemo(() => kpis.find(k => k.id === selectedKpiId), [kpis, selectedKpiId]);
  const linkedCampaigns = useMemo(() => {
    if (!selectedKpi) return [];
    return campaigns.filter(c => selectedKpi.campaigns.includes(c.id));
  }, [campaigns, selectedKpi]);

  const filteredEntries = useMemo(() => {
    return performanceEntries.filter(entry => {
      const matchesSearch = 
        entry.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.country?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = regionFilter === 'All' || entry.region === regionFilter;
      const matchesKpi = !selectedKpiId || entry.kpiId === selectedKpiId;
      const matchesCampaign = !selectedCampaignId || entry.campaignId === selectedCampaignId;
      return matchesSearch && matchesRegion && matchesKpi && matchesCampaign;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [performanceEntries, searchQuery, regionFilter, selectedKpiId, selectedCampaignId]);

  const handleAddEntry = async () => {
    if (!selectedKpiId || !selectedCampaignId) return;

    const entry: PerformanceEntry = {
      id: `perf-${Date.now()}`,
      kpiId: selectedKpiId,
      campaignId: selectedCampaignId,
      date: newEntry.date || new Date().toISOString().split('T')[0],
      region: newEntry.region as Region,
      country: newEntry.country || '',
      customer: newEntry.customer || '',
      revenue: Number(newEntry.revenue) || 0,
      cost: Number(newEntry.cost) || 0,
      leads: Number(newEntry.leads) || 0,
      mqls: Number(newEntry.mqls) || 0,
      sqls: Number(newEntry.sqls) || 0,
      customers: Number(newEntry.customers) || 0,
      clicks: Number(newEntry.clicks) || 0,
      impressions: Number(newEntry.impressions) || 0,
      engagement: Number(newEntry.engagement) || 0,
      subscribers: Number(newEntry.subscribers) || 0,
    };

    await addPerformanceEntry(entry);
    setIsAddingEntry(false);
    setNewEntry({
      ...newEntry,
      revenue: 0,
      cost: 0,
      leads: 0,
      mqls: 0,
      sqls: 0,
      customers: 0,
      clicks: 0,
      impressions: 0,
      engagement: 0,
      subscribers: 0
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        for (const row of results.data as any[]) {
          const entry: PerformanceEntry = {
            id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            kpiId: row.kpiId || selectedKpiId,
            campaignId: row.campaignId || selectedCampaignId,
            date: row.date || new Date().toISOString().split('T')[0],
            region: (row.region as Region) || 'ASIA',
            country: row.country || '',
            customer: row.customer || '',
            revenue: Number(row.revenue) || 0,
            cost: Number(row.cost) || 0,
            leads: Number(row.leads) || 0,
            mqls: Number(row.mqls) || 0,
            sqls: Number(row.sqls) || 0,
            customers: Number(row.customers) || 0,
            clicks: Number(row.clicks) || 0,
            impressions: Number(row.impressions) || 0,
            engagement: Number(row.engagement) || 0,
            subscribers: Number(row.subscribers) || 0,
          };
          if (entry.kpiId && entry.campaignId) {
            await addPerformanceEntry(entry);
          }
        }
      },
    });
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            Performance Input & Tracking
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Input and track performance results by KPI, Campaign, Region, and Customer.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm">
            <Upload className="w-4 h-4" />
            Bulk Import (CSV)
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => setIsAddingEntry(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Performance Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Selection Filters
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Select KPI</label>
                <select 
                  value={selectedKpiId}
                  onChange={(e) => {
                    setSelectedKpiId(e.target.value);
                    setSelectedCampaignId('');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white text-sm"
                >
                  <option value="">All KPIs</option>
                  {kpis.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Select Campaign</label>
                <select 
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  disabled={!selectedKpiId}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white text-sm disabled:opacity-50"
                >
                  <option value="">All Linked Campaigns</option>
                  {linkedCampaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Region Filter</label>
                <select 
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value as Region | 'All')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white text-sm"
                >
                  <option value="All">All Regions</option>
                  {REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search by Country or Customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {filteredEntries.length} Entries Found
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">KPI / Campaign</th>
                    <th className="px-6 py-4">Region / Country</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Revenue</th>
                    <th className="px-6 py-4 text-right">Cost</th>
                    <th className="px-6 py-4 text-right">ROI</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredEntries.map(entry => {
                    const kpi = kpis.find(k => k.id === entry.kpiId);
                    const campaign = campaigns.find(c => c.id === entry.campaignId);
                    const roi = entry.cost > 0 ? ((entry.revenue - entry.cost) / entry.cost) * 100 : 0;

                    return (
                      <tr key={entry.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {entry.date}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                              <Target className="w-3 h-3 text-emerald-500" />
                              {kpi?.name || 'Unknown KPI'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              <Megaphone className="w-3 h-3 text-slate-400" />
                              {campaign?.name || 'Unknown Campaign'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                              <Globe className="w-3.5 h-3.5 text-slate-400" />
                              {entry.region}
                            </div>
                            {entry.country && (
                              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-5">
                                {entry.country}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {entry.customer || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            ${entry.revenue.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            ${entry.cost.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded-lg",
                            roi >= 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-rose-600 bg-rose-50 dark:bg-rose-900/20"
                          )}>
                            {roi.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deletePerformanceEntry(entry.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <BarChart3 className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                          <p className="text-slate-500 dark:text-slate-400 font-medium">No performance entries found.</p>
                          <button 
                            onClick={() => setIsAddingEntry(true)}
                            className="text-emerald-600 font-bold text-sm hover:underline"
                          >
                            Add your first entry
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {isAddingEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-emerald-500" />
                Add Performance Entry
              </h3>
              <button onClick={() => setIsAddingEntry(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Context Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">KPI</label>
                      <select 
                        value={selectedKpiId}
                        onChange={(e) => setSelectedKpiId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      >
                        <option value="">Select KPI</option>
                        {kpis.map(k => (
                          <option key={k.id} value={k.id}>{k.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Campaign</label>
                      <select 
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        disabled={!selectedKpiId}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white disabled:opacity-50"
                      >
                        <option value="">Select Campaign</option>
                        {linkedCampaigns.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Date</label>
                      <input 
                        type="date"
                        value={newEntry.date}
                        onChange={e => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Region</label>
                      <select 
                        value={newEntry.region}
                        onChange={e => setNewEntry(prev => ({ ...prev, region: e.target.value as Region }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      >
                        {REGIONS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Country</label>
                      <input 
                        type="text"
                        placeholder="e.g. South Korea"
                        value={newEntry.country}
                        onChange={e => setNewEntry(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Customer</label>
                      <input 
                        list="customers-list"
                        placeholder="e.g. Samsung"
                        value={newEntry.customer}
                        onChange={e => setNewEntry(prev => ({ ...prev, customer: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                      <datalist id="customers-list">
                        {customers.map(c => (
                          <option key={c.id} value={c.companyName} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Revenue ($)</label>
                      <input 
                        type="number"
                        value={newEntry.revenue}
                        onChange={e => setNewEntry(prev => ({ ...prev, revenue: Number(e.target.value) }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Cost ($)</label>
                      <input 
                        type="number"
                        value={newEntry.cost}
                        onChange={e => setNewEntry(prev => ({ ...prev, cost: Number(e.target.value) }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Leads</label>
                      <input 
                        type="number"
                        value={newEntry.leads}
                        onChange={e => setNewEntry(prev => ({ ...prev, leads: Number(e.target.value) }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Customers Acquired</label>
                      <input 
                        type="number"
                        value={newEntry.customers}
                        onChange={e => setNewEntry(prev => ({ ...prev, customers: Number(e.target.value) }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Clicks</label>
                      <input 
                        type="number"
                        value={newEntry.clicks}
                        onChange={e => setNewEntry(prev => ({ ...prev, clicks: Number(e.target.value) }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Engagement</label>
                      <input 
                        type="number"
                        value={newEntry.engagement}
                        onChange={e => setNewEntry(prev => ({ ...prev, engagement: Number(e.target.value) }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Subscribers</label>
                      <input 
                        type="number"
                        value={newEntry.subscribers}
                        onChange={e => setNewEntry(prev => ({ ...prev, subscribers: Number(e.target.value) }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Impressions</label>
                      <input 
                        type="number"
                        value={newEntry.impressions}
                        onChange={e => setNewEntry(prev => ({ ...prev, impressions: Number(e.target.value) }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsAddingEntry(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddEntry}
                disabled={!selectedKpiId || !selectedCampaignId}
                className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
