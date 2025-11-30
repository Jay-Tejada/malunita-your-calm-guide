import { formatDistanceToNow, isToday, isTomorrow, isYesterday, format } from 'date-fns';

export function naturalTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Just now
  const secondsAgo = (now.getTime() - d.getTime()) / 1000;
  if (secondsAgo < 60) return 'Just now';
  if (secondsAgo < 120) return '1 minute ago';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
  
  // Today
  if (isToday(d)) {
    const hour = d.getHours();
    if (hour < 12) return `This morning at ${format(d, 'h:mm a')}`;
    if (hour < 17) return `This afternoon at ${format(d, 'h:mm a')}`;
    return `This evening at ${format(d, 'h:mm a')}`;
  }
  
  // Yesterday
  if (isYesterday(d)) {
    return `Yesterday at ${format(d, 'h:mm a')}`;
  }
  
  // Tomorrow
  if (isTomorrow(d)) {
    return `Tomorrow at ${format(d, 'h:mm a')}`;
  }
  
  // This week
  const daysAgo = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (daysAgo < 7) {
    return `${format(d, 'EEEE')} at ${format(d, 'h:mm a')}`; // "Monday at 3:00 PM"
  }
  
  // This month
  if (daysAgo < 30) {
    return format(d, 'MMM d'); // "Nov 15"
  }
  
  // Older
  return format(d, 'MMM d, yyyy'); // "Nov 15, 2024"
}

export function naturalDeadline(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Past due
  if (d < now) {
    const daysOverdue = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue === 0) return '⚠️ Due today';
    if (daysOverdue === 1) return '🔴 Overdue by 1 day';
    return `🔴 Overdue by ${daysOverdue} days`;
  }
  
  // Today
  if (isToday(d)) {
    const hour = d.getHours();
    const currentHour = now.getHours();
    const hoursUntil = hour - currentHour;
    
    if (hoursUntil <= 1) return '⚠️ Due in less than 1 hour';
    if (hoursUntil <= 3) return `⚠️ Due at ${format(d, 'h:mm a')}`;
    if (hour < 12) return 'Due this morning';
    if (hour < 17) return 'Due this afternoon';
    return 'Due this evening';
  }
  
  // Tomorrow
  if (isTomorrow(d)) {
    const hour = d.getHours();
    if (hour < 12) return 'Due tomorrow morning';
    if (hour < 17) return 'Due tomorrow afternoon';
    return 'Due tomorrow evening';
  }
  
  // This week
  const daysUntil = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 7) {
    return `Due ${format(d, 'EEEE')}`; // "Due Monday"
  }
  
  // Next week
  if (daysUntil < 14) {
    return `Due next ${format(d, 'EEEE')}`; // "Due next Monday"
  }
  
  // Further out
  return `Due ${format(d, 'MMM d')}`; // "Due Nov 15"
}

export function naturalDuration(minutes: number): string {
  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 1 && mins === 0) return '1 hour';
  if (hours === 1) return `1 hour ${mins} min`;
  if (mins === 0) return `${hours} hours`;
  return `${hours} hours ${mins} min`;
}

export function naturalPriority(priority: 'must' | 'should' | 'could'): string {
  const map = {
    must: 'Must do',
    should: 'Should do this week',
    could: 'Do when you can'
  };
  return map[priority];
}

export function timeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}
