import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { CityData, OUTER_RADIUS } from '../city/generateCity'
import { DISTRICT_INFO } from '../data/places'

interface MinimapProps {
  cityData: CityData
}

// Rectangular minimap
const MINIMAP_WIDTH = 200
const MINIMAP_HEIGHT = 140
const MINIMAP_SCALE = MINIMAP_HEIGHT / (OUTER_RADIUS * 2)
const BAR_HEIGHT = 4
const BAR_GAP = 2

// Colors
const ROAD_COLOR = '#333333'
const WATER_COLOR = '#001830'
const PLAYER_COLOR = '#00ffff'
const PLACE_DOT_COLOR = '#ffffff'
const NORTH_COLOR = '#ff0000'

// Bar colors
const SPEED_BAR_COLOR = '#00ff00' // Green
const BOOST_BAR_COLOR = '#00aaff' // Blue
const FUEL_BAR_COLOR = '#ffcc00' // Yellow

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  cityData: CityData,
  carX: number,
  carZ: number,
  carRotation: number,
  scale: number,
  centerX: number,
  centerY: number,
  rotate: boolean = true
) {
  const { roads, placeLots } = cityData

  ctx.save()

  // Transform for car-centered rotating view
  ctx.translate(centerX, centerY)
  if (rotate) {
    ctx.rotate(carRotation + Math.PI)
  }

  // Draw water background
  ctx.fillStyle = WATER_COLOR
  ctx.beginPath()
  ctx.arc(0, 0, OUTER_RADIUS * scale * 1.2, 0, Math.PI * 2)
  ctx.fill()

  // Draw district wedges
  Object.entries(DISTRICT_INFO).forEach(([, info]) => {
    const startAngle = ((info.centerAngle - 36) * Math.PI) / 180 - Math.PI / 2
    const endAngle = ((info.centerAngle + 36) * Math.PI) / 180 - Math.PI / 2

    ctx.fillStyle = info.color + '30' // 30% opacity
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, OUTER_RADIUS * scale, startAngle, endAngle)
    ctx.closePath()
    ctx.fill()
  })

  // Draw roads
  ctx.strokeStyle = ROAD_COLOR
  ctx.lineWidth = 6 * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  roads.forEach((road) => {
    ctx.beginPath()
    road.centerline.forEach((point, idx) => {
      const x = (point.x - carX) * scale
      const y = (point.z - carZ) * scale
      if (idx === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
  })

  // Draw place dots
  ctx.fillStyle = PLACE_DOT_COLOR
  placeLots.forEach((lot) => {
    const x = (lot.position.x - carX) * scale
    const y = (lot.position.z - carZ) * scale
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
  })

  // Draw player (always at center in rotating mode)
  ctx.fillStyle = PLAYER_COLOR
  ctx.beginPath()
  if (rotate) {
    // Player arrow pointing up (forward)
    ctx.moveTo(0, -6)
    ctx.lineTo(-4, 5)
    ctx.lineTo(0, 2)
    ctx.lineTo(4, 5)
  } else {
    const x = (0 - carX) * scale
    const y = (0 - carZ) * scale
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-carRotation)
    ctx.moveTo(0, -6)
    ctx.lineTo(-4, 5)
    ctx.lineTo(0, 2)
    ctx.lineTo(4, 5)
    ctx.restore()
  }
  ctx.closePath()
  ctx.fill()

  // Draw north marker
  ctx.fillStyle = NORTH_COLOR
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  if (rotate) {
    const northAngle = -carRotation - Math.PI
    const northX = Math.sin(northAngle) * (MINIMAP_HEIGHT / 2 - 12)
    const northY = Math.cos(northAngle) * (MINIMAP_HEIGHT / 2 - 12)
    ctx.fillText('N', northX, northY + 3)
  } else {
    ctx.fillText('N', 0, -MINIMAP_HEIGHT / 2 + 12)
  }

  ctx.restore()
}

export function Minimap({ cityData }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const carPosition = useGameStore((state) => state.carPosition)
  const carRotation = useGameStore((state) => state.carRotation)
  const carSpeed = useGameStore((state) => state.carSpeed)
  const isBoosting = useGameStore((state) => state.isBoosting)

  // Draw minimap
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT)

    // Clip to rounded rectangle
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT, 8)
    ctx.clip()

    // Background
    ctx.fillStyle = '#000000dd'
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT)

    // Draw map content
    drawMinimap(
      ctx,
      cityData,
      carPosition.x,
      carPosition.z,
      carRotation,
      MINIMAP_SCALE,
      MINIMAP_WIDTH / 2,
      MINIMAP_HEIGHT / 2,
      true
    )

    ctx.restore()

    // Border
    ctx.strokeStyle = '#ffffff22'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT, 8)
    ctx.stroke()
  }, [cityData, carPosition, carRotation])

  // Calculate bar values
  const speedPercent = Math.min(carSpeed / 40, 1) // Max 40 m/s
  const boostPercent = isBoosting ? Math.min(carSpeed / 50, 1) : 0.8 // Boost bar
  const fuelPercent = 0.9 // Static fuel bar

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        style={{
          borderRadius: 8,
        }}
      />

      {/* Status bars - GTA style: green/blue/yellow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: BAR_GAP }}>
        {/* Speed bar - Green */}
        <div
          style={{
            width: MINIMAP_WIDTH,
            height: BAR_HEIGHT,
            backgroundColor: '#00000088',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${speedPercent * 100}%`,
              height: '100%',
              backgroundColor: SPEED_BAR_COLOR,
              transition: 'width 0.1s',
            }}
          />
        </div>

        {/* Boost bar - Blue */}
        <div
          style={{
            width: MINIMAP_WIDTH,
            height: BAR_HEIGHT,
            backgroundColor: '#00000088',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${boostPercent * 100}%`,
              height: '100%',
              backgroundColor: isBoosting ? '#00ffff' : BOOST_BAR_COLOR,
              transition: 'width 0.1s, background-color 0.2s',
            }}
          />
        </div>

        {/* Fuel bar - Yellow */}
        <div
          style={{
            width: MINIMAP_WIDTH,
            height: BAR_HEIGHT,
            backgroundColor: '#00000088',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${fuelPercent * 100}%`,
              height: '100%',
              backgroundColor: FUEL_BAR_COLOR,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Full screen map component
interface FullMapProps {
  cityData: CityData
  onClose: () => void
}

export function FullMap({ cityData, onClose }: FullMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const carPosition = useGameStore((state) => state.carPosition)
  const carRotation = useGameStore((state) => state.carRotation)

  // Pan and zoom state
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, width, height)

    // Calculate scale to fit city
    const baseScale = Math.min(width, height) / (OUTER_RADIUS * 2.5)
    const scale = baseScale * zoomRef.current

    const centerX = width / 2 + panRef.current.x
    const centerY = height / 2 + panRef.current.y

    // Draw map (non-rotating, showing whole city)
    drawMinimap(
      ctx,
      cityData,
      0,
      0,
      carRotation,
      scale,
      centerX,
      centerY,
      false
    )

    // Draw place labels
    ctx.fillStyle = '#ffffff'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'

    cityData.placeLots.forEach((lot) => {
      const x = lot.position.x * scale + centerX
      const y = lot.position.z * scale + centerY
      if (x > 0 && x < width && y > 0 && y < height) {
        ctx.fillText(lot.place.name, x, y - 8)
      }
    })
  }, [cityData, carRotation])

  // Initial draw and resize handling
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      draw()
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draw])

  // Redraw on state change
  useEffect(() => {
    draw()
  }, [draw, carPosition])

  // Mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true
      lastPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      panRef.current.x += dx
      panRef.current.y += dy
      draw()
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
      zoomRef.current = Math.max(0.5, Math.min(3, zoomRef.current * zoomDelta))
      draw()
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [draw])

  // Close on M or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' || e.code === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0a0fdd',
        zIndex: 1000,
        cursor: 'grab',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '10px 20px',
          backgroundColor: '#ffffff22',
          border: '1px solid #ffffff44',
          borderRadius: 5,
          color: 'white',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        Close (M)
      </button>

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#ffffff88',
          fontSize: 12,
        }}
      >
        Drag to pan • Scroll to zoom • Press M or Esc to close
      </div>
    </div>
  )
}
