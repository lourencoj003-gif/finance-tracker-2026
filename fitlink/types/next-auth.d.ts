// Augment NextAuth session and JWT types to include `id` and `role`.
// Required for session.user.id and session.user.role to type-check cleanly.

import NextAuth, { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id:   string
      role: string
    } & DefaultSession['user']
  }

  interface User {
    id:   string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:   string
    role: string
  }
}
