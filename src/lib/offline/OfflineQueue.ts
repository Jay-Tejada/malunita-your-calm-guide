interface QueuedAction {
  id: string;
  type: 'create_task' | 'update_task' | 'delete_task' | 'journal_entry';
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'offline_queue';
const MAX_RETRIES = 3;

class OfflineQueueManager {
  private queue: QueuedAction[] = [];
  private processing = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('📡 Connection restored, syncing...');
      this.notifyListeners(true);
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📡 Connection lost, entering offline mode');
      this.notifyListeners(false);
    });
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  addAction(type: QueuedAction['type'], payload: any): string {
    const action: QueuedAction = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(action);
    this.saveQueue();

    console.log(`📋 Queued ${type} action (offline)`, action.id);

    // Try to process immediately if online
    if (this.isOnline()) {
      this.processQueue();
    }

    return action.id;
  }

  async processQueue() {
    if (this.processing || !this.isOnline() || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`🔄 Processing ${this.queue.length} queued actions...`);

    const failedActions: QueuedAction[] = [];

    for (const action of this.queue) {
      try {
        await this.executeAction(action);
        console.log(`✅ Synced ${action.type}`, action.id);
      } catch (error) {
        console.error(`❌ Failed to sync ${action.type}:`, error);
        
        action.retries++;
        if (action.retries < MAX_RETRIES) {
          failedActions.push(action);
        } else {
          console.error(`🚫 Exceeded retry limit for action ${action.id}`);
        }
      }
    }

    this.queue = failedActions;
    this.saveQueue();
    this.processing = false;

    if (this.queue.length > 0) {
      console.log(`⚠️ ${this.queue.length} actions still pending`);
    } else {
      console.log('✨ All actions synced successfully');
    }
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    // Dynamic import to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');

    switch (action.type) {
      case 'create_task': {
        const { error } = await supabase
          .from('tasks')
          .insert(action.payload);
        if (error) throw error;
        break;
      }

      case 'update_task': {
        const { id, ...updates } = action.payload;
        const { error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
        break;
      }

      case 'delete_task': {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', action.payload.id);
        if (error) throw error;
        break;
      }

      case 'journal_entry': {
        const { error } = await supabase
          .from('journal_entries')
          .insert(action.payload);
        if (error) throw error;
        break;
      }

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  onStatusChange(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener);
    // Call immediately with current status
    listener(this.isOnline());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline));
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueueManager();
