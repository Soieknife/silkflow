import { auth } from '../auth'

/** Resolve the authenticated user id, or throw if not signed in. */
export async function requireUser(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('UNAUTHORIZED')
  return session.user.id
}
