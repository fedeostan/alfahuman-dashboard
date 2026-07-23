import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLedgerShipments, type LedgerShipment } from '@/lib/shipments'
import ShipmentsClient from './shipments-client'

export const dynamic = 'force-dynamic'

const ALLOWED = ['owner', 'admin', 'sales']

export default async function ShipmentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/')
  if (!ALLOWED.includes(session.user.role)) redirect('/dashboard')

  let shipments: LedgerShipment[] = []
  let error: string | null = null
  try {
    shipments = await getLedgerShipments()
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
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Envíos</p>
            <h1 className="text-white text-lg font-semibold">Confirmación y seguimiento</h1>
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

        <ShipmentsClient initial={shipments} role={session.user.role} error={error} />
      </div>
    </main>
  )
}
