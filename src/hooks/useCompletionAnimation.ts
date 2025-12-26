import { useLocation } from "react-router-dom";

export type CompletionContext = 'inbox' | 'today' | 'work' | 'home' | 'someday' | 'project';

export interface CompletionAnimationConfig {
  // Timing
  checkboxPulseDuration: number;
  textFadeDelay: number;
  rowExitDelay: number;
  collapseDuration: number;
  totalBeforeComplete: number;
  
  // Visual intensity
  showRipple: boolean;
  showSlide: boolean;
  slideDistance: number;
  textStrikethrough: boolean;
  checkboxScale: number;
  rowFadeOpacity: number;
}

const animationConfigs: Record<CompletionContext, CompletionAnimationConfig> = {
  // INBOX: Softest - fade only, no slide, quick collapse
  inbox: {
    checkboxPulseDuration: 100,
    textFadeDelay: 0,
    rowExitDelay: 80,
    collapseDuration: 150,
    totalBeforeComplete: 120,
    showRipple: false,
    showSlide: false,
    slideDistance: 0,
    textStrikethrough: false,
    checkboxScale: 1.08,
    rowFadeOpacity: 0.5,
  },
  
  // TODAY: Snappier timing, full sequence for momentum
  today: {
    checkboxPulseDuration: 100,
    textFadeDelay: 20,
    rowExitDelay: 100,
    collapseDuration: 150,
    totalBeforeComplete: 150,
    showRipple: true,
    showSlide: true,
    slideDistance: 4,
    textStrikethrough: true,
    checkboxScale: 1.15,
    rowFadeOpacity: 0.6,
  },
  
  // WORK: Standard full animation sequence
  work: {
    checkboxPulseDuration: 120,
    textFadeDelay: 30,
    rowExitDelay: 120,
    collapseDuration: 200,
    totalBeforeComplete: 180,
    showRipple: true,
    showSlide: true,
    slideDistance: 4,
    textStrikethrough: true,
    checkboxScale: 1.15,
    rowFadeOpacity: 0.6,
  },
  
  // HOME: Same as work
  home: {
    checkboxPulseDuration: 120,
    textFadeDelay: 30,
    rowExitDelay: 120,
    collapseDuration: 200,
    totalBeforeComplete: 180,
    showRipple: true,
    showSlide: true,
    slideDistance: 4,
    textStrikethrough: true,
    checkboxScale: 1.15,
    rowFadeOpacity: 0.6,
  },
  
  // SOMEDAY: Standard animation
  someday: {
    checkboxPulseDuration: 120,
    textFadeDelay: 30,
    rowExitDelay: 120,
    collapseDuration: 200,
    totalBeforeComplete: 180,
    showRipple: true,
    showSlide: true,
    slideDistance: 4,
    textStrikethrough: true,
    checkboxScale: 1.15,
    rowFadeOpacity: 0.6,
  },
  
  // PROJECT: Same as work/someday
  project: {
    checkboxPulseDuration: 120,
    textFadeDelay: 30,
    rowExitDelay: 120,
    collapseDuration: 200,
    totalBeforeComplete: 180,
    showRipple: true,
    showSlide: true,
    slideDistance: 4,
    textStrikethrough: true,
    checkboxScale: 1.15,
    rowFadeOpacity: 0.6,
  },
};

export function getCompletionContext(pathname: string): CompletionContext {
  if (pathname.includes('/inbox')) return 'inbox';
  if (pathname.includes('/today')) return 'today';
  if (pathname.includes('/work')) return 'work';
  if (pathname.includes('/home')) return 'home';
  if (pathname.includes('/someday')) return 'someday';
  if (pathname.includes('/project')) return 'project';
  // Default to work for unknown routes
  return 'work';
}

export function useCompletionAnimation(contextOverride?: CompletionContext): {
  context: CompletionContext;
  config: CompletionAnimationConfig;
} {
  const location = useLocation();
  const context = contextOverride || getCompletionContext(location.pathname);
  const config = animationConfigs[context];
  
  return { context, config };
}

export function getCompletionConfig(context: CompletionContext): CompletionAnimationConfig {
  return animationConfigs[context];
}
