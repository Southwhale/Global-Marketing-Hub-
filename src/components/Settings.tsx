import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Mail, Slack, Smartphone, ShieldAlert, TrendingUp, 
  Megaphone, CheckCircle2, XCircle, Info, ChevronRight, Save, X,
  Database, Layout, Sparkles, Link as LinkIcon, RefreshCw,
  Building2, Plus, Trash2, Edit2, Globe, Download, Moon, Sun, Upload
} from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { B2BCustomer, Region, PerformanceEntry } from '../types';

export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    crmConfig, 
    setCRMConfig, 
    powerBIConfig, 
    setPowerBIConfig, 
    customers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    bulkAddCustomers, 
    bulkAddPerformanceEntries,
    leads,
    theme,
    setTheme,
    language,
    setLanguage,
    alertSettings,
    setAlertSettings
  } = useStore();
  const [isAddingCustomer, setIsAddingCustomer] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const perfFileInputRef = React.useRef<HTMLInputElement>(null);
  const [newCustomer, setNewCustomer] = React.useState<Partial<B2BCustomer>>({
    status: 'active',
    region: 'NA'
  });

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newCustomers: B2BCustomer[] = [];

      // Assume CSV format: Company Name, Buyer Code, Region, Industry
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [companyName, buyerCode, region, industry] = line.split(',');
        if (companyName && buyerCode) {
          newCustomers.push({
            id: `cl-csv-${Date.now()}-${i}`,
            companyName: companyName.trim(),
            buyerCode: buyerCode.trim(),
            region: (region?.trim() as any) || 'NA',
            industry: industry?.trim() || '',
            status: 'active',
            country: '',
            revenue: 0,
            employees: 0
          });
        }
      }

      if (newCustomers.length > 0) {
        bulkAddCustomers(newCustomers);
        alert(`Successfully imported ${newCustomers.length} customers from CSV.`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handlePerfCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newEntries: PerformanceEntry[] = [];
        const timestamp = Date.now();

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as any;
          if (row.Region || row.region) {
            newEntries.push({
              id: `perf-bulk-${timestamp}-${i}`,
              kpiId: row.KPI_ID || row.kpiId || 'manual-revenue',
              campaignId: row.Campaign_ID || row.campaignId || 'manual-revenue',
              date: row.Date || row.date || new Date().toISOString().split('T')[0],
              region: (row.Region || row.region || 'NA') as Region,
              country: row.Country || row.country || '',
              customer: row.Customer || row.customer || '',
              revenue: Number(row.Revenue || row.revenue || row['Order Amount'] || row['오더 금액']) || 0,
              cost: Number(row.Cost || row.cost) || 0,
              leads: 0,
              mqls: 0,
              sqls: 0,
              customers: 0,
              clicks: 0,
              impressions: 0,
              engagement: 0,
              subscribers: 0
            });
          }
        }

        if (newEntries.length > 0) {
          await bulkAddPerformanceEntries(newEntries);
          alert(`Successfully imported ${newEntries.length} performance records from CSV.`);
        } else {
          alert("No valid records found. Please check the CSV format (Region, Customer, Revenue/Order Amount are required).");
        }
      },
    });
    if (perfFileInputRef.current) perfFileInputRef.current.value = '';
  };

  const handleSyncFromCRM = () => {
    if (!crmConfig.connected) {
      alert("Please connect Dynamics 365 CRM first.");
      return;
    }

    const sqlLeads = leads.filter(l => l.status === 'SQL');
    const newCustomersFromCRM = sqlLeads
      .filter(l => !customers.some(c => c.companyName === l.company))
      .map((l, i) => ({
        id: `cl-crm-${Date.now()}-${i}`,
        companyName: l.company,
        buyerCode: `B-CRM-${l.id}`,
        region: 'NA' as const,
        industry: 'Unknown',
        status: 'active' as const,
        country: '',
        revenue: 0,
        employees: 0
      }));

    if (newCustomersFromCRM.length > 0) {
      bulkAddCustomers(newCustomersFromCRM);
      alert(`Successfully synced ${newCustomersFromCRM.length} new customers from CRM.`);
    } else {
      alert("No new customers found in CRM to sync.");
    }
  };

  const handleAddCustomer = () => {
    if (newCustomer.companyName && newCustomer.buyerCode) {
      addCustomer({
        id: `cl-${Date.now()}`,
        companyName: newCustomer.companyName,
        buyerCode: newCustomer.buyerCode,
        region: newCustomer.region || 'NA',
        country: newCustomer.country || '',
        status: newCustomer.status as any || 'active',
        industry: newCustomer.industry || '',
        revenue: Number(newCustomer.revenue) || 0,
        employees: Number(newCustomer.employees) || 0,
      } as B2BCustomer);
      setIsAddingCustomer(false);
      setNewCustomer({ status: 'active', region: 'NA' });
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleSaveAll = async () => {
    setSaveStatus('saving');
    // In this implementation, most things save on change, 
    // but we'll simulate a global save for feedback.
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto p-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('settings')}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
              <span>{t('dashboard')}</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900 dark:text-slate-200 font-medium">{t('settings')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-sm font-bold text-slate-900 dark:text-white ml-2">Enable Smart Monitoring</span>
            <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
            <Info className="w-4 h-4 text-slate-400 mr-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Appearance & Language Section */}
            <AlertSection 
              title="Appearance & Language" 
              icon={Globe}
              color="text-blue-600"
              bg="bg-blue-50 dark:bg-blue-900/20"
              description="Customize your visual experience and preferred language."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    {t('darkMode')}
                  </label>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {theme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'}
                    </span>
                    <button 
                      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-colors duration-200",
                        theme === 'dark' ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200",
                        theme === 'dark' ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {t('language')}
                  </label>
                  <select 
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ko">한국어 (Korean)</option>
                    <option value="en">English</option>
                    <option value="pl">Polski (Polish)</option>
                    <option value="ru">Русский (Russian)</option>
                    <option value="th">ไทย (Thai)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="vi">Tiếng Việt (Vietnamese)</option>
                  </select>
                </div>
              </div>
            </AlertSection>

            {/* B2B Customer Management Section */}
            <AlertSection 
              title="B2B Customer Management" 
              icon={Building2}
              color="text-blue-600"
              bg="bg-blue-50 dark:bg-blue-900/20"
              description="Manage your key customer accounts and trade information."
            >
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <p className="text-sm text-slate-500">Manage customer information automatically or manually.</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleCSVUpload} 
                      accept=".csv" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Bulk CSV
                    </button>
                    <button 
                      onClick={handleSyncFromCRM}
                      className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Sync CRM
                    </button>
                    <button 
                      onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      Add Customer
                    </button>
                  </div>
                </div>

                {isAddingCustomer && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="e.g. Acme Corp"
                          value={newCustomer.companyName || ''}
                          onChange={(e) => setNewCustomer({...newCustomer, companyName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Buyer Code</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="e.g. B-001"
                          value={newCustomer.buyerCode || ''}
                          onChange={(e) => setNewCustomer({...newCustomer, buyerCode: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Region</label>
                        <select 
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={newCustomer.region || 'NA'}
                          onChange={(e) => setNewCustomer({...newCustomer, region: e.target.value as Region})}
                        >
                          <option value="NA">North America</option>
                          <option value="EU">Europe</option>
                          <option value="ASIA">Asia</option>
                          <option value="LATAM">Latin America</option>
                          <option value="MENA">MENA</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Industry</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="e.g. Technology"
                          value={newCustomer.industry || ''}
                          onChange={(e) => setNewCustomer({...newCustomer, industry: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        onClick={() => setIsAddingCustomer(false)}
                        className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAddCustomer}
                        className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                      >
                        Save Customer
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {customers.map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{customer.companyName}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">{customer.buyerCode}</span>
                            <span>•</span>
                            <span>{customer.region}</span>
                            <span>•</span>
                            <span>{customer.industry}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => deleteCustomer(customer.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AlertSection>

            {/* Manual Revenue Data Upload Section */}
            <AlertSection 
              title="Manual Revenue Data Upload" 
              icon={Database}
              color="text-emerald-600"
              bg="bg-emerald-50 dark:bg-emerald-900/20"
              description="If CRM integration is not possible, manually upload regional revenue and order data."
            >
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Bulk Performance Import</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Upload regional revenue, cost, and order data to populate the dashboard.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const headers = ['Date', 'Region', 'Country', 'Customer', 'Revenue', 'Cost'];
                        const csvContent = headers.join(',') + '\n' + 
                          '2026-03-01,ASIA,South Korea,Samsung,50000,10000\n' +
                          '2026-03-05,EU,Germany,Siemens,75000,15000';
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.setAttribute('download', 'revenue_template.csv');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Template
                    </button>
                    <input 
                      type="file" 
                      ref={perfFileInputRef} 
                      onChange={handlePerfCSVUpload} 
                      accept=".csv" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => perfFileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Revenue CSV
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Info className="w-3 h-3 text-blue-500" />
                    CSV Format Guide
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">
                    Your CSV should include the following headers (case-insensitive):
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Date', 'Region', 'Country', 'Customer', 'Revenue', 'Cost'].map(header => (
                      <div key={header} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300">
                        {header}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 italic">
                    * "Order Amount" or "오더 금액" can be used instead of "Revenue".
                  </p>
                </div>
              </div>
            </AlertSection>

            <AlertSection 
              title="Budget Alerts" 
              icon={ShieldAlert}
              color="text-emerald-600"
              bg="bg-emerald-50 dark:bg-emerald-900/20"
              description="Receive an alert when your daily spending approaches the set limit."
            >
              <AlertToggle 
                label="Alert when 80% of daily budget is spent" 
                defaultValue={80} 
                unit="%" 
                description="of daily budget is spent across all active campaigns."
                active={alertSettings.budgetAlert80}
                onToggle={() => setAlertSettings({ budgetAlert80: !alertSettings.budgetAlert80 })}
              />
              <AlertToggle 
                label="Alert on sudden cost spikes" 
                defaultValue={15} 
                unit="%" 
                description="% increase within 1 hour compared to the previous period."
                active={alertSettings.costSpike15}
                onToggle={() => setAlertSettings({ costSpike15: !alertSettings.costSpike15 })}
              />
            </AlertSection>

            <AlertSection 
              title="Performance Alerts" 
              icon={TrendingUp}
              color="text-blue-600"
              bg="bg-blue-50 dark:bg-blue-900/20"
              description="Receive an alert when key metrics fall below or exceed thresholds."
            >
              <AlertToggle 
                label="Notify if MQL Rate drops below 1%" 
                defaultValue={1.00} 
                unit="%" 
                description="on any campaign with > 500 impressions."
                active={alertSettings.mqlRateDrop}
                onToggle={() => setAlertSettings({ mqlRateDrop: !alertSettings.mqlRateDrop })}
              />
              <AlertToggle 
                label="Notify if Pipeline ROI is under 2.0" 
                defaultValue={2.00} 
                unit="" 
                description="on any campaign with > $100 spend."
                active={alertSettings.roiUnder2}
                onToggle={() => setAlertSettings({ roiUnder2: !alertSettings.roiUnder2 })}
              />
            </AlertSection>

            <AlertSection 
              title="Campaign Status" 
              icon={Megaphone}
              color="text-indigo-600"
              bg="bg-indigo-50 dark:bg-indigo-900/20"
              description="Receive an alert if a running campaign is stopped or rejected."
            >
              <AlertToggle 
                label="Campaign paused" 
                description="Notify when an active campaign is manually paused." 
                active={alertSettings.campaignPaused}
                onToggle={() => setAlertSettings({ campaignPaused: !alertSettings.campaignPaused })}
              />
              <AlertToggle 
                label="Ad rejected" 
                description="Notify when an ad is rejected by the advertising platform." 
                active={alertSettings.adRejected}
                onToggle={() => setAlertSettings({ adRejected: !alertSettings.adRejected })}
              />
            </AlertSection>

            <AlertSection 
              title="CRM & Power BI Integration" 
              icon={Database}
              color="text-purple-600"
              bg="bg-purple-50 dark:bg-purple-900/20"
              description="Configure Dynamics 365 CRM synchronization and Power BI dashboard embedding."
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Microsoft Dynamics 365</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Sync leads, opportunities, and revenue data.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCRMConfig({ connected: !crmConfig.connected })}
                    className={cn(
                      "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                      crmConfig.connected 
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50" 
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                    )}
                  >
                    {crmConfig.connected ? 'Connected' : 'Connect CRM'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                      <Layout className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Microsoft Power BI</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Embed interactive dashboards and reports.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPowerBIConfig({ connected: !powerBIConfig.connected })}
                    className={cn(
                      "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                      powerBIConfig.connected 
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50" 
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                    )}
                  >
                    {powerBIConfig.connected ? 'Connected' : 'Connect Power BI'}
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <AlertToggle 
                    label="AI-driven MQL Refinement" 
                    description="Dynamically adjust MQL criteria based on SQL conversion performance."
                    active={alertSettings.aiMqlRefinement}
                    onToggle={() => setAlertSettings({ aiMqlRefinement: !alertSettings.aiMqlRefinement })}
                  />
                </div>
              </div>
            </AlertSection>

            <div className="flex justify-end gap-4 pt-4">
              <button className="px-8 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">Cancel</button>
              <button 
                onClick={handleSaveAll}
                disabled={saveStatus === 'saving'}
                className={cn(
                  "px-8 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 min-w-[160px] justify-center",
                  saveStatus === 'saved' 
                    ? "bg-emerald-100 text-emerald-700 shadow-emerald-600/10" 
                    : "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700"
                )}
              >
                {saveStatus === 'saving' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Notification Methods
              </h3>
              <div className="space-y-8">
                <MethodToggle 
                  icon={Mail} 
                  label="Email" 
                  value="user@example.com" 
                  buttonLabel="Edit Email"
                />
                <MethodToggle 
                  icon={Slack} 
                  label="Slack" 
                  value="Connected: Marketing Channel" 
                  buttonLabel="Manage Slack Integration"
                  isConnected
                />
                <MethodToggle 
                  icon={Smartphone} 
                  label="In-app" 
                  value="Show alerts in the notification center." 
                />
              </div>
            </div>

            <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <h4 className="text-xl font-bold mb-2">Need help?</h4>
              <p className="text-emerald-100/80 text-sm mb-6">Our support team is available 24/7 to help you set up your alerts.</p>
              <button className="w-full py-3 bg-white text-emerald-900 font-bold rounded-xl hover:bg-emerald-50 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertSection = ({ title, icon: Icon, color, bg, description, children }: any) => (
  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div className={cn("px-8 py-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700", bg)}>
      <Icon className={cn("w-5 h-5", color)} />
      <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-8 space-y-8">
      {children}
    </div>
  </div>
);

const AlertToggle = ({ label, defaultValue, unit, description, active, onToggle }: any) => (
  <div className="flex items-start justify-between group">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <button 
          onClick={onToggle}
          className={cn(
            "w-10 h-5 rounded-full relative transition-colors duration-200",
            active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
          )}
        >
          <div className={cn(
            "absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200",
            active ? "right-1" : "left-1"
          )} />
        </button>
        <span className="font-bold text-slate-900 dark:text-white">{label}</span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {defaultValue !== undefined && (
          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-slate-200 font-bold mr-2">
            {defaultValue}{unit}
          </span>
        )}
        {description}
      </p>
    </div>
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
      <Info className="w-4 h-4 text-slate-400 cursor-help" />
    </div>
  </div>
);

const MethodToggle = ({ icon: Icon, label, value, buttonLabel, isConnected }: any) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-slate-400" />
        <span className="text-sm font-bold text-slate-900 dark:text-white">{label}</span>
      </div>
      <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
        <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
      </div>
    </div>
    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
      <p className={cn("text-xs mb-3", isConnected ? "text-emerald-600 font-medium flex items-center gap-1" : "text-slate-500 dark:text-slate-400")}>
        {isConnected && <CheckCircle2 className="w-3 h-3" />}
        {value}
      </p>
      {buttonLabel && (
        <button className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
          {buttonLabel}
        </button>
      )}
    </div>
  </div>
);
