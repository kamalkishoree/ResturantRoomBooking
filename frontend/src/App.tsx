import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  bookExact,
  bookRooms,
  currentUser,
  fetchState,
  login,
  logout,
  randomOccupancy,
  register,
  resetHotel,
  type AuthUser,
  type RoomRow,
} from './api'
import { Building } from './Building'

export function App() {
  const [rooms, setRooms] = useState<RoomRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [count, setCount] = useState(2)
  const [busy, setBusy] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const [lastTrip, setLastTrip] = useState<{
    minutes: number
    nums: number[]
  } | null>(null)

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)
    try {
      const data = await fetchState()
      setRooms(data)
    } catch {
      setErr('Could not reach the desk. Is the API running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const u = await currentUser()
        setUser(u)
      } finally {
        await load()
      }
    })()
  }, [load])

  const free = useMemo(
    () => rooms.filter((r) => !r.occupied).length,
    [rooms],
  )
  const myBookedCount = useMemo(() => {
    if (!user) return 0
    return rooms.filter((r) => r.occupied && r.user_id === user.id).length
  }, [rooms, user])
  const remainingSlots = Math.max(0, 5 - myBookedCount)

  const selectedCount = picked.length

  const togglePicked = (room: RoomRow) => {
    setErr(null)
    setPicked((prev) => {
      const exists = prev.includes(room.number)
      if (exists) {
        return prev.filter((n) => n !== room.number)
      }
      if (prev.length >= 5) {
        setErr('You can hold at most five keys at once.')
        return prev
      }
      if (prev.length >= remainingSlots) {
        setErr(`You can only select ${remainingSlots} more room(s).`)
        return prev
      }
      return [...prev, room.number]
    })
  }

  const onBook = async () => {
    if (!user) {
      setErr('Sign in before placing a hold.')
      return
    }
    if (remainingSlots === 0) {
      setErr('You already have 5 active bookings.')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const useExact = picked.length > 0
      const res = useExact
        ? await bookExact(picked.slice(0, remainingSlots))
        : await bookRooms(Math.min(count, remainingSlots))
      setLastTrip({
        minutes: res.travel_minutes,
        nums: res.booked.map((b) => b.number),
      })
      setPicked([])
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Booking did not go through.')
    } finally {
      setBusy(false)
    }
  }

  const onRandom = async () => {
    setBusy(true)
    setErr(null)
    try {
      await randomOccupancy()
      setLastTrip(null)
      await load()
    } catch {
      setErr('Random fill failed.')
    } finally {
      setBusy(false)
    }
  }

  const onReset = async () => {
    setBusy(true)
    setErr(null)
    try {
      await resetHotel()
      setLastTrip(null)
      await load()
    } catch {
      setErr('Reset failed.')
    } finally {
      setBusy(false)
    }
  }

  const onSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthBusy(true)
    setErr(null)
    try {
      if (mode === 'login') {
        const u = await login(phone.trim(), password)
        setUser(u)
      } else {
        const u = await register(
          fullName.trim(),
          phone.trim(),
          password,
          email.trim() || undefined,
        )
        setUser(u)
      }
      setPassword('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not sign in.')
    } finally {
   
      window.location.reload();
      setAuthBusy(false)
    }
  }

  const onLogout = async () => {
    setAuthBusy(true)
    setErr(null)
    try {
      await logout()
      setUser(null)
      setPicked([])
    } finally {
      setAuthBusy(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 1120,
        margin: '0 auto',
        padding: '32px 22px 80px',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: '12px 28px',
          marginBottom: 28,
          borderBottom: '1px solid var(--line)',
          paddingBottom: 22,
        }}
      >
        <div style={{ flex: '1 1 220px' }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 6,
            }}
          >
            Riverstone · night desk
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 3vw, 2.1rem)' }}>
            Room holds
          </h1>
        </div>
        <p
          style={{
            margin: 0,
            maxWidth: 420,
            color: 'var(--muted)',
            fontSize: 14,
          }}
        >
          Stairs and lift sit on the west face. We route guests so the walk
          between the first and last key stays as short as the house allows.
        </p>
        {user && (
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: 'var(--muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
            }}
          >
            <span>Signed in as {user.name}</span>
            <button
              type="button"
              onClick={onLogout}
              disabled={authBusy}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                color: '#f3d4d6',
                fontSize: 11,
                textDecoration: 'underline',
                cursor: 'pointer',
                opacity: authBusy ? 0.6 : 1,
              }}
            >
              Log out
            </button>
          </div>
        )}
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 300px',
          gap: 28,
          alignItems: 'start',
        }}
      >
        <section
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 3,
            padding: '18px 16px 22px',
            boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
          }}
        >
          {loading ? (
            <div style={{ color: 'var(--muted)', padding: 20 }}>Pulling ledger…</div>
          ) : (
            <Building rooms={rooms} selected={new Set(picked)} onToggle={togglePicked} />
          )}
        </section>

        <aside
          style={{
            position: 'sticky',
            top: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {!user && (
            <div
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 3,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  marginBottom: 12,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    flex: 1,
                    padding: '6px 0 10px',
                    border: 'none',
                    background: 'transparent',
                    color: mode === 'login' ? '#fff' : 'var(--muted)',
                    fontSize: 13,
                    fontWeight: mode === 'login' ? 600 : 500,
                    borderBottom:
                      mode === 'login' ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  style={{
                    flex: 1,
                    padding: '6px 0 10px',
                    border: 'none',
                    background: 'transparent',
                    color: mode === 'register' ? '#fff' : 'var(--muted)',
                    fontSize: 13,
                    fontWeight: mode === 'register' ? 600 : 500,
                    borderBottom:
                      mode === 'register'
                        ? '2px solid var(--accent)'
                        : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  New guest
                </button>
              </div>

              <form
                onSubmit={onSubmitAuth}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {mode === 'register' && (
                  <label style={{ fontSize: 13 }}>
                    <div style={{ color: 'var(--muted)', marginBottom: 4 }}>Full name</div>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 2,
                        border: '1px solid var(--line)',
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                        fontSize: 13,
                      }}
                    />
                  </label>
                )}
                <label style={{ fontSize: 13 }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 4 }}>Phone number</div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 2,
                      border: '1px solid var(--line)',
                      background: 'var(--ink)',
                      color: 'var(--paper)',
                      fontSize: 13,
                    }}
                  />
                </label>
                <label style={{ fontSize: 13 }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 4 }}>Password</div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 2,
                      border: '1px solid var(--line)',
                      background: 'var(--ink)',
                      color: 'var(--paper)',
                      fontSize: 13,
                    }}
                  />
                </label>
                {mode === 'register' && (
                  <label style={{ fontSize: 13 }}>
                    <div style={{ color: 'var(--muted)', marginBottom: 4 }}>
                      Email (optional, for receipts)
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 2,
                        border: '1px solid var(--line)',
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                        fontSize: 13,
                      }}
                    />
                  </label>
                )}
                <button
                  type="submit"
                  disabled={authBusy}
                  style={{
                    marginTop: 4,
                    padding: '9px 12px',
                    borderRadius: 2,
                    border: 'none',
                    background:
                      'linear-gradient(165deg, var(--accent), var(--accent-dim))',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    opacity: authBusy ? 0.6 : 1,
                  }}
                >
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>
            </div>
          )}

          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 3,
              padding: 18,
            }}
          >
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: '1.15rem',
              }}
            >
              Request keys
            </h2>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: 'var(--muted)',
                marginBottom: 6,
              }}
            >
              Rooms in one name (1–5)
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="number"
                min={1}
                max={Math.max(1, remainingSlots)}
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.min(
                      Math.max(1, remainingSlots),
                      Math.max(1, Number(e.target.value) || 1),
                    ),
                  )
                }
                style={{
                  width: 72,
                  padding: '10px 12px',
                  borderRadius: 2,
                  border: '1px solid var(--line)',
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  fontSize: 16,
                }}
              />
              <button
                type="button"
                onClick={onBook}
                disabled={busy || loading}
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: 2,
                  border: 'none',
                  background:
                    'linear-gradient(165deg, var(--accent), var(--accent-dim))',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 15,
                  opacity: busy || loading ? 0.55 : 1,
                }}
              >
                {busy ? 'Working…' : picked.length ? 'Book selected' : 'Best placement'}
              </button>
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: 'var(--muted)',
              }}
            >
              {free} rooms free right now. My active bookings: {myBookedCount}/5. Selected{' '}
              {selectedCount || 0}.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onRandom}
              disabled={busy || loading}
              style={{
                padding: '11px 14px',
                borderRadius: 2,
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--paper)',
                fontWeight: 600,
                opacity: busy || loading ? 0.5 : 1,
              }}
            >
              Shuffle occupancy
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={busy || loading}
              style={{
                padding: '11px 14px',
                borderRadius: 2,
                border: '1px solid rgba(92,47,50,0.6)',
                background: 'rgba(92,47,50,0.15)',
                color: '#f0d6d8',
                fontWeight: 600,
                opacity: busy || loading ? 0.5 : 1,
              }}
            >
              Clear every hold
            </button>
          </div>

          {lastTrip && (
            <div
              style={{
                background: 'rgba(45,74,62,0.35)',
                border: '1px solid rgba(45,74,62,0.7)',
                borderRadius: 3,
                padding: 14,
                fontSize: 14,
              }}
            >
              <div style={{ color: 'var(--muted)', marginBottom: 6 }}>
                Last walk across keys
              </div>
              <div style={{ fontWeight: 600 }}>
                {lastTrip.minutes.toFixed(1)} minutes end to end
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                  wordBreak: 'break-all',
                }}
              >
                {lastTrip.nums.join(' · ')}
              </div>
            </div>
          )}

          {err && (
            <div
              style={{
                padding: 12,
                borderRadius: 2,
                border: '1px solid rgba(92,47,50,0.55)',
                background: 'rgba(92,47,50,0.2)',
                color: '#f3d4d6',
                fontSize: 14,
              }}
            >
              {err}
            </div>
          )}
        </aside>
      </div>

      <footer
        style={{
          marginTop: 36,
          fontSize: 12,
          color: 'var(--muted)',
        }}
      >
        97 rooms · west stair · 1 min across a door · 2 min per floor
      </footer>
    </div>
  )
}
