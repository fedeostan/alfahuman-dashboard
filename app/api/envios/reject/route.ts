import { auth } from '@/auth'
import { n8nConfig } from '@/lib/n8n'

const ALLOWED = ['owner', 'admin', 'sales']

// Proxies a "no envía" (reject) to the n8n SouthPost Envios API.
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (!ALLOWED.includes(session.user.role)) {
    return Response.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const { id } = await req.json().catch(() => ({}))
  if (!id) {
    return Response.json({ ok: false, error: 'missing id' }, { status: 400 })
  }

  const { baseUrl, secret } = n8nConfig()
  const res = await fetch(`${baseUrl}/webhook/sp-envios-reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-shared-secret': secret },
    body: JSON.stringify({ id, rejectedBy: session.user.id }),
  })

  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
