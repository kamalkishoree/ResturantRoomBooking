import type { RoomRow } from './api'

const floors = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

function slotsForFloor(f: number): number {
  return f === 10 ? 7 : 10
}

export function Building({
  rooms,
  selected,
  onToggle,
}: {
  rooms: RoomRow[]
  selected: Set<number>
  onToggle: (room: RoomRow) => void
}) {
  const byNumber = new Map(rooms.map((r) => [r.number, r]))

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          minHeight: 420,
        }}
      >
        <div
          style={{
            width: 46,
            flexShrink: 0,
            background: 'linear-gradient(180deg, #141a17, var(--lift))',
            borderRight: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 12,
            paddingBottom: 12,
            gap: 6,
          }}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            lift & stair
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {floors.map((f) => {
            const n = slotsForFloor(f)
            const row: (RoomRow | null)[] = []
            for (let p = 0; p < n; p++) {
              const num = f === 10 ? 1001 + p : f * 100 + p + 1
              row.push(byNumber.get(num) ?? null)
            }
            return (
              <div
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 6,
                  marginBottom: f === 1 ? 0 : 8,
                }}
              >
                <div
                  style={{
                    width: 34,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: 'var(--muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {f}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${n}, minmax(0,1fr))`,
                    gap: 5,
                  }}
                >
                  {row.map((cell, idx) => {
                    if (!cell) {
                      return (
                        <div
                          key={idx}
                          style={{
                            height: 34,
                            borderRadius: 2,
                            border: '1px dashed rgba(230,226,216,0.12)',
                          }}
                        />
                      )
                    }
                    const on = cell.occupied
                    const picked = selected.has(cell.number)
                    return (
                      <div
                        key={cell.id}
                        title={`${cell.number}`}
                        style={{
                          height: 34,
                          borderRadius: 2,
                          border: `1px solid ${
                            on
                              ? 'rgba(92,47,50,0.65)'
                              : 'rgba(45,74,62,0.55)'
                          }`,
                          background: on
                            ? 'var(--busy)'
                            : picked
                            ? 'linear-gradient(135deg, #d8b433, #f1d369)'
                            : 'var(--free)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontVariantNumeric: 'tabular-nums',
                          color: on ? '#f5e4e5' : '#dfece6',
                          boxShadow: on
                            ? 'inset 0 0 0 1px rgba(0,0,0,0.2)'
                            : picked
                            ? '0 0 0 1px rgba(241,211,105,0.9)'
                            : 'inset 0 0 0 1px rgba(255,255,255,0.04)',
                          cursor: on ? 'default' : 'pointer',
                        }}
                        onClick={() => {
                          if (cell.occupied) return
                          onToggle(cell)
                        }}
                      >
                        {cell.number}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 18,
          marginTop: 16,
          fontSize: 12,
          color: 'var(--muted)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 2,
              background: 'var(--free)',
              border: '1px solid rgba(45,74,62,0.55)',
            }}
          />
          open
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 2,
              background: 'var(--busy)',
              border: '1px solid rgba(92,47,50,0.65)',
            }}
          />
          taken
        </span>
      </div>
    </div>
  )
}
