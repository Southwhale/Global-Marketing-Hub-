import { create } from 'zustand';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db, googleProvider, microsoftProvider, handleFirestoreError, OperationType } from './firebase';
import { 
  Campaign, 
  KPI, 
  Lead, 
  Task, 
  Project, 
  Screen, 
  PowerBIConfig, 
  TeamMember,
  Invitation,
  Region,
  DashboardWidget,
  Notification,
  B2BCustomer,
  CRMConfig,
  User,
  AlertSettings,
  SupportTicket,
  SupportReply,
  PerformanceEntry,
  TeamComment
} from './types';
import { REGIONS } from './constants';

interface AppState {
  // Auth State
  user: FirebaseUser | null;
  userProfile: User | null;
  isAuthReady: boolean;
  login: (provider: 'google') => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;

  // Data State
  projects: Project[];
  currentProjectId: string;
  kpis: KPI[];
  campaigns: Campaign[];
  tasks: Task[];
  leads: Lead[];
  teamMembers: TeamMember[];
  invitations: Invitation[];
  notifications: Notification[];
  customers: B2BCustomer[];
  regions: Region[];
  crmConfig: CRMConfig;
  supportTickets: SupportTicket[];
  performanceEntries: PerformanceEntry[];
  teamComments: TeamComment[];
  
  // UI State
  activeScreen: Screen;
  selectedCampaignId: string | null;
  selectedKpiId: string | null;
  selectedTaskId: string | null;
  powerBIConfig: PowerBIConfig;
  dashboardFilters: {
    region: Region | 'All';
    year: string;
    quarter: string;
    month: string;
    visibleChannels: string[];
    period: 'All' | 'Last 7 Days' | 'Last 30 Days' | 'This Quarter' | 'This Year';
  };
  projectWidgets: Record<string, DashboardWidget[]>;
  theme: 'light' | 'dark';
  language: string;
  alertSettings: AlertSettings;

  // Actions
  setActiveScreen: (screen: Screen) => void;
  setSelectedCampaignId: (id: string | null) => void;
  setSelectedKpiId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setPowerBIConfig: (config: Partial<PowerBIConfig>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  setCurrentProjectId: (id: string) => void;
  fetchProjectById: (id: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setDashboardFilters: (filters: Partial<AppState['dashboardFilters']>) => void;
  setProjectWidgets: (projectId: string, widgets: DashboardWidget[]) => void;
  setKpis: (kpis: KPI[]) => void;
  updateKpi: (id: string, updates: Partial<KPI>) => Promise<void>;
  addKpi: (kpi: KPI) => Promise<void>;
  deleteKpi: (id: string) => Promise<void>;
  bulkAddKpis: (kpis: KPI[]) => Promise<void>;
  bulkDeleteKpis: (ids: string[]) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addTeamMember: (member: TeamMember) => void;
  inviteTeamMember: (email: string, role: string) => Promise<void>;
  removeTeamMember: (uid: string) => Promise<void>;
  updateTeamMemberRole: (uid: string, role: string) => Promise<void>;
  addCustomer: (customer: B2BCustomer) => void;
  bulkAddCustomers: (customers: B2BCustomer[]) => void;
  updateCustomer: (id: string, updates: Partial<B2BCustomer>) => void;
  deleteCustomer: (id: string) => void;
  bulkDeleteCustomers: (ids: string[]) => void;
  addRegion: (region: Region) => Promise<void>;
  updateRegion: (oldRegion: Region, newRegion: Region) => Promise<void>;
  deleteRegion: (region: Region) => Promise<void>;
  setCRMConfig: (config: Partial<CRMConfig>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  setAlertSettings: (settings: Partial<AlertSettings>) => Promise<void>;
  addSupportTicket: (ticket: { subject: string; message: string; isPrivate: boolean }) => Promise<void>;
  addSupportReply: (ticketId: string, message: string, isAdmin: boolean) => Promise<void>;
  resolveSupportTicket: (ticketId: string) => Promise<void>;
  addPerformanceEntry: (entry: PerformanceEntry) => Promise<void>;
  bulkAddPerformanceEntries: (entries: PerformanceEntry[]) => Promise<void>;
  updatePerformanceEntry: (id: string, updates: Partial<PerformanceEntry>) => Promise<void>;
  deletePerformanceEntry: (id: string) => Promise<void>;
  joinProjectByToken: (token: string) => Promise<void>;
  addTeamComment: (text: string) => Promise<void>;
  updateTeamComment: (id: string, text: string) => Promise<void>;
  deleteTeamComment: (id: string) => Promise<void>;
  
  // Async Actions
  acceptInvitation: (id: string) => Promise<void>;
  createProject: (name: string, description: string) => Promise<void>;
  initializeAuth: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  userProfile: null,
  isAuthReady: false,
  projects: [
    {
      id: 'p1',
      name: 'Digital Marketing Excellence',
      description: 'Main project for tracking all digital channel performance and KPIs.',
      ownerId: 'tm1',
      members: ['tm1', 'tm2', 'tm3', 'tm4'],
      createdAt: new Date().toISOString(),
      isPublic: true
    }
  ],
  currentProjectId: '',
  kpis: [],
  campaigns: [],
  tasks: [],
  leads: [],
  teamMembers: [],
  invitations: [],
  notifications: [],
  customers: [],
  supportTickets: [],
  teamComments: [],
  regions: REGIONS,
  performanceEntries: [],
  crmConfig: { provider: 'Dynamics365', connected: false },
  activeScreen: 'dashboard',
  selectedCampaignId: null,
  selectedKpiId: null,
  selectedTaskId: null,
  powerBIConfig: {
    workspaceId: '',
    reportId: '',
    embedUrl: '',
    connected: false
  },
  dashboardFilters: {
    region: 'All',
    year: new Date().getFullYear().toString(),
    quarter: 'All',
    month: 'All',
    visibleChannels: ['Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'YouTube', 'TikTok'],
    period: 'All',
  },
  projectWidgets: {},
  theme: 'light',
  language: 'ko',
  alertSettings: {
    budgetAlert80: true,
    costSpike15: true,
    mqlRateDrop: true,
    roiUnder2: true,
    campaignPaused: true,
    adRejected: true,
    aiMqlRefinement: true
  },

  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),
  setSelectedKpiId: (id) => set({ selectedKpiId: id }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setPowerBIConfig: async (config) => {
    set((state) => ({
      powerBIConfig: { ...state.powerBIConfig, ...config }
    }));
    const { user } = get();
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { powerBIConfig: { ...get().powerBIConfig, ...config } });
    }
  },
  updateLead: async (id, updates) => {
    set((state) => ({
      leads: state.leads.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
    const { user } = get();
    if (user) {
      try {
        await updateDoc(doc(db, 'leads', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
      }
    }
  },
  setDashboardFilters: (filters) => set((state) => ({ 
    dashboardFilters: { ...state.dashboardFilters, ...filters } 
  })),
  setProjectWidgets: async (projectId, widgets) => {
    if (!projectId) return;
    
    const { user, userProfile, projects } = get();
    set((state) => ({
      projectWidgets: { ...state.projectWidgets, [projectId]: widgets }
    }));

    if (user) {
      // Save to user's personal layout
      const userRef = doc(db, 'users', user.uid);
      const updatedLayouts = { ...(userProfile?.dashboardLayouts || {}), [projectId]: widgets };
      await updateDoc(userRef, { dashboardLayouts: updatedLayouts });

      // If user is the owner of the project, also save to project's defaultWidgets
      const project = projects.find(p => p.id === projectId);
      if (project && project.ownerId === user.uid) {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { defaultWidgets: widgets });
      }
    }
  },
  setKpis: (kpis) => set({ kpis }),
  updateKpi: async (id, updates) => {
    if (!id) return;
    set((state) => ({
      kpis: state.kpis.map(k => k.id === id ? { ...k, ...updates } : k)
    }));
    const { user } = get();
    if (user) {
      try {
        await updateDoc(doc(db, 'kpis', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `kpis/${id}`);
      }
    }
  },
  addKpi: async (kpi) => {
    const { user } = get();
    if (user) {
      try {
        await setDoc(doc(db, 'kpis', kpi.id), kpi);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `kpis/${kpi.id}`);
      }
    }
    set((state) => ({ kpis: [...state.kpis, kpi] }));
  },
  deleteKpi: async (id) => {
    if (!id) return;
    const { user } = get();
    if (user) {
      try {
        await deleteDoc(doc(db, 'kpis', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `kpis/${id}`);
      }
    }
    set((state) => ({ kpis: state.kpis.filter(k => k.id !== id) }));
  },
  bulkAddKpis: async (kpis) => {
    const { user } = get();
    if (user) {
      try {
        const batch = writeBatch(db);
        kpis.forEach(kpi => {
          batch.set(doc(db, 'kpis', kpi.id), kpi);
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `kpis (bulk)`);
      }
    }
    set((state) => ({ kpis: [...state.kpis, ...kpis] }));
  },
  bulkDeleteKpis: async (ids) => {
    const { user } = get();
    if (user) {
      try {
        const batch = writeBatch(db);
        ids.forEach(id => {
          batch.delete(doc(db, 'kpis', id));
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `kpis (bulk)`);
      }
    }
    set((state) => ({ kpis: state.kpis.filter(k => !ids.includes(k.id)) }));
  },
  updateCampaign: async (id, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
    const { user } = get();
    if (user) {
      try {
        await updateDoc(doc(db, 'campaigns', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `campaigns/${id}`);
      }
    }
  },
  deleteCampaign: (id) => set((state) => ({
    campaigns: state.campaigns.filter(c => c.id !== id)
  })),
  addTask: async (task) => {
    const { currentProjectId } = get();
    const taskWithProject = { ...task, projectId: currentProjectId || '' };
    set((state) => ({ tasks: [...state.tasks, taskWithProject] }));
    const { user } = get();
    if (user) {
      try {
        await setDoc(doc(db, 'tasks', task.id), taskWithProject);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `tasks/${task.id}`);
      }
    }
  },
  updateTask: async (taskId, updates) => {
    if (!taskId) return;
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    }));
    const { user } = get();
    if (user) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
      }
    }
  },
  deleteTask: async (taskId) => {
    if (!taskId) return;
    set((state) => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
    const { user } = get();
    if (user) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
      }
    }
  },
  addNotification: async (notification) => {
    const { user } = get();
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'notifications', notification.id), notification);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/notifications/${notification.id}`);
      }
    }
    set((state) => ({
      notifications: [notification, ...state.notifications]
    }));
  },
  markNotificationRead: async (id) => {
    const { user } = get();
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/notifications/${id}`);
      }
    }
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },
  markAllNotificationsRead: async () => {
    const { user, notifications } = get();
    if (user) {
      try {
        const batch = writeBatch(db);
        notifications.forEach(n => {
          if (!n.read) {
            batch.update(doc(db, 'users', user.uid, 'notifications', n.id), { read: true });
          }
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/notifications (bulk)`);
      }
    }
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  },
  addTeamMember: (member) => set((state) => ({ teamMembers: [...state.teamMembers, member] })),
  inviteTeamMember: async (email, role) => {
    const { currentProjectId, projects, userProfile } = get();
    if (!currentProjectId) return;
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;

    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const invitation: Omit<Invitation, 'id'> = {
        email,
        projectId: currentProjectId,
        teamName: project.name,
        role,
        status: 'pending',
        token // Add token for link-based joining
      };
      await addDoc(collection(db, 'invitations'), invitation);
      
      // Add a notification for the inviter
      get().addNotification({
        id: `notif-${Date.now()}`,
        taskId: '',
        message: `Invitation sent to ${email}. Share the link to join!`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'system'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invitations');
    }
  },
  removeTeamMember: async (uid) => {
    const { currentProjectId, projects } = get();
    if (!currentProjectId) return;
    const project = projects.find(p => p.id === currentProjectId);
    if (!project || project.ownerId === uid) return; // Cannot remove owner

    try {
      const updatedMembers = (project.members || []).filter(m => m !== uid);
      const updatedRoles = { ...(project.memberRoles || {}) };
      delete updatedRoles[uid];

      await updateDoc(doc(db, 'projects', currentProjectId), {
        members: updatedMembers,
        memberRoles: updatedRoles
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${currentProjectId}`);
    }
  },
  updateTeamMemberRole: async (uid, role) => {
    const { currentProjectId, projects } = get();
    if (!currentProjectId) return;
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;

    try {
      const updatedRoles = { ...(project.memberRoles || {}), [uid]: role };
      await updateDoc(doc(db, 'projects', currentProjectId), {
        memberRoles: updatedRoles
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${currentProjectId}`);
    }
  },
  addCustomer: async (customer) => {
    const { currentProjectId, user } = get();
    const customerWithProject = { ...customer, projectId: currentProjectId || '' };
    if (user) {
      try {
        await setDoc(doc(db, 'customers', customer.id), customerWithProject);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `customers/${customer.id}`);
      }
    }
    set((state) => ({ customers: [...state.customers, customerWithProject] }));
  },
  bulkAddCustomers: async (newCustomers) => {
    const { currentProjectId, user } = get();
    const customersWithProject = newCustomers.map(c => ({ ...c, projectId: currentProjectId || '' }));
    if (user) {
      try {
        const batch = writeBatch(db);
        customersWithProject.forEach(c => {
          batch.set(doc(db, 'customers', c.id), c);
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `customers (bulk)`);
      }
    }
    set((state) => ({ customers: [...state.customers, ...customersWithProject] }));
  },
  updateCustomer: async (id, updates) => {
    set((state) => ({
      customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
    const { user } = get();
    if (user) {
      try {
        await updateDoc(doc(db, 'customers', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
      }
    }
  },
  deleteCustomer: async (id) => {
    set((state) => ({ customers: state.customers.filter(c => c.id !== id) }));
    const { user } = get();
    if (user) {
      try {
        await deleteDoc(doc(db, 'customers', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
      }
    }
  },
  bulkDeleteCustomers: async (ids) => {
    set((state) => ({ customers: state.customers.filter(c => !ids.includes(c.id)) }));
    const { user } = get();
    if (user) {
      try {
        const batch = writeBatch(db);
        ids.forEach(id => {
          batch.delete(doc(db, 'customers', id));
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `customers (bulk)`);
      }
    }
  },
  
  addRegion: async (region) => {
    const { regions, user } = get();
    if (regions.includes(region)) return;
    const newRegions = [...regions, region];
    set({ regions: newRegions });
    if (user) {
      try {
        await setDoc(doc(db, 'settings', 'regions'), { list: newRegions });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'settings/regions');
      }
    }
  },

  updateRegion: async (oldRegion, newRegion) => {
    const { regions, user, kpis, campaigns } = get();
    const newRegions = regions.map(r => r === oldRegion ? newRegion : r);
    set({ regions: newRegions });
    
    if (user) {
      try {
        const batch = writeBatch(db);
        
        // Update global regions list
        batch.set(doc(db, 'settings', 'regions'), { list: newRegions });
        
        // Update all KPIs
        kpis.forEach(kpi => {
          if (kpi.regionalCost && kpi.regionalCost[oldRegion] !== undefined) {
            const newCost = { ...kpi.regionalCost };
            newCost[newRegion] = newCost[oldRegion];
            delete newCost[oldRegion];
            batch.update(doc(db, 'kpis', kpi.id), { regionalCost: newCost });
          }
        });
        
        // Update all Campaigns
        campaigns.forEach(campaign => {
          let updated = false;
          const updates: any = {};
          
          if (campaign.regions?.includes(oldRegion)) {
            updates.regions = campaign.regions.map(r => r === oldRegion ? newRegion : r);
            updated = true;
          }
          
          if (campaign.regionalRevenue && campaign.regionalRevenue[oldRegion] !== undefined) {
            const newRev = { ...campaign.regionalRevenue };
            newRev[newRegion] = newRev[oldRegion];
            delete newRev[oldRegion];
            updates.regionalRevenue = newRev;
            updated = true;
          }
          
          if (campaign.regionalCost && campaign.regionalCost[oldRegion] !== undefined) {
            const newCost = { ...campaign.regionalCost };
            newCost[newRegion] = newCost[oldRegion];
            delete newCost[oldRegion];
            updates.regionalCost = newCost;
            updated = true;
          }
          
          if (updated) {
            batch.update(doc(db, 'campaigns', campaign.id), updates);
          }
        });
        
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'update region (cascade)');
      }
    }
  },

  deleteRegion: async (region) => {
    const { regions, user, kpis, campaigns } = get();
    const newRegions = regions.filter(r => r !== region);
    set({ regions: newRegions });
    
    if (user) {
      try {
        const batch = writeBatch(db);
        
        // Update global regions list
        batch.set(doc(db, 'settings', 'regions'), { list: newRegions });
        
        // Remove from all KPIs
        kpis.forEach(kpi => {
          if (kpi.regionalCost && kpi.regionalCost[region] !== undefined) {
            const newCost = { ...kpi.regionalCost };
            delete newCost[region];
            batch.update(doc(db, 'kpis', kpi.id), { regionalCost: newCost });
          }
        });
        
        // Remove from all Campaigns
        campaigns.forEach(campaign => {
          let updated = false;
          const updates: any = {};
          
          if (campaign.regions?.includes(region)) {
            updates.regions = campaign.regions.filter(r => r !== region);
            updated = true;
          }
          
          if (campaign.regionalRevenue && campaign.regionalRevenue[region] !== undefined) {
            const newRev = { ...campaign.regionalRevenue };
            delete newRev[region];
            updates.regionalRevenue = newRev;
            updated = true;
          }
          
          if (campaign.regionalCost && campaign.regionalCost[region] !== undefined) {
            const newCost = { ...campaign.regionalCost };
            delete newCost[region];
            updates.regionalCost = newCost;
            updated = true;
          }
          
          if (updated) {
            batch.update(doc(db, 'campaigns', campaign.id), updates);
          }
        });
        
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'delete region (cascade)');
      }
    }
  },

  setCRMConfig: async (config) => {
    set((state) => ({ crmConfig: { ...state.crmConfig, ...config } }));
    const { user } = get();
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { crmConfig: { ...get().crmConfig, ...config } });
    }
  },
  setTheme: async (theme) => {
    set({ theme });
    const { user } = get();
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { theme });
    }
  },
  setLanguage: async (language) => {
    set({ language });
    const { user } = get();
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { language });
    }
  },
  setAlertSettings: async (settings) => {
    set((state) => ({ alertSettings: { ...state.alertSettings, ...settings } }));
    const { user } = get();
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { alertSettings: { ...get().alertSettings, ...settings } });
    }
  },

  addSupportTicket: async (ticket) => {
    const { user, userProfile } = get();
    if (!user) return;

    try {
      const ticketData = {
        ...ticket,
        userId: user.uid,
        userName: userProfile?.displayName || user.email || 'Anonymous',
        status: 'open',
        createdAt: new Date().toISOString(),
        replies: []
      };
      await addDoc(collection(db, 'support_tickets'), ticketData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'support_tickets');
    }
  },

  addSupportReply: async (ticketId, message, isAdmin) => {
    const { user, userProfile, supportTickets } = get();
    if (!user) return;

    const ticket = supportTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    try {
      const reply: SupportReply = {
        id: Math.random().toString(36).substr(2, 9),
        author: userProfile?.displayName || user.email || 'Anonymous',
        message,
        timestamp: new Date().toISOString(),
        isAdmin
      };

      const updatedReplies = [...ticket.replies, reply];
      await updateDoc(doc(db, 'support_tickets', ticketId), { 
        replies: updatedReplies,
        status: isAdmin ? 'in-progress' : 'open'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `support_tickets/${ticketId}`);
    }
  },

  resolveSupportTicket: async (ticketId) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), { status: 'resolved' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `support_tickets/${ticketId}`);
    }
  },

  setCurrentProjectId: (id) => {
    set({ currentProjectId: id });
    const { user } = get();
    if (!id || !user) return;

    // Sync KPIs for current project
    const kpisQuery = query(collection(db, 'kpis'), where('projectId', '==', id));
    onSnapshot(kpisQuery, (snapshot) => {
      set({ kpis: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KPI)) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, `kpis for ${id}`));

    // Sync Campaigns for current project
    const campaignsQuery = query(collection(db, 'campaigns'), where('projectId', '==', id));
    onSnapshot(campaignsQuery, (snapshot) => {
      set({ campaigns: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, `campaigns for ${id}`));

    // Sync Team Members for current project
    const projectRef = doc(db, 'projects', id);
    onSnapshot(projectRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const project = snapshot.data() as Project;
      const members = project.members || [];
      const memberRoles = project.memberRoles || {};

      // Fetch user profiles for all members
      const memberProfiles: TeamMember[] = [];
      for (const uid of members) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          memberProfiles.push({
            id: uid,
            name: userData.displayName || userData.email || 'Anonymous',
            role: memberRoles[uid] || (uid === project.ownerId ? 'Admin' : 'Member'),
            lastActive: userData.lastActive ? new Date(userData.lastActive).toLocaleString() : 'Never',
            status: 'active',
            avatar: userData.photoURL || `https://picsum.photos/seed/${uid}/100/100`
          });
        }
      }
      set({ teamMembers: memberProfiles });
    }, (error) => handleFirestoreError(error, OperationType.GET, `project members for ${id}`));

    // Sync Team Comments for current project
    const commentsQuery = query(collection(db, 'projects', id, 'comments'));
    onSnapshot(commentsQuery, (snapshot) => {
      set({ teamComments: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamComment)) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, `comments for ${id}`));

    // Sync Tasks for current project
    const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', id));
    onSnapshot(tasksQuery, (snapshot) => {
      set({ tasks: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, `tasks for ${id}`));

    // Sync Leads for current project
    const leadsQuery = query(collection(db, 'leads'), where('projectId', '==', id));
    onSnapshot(leadsQuery, (snapshot) => {
      set({ leads: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, `leads for ${id}`));

    // Sync Customers for current project
    const customersQuery = query(collection(db, 'customers'), where('projectId', '==', id));
    onSnapshot(customersQuery, (snapshot) => {
      set({ customers: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as B2BCustomer)) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, `customers for ${id}`));

    // Sync Notifications for user
    const notificationsQuery = query(collection(db, 'users', user.uid, 'notifications'));
    onSnapshot(notificationsQuery, (snapshot) => {
      set({ notifications: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, `notifications for ${user.uid}`));

    // Sync Performance Entries for current project
    const performanceQuery = collection(db, 'projects', id, 'performanceEntries');
    onSnapshot(performanceQuery, (snapshot) => {
      set({ performanceEntries: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PerformanceEntry)) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, `performanceEntries for ${id}`));
  },

  fetchProjectById: async (id) => {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', id));
      if (projectDoc.exists()) {
        const project = { id: projectDoc.id, ...projectDoc.data() } as Project;
        set((state) => ({ 
          projects: state.projects.find(p => p.id === id) ? state.projects : [...state.projects, project],
          currentProjectId: id 
        }));
        
        // Fetch KPIs and Campaigns
        const kpisQuery = query(collection(db, 'kpis'), where('projectId', '==', id));
        const kpisSnap = await getDocs(kpisQuery);
        set({ kpis: kpisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as KPI)) });
        
        const campaignsQuery = query(collection(db, 'campaigns'), where('projectId', '==', id));
        const campaignsSnap = await getDocs(campaignsQuery);
        const campaigns = campaignsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
        set({ campaigns });

        // Fetch Tasks for all campaigns
        if (campaigns.length > 0) {
          const campaignIds = campaigns.map(c => c.id);
          const tasksQuery = query(collection(db, 'tasks'), where('campaignId', 'in', campaignIds));
          const tasksSnap = await getDocs(tasksQuery);
          set({ tasks: tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)) });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `projects/${id}`);
    }
  },

  updateProject: async (id, updates) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'projects', id), updates);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
    }
  },

  deleteProject: async (id) => {
    if (!id) return;
    const { projects, currentProjectId, setCurrentProjectId } = get();
    try {
      await deleteDoc(doc(db, 'projects', id));
      const remainingProjects = projects.filter(p => p.id !== id);
      set({ projects: remainingProjects });
      
      if (currentProjectId === id) {
        if (remainingProjects.length > 0) {
          setCurrentProjectId(remainingProjects[0].id);
        } else {
          set({ currentProjectId: null });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  },

  initializeAuth: () => {
    onAuthStateChanged(auth, async (user) => {
      set({ user, isAuthReady: true });
      if (user) {
        // Sync user profile
        const userRef = doc(db, 'users', user.uid);
        onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const profile = snapshot.data() as User;
            set({ userProfile: profile });
            if (profile.dashboardLayouts) {
              set({ projectWidgets: profile.dashboardLayouts });
            }
            if (profile.theme) {
              set({ theme: profile.theme });
            }
            if (profile.language) {
              set({ language: profile.language });
            }
            if (profile.crmConfig) {
              set({ crmConfig: profile.crmConfig });
            }
            if (profile.powerBIConfig) {
              set({ powerBIConfig: profile.powerBIConfig });
            }
            if (profile.alertSettings) {
              set({ alertSettings: profile.alertSettings });
            }
          }
        });

        // Sync global regions
        onSnapshot(doc(db, 'settings', 'regions'), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data && data.list) {
              set({ regions: data.list });
            }
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/regions'));

        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastActive: serverTimestamp()
        }, { merge: true });

        // Sync Projects
        const projectsQuery = query(
          collection(db, 'projects'), 
          where('members', 'array-contains', user.uid)
        );
        onSnapshot(projectsQuery, (snapshot) => {
          const userProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
          
          set({ projects: userProjects });
          if (userProjects.length > 0 && !get().currentProjectId) {
            get().setCurrentProjectId(userProjects[0].id);
          }
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));

        // Sync Invitations
        const invQuery = query(
          collection(db, 'invitations'),
          where('email', '==', user.email),
          where('status', '==', 'pending')
        );
        onSnapshot(invQuery, (snapshot) => {
          set({ invitations: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)) });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'invitations'));

        // Sync Support Tickets
        const supportQuery = query(collection(db, 'support_tickets'));
        onSnapshot(supportQuery, (snapshot) => {
          set({ supportTickets: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket)) });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'support_tickets'));
      } else {
        set({ 
          projects: [], 
          currentProjectId: '', 
          kpis: [], 
          campaigns: [], 
          invitations: [],
          user: null 
        });
      }
    });
  },

  login: async (provider) => {
    if (provider !== 'google') return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        const message = "Google Login is not enabled in your Firebase Console. Please enable it in the Authentication > Sign-in method tab.";
        alert(message);
      } else if (error.code === 'auth/popup-blocked') {
        alert("The login popup was blocked by your browser. Please allow popups for this site.");
      } else {
        alert(`Login failed: ${error.message}`);
      }
      console.error('Login error:', error);
    }
  },

  loginWithEmail: async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert(`Login failed: ${error.message}`);
      console.error('Email login error:', error);
    }
  },

  signUpWithEmail: async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
    } catch (error: any) {
      alert(`Sign up failed: ${error.message}`);
      console.error('Email sign up error:', error);
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  createProject: async (name, description) => {
    const user = get().user;
    if (!user) return;

    try {
      const projectData = {
        name,
        description,
        ownerId: user.uid,
        members: [user.uid],
        memberRoles: { [user.uid]: 'Admin' },
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'projects'), projectData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  },

  addPerformanceEntry: async (entry) => {
    const { currentProjectId } = get();
    const entryRef = doc(db, 'projects', currentProjectId, 'performanceEntries', entry.id);
    await setDoc(entryRef, entry);
    set((state) => ({ performanceEntries: [...state.performanceEntries, entry] }));
  },
  bulkAddPerformanceEntries: async (entries) => {
    const { currentProjectId } = get();
    const batch = writeBatch(db);
    entries.forEach(entry => {
      const entryRef = doc(db, 'projects', currentProjectId, 'performanceEntries', entry.id);
      batch.set(entryRef, entry);
    });
    await batch.commit();
    set((state) => ({ performanceEntries: [...state.performanceEntries, ...entries] }));
  },
  updatePerformanceEntry: async (id, updates) => {
    const { currentProjectId } = get();
    const entryRef = doc(db, 'projects', currentProjectId, 'performanceEntries', id);
    await updateDoc(entryRef, updates);
    set((state) => ({
      performanceEntries: state.performanceEntries.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  },
  deletePerformanceEntry: async (id) => {
    const { currentProjectId } = get();
    const entryRef = doc(db, 'projects', currentProjectId, 'performanceEntries', id);
    await deleteDoc(entryRef);
    set((state) => ({
      performanceEntries: state.performanceEntries.filter(e => e.id !== id)
    }));
  },
  acceptInvitation: async (id) => {
    const user = get().user;
    if (!user) return;

    try {
      const invRef = doc(db, 'invitations', id);
      const invSnap = await getDoc(invRef);
      if (!invSnap.exists()) return;

      const invitation = invSnap.data() as Invitation;
      const projectRef = doc(db, 'projects', invitation.projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const projectData = projectSnap.data() as Project;
        await updateDoc(projectRef, {
          members: [...(projectData.members || []), user.uid],
          memberRoles: { ...(projectData.memberRoles || {}), [user.uid]: invitation.role }
        });
        await updateDoc(invRef, { status: 'accepted' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'invitations');
    }
  },

  joinProjectByToken: async (token) => {
    const user = get().user;
    if (!user) {
      throw new Error('Please log in to join the project.');
    }

    try {
      const q = query(collection(db, 'invitations'), where('token', '==', token), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid or expired invitation link.');
      }

      const invDoc = querySnapshot.docs[0];
      const invitation = invDoc.data() as Invitation;

      // Check if user email matches (optional, but more secure if we want to enforce)
      // if (invitation.email !== user.email) {
      //   throw new Error('This invitation was sent to a different email address.');
      // }

      const projectRef = doc(db, 'projects', invitation.projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new Error('The project no longer exists.');
      }

      const projectData = projectSnap.data() as Project;
      
      // Add user to project
      await updateDoc(projectRef, {
        members: [...(projectData.members || []), user.uid],
        memberRoles: { ...(projectData.memberRoles || {}), [user.uid]: invitation.role }
      });

      // Update invitation status
      await updateDoc(invDoc.ref, { status: 'accepted' });

      // Update local state
      set({ currentProjectId: invitation.projectId });
      
      get().addNotification({
        id: `notif-${Date.now()}`,
        taskId: '',
        message: `Successfully joined ${invitation.teamName}!`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'system'
      });
    } catch (error) {
      console.error('Join project error:', error);
      throw error;
    }
  },

  addTeamComment: async (text) => {
    const { currentProjectId, user, userProfile, projects } = get();
    if (!currentProjectId || !user) return;
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;

    try {
      const comment: Omit<TeamComment, 'id'> = {
        projectId: currentProjectId,
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || 'Anonymous',
        userRole: project.memberRoles?.[user.uid] || (user.uid === project.ownerId ? 'Admin' : 'Member'),
        userAvatar: userProfile?.photoURL || user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        userHandle: `@${(userProfile?.displayName || user.displayName || 'user').replace(/\s+/g, '')}`,
        text,
        timestamp: new Date().toISOString()
      };
      await addDoc(collection(db, 'projects', currentProjectId, 'comments'), comment);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${currentProjectId}/comments`);
    }
  },

  updateTeamComment: async (id, text) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    try {
      await updateDoc(doc(db, 'projects', currentProjectId, 'comments', id), { text });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${currentProjectId}/comments/${id}`);
    }
  },

  deleteTeamComment: async (id) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    try {
      await deleteDoc(doc(db, 'projects', currentProjectId, 'comments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${currentProjectId}/comments/${id}`);
    }
  }
}));
