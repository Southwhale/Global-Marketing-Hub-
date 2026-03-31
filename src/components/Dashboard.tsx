import React, { useState, useMemo, forwardRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { 
  Megaphone, Users, Target, TrendingUp, Globe2, Bell, Search, 
  ChevronDown, ChevronUp, ChevronRight, Filter, Plus, ArrowRight, ArrowUpRight, DollarSign, BarChart2, 
  Activity, Wallet, Database, Layout, Sparkles, CheckCircle2,
  Settings2, Eye, EyeOff, GripVertical, Calendar, MapPin,
  Zap, Share2, ShoppingBag, FileText, MoreVertical, Trash2, X,
  Maximize2, Minimize2, Square, Move, AlertTriangle
} from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);
import { cn } from '../lib/utils';
import { CohortAnalysis } from './CohortAnalysis';
import { useStore } from '../store';
import { Region, WidgetId, DashboardWidget, Campaign } from '../types';
import { REGIONS, REGION_COLORS as regionColors } from '../constants';

const SOCIAL_PLATFORMS = ['LinkedIn', 'YouTube', 'Meta', 'Social', 'Google Ads', 'Email', 'Webinar'];
const PERIODS = ['All Time', 'This Year', 'This Quarter', 'Last 30 Days', 'Last 7 Days'];

const FUNNEL_TOOLTIPS: Record<string, string> = {
  'Leads': 'Total number of potential customers who have shown interest.',
  'MQL': 'Marketing Qualified Leads: Leads that marketing has identified as more likely to become customers.',
  'SQL': 'Sales Qualified Leads: Leads that sales has vetted and accepted as potential customers.',
  'Opp': 'Opportunities: SQLs that have progressed to a formal sales opportunity with a potential deal value.',
  'Won': 'Closed-Won: Opportunities that have successfully converted into paying customers.'
};

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'kpi-cards', title: 'Key Performance Indicators', visible: true, x: 0, y: 0, w: 12, h: 6 },
  { id: 'regional-revenue-cost', title: 'Revenue by Region (CRM Integrated)', visible: true, x: 0, y: 6, w: 6, h: 12 },
  { id: 'budget-allocation-execution', title: 'Cost Execution by Advertising Activity', visible: true, x: 6, y: 6, w: 6, h: 12 },
  { id: 'campaign-performance', title: 'Campaign Performance Breakdown', visible: true, x: 0, y: 18, w: 12, h: 14 },
  { id: 'regional-performance', title: 'Regional Performance Table', visible: true, x: 0, y: 32, w: 12, h: 12 },
  { id: 'funnel-analysis', title: 'Leads Funnel Analysis', visible: true, x: 0, y: 44, w: 6, h: 12 },
  { id: 'delayed-items', title: 'Delayed Campaigns & Tasks', visible: true, x: 6, y: 44, w: 6, h: 12 },
  { id: 'digital-channel-analysis', title: 'Digital Channel KPI Analysis', visible: true, x: 0, y: 56, w: 12, h: 16 },
  { id: 'regional-subscribers', title: 'Regional Subscriber Acquisition', visible: true, x: 0, y: 72, w: 12, h: 12 },
];

// --- Helper Components ---

const StatCard = ({ title, value, icon: Icon, trend, color, data }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800",
    rose: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800",
  };

  const chartColors: any = {
    emerald: "#10b981",
    blue: "#3b82f6",
    indigo: "#6366f1",
    rose: "#f43f5e",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-2xl border", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-lg",
            trend.startsWith('+') ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-rose-600 bg-rose-50 dark:bg-rose-900/20"
          )}>
            {trend}
          </span>
          {data && (
            <div className="h-8 w-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.map((v: number, i: number) => ({ v, i }))}>
                  <Line 
                    type="monotone" 
                    dataKey="v" 
                    stroke={chartColors[color]} 
                    strokeWidth={2} 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4>
    </div>
  );
};

const WidgetWrapper = forwardRef(({ 
  title, 
  children, 
  onRemove, 
  className,
  isCustomizing,
  isShared,
  style,
  onMouseDown,
  onMouseUp,
  onTouchEnd,
  ...props
}: { 
  title: string; 
  children: React.ReactNode; 
  onRemove?: () => void;
  className?: string;
  isCustomizing?: boolean;
  isShared?: boolean;
  style?: React.CSSProperties;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  [key: string]: any;
}, ref: React.ForwardedRef<HTMLDivElement>) => (
  <div 
    ref={ref}
    style={style}
    onMouseDown={onMouseDown}
    onMouseUp={onMouseUp}
    onTouchEnd={onTouchEnd}
    {...props}
    className={cn(
      "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full", 
      isCustomizing && "ring-2 ring-emerald-500/20 border-emerald-500/30",
      className
    )}
  >
    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
      <div className="flex items-center gap-2">
        {isCustomizing && (
          <div className="drag-handle cursor-move p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 mr-2">
            <Move className="w-4 h-4" />
          </div>
        )}
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        {onRemove && !isShared && (
          <button onClick={onRemove} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
            <EyeOff className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
    <div className="p-6 flex-1 overflow-auto">
      {children}
    </div>
  </div>
));

WidgetWrapper.displayName = 'WidgetWrapper';

const generateCampaignInsight = (c: Campaign) => {
  const insights: string[] = [];
  
  // ROI Insight
  if (c.roi > 300) {
    insights.push(`High ROI (${c.roi.toFixed(1)}%) campaign`);
  } else if (c.roi < 150) {
    insights.push(`Low ROI (${c.roi.toFixed(1)}%) needs optimization`);
  }

  // Regional Insight
  if (c.regionalRevenue && c.regionalCost) {
    let bestRegion = '';
    let bestRoi = -Infinity;
    let worstRegion = '';
    let worstRoi = Infinity;

    Object.entries(c.regionalRevenue).forEach(([region, revenue]) => {
      const cost = (c.regionalCost as any)?.[region] || 0;
      if (cost > 0) {
        const roi = ((revenue - cost) / cost) * 100;
        if (roi > bestRoi) {
          bestRoi = roi;
          bestRegion = region;
        }
        if (roi < worstRoi) {
          worstRoi = roi;
          worstRegion = region;
        }
      }
    });

    if (bestRegion && bestRoi > 400) {
      insights.push(`Exceptional performance in ${bestRegion}`);
    }
    if (worstRegion && worstRoi < 100) {
      insights.push(`Underperforming in ${worstRegion}`);
    }
  }

  // Engagement Insight (if social)
  if (c.socialMetrics) {
    const engagement = c.socialMetrics.engagement || 0;
    const followers = c.socialMetrics.followers || 1;
    const engagementRate = (engagement / followers) * 100;
    
    if (engagementRate > 10) {
      insights.push(`Strong audience engagement (${engagementRate.toFixed(1)}%)`);
    } else if (engagementRate < 2) {
      insights.push(`Low engagement on ${c.channel} promotion`);
    }
  }

  return insights.length > 0 ? insights.join(' • ') : 'Steady performance across all metrics';
};

// --- Main Dashboard Component ---

export const Dashboard: React.FC<{ isShared?: boolean }> = ({ isShared = false }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowBackToTop(e.currentTarget.scrollTop > 400);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { 
    projects,
    currentProjectId,
    setCurrentProjectId,
    projectWidgets,
    setProjectWidgets,
    campaigns, 
    tasks,
    leads, 
    customers,
    dashboardFilters,
    setDashboardFilters,
    teamMembers,
    selectedCampaignId,
    setSelectedCampaignId,
    setActiveScreen,
    kpis,
    performanceEntries,
    updateProject
  } = useStore();

  const currentProject = useMemo(() => 
    projects.find(p => p.id === currentProjectId) || projects[0],
  [projects, currentProjectId]);

  const dashboardWidgets = useMemo(() => {
    // 1. If shared, always use the project's default layout (set by owner)
    if (isShared && currentProject?.defaultWidgets && currentProject.defaultWidgets.length > 0) {
      return currentProject.defaultWidgets;
    }

    // 2. Check user's custom layout for this project
    if (projectWidgets[currentProjectId]) {
      return projectWidgets[currentProjectId];
    }
    
    // 3. Check project owner's default layout
    if (currentProject?.defaultWidgets && currentProject.defaultWidgets.length > 0) {
      return currentProject.defaultWidgets;
    }
    
    // 4. Fallback to system default
    return DEFAULT_WIDGETS;
  }, [projectWidgets, currentProjectId, currentProject, isShared]);

  const setDashboardWidgets = (widgets: DashboardWidget[]) => {
    setProjectWidgets(currentProjectId, widgets);
  };

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [tableColumnWidths, setTableColumnWidths] = useState<{ [key: string]: number[] }>({
    campaign: [250, 150, 120, 100, 80, 120, 150, 120],
    channel: [150, 120, 120, 100, 100, 80, 80, 80, 80, 80],
    customer: [200, 120, 120, 100],
    social: [150, 120, 120, 120, 80, 80, 80, 80, 80],
    team: [200, 80, 100, 120, 120, 80, 250],
    regional: [150, 100, 100, 100, 80, 80, 80, 80]
  });

  const [tableRowHeights, setTableRowHeights] = useState<{ [key: string]: number }>({
    campaign: 48,
    channel: 48,
    customer: 48,
    social: 48,
    team: 48,
    regional: 40
  });

  const handleTableResize = (tableName: string, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = tableColumnWidths[tableName][index];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
      setTableColumnWidths(prev => ({
        ...prev,
        [tableName]: prev[tableName].map((w, i) => i === index ? newWidth : w)
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleRowResize = (tableName: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.pageY;
    const startHeight = tableRowHeights[tableName];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newHeight = Math.max(32, startHeight + (moveEvent.pageY - startY));
      setTableRowHeights(prev => ({
        ...prev,
        [tableName]: newHeight
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const campaignPerformanceRef = React.useRef<HTMLDivElement>(null);

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('shared', 'true');
    url.searchParams.set('projectId', currentProjectId);
    setShareUrl(url.toString());
    setIsShareDialogOpen(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(selectedCampaignId);

  // Sync expanded campaign with selected campaign from store
  React.useEffect(() => {
    if (selectedCampaignId) {
      setExpandedCampaignId(selectedCampaignId);
      // Small delay to allow for filtering and rendering
      setTimeout(() => {
        if (campaignPerformanceRef.current) {
          campaignPerformanceRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [selectedCampaignId]);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['LinkedIn', 'YouTube', 'Meta', 'Social']);
  const [metricsGroupBy, setMetricsGroupBy] = useState<'region' | 'channel'>('channel');
  const [metricsPeriod, setMetricsPeriod] = useState<string>('All Time');

  const handleDeleteCampaign = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      const { deleteCampaign } = useStore.getState();
      deleteCampaign(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const selectedCampaign = useMemo(() => 
    campaigns.find(c => c.id === selectedCampaignId),
  [campaigns, selectedCampaignId]);

  // --- Filtering Logic ---
  
  const projectCampaigns = useMemo(() => 
    campaigns.filter(c => c.projectId === currentProjectId),
  [campaigns, currentProjectId]);

  const filteredCampaigns = useMemo(() => {
    if (selectedCampaignId) {
      return projectCampaigns.filter(c => c.id === selectedCampaignId);
    }
    return projectCampaigns.filter(c => {
      const regionMatch = dashboardFilters.region === 'All' || c.regions.includes(dashboardFilters.region as Region);
      return regionMatch;
    });
  }, [projectCampaigns, dashboardFilters, selectedCampaignId]);

  const projectKpis = useMemo(() => 
    kpis.filter(k => k.projectId === currentProjectId),
  [kpis, currentProjectId]);

  const totalSpend = filteredCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalRevenue = filteredCampaigns.reduce((sum, c) => sum + (c.actualRevenue || 0), 0);
  const avgRoi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
  const activeCampaignsCount = filteredCampaigns.filter(c => c.status === 'active').length;

  // --- Widget Data Aggregation ---

  const regionalPerformanceData = useMemo(() => {
    return REGIONS.map(region => {
      const campaignRevenue = filteredCampaigns.reduce((sum, c) => sum + (c.regionalRevenue?.[region] || 0), 0);
      const performanceRevenue = performanceEntries
        .filter(e => e.region === region && (!selectedCampaignId || e.campaignId === selectedCampaignId))
        .reduce((sum, e) => sum + (e.revenue || 0), 0);
      
      const revenue = campaignRevenue + performanceRevenue;

      const campaignCost = filteredCampaigns.reduce((sum, c) => {
        if (c.regionalCost?.[region]) return sum + c.regionalCost[region];
        if (c.regions?.includes(region)) {
          return sum + (c.spent / (c.regions?.length || 1));
        }
        return sum;
      }, 0);
      const performanceCost = performanceEntries
        .filter(e => e.region === region && (!selectedCampaignId || e.campaignId === selectedCampaignId))
        .reduce((sum, e) => sum + (e.cost || 0), 0);
      
      const cost = campaignCost + performanceCost;
      
      const campaignLeads = filteredCampaigns.reduce((sum, c) => sum + (c.regionalLeads?.[region] || 0), 0);
      const performanceLeads = performanceEntries
        .filter(e => e.region === region && (!selectedCampaignId || e.campaignId === selectedCampaignId))
        .reduce((sum, e) => sum + (e.leads || 0), 0);
      const leads = campaignLeads + performanceLeads;

      const campaignMqls = filteredCampaigns.reduce((sum, c) => sum + (c.regionalMqls?.[region] || 0), 0);
      const performanceMqls = performanceEntries
        .filter(e => e.region === region && (!selectedCampaignId || e.campaignId === selectedCampaignId))
        .reduce((sum, e) => sum + (e.mqls || 0), 0);
      const mqls = campaignMqls + performanceMqls;

      const campaignSqls = filteredCampaigns.reduce((sum, c) => sum + (c.regionalSqls?.[region] || 0), 0);
      const performanceSqls = performanceEntries
        .filter(e => e.region === region && (!selectedCampaignId || e.campaignId === selectedCampaignId))
        .reduce((sum, e) => sum + (e.sqls || 0), 0);
      const sqls = campaignSqls + performanceSqls;

      const campaignCustomers = filteredCampaigns.reduce((sum, c) => sum + (c.regionalCustomers?.[region] || 0), 0);
      const performanceCustomers = performanceEntries
        .filter(e => e.region === region && (!selectedCampaignId || e.campaignId === selectedCampaignId))
        .reduce((sum, e) => sum + (e.customers || 0), 0);
      const customers = campaignCustomers + performanceCustomers;
      
      const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
      
      return { 
        name: region, 
        revenue, 
        cost, 
        roi,
        leads,
        mqls,
        sqls,
        customers,
        color: regionColors[region] 
      };
    });
  }, [filteredCampaigns, performanceEntries, selectedCampaignId]);

  const regionalRevenueCostData = useMemo(() => {
    return regionalPerformanceData.map(d => ({
      name: d.name,
      revenue: d.revenue,
      cost: d.cost,
      color: d.color
    }));
  }, [regionalPerformanceData]);

  const funnelData = [
    { name: 'Leads', value: filteredCampaigns.reduce((sum, c) => sum + (c.leads || 0), 0), fill: '#94a3b8' },
    { name: 'MQL', value: filteredCampaigns.reduce((sum, c) => sum + (c.mqls || 0), 0), fill: '#6366f1' },
    { name: 'SQL', value: filteredCampaigns.reduce((sum, c) => sum + (c.sqls || 0), 0), fill: '#10b981' },
    { name: 'Revenue', value: Math.floor(totalRevenue / 1000), fill: '#059669' },
  ];

  const channelPerformanceData = useMemo(() => {
    const channels = dashboardFilters.visibleChannels;
    return channels.map(channel => {
      const channelCampaigns = filteredCampaigns.filter(c => c.channel === channel);
      const channelEntries = performanceEntries.filter(e => {
        const campaign = campaigns.find(c => c.id === e.campaignId);
        return campaign?.channel === channel;
      });
      
      // Apply region filter if not 'All'
      const regionFilteredCampaigns = dashboardFilters.region === 'All' 
        ? channelCampaigns 
        : channelCampaigns.filter(c => c.regions?.includes(dashboardFilters.region as Region));

      const regionFilteredEntries = dashboardFilters.region === 'All'
        ? channelEntries
        : channelEntries.filter(e => e.region === dashboardFilters.region);

      // Simulate period filtering
      let periodMultiplier = 1;
      if (dashboardFilters.period === 'Last 7 Days') periodMultiplier = 0.2;
      else if (dashboardFilters.period === 'Last 30 Days') periodMultiplier = 0.5;
      else if (dashboardFilters.period === 'This Quarter') periodMultiplier = 0.8;

      const campaignLeads = regionFilteredCampaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
      const performanceLeads = regionFilteredEntries.reduce((sum, e) => sum + (e.leads || 0), 0);
      const leads = (campaignLeads + performanceLeads) * periodMultiplier;

      const campaignSpend = regionFilteredCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
      const performanceSpend = regionFilteredEntries.reduce((sum, e) => sum + (e.cost || 0), 0);
      const spend = (campaignSpend + performanceSpend) * periodMultiplier;

      const campaignRevenue = regionFilteredCampaigns.reduce((sum, c) => sum + (c.actualRevenue || 0), 0);
      const performanceRevenue = regionFilteredEntries.reduce((sum, e) => sum + (e.revenue || 0), 0);
      const revenue = (campaignRevenue + performanceRevenue) * periodMultiplier;
      
      const baseMultiplier = regionFilteredCampaigns.length > 0 ? regionFilteredCampaigns.length : 0.5;
      
      const campaignSubscribers = regionFilteredCampaigns.reduce((sum, c) => sum + (c.socialMetrics?.subscribers || 0), 0);
      const performanceSubscribers = regionFilteredEntries.reduce((sum, e) => sum + (e.subscribers || 0), 0);
      const subscribers = (campaignSubscribers + performanceSubscribers || Math.floor((Math.random() * 20000 + 10000) * baseMultiplier)) * periodMultiplier;

      const campaignEngagement = regionFilteredCampaigns.reduce((sum, c) => sum + (c.socialMetrics?.engagement || 0), 0);
      const performanceEngagement = regionFilteredEntries.reduce((sum, e) => sum + (e.engagement || 0), 0);
      const engagement = (campaignEngagement + performanceEngagement || Math.floor((Math.random() * 5000 + 2000) * baseMultiplier)) * periodMultiplier;

      const campaignClicks = regionFilteredCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
      const performanceClicks = regionFilteredEntries.reduce((sum, e) => sum + (e.clicks || 0), 0);
      const clicks = (campaignClicks + performanceClicks || Math.floor((Math.random() * 8000 + 3000) * baseMultiplier)) * periodMultiplier;
      
      const cpc = clicks > 0 ? spend / clicks : (spend > 0 ? spend / (clicks + 1) : Math.random() * 2 + 0.5);
      const cpm = (clicks * 10) > 0 ? (spend / (clicks * 10)) * 1000 : (spend > 0 ? (spend / (clicks * 10 + 1)) * 1000 : Math.random() * 15 + 5);
      const ctr = 1.2 + Math.random() * 2; 
      const cpa = leads > 0 ? spend / leads : (spend > 0 ? spend / (leads + 1) : Math.random() * 50 + 20);
      const engagementRate = subscribers > 0 ? (engagement / subscribers) * 100 : 0;

      return {
        channel,
        subscribers,
        engagement,
        leads: Math.floor(leads),
        clicks,
        engagementRate: engagementRate.toFixed(1),
        cpc: cpc.toFixed(2),
        cpm: cpm.toFixed(2),
        ctr: ctr.toFixed(2),
        cpa: cpa.toFixed(2),
        roi: spend > 0 ? ((revenue - spend) / spend) * 100 : 0
      };
    });
  }, [filteredCampaigns, performanceEntries, dashboardFilters, campaigns]);

  const budgetAllocationData = useMemo(() => {
    const channels = Array.from(new Set(projectCampaigns.map(c => c.channel)));
    return channels.map(channel => {
      const channelCampaigns = projectCampaigns.filter(c => c.channel === channel);
      const budget = channelCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
      const spent = channelCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
      return {
        name: channel,
        budget,
        spent,
      };
    }).sort((a, b) => b.budget - a.budget);
  }, [projectCampaigns]);

  const revenueByPeriodData = useMemo(() => {
    const years = ['2023', '2024', '2025', '2026'];
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    return quarters.map(q => {
      const dataPoint: any = { name: q };
      years.forEach(y => {
        const yearMultiplier = y === '2026' ? 1.4 : y === '2025' ? 1.3 : y === '2024' ? 1.2 : 1.0;
        const quarterMultiplier = q === 'Q1' ? 0.8 : q === 'Q2' ? 1.1 : q === 'Q3' ? 1.3 : 1.5;
        const baseRevenue = projectCampaigns.reduce((sum, c) => sum + (c.actualRevenue || 0), 0) / 8;
        dataPoint[y] = Math.floor(baseRevenue * yearMultiplier * quarterMultiplier);
      });
      return dataPoint;
    });
  }, [projectCampaigns]);

  const regionalRoiData = useMemo(() => {
    return filteredCampaigns.slice(0, 8).map(c => {
      const dataPoint: any = { name: c.name };
      REGIONS.forEach(region => {
        if (c.regions?.includes(region)) {
          const revenue = c.regionalRevenue?.[region] || 0;
          const cost = c.regionalCost?.[region] || (c.spent / (c.regions?.length || 1));
          const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
          dataPoint[region] = parseFloat(roi.toFixed(1));
        } else {
          dataPoint[region] = 0;
        }
      });
      return dataPoint;
    });
  }, [filteredCampaigns]);

  const regionalFunnelData = useMemo(() => {
    const stages = [
      { key: 'leadToMql', name: 'Lead → MQL' },
      { key: 'mqlToSql', name: 'MQL → SQL' },
      { key: 'sqlToRevenue', name: 'SQL → Revenue' }
    ];

    return stages.map(stage => {
      const dataPoint: any = { name: stage.name };
      REGIONS.forEach(region => {
        let totalLeads = 0;
        let totalMqls = 0;
        let totalSqls = 0;
        let totalCustomers = 0;

        filteredCampaigns.forEach(c => {
          if (c.regions?.includes(region)) {
            totalLeads += c.regionalLeads?.[region] || 0;
            totalMqls += c.regionalMqls?.[region] || 0;
            totalSqls += c.regionalSqls?.[region] || 0;
            totalCustomers += c.regionalCustomers?.[region] || 0;
          }
        });

        let rate = 0;
        if (stage.key === 'leadToMql') {
          rate = totalLeads > 0 ? (totalMqls / totalLeads) * 100 : 0;
        } else if (stage.key === 'mqlToSql') {
          rate = totalMqls > 0 ? (totalSqls / totalMqls) * 100 : 0;
        } else if (stage.key === 'sqlToRevenue') {
          rate = totalSqls > 0 ? (totalCustomers / totalSqls) * 100 : 0;
        }
        dataPoint[region] = parseFloat(rate.toFixed(1));
      });
      return dataPoint;
    });
  }, [filteredCampaigns]);

  const digitalChannelAnalysisData = useMemo(() => {
    const digitalChannels = ['LinkedIn', 'YouTube', 'Meta', 'Social', 'Google Ads', 'Email', 'Webinar'];
    return digitalChannels.map(channel => {
      const channelCampaigns = filteredCampaigns.filter(c => c.channel === channel);
      const spend = channelCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
      const revenue = channelCampaigns.reduce((sum, c) => sum + (c.actualRevenue || 0), 0);
      const clicks = channelCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
      const engagement = channelCampaigns.reduce((sum, c) => sum + (c.socialMetrics?.engagement || 0), 0);
      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
      
      return {
        name: channel,
        spend,
        revenue,
        clicks,
        engagement,
        roi
      };
    });
  }, [filteredCampaigns]);

  const regionalSubscribersData = useMemo(() => {
    return REGIONS.map(region => {
      const subscribers = filteredCampaigns.reduce((sum, c) => {
        if (c.regions?.includes(region)) {
          const totalSubscribers = c.socialMetrics?.subscribers || 0;
          const regionalWeight = (c.regionalLeads?.[region] || 0) / (c.leads || 1);
          return sum + Math.floor(totalSubscribers * (regionalWeight || (1 / (c.regions?.length || 1))));
        }
        return sum;
      }, 0);
      
      return {
        name: region,
        subscribers,
        color: regionColors[region]
      };
    });
  }, [filteredCampaigns]);

  const socialMetricsData = useMemo(() => {
    const groups = metricsGroupBy === 'region' ? REGIONS : selectedPlatforms;
    
    return groups.map(group => {
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalSpent = 0;
      let totalLeads = 0;
      let totalEngagement = 0;
      let totalSubscribers = 0;

      filteredCampaigns.forEach(c => {
        const matchesGroup = metricsGroupBy === 'region' 
          ? c.regions?.includes(group as Region)
          : c.channel === group;
        
        const matchesPlatform = selectedPlatforms.includes(c.channel);

        // Period filtering simulation
        let periodMultiplier = 1;
        if (metricsPeriod === 'Last 7 Days') periodMultiplier = 0.2;
        else if (metricsPeriod === 'Last 30 Days') periodMultiplier = 0.5;
        else if (metricsPeriod === 'This Quarter') periodMultiplier = 0.8;

        if (matchesGroup && matchesPlatform) {
          totalImpressions += (c.impressions || 0) * periodMultiplier;
          totalClicks += (c.clicks || 0) * periodMultiplier;
          totalSpent += (c.spent || 0) * periodMultiplier;
          totalLeads += (c.leads || 0) * periodMultiplier;
          totalEngagement += (c.socialMetrics?.engagement || 0) * periodMultiplier;
          totalSubscribers += (c.socialMetrics?.subscribers || 0) * periodMultiplier;
        }
      });

      const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const cpa = totalLeads > 0 ? totalSpent / totalLeads : 0;
      const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
      const cpm = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;

      return {
        name: group,
        subscribers: Math.floor(totalSubscribers),
        engagement: Math.floor(totalEngagement),
        leads: Math.floor(totalLeads),
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        ctr: parseFloat(ctr.toFixed(2)),
        cpa: parseFloat(cpa.toFixed(2)),
        cpc: parseFloat(cpc.toFixed(2)),
        cpm: parseFloat(cpm.toFixed(2)),
        spent: totalSpent
      };
    });
  }, [filteredCampaigns, metricsGroupBy, selectedPlatforms, metricsPeriod]);

  const teamPerformanceData = useMemo(() => {
    const ownersMap: Record<string, { revenue: number, spend: number, kpis: string[], campaigns: string[] }> = {};
    
    projectKpis.forEach(kpi => {
      const kpiCampaigns = projectCampaigns.filter(c => kpi.campaigns.includes(c.id));
      const kpiRevenue = kpiCampaigns.reduce((sum, c) => sum + (c.actualRevenue || 0), 0);
      const kpiSpend = kpiCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
      
      kpi.owners.forEach(owner => {
        if (!ownersMap[owner]) {
          ownersMap[owner] = { revenue: 0, spend: 0, kpis: [], campaigns: [] };
        }
        ownersMap[owner].revenue += kpiRevenue;
        ownersMap[owner].spend += kpiSpend;
        if (!ownersMap[owner].kpis.includes(kpi.name)) {
          ownersMap[owner].kpis.push(kpi.name);
        }
        kpi.campaigns?.forEach(cid => {
          if (!ownersMap[owner].campaigns.includes(cid)) {
            ownersMap[owner].campaigns.push(cid);
          }
        });
      });
    });

    return Object.entries(ownersMap).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      spend: data.spend,
      roi: data.spend > 0 ? ((data.revenue - data.spend) / data.spend) * 100 : 0,
      kpiCount: data.kpis.length,
      campaignCount: data.campaigns.length,
      kpis: data.kpis.join(', ')
    })).sort((a, b) => b.revenue - a.revenue);
  }, [projectKpis, projectCampaigns]);

  // --- Render Functions ---

  const renderWidget = (widget: DashboardWidget) => {
    const { id, title } = widget;
    
    const handleRemove = () => {
      if (isShared) return;
      const newWidgets = dashboardWidgets.map(w => 
        w.id === id ? { ...w, visible: false } : w
      );
      setDashboardWidgets(newWidgets);
    };

    switch (id) {
      case 'kpi-cards':
        return (
          <WidgetWrapper 
            key="kpi-cards" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
            <StatCard 
              title="Total Revenue" 
              value={`$${(totalRevenue / 1000000).toFixed(1)}M`} 
              icon={DollarSign} 
              trend="+12%" 
              color="emerald" 
              data={[850000, 920000, 1100000, 1200000]}
            />
            <StatCard 
              title="Marketing ROI" 
              value={`${avgRoi.toFixed(0)}%`} 
              icon={Target} 
              trend="+5%" 
              color="blue" 
              data={[42, 48, 45, 55]}
            />
            <StatCard 
              title="Total Cost" 
              value={`$${(totalSpend / 1000).toFixed(0)}K`} 
              icon={Wallet} 
              trend="-8%" 
              color="indigo" 
              data={[420000, 450000, 580000, 550000]}
            />
            <StatCard 
              title="Active Campaigns" 
              value={activeCampaignsCount.toString()} 
              icon={TrendingUp} 
              trend="+2" 
              color="rose" 
              data={[8, 10, 12, 14]}
            />
          </div>
        </WidgetWrapper>
        );

      case 'regional-revenue-cost':
        return (
          <WidgetWrapper 
            key="regional-revenue-cost" 
            title={title} 
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CRM Sync: Active</span>
                </div>
                <span className="text-[10px] text-slate-400">Last synced: 5m ago</span>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalRevenueCostData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}k`} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" />
                    <Bar dataKey="revenue" name="Revenue (CRM)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" name="Marketing Cost" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </WidgetWrapper>
        );

      case 'delayed-items':
        const delayedCampaigns = projectCampaigns.filter(c => c.status === 'paused'); // Mocking delayed as paused
        const delayedTasks = tasks.filter(t => t.status === 'delayed');
        
        return (
          <WidgetWrapper 
            key="delayed-items" 
            title={title} 
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="space-y-6 h-full overflow-auto">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delayed Campaigns</h4>
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[10px] font-bold">{delayedCampaigns?.length || 0}</span>
                </div>
                <div className="space-y-2">
                  {delayedCampaigns && delayedCampaigns.length > 0 ? delayedCampaigns.map(c => (
                    <div key={c.id} className="p-3 bg-rose-50/50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div>
                          <button 
                            onClick={() => {
                              setSelectedCampaignId(c.id);
                              setActiveScreen('campaign-details');
                            }}
                            className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline text-left"
                          >
                            {c.name}
                          </button>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Paused since {c.startDate}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  )) : (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">No delayed campaigns</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delayed Tasks</h4>
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[10px] font-bold">{delayedTasks?.length || 0}</span>
                </div>
                <div className="space-y-2">
                  {delayedTasks && delayedTasks.length > 0 ? delayedTasks.map(t => (
                    <div key={t.id} className="p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Owner: {t.owner}</p>
                            {t.priority && (
                              <span className={cn(
                                "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                t.priority === 'high' ? "bg-amber-500 text-white" :
                                t.priority === 'medium' ? "bg-blue-500 text-white" :
                                "bg-slate-400 text-white"
                              )}>
                                {t.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  )) : (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">No delayed tasks</p>
                  )}
                </div>
              </div>
            </div>
          </WidgetWrapper>
        );

      case 'campaign-performance':
        return (
          <WidgetWrapper 
            ref={campaignPerformanceRef}
            key="campaign-performance" 
            title={title} 
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="overflow-x-auto -mx-6 h-full">
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800 relative group/row-resize">
                    <th style={{ width: tableColumnWidths.campaign[0] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative group/resize">
                      Campaign
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('campaign', 0, e)}
                      />
                      <div 
                        className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-emerald-500/30 transition-colors opacity-0 group-hover/row-resize:opacity-100"
                        onMouseDown={(e) => handleRowResize('campaign', e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.campaign[1] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative group/resize">
                      KPI Owners
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('campaign', 1, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.campaign[2] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative group/resize">
                      Status
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('campaign', 2, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.campaign[3] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                      Cost
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('campaign', 3, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.campaign[4] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                      ROI
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('campaign', 4, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.campaign[5] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                      Revenue
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('campaign', 5, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.campaign[6] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative group/resize">
                      Regions
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('campaign', 6, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.campaign[7] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                      Actions
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('campaign', 7, e)}
                      />
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Megaphone className="w-8 h-8 text-slate-200" />
                          <p className="text-sm font-bold text-slate-400 italic">No campaigns found for this project or filter.</p>
                          {selectedCampaignId && (
                            <button 
                              onClick={() => setSelectedCampaignId(null)}
                              className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                            >
                              Clear selection and view all
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredCampaigns.map((c) => {
                    const isExpanded = expandedCampaignId === c.id;
                    const totalRegRevenue = Object.values(c.regionalRevenue || {}).reduce((sum, val) => sum + (val || 0), 0);
                    
                    // Get unique owners for KPIs associated with this campaign
                    const campaignKpis = projectKpis.filter(kpi => kpi.campaigns?.includes(c.id));
                    const uniqueOwners = Array.from(new Set(campaignKpis.flatMap(kpi => kpi.owners || [])));
                    
                    return (
                      <React.Fragment key={c.id}>
                        <tr 
                          style={{ height: tableRowHeights.campaign }}
                          className={cn(
                            "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer",
                            isExpanded && "bg-slate-50 dark:bg-slate-800/50"
                          )}
                          onClick={() => setExpandedCampaignId(isExpanded ? null : c.id)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold text-xs">
                                {c.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCampaignId(c.id);
                                      setActiveScreen('campaign-details');
                                    }}
                                    className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline text-left"
                                  >
                                    {c.name}
                                  </button>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{c.channel}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex -space-x-2 overflow-hidden">
                              {uniqueOwners.length > 0 ? (
                                uniqueOwners.map((owner, idx) => (
                                  <div 
                                    key={idx}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-400"
                                    title={owner}
                                  >
                                    {owner.charAt(0)}
                                  </div>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">No owners</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              c.status === 'active' ? "bg-emerald-100 text-emerald-700" : 
                              c.status === 'paused' ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-500"
                            )}>
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                c.status === 'active' ? "bg-emerald-500 animate-pulse" : 
                                c.status === 'paused' ? "bg-amber-500" :
                                "bg-slate-400"
                              )} />
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                            ${(c.spent || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                            {c.roi.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                            ${totalRegRevenue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {c.regions.map(r => (
                                <span key={r} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[9px] font-bold">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedCampaignId(c.id);
                                  setActiveScreen('campaign-details');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg transition-all active:scale-[0.95]"
                              >
                                View Details
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCampaign(c.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                title="Delete Campaign"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                            <td colSpan={9} className="px-6 py-6 border-t border-slate-100 dark:border-slate-800">
                              <div className="space-y-8">
                                {/* Automated Insight */}
                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3">
                                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                    <Sparkles className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Automated Insight</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{generateCampaignInsight(c)}</p>
                                  </div>
                                </div>

                                {/* Regional Revenue Breakdown */}
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Globe2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    Regional Revenue Breakdown
                                  </h4>
                                  <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-4">
                                    {Object.entries(c.regionalRevenue || {}).map(([region, revenue]) => (
                                      <div key={region} className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">{region}</p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">${(revenue || 0).toLocaleString()}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Regional ROI Breakdown */}
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    Regional ROI Breakdown
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left table-fixed">
                                      <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 relative group/row-resize">
                                          <th style={{ width: tableColumnWidths.regional[0] }} className="pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase relative group/resize">
                                            Region
                                            <div 
                                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                                              onMouseDown={(e) => handleTableResize('regional', 0, e)}
                                            />
                                            <div 
                                              className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-emerald-500/30 transition-colors opacity-0 group-hover/row-resize:opacity-100"
                                              onMouseDown={(e) => handleRowResize('regional', e)}
                                            />
                                          </th>
                                          <th style={{ width: tableColumnWidths.regional[1] }} className="pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase text-right relative group/resize">
                                            Revenue
                                            <div 
                                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                                              onMouseDown={(e) => handleTableResize('regional', 1, e)}
                                            />
                                          </th>
                                          <th style={{ width: tableColumnWidths.regional[2] }} className="pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase text-right relative group/resize">
                                            Cost
                                            <div 
                                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                                              onMouseDown={(e) => handleTableResize('regional', 2, e)}
                                            />
                                          </th>
                                          <th style={{ width: tableColumnWidths.regional[3] }} className="pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase text-right relative group/resize">
                                            ROI
                                            <div 
                                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                                              onMouseDown={(e) => handleTableResize('regional', 3, e)}
                                            />
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {c.regions.map(region => {
                                          const revenue = (c.regionalRevenue as any)?.[region] || 0;
                                          const cost = (c.regionalCost as any)?.[region] || 0;
                                          const regionalRoi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
                                          
                                          return (
                                            <tr key={region} style={{ height: tableRowHeights.regional }}>
                                              <td className="py-2 text-xs font-bold text-slate-700 dark:text-slate-300">{region}</td>
                                              <td className="py-2 text-xs text-slate-600 dark:text-slate-400 text-right">${revenue.toLocaleString()}</td>
                                              <td className="py-2 text-xs text-slate-600 dark:text-slate-400 text-right">${cost.toLocaleString()}</td>
                                              <td className="py-2 text-right">
                                                <span className={cn(
                                                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                  regionalRoi > 0 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                                                )}>
                                                  {regionalRoi > 0 ? '+' : ''}{regionalRoi.toFixed(1)}%
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Channel Specific Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {/* Performance Metrics */}
                                  <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                      <Activity className="w-4 h-4 text-blue-600" />
                                      Performance Funnel
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Leads</p>
                                        <p className="text-lg font-bold text-slate-900">{(c.leads || 0).toLocaleString()}</p>
                                      </div>
                                      <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">MQLs</p>
                                        <p className="text-lg font-bold text-slate-900">{(c.mqls || 0).toLocaleString()}</p>
                                      </div>
                                      <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">SQLs</p>
                                        <p className="text-lg font-bold text-slate-900">{(c.sqls || 0).toLocaleString()}</p>
                                      </div>
                                      <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Opp Value</p>
                                        <p className="text-lg font-bold text-emerald-600">${(c.opportunityValue || 0).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Channel Analysis */}
                                  <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-amber-600" />
                                      Channel-Specific Analysis
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                      {c.socialMetrics && (
                                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                          <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">Social Media</p>
                                          <div className="flex gap-6">
                                            <div><span className="text-[10px] text-slate-500">Engagement:</span> <span className="text-xs font-bold">{c.socialMetrics.engagement}</span></div>
                                            <div><span className="text-[10px] text-slate-500">Followers:</span> <span className="text-xs font-bold">{c.socialMetrics.followers}</span></div>
                                            <div><span className="text-[10px] text-slate-500">Shares:</span> <span className="text-xs font-bold">{c.socialMetrics.shares}</span></div>
                                          </div>
                                        </div>
                                      )}
                                      {c.promotionMetrics && (
                                        <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                                          <p className="text-[10px] font-bold text-rose-600 uppercase mb-2">Promotion</p>
                                          <div className="flex gap-6">
                                            <div><span className="text-[10px] text-slate-500">Redemption:</span> <span className="text-xs font-bold">{c.promotionMetrics.redemptionRate}%</span></div>
                                            <div><span className="text-[10px] text-slate-500">Coupons:</span> <span className="text-xs font-bold">{c.promotionMetrics.couponsUsed}</span></div>
                                          </div>
                                        </div>
                                      )}
                                      {c.exhibitionMetrics && (
                                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Exhibition</p>
                                          <div className="flex gap-6">
                                            <div><span className="text-[10px] text-slate-500">Leads:</span> <span className="text-xs font-bold">{c.exhibitionMetrics.leads}</span></div>
                                            <div><span className="text-[10px] text-slate-500">Meetings:</span> <span className="text-xs font-bold">{c.exhibitionMetrics.meetings}</span></div>
                                          </div>
                                        </div>
                                      )}
                                      {c.posMetrics && (
                                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                                          <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">POS</p>
                                          <div className="flex gap-6">
                                            <div><span className="text-[10px] text-slate-500">Sales Vol:</span> <span className="text-xs font-bold">{c.posMetrics.salesVolume}</span></div>
                                            <div><span className="text-[10px] text-slate-500">Footfall:</span> <span className="text-xs font-bold">{c.posMetrics.footfall}</span></div>
                                          </div>
                                        </div>
                                      )}
                                      {c.contentsMetrics && (
                                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                          <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Content</p>
                                          <div className="flex gap-6">
                                            <div><span className="text-[10px] text-slate-500">Views:</span> <span className="text-xs font-bold">{c.contentsMetrics.views}</span></div>
                                            <div><span className="text-[10px] text-slate-500">Read Time:</span> <span className="text-xs font-bold">{c.contentsMetrics.readTime}s</span></div>
                                            <div><span className="text-[10px] text-slate-500">Downloads:</span> <span className="text-xs font-bold">{c.contentsMetrics.downloads}</span></div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </WidgetWrapper>
        );

      case 'funnel-analysis':
        return (
          <WidgetWrapper 
            key="funnel-analysis" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={(props) => {
                      const { x, y, payload } = props;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <title>{FUNNEL_TOOLTIPS[payload.value] || ''}</title>
                          <text
                            x={-10}
                            y={0}
                            dy={4}
                            textAnchor="end"
                            fill="#64748b"
                            fontSize={12}
                            className="cursor-help font-bold"
                          >
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetWrapper>
        );

      case 'channel-performance':
        return (
          <WidgetWrapper 
            key="channel-performance" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="flex flex-col h-full">
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                    value={dashboardFilters.period}
                    onChange={(e) => setDashboardFilters({ period: e.target.value as any })}
                    className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 focus:ring-1 focus:ring-emerald-500/20"
                  >
                    <option value="All">All Time</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="This Quarter">This Quarter</option>
                    <option value="This Year">This Year</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                    value={dashboardFilters.region}
                    onChange={(e) => setDashboardFilters({ region: e.target.value as any })}
                    className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 focus:ring-1 focus:ring-emerald-500/20"
                  >
                    <option value="All">All Regions</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Channels:</span>
                  <div className="flex gap-1">
                    {['Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'YouTube', 'TikTok'].map(ch => {
                      const isVisible = dashboardFilters.visibleChannels.includes(ch);
                      return (
                        <button
                          key={ch}
                          onClick={() => {
                            const newChannels = isVisible 
                              ? dashboardFilters.visibleChannels.filter(c => c !== ch)
                              : [...dashboardFilters.visibleChannels, ch];
                            setDashboardFilters({ visibleChannels: newChannels });
                          }}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[9px] font-bold transition-all",
                            isVisible ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          )}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 flex-1">
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 relative group/row-resize">
                      <th style={{ width: tableColumnWidths.channel[0] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative group/resize">
                        Channel
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 0, e)}
                        />
                        <div 
                          className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-emerald-500/30 transition-colors opacity-0 group-hover/row-resize:opacity-100"
                          onMouseDown={(e) => handleRowResize('channel', e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.channel[1] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                        Subscribers
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 1, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.channel[2] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                        Engagement
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 2, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.channel[3] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                        Eng. Rate
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 3, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.channel[4] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                        Leads
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 4, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.channel[5] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                        CTR
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 5, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.channel[6] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                        CPC
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 6, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.channel[7] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                        CPM
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 7, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.channel[8] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                        CPA
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 8, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.channel[9] }} className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                        ROI
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('channel', 9, e)}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {channelPerformanceData.map((row, i) => (
                      <tr key={i} style={{ height: tableRowHeights.channel }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              row.channel === 'Facebook' ? 'bg-blue-600' :
                              row.channel === 'Instagram' ? 'bg-pink-600' :
                              row.channel === 'LinkedIn' ? 'bg-blue-800' :
                              row.channel === 'Google Ads' ? 'bg-red-500' :
                              row.channel === 'YouTube' ? 'bg-red-600' : 'bg-black'
                            )} />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{row.channel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-right font-mono">{row.subscribers.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-right font-mono">{row.engagement.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-right font-mono">{row.engagementRate}%</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-right font-mono">{row.leads}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-right font-mono">{row.ctr}%</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-right font-mono">${row.cpc}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-right font-mono">${row.cpm}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-right font-mono">${row.cpa}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded-lg",
                            row.roi > 0 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                          )}>
                            {row.roi > 0 ? '+' : ''}{row.roi.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </WidgetWrapper>
        );

      case 'customer-attribution':
        return (
          <WidgetWrapper 
            key="customer-attribution" 
            title={title} 
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="overflow-x-auto -mx-6 h-full">
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800 relative group/row-resize">
                    <th style={{ width: tableColumnWidths.customer[0] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative group/resize">
                      Customer
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('customer', 0, e)}
                      />
                      <div 
                        className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-emerald-500/30 transition-colors opacity-0 group-hover/row-resize:opacity-100"
                        onMouseDown={(e) => handleRowResize('customer', e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.customer[1] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative group/resize">
                      Region
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('customer', 1, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.customer[2] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right relative group/resize">
                      Revenue
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('customer', 2, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.customer[3] }} className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative group/resize">
                      Status
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('customer', 3, e)}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {customers.slice(0, 5).map((customer) => (
                    <tr key={customer.id} style={{ height: tableRowHeights.customer }} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xs">
                            {customer.companyName.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{customer.companyName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{customer.region}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                        ${(customer.revenue || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          customer.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WidgetWrapper>
        );

      case 'revenue-cost-trend':
        return (
          <WidgetWrapper 
            key="revenue-cost-trend" 
            title={title} 
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { date: 'Oct 25', revenue: 850000, cost: 420000 },
                  { date: 'Nov 25', revenue: 920000, cost: 450000 },
                  { date: 'Dec 25', revenue: 1100000, cost: 580000 },
                  { date: 'Jan 26', revenue: 980000, cost: 510000 },
                  { date: 'Feb 26', revenue: 1050000, cost: 490000 },
                  { date: 'Mar 26', revenue: 1200000, cost: 550000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="cost" name="Cost" stroke="#94a3b8" strokeWidth={2} fill="#94a3b8" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </WidgetWrapper>
        );

      case 'channel-indicators':
        return (
          <WidgetWrapper 
            key="channel-indicators" 
            title={title} 
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-auto">
              {filteredCampaigns.slice(0, 3).map(c => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Megaphone className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-700">{c.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Leads</span>
                      <span className="font-bold text-slate-900">{c.leads || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">MQL Rate</span>
                      <span className="font-bold text-slate-900">{c.mqlRate || 0}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">ROI</span>
                      <span className="font-bold text-emerald-600">{c.roi.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </WidgetWrapper>
        );

      case 'budget-tracking':
        return (
          <WidgetWrapper 
            key="budget-tracking" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="space-y-4 h-full overflow-auto">
              {filteredCampaigns.slice(0, 5).map(c => {
                const percentage = (c.spent / c.budget) * 100;
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700">{c.name}</span>
                      <span className="text-slate-400">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", percentage > 90 ? "bg-rose-500" : "bg-emerald-500")} 
                        style={{ width: `${Math.min(percentage, 100)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </WidgetWrapper>
        );

      case 'budget-allocation-execution':
        return (
          <WidgetWrapper 
            key="budget-allocation-execution" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetAllocationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Bar dataKey="budget" name="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetWrapper>
        );

      case 'automation-rules':
        return (
          <WidgetWrapper 
            key="automation-rules" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="space-y-3 h-full overflow-auto">
              {[
                { id: 1, text: 'Pause if ROI < 2.0x', active: true },
                { id: 2, text: 'Alert if Cost/MQL > $500', active: true },
                { id: 3, text: 'Increase budget if SQL Rate > 30%', active: false },
              ].map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-medium text-slate-700">{rule.text}</span>
                  <div className={cn("w-2 h-2 rounded-full", rule.active ? "bg-emerald-500" : "bg-slate-300")} />
                </div>
              ))}
            </div>
          </WidgetWrapper>
        );

      case 'cohort-analysis':
        return (
          <WidgetWrapper 
            key="cohort-analysis" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <CohortAnalysis />
          </WidgetWrapper>
        );

      case 'revenue-by-period':
        return (
          <WidgetWrapper 
            key="revenue-by-period" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByPeriodData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Bar dataKey="2023" name="2023 Revenue" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="2024" name="2024 Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="2025" name="2025 Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="2026" name="2026 Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetWrapper>
        );

      case 'regional-performance':
        return (
          <WidgetWrapper 
            key="regional-performance" 
            title="Regional Performance Table" 
            widget={widget}
            onRemove={handleRemove}
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th style={{ width: tableColumnWidths.regional[0] }} className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left relative group/resize">
                      Region
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400/50 opacity-0 group-hover/resize:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleTableResize('regional', 0, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.regional[1] }} className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      Revenue
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400/50 opacity-0 group-hover/resize:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleTableResize('regional', 1, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.regional[2] }} className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      Cost
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400/50 opacity-0 group-hover/resize:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleTableResize('regional', 2, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.regional[3] }} className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      ROI
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400/50 opacity-0 group-hover/resize:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleTableResize('regional', 3, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.regional[4] }} className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      Leads
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400/50 opacity-0 group-hover/resize:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleTableResize('regional', 4, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.regional[5] }} className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      MQLs
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400/50 opacity-0 group-hover/resize:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleTableResize('regional', 5, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.regional[6] }} className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      SQLs
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400/50 opacity-0 group-hover/resize:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleTableResize('regional', 6, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.regional[7] }} className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      Wins
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400/50 opacity-0 group-hover/resize:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleTableResize('regional', 7, e)}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {regionalPerformanceData.map((data) => (
                    <tr key={data.name} style={{ height: tableRowHeights.regional }} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                          <span className="text-sm font-bold text-slate-700">{data.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-medium text-slate-600">${data.revenue.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-medium text-slate-600">${data.cost.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
                          data.roi > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {data.roi > 0 ? '+' : ''}{data.roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-medium text-slate-600">{data.leads.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-medium text-slate-600">{data.mqls.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-medium text-slate-600">{data.sqls.toLocaleString()}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-medium text-slate-600">{data.customers.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WidgetWrapper>
        );

      case 'regional-roi-breakdown':
        return (
          <WidgetWrapper 
            key="regional-roi-breakdown" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalRoiData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }} 
                    angle={-45} 
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    tickFormatter={(val) => `${val}%`} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  {REGIONS.map(region => (
                    <Bar 
                      key={region} 
                      dataKey={region} 
                      name={region} 
                      fill={regionColors[region]} 
                      radius={[4, 4, 0, 0]} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetWrapper>
        );

      case 'regional-conversion-funnel':
        return (
          <WidgetWrapper 
            key="regional-conversion-funnel" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="h-full w-full flex flex-col">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalFunnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      tickFormatter={(val) => `${val}%`} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" />
                    {REGIONS.map(region => (
                      <Bar 
                        key={region} 
                        dataKey={region} 
                        name={region} 
                        fill={regionColors[region]} 
                        radius={[4, 4, 0, 0]} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Insight & Interpretation</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This chart compares conversion efficiency across regions at each stage of the sales cycle. 
                  A higher <span className="font-medium text-slate-900">Lead → MQL</span> rate indicates better marketing alignment with regional audiences. 
                  A drop in <span className="font-medium text-slate-900">MQL → SQL</span> suggests a gap between marketing qualification and sales readiness. 
                  The <span className="font-medium text-slate-900">SQL → Revenue</span> (Win Rate) highlights regional sales effectiveness. 
                  Compare regional bars to identify where specific territories are over-performing or require process optimization.
                </p>
              </div>
            </div>
          </WidgetWrapper>
        );

      case 'social-media-metrics':
        return (
          <WidgetWrapper 
            key="social-media-metrics" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="h-full w-full flex flex-col gap-6">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period:</span>
                  <select 
                    value={metricsPeriod}
                    onChange={(e) => setMetricsPeriod(e.target.value)}
                    className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Group By:</span>
                  <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
                    <button 
                      onClick={() => setMetricsGroupBy('channel')}
                      className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md transition-all",
                        metricsGroupBy === 'channel' ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      Channel
                    </button>
                    <button 
                      onClick={() => setMetricsGroupBy('region')}
                      className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md transition-all",
                        metricsGroupBy === 'region' ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      Region
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platforms:</span>
                  <div className="flex flex-wrap gap-1">
                    {SOCIAL_PLATFORMS.map(platform => (
                      <button
                        key={platform}
                        onClick={() => {
                          setSelectedPlatforms(prev => 
                            prev.includes(platform) 
                              ? prev.filter(p => p !== platform)
                              : [...prev, platform]
                          );
                        }}
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all",
                          selectedPlatforms.includes(platform)
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-48 min-h-[192px]">
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">CPA Comparison ($)</h4>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={socialMetricsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="cpa" name="CPA" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Engagement Rate (%)</h4>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={socialMetricsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="engagementRate" name="ER" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="border-b border-slate-100 relative group/row-resize">
                      <th style={{ width: tableColumnWidths.social[0] }} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                        {metricsGroupBy === 'region' ? 'Region' : 'Channel'}
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('social', 0, e)}
                        />
                        <div 
                          className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-emerald-500/30 transition-colors opacity-0 group-hover/row-resize:opacity-100"
                          onMouseDown={(e) => handleRowResize('social', e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.social[1] }} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                        Subscribers
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('social', 1, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.social[2] }} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                        Engagement
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('social', 2, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.social[3] }} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                        Leads
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('social', 3, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.social[4] }} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                        ER
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('social', 4, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.social[5] }} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                        CTR
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('social', 5, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.social[6] }} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                        CPC
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('social', 6, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.social[7] }} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                        CPM
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('social', 7, e)}
                        />
                      </th>
                      <th style={{ width: tableColumnWidths.social[8] }} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                        CPA
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                          onMouseDown={(e) => handleTableResize('social', 8, e)}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {socialMetricsData.map((row, idx) => (
                      <tr key={idx} style={{ height: tableRowHeights.social }} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-xs font-bold text-slate-900">{row.name}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 font-medium">{row.subscribers.toLocaleString()}</td>
                        <td className="py-3 px-4 text-xs text-slate-600 font-medium">{row.engagement.toLocaleString()}</td>
                        <td className="py-3 px-4 text-xs text-slate-600 font-medium">{row.leads.toLocaleString()}</td>
                        <td className="py-3 px-4 text-xs text-slate-900 font-bold text-right">{row.engagementRate}%</td>
                        <td className="py-3 px-4 text-xs text-slate-900 font-bold text-right">{row.ctr}%</td>
                        <td className="py-3 px-4 text-xs text-slate-900 font-bold text-right">${row.cpc}</td>
                        <td className="py-3 px-4 text-xs text-slate-900 font-bold text-right">${row.cpm}</td>
                        <td className="py-3 px-4 text-xs text-emerald-600 font-bold text-right">${row.cpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </WidgetWrapper>
        );

      case 'team-performance':
        return (
          <WidgetWrapper 
            key="team-performance" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="overflow-x-auto -mx-6 h-full">
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-100 relative group/row-resize">
                    <th style={{ width: tableColumnWidths.team[0] }} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                      Owner
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('team', 0, e)}
                      />
                      <div 
                        className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-emerald-500/30 transition-colors opacity-0 group-hover/row-resize:opacity-100"
                        onMouseDown={(e) => handleRowResize('team', e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.team[1] }} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center relative group/resize">
                      KPIs
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('team', 1, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.team[2] }} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center relative group/resize">
                      Campaigns
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('team', 2, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.team[3] }} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      Revenue
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('team', 3, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.team[4] }} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      Spend
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('team', 4, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.team[5] }} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right relative group/resize">
                      ROI
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('team', 5, e)}
                      />
                    </th>
                    <th style={{ width: tableColumnWidths.team[6] }} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider relative group/resize">
                      KPIs List
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/30 transition-colors"
                        onMouseDown={(e) => handleTableResize('team', 6, e)}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamPerformanceData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="text-sm font-bold text-slate-400 italic">No team performance data available.</p>
                      </td>
                    </tr>
                  )}
                  {teamPerformanceData.map((data) => (
                    <tr key={data.name} style={{ height: tableRowHeights.team }} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-xs">
                            {data.name.charAt(0)}
                          </div>
                          <p className="font-bold text-slate-900 text-sm">{data.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-slate-600">
                        {data.kpiCount}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-slate-600">
                        {data.campaignCount}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                        ${data.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                        ${data.spend.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                        {data.roi.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {data.kpis.split(', ').map(kpi => (
                            <span key={kpi} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold">
                              {kpi}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WidgetWrapper>
        );

      case 'digital-channel-analysis':
        return (
          <WidgetWrapper 
            key="digital-channel-analysis" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="h-full flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-1/2">
                <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Clicks & Engagement by Channel</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={digitalChannelAnalysisData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                        <Bar dataKey="clicks" name="Clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="engagement" name="Engagement" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">ROI by Digital Channel (%)</h4>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={digitalChannelAnalysisData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="roi" name="ROI %" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3">Channel</th>
                      <th className="pb-3 text-right">Spend</th>
                      <th className="pb-3 text-right">Revenue</th>
                      <th className="pb-3 text-right">ROI</th>
                      <th className="pb-3 text-right">Clicks</th>
                      <th className="pb-3 text-right">Engagement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {digitalChannelAnalysisData.map(d => (
                      <tr key={d.name} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{d.name}</td>
                        <td className="py-3 text-xs font-medium text-slate-600 dark:text-slate-400 text-right">${d.spend.toLocaleString()}</td>
                        <td className="py-3 text-xs font-medium text-slate-600 dark:text-slate-400 text-right">${d.revenue.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <span className={cn(
                            "text-xs font-bold",
                            d.roi >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {d.roi.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 text-xs font-medium text-slate-600 dark:text-slate-400 text-right">{d.clicks.toLocaleString()}</td>
                        <td className="py-3 text-xs font-medium text-slate-600 dark:text-slate-400 text-right">{d.engagement.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </WidgetWrapper>
        );

      case 'regional-subscribers':
        return (
          <WidgetWrapper 
            key="regional-subscribers" 
            title={title}
            isCustomizing={isCustomizing}
            isShared={isShared}
            onRemove={handleRemove}
          >
            <div className="h-full flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionalSubscribersData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="subscribers"
                    >
                      {regionalSubscribersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4 content-center">
                {regionalSubscribersData.map(d => (
                  <div key={d.name} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{d.name}</p>
                    <div className="flex items-end justify-between">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">{d.subscribers.toLocaleString()}</h4>
                      <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                        <TrendingUp className="w-3 h-3" />
                        +12%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </WidgetWrapper>
        );

      default:
        return null;
    }
  };

  const handleLayoutChange = (currentLayout: any[], allLayouts: any) => {
    // We primarily update based on the 'lg' layout or the current one if it's the most relevant
    // For simplicity and to maintain the user's intent across sessions, we update the main store
    const newWidgets = dashboardWidgets.map(widget => {
      const layoutItem = currentLayout.find(l => l.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        };
      }
      return widget;
    });
    setDashboardWidgets(newWidgets);
  };

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 min-h-0 h-full bg-slate-50 overflow-auto p-8 relative scroll-smooth">
      {isShared && (
        <div className="mb-8 flex items-center justify-between bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Layout className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Marketing Dashboard</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Globe2 className="w-4 h-4" />
                <span>Shared View (Read-Only)</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>{currentProject?.name}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Last updated
            </div>
            <div className="text-slate-900 font-bold text-sm">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      )}

      {/* --- Advanced Filters --- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-wrap items-center gap-6">
        {selectedCampaignId ? (
          <div className="flex items-center gap-4 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Viewing Campaign</p>
                <p className="text-sm font-bold text-slate-900">{selectedCampaign?.name}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedCampaignId(null)}
              className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <select 
                value={dashboardFilters.region}
                onChange={(e) => setDashboardFilters({ region: e.target.value as any })}
                className="text-sm font-bold text-slate-700 bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Regions</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select 
                value={dashboardFilters.year}
                onChange={(e) => setDashboardFilters({ year: e.target.value })}
                className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={dashboardFilters.quarter}
                onChange={(e) => setDashboardFilters({ quarter: e.target.value })}
                className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Quarters</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <select 
                value={dashboardFilters.month}
                onChange={(e) => setDashboardFilters({ month: e.target.value })}
                className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Months</option>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!isShared && (
            <>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-sm transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button 
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
                  isCustomizing ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Settings2 className="w-4 h-4" />
                {isCustomizing ? "Done Customizing" : "Customize Dashboard"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- Share Dialog --- */}
      <AnimatePresence>
        {isShareDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Share Dashboard</h3>
                <button 
                  onClick={() => setIsShareDialogOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Public Share Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono truncate">
                      {shareUrl}
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className={cn(
                        "px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                        copySuccess ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                      )}
                    >
                      {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      {copySuccess ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      currentProject?.isPublic ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                    )}>
                      <Globe2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Public Access</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Allow anyone with the link to view</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => currentProjectId && updateProject(currentProjectId, { isPublic: !currentProject?.isPublic })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      currentProject?.isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      currentProject?.isPublic ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex gap-3">
                  <Globe2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    {currentProject?.isPublic 
                      ? "Anyone with this link can view a read-only version of your team dashboard. No login required."
                      : "Only members of this project can view the dashboard using this link. Enable Public Access to share with others."}
                  </p>
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => setIsShareDialogOpen(false)}
                  className="px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Widget Customization Panel --- */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900/30 shadow-sm bg-emerald-50/30 dark:bg-emerald-900/10">
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Toggle Dashboard Widgets
              </h4>
              <div className="flex flex-wrap gap-3">
                {dashboardWidgets.map(widget => (
                  <button
                    key={widget.id}
                    onClick={() => {
                      const newWidgets = dashboardWidgets.map(w => 
                        w.id === widget.id ? { ...w, visible: !w.visible } : w
                      );
                      setDashboardWidgets(newWidgets);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      widget.visible 
                        ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm" 
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 grayscale"
                    )}
                  >
                    {widget.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {widget.title}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Dashboard Widgets Grid --- */}
      <div className="pb-20">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ 
            lg: dashboardWidgets.filter(w => w.visible).map(w => ({ 
              i: w.id, 
              x: w.x, 
              y: w.y, 
              w: w.w, 
              h: w.h, 
              minW: 2, 
              minH: 3 
            })) 
          }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          draggableHandle=".drag-handle"
          isDraggable={isCustomizing}
          isResizable={isCustomizing}
          onLayoutChange={handleLayoutChange}
          margin={[16, 16]}
          useCSSTransforms={true}
          resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's']}
        >
      {dashboardWidgets
            .filter(w => w.visible)
            .map(widget => renderWidget(widget))
          }
        </ResponsiveGridLayout>
      </div>
      <ConfirmationModal 
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone and will unlink all associated KPIs."
      />

      {/* --- Back to Top Button --- */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-4 bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-600/40 hover:bg-emerald-700 transition-all z-[60] group"
          >
            <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
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
            className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
