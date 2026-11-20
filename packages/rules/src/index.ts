import type { AuthorityLevel } from "@sabha/core";

/** Phase 5 scaffold — in-memory authority; UI-only mutation later. */
export type AuthorityKey = `${string}::${string}`;

const registry = new Map<AuthorityKey, AuthorityLevel>();

export function setAuthority(
  agentId: string,
  toolCategory: string,
  level: AuthorityLevel,
  source: "user_ui" | "agent" = "user_ui",
): void {
  if (source === "agent") {
    throw new Error("No agent write path to authority registry");
  }
  registry.set(`${agentId}::${toolCategory}`, level);
}

export function getAuthority(
  agentId: string,
  toolCategory: string,
): AuthorityLevel {
  return registry.get(`${agentId}::${toolCategory}`) ?? "observe";
}

export function clearAuthorityForTests(): void {
  registry.clear();
}
