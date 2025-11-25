import type { Task, UserContext, Routing } from "./types.ts";

/**
 * Smart Task Router
 * Routes tasks to appropriate buckets based on keywords and context
 */

// Routing keywords
const WORK_KEYWORDS = [
  'client', 'report', 'meeting', 'invoice', 'review', 'proposal', 
  'policy', 'billing', 'email', 'call', 'presentation', 'deadline',
  'project', 'team', 'office', 'conference', 'contract', 'budget'
];

const HOME_KEYWORDS = [
  'laundry', 'clean', 'kids', 'house', 'groceries', 'trash', 'cook',
  'family', 'dishes', 'vacuum', 'organize home', 'repairs', 'garden',
  'pets', 'shopping', 'errands', 'mail', 'bills'
];

const GYM_KEYWORDS = [
  'workout', 'exercise', 'run', 'gym', 'lift', 'cardio', 'yoga',
  'training', 'fitness', 'stretch', 'jog', 'swim', 'bike', 'hike',
  'weights', 'class', 'coach', 'reps'
];

const PROJECT_INDICATORS = [
  'phase', 'milestone', 'launch', 'build', 'develop', 'design',
  'research', 'plan', 'strategy', 'roadmap', 'long-term', 'future',
  'goal', 'vision', 'initiative', 'campaign'
];

/**
 * Detect if task matches keyword category
 */
function matchesKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Route tasks to appropriate buckets
 */
export async function routeTasks(
  tasks: Task[],
  userContext: UserContext
): Promise<Routing> {
  
  const routing: Routing = {
    today: [],
    upcoming: [],
    someday: [],
    projects: [],
    work: [],
    home: [],
    gym: [],
    inbox: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const task of tasks) {
    const taskText = task.cleaned;
    const lowerText = taskText.toLowerCase();

    // Step 1: Check for explicit project assignment or project-like language
    const isProject = task.project || matchesKeywords(lowerText, PROJECT_INDICATORS);
    if (isProject) {
      routing.projects.push(taskText);
      continue;
    }

    // Step 2: Smart category routing
    let routed = false;

    // Route to Work
    if (matchesKeywords(lowerText, WORK_KEYWORDS) || task.category === 'work') {
      routing.work.push(taskText);
      routed = true;
    }
    // Route to Home
    else if (matchesKeywords(lowerText, HOME_KEYWORDS) || task.category === 'home' || task.category === 'personal') {
      routing.home.push(taskText);
      routed = true;
    }
    // Route to Gym
    else if (matchesKeywords(lowerText, GYM_KEYWORDS) || task.category === 'health' || task.category === 'fitness') {
      routing.gym.push(taskText);
      routed = true;
    }

    // Step 3: If not routed by keywords, use time-based routing
    if (!routed) {
      // Route based on due date
      if (task.due) {
        const dueDate = new Date(task.due);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
          routing.today.push(taskText);
        } else if (diffDays <= 7) {
          routing.upcoming.push(taskText);
        } else {
          routing.someday.push(taskText);
        }
        continue;
      }

      // Route by priority if no due date
      if (task.priority === 'must') {
        routing.today.push(taskText);
      } else if (task.priority === 'should') {
        routing.upcoming.push(taskText);
      } else {
        // Everything else goes to Inbox
        routing.inbox.push(taskText);
      }
    }
  }

  return routing;
}
