import React from 'react';
import { X, Save, Globe, Target, DollarSign, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Campaign, Region } from '../types';
import { REGIONS } from '../constants';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Partial<Campaign>) => void;
  initialData?: Partial<Campaign>;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = React.useState<Partial<Campaign>>({
    name: '',
    budget: 0,
    currency: 'USD',
    exchangeRate: 1.0,
    channel: 'LinkedIn',
    status: 'active',
    regions: ['NA'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          name: initialData.name ? `Copy of ${initialData.name}` : '',
        });
      } else {
        setFormData({
          name: '',
          budget: 0,
          currency: 'USD',
          exchangeRate: 1.0,
          channel: 'LinkedIn',
          status: 'active',
          regions: ['NA'],
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
        });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white rounded-3xl shadow-2xl z-[60] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{initialData ? 'Duplicate Campaign' : 'Create New Campaign'}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Summer Global Sale 2024"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Channel</label>
                  <select 
                    value={formData.channel}
                    onChange={e => setFormData({...formData, channel: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option>LinkedIn</option>
                    <option>Google Ads</option>
                    <option>Email</option>
                    <option>Webinar</option>
                    <option>YouTube</option>
                    <option>Meta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Region</label>
                  <select 
                    value={formData.regions?.[0] || 'NA'}
                    onChange={e => setFormData({...formData, regions: [e.target.value as Region]})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    {REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Currency</label>
                  <select 
                    value={formData.currency || 'USD'}
                    onChange={e => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="KRW">KRW (₩)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exchange Rate (to USD)</label>
                  <input 
                    required
                    type="number" 
                    step="0.0001"
                    value={formData.exchangeRate || 1.0}
                    onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Budget</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      required
                      type="number" 
                      value={formData.budget}
                      onChange={e => setFormData({...formData, budget: Number(e.target.value)})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date" 
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  {initialData ? 'Duplicate Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
