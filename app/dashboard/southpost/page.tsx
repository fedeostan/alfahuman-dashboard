import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getShipments, statusDisplay, type Shipment } from '@/lib/southpost'

export const dynamic = 'force-dynamic'

const ALLOWED = ['owner', 'admin', 'sales']

const COLOR_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-400',
  sky: 'bg-sky-500/15 text-sky-400',
  amber: 'bg-amber-500/15 text-amber-400',
  red: 'bg-red-500/15 text-red-400',
  zinc: 'bg-zinc-500/15 text-zinc-400',
}

export default async function SouthpostPage() {
  const session = await auth()
  if (!session?.user) redirect('/')
  if (!ALLOWED.includes(session.user.role)) redirect('/dashboard')

  let shipments: Shipment[] = []
  let error: string | null = null
  try {
    shipments = await getShipments()
  } catch (e) {
    error = e instanceof Error ? e.message : 'No se pudo cargar la lista'
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <header className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/dashboard"
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors inline-flex items-center gap-1 mb-2"
            >
              <span aria-hidden>←</span> Inicio
            </Link>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Southpost</p>
            <h1 className="text-white text-lg font-semibold">Seguimiento de envíos</h1>
          </div>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button type="submit" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">
              Cerrar sesión
            </button>
          </form>
        </header>

        {error ? (
          <div className="bg-zinc-900 border border-red-900/50 rounded-2xl p-6 text-center">
            <p className="text-red-400 text-sm">No se pudo cargar la lista: {error}</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-zinc-400">Todavía no hay envíos registrados.</p>
            <p className="text-zinc-600 text-sm mt-2">
              Esta vista se completa a medida que Southpost reporta novedades.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {shipments.map((s) => {
              const status = statusDisplay(s.codigo_estado, s.estado)
              return (
                <li key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold truncate">
                          {s.destinatario || 'Sin nombre'}
                        </span>
                        <span className="text-zinc-600 text-xs font-mono shrink-0">{s.remito}</span>
                      </div>
                      {(s.localidad || s.provincia) && (
                        <p className="text-zinc-500 text-xs mt-1 truncate">
                          {s.localidad}
                          {s.provincia ? `, ${s.provincia}` : ''}
                        </p>
                      )}
                      {s.guia != null && <p className="text-zinc-600 text-xs mt-1">Guía {s.guia}</p>}
                    </div>
                    <span
                      className={`shrink-0 text-[10px] uppercase tracking-wide rounded-full px-2 py-1 ${COLOR_CLASSES[status.color]}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
