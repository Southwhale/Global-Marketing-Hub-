import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, TrendingDown, X, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

export type AlertType = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  metric: string;
  value: string;
  threshold: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Cost per SQL Spike Detected',
    message: 'Enterprise Webinar campaign Cost per SQL has exceeded the maximum threshold.',
    metric: 'Cost per SQL',
    value: '$1,250',
    threshold: '$1,000'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Pipeline ROI Drop Alert',
    message: 'Q3 LinkedIn Ads Pipeline ROI has dropped below the target minimum.',
    metric: 'Pipeline ROI',
    value: '2.1x',
    threshold: '2.5x'
  }
];

export const PerformanceAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 shadow-sm flex items-start gap-4",
              alert.type === 'critical' ? "bg-rose-50 border-rose-200" : 
              alert.type === 'warning' ? "bg-amber-50 border-amber-200" : 
              "bg-blue-50 border-blue-200"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl shrink-0",
              alert.type === 'critical' ? "bg-rose-100 text-rose-600" : 
              alert.type === 'warning' ? "bg-amber-100 text-amber-600" : 
              "bg-blue-100 text-blue-600"
            )}>
              {alert.type === 'critical' ? <TrendingUp className="w-5 h-5" /> : 
               alert.type === 'warning' ? <TrendingDown className="w-5 h-5" /> : 
               <AlertTriangle className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-1">
                <h4 className={cn(
                  "font-bold text-sm",
                  alert.type === 'critical' ? "text-rose-900" : 
                  alert.type === 'warning' ? "text-amber-900" : 
                  "text-blue-900"
                )}>
                  {alert.title}
                </h4>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/60">
                    <span className="text-slate-500">Current:</span>
                    <span className={cn(
                      "font-bold",
                      alert.type === 'critical' ? "text-rose-600" : "text-amber-600"
                    )}>{alert.value}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/60">
                    <span className="text-slate-500">Threshold:</span>
                    <span className="text-slate-700 font-bold">{alert.threshold}</span>
                  </div>
                </div>
              </div>
              <p className={cn(
                "text-sm",
                alert.type === 'critical' ? "text-rose-700" : 
                alert.type === 'warning' ? "text-amber-700" : 
                "text-blue-700"
              )}>
                {alert.message}
              </p>
            </div>

            <button 
              onClick={() => dismissAlert(alert.id)}
              className={cn(
                "p-1.5 rounded-lg transition-colors shrink-0",
                alert.type === 'critical' ? "hover:bg-rose-100 text-rose-400 hover:text-rose-600" : 
                alert.type === 'warning' ? "hover:bg-amber-100 text-amber-400 hover:text-amber-600" : 
                "hover:bg-blue-100 text-blue-400 hover:text-blue-600"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
