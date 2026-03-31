import React, { useState } from 'react';
import { 
  Database, Users, Target, Search, Filter, 
  ArrowUpRight, CheckCircle2, AlertCircle, MoreHorizontal,
  RefreshCw, Download, ExternalLink, Mail, Phone, Building2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { Lead } from '../types';

export const CRM: React.FC = () => {
  const { leads, customers, crmConfig, setCRMConfig } = useStore();
  const [activeTab, setActiveTab] = useState<'leads' | 'customers'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Lead['status'] | 'All'>('All');

  const filteredLeads = (leads || []).filter(lead => {
    const matchesSearch = (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = (customers || []).filter(customer => {
    return (customer.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
           (customer.industry || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!crmConfig.connected) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
            <Database className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Dynamics 365 CRM</h2>
          <p className="text-slate-500 mb-8">
            Integrate your CRM to enable MQL refinement and revenue attribution.
          </p>
          <button 
            onClick={() => setCRMConfig({ connected: true })}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 mx-auto"
          >
            <Database className="w-5 h-5" />
            Connect Dynamics 365
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">CRM & Customers</h1>
            <p className="text-slate-500 mt-1">Dynamics 365 synchronization and customer relationship management.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert('Syncing with Dynamics 365...')}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </button>
            <button 
              onClick={() => alert('Exporting CRM data...')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-2xl w-fit mb-8">
          <button
            onClick={() => setActiveTab('leads')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'leads' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Leads & MQLs
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'customers' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Active Customers
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {activeTab === 'leads' ? (
            <>
              <StatCard title="Total Leads" value={leads?.length || 0} icon={Users} color="text-blue-600" bg="bg-blue-50" />
              <StatCard title="MQLs" value={(leads || []).filter(l => l.status === 'MQL').length} icon={Target} color="text-emerald-600" bg="bg-emerald-50" />
              <StatCard title="Sync Status" value="Healthy" icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
            </>
          ) : (
            <>
              <StatCard title="Total Customers" value={customers?.length || 0} icon={Building2} color="text-blue-600" bg="bg-blue-50" />
              <StatCard title="Total Revenue" value={`$${((customers || []).reduce((acc, c) => acc + (c.revenue || 0), 0) / 1000000).toFixed(1)}M`} icon={ArrowUpRight} color="text-emerald-600" bg="bg-emerald-50" />
              <StatCard title="Customer Health" value="94%" icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
            </>
          )}
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder={activeTab === 'leads' ? "Search leads or companies..." : "Search customers..."}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeTab === 'leads' && (
              <div className="flex items-center gap-3">
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="All">All Status</option>
                  <option value="Lead">Lead</option>
                  <option value="MQL">MQL</option>
                  <option value="SQL">SQL</option>
                </select>
                <button className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all">
                  <Filter className="w-4 h-4" />
                  More Filters
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {activeTab === 'leads' ? (
                    <>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Info</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Industry</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employees</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTab === 'leads' ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{lead.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <Mail className="w-3 h-3" /> {lead.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium">{lead.company}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          lead.status === 'SQL' ? "bg-blue-100 text-blue-700" :
                          lead.status === 'MQL' ? "bg-emerald-100 text-emerald-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{lead.source}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{customer.companyName}</div>
                            <div className="text-xs text-slate-500">{customer.region}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{customer.industry}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">${((customer.revenue || 0) / 1000000).toFixed(1)}M</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{(customer.employees || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-2xl", bg)}>
        <Icon className={cn("w-6 h-6", color)} />
      </div>
      <ArrowUpRight className="w-5 h-5 text-slate-300" />
    </div>
    <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
    <div className="text-sm text-slate-500 font-medium">{title}</div>
  </div>
);
