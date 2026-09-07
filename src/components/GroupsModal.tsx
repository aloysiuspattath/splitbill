import React, { useRef } from 'react';
import { Group, Bill } from '../types';
import { X, Users, Trash2, Upload } from 'lucide-react';
import { validateAndSanitizeGroupJson } from '../features/export/groupShareService';

interface GroupsModalProps {
  isOpen: boolean;
  groups: Group[];
  onClose: () => void;
  onOpenGroup: (group: Group) => void;
  onDeleteGroup: (id: string) => void;
  onCreateNew: () => void;
  onImportTrip?: (payload: { group: Group; bills: Bill[] }) => Promise<void>;
}

export const GroupsModal: React.FC<GroupsModalProps> = ({
  isOpen,
  groups,
  onClose,
  onOpenGroup,
  onDeleteGroup,
  onCreateNew,
  onImportTrip,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportTrip) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const sanitized = validateAndSanitizeGroupJson(parsed);
      await onImportTrip(sanitized);
    } catch (err: any) {
      console.error('Failed to import group:', err);
      alert(err.message || 'Failed to import trip. Please make sure the JSON file is valid.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Your Groups & Trips</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {groups.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-slate-500 font-medium mb-4">You have no groups yet.</p>
            </div>
          ) : (
            groups.map(g => (
              <div key={g.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#2c2c2e]/50 p-4 rounded-2xl">
                <button onClick={() => onOpenGroup(g)} className="flex-1 text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">{g.name}</h3>
                  <p className="text-xs text-slate-500">{g.members.length} members • {g.currency}</p>
                </button>
                <button onClick={() => { if(window.confirm('Delete group and all its expenses?')) onDeleteGroup(g.id); }} className="p-2 text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#1c1c1e] space-y-2.5">
          <button onClick={onCreateNew} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all shadow-md shadow-brand-500/25">
            Create New Group
          </button>
          {onImportTrip && (
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full bg-white dark:bg-[#2c2c2e] hover:bg-slate-100 dark:hover:bg-[#38383a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Import Trip from JSON</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
