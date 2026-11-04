import { canAddProjects } from '@/domain/plan';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';

/** Can this device / account add `adding` more projects now (free plan: 1 project; Pro: unlimited)? */
export function hasProjectSlot(adding = 1): boolean {
  return canAddProjects(useProjectStore.getState().projects, useAuthStore.getState().user, adding);
}
