import { GoogleGenAI } from "@google/genai";
import { Campaign, Task, KPI, Lead } from "../types";

const SYSTEM_INSTRUCTION = `
You are a B2B marketing performance analyst specializing in funnel optimization using MQL and SQL metrics.
You also specialize in MQL definition refinement, integrating data from Dynamics 365 CRM.

Your goal is to analyze marketing performance data and provide:
1. Funnel conversion analysis (Lead → MQL → SQL → Opportunity → Revenue)
2. Channel efficiency evaluation
3. Pipeline contribution and ROI analysis
4. Actionable insights for optimization
5. Cohort-based analysis
6. MQL Refinement:
   * Refine MQL definitions based on historical conversion data from CRM
   * Identify bottlenecks in the qualification process

## Definitions (Strictly Follow)
* MQL: Leads that meet marketing qualification criteria based on intent + fit
* SQL: Leads validated by sales as having real opportunity potential
* Conversion Rates:
  * MQL Rate = MQL / Leads
  * SQL Rate = SQL / MQL
  * Opportunity Rate = Opportunity / SQL
* Pipeline Value = Sum of expected deal values from SQL
* Pipeline ROI = Pipeline Value / Marketing Cost

## Instructions
* Always analyze data by Channel, Campaign, Region, and Product Line if available
* Identify bottlenecks in the funnel
* Highlight top and bottom performing segments
* Detect inefficiencies (high cost, low conversion)
* Provide clear, business-oriented insights (not generic observations)
* Prioritize insights that directly impact revenue growth.
* For MQL Refinement: Suggest specific criteria adjustments (e.g., "Increase intent threshold for Social leads").

## Output Format
1. C-Level Summary (Revenue focus, 3 key actions only, concise high-impact language)
2. Executive Summary (3~5 bullet points)
3. Funnel Performance Table (with conversion rates)
4. MQL Definition Refinement (Data-backed suggestions for MQL criteria)
5. Key Insights (data-driven, including cohort analysis)
6. Risk / Issue Identification
7. Recommended Actions (prioritized, practical)

## Constraints
* Do NOT provide vague insights
* Always link insights to specific metrics
* Focus on decision-making usefulness for executives
`;

export async function generateRegionalImpactAnalysis(campaigns: Campaign[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  
  const campaignData = campaigns.map(c => ({
    Region: c.regions?.join(', ') || 'N/A',
    Channel: c.channel,
    Campaign_Type: c.campaignType,
    Campaign_Name: c.name,
    Spend: c.spent,
    Leads: c.leads || 0,
    MQL: c.mqls || 0,
    SQL: c.sqls || 0,
    Opportunity_Value: c.opportunityValue || c.pipelineValue || 0,
    Revenue: c.actualRevenue,
    Campaign_Start_Date: c.startDate,
    Campaign_End_Date: c.endDate
  }));

  const prompt = `
Analyze the relationship between regional marketing activities and revenue performance based on the following data:

[DATA]
${JSON.stringify(campaignData, null, 2)}

[OBJECTIVE]
1. Identify correlation between marketing spend and revenue by region
2. Evaluate which channels and campaign types drive actual revenue (not just leads)
3. Compare funnel performance across regions (Lead → MQL → SQL → Revenue)
4. Detect inefficiencies (high spend but low revenue contribution)
5. Identify high-performing combinations (Region × Channel × Campaign Type)

[ANALYSIS REQUIREMENTS]
* Calculate:
  * MQL Rate = MQL / Leads
  * SQL Rate = SQL / MQL
  * Revenue ROI = Revenue / Spend
  * Pipeline ROI = Opportunity_Value / Spend
* Perform correlation analysis:
  * Spend vs Revenue (by Region)
  * MQL vs Revenue
  * SQL vs Revenue
* Compare performance:
  * By Region
  * By Channel
  * By Campaign_Type
* Detect funnel bottlenecks per region
* Consider time lag between campaign execution and revenue impact

[OUTPUT FORMAT]
1. Executive Summary (Top 5 insights only, business impact focused)
2. Regional Performance Analysis
3. Channel & Campaign Effectiveness
4. Funnel Analysis by Region
5. Correlation Insights
6. Risk & Inefficiency
7. Recommended Actions (Top 3 only)

[CONSTRAINTS]
* Avoid generic insights
* Always link insights to data
* Focus on revenue impact and decision-making

In addition to analysis, recommend dashboard visualizations to represent insights. Include:
1. Scatter Plot (Spend vs Revenue)
2. Funnel Comparison Chart
3. ROI Heatmap

For each visualization:
* Explain what insight it reveals
* Explain how to interpret it
Prioritize insights that explain WHY revenue is generated, not just WHAT happened.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class B2B Marketing Performance Analyst. Your goal is to analyze marketing data and provide deep, actionable insights focused on revenue impact and funnel optimization. Always link your insights to specific data points provided.",
        temperature: 0.7,
      },
    });

    return response.text || "Failed to generate analysis.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Error generating AI analysis. Please check your API key and data.";
  }
}

export async function generatePerformanceAnalysis(data: {
  campaigns: Campaign[];
  tasks: Task[];
  kpis: KPI[];
  leads: Lead[];
}) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  
  const prompt = `
    Please analyze the following B2B marketing and CRM data:
    
    Campaigns:
    ${JSON.stringify(data.campaigns, null, 2)}
    
    Tasks:
    ${JSON.stringify(data.tasks, null, 2)}
    
    KPIs:
    ${JSON.stringify(data.kpis, null, 2)}

    Leads (CRM Data):
    ${JSON.stringify(data.leads, null, 2)}
    
    Provide a detailed performance analysis and MQL refinement based on the system instructions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    throw error;
  }
}
