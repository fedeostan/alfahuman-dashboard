import { neon } from '@neondatabase/serverless'

// Lazy — called at sign-in time, not at module load/build time
export function getDb() {
  return neon(process.env.POSTGRES_URL!)
}
