const base = '/api'

export type RoomRow = {
  id: number
  number: number
  floor: number
  position: number
  occupied: boolean
  user_id: number | null
}

export type AuthUser = {
  id: number
  name: string
  phone: string
  email: string | null
}

let token: string | null =
  typeof window !== 'undefined' ? window.localStorage.getItem('riverstone_token') : null

function authHeaders() {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export function setToken(next: string | null) {
  token = next
  if (typeof window === 'undefined') return
  if (next) {
    window.localStorage.setItem('riverstone_token', next)
  } else {
    window.localStorage.removeItem('riverstone_token')
  }
}

export async function currentUser(): Promise<AuthUser | null> {
  const r = await fetch(`${base}/auth/me`, {
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
    },
  })
  if (!r.ok) return null
  return (await r.json()) as AuthUser
}

export async function register(name: string, phone: string, password: string, email?: string) {
  const r = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ name, phone, password, email: email || undefined }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.message ?? 'Register failed')
  setToken(j.token)
  return j.user as AuthUser
}

export async function login(phone: string, password: string) {
  const r = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ phone, password }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.message ?? 'Login failed')
  setToken(j.token)
  return j.user as AuthUser
}

export async function logout() {
  await fetch(`${base}/auth/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
    },
  })
  setToken(null)
}

export async function fetchState(): Promise<RoomRow[]> {
  const r = await fetch(`${base}/hotel/state`, {
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
    },
  })
  if (!r.ok) throw new Error('state failed')
  const j = await r.json()
  return j.rooms as RoomRow[]
}

export async function bookRooms(count: number) {
  const r = await fetch(`${base}/hotel/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ count }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.message ?? 'book failed')
  return j as {
    booked: { number: number; floor: number; position: number }[]
    travel_minutes: number
  }
}

export async function bookExact(numbers: number[]) {
  const r = await fetch(`${base}/hotel/book-exact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ numbers }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.message ?? 'Booking did not go through.')
  return j as {
    booked: { number: number; floor: number; position: number }[]
    travel_minutes: number
  }
}

export async function randomOccupancy(density?: number) {
  const r = await fetch(`${base}/hotel/random`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(density != null ? { density } : {}),
  })
  if (!r.ok) throw new Error('random failed')
  return r.json() as Promise<{ occupied_count: number }>
}

export async function resetHotel() {
  const r = await fetch(`${base}/hotel/reset`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
    },
  })
  if (!r.ok) throw new Error('reset failed')
  return r.json()
}
