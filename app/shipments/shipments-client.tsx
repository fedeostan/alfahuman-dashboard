'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LedgerShipment, LedgerStatus } from '@/lib/shipments'

const ACT_ROLES = ['owner', 'admin', 'sales']

// Inlined (not imported from lib/shipments) so this client bundle never pulls in
// the getDb()/neon server import. Kept in sync with lib/shipments' STATUS_MAP.
const STATUS_MAP: Record<LedgerStatus, { label: string; color: string }> = {
  pending_confirmation: { label: 'Pendiente', color: 'bg-amber-500/15 text-amber-400' },
  confirmed: { label: 'Confirmado', color: 'bg-sky-500/15 text-sky-400' },
  guia_created: { label: 'Guía creada', color: 'bg-sky-500/15 text-sky-400' },
  in_transit: { label: 'En tránsito', color: 'bg-sky-500/15 text-sky-400' },
  delivered: { label: 'Entregada', color: 'bg-emerald-500/15 text-emerald-400' },
  cancelled: { label: 'Cancelada', color: 'bg-zinc-500/15 text-zinc-400' },
  error: { label: 'Error', color: 'bg-red-500/15 text-red-400' },
}

type Action = 'confirm' | 'cancel'
type RowState = { busy?: Action; error?: string }

export default function ShipmentsClient({
  initial,
  role,
  error,
}: {
  initial: LedgerShipment[]
  role: string
  error: string | null
}) {
  const router = useRouter()
  const [rows, setRows] = useState<LedgerShipment[]>(initial)
  const [state, setState] = useState<Record<string, RowState>>({})
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const canAct = ACT_ROLES.includes(role)

  async function act(id: string, action: Action) {
    setState((s) => ({ ...s, [id]: { busy: action } }))
    try {
      const res = await fetch(`/api/shipments/${id}/${action}`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.ok) {
        if (action === 'cancel') {
          // Cancelled rows drop off the list (the server query hides them).
          setRows((rs) => rs.filter((r) => r.id !== id))
        } else {
          setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'confirmed' as LedgerStatus } : r)))
        }
        setState((s) => {
          const next = { ...s }
          delete next[id]
          return next
        })
        router.refresh()
      } else {
        setState((s) => ({ ...s, [id]: { error: data?.message || data?.error || `Error (${res.status})` } }))
      }
    } catch {
      setState((s) => ({ ...s, [id]: { error: 'Error de red' } }))
    }
  }

  if (error) {
    return (
      <div className="bg-zinc-900 border border-red-900/50 rounded-2xl p-6 text-center">
        <p className="text-red-400 text-sm">No se pudo cargar la lista: {error}</p>
        <button onClick={() => router.refresh()} className="mt-4 text-zinc-400 hover:text-white text-sm underline">
          Reintentar
        </button>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
        <p className="text-zinc-400">No hay envíos pendientes ni activos. 🎉</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const st = state[r.id] || {}
        const badge = STATUS_MAP[r.status] || STATUS_MAP.error
        const isPickup = (r.codigo_servicio || '').toUpperCase() === 'PACK5'
        const productos = Array.isArray(r.productos) ? r.productos : []
        const history = Array.isArray(r.tracking_history) ? r.tracking_history : []
        const isPending = r.status === 'pending_confirmation'
        const expanded = !!open[r.id]

        return (
          <li key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold truncate">{r.cliente || 'Sin nombre'}</span>
                  <span className="text-zinc-600 text-xs font-mono shrink-0">{r.order_ref}</span>
                </div>
                {r.direccion && (
                  <p className="text-zinc-500 text-xs mt-1 truncate">
                    {r.direccion}
                    {r.localidad ? `, ${r.localidad}` : ''}
                    {r.provincia ? `, ${r.provincia}` : ''}
                    {r.cp ? ` (${r.cp})` : ''}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                  <span className="text-zinc-600 text-[11px]">{r.source === 'manual' ? 'Manual' : 'Shopify'}</span>
                  <span className="text-zinc-600 text-[11px]">{isPickup ? 'Retiro' : 'Entrega'}</span>
                  {r.southpost_guia != null && (
                    <span className="text-zinc-500 text-[11px]">Guía {r.southpost_guia}</span>
                  )}
                  {r.estado && <span className="text-zinc-500 text-[11px]">{r.estado}</span>}
                </div>
              </div>
              <span className={`shrink-0 text-[10px] uppercase tracking-wide rounded-full px-2 py-1 ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            {(productos.length > 0 || history.length > 0) && (
              <button
                onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}
                className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors mb-2"
              >
                {expanded ? '▾ Ocultar detalle' : '▸ Ver detalle'}
              </button>
            )}

            {expanded && (
              <div className="mb-3 space-y-2">
                {productos.length > 0 && (
                  <div>
                    <p className="text-zinc-600 text-[11px] uppercase tracking-wide mb-1">Productos</p>
                    <ul className="text-zinc-400 text-sm space-y-0.5">
                      {productos.map((p, i) => (
                        <li key={i}>
                          • {p.descripcion || 'Producto'}
                          {p.quantity ? ` ×${p.quantity}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {history.length > 0 && (
                  <div>
                    <p className="text-zinc-600 text-[11px] uppercase tracking-wide mb-1">Historial</p>
                    <ul className="text-zinc-500 text-xs space-y-0.5">
                      {history.map((h, i) => (
                        <li key={i}>
                          {h.fecha ? `${h.fecha} — ` : ''}
                          {h.estado || h.codigo_estado || JSON.stringify(h)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {isPending && canAct && (
              <div className="flex gap-2">
                <button
                  onClick={() => act(r.id, 'confirm')}
                  disabled={!!st.busy}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
                >
                  {st.busy === 'confirm' ? 'Confirmando…' : 'Confirmar'}
                </button>
                <button
                  onClick={() => act(r.id, 'cancel')}
                  disabled={!!st.busy}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 font-medium rounded-xl px-4 py-2.5 text-sm transition-colors"
                >
                  {st.busy === 'cancel' ? '…' : 'Cancelar'}
                </button>
              </div>
            )}
            {st.error && <p className="text-red-400 text-xs mt-2">{st.error}</p>}
          </li>
        )
      })}
    </ul>
  )
}
