import { useMemo } from 'react'
import * as THREE from 'three'
import { RoadSegment, LANE_WIDTH } from '../city/generateCity'

interface CityRoadsProps {
  roads: RoadSegment[]
}

export function CityRoads({ roads }: CityRoadsProps) {
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

  // Generate lane markings
  const laneMarkings = useMemo(() => {
    const markings: { position: THREE.Vector3; rotation: number; length: number }[] = []

    roads.forEach((road) => {
      const { centerline, width } = road
      const numLanes = width / LANE_WIDTH

      // Dashed center line for each lane boundary
      for (let lane = 1; lane < numLanes; lane++) {
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

  return (
    <group>
      {/* Road surfaces */}
      {roadMeshes.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry} position={[0, 0.01, 0]} receiveShadow>
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}

      {/* Lane markings */}
      {laneMarkings.map((marking, idx) => (
        <mesh
          key={`marking-${idx}`}
          position={marking.position}
          rotation={[0, marking.rotation, 0]}
        >
          <planeGeometry args={[0.15, marking.length]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      ))}
    </group>
  )
}
