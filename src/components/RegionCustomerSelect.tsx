import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, MapPin, Building2 } from 'lucide-react';
import { Region } from '../types';
import { useStore } from '../store';
import { cn } from '../lib/utils';

interface RegionCustomerSelectProps {
  selectedRegions: string[];
  selectedCustomers: string[];
  onChange: (regions: string[], customers: string[]) => void;
}

export function RegionCustomerSelect({ selectedRegions = [], selectedCustomers = [], onChange }: RegionCustomerSelectProps) {
  const { customers, regions } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group customers by region
  const regionsMap = customers.reduce((acc, customer) => {
    if (!acc[customer.region]) {
      acc[customer.region] = [];
    }
    acc[customer.region].push(customer);
    return acc;
  }, {} as Record<string, typeof customers>);

  const allRegions = Array.from(new Set([...regions, ...Object.keys(regionsMap)])).sort();

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  const handleRegionSelect = (region: string) => {
    const newRegions = selectedRegions.includes(region)
      ? selectedRegions.filter(r => r !== region)
      : [...selectedRegions, region];
    onChange(newRegions, selectedCustomers);
  };

  const handleCustomerSelect = (customerId: string) => {
    const newCustomers = selectedCustomers.includes(customerId)
      ? selectedCustomers.filter(c => c !== customerId)
      : [...selectedCustomers, customerId];
    onChange(selectedRegions, newCustomers);
  };

  const removeRegion = (region: string) => {
    onChange(selectedRegions.filter(r => r !== region), selectedCustomers);
  };

  const removeCustomer = (customerId: string) => {
    onChange(selectedRegions, selectedCustomers.filter(c => c !== customerId));
  };

  return (
    <div className="relative col-span-2" ref={wrapperRef}>
      <label className="block text-sm font-bold text-slate-700 mb-2">Regions & Customers</label>
      <div 
        className="flex flex-wrap gap-2 p-2 bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all min-h-[42px] cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedRegions.map(region => (
          <span 
            key={`r-${region}`} 
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200"
          >
            <MapPin className="w-3 h-3" />
            {region}
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); removeRegion(region); }}
              className="hover:text-red-500 transition-colors focus:outline-none ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {selectedCustomers.map(customerId => {
          const customer = customers.find(c => c.id === customerId);
          if (!customer) return null;
          return (
            <span 
              key={`c-${customerId}`} 
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200"
            >
              <Building2 className="w-3 h-3" />
              {customer.companyName}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); removeCustomer(customerId); }}
                className="hover:text-red-500 transition-colors focus:outline-none ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        {selectedRegions.length === 0 && selectedCustomers.length === 0 && (
          <span className="text-sm text-slate-400 p-1">Select regions and customers...</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto p-2">
          {allRegions.map(region => (
            <div key={region} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleRegion(region); }}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  {expandedRegions[region] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </button>
                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedRegions.includes(region)}
                    onChange={() => handleRegionSelect(region)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold text-slate-700">{region}</span>
                </label>
              </div>
              
              {expandedRegions[region] && (regionsMap[region] || []).length > 0 && (
                <div className="ml-8 pl-2 border-l-2 border-slate-100 space-y-1 mt-1">
                  {regionsMap[region].map(customer => (
                    <label key={customer.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleCustomerSelect(customer.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <Building2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-slate-600">{customer.companyName}</span>
                      <span className="text-xs text-slate-400 ml-auto">{customer.country}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
