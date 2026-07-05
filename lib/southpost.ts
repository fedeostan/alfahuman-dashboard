import { getDb } from './db'

// Read-only. This app never calls the Southpost API directly and never holds
// its token — n8n owns that and writes rows here on every shipment event.

export type Shipment = {
  id: string
  remito: string
  guia: number | null
  codigo_servicio: string | null
  estado: string | null
  codigo_estado: string | null
  destinatario: string | null
  localidad: string | null
  provincia: string | null
  importe: number | null
  created_at: string
  updated_at: string
}

export async function getShipments(): Promise<Shipment[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, remito, guia, codigo_servicio, estado, codigo_estado,
           destinatario, localidad, provincia, importe, created_at, updated_at
    FROM southpost_shipments
    ORDER BY updated_at DESC
    LIMIT 200
  `
  return rows as Shipment[]
}

// codigo_estado -> display mapping. The n8n side hasn't confirmed the full
// list yet, so this stays a lookup (easy to extend) rather than an enum —
// unknown codes fall back to the raw `estado` text with a neutral color.
export type StatusDisplay = { label: string; color: 'emerald' | 'sky' | 'amber' | 'red' | 'zinc' }

const STATUS_MAP: Record<string, StatusDisplay> = {
  ENT: { label: 'Entregada', color: 'emerald' },
}

export function statusDisplay(codigo_estado: string | null, estado: string | null): StatusDisplay {
  if (codigo_estado && STATUS_MAP[codigo_estado]) return STATUS_MAP[codigo_estado]
  return { label: estado || 'Sin estado', color: 'zinc' }
}
