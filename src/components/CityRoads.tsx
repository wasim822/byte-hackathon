import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { RoadSegment, LANE_WIDTH, ROAD_WIDTH, NUM_AVENUES, AVENUE_ANGLE_STEP, RING_RADII } from '../city/generateCity'

interface CityRoadsProps {
  roads: RoadSegment[]
}

// Asphalt texture loader with dark grey appearance
function useAsphaltTexture() {
  const textures = useTexture({
    map: '/assets/textures/asphalt/color.webp',
    normalMap: '/assets/textures/asphalt/normal.webp',
    roughnessMap: '/assets/textures/asphalt/roughness.webp',
  })

  // Configure texture tiling - 10m per tile
  Object.values(textures).forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(0.1, 0.1)
  })

  return textures
}

// Generate intersection positions (where avenues meet ring roads)
function getIntersectionPositions(): { x: number; z: number; angle: number; ringIndex: number }[] {
  const intersections: { x: number; z: number; angle: number; ringIndex: number }[] = []

  for (let ringIndex = 0; ringIndex < RING_RADII.length; ringIndex++) {
    const radius = RING_RADII[ringIndex]

    for (let aveIndex = 0; aveIndex < NUM_AVENUES; aveIndex++) {
      const angleDeg = aveIndex * AVENUE_ANGLE_STEP
      const angleRad = ((angleDeg - 90) * Math.PI) / 180

      intersections.push({
        x: Math.cos(angleRad) * radius,
        z: -Math.sin(angleRad) * radius,
        angle: angleDeg,
        ringIndex,
      })
    }
  }

  return intersections
}

export function CityRoads({ roads }: CityRoadsProps) {
  const asphaltTexture = useAsphaltTexture()

  const roadMeshes = useMemo(() => {
    return roads.map((road) => {
      const { centerline, width } = road

      // Create road surface geometry from centerline
      const shape = new THREE.Shape()

      // Generate road outline by offsetting centerline
      const leftPoints: { x: number; z: number }[] = []
      const rightPoints: { x: number; z: number }[] = []

      for (let i = 0; i < centerline.length; i++) {
        const curr = centerline[i]
        const prev = centerline[Math.max(0, i - 1)]
        const next = centerline[Math.min(centerline.length - 1, i + 1)]

        // Calculate direction
        const dx = next.x - prev.x
        const dz = next.z - prev.z
        const len = Math.sqrt(dx * dx + dz * dz) || 1

        // Perpendicular offset
        const perpX = (-dz / len) * (width / 2)
        const perpZ = (dx / len) * (width / 2)

        leftPoints.push({ x: curr.x + perpX, z: curr.z + perpZ })
        rightPoints.push({ x: curr.x - perpX, z: curr.z - perpZ })
      }

      // Build shape (left side, then right side reversed)
      if (leftPoints.length > 0) {
        shape.moveTo(leftPoints[0].x, leftPoints[0].z)
        for (let i = 1; i < leftPoints.length; i++) {
          shape.lineTo(leftPoints[i].x, leftPoints[i].z)
        }
        for (let i = rightPoints.length - 1; i >= 0; i--) {
          shape.lineTo(rightPoints[i].x, rightPoints[i].z)
        }
        shape.closePath()
      }

      const geometry = new THREE.ShapeGeometry(shape)
      // Rotate to lie flat on XZ plane
      geometry.rotateX(-Math.PI / 2)

      return { id: road.id, geometry, road }
    })
  }, [roads])

  // Generate white dashed lane markings
  const whiteLaneMarkings = useMemo(() => {
    const markings: { position: THREE.Vector3; rotation: number; length: number }[] = []

    roads.forEach((road) => {
      const { centerline, width } = road
      const numLanes = width / LANE_WIDTH

      // White dashed lanes for lane boundaries (not center line)
      for (let lane = 1; lane < numLanes; lane++) {
        // Skip center line (will be yellow)
        if (lane === numLanes / 2) continue

        const offset = (lane - numLanes / 2) * LANE_WIDTH

        for (let i = 0; i < centerline.length - 1; i += 3) {
          const curr = centerline[i]
          const next = centerline[Math.min(i + 1, centerline.length - 1)]

          const dx = next.x - curr.x
          const dz = next.z - curr.z
          const len = Math.sqrt(dx * dx + dz * dz) || 1
          const angle = Math.atan2(dx, -dz)

          // Perpendicular offset for lane position
          const perpX = (-dz / len) * offset
          const perpZ = (dx / len) * offset

          markings.push({
            position: new THREE.Vector3(
              curr.x + perpX + dx * 0.5,
              0.02,
              curr.z + perpZ + dz * 0.5
            ),
            rotation: angle,
            length: Math.min(len * 0.6, 3),
          })
        }
      }
    })

    return markings
  }, [roads])

  // Generate double yellow center line for avenues
  const yellowCenterLines = useMemo(() => {
    const lines: { position: THREE.Vector3; rotation: number; length: number; offset: number }[] = []

    roads.forEach((road) => {
      if (road.type !== 'avenue') return

      const { centerline } = road
      const lineSpacing = 0.15 // Gap between double yellow lines

      for (let i = 0; i < centerline.length - 1; i++) {
        const curr = centerline[i]
        const next = centerline[i + 1]

        const dx = next.x - curr.x
        const dz = next.z - curr.z
        const len = Math.sqrt(dx * dx + dz * dz) || 1
        const angle = Math.atan2(dx, -dz)

        // Double yellow line - two parallel lines
        for (const side of [-1, 1]) {
          const perpX = (-dz / len) * lineSpacing * side
          const perpZ = (dx / len) * lineSpacing * side

          lines.push({
            position: new THREE.Vector3(
              curr.x + perpX + dx * 0.5,
              0.02,
              curr.z + perpZ + dz * 0.5
            ),
            rotation: angle,
            length: len,
            offset: side,
          })
        }
      }
    })

    return lines
  }, [roads])

  // Generate zebra crosswalks at intersections
  const crosswalks = useMemo(() => {
    const intersections = getIntersectionPositions()
    const walks: { position: THREE.Vector3; rotation: number }[] = []

    intersections.forEach(({ x, z, angle }) => {
      // Place crosswalks perpendicular to avenue direction
      const angleRad = (angle * Math.PI) / 180

      // Crosswalk perpendicular to avenue (crossing the ring road)
      walks.push({
        position: new THREE.Vector3(x, 0.025, z),
        rotation: angleRad,
      })
    })

    return walks
  }, [])

  return (
    <group>
      {/* Road surfaces with asphalt texture */}
      {roadMeshes.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry} position={[0, 0.01, 0]} receiveShadow>
          <meshStandardMaterial
            map={asphaltTexture.map}
            normalMap={asphaltTexture.normalMap}
            roughnessMap={asphaltTexture.roughnessMap}
            roughness={0.9}
            color="#404040" // Darken the asphalt
          />
        </mesh>
      ))}

      {/* White dashed lane markings - lying flat */}
      {whiteLaneMarkings.map((marking, idx) => (
        <mesh
          key={`white-marking-${idx}`}
          position={marking.position}
          rotation={[-Math.PI / 2, 0, marking.rotation]}
        >
          <planeGeometry args={[0.12, marking.length]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Double yellow center line on avenues */}
      {yellowCenterLines.map((line, idx) => (
        <mesh
          key={`yellow-line-${idx}`}
          position={line.position}
          rotation={[-Math.PI / 2, 0, line.rotation]}
        >
          <planeGeometry args={[0.1, line.length]} />
          <meshBasicMaterial color="#ffcc00" />
        </mesh>
      ))}

      {/* Zebra crosswalks */}
      {crosswalks.map((walk, idx) => (
        <group key={`crosswalk-${idx}`} position={walk.position} rotation={[0, walk.rotation, 0]}>
          {/* Crosswalk stripes - 8 white bars */}
          {Array.from({ length: 8 }).map((_, stripeIdx) => (
            <mesh
              key={`stripe-${stripeIdx}`}
              position={[(stripeIdx - 3.5) * 0.6, 0, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.4, ROAD_WIDTH * 0.8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
