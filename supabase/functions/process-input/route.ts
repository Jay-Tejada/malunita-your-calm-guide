import type { Task, UserContext, Routing } from "./types.ts";

export async function routeTasks(
  tasks: Task[],
  userContext: UserContext
): Promise<Routing> {
  
  const routing: Routing = {
    today: [],
    upcoming: [],
    someday: [],
    projects: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const task of tasks) {
    const taskText = task.cleaned;

    // Route to projects if task has project field
    if (task.project) {
      routing.projects.push(taskText);
      continue;
    }

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

    // Route by priority
    if (task.priority === 'must') {
      routing.today.push(taskText);
    } else if (task.priority === 'should') {
      routing.upcoming.push(taskText);
    } else {
      routing.someday.push(taskText);
    }
  }

  return routing;
}
