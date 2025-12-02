import { useState, useEffect } from 'react';

interface CheckIn {
  date: string;
  note: string;
}

const BodyCheckIn = () => {
  const [todayNote, setTodayNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('malunita_body_checkins');
    if (stored) {
      const checkins: CheckIn[] = JSON.parse(stored);
      const todayEntry = checkins.find(c => c.date === today);
      if (todayEntry) {
        setTodayNote(todayEntry.note);
        setSaved(true);
      }
    }
  }, []);

  const saveCheckIn = (note: string) => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('malunita_body_checkins');
    const checkins: CheckIn[] = stored ? JSON.parse(stored) : [];
    
    // Update or add today's entry
    const existingIndex = checkins.findIndex(c => c.date === today);
    if (existingIndex >= 0) {
      checkins[existingIndex].note = note;
    } else {
      checkins.unshift({ date: today, note });
    }
    
    // Keep last 30 days
    localStorage.setItem('malunita_body_checkins', JSON.stringify(checkins.slice(0, 30)));
    setTodayNote(note);
    setSaved(true);
  };

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
        Body Check-In
      </p>
      {saved ? (
        <div className="flex items-center justify-between">
          <p className="text-sm font-mono text-foreground/50 italic">"{todayNote}"</p>
          <button
            onClick={() => setSaved(false)}
            className="text-[10px] text-foreground/30 hover:text-foreground/50"
          >
            edit
          </button>
        </div>
      ) : (
        <input
          type="text"
          defaultValue={todayNote}
          placeholder="How did your body feel today?"
          className="w-full bg-transparent border-b border-foreground/10 py-2 font-mono text-sm text-foreground/60 placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              saveCheckIn(e.currentTarget.value.trim());
            }
          }}
          onBlur={(e) => {
            if (e.currentTarget.value.trim()) {
              saveCheckIn(e.currentTarget.value.trim());
            }
          }}
        />
      )}
    </div>
  );
};

export default BodyCheckIn;
