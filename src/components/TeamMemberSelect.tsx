import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, User } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

interface TeamMemberSelectProps {
  label?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function TeamMemberSelect({ label, selectedIds = [], onChange, placeholder }: TeamMemberSelectProps) {
  const { teamMembers, addTeamMember } = useStore();
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

  const selectedMembers = selectedIds.map(idOrName => 
    teamMembers.find(m => m.id === idOrName || m.name === idOrName) || 
    { id: idOrName, name: idOrName, role: 'External', avatar: '', status: 'offline', lastActive: '' }
  );
  
  const filteredMembers = teamMembers.filter(m => 
    !selectedIds.includes(m.id) && 
    !selectedIds.includes(m.name) &&
    m.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (name: string) => {
    if (!selectedIds.includes(name)) {
      onChange([...selectedIds, name]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const handleRemove = (idToRemove: string) => {
    onChange(selectedIds.filter(id => id !== idToRemove));
  };

  const handleAddNew = () => {
    const newName = inputValue.trim();
    if (newName && !selectedIds.includes(newName)) {
      onChange([...selectedIds, newName]);
      setInputValue('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>}
      <div 
        className="flex flex-wrap gap-2 p-2 bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all min-h-[42px] cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selectedMembers.map((member) => (
          <span 
            key={member.id} 
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200"
          >
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className="w-4 h-4 rounded-full" />
            ) : (
              <User className="w-3 h-3" />
            )}
            {member.name}
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(member.id); }}
              className="hover:text-red-500 transition-colors focus:outline-none ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
          placeholder={selectedIds.length === 0 ? placeholder : ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue.trim()) {
              e.preventDefault();
              if (filteredMembers.length > 0) {
                handleSelect(filteredMembers[0].name);
              } else {
                handleAddNew();
              }
            }
          }}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredMembers.length > 0 ? (
            <div className="p-1">
              {filteredMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member.name)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-700">{member.name}</div>
                    <div className="text-xs text-slate-500">{member.role}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : inputValue.trim() ? (
            <div className="p-2">
              <button
                onClick={handleAddNew}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add "{inputValue}"
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              Type to search or add
            </div>
          )}
        </div>
      )}
    </div>
  );
}
