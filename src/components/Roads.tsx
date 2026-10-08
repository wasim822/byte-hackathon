import { useMemo } from 'react'
import { cityLayout } from '../data/cityLayout'

interface RoadSegment {
  position: [number, number, number]
  size: [number, number]
  isHorizontal: boolean
}

export function Roads() {
  const roads = useMemo(() => {
    const { gridSize, blockSize, roadWidth } = cityLayout
    const segments: RoadSegment[] = []

    // Calculate the total grid span
    const totalSpan = gridSize * blockSize + (gridSize - 1) * roadWidth
    const startOffset = -totalSpan / 2

    // Create horizontal roads (along X axis)
    for (let i = 0; i <= gridSize; i++) {
      if (i === 0) {
        // First road at the edge
        segments.push({
          position: [0, 0.01, startOffset - roadWidth / 2],
          size: [totalSpan + roadWidth * 2, roadWidth],
          isHorizontal: true,
        })
      } else if (i === gridSize) {
        // Last road at the edge
        segments.push({
          position: [0, 0.01, -startOffset + roadWidth / 2],
          size: [totalSpan + roadWidth * 2, roadWidth],
          isHorizontal: true,
        })
      } else {
        // Roads between blocks
        const roadZ = startOffset + i * blockSize + (i - 0.5) * roadWidth
        segments.push({
          position: [0, 0.01, roadZ],
          size: [totalSpan + roadWidth * 2, roadWidth],
          isHorizontal: true,
        })
      }
    }

    // Create vertical roads (along Z axis)
    for (let i = 0; i <= gridSize; i++) {
      if (i === 0) {
        segments.push({
          position: [startOffset - roadWidth / 2, 0.01, 0],
          size: [roadWidth, totalSpan + roadWidth * 2],
          isHorizontal: false,
        })
      } else if (i === gridSize) {
        segments.push({
          position: [-startOffset + roadWidth / 2, 0.01, 0],
          size: [roadWidth, totalSpan + roadWidth * 2],
          isHorizontal: false,
        })
      } else {
        const roadX = startOffset + i * blockSize + (i - 0.5) * roadWidth
        segments.push({
          position: [roadX, 0.01, 0],
          size: [roadWidth, totalSpan + roadWidth * 2],
          isHorizontal: false,
        })
      }
    }

    return segments
  }, [])

  return (
    <group>
      {roads.map((road, index) => (
        <mesh
          key={index}
          position={road.position}
          rotation-x={-Math.PI / 2}
          receiveShadow
        >
          <planeGeometry args={road.size} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}

      {/* Road markings - center lines */}
      {roads.map((road, index) => (
        <mesh
          key={`marking-${index}`}
          position={[road.position[0], 0.02, road.position[2]]}
          rotation-x={-Math.PI / 2}
        >
          <planeGeometry
            args={road.isHorizontal ? [road.size[0], 0.3] : [0.3, road.size[1]]}
          />
          <meshStandardMaterial color="#333333" />
        </mesh>
      ))}
    </group>
  )
}
