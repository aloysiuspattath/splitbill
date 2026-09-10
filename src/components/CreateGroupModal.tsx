import React, { useState } from 'react';
import { CurrencyCode, Group, Person } from '../types';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { CurrencyDropdown } from './CurrencyDropdown';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (group: Group) => void;
  initialGroup?: Group;
}

const DEFAULT_AVATARS = ['🧑‍💻', '👩‍🚀', '🦸‍♂️', '🥷', '🧙‍♀️', '🧟‍♂️', '🧛‍♀️', '🧜‍♂️', '🧚‍♀️', '🧞‍♂️'];
const DEFAULT_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate, initialGroup }) => {
  const [name, setName] = useState(initialGroup?.name || '');
  const [currency, setCurrency] = useState<CurrencyCode>(initialGroup?.currency || 'INR');
  const [members, setMembers] = useState<Person[]>(
    initialGroup?.members || [{ id: `p-${Date.now()}-1`, name: 'Me', avatar: '😎', color: 'bg-brand-500' }]
  );
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUpiId, setNewMemberUpiId] = useState('');

  // Reset state when opening/closing
  React.useEffect(() => {
    if (isOpen) {
      setName(initialGroup?.name || '');
      setCurrency(initialGroup?.currency || 'INR');
      setMembers(initialGroup?.members || [{ id: `p-${Date.now()}-1`, name: 'Me', avatar: '😎', color: 'bg-brand-500' }]);
      setNewMemberName('');
      setNewMemberUpiId('');
    }
  }, [isOpen, initialGroup]);

  if (!isOpen) return null;

  const handleAddMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMemberName.trim()) return;

    const newPerson: Person = {
      id: `p-${Date.now()}`,
      name: newMemberName.trim(),
      avatar: DEFAULT_AVATARS[members.length % DEFAULT_AVATARS.length],
      color: DEFAULT_COLORS[members.length % DEFAULT_COLORS.length],
      upiId: newMemberUpiId.trim() || undefined,
    };

    setMembers([...members, newPerson]);
    setNewMemberName('');
    setNewMemberUpiId('');
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers(members.filter(m => m.id !== id));
  };

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a group name.');
      return;
    }
    
    let finalMembers = [...members];
    if (newMemberName.trim()) {
      const cleanNew = newMemberName.trim();
      if (!finalMembers.some(m => m.name.toLowerCase() === cleanNew.toLowerCase())) {
        finalMembers.push({
          id: `p-${Date.now()}`,
          name: cleanNew,
          avatar: DEFAULT_AVATARS[finalMembers.length % DEFAULT_AVATARS.length],
          color: DEFAULT_COLORS[finalMembers.length % DEFAULT_COLORS.length],
        });
      }
    }

    const newGroup: Group = {
      id: initialGroup?.id || `group-${Date.now()}`,
      name: name.trim(),
      currency,
      members: finalMembers,
      createdAt: initialGroup?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onCreate(newGroup);
    // Reset state for next time
    setName('');
    setNewMemberName('');
    setMembers([{ id: `p-${Date.now()}-1`, name: 'Me', avatar: '😎', color: 'bg-brand-500' }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {initialGroup ? 'Edit Group' : 'Create Group'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Goa Trip 2026"
              className="w-full bg-slate-100 dark:bg-[#2c2c2e] text-slate-900 dark:text-white px-4 py-3.5 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Currency</label>
            <CurrencyDropdown
              value={currency}
              onChange={setCurrency}
              variant="form"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Group Members</label>
            
            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#2c2c2e]/50 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{member.avatar}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{member.name}</span>
                      {member.upiId && <span className="text-[10px] text-slate-500 font-medium">{member.upiId}</span>}
                    </div>
                  </div>
                  {members.length > 1 && (
                    <button onClick={() => handleRemoveMember(member.id)} className="text-slate-400 hover:text-rose-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-slate-50 dark:bg-[#2c2c2e]/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="Friend's Name"
                  className="w-full bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white px-4 py-3 rounded-xl font-medium outline-none focus:ring-2 focus:ring-brand-500 text-sm border border-slate-200 dark:border-slate-800"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemberUpiId}
                    onChange={e => setNewMemberUpiId(e.target.value)}
                    placeholder="UPI ID or Phone No."
                    className="flex-1 bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white px-4 py-3 rounded-xl font-medium outline-none focus:ring-2 focus:ring-brand-500 text-sm border border-slate-200 dark:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!newMemberName.trim()}
                    className="bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 px-5 rounded-xl font-bold disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {newMemberUpiId.trim() && !newMemberUpiId.includes('@') && (
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-500 px-1">
                    UPI IDs usually require an '@' symbol (e.g. 9876543210@paytm). Pure phone numbers might fail in some apps.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#1c1c1e]">
          <button
            onClick={handleCreate}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all shadow-md shadow-brand-500/25"
          >
            {initialGroup ? 'Save Changes' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};
