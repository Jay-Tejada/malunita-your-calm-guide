import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BondingTier {
  name: string;
  minScore: number;
  maxScore: number;
  unlocks: string[];
  color: string;
  description: string;
}

export const BONDING_TIERS: BondingTier[] = [
  {
    name: "Acquaintance",
    minScore: 0,
    maxScore: 99,
    unlocks: ["Basic expressions", "Default animations"],
    color: "hsl(var(--muted-foreground))",
    description: "Just getting to know each other",
  },
  {
    name: "Companion",
    minScore: 100,
    maxScore: 249,
    unlocks: ["Happy expressions", "Cozy Room world", "Gentle animations"],
    color: "hsl(var(--primary))",
    description: "A friendly presence in your day",
  },
  {
    name: "Friend",
    minScore: 250,
    maxScore: 499,
    unlocks: ["Love expressions", "Forest Clearing world", "Playful animations", "Heart particles"],
    color: "hsl(220, 100%, 60%)",
    description: "Growing closer every day",
  },
  {
    name: "Close Friend",
    minScore: 500,
    maxScore: 799,
    unlocks: ["Excited expressions", "Pastel Meadow world", "Crystal Nebula world", "Rainbow trail effect"],
    color: "hsl(280, 100%, 60%)",
    description: "A deep connection formed",
  },
  {
    name: "Soul-Bond",
    minScore: 800,
    maxScore: Infinity,
    unlocks: ["All expressions", "All worlds", "Golden sparkle effect", "Custom greetings", "Ethereal animations"],
    color: "hsl(45, 100%, 55%)",
    description: "An unbreakable bond of trust and care",
  },
];

export function getBondingTier(score: number): BondingTier {
  return BONDING_TIERS.find(tier => score >= tier.minScore && score <= tier.maxScore) || BONDING_TIERS[0];
}

export const BONDING_INCREMENTS = {
  TASK_COMPLETED: 5,
  RITUAL_COMPLETED: 15,
  MINI_GAME_PLAYED: 10,
  MALUNITA_TAP: 2,
  SNAPSHOT_SHARED: 20,
  CUSTOMIZATION_CHANGED: 8,
  DAILY_SESSION_COMPLETED: 12,
  QUEST_COMPLETED: 25,
  FIESTA_COMPLETED: 18,
};

export const BONDING_DECREMENTS = {
  INACTIVE_24H: -10,
  INACTIVE_48H: -20,
  INACTIVE_72H: -30,
  OVERWHELMING_TASKS: -5,
  HIGH_STRESS_SUSTAINED: -3,
};

class BondingMeterManager {
  private lastUpdateTime: number = Date.now();
  private updateQueue: number[] = [];
  private processingQueue: boolean = false;

  async getCurrentBonding(): Promise<{ score: number; tier: BondingTier; lastInteraction: Date | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("bonding_score, bonding_tier, last_interaction_at")
      .eq("id", user.id)
      .single();

    const score = profile?.bonding_score || 0;
    const tier = getBondingTier(score);
    const lastInteraction = profile?.last_interaction_at ? new Date(profile.last_interaction_at) : null;

    return { score, tier, lastInteraction };
  }

  async incrementBonding(amount: number, reason: string): Promise<void> {
    this.updateQueue.push(amount);
    
    if (!this.processingQueue) {
      this.processingQueue = true;
      await this.processQueue(reason);
      this.processingQueue = false;
    }
  }

  private async processQueue(reason: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const totalChange = this.updateQueue.reduce((sum, val) => sum + val, 0);
    this.updateQueue = [];

    if (totalChange === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("bonding_score, bonding_tier")
      .eq("id", user.id)
      .single();

    const currentScore = profile?.bonding_score || 0;
    const currentTier = getBondingTier(currentScore);
    const newScore = Math.max(0, currentScore + totalChange);
    const newTier = getBondingTier(newScore);

    await supabase
      .from("profiles")
      .update({
        bonding_score: newScore,
        bonding_tier: newTier.name.toLowerCase().replace(/\s+/g, '-'),
        last_interaction_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Check for tier upgrade
    if (newTier.minScore > currentTier.minScore) {
      toast.success(`Bond Level Up! 💝`, {
        description: `You've reached ${newTier.name} level with Malunita!`,
        duration: 5000,
      });
    }

    // Subtle feedback for bonding increase
    if (totalChange > 0 && totalChange >= 10) {
      toast(`+${totalChange} Bond 💖`, {
        description: reason,
        duration: 2000,
      });
    }
  }

  async decrementBonding(amount: number, reason: string): Promise<void> {
    await this.incrementBonding(-Math.abs(amount), reason);
  }

  async checkInactivityPenalty(): Promise<void> {
    const { lastInteraction } = await this.getCurrentBonding();
    if (!lastInteraction) return;

    const hoursSinceLastInteraction = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastInteraction >= 72) {
      await this.decrementBonding(
        Math.abs(BONDING_DECREMENTS.INACTIVE_72H),
        "Malunita missed you for 3 days"
      );
    } else if (hoursSinceLastInteraction >= 48) {
      await this.decrementBonding(
        Math.abs(BONDING_DECREMENTS.INACTIVE_48H),
        "Malunita missed you for 2 days"
      );
    } else if (hoursSinceLastInteraction >= 24) {
      await this.decrementBonding(
        Math.abs(BONDING_DECREMENTS.INACTIVE_24H),
        "Malunita missed you yesterday"
      );
    }
  }

  async checkStressPenalty(stressLevel: number): Promise<void> {
    // If stress has been high (>75) consistently, apply penalty
    if (stressLevel > 75) {
      await this.decrementBonding(
        Math.abs(BONDING_DECREMENTS.HIGH_STRESS_SUSTAINED),
        "High stress is affecting your bond"
      );
    }
  }

  async checkOverwhelmingTasks(taskCount: number): Promise<void> {
    // If user has an overwhelming number of incomplete tasks (>50), apply penalty
    if (taskCount > 50) {
      await this.decrementBonding(
        Math.abs(BONDING_DECREMENTS.OVERWHELMING_TASKS),
        "Too many tasks can be stressful"
      );
    }
  }
}

export const bondingMeter = new BondingMeterManager();
