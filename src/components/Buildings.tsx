import { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { cityLayout, Building as BuildingData } from '../data/cityLayout'

interface BuildingProps {
  building: BuildingData
}

function Building({ building }: BuildingProps) {
  const { x, z, width, depth, height, color, emissiveColor } = building

  // Create edge geometry for the glowing outline
  const edgesGeometry = useMemo(() => {
    const boxGeom = new THREE.BoxGeometry(width, height, depth)
    return new THREE.EdgesGeometry(boxGeom)
  }, [width, height, depth])

  return (
    <RigidBody type="fixed" colliders="cuboid" position={[x, height / 2, z]}>
      {/* Main building mesh */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Glowing edges - these will bloom */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          color={emissiveColor}
          linewidth={2}
          toneMapped={false}
        />
      </lineSegments>

      {/* Emissive accent strips on building faces */}
      <mesh position={[0, height / 2 - 1, depth / 2 + 0.01]}>
        <planeGeometry args={[width * 0.8, 0.5]} />
        <meshBasicMaterial color={emissiveColor} toneMapped={false} />
      </mesh>
      <mesh position={[0, height / 2 - 1, -depth / 2 - 0.01]} rotation-y={Math.PI}>
        <planeGeometry args={[width * 0.8, 0.5]} />
        <meshBasicMaterial color={emissiveColor} toneMapped={false} />
      </mesh>
      <mesh position={[width / 2 + 0.01, height / 2 - 1, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[depth * 0.8, 0.5]} />
        <meshBasicMaterial color={emissiveColor} toneMapped={false} />
      </mesh>
      <mesh position={[-width / 2 - 0.01, height / 2 - 1, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[depth * 0.8, 0.5]} />
        <meshBasicMaterial color={emissiveColor} toneMapped={false} />
      </mesh>
    </RigidBody>
  )
}

export function Buildings() {
  const buildings = useMemo(() => {
    return cityLayout.blocks.flatMap((block) => block.buildings)
  }, [])

  return (
    <group>
      {buildings.map((building) => (
        <Building key={building.id} building={building} />
      ))}
    </group>
  )
}
