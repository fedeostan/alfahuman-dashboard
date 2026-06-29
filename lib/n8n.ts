// Server-only helper for talking to the n8n "SouthPost - Envios API" workflow.
// Lazy (read env at call time, never at module load) to match lib/db.ts and avoid
// build-time crashes when secrets aren't present in the build environment.

export function n8nConfig() {
  const baseUrl = process.env.N8N_BASE_URL
  const secret = process.env.N8N_SHARED_SECRET
  if (!baseUrl || !secret) {
    throw new Error('N8N_BASE_URL / N8N_SHARED_SECRET are not configured')
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), secret }
}

export type PendingEnvio = {
  id: string
  fecha?: string
  cliente?: string
  destinatario?: string
  direccion?: string
  localidad?: string
  provincia?: string
  cp?: string
  modelo?: string
  codigo_servicio?: string
  valor_declarado?: string | number
}
