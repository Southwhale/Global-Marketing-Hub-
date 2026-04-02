import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/crm/sync", async (req, res) => {
    try {
      const tenantId = process.env.DYNAMICS_365_TENANT_ID;
      const clientId = process.env.DYNAMICS_365_CLIENT_ID;
      const clientSecret = process.env.DYNAMICS_365_CLIENT_SECRET;
      const crmUrl = process.env.DYNAMICS_365_URL || "https://ctr.crm5.dynamics.com";

      if (!tenantId || !clientId || !clientSecret) {
        return res.status(400).json({
          error: "Missing Dynamics 365 Credentials",
          message: "Please configure DYNAMICS_365_TENANT_ID, DYNAMICS_365_CLIENT_ID, and DYNAMICS_365_CLIENT_SECRET in your environment variables.",
        });
      }

      // 1. Get Access Token from Azure AD
      const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: `${crmUrl}/.default`,
          grant_type: "client_credentials",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Token Error:", errorData);
        return res.status(401).json({ error: "Authentication Failed", details: errorData });
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // 2. Fetch Accounts (Customers) from Dynamics 365
      // Fetching name, accountnumber, address1_country, revenue, numberofemployees
      const accountsResponse = await fetch(`${crmUrl}/api/data/v9.2/accounts?$select=name,accountnumber,address1_country,revenue,numberofemployees&$top=50`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
        },
      });

      if (!accountsResponse.ok) {
        const errorData = await accountsResponse.json();
        console.error("Accounts Fetch Error:", errorData);
        return res.status(500).json({ error: "Failed to fetch accounts from CRM", details: errorData });
      }

      const accountsData = await accountsResponse.json();

      // Map to B2BCustomer format
      const customers = accountsData.value.map((acc: any) => ({
        id: acc.accountid,
        companyName: acc.name || "Unknown Company",
        buyerCode: acc.accountnumber || `CRM-${acc.accountid.substring(0, 6)}`,
        country: acc.address1_country || "Unknown",
        region: "Global", // Default or map from country
        revenue: acc.revenue || Math.floor(Math.random() * 100000) + 50000, // Fallback if empty
        quantity: acc.numberofemployees || Math.floor(Math.random() * 100) + 10, // Proxy for orders/quantity
        status: "active",
      }));

      res.json({ customers });
    } catch (error: any) {
      console.error("CRM Sync Error:", error);
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  });

  app.post("/api/powerbi/sync", express.json(), async (req, res) => {
    try {
      const workspaceId = process.env.POWER_BI_WORKSPACE_ID;
      const reportId = process.env.POWER_BI_REPORT_ID;
      
      const { kpis, campaigns } = req.body || {};
      const kpiId1 = (kpis && kpis.length > 0) ? kpis[0] : 'kpi-1';
      const kpiId2 = (kpis && kpis.length > 1) ? kpis[1] : kpiId1;
      const kpiId3 = (kpis && kpis.length > 2) ? kpis[2] : kpiId1;
      const campaignId1 = (campaigns && campaigns.length > 0) ? campaigns[0] : 'c1';
      const campaignId2 = (campaigns && campaigns.length > 1) ? campaigns[1] : campaignId1;

      // In a real scenario, we would use the Power BI REST API to execute a DAX query
      // against a dataset to pull performance metrics.
      // For this demonstration, we will generate mock performance data that matches our schema.
      
      const mockPerformanceData = [
        {
          id: `pbi-sync-${Date.now()}-1`,
          date: new Date().toISOString().split('T')[0],
          kpiId: kpiId1,
          campaignId: campaignId1,
          region: 'NA',
          revenue: 125000,
          cost: 45000,
          impressions: 1500000,
          clicks: 45000,
          leads: 1200,
          mqls: 800,
          sqls: 400,
          customers: 120,
          engagement: 5000,
          subscribers: 200,
          source: 'Power BI',
          notes: 'Synced from Power BI Dataset'
        },
        {
          id: `pbi-sync-${Date.now()}-2`,
          date: new Date().toISOString().split('T')[0],
          kpiId: kpiId2,
          campaignId: campaignId2,
          region: 'EU',
          revenue: 85000,
          cost: 32000,
          impressions: 950000,
          clicks: 28000,
          leads: 850,
          mqls: 500,
          sqls: 200,
          customers: 80,
          engagement: 3000,
          subscribers: 150,
          source: 'Power BI',
          notes: 'Synced from Power BI Dataset'
        },
        {
          id: `pbi-sync-${Date.now()}-3`,
          date: new Date().toISOString().split('T')[0],
          kpiId: kpiId3, 
          campaignId: campaignId1,
          region: 'ASIA',
          revenue: 210000,
          cost: 65000,
          impressions: 2100000,
          clicks: 75000,
          leads: 3200,
          mqls: 1500,
          sqls: 800,
          customers: 250,
          engagement: 8000,
          subscribers: 500,
          source: 'Power BI',
          notes: 'Synced from Power BI Dataset'
        }
      ];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      res.json({ entries: mockPerformanceData });
    } catch (error: any) {
      console.error("Power BI Sync Error:", error);
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
