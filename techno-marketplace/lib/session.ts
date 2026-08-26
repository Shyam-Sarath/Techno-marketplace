// ─── Simple localStorage-based session (no Supabase Auth) ──────────────────

export type UserRole = 'admin' | 'team'

export interface AppSession {
  role: UserRole
  teamName: string         // "Auctioneer" for admin, team name for teams
  teamId: string | null    // null until matched against DB
}

const SESSION_KEY = 'techno_market_session'

export function saveSession(session: AppSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession(): AppSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppSession
  } catch {
    return null
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export function isAdmin(): boolean {
  return getSession()?.role === 'admin'
}
