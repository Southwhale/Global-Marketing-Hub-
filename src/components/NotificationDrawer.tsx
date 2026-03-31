import React from 'react';
import { X, Bell, Info, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useStore } from '../store';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, setSelectedTaskId } = useStore();

  const handleNotificationClick = (taskId: string, notifId: string) => {
    markNotificationRead(notifId);
    setSelectedTaskId(taskId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Notifications</h3>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n.taskId, n.id)}
                    className={cn(
                      "p-4 rounded-2xl border transition-colors group relative cursor-pointer",
                      n.read ? "border-slate-100 bg-white hover:bg-slate-50" : "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
                    )}
                  >
                    {!n.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        n.type === 'mention' ? "bg-blue-50 text-blue-600" :
                        n.type === 'alarm' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {n.type === 'mention' ? <MessageSquare className="w-5 h-5" /> :
                         n.type === 'alarm' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 pr-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-slate-900">
                            {n.type === 'mention' ? 'Mention' : n.type === 'alarm' ? 'Alarm' : 'System'}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(n.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-6 border-t border-slate-100">
                <button 
                  onClick={markAllNotificationsRead}
                  className="w-full py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
