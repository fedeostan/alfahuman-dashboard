import { getDb } from './db'

// The unified `shipments` ledger (PRD 0) — the single source of truth for the
// shipping pipeline: dedup ledger (keyed on order_ref), dashboard tracking table,
// and confirm work-queue. n8n writes rows via the Postgres node; this app reads
// them via getDb() and flips status on confirm/cancel. Read-only for tracking
// fields; the human only sets confirmed/cancelled here (no SouthPost call).

export type LedgerStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'guia_created'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'error'

export type Producto = { descripcion?: string; quantity?: number }
export type TrackingEvent = { estado?: string; codigo_estado?: string; fecha?: string; [k: string]: unknown }

export type LedgerShipment = {
  id: string
  order_ref: string
  source: string | null
  status: LedgerStatus
  cliente: string | null
  telefono: string | null
  direccion: string | null
  localidad: string | null
  provincia: string | null
  cp: string | null
  codigo_servicio: string | null
  productos: Producto[] | null
  formalidad: string | null
  fc: string | null
  southpost_guia: number | null
  estado: string | null
  codigo_estado: string | null
  tracking_history: TrackingEvent[] | null
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

// Pending first (the work-queue), then everything active by recency. Cancelled
// rows are hidden — they're a terminal dead-end, not part of the queue or tracking.
export async function getLedgerShipments(): Promise<LedgerShipment[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, order_ref, source, status, cliente, telefono, direccion, localidad,
           provincia, cp, codigo_servicio, productos, formalidad, fc, southpost_guia,
           estado, codigo_estado, tracking_history, confirmed_by, confirmed_at,
           created_at, updated_at
    FROM shipments
    WHERE status <> 'cancelled'
    ORDER BY CASE WHEN status = 'pending_confirmation' THEN 0 ELSE 1 END,
             updated_at DESC
    LIMIT 200
  `
  return rows as LedgerShipment[]
}

export type StatusDisplay = { label: string; color: 'emerald' | 'sky' | 'amber' | 'red' | 'zinc' }

const STATUS_MAP: Record<LedgerStatus, StatusDisplay> = {
  pending_confirmation: { label: 'Pendiente', color: 'amber' },
  confirmed: { label: 'Confirmado', color: 'sky' },
  guia_created: { label: 'Guía creada', color: 'sky' },
  in_transit: { label: 'En tránsito', color: 'sky' },
  delivered: { label: 'Entregada', color: 'emerald' },
  cancelled: { label: 'Cancelada', color: 'zinc' },
  error: { label: 'Error', color: 'red' },
}

export function ledgerStatusDisplay(status: LedgerStatus): StatusDisplay {
  return STATUS_MAP[status] || { label: status || 'Sin estado', color: 'zinc' }
}
