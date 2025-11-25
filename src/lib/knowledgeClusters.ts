/**
 * Knowledge Clusters
 * 
 * Groups tasks into semantic domains for better organization
 * and understanding of task relationships.
 */

export interface ClusterDomain {
  id: string;
  label: string;
  color: string;
}

export const CLUSTER_DOMAINS: Record<string, ClusterDomain> = {
  work: {
    id: 'work',
    label: 'Work',
    color: 'hsl(var(--primary))',
  },
  personal: {
    id: 'personal',
    label: 'Personal',
    color: 'hsl(var(--accent))',
  },
  health: {
    id: 'health',
    label: 'Health',
    color: 'hsl(var(--success))',
  },
  learning: {
    id: 'learning',
    label: 'Learning',
    color: 'hsl(var(--info))',
  },
  social: {
    id: 'social',
    label: 'Social',
    color: 'hsl(var(--warning))',
  },
  creative: {
    id: 'creative',
    label: 'Creative',
    color: 'hsl(var(--destructive))',
  },
  maintenance: {
    id: 'maintenance',
    label: 'Maintenance',
    color: 'hsl(var(--muted))',
  },
  unknown: {
    id: 'unknown',
    label: 'Uncategorized',
    color: 'hsl(var(--muted-foreground))',
  },
};

/**
 * Get cluster domain by ID
 */
export function getClusterDomain(domainId?: string | null): ClusterDomain {
  if (!domainId) return CLUSTER_DOMAINS.unknown;
  return CLUSTER_DOMAINS[domainId] || CLUSTER_DOMAINS.unknown;
}

/**
 * Get all cluster domains
 */
export function getAllClusterDomains(): ClusterDomain[] {
  return Object.values(CLUSTER_DOMAINS);
}
