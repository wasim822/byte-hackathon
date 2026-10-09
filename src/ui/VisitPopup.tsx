import { useGameStore } from '../store/gameStore'

export function VisitPopup() {
  const visitPopup = useGameStore((state) => state.visitPopup)
  const hideVisitPopup = useGameStore((state) => state.hideVisitPopup)
  const markRecentlyVisited = useGameStore((state) => state.markRecentlyVisited)

  if (!visitPopup) return null

  const handleYes = () => {
    window.open(visitPopup.place.url, '_blank')
    markRecentlyVisited(visitPopup.place.id)
    hideVisitPopup()
  }

  const handleNo = () => {
    markRecentlyVisited(visitPopup.place.id)
    hideVisitPopup()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #4a4a6e',
          borderRadius: 12,
          padding: '24px 40px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2
          style={{
            color: '#ffffff',
            fontSize: 24,
            margin: '0 0 20px 0',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Visit {visitPopup.place.name}?
        </h2>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={handleYes}
            style={{
              backgroundColor: '#2ecc71',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Yes
          </button>
          <button
            onClick={handleNo}
            style={{
              backgroundColor: '#e74c3c',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}
