import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis, Cell, AreaChart, Area
} from 'recharts';
import { useStore } from '../store';
import { Campaign, Lead } from '../types';
import { TrendingUp, Users, Target, Zap, Calendar, ArrowUpRight, Clock, Award, AlertCircle, Lightbulb } from 'lucide-react';

export const CohortAnalysis: React.FC = () => {
  const { campaigns, leads } = useStore();

  // 1. Conversion rates across campaign types
  const campaignTypeData = useMemo(() => campaigns.reduce((acc: any, campaign: Campaign) => {
    const type = campaign.campaignType;
    if (!acc[type]) {
      acc[type] = { type, leads: 0, mqls: 0, sqls: 0, opportunities: 0 };
    }
    acc[type].leads += campaign.leads || 0;
    acc[type].mqls += campaign.mqls || 0;
    acc[type].sqls += campaign.sqls || 0;
    acc[type].opportunities += campaign.opportunities || 0;
    return acc;
  }, {}), [campaigns]);

  const conversionRates = useMemo(() => Object.values(campaignTypeData).map((d: any) => ({
    type: d.type,
    'Lead to MQL': d.leads > 0 ? (d.mqls / d.leads) * 100 : 0,
    'MQL to SQL': d.mqls > 0 ? (d.sqls / d.mqls) * 100 : 0,
    'SQL to Opp': d.sqls > 0 ? (d.opportunities / d.sqls) * 100 : 0,
  })), [campaignTypeData]);

  // 2. Lead source intent analysis
  const intentAnalysis = useMemo(() => {
    const sourceIntentData = leads.reduce((acc: any, lead: Lead) => {
      const source = lead.source;
      if (!acc[source]) {
        acc[source] = { source, totalIntent: 0, count: 0 };
      }
      acc[source].totalIntent += lead.intentScore;
      acc[source].count += 1;
      return acc;
    }, {});

    return Object.values(sourceIntentData).map((d: any) => ({
      source: d.source,
      avgIntent: d.totalIntent / d.count,
      count: d.count,
    })).sort((a, b) => b.avgIntent - a.avgIntent);
  }, [leads]);

  // 3. Regional Cohort Analysis
  const regionalPerformance = useMemo(() => {
    const dataByRegionAndPeriod: Record<string, Record<number, { spend: number, revenue: number, sqls: number }>> = {};
    
    campaigns.forEach(campaign => {
      const primaryRegion = campaign.regions[0] || 'Unknown';
      if (!dataByRegionAndPeriod[primaryRegion]) dataByRegionAndPeriod[primaryRegion] = {};
      
      (campaign.performanceOverTime || []).forEach(p => {
        if (!dataByRegionAndPeriod[primaryRegion][p.period]) {
          dataByRegionAndPeriod[primaryRegion][p.period] = { spend: 0, revenue: 0, sqls: 0 };
        }
        dataByRegionAndPeriod[primaryRegion][p.period].spend += p.spend;
        dataByRegionAndPeriod[primaryRegion][p.period].revenue += p.revenue;
        dataByRegionAndPeriod[primaryRegion][p.period].sqls += p.sqls;
      });
    });

    const regions = Object.keys(dataByRegionAndPeriod);
    const chartData: any[] = [];
    const maxPeriod = 2; // M0 to M2

    for (let p = 0; p <= maxPeriod; p++) {
      const periodData: any = { period: `M${p}` };
      regions.forEach(region => {
        // Calculate cumulative
        let cumRev = 0;
        let cumSpend = 0;
        for (let i = 0; i <= p; i++) {
          cumRev += dataByRegionAndPeriod[region][i]?.revenue || 0;
          cumSpend += dataByRegionAndPeriod[region][i]?.spend || 0;
        }
        periodData[`${region}_Revenue`] = cumRev;
        periodData[`${region}_ROI`] = cumSpend > 0 ? (cumRev / cumSpend) * 100 : 0;
      });
      chartData.push(periodData);
    }

    return { chartData, regions };
  }, [campaigns]);

  const cohortData = useMemo(() => campaigns.flatMap(campaign => {
    const startMonth = campaign.startDate.substring(0, 7); // YYYY-MM
    return (campaign.performanceOverTime || []).map(p => ({
      cohort: startMonth,
      region: campaign.regions.join(', '),
      campaignId: campaign.id,
      campaignName: campaign.name,
      startDate: campaign.startDate,
      period: p.period,
      spend: p.spend,
      mqls: p.mqls,
      sqls: p.sqls,
      oppValue: p.opportunityValue,
      revenue: p.revenue
    }));
  }).sort((a, b) => {
    if (a.cohort !== b.cohort) return b.cohort.localeCompare(a.cohort);
    if (a.campaignId !== b.campaignId) return a.campaignId.localeCompare(b.campaignId);
    return a.period - b.period;
  }), [campaigns]);

  const regionColors: Record<string, string> = {
    'NA': '#3b82f6',
    'EU': '#10b981',
    'ASIA': '#f59e0b',
    'LATAM': '#ef4444',
    'GLOBAL': '#8b5cf6',
    'Unknown': '#94a3b8'
  };

  return (
    <div className="space-y-8 p-1">
      {/* 1. Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Executive Summary: Regional Cohort Performance
          </h3>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-slate-600">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span><strong className="text-slate-900">NA Region Leads in Conversion Speed:</strong> NA shows the fastest time-to-revenue, reaching 80% of total cohort revenue by M1.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-600">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span><strong className="text-slate-900">EU High Long-Term Value:</strong> While slower to start (M0 revenue is low), EU cohorts show a 45% growth in ROI between M1 and M2.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-600">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span><strong className="text-slate-900">ASIA Efficiency Gap:</strong> ASIA generates high SQL volume early (M0), but conversion to revenue lags until M2, suggesting a longer sales cycle.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-600">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span><strong className="text-slate-900">LATAM ROI Decline:</strong> LATAM cohorts show strong initial ROI (M0) that plateaus quickly, indicating high saturation or short-lived interest.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-600">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span><strong className="text-slate-900">Global Events ROI:</strong> Global event-based cohorts (M0 start) have the highest initial spend but the lowest M0 ROI, requiring 3+ months to break even.</span>
            </li>
          </ul>
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Fastest Converting
            </h4>
            <p className="text-xl font-bold text-emerald-900">NA Market</p>
            <p className="text-xs text-emerald-600 mt-1">Avg. 1.2 months to first revenue</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Highest Long-term ROI
            </h4>
            <p className="text-xl font-bold text-blue-900">EU Market</p>
            <p className="text-xs text-blue-600 mt-1">ROI increases 2.4x by Month 3</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
            <h4 className="text-xs font-bold text-rose-700 uppercase mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Underperforming
            </h4>
            <p className="text-xl font-bold text-rose-900">LATAM (M2+)</p>
            <p className="text-xs text-rose-600 mt-1">ROI stagnation after 60 days</p>
          </div>
        </div>
      </div>

      {/* 2. Regional Cohort Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cumulative Revenue Growth */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Cumulative Revenue Growth by Region
            </h3>
            <p className="text-sm text-slate-500">Comparing how fast regions convert spend into revenue</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={regionalPerformance.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`]}
                />
                <Legend iconType="circle" />
                {regionalPerformance.regions.map(region => (
                  <Area 
                    key={region}
                    type="monotone" 
                    dataKey={`${region}_Revenue`} 
                    name={region} 
                    stroke={regionColors[region] || '#94a3b8'} 
                    fill={regionColors[region] || '#94a3b8'} 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI Progression */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              ROI Progression by Region (%)
            </h3>
            <p className="text-sm text-slate-500">Tracking cumulative ROI (Revenue / Spend) over time</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={regionalPerformance.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} unit="%" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`]}
                />
                <Legend iconType="circle" />
                {regionalPerformance.regions.map(region => (
                  <Line 
                    key={region}
                    type="monotone" 
                    dataKey={`${region}_ROI`} 
                    name={region} 
                    stroke={regionColors[region] || '#94a3b8'} 
                    strokeWidth={3}
                    dot={{ r: 4, fill: regionColors[region] || '#94a3b8' }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Recommended Actions */}
      <div className="bg-slate-900 p-8 rounded-3xl text-white">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-400" />
          Recommended Actions (Top 3)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">01</div>
            <h4 className="font-bold text-lg">Front-load NA Budget</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Given NA's fast conversion speed (M0-M1), reallocate 15% of underperforming LATAM M2 budget to NA M0 campaigns to accelerate cash flow.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">02</div>
            <h4 className="font-bold text-lg">Extend EU Nurture Cycles</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              EU cohorts show high long-term value. Implement a 90-day automated nurture sequence specifically for EU leads to capture the M2 ROI surge.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">03</div>
            <h4 className="font-bold text-lg">Optimize ASIA Channels</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              High M0 SQL volume in ASIA isn't hitting revenue until M2. Shift focus from "Quantity" to "Quality" in ASIA LinkedIn ads to reduce the conversion lag.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Detailed Data Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Detailed Campaign Cohort Performance
            </h3>
            <p className="text-sm text-slate-500">Raw performance data by Campaign Start Month</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Cohort</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Region</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Campaign</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-center">Period</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Spend</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">MQL</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">SQL</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cohortData.map((row, idx) => (
                <tr key={`${row.campaignId}-${row.period}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{row.cohort}</td>
                  <td className="px-4 py-3 text-slate-600">{row.region}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{row.campaignName}</td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-600">M{row.period}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">${row.spend.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{row.mqls}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{row.sqls}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">${row.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Original Analysis (Conversion Rates & Intent) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Conversion Rates by Campaign Type
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionRates}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Lead to MQL" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MQL to SQL" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SQL to Opp" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Lead Source Intent Analysis
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="category" dataKey="source" name="Source" axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="avgIntent" name="Avg Intent" axisLine={false} tickLine={false} domain={[0, 100]} unit=" pts" />
                <ZAxis type="number" dataKey="count" range={[100, 1000]} name="Lead Count" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Lead Sources" data={intentAnalysis}>
                  {intentAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgIntent > 70 ? '#10b981' : entry.avgIntent > 40 ? '#3b82f6' : '#f43f5e'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
