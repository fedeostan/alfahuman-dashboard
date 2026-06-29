import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { n8nConfig, type PendingEnvio } from '@/lib/n8n'
import EnviosClient from './envios-client'

export const dynamic = 'force-dynamic'

const ALLOWED = ['owner', 'admin', 'sales']

async function getPending(): Promise<PendingEnvio[]> {
  const { baseUrl, secret } = n8nConfig()
  const res = await fetch(`${baseUrl}/webhook/sp-envios-pending`, {
    headers: { 'x-shared-secret': secret },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`n8n respondió ${res.status}`)
  const data = await res.json()
  return Array.isArray(data?.pending) ? data.pending : []
}

export default async function EnviosPage() {
  const session = await auth()
  if (!session?.user) redirect('/')
  if (!ALLOWED.includes(session.user.role)) redirect('/dashboard')

  let pending: PendingEnvio[] = []
  let error: string | null = null
  try {
    pending = await getPending()
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
            <h1 className="text-white text-lg font-semibold">Pendientes de aprobar</h1>
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

        <EnviosClient initial={pending} error={error} />
      </div>
    </main>
  )
}
