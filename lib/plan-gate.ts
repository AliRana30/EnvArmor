import type { UserPlan } from "@prisma/client";

const PLAN_RANK: Record<UserPlan, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  TEAM: 2
};

export function hasAtLeastPlan(plan: UserPlan, required: UserPlan): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}

export function projectLimitForPlan(plan: UserPlan): number | null {
  return null;
}
