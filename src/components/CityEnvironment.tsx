import { useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { Tree, Streetlight, Block, OUTER_RADIUS } from '../city/generateCity'

// Texture hooks
function useSidewalkTexture() {
  const textures = useTexture({
    map: '/assets/textures/sidewalk/color.webp',
    normalMap: '/assets/textures/sidewalk/normal.webp',
    roughnessMap: '/assets/textures/sidewalk/roughness.webp',
  })

  Object.values(textures).forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(0.2, 0.2) // 5m per tile
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
    tex.repeat.set(0.05, 0.05) // 20m per tile
  })

  return textures
}

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

interface SidewalksAndCurbsProps {
  blocks: Block[]
}

function SidewalksAndCurbs({ blocks }: SidewalksAndCurbsProps) {
  const sidewalkTexture = useSidewalkTexture()

  // Generate sidewalk geometry and curbs for each block
  const sidewalkData = useMemo(() => {
    const data: {
      sidewalkGeometry: THREE.BufferGeometry
      curbs: { position: THREE.Vector3; rotation: number; length: number; isRed: boolean }[]
    }[] = []

    blocks.forEach((block, blockIdx) => {
      const vertices = block.vertices
      if (vertices.length < 4) return

      // Create sidewalk shape (slightly inset from block edges)
      const shape = new THREE.Shape()
      const inset = 0.3 // Inset from curb

      const insetVertices = vertices.map((v, i) => {
        const prev = vertices[(i - 1 + vertices.length) % vertices.length]
        const next = vertices[(i + 1) % vertices.length]

        // Calculate inward direction
        const dx1 = v.x - prev.x
        const dz1 = v.z - prev.z
        const dx2 = next.x - v.x
        const dz2 = next.z - v.z

        // Average normal
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

      // Generate curb data
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

        // Some curb sections are red (no parking zones) - about 1 in 5
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
      {/* Sidewalk surfaces - raised 15cm */}
      {sidewalkData.map((data, idx) => (
        <group key={`sidewalk-group-${idx}`}>
          {/* Sidewalk surface */}
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

          {/* Curbs */}
          {data.curbs.map((curb, curbIdx) => (
            <group key={`curb-${idx}-${curbIdx}`}>
              {/* Curb mesh */}
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

              {/* Curb collider */}
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

  // Create grass patches in open areas of blocks
  const grassGeometries = useMemo(() => {
    return blocks.map((block) => {
      const vertices = block.vertices
      if (vertices.length < 4) return null

      // Create inner grass area (inset further from sidewalk)
      const shape = new THREE.Shape()
      const inset = 3 // Inset from curb edge

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
      {/* Water plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <ringGeometry args={[OUTER_RADIUS + 2, waterRadius, 64]} />
        <meshStandardMaterial color="#1a4a6a" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Visible wall segments - concrete */}
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

      {/* Invisible tall wall colliders */}
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

      {/* Invisible ceiling */}
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
    <group>
      <Ground />
      <GrassAreas blocks={blocks} />
      <SidewalksAndCurbs blocks={blocks} />
      <Streetlights streetlights={streetlights} />
      <Trees trees={trees} />
      <CityEdge />
    </group>
  )
}
