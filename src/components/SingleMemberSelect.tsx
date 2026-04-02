import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Check, Plus } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

interface SingleMemberSelectProps {
  value: string;
  onChange: (name: string) => void;
  className?: string;
  placeholder?: string;
}

export function SingleMemberSelect({ value, onChange, className, placeholder = "Select member..." }: SingleMemberSelectProps) {
  const { teamMembers } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
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

  const filteredMembers = teamMembers.filter(m => 
    m.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const selectedMember = teamMembers.find(m => m.name === value);

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      <div 
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 overflow-hidden">
          {selectedMember?.avatar ? (
            <img src={selectedMember.avatar} alt={value} className="w-full h-full object-cover" />
          ) : (
            value.charAt(0)
          )}
        </div>
        <span className="text-xs text-slate-700 truncate flex-1">{value || placeholder}</span>
        <Search className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-64 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    e.preventDefault();
                    if (filteredMembers.length > 0) {
                      onChange(filteredMembers[0].name);
                    } else {
                      onChange(inputValue.trim());
                    }
                    setIsOpen(false);
                    setInputValue('');
                  }
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Search team members..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredMembers.length > 0 ? (
              filteredMembers.map(member => (
                <button
                  key={member.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(member.name);
                    setIsOpen(false);
                    setInputValue('');
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors text-left",
                    value === member.name && "bg-emerald-50"
                  )}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{member.name}</div>
                    <div className="text-xs text-slate-500 truncate">{member.role}</div>
                  </div>
                  {value === member.name && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              ))
            ) : inputValue.trim() !== '' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(inputValue.trim());
                  setIsOpen(false);
                  setInputValue('');
                }}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-emerald-50 rounded-lg transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">Add "{inputValue}"</div>
                  <div className="text-[10px] text-emerald-600 font-medium">New member (to be matched later)</div>
                </div>
              </button>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                No members found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
