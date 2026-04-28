import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/')

  const { email, name, id } = session.user
  const botLink = `https://t.me/alfahackers_bot?start=${id}`

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-sm border border-zinc-800 shadow-xl text-center">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Bienvenido</p>
        <h1 className="text-white text-lg font-semibold mb-8 truncate">{name || email}</h1>

        <a
          href={botLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl px-4 py-4 text-base transition-colors mb-6"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z"/>
          </svg>
          Hablar con el bot
        </a>

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
      </div>
    </main>
  )
}
