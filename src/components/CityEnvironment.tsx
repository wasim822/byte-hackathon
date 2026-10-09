import { useMemo, useRef, useEffect, useState, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { Tree, Streetlight, Block, OUTER_RADIUS, NUM_AVENUES, AVENUE_ANGLE_STEP, RING_RADII } from '../city/generateCity'
import { useGameStore } from '../store/gameStore'

// Distance culling threshold
const CULL_DISTANCE = 200

// Preload Kenney models
const LAMP_MODEL = '/assets/models/kenney-roads/light-curved.glb'
const TRAFFIC_LIGHT_MODEL = '/assets/models/kenney-roads/traffic-light.glb'
const DUMPSTER_MODEL = '/assets/models/kenney-roads/dumpster.glb'
const TREE_MODELS = [
  '/assets/models/nature/tree-common-01.glb',
  '/assets/models/nature/tree-common-02.glb',
  '/assets/models/nature/tree-birch-01.glb',
]
const BUSH_MODELS = [
  '/assets/models/nature/bush-01.glb',
  '/assets/models/nature/bush-02.glb',
]
const ROCK_MODELS = [
  '/assets/models/nature/rock-01.glb',
  '/assets/models/nature/rock-02.glb',
  '/assets/models/nature/rock-03.glb',
]

// Preload all models
useGLTF.preload(LAMP_MODEL)
useGLTF.preload(TRAFFIC_LIGHT_MODEL)
useGLTF.preload(DUMPSTER_MODEL)
TREE_MODELS.forEach(m => useGLTF.preload(m))
BUSH_MODELS.forEach(m => useGLTF.preload(m))
ROCK_MODELS.forEach(m => useGLTF.preload(m))

// Texture hooks
function useSidewalkTexture() {
  const textures = useTexture({
    map: '/assets/textures/sidewalk/color.webp',
    normalMap: '/assets/textures/sidewalk/normal.webp',
    roughnessMap: '/assets/textures/sidewalk/roughness.webp',
  })

  Object.values(textures).forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(0.2, 0.2)
  })

  return textures
}

function useGrassTexture() {
  const textures = useTexture({
    map: '/assets/textures/grass/color.webp',
    normalMap: '/assets/textures/grass/normal.webp',
    roughnessMap: '/assets/textures/grass/roughness.webp',
  })

  Object.values(textures).forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(0.05, 0.05)
  })

  return textures
}

// Generate intersection positions for traffic lights
function getIntersectionPositions(): { x: number; z: number; angle: number }[] {
  const intersections: { x: number; z: number; angle: number }[] = []

  for (let ringIndex = 1; ringIndex < RING_RADII.length; ringIndex++) {
    const radius = RING_RADII[ringIndex]

    for (let aveIndex = 0; aveIndex < NUM_AVENUES; aveIndex++) {
      const angleDeg = aveIndex * AVENUE_ANGLE_STEP
      const angleRad = ((angleDeg - 90) * Math.PI) / 180

      intersections.push({
        x: Math.cos(angleRad) * radius,
        z: -Math.sin(angleRad) * radius,
        angle: angleDeg,
      })
    }
  }

  return intersections
}

interface KenneyLampsProps {
  streetlights: Streetlight[]
}

function KenneyLamps({ streetlights }: KenneyLampsProps) {
  const { scene } = useGLTF(LAMP_MODEL)
  const carPosition = useGameStore((state) => state.carPosition)
  const groupRef = useRef<THREE.Group>(null)

  // Clone and setup material once
  const lampScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true
      }
    })
    return clone
  }, [scene])

  // Distance culling
  useFrame(() => {
    if (!groupRef.current || !carPosition) return

    groupRef.current.children.forEach((child, i) => {
      const light = streetlights[i]
      if (!light) return

      const dx = light.position.x - carPosition.x
      const dz = light.position.z - carPosition.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      child.visible = dist < CULL_DISTANCE
    })
  })

  return (
    <group ref={groupRef}>
      {streetlights.map((light) => (
        <group
          key={light.id}
          position={[light.position.x, 0, light.position.z]}
          rotation={[0, light.rotation, 0]}
        >
          <primitive
            object={lampScene.clone()}
            scale={[1.2, 1.2, 1.2]}
          />
          {/* Light glow */}
          <mesh position={[0, 6, 1]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial color="#ffffcc" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

interface TrafficLightsProps {
  // None needed, generates from intersections
}

function TrafficLights({}: TrafficLightsProps) {
  const { scene } = useGLTF(TRAFFIC_LIGHT_MODEL)
  const [phase, setPhase] = useState(0) // 0=red, 1=yellow, 2=green
  const carPosition = useGameStore((state) => state.carPosition)
  const groupRef = useRef<THREE.Group>(null)

  const intersections = useMemo(() => getIntersectionPositions(), [])

  // Cycle traffic lights
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => (p + 1) % 3)
    }, 3000) // 3 seconds per phase
    return () => clearInterval(interval)
  }, [])

  // Distance culling
  useFrame(() => {
    if (!groupRef.current || !carPosition) return

    groupRef.current.children.forEach((child, i) => {
      const inter = intersections[i]
      if (!inter) return

      const dx = inter.x - carPosition.x
      const dz = inter.z - carPosition.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      child.visible = dist < CULL_DISTANCE
    })
  })

  const trafficLightScene = useMemo(() => scene.clone(), [scene])

  // Light colors based on phase
  const lightColors = useMemo(() => ({
    red: phase === 0 ? '#ff0000' : '#330000',
    yellow: phase === 1 ? '#ffff00' : '#333300',
    green: phase === 2 ? '#00ff00' : '#003300',
  }), [phase])

  return (
    <group ref={groupRef}>
      {intersections.map((inter, idx) => (
        <group
          key={`traffic-${idx}`}
          position={[inter.x + 8, 0, inter.z + 8]}
          rotation={[0, (inter.angle * Math.PI) / 180, 0]}
        >
          <primitive
            object={trafficLightScene.clone()}
            scale={[1.5, 1.5, 1.5]}
          />
          {/* Traffic light indicators */}
          <mesh position={[0, 5.5, 0.3]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={lightColors.red} toneMapped={false} />
          </mesh>
          <mesh position={[0, 5, 0.3]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={lightColors.yellow} toneMapped={false} />
          </mesh>
          <mesh position={[0, 4.5, 0.3]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={lightColors.green} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

interface StreetFurnitureProps {
  blocks: Block[]
}

function StreetFurniture({ blocks }: StreetFurnitureProps) {
  const { scene: dumpsterScene } = useGLTF(DUMPSTER_MODEL)
  const carPosition = useGameStore((state) => state.carPosition)
  const groupRef = useRef<THREE.Group>(null)

  // Generate furniture positions along block edges
  const furniturePositions = useMemo(() => {
    const positions: { x: number; z: number; rotation: number; type: 'dumpster' | 'bench' }[] = []
    let idx = 0

    blocks.forEach((block) => {
      const midAngle = (block.startAngle + block.endAngle) / 2
      const angleRad = ((midAngle - 90) * Math.PI) / 180

      // One piece of furniture per block on sidewalk edge
      const radius = block.innerRadius + 2
      positions.push({
        x: Math.cos(angleRad) * radius,
        z: -Math.sin(angleRad) * radius,
        rotation: angleRad + Math.PI / 2,
        type: idx % 2 === 0 ? 'dumpster' : 'bench',
      })
      idx++
    })

    return positions
  }, [blocks])

  // Distance culling
  useFrame(() => {
    if (!groupRef.current || !carPosition) return

    groupRef.current.children.forEach((child, i) => {
      const pos = furniturePositions[i]
      if (!pos) return

      const dx = pos.x - carPosition.x
      const dz = pos.z - carPosition.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      child.visible = dist < CULL_DISTANCE
    })
  })

  return (
    <group ref={groupRef}>
      {furniturePositions.map((pos, idx) => (
        <group
          key={`furniture-${idx}`}
          position={[pos.x, 0.15, pos.z]}
          rotation={[0, pos.rotation, 0]}
        >
          {pos.type === 'dumpster' ? (
            <primitive object={dumpsterScene.clone()} scale={[1, 1, 1]} />
          ) : (
            // Simple bench (Kenney doesn't have one, so we make a simple one)
            <group>
              <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[1.5, 0.1, 0.5]} />
                <meshStandardMaterial color="#5c4033" roughness={0.9} />
              </mesh>
              <mesh position={[-0.6, 0.15, 0]} castShadow>
                <boxGeometry args={[0.1, 0.3, 0.4]} />
                <meshStandardMaterial color="#333333" />
              </mesh>
              <mesh position={[0.6, 0.15, 0]} castShadow>
                <boxGeometry args={[0.1, 0.3, 0.4]} />
                <meshStandardMaterial color="#333333" />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

interface NatureElementsProps {
  trees: Tree[]
  blocks: Block[]
}

function NatureElements({ trees, blocks }: NatureElementsProps) {
  const treeScenes = TREE_MODELS.map(m => useGLTF(m).scene)
  const bushScenes = BUSH_MODELS.map(m => useGLTF(m).scene)
  const rockScenes = ROCK_MODELS.map(m => useGLTF(m).scene)
  const carPosition = useGameStore((state) => state.carPosition)
  const groupRef = useRef<THREE.Group>(null)

  // Generate additional nature elements (bushes, rocks) in parks
  const naturePositions = useMemo(() => {
    const positions: {
      x: number; z: number; rotation: number; scale: number;
      type: 'tree' | 'bush' | 'rock'; modelIdx: number
    }[] = []

    // Trees from city data
    trees.forEach((tree, idx) => {
      positions.push({
        x: tree.position.x,
        z: tree.position.z,
        rotation: Math.random() * Math.PI * 2,
        scale: tree.scale,
        type: 'tree',
        modelIdx: idx % TREE_MODELS.length,
      })
    })

    // Add bushes and rocks around blocks
    let extraIdx = 0
    blocks.forEach((block) => {
      const midAngle = (block.startAngle + block.endAngle) / 2
      const spread = (block.endAngle - block.startAngle) * 0.3

      // Add 2-3 bushes/rocks per block
      for (let i = 0; i < 3; i++) {
        const angleOffset = (Math.random() - 0.5) * spread
        const angle = midAngle + angleOffset
        const angleRad = ((angle - 90) * Math.PI) / 180
        const radius = block.innerRadius + 4 + Math.random() * 8

        const type = i === 0 ? 'rock' : 'bush'
        positions.push({
          x: Math.cos(angleRad) * radius,
          z: -Math.sin(angleRad) * radius,
          rotation: Math.random() * Math.PI * 2,
          scale: 0.5 + Math.random() * 0.5,
          type,
          modelIdx: extraIdx % (type === 'bush' ? BUSH_MODELS.length : ROCK_MODELS.length),
        })
        extraIdx++
      }
    })

    return positions
  }, [trees, blocks])

  // Distance culling
  useFrame(() => {
    if (!groupRef.current || !carPosition) return

    groupRef.current.children.forEach((child, i) => {
      const pos = naturePositions[i]
      if (!pos) return

      const dx = pos.x - carPosition.x
      const dz = pos.z - carPosition.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      child.visible = dist < CULL_DISTANCE
    })
  })

  return (
    <group ref={groupRef}>
      {naturePositions.map((pos, idx) => {
        const scene = pos.type === 'tree'
          ? treeScenes[pos.modelIdx]
          : pos.type === 'bush'
            ? bushScenes[pos.modelIdx]
            : rockScenes[pos.modelIdx]

        return (
          <primitive
            key={`nature-${idx}`}
            object={scene.clone()}
            position={[pos.x, 0, pos.z]}
            rotation={[0, pos.rotation, 0]}
            scale={[pos.scale, pos.scale, pos.scale]}
          />
        )
      })}
    </group>
  )
}

interface SidewalksAndCurbsProps {
  blocks: Block[]
}

function SidewalksAndCurbs({ blocks }: SidewalksAndCurbsProps) {
  const sidewalkTexture = useSidewalkTexture()

  const sidewalkData = useMemo(() => {
    const data: {
      sidewalkGeometry: THREE.BufferGeometry
      curbs: { position: THREE.Vector3; rotation: number; length: number; isRed: boolean }[]
    }[] = []

    blocks.forEach((block, blockIdx) => {
      const vertices = block.vertices
      if (vertices.length < 4) return

      const shape = new THREE.Shape()
      const inset = 0.3

      const insetVertices = vertices.map((v, i) => {
        const prev = vertices[(i - 1 + vertices.length) % vertices.length]
        const next = vertices[(i + 1) % vertices.length]

        const dx1 = v.x - prev.x
        const dz1 = v.z - prev.z
        const dx2 = next.x - v.x
        const dz2 = next.z - v.z

        const len1 = Math.sqrt(dx1 * dx1 + dz1 * dz1) || 1
        const len2 = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1

        const nx = (-dz1 / len1 - dz2 / len2) / 2
        const nz = (dx1 / len1 + dx2 / len2) / 2
        const nLen = Math.sqrt(nx * nx + nz * nz) || 1

        return {
          x: v.x + (nx / nLen) * inset,
          z: v.z + (nz / nLen) * inset,
        }
      })

      if (insetVertices.length > 0) {
        shape.moveTo(insetVertices[0].x, insetVertices[0].z)
        for (let i = 1; i < insetVertices.length; i++) {
          shape.lineTo(insetVertices[i].x, insetVertices[i].z)
        }
        shape.closePath()
      }

      const geometry = new THREE.ShapeGeometry(shape)
      geometry.rotateX(-Math.PI / 2)

      const curbs: { position: THREE.Vector3; rotation: number; length: number; isRed: boolean }[] = []

      for (let i = 0; i < vertices.length; i++) {
        const start = vertices[i]
        const end = vertices[(i + 1) % vertices.length]

        const dx = end.x - start.x
        const dz = end.z - start.z
        const length = Math.sqrt(dx * dx + dz * dz)
        const angle = Math.atan2(dx, -dz)
        const midX = (start.x + end.x) / 2
        const midZ = (start.z + end.z) / 2

        const isRed = (blockIdx * 7 + i) % 5 === 0

        curbs.push({
          position: new THREE.Vector3(midX, 0.075, midZ),
          rotation: angle,
          length,
          isRed,
        })
      }

      data.push({ sidewalkGeometry: geometry, curbs })
    })

    return data
  }, [blocks])

  return (
    <group>
      {sidewalkData.map((data, idx) => (
        <group key={`sidewalk-group-${idx}`}>
          <mesh
            geometry={data.sidewalkGeometry}
            position={[0, 0.15, 0]}
            receiveShadow
          >
            <meshStandardMaterial
              map={sidewalkTexture.map}
              normalMap={sidewalkTexture.normalMap}
              roughnessMap={sidewalkTexture.roughnessMap}
              roughness={0.9}
              color="#d0d0d0"
            />
          </mesh>

          {data.curbs.map((curb, curbIdx) => (
            <group key={`curb-${idx}-${curbIdx}`}>
              <mesh
                position={curb.position}
                rotation={[0, curb.rotation, 0]}
                castShadow
              >
                <boxGeometry args={[0.2, 0.15, curb.length]} />
                <meshStandardMaterial
                  color={curb.isRed ? '#cc2222' : '#808080'}
                  roughness={0.9}
                />
              </mesh>

              <RigidBody
                type="fixed"
                colliders="cuboid"
                position={curb.position}
                rotation={[0, curb.rotation, 0]}
              >
                <mesh visible={false}>
                  <boxGeometry args={[0.3, 0.15, curb.length]} />
                </mesh>
              </RigidBody>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

interface GrassAreasProps {
  blocks: Block[]
}

function GrassAreas({ blocks }: GrassAreasProps) {
  const grassTexture = useGrassTexture()

  const grassGeometries = useMemo(() => {
    return blocks.map((block) => {
      const vertices = block.vertices
      if (vertices.length < 4) return null

      const shape = new THREE.Shape()
      const inset = 3

      const insetVertices = vertices.map((v, i) => {
        const prev = vertices[(i - 1 + vertices.length) % vertices.length]
        const next = vertices[(i + 1) % vertices.length]

        const dx1 = v.x - prev.x
        const dz1 = v.z - prev.z
        const dx2 = next.x - v.x
        const dz2 = next.z - v.z

        const len1 = Math.sqrt(dx1 * dx1 + dz1 * dz1) || 1
        const len2 = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1

        const nx = (-dz1 / len1 - dz2 / len2) / 2
        const nz = (dx1 / len1 + dx2 / len2) / 2
        const nLen = Math.sqrt(nx * nx + nz * nz) || 1

        return {
          x: v.x + (nx / nLen) * inset,
          z: v.z + (nz / nLen) * inset,
        }
      })

      if (insetVertices.length > 0) {
        shape.moveTo(insetVertices[0].x, insetVertices[0].z)
        for (let i = 1; i < insetVertices.length; i++) {
          shape.lineTo(insetVertices[i].x, insetVertices[i].z)
        }
        shape.closePath()
      }

      const geometry = new THREE.ShapeGeometry(shape)
      geometry.rotateX(-Math.PI / 2)

      return geometry
    }).filter(Boolean) as THREE.ShapeGeometry[]
  }, [blocks])

  return (
    <group>
      {grassGeometries.map((geometry, idx) => (
        <mesh
          key={`grass-${idx}`}
          geometry={geometry}
          position={[0, 0.01, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            map={grassTexture.map}
            normalMap={grassTexture.normalMap}
            roughnessMap={grassTexture.roughnessMap}
            roughness={1}
            color="#4a7c4a"
          />
        </mesh>
      ))}
    </group>
  )
}

function CityEdge() {
  const waterRadius = OUTER_RADIUS + 100
  const wallRadius = OUTER_RADIUS
  const wallHeight = 3
  const invisibleWallHeight = 50
  const ceilingHeight = 40

  const wallSegments = useMemo(() => {
    const segments: { x: number; z: number; angle: number; length: number }[] = []
    const numSegments = 72

    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2
      const segmentLength = (2 * Math.PI * wallRadius) / numSegments + 0.5
      segments.push({
        x: Math.cos(angle) * wallRadius,
        z: Math.sin(angle) * wallRadius,
        angle: angle + Math.PI / 2,
        length: segmentLength,
      })
    }

    return segments
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <ringGeometry args={[OUTER_RADIUS + 2, waterRadius, 64]} />
        <meshStandardMaterial color="#1a4a6a" roughness={0.3} metalness={0.6} />
      </mesh>

      {wallSegments.map((seg, idx) => (
        <mesh
          key={`wall-visible-${idx}`}
          position={[seg.x, wallHeight / 2, seg.z]}
          rotation={[0, seg.angle, 0]}
          castShadow
        >
          <boxGeometry args={[1.5, wallHeight, seg.length]} />
          <meshStandardMaterial color="#606060" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {wallSegments.map((seg, idx) => (
        <RigidBody
          key={`wall-collider-${idx}`}
          type="fixed"
          colliders="cuboid"
          position={[seg.x, invisibleWallHeight / 2, seg.z]}
          rotation={[0, seg.angle, 0]}
        >
          <mesh visible={false}>
            <boxGeometry args={[2, invisibleWallHeight, seg.length]} />
          </mesh>
        </RigidBody>
      ))}

      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[0, ceilingHeight, 0]}
      >
        <mesh visible={false}>
          <cylinderGeometry args={[wallRadius + 10, wallRadius + 10, 2, 32]} />
        </mesh>
      </RigidBody>
    </group>
  )
}

function Ground() {
  const grassTexture = useGrassTexture()

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[OUTER_RADIUS + 200, 64]} />
        <meshStandardMaterial
          map={grassTexture.map}
          normalMap={grassTexture.normalMap}
          roughnessMap={grassTexture.roughnessMap}
          roughness={1}
          color="#3a5a3a"
        />
      </mesh>
    </RigidBody>
  )
}

interface CityEnvironmentProps {
  streetlights: Streetlight[]
  trees: Tree[]
  blocks: Block[]
}

export function CityEnvironment({ streetlights, trees, blocks }: CityEnvironmentProps) {
  return (
    <Suspense fallback={null}>
      <group>
        <Ground />
        <GrassAreas blocks={blocks} />
        <SidewalksAndCurbs blocks={blocks} />

        {/* Kenney lamp models with distance culling */}
        <KenneyLamps streetlights={streetlights} />

        {/* Traffic lights at intersections */}
        <TrafficLights />

        {/* Benches and dumpsters */}
        <StreetFurniture blocks={blocks} />

        {/* Trees, bushes, and rocks from nature models */}
        <NatureElements trees={trees} blocks={blocks} />

        <CityEdge />
      </group>
    </Suspense>
  )
}
