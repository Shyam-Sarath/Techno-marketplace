// ─── Supabase Database Types ───────────────────────────────────────────────

export type Phase =
  | 'NOT_STARTED'
  | 'CATEGORY_A'
  | 'CATEGORY_B'
  | 'GOLDEN_POWER'
  | 'COMPLETE'

export type TechCategory = 'A' | 'B'

export interface Team {
  id: string
  team_number: number
  team_name: string
  purse: number
  is_active: boolean
  created_at: string
}

export interface Technology {
  id: string
  name: string
  category: TechCategory
  is_golden: boolean
  is_sold: boolean
  sold_to_team_id: string | null
  sold_price: number | null
  display_order: number | null
  created_at: string
  updated_at: string
}

export interface EventState {
  id: number
  phase: Phase
  current_technology_id: string | null
  started_at: string | null
  category_b_started_at: string | null
  completed_at: string | null
  updated_at: string
}

export interface Transaction {
  id: string
  technology_id: string
  team_id: string
  bid_amount: number
  phase: TechCategory
  is_voided: boolean
  created_at: string
  updated_at: string
}

export interface GoldenSwap {
  id: string
  golden_team_id: string
  golden_tech_id: string
  initiating_tech_id: string
  receiving_team_id: string
  receiving_tech_id: string
  is_reversed: boolean
  created_at: string
  updated_at: string
}

export interface PresentationOrder {
  id: string
  team_id: string
  position: 1 | 2 | 3
  created_at: string
  updated_at: string
}

// ─── Enriched / Joined types used in the UI ────────────────────────────────

export interface TechnologyWithOwner extends Technology {
  owner?: Team
}

export interface TransactionWithDetails extends Transaction {
  technology?: Technology
  team?: Team
}

export interface GoldenSwapWithDetails extends GoldenSwap {
  golden_team?: Team
  golden_tech?: Technology
  initiating_tech?: Technology
  receiving_team?: Team
  receiving_tech?: Technology
}

export interface AuctionSnapshot {
  phase: Phase
  state_updated_at: string
  current_tech_id: string | null
  current_tech_name: string | null
  current_tech_category: TechCategory | null
  current_tech_is_golden: boolean | null
  cat_a_sold: number
  cat_a_total: number
  cat_b_sold: number
  cat_b_total: number
}
