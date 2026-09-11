import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, UserPlus, ArrowRight, AlertTriangle } from 'lucide-react';
import { Person, BillItem } from '../types';
import { getRandomAvatar, AVATAR_EMOJIS, AVATAR_COLORS } from '../features/people/avatarHelper';
import { EmojiPicker } from '../components/EmojiPicker';

interface PeopleStepProps {
  people: Person[];
  items: BillItem[];
  currency: string;
  onUpdatePeople: (people: Person[]) => void;
  onUpdateItems: (items: BillItem[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const PeopleStep: React.FC<PeopleStepProps> = ({
  people,
  items,
  currency,
  onUpdatePeople,
  onUpdateItems,
  onContinue,
  onBack,
}) => {
  const { t } = useTranslation();
  const [nameInput, setNameInput] = useState('');
  const [upiInput, setUpiInput] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(AVATAR_EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) return;

    // Check if name already exists
    if (people.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      alert(t('peopleStep.nameExistsAlert', { name: cleanName }));
      return;
    }

    const { avatar: defAvatar, color: defColor } = getRandomAvatar(people.length);
    const newPerson: Person = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: cleanName,
      avatar: selectedEmoji || defAvatar,
      color: selectedColor || defColor,
      upiId: upiInput.trim() || undefined,
    };

    onUpdatePeople([...people, newPerson]);
    setNameInput('');
    setUpiInput('');
    // Pick next avatar suggestion
    const nextPreset = getRandomAvatar(people.length + 1);
    setSelectedEmoji(nextPreset.avatar);
    setSelectedColor(nextPreset.color);
  };

  const handlePromptDelete = (person: Person) => {
    // Check if this person has any items assigned
    const assignedCount = items.filter(it => it.assignedPersonIds?.includes(person.id)).length;
    if (assignedCount > 0) {
      setPersonToDelete(person);
    } else {
      performDelete(person.id);
    }
  };

  const performDelete = (personId: string) => {
    // Remove person from people list
    onUpdatePeople(people.filter(p => p.id !== personId));

    // Remove person from all item assignments
    const updatedItems = items.map(item => {
      const newAssigned = (item.assignedPersonIds || []).filter(id => id !== personId);
      const newAssignments = (item.assignments || []).filter(a => a.personId !== personId);
      return {
        ...item,
        assignedPersonIds: newAssigned,
        assignments: newAssignments,
      };
    });
    onUpdateItems(updatedItems);
    setPersonToDelete(null);
  };

  // Quick preset friends
  const PRESETS = ['Hafeez', 'Joel', 'Sharon', 'Amal', 'Aloysius', 'Prajul'];
  const unaddedPresets = PRESETS.filter(
    p => !people.some(existing => existing.name.toLowerCase() === p.toLowerCase())
  );

  const handleContinue = () => {
    const cleanName = nameInput.trim();
    if (cleanName && !people.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      const { avatar: defAvatar, color: defColor } = getRandomAvatar(people.length);
      const newPerson: Person = {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: cleanName,
        avatar: selectedEmoji || defAvatar,
        color: selectedColor || defColor,
        upiId: upiInput.trim() || undefined,
      };
      onUpdatePeople([...people, newPerson]);
      setNameInput('');
      setUpiInput('');
    }
    onContinue();
  };

  return (
    <div className="max-w-md lg:max-w-3xl mx-auto px-4 py-4 space-y-5">
      {/* Step Header */}
      <div>
        <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block mb-1">
          {t('peopleStep.stepLabel')}
        </span>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('peopleStep.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          {t('peopleStep.subtitle')}
        </p>
      </div>

      {/* Selected Friends Row (Matching "Send to" in reference mockup) */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-black/5 dark:border-transparent space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t('peopleStep.friendsAdded')} ({people.length})
          </span>
          {people.length > 0 && (
            <span className="text-[11px] text-brand-600 font-semibold">
              {t('peopleStep.tapToRemove')}
            </span>
          )}
        </div>

        {people.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            {t('peopleStep.noFriendsAdded')}
          </div>
        ) : (
          <div className={
            people.length > 15 
              ? "flex flex-col gap-3 max-h-64 overflow-y-auto pr-1"
              : "grid grid-cols-4 min-[380px]:grid-cols-5 gap-x-2 gap-y-4"
          }>
            {people.map(person => {
              const assignedItemCount = items.filter(it =>
                it.assignedPersonIds?.includes(person.id)
              ).length;
              
              const isList = people.length > 15;

              return (
                <div key={person.id} className={`relative group ${isList ? 'flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800' : 'flex flex-col items-center'}`}>
                  {/* Remove pill button */}
                  <button
                    onClick={() => handlePromptDelete(person)}
                    className={`absolute ${isList ? 'relative flex-shrink-0' : '-top-1.5 -right-1.5'} z-10 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors shadow-sm`}
                    title={t('peopleStep.removeAria', { name: person.name })}
                  >
                    <X className="w-3 h-3 stroke-[3]" />
                  </button>

                  <div className={isList ? 'flex items-center gap-3 flex-1' : 'flex flex-col items-center'}>
                    {/* Circular Avatar */}
                    <div
                      className={`${isList ? 'w-10 h-10' : 'w-12 h-12'} rounded-[20px] flex items-center justify-center text-xl shadow-md transition-transform group-hover:scale-105`}
                      style={{ backgroundColor: `${person.color}20`, border: `2px solid ${person.color}` }}
                    >
                      <span>{person.avatar}</span>
                    </div>

                    {/* Person Name */}
                    <div className={isList ? 'flex flex-col' : 'flex flex-col items-center mt-1'}>
                      <span className={`text-[11px] font-bold text-slate-800 dark:text-slate-200 max-w-[60px] truncate ${isList ? 'text-left max-w-[120px]' : 'text-center'}`}>
                        {person.name}
                      </span>

                      {person.upiId && (
                        <span className={`text-[8px] text-slate-400 font-medium truncate max-w-[60px] ${isList ? 'text-left max-w-[120px]' : 'text-center'}`}>
                          {person.upiId}
                        </span>
                      )}

                      {assignedItemCount > 0 && (
                        <span className="text-[9px] text-brand-600 font-semibold mt-0.5">
                          {assignedItemCount} {assignedItemCount === 1 ? t('peopleStep.item') : t('peopleStep.items')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Friend Input Form */}
      <form
        onSubmit={handleAddPerson}
        className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-black/5 dark:border-transparent space-y-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('peopleStep.addFriendTitle')}
          </span>
          {/* Emoji selector preview */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">{t('peopleStep.avatarLabel')}</span>
            <EmojiPicker
              value={selectedEmoji}
              onChange={setSelectedEmoji}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder={t('peopleStep.namePlaceholder')}
            className="w-full text-sm font-semibold bg-[#f2f2f7] dark:bg-black px-5 py-4 rounded-[20px] border border-black/5 dark:border-transparent focus:ring-2 focus:ring-brand-500 outline-none transition-all duration-300"
          />
          <div className="flex gap-2">
            {currency === 'INR' && (
              <input
                type="text"
                value={upiInput}
                onChange={e => setUpiInput(e.target.value)}
                placeholder={t('peopleStep.upiPlaceholder')}
                className="flex-1 text-sm font-semibold bg-[#f2f2f7] dark:bg-black px-5 py-4 rounded-[20px] border border-black/5 dark:border-transparent focus:ring-2 focus:ring-brand-500 outline-none transition-all duration-300"
              />
            )}
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className={`p-4 rounded-[20px] bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white shadow-[0_8px_16px_rgb(37,99,235,0.25)] active:scale-95 transition-all duration-300 flex items-center justify-center min-w-[56px] ${currency !== 'INR' ? 'w-full' : ''}`}
              title={t('peopleStep.addFriendButton')}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              {currency !== 'INR' && <span className="ml-2 font-bold">{t('peopleStep.addFriendButton')}</span>}
            </button>
          </div>
          {currency === 'INR' && upiInput.trim() && !upiInput.includes('@') && (
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-500 px-2 mt-0.5">
              {t('peopleStep.upiWarning')}
            </p>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        {unaddedPresets.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5">
              {t('peopleStep.quickSuggestions')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {unaddedPresets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setNameInput(preset);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#1c1c1e] hover:bg-brand-50 dark:hover:bg-brand-950 text-slate-700 dark:text-slate-300 hover:text-brand-600 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3 text-slate-400" />
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Delete Confirmation Modal for assigned friend */}
      {personToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 shadow-2xl border border-black/5 dark:border-transparent space-y-4">
            <div className="w-12 h-12 rounded-[20px] bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('peopleStep.removeConfirmTitle', { name: personToDelete.name })}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('peopleStep.removeConfirmMessage', { name: personToDelete.name })}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setPersonToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-black/5 dark:border-transparent text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                {t('peopleStep.cancelButton')}
              </button>
              <button
                onClick={() => performDelete(personToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 hover:bg-rose-700"
              >
                {t('peopleStep.confirmRemoveButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-5 py-4 rounded-[20px] bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 font-bold text-sm border border-black/5 dark:border-transparent hover:bg-slate-50"
        >
          {t('peopleStep.backButton')}
        </button>

        <button
          disabled={people.length === 0 && !nameInput.trim()}
          onClick={handleContinue}
          className="flex-1 py-4 px-6 rounded-[20px] bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-[0_8px_16px_rgb(37,99,235,0.25)] flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>{t('peopleStep.continueButton')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

