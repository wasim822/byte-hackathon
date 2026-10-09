import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { PlaceLot, FillerBuilding, DistrictSign } from '../city/generateCity'

// Light concrete grey for daytime look
const BUILDING_COLOR = '#c8c8c8'

interface PlaceBuildingProps {
  lot: PlaceLot
}

function PlaceBuilding({ lot }: PlaceBuildingProps) {
  const { place, position, rotation, width, depth, height } = lot

  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      position={[position.x, height / 2, position.z]}
      rotation={[0, rotation, 0]}
      userData={{ placeId: place.id }}
    >
      {/* Main building - light concrete grey */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Name sign on front - large and readable */}
      <Text
        position={[0, height * 0.6, depth / 2 + 0.15]}
        fontSize={Math.min(width * 0.18, 4)}
        color="#1a1a1a"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="#ffffff"
        fontWeight="bold"
      >
        {place.name}
      </Text>

      {/* Colored accent band at top */}
      <mesh position={[0, height / 2 - 1, depth / 2 + 0.02]}>
        <planeGeometry args={[width, 2]} />
        <meshStandardMaterial color={place.neonColor} />
      </mesh>

      {/* Back sign */}
      <Text
        position={[0, height * 0.6, -depth / 2 - 0.15]}
        rotation={[0, Math.PI, 0]}
        fontSize={Math.min(width * 0.18, 4)}
        color="#1a1a1a"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="#ffffff"
        fontWeight="bold"
      >
        {place.name}
      </Text>
    </RigidBody>
  )
}

interface FillerBuildingsProps {
  buildings: FillerBuilding[]
}

function FillerBuildings({ buildings }: FillerBuildingsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const matrices = useMemo(() => {
    const mats: THREE.Matrix4[] = []

    buildings.forEach((b) => {
      const matrix = new THREE.Matrix4()
      matrix.compose(
        new THREE.Vector3(b.position.x, b.height / 2, b.position.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, b.rotation, 0)),
        new THREE.Vector3(b.width, b.height, b.depth)
      )
      mats.push(matrix)
    })

    return mats
  }, [buildings])

  // Set instance matrices
  useMemo(() => {
    if (!meshRef.current) return
    matrices.forEach((matrix, i) => {
      meshRef.current!.setMatrixAt(i, matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [matrices])

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, buildings.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={BUILDING_COLOR} roughness={0.8} metalness={0.1} />
      </instancedMesh>

      {/* Add colliders for each filler building */}
      {buildings.map((b) => (
        <RigidBody
          key={b.id}
          type="fixed"
          colliders="cuboid"
          position={[b.position.x, b.height / 2, b.position.z]}
          rotation={[0, b.rotation, 0]}
        >
          <mesh visible={false}>
            <boxGeometry args={[b.width, b.height, b.depth]} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}

interface DistrictSignsProps {
  signs: DistrictSign[]
}

function DistrictSigns({ signs }: DistrictSignsProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.y = signs[i].position.y + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.5
      })
    }
  })

  return (
    <group ref={groupRef}>
      {signs.map((sign) => (
        <group
          key={sign.district}
          position={[sign.position.x, sign.position.y, sign.position.z]}
          rotation={[0, sign.rotation + Math.PI, 0]}
        >
          <Text
            fontSize={8}
            color={sign.color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.2}
            outlineColor="#000000"
          >
            {sign.label}
            <meshBasicMaterial color={sign.color} toneMapped={false} />
          </Text>
        </group>
      ))}
    </group>
  )
}

interface CityBuildingsProps {
  placeLots: PlaceLot[]
  fillerBuildings: FillerBuilding[]
  districtSigns: DistrictSign[]
}

export function CityBuildings({ placeLots, fillerBuildings, districtSigns }: CityBuildingsProps) {
  return (
    <group>
      {/* Place buildings with names */}
      {placeLots.map((lot) => (
        <PlaceBuilding key={lot.place.id} lot={lot} />
      ))}

      {/* Instanced filler buildings */}
      <FillerBuildings buildings={fillerBuildings} />

      {/* Floating district signs */}
      <DistrictSigns signs={districtSigns} />
    </group>
  )
}
