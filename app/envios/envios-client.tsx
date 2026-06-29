'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PendingEnvio } from '@/lib/n8n'

type Action = 'approve' | 'reject'
type RowState = { busy?: Action; done?: string; error?: string }

export default function EnviosClient({
  initial,
  error,
}: {
  initial: PendingEnvio[]
  error: string | null
}) {
  const router = useRouter()
  const [rows, setRows] = useState<PendingEnvio[]>(initial)
  const [state, setState] = useState<Record<string, RowState>>({})

  async function act(id: string, action: Action) {
    setState((s) => ({ ...s, [id]: { busy: action } }))
    try {
      const res = await fetch(`/api/envios/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data?.ok) {
        const done =
          action === 'approve'
            ? data.alreadyApproved
              ? `Ya tenía guía ${data.guia}`
              : `Guía ${data.guia} creada`
            : 'Marcado sin envío'
        setState((s) => ({ ...s, [id]: { done } }))
        // Drop the row after a beat so the user sees the confirmation.
        setTimeout(() => {
          setRows((rs) => rs.filter((r) => r.id !== id))
          router.refresh()
        }, 1200)
      } else {
        setState((s) => ({ ...s, [id]: { error: data?.error || `Error (${res.status})` } }))
      }
    } catch {
      setState((s) => ({ ...s, [id]: { error: 'Error de red' } }))
    }
  }

  if (error) {
    return (
      <div className="bg-zinc-900 border border-red-900/50 rounded-2xl p-6 text-center">
        <p className="text-red-400 text-sm">No se pudo cargar la lista: {error}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 text-zinc-400 hover:text-white text-sm underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
        <p className="text-zinc-400">No hay envíos pendientes. 🎉</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const st = state[r.id] || {}
        const isPickup = (r.codigo_servicio || '').toUpperCase() === 'PACK5'
        return (
          <li
            key={r.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold truncate">
                    {r.cliente || r.destinatario || 'Sin nombre'}
                  </span>
                  <span className="text-zinc-600 text-xs font-mono shrink-0">{r.id}</span>
                </div>
                {r.modelo && <p className="text-zinc-400 text-sm mt-0.5 truncate">{r.modelo}</p>}
                {r.direccion && (
                  <p className="text-zinc-500 text-xs mt-1 truncate">
                    {r.direccion}
                    {r.localidad ? `, ${r.localidad}` : ''}
                    {r.cp ? ` (${r.cp})` : ''}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 text-[10px] uppercase tracking-wide rounded-full px-2 py-1 ${
                  isPickup ? 'bg-amber-500/15 text-amber-400' : 'bg-sky-500/15 text-sky-400'
                }`}
              >
                {isPickup ? 'Retiro' : 'Entrega'}
              </span>
            </div>

            {st.done ? (
              <p className="text-emerald-400 text-sm py-2">{st.done}</p>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => act(r.id, 'approve')}
                  disabled={!!st.busy}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
                >
                  {st.busy === 'approve' ? 'Creando guía…' : 'Aprobar'}
                </button>
                <button
                  onClick={() => act(r.id, 'reject')}
                  disabled={!!st.busy}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 font-medium rounded-xl px-4 py-2.5 text-sm transition-colors"
                >
                  {st.busy === 'reject' ? '…' : 'No envía'}
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
