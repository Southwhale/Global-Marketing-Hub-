export interface AlertSettings {
  budgetAlert80: boolean;
  costSpike15: boolean;
  mqlRateDrop: boolean;
  roiUnder2: boolean;
  campaignPaused: boolean;
  adRejected: boolean;
  aiMqlRefinement: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  projects?: string[];
  dashboardLayouts?: Record<string, DashboardWidget[]>;
  lastActive?: string;
  theme?: 'light' | 'dark';
  language?: string;
  crmConfig?: CRMConfig;
  powerBIConfig?: PowerBIConfig;
  alertSettings?: AlertSettings;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId?: string;
  members?: string[];
  memberRoles?: Record<string, string>;
  defaultWidgets?: DashboardWidget[];
  isPublic?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  status: 'New' | 'MQL' | 'SQL' | 'Opportunity' | 'Closed';
  score: number;
  fitScore: number;
  intentScore: number;
  lastActivity: string;
  crmId?: string;
}

export interface CRMConfig {
  provider: 'Dynamics365' | 'Salesforce' | 'HubSpot';
  connected: boolean;
  lastSync?: string;
}

export interface PowerBIConfig {
  workspaceId: string;
  reportId: string;
  embedUrl: string;
  connected: boolean;
}

export type Screen = 'landing' | 'dashboard' | 'settings' | 'alerts' | 'team' | 'kpi' | 'crm' | 'campaign-details' | 'kpi-details' | 'support' | 'performance';

export type WidgetId = 
  | 'kpi-cards' 
  | 'powerbi-insights'
  | 'regional-revenue-cost' 
  | 'campaign-performance' 
  | 'funnel-analysis' 
  | 'channel-performance' 
  | 'customer-attribution'
  | 'revenue-cost-trend'
  | 'channel-indicators'
  | 'budget-tracking'
  | 'budget-allocation-execution'
  | 'automation-rules'
  | 'cohort-analysis'
  | 'revenue-by-period'
  | 'regional-roi-breakdown'
  | 'regional-conversion-funnel'
  | 'social-media-metrics'
  | 'digital-channel-analysis'
  | 'regional-subscribers'
  | 'team-performance'
  | 'regional-performance'
  | 'delayed-items'
  | 'crm-performance'
  | 'team-member-kpi-progress'
  | 'kpi-targets-performance';

export interface DashboardWidget {
  id: WidgetId;
  title: string;
  visible: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: {
    regions?: Region[];
    metrics?: string[];
    displayType?: 'table' | 'grid' | 'chart';
  };
}

export type Region = string;

export interface TimeSeriesMetric {
  period: number; // Month number since start (0, 1, 2...)
  spend: number;
  mqls: number;
  sqls: number;
  opportunityValue: number;
  revenue: number;
  impressions?: number;
  clicks?: number;
}

export interface Campaign {
  id: string;
  projectId: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  roi: number;
  budget: number;
  spent: number;
  q4Target?: number;
  q4Actual?: number;
  targetRevenue?: number;
  actualRevenue?: number;
  regionalRevenue?: Record<Region, number>;
  regionalCost?: Record<Region, number>;
  regionalLeads?: Record<Region, number>;
  regionalMqls?: Record<Region, number>;
  regionalSqls?: Record<Region, number>;
  regionalCustomers?: Record<Region, number>;
  startDate: string;
  endDate: string;
  regions: Region[];
  currency: string;
  exchangeRate: number;
  channel: 'LinkedIn' | 'Google Ads' | 'Email' | 'Webinar' | 'YouTube' | 'Meta' | 'Social' | 'Promotion' | 'Exhibition' | 'POS' | 'Contents' | 'Instagram' | 'TikTok';
  campaignType: 'Content' | 'Promotion' | 'Event' | 'Webinar' | 'ABM' | 'Brand';
  pipelineValue?: number;
  opportunityValue?: number;
  leads?: number;
  mqls?: number;
  sqls?: number;
  opportunities?: number;
  mqlRate?: number;
  sqlRate?: number;
  opportunityRate?: number;
  costPerMql?: number;
  impressions?: number;
  clicks?: number;
  views?: number;
  reach?: number;
  // Channel specific indicators
  socialMetrics?: { engagement?: number; followers?: number; shares?: number; subscribers?: number };
  promotionMetrics?: { redemptionRate?: number; couponsUsed?: number };
  exhibitionMetrics?: { leads?: number; meetings?: number };
  posMetrics?: { salesVolume?: number; footfall?: number };
  contentsMetrics?: { views?: number; readTime?: number; downloads?: number };
  performanceOverTime?: TimeSeriesMetric[];
}

export interface B2BCustomer {
  id: string;
  companyName: string;
  industry?: string;
  region: Region;
  country: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'prospect' | 'churned';
  tier?: string;
  totalRevenue?: number;
  buyerCode?: string;
  lastActivity?: string;
  revenue?: number;
  quantity?: number;
  employees?: number;
  website?: string;
}

export interface FunnelStep {
  name: string;
  value: number;
  fill: string;
}

export interface Schedule {
  id: string;
  name?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  assignee: string;
  alarm: boolean;
  cost: number;
  description: string;
  regionCosts?: Record<string, number>;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string;
}

export interface Notification {
  id: string;
  taskId: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'mention' | 'alarm' | 'system';
}

export interface TeamComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  userAvatar: string;
  userHandle: string;
  text: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  mentions?: string[];
}

export interface Task {
  id: string;
  projectId: string;
  campaignId: string;
  kpiId?: string;
  name: string;
  owner: string;
  status: 'todo' | 'in-progress' | 'completed' | 'delayed';
  priority?: 'low' | 'medium' | 'high';
  budget: number;
  spent: number;
  activityCost?: number;
  executionCost?: number;
  targetRevenue?: number;
  actualRevenue?: number;
  regionalRevenue?: Record<Region, number>;
  roi?: number;
  currency?: string;
  regions?: Region[];
  customers?: string[];
  collaborators?: string[];
  attachments?: Attachment[];
  regionCosts: Record<Region, number>; // e.g., { 'LATAM': 5000 }
  schedules: Schedule[];
  comments: Comment[];
  dueDate?: string;
  description?: string;
}

export interface KPI {
  id: string; // e.g., B2D-01
  projectId: string;
  name: string;
  owners: string[];
  statement: string;
  targets: { q1: number; q2: number; q3: number; q4: number };
  monthlyTargets?: Record<string, number>; // e.g., { "2024-01": 100 }
  yearlyTarget?: number;
  unit: string;
  pillar: string;
  theme: string;
  campaigns: string[]; // Campaign IDs
  tasks?: string[]; // Task IDs
  defaultBudget?: number;
  defaultTargetRevenue?: number;
  historicalPerformance?: number[]; // [Q1, Q2, Q3, Q4] performance
  regionalCost?: Record<Region, number>;
}

export interface PerformanceEntry {
  id: string;
  projectId: string;
  campaignId: string;
  kpiId: string;
  customer?: string;
  region: Region;
  country?: string;
  date: string;
  value: number; // Generic value for KPI tracking
  revenue: number;
  cost: number;
  leads: number;
  mqls: number;
  sqls: number;
  customers: number;
  clicks: number;
  impressions: number;
  engagement: number;
  subscribers: number;
  views?: number;
  reach?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  source?: string;
  notes?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  lastActive: string;
  status: 'active' | 'away' | 'offline';
  avatar: string;
}

export interface Invitation {
  id: string;
  email: string;
  projectId: string;
  teamName: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined';
  token?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  isPrivate: boolean;
  replies: SupportReply[];
}

export interface SupportReply {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  isAdmin: boolean;
}
