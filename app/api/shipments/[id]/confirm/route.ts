import { auth } from '@/auth'
import { getDb } from '@/lib/db'

const ALLOWED = ['owner', 'admin', 'sales']

// Confirmar: flips a pending_confirmation row to confirmed and stamps the actor.
// This does NOT book the courier — PRD 4 (SouthPost guía) consumes `confirmed`
// rows separately. Guarded on status = 'pending_confirmation' so a double-tap or
// a race can never downgrade an already-advanced row.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (!ALLOWED.includes(session.user.role)) {
    return Response.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  if (!id) {
    return Response.json({ ok: false, error: 'missing id' }, { status: 400 })
  }

  const actor = session.user.email || session.user.name || session.user.id

  const sql = getDb()
  const rows = await sql`
    UPDATE shipments
    SET status = 'confirmed', confirmed_by = ${actor}, confirmed_at = now(), updated_at = now()
    WHERE id = ${id} AND status = 'pending_confirmation'
    RETURNING id, status
  `
  if (rows.length === 0) {
    return Response.json(
      { ok: false, error: 'not_pending', message: 'El envío ya no está pendiente (o no existe).' },
      { status: 409 },
    )
  }
  return Response.json({ ok: true, id, status: 'confirmed' })
}
