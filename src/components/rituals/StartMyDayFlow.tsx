import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Battery, BatteryLow, AlertTriangle, Check, ChevronRight, Target, ListTodo } from 'lucide-react';
import { useStartMyDayCandidates, EnergyLevel } from '@/hooks/useStartMyDayCandidates';
import { useTasks, Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

type Step = 'prime' | 'align' | 'organise' | 'complete';

interface StartMyDayFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: StartMyDayResult) => void;
}

export interface StartMyDayResult {
  energyLevel: EnergyLevel;
  hasUrgent: boolean;
  primaryTaskId: string | null;
  primaryTaskTitle: string | null;
  supportingTaskIds: string[];
}

export function StartMyDayFlow({ isOpen, onClose, onComplete }: StartMyDayFlowProps) {
  const [step, setStep] = useState<Step>('prime');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [hasUrgent, setHasUrgent] = useState(false);
  const [selectedPrimaryTask, setSelectedPrimaryTask] = useState<Task | null>(null);
  const [selectedSupportingIds, setSelectedSupportingIds] = useState<string[]>([]);

  const { primaryCandidates, supportingTasks, isLoading } = useStartMyDayCandidates(energyLevel);
  const { updateTask } = useTasks();

  // Get supporting tasks for selected primary
  const supportingOptions = selectedPrimaryTask ? supportingTasks(selectedPrimaryTask.id) : [];

  const handleEnergySelect = (level: EnergyLevel) => {
    setEnergyLevel(level);
  };

  const handlePrimeNext = () => {
    setStep('align');
  };

  const handleSelectPrimary = (task: Task) => {
    setSelectedPrimaryTask(task);
  };

  const handleAlignNext = async () => {
    if (!selectedPrimaryTask) return;

    // Set the primary task as focus
    await updateTask({
      id: selectedPrimaryTask.id,
      updates: {
        is_focus: true,
        focus_date: new Date().toISOString().split('T')[0],
        scheduled_bucket: 'today',
      },
    });

    // Check if there are supporting tasks to show
    if (supportingOptions.length > 0) {
      setStep('organise');
    } else {
      handleComplete();
    }
  };

  const handleToggleSupporting = (taskId: string) => {
    setSelectedSupportingIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAddAllSupporting = () => {
    setSelectedSupportingIds(supportingOptions.map(t => t.id));
  };

  const handleOrganiseComplete = async () => {
    // Move selected supporting tasks to today
    for (const taskId of selectedSupportingIds) {
      await updateTask({
        id: taskId,
        updates: { scheduled_bucket: 'today' },
      });
    }

    handleComplete();
  };

  const handleComplete = () => {
    setStep('complete');

    // Trigger completion callback
    onComplete({
      energyLevel,
      hasUrgent,
      primaryTaskId: selectedPrimaryTask?.id || null,
      primaryTaskTitle: selectedPrimaryTask?.title || null,
      supportingTaskIds: selectedSupportingIds,
    });

    // Auto-close after brief confirmation
    setTimeout(() => {
      onClose();
      // Reset state for next time
      setStep('prime');
      setEnergyLevel('medium');
      setHasUrgent(false);
      setSelectedPrimaryTask(null);
      setSelectedSupportingIds([]);
    }, 1500);
  };

  const handleSkip = () => {
    onComplete({
      energyLevel: 'medium',
      hasUrgent: false,
      primaryTaskId: null,
      primaryTaskTitle: null,
      supportingTaskIds: [],
    });
    onClose();
    // Reset
    setStep('prime');
    setEnergyLevel('medium');
    setHasUrgent(false);
    setSelectedPrimaryTask(null);
    setSelectedSupportingIds([]);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleSkip();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative bg-bg-surface rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <StepIndicator current={step} />
          </div>
          <button
            onClick={handleSkip}
            className="text-text-muted hover:text-text-secondary transition-colors p-1"
            aria-label="Skip"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {step === 'prime' && (
              <PrimeStep
                key="prime"
                energyLevel={energyLevel}
                hasUrgent={hasUrgent}
                onEnergySelect={handleEnergySelect}
                onUrgentToggle={setHasUrgent}
                onNext={handlePrimeNext}
              />
            )}

            {step === 'align' && (
              <AlignStep
                key="align"
                candidates={primaryCandidates}
                selectedTask={selectedPrimaryTask}
                isLoading={isLoading}
                onSelect={handleSelectPrimary}
                onNext={handleAlignNext}
                onBack={() => setStep('prime')}
              />
            )}

            {step === 'organise' && (
              <OrganiseStep
                key="organise"
                primaryTask={selectedPrimaryTask!}
                supportingTasks={supportingOptions}
                selectedIds={selectedSupportingIds}
                onToggle={handleToggleSupporting}
                onAddAll={handleAddAllSupporting}
                onComplete={handleOrganiseComplete}
                onSkip={handleComplete}
              />
            )}

            {step === 'complete' && (
              <CompleteStep key="complete" primaryTask={selectedPrimaryTask} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Step indicator dots
function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ['prime', 'align', 'organise'];
  const labels = { prime: 'Energy', align: 'Focus', organise: 'Plan', complete: 'Done' };

  if (current === 'complete') {
    return <span className="text-sm font-medium text-success">Ready to go</span>;
  }

  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              s === current ? 'bg-accent-color' : steps.indexOf(current) > i ? 'bg-success' : 'bg-border-subtle'
            )}
          />
          {s === current && (
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              {labels[s]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// STEP 1: Prime
interface PrimeStepProps {
  energyLevel: EnergyLevel;
  hasUrgent: boolean;
  onEnergySelect: (level: EnergyLevel) => void;
  onUrgentToggle: (value: boolean) => void;
  onNext: () => void;
}

function PrimeStep({ energyLevel, hasUrgent, onEnergySelect, onUrgentToggle, onNext }: PrimeStepProps) {
  const energyOptions: { level: EnergyLevel; icon: typeof Zap; label: string; color: string }[] = [
    { level: 'low', icon: BatteryLow, label: 'Low', color: 'text-amber-500' },
    { level: 'medium', icon: Battery, label: 'Medium', color: 'text-blue-500' },
    { level: 'high', icon: Zap, label: 'High', color: 'text-emerald-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-lg font-medium text-text-primary mb-1">How's your energy?</h2>
        <p className="text-sm text-text-muted">This helps pick the right tasks.</p>
      </div>

      {/* Energy buttons */}
      <div className="flex gap-3">
        {energyOptions.map(({ level, icon: Icon, label, color }) => (
          <button
            key={level}
            onClick={() => onEnergySelect(level)}
            className={cn(
              'flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all',
              energyLevel === level
                ? 'border-accent-color bg-accent-color/10'
                : 'border-border-subtle hover:border-border-subtle/80 bg-bg-surface-2'
            )}
          >
            <Icon className={cn('w-6 h-6', energyLevel === level ? color : 'text-text-muted')} />
            <span className={cn('text-sm font-medium', energyLevel === level ? 'text-text-primary' : 'text-text-secondary')}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Urgent toggle */}
      <button
        onClick={() => onUrgentToggle(!hasUrgent)}
        className={cn(
          'w-full flex items-center gap-3 p-4 rounded-xl border transition-all',
          hasUrgent
            ? 'border-amber-500/50 bg-amber-500/10'
            : 'border-border-subtle bg-bg-surface-2 hover:bg-bg-surface-2/80'
        )}
      >
        <AlertTriangle className={cn('w-5 h-5', hasUrgent ? 'text-amber-500' : 'text-text-muted')} />
        <span className={cn('text-sm', hasUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-text-secondary')}>
          Something urgent today?
        </span>
        <div
          className={cn(
            'ml-auto w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            hasUrgent ? 'bg-amber-500 border-amber-500' : 'border-border-subtle'
          )}
        >
          {hasUrgent && <Check className="w-3 h-3 text-white" />}
        </div>
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full py-3 px-4 bg-accent-color hover:bg-accent-color/90 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// STEP 2: Align
interface AlignStepProps {
  candidates: Array<Task & { score: number; reason: string }>;
  selectedTask: Task | null;
  isLoading: boolean;
  onSelect: (task: Task) => void;
  onNext: () => void;
  onBack: () => void;
}

function AlignStep({ candidates, selectedTask, isLoading, onSelect, onNext, onBack }: AlignStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-medium text-text-primary mb-1">Pick your focus</h2>
        <p className="text-sm text-text-muted">Which one moves the day forward?</p>
      </div>

      {/* Candidates */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-8 text-center text-text-muted text-sm">Loading tasks...</div>
        ) : candidates.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-text-muted text-sm mb-2">No tasks available.</p>
            <p className="text-text-muted/60 text-xs">Add some tasks first.</p>
          </div>
        ) : (
          candidates.map(task => (
            <button
              key={task.id}
              onClick={() => onSelect(task)}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all',
                selectedTask?.id === task.id
                  ? 'border-accent-color bg-accent-color/10'
                  : 'border-border-subtle bg-bg-surface-2 hover:border-border-subtle/80'
              )}
            >
              <div className="flex items-start gap-3">
                <Target
                  className={cn(
                    'w-5 h-5 mt-0.5 flex-shrink-0',
                    selectedTask?.id === task.id ? 'text-accent-color' : 'text-text-muted'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', selectedTask?.id === task.id ? 'text-text-primary' : 'text-text-secondary')}>
                    {task.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{task.reason}</p>
                </div>
                {selectedTask?.id === task.id && (
                  <Check className="w-5 h-5 text-accent-color flex-shrink-0" />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedTask}
          className={cn(
            'flex-1 py-3 px-4 font-medium rounded-xl transition-all flex items-center justify-center gap-2',
            selectedTask
              ? 'bg-accent-color hover:bg-accent-color/90 text-white'
              : 'bg-border-subtle text-text-muted cursor-not-allowed'
          )}
        >
          Set as Focus
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// STEP 3: Organise
interface OrganiseStepProps {
  primaryTask: Task;
  supportingTasks: Task[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAddAll: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

function OrganiseStep({ primaryTask, supportingTasks, selectedIds, onToggle, onAddAll, onComplete, onSkip }: OrganiseStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-medium text-text-primary mb-1">Clear the runway</h2>
        <p className="text-sm text-text-muted">Add related tasks to Today?</p>
      </div>

      {/* Primary task reminder */}
      <div className="p-3 rounded-lg bg-accent-color/10 border border-accent-color/30">
        <p className="text-xs text-accent-color font-medium uppercase tracking-wide mb-1">Your Focus</p>
        <p className="text-sm text-text-primary font-medium truncate">{primaryTask.title}</p>
      </div>

      {/* Supporting tasks */}
      <div className="space-y-2">
        {supportingTasks.map(task => (
          <button
            key={task.id}
            onClick={() => onToggle(task.id)}
            className={cn(
              'w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3',
              selectedIds.includes(task.id)
                ? 'border-success/50 bg-success/10'
                : 'border-border-subtle bg-bg-surface-2 hover:border-border-subtle/80'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                selectedIds.includes(task.id) ? 'bg-success border-success' : 'border-border-subtle'
              )}
            >
              {selectedIds.includes(task.id) && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-secondary truncate">{task.title}</p>
              {task.is_tiny_task && (
                <span className="text-[10px] text-text-muted uppercase">Quick task</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {supportingTasks.length > 0 && selectedIds.length !== supportingTasks.length && (
          <button
            onClick={onAddAll}
            className="w-full py-2.5 px-4 text-sm text-accent-color hover:text-accent-color/80 transition-colors"
          >
            Add all {supportingTasks.length}
          </button>
        )}
        <button
          onClick={onComplete}
          className="w-full py-3 px-4 bg-accent-color hover:bg-accent-color/90 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {selectedIds.length > 0 ? `Add ${selectedIds.length} to Today` : 'Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}

// Completion confirmation
function CompleteStep({ primaryTask }: { primaryTask: Task | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center"
      >
        <Check className="w-8 h-8 text-success" />
      </motion.div>
      <h2 className="text-lg font-medium text-text-primary mb-1">Ready to go</h2>
      {primaryTask && (
        <p className="text-sm text-text-muted">Focus: {primaryTask.title.substring(0, 40)}{primaryTask.title.length > 40 ? '...' : ''}</p>
      )}
    </motion.div>
  );
}
