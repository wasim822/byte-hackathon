import { useMemo, useRef } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { Tree, Streetlight, Block, OUTER_RADIUS } from '../city/generateCity'

interface StreetlightsProps {
  streetlights: Streetlight[]
}

function Streetlights({ streetlights }: StreetlightsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const lightMeshRef = useRef<THREE.InstancedMesh>(null)

  const matrices = useMemo(() => {
    return streetlights.map((light) => {
      const matrix = new THREE.Matrix4()
      matrix.compose(
        new THREE.Vector3(light.position.x, 3, light.position.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, light.rotation, 0)),
        new THREE.Vector3(0.15, 6, 0.15)
      )
      return matrix
    })
  }, [streetlights])

  const lightMatrices = useMemo(() => {
    return streetlights.map((light) => {
      const matrix = new THREE.Matrix4()
      matrix.compose(
        new THREE.Vector3(light.position.x, 6.5, light.position.z),
        new THREE.Quaternion(),
        new THREE.Vector3(0.5, 0.3, 0.5)
      )
      return matrix
    })
  }, [streetlights])

  useMemo(() => {
    if (!meshRef.current || !lightMeshRef.current) return
    matrices.forEach((matrix, i) => {
      meshRef.current!.setMatrixAt(i, matrix)
    })
    lightMatrices.forEach((matrix, i) => {
      lightMeshRef.current!.setMatrixAt(i, matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    lightMeshRef.current.instanceMatrix.needsUpdate = true
  }, [matrices, lightMatrices])

  return (
    <group>
      {/* Poles */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, streetlights.length]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#333333" roughness={0.8} metalness={0.5} />
      </instancedMesh>

      {/* Light fixtures */}
      <instancedMesh ref={lightMeshRef} args={[undefined, undefined, streetlights.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffeecc" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

interface TreesProps {
  trees: Tree[]
}

function Trees({ trees }: TreesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const foliageRef = useRef<THREE.InstancedMesh>(null)

  const { trunkMatrices, foliageMatrices } = useMemo(() => {
    const trunks: THREE.Matrix4[] = []
    const foliages: THREE.Matrix4[] = []

    trees.forEach((tree) => {
      const scale = tree.scale

      // Trunk
      const trunkMatrix = new THREE.Matrix4()
      trunkMatrix.compose(
        new THREE.Vector3(tree.position.x, 1.5 * scale, tree.position.z),
        new THREE.Quaternion(),
        new THREE.Vector3(0.3 * scale, 3 * scale, 0.3 * scale)
      )
      trunks.push(trunkMatrix)

      // Foliage
      const foliageMatrix = new THREE.Matrix4()
      foliageMatrix.compose(
        new THREE.Vector3(tree.position.x, 4 * scale, tree.position.z),
        new THREE.Quaternion(),
        new THREE.Vector3(2 * scale, 3 * scale, 2 * scale)
      )
      foliages.push(foliageMatrix)
    })

    return { trunkMatrices: trunks, foliageMatrices: foliages }
  }, [trees])

  useMemo(() => {
    if (!trunkRef.current || !foliageRef.current) return
    trunkMatrices.forEach((matrix, i) => {
      trunkRef.current!.setMatrixAt(i, matrix)
    })
    foliageMatrices.forEach((matrix, i) => {
      foliageRef.current!.setMatrixAt(i, matrix)
    })
    trunkRef.current.instanceMatrix.needsUpdate = true
    foliageRef.current.instanceMatrix.needsUpdate = true
  }, [trunkMatrices, foliageMatrices])

  return (
    <group>
      {/* Trunks */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#2d1f1a" roughness={0.9} />
      </instancedMesh>

      {/* Foliage */}
      <instancedMesh ref={foliageRef} args={[undefined, undefined, trees.length]} castShadow>
        <coneGeometry args={[1, 1, 6]} />
        <meshStandardMaterial color="#1a3d1a" roughness={0.8} />
      </instancedMesh>
    </group>
  )
}

interface BlockCurbsProps {
  blocks: Block[]
}

function BlockCurbs({ blocks }: BlockCurbsProps) {
  // Create curb colliders around blocks to keep car on roads
  return (
    <group>
      {blocks.map((block) => {
        const vertices = block.vertices
        if (vertices.length < 4) return null

        // Create wall segments around the block perimeter
        const walls: { start: { x: number; z: number }; end: { x: number; z: number } }[] = []
        for (let i = 0; i < vertices.length; i++) {
          const start = vertices[i]
          const end = vertices[(i + 1) % vertices.length]
          walls.push({ start, end })
        }

        return (
          <group key={block.id}>
            {walls.map((wall, idx) => {
              const dx = wall.end.x - wall.start.x
              const dz = wall.end.z - wall.start.z
              const length = Math.sqrt(dx * dx + dz * dz)
              const angle = Math.atan2(dx, -dz)
              const midX = (wall.start.x + wall.end.x) / 2
              const midZ = (wall.start.z + wall.end.z) / 2

              return (
                <RigidBody
                  key={`${block.id}-wall-${idx}`}
                  type="fixed"
                  colliders="cuboid"
                  position={[midX, 0.15, midZ]}
                  rotation={[0, angle, 0]}
                >
                  <mesh visible={false}>
                    <boxGeometry args={[0.3, 0.3, length]} />
                  </mesh>
                </RigidBody>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

function WaterAndBarrier() {
  const waterRadius = OUTER_RADIUS + 100
  const barrierRadius = OUTER_RADIUS

  // Create circular barrier segments
  const barrierSegments = useMemo(() => {
    const segments: { x: number; z: number; angle: number }[] = []
    const numSegments = 72

    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2
      segments.push({
        x: Math.cos(angle) * barrierRadius,
        z: Math.sin(angle) * barrierRadius,
        angle: angle + Math.PI / 2,
      })
    }

    return segments
  }, [])

  return (
    <group>
      {/* Water plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <ringGeometry args={[OUTER_RADIUS, waterRadius, 64]} />
        <meshStandardMaterial color="#001020" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Barrier colliders */}
      {barrierSegments.map((seg, idx) => (
        <RigidBody
          key={`barrier-${idx}`}
          type="fixed"
          colliders="cuboid"
          position={[seg.x, 1, seg.z]}
          rotation={[0, seg.angle, 0]}
        >
          {/* Visible barrier */}
          <mesh castShadow>
            <boxGeometry args={[0.5, 2, (2 * Math.PI * barrierRadius) / 72 + 1]} />
            <meshStandardMaterial color="#333344" roughness={0.7} metalness={0.5} />
          </mesh>
          {/* Neon strip on barrier */}
          <mesh position={[0.26, 0.3, 0]}>
            <boxGeometry args={[0.02, 0.2, (2 * Math.PI * barrierRadius) / 72]} />
            <meshBasicMaterial color="#ff0080" toneMapped={false} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}

function Ground() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[OUTER_RADIUS + 200, 64]} />
        <meshStandardMaterial color="#0a0a0f" />
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
    <group>
      <Ground />
      <Streetlights streetlights={streetlights} />
      <Trees trees={trees} />
      <BlockCurbs blocks={blocks} />
      <WaterAndBarrier />
    </group>
  )
}
