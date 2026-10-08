import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { PlaceLot, FillerBuilding, DistrictSign } from '../city/generateCity'

interface PlaceBuildingProps {
  lot: PlaceLot
}

function PlaceBuilding({ lot }: PlaceBuildingProps) {
  const { place, position, rotation, width, depth, height } = lot

  // Edge geometry for neon outline
  const edgesGeometry = useMemo(() => {
    const boxGeom = new THREE.BoxGeometry(width, height, depth)
    return new THREE.EdgesGeometry(boxGeom)
  }, [width, height, depth])

  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      position={[position.x, height / 2, position.z]}
      rotation={[0, rotation, 0]}
      userData={{ placeId: place.id }}
    >
      {/* Main building */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Neon edges */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={place.neonColor} toneMapped={false} />
      </lineSegments>

      {/* Accent strip at top */}
      <mesh position={[0, height / 2 - 0.5, depth / 2 + 0.02]}>
        <planeGeometry args={[width * 0.9, 0.8]} />
        <meshBasicMaterial color={place.neonColor} toneMapped={false} />
      </mesh>

      {/* Name sign on front */}
      <Text
        position={[0, height * 0.3, depth / 2 + 0.1]}
        fontSize={Math.min(width * 0.12, 2.5)}
        color={place.neonColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {place.name}
      </Text>

      {/* Accent strip on back */}
      <mesh position={[0, height / 2 - 0.5, -depth / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width * 0.9, 0.8]} />
        <meshBasicMaterial color={place.neonColor} toneMapped={false} />
      </mesh>
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
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
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
