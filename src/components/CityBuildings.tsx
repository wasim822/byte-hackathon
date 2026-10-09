import { useMemo, useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useGLTF, useTexture } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { PlaceLot, FillerBuilding, DistrictSign } from '../city/generateCity'

// Preload all Kenney building models
const KENNEY_BUILDINGS = [
  '/assets/models/kenney-commercial/building-a.glb',
  '/assets/models/kenney-commercial/building-b.glb',
  '/assets/models/kenney-commercial/building-c.glb',
  '/assets/models/kenney-commercial/building-d.glb',
  '/assets/models/kenney-commercial/building-e.glb',
  '/assets/models/kenney-commercial/building-f.glb',
  '/assets/models/kenney-commercial/building-g.glb',
  '/assets/models/kenney-commercial/building-h.glb',
]

const KENNEY_SKYSCRAPERS = [
  '/assets/models/kenney-commercial/building-skyscraper-a.glb',
  '/assets/models/kenney-commercial/building-skyscraper-b.glb',
  '/assets/models/kenney-commercial/building-skyscraper-c.glb',
  '/assets/models/kenney-commercial/building-skyscraper-d.glb',
  '/assets/models/kenney-commercial/building-skyscraper-e.glb',
]

// Preload models
KENNEY_BUILDINGS.forEach(path => useGLTF.preload(path))
KENNEY_SKYSCRAPERS.forEach(path => useGLTF.preload(path))

// Facade texture for tall towers
function useFacadeTexture() {
  const textures = useTexture({
    map: '/assets/textures/facade-01/color.webp',
    normalMap: '/assets/textures/facade-01/normal.webp',
    roughnessMap: '/assets/textures/facade-01/roughness.webp',
  })

  Object.values(textures).forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    // 3.5m per floor
    tex.repeat.set(0.1, 1 / 3.5)
  })

  return textures
}

// Shared materials for draw call efficiency
const sharedBuildingMaterial = new THREE.MeshStandardMaterial({
  color: '#c8c8c8',
  roughness: 0.8,
  metalness: 0.1,
})

interface KenneyBuildingProps {
  modelPath: string
  position: THREE.Vector3
  rotation: number
  scale: number
}

function KenneyBuilding({ modelPath, position, rotation, scale }: KenneyBuildingProps) {
  const { scene } = useGLTF(modelPath)

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = sharedBuildingMaterial
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return (
    <primitive
      object={clonedScene}
      position={[position.x, 0, position.z]}
      rotation={[0, rotation, 0]}
      scale={[scale, scale, scale]}
    />
  )
}

interface TexturedTowerProps {
  position: { x: number; z: number }
  rotation: number
  width: number
  depth: number
  height: number
}

function TexturedTower({ position, rotation, width, depth, height }: TexturedTowerProps) {
  const facadeTexture = useFacadeTexture()

  // Clone textures for this tower's specific UV repeat
  const towerTextures = useMemo(() => {
    const cloned = {
      map: facadeTexture.map.clone(),
      normalMap: facadeTexture.normalMap.clone(),
      roughnessMap: facadeTexture.roughnessMap.clone(),
    }
    // Adjust repeat based on building dimensions
    const floorsHigh = height / 3.5
    Object.values(cloned).forEach(tex => {
      tex.needsUpdate = true
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(width / 10, floorsHigh)
    })
    return cloned
  }, [facadeTexture, width, height])

  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      position={[position.x, height / 2, position.z]}
      rotation={[0, rotation, 0]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          map={towerTextures.map}
          normalMap={towerTextures.normalMap}
          roughnessMap={towerTextures.roughnessMap}
          roughness={0.8}
        />
      </mesh>
    </RigidBody>
  )
}

interface PlaceBuildingProps {
  lot: PlaceLot
}

function PlaceBuilding({ lot }: PlaceBuildingProps) {
  const { place, position, rotation, width, depth, height } = lot
  const facadeTexture = useFacadeTexture()

  // Clone textures for this building
  const buildingTextures = useMemo(() => {
    const cloned = {
      map: facadeTexture.map.clone(),
      normalMap: facadeTexture.normalMap.clone(),
      roughnessMap: facadeTexture.roughnessMap.clone(),
    }
    const floorsHigh = height / 3.5
    Object.values(cloned).forEach(tex => {
      tex.needsUpdate = true
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(width / 10, floorsHigh)
    })
    return cloned
  }, [facadeTexture, width, height])

  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      position={[position.x, height / 2, position.z]}
      rotation={[0, rotation, 0]}
      userData={{ placeId: place.id }}
    >
      {/* Main building with facade texture */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          map={buildingTextures.map}
          normalMap={buildingTextures.normalMap}
          roughnessMap={buildingTextures.roughnessMap}
          roughness={0.8}
        />
      </mesh>

      {/* Front name sign - large and readable */}
      <Text
        position={[0, height * 0.3, depth / 2 + 0.15]}
        fontSize={Math.min(width * 0.15, 3)}
        color="#1a1a1a"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#ffffff"
        fontWeight="bold"
      >
        {place.name}
      </Text>

      {/* Back sign */}
      <Text
        position={[0, height * 0.3, -depth / 2 - 0.15]}
        rotation={[0, Math.PI, 0]}
        fontSize={Math.min(width * 0.15, 3)}
        color="#1a1a1a"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#ffffff"
        fontWeight="bold"
      >
        {place.name}
      </Text>

      {/* Rooftop sign */}
      <group position={[0, height / 2 + 2, 0]}>
        {/* Sign backing */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[Math.min(width * 0.8, 12), 3, 0.5]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Rooftop text */}
        <Text
          position={[0, 1.5, 0.3]}
          fontSize={Math.min(width * 0.12, 2)}
          color={place.neonColor || '#1a1a1a'}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {place.name}
        </Text>
        {/* Poles */}
        <mesh position={[-3, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[3, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      </group>
    </RigidBody>
  )
}

interface FillerBuildingsProps {
  buildings: FillerBuilding[]
}

function FillerBuildings({ buildings }: FillerBuildingsProps) {
  // Mix of Kenney models and textured towers
  const buildingData = useMemo(() => {
    return buildings.map((b, idx) => {
      // Use Kenney model for shorter buildings, textured tower for taller
      const useKenney = b.height < 20
      const modelPath = useKenney
        ? KENNEY_BUILDINGS[idx % KENNEY_BUILDINGS.length]
        : KENNEY_SKYSCRAPERS[idx % KENNEY_SKYSCRAPERS.length]

      return {
        ...b,
        useKenney,
        modelPath,
        scale: useKenney ? b.height / 8 : b.height / 25, // Scale Kenney models appropriately
      }
    })
  }, [buildings])

  return (
    <Suspense fallback={null}>
      <group>
        {buildingData.map((b) => (
          b.useKenney ? (
            <group key={b.id}>
              <KenneyBuilding
                modelPath={b.modelPath}
                position={new THREE.Vector3(b.position.x, 0, b.position.z)}
                rotation={b.rotation}
                scale={b.scale}
              />
              {/* Invisible collider for Kenney buildings */}
              <RigidBody
                type="fixed"
                colliders="cuboid"
                position={[b.position.x, b.height / 2, b.position.z]}
                rotation={[0, b.rotation, 0]}
              >
                <mesh visible={false}>
                  <boxGeometry args={[b.width, b.height, b.depth]} />
                </mesh>
              </RigidBody>
            </group>
          ) : (
            <TexturedTower
              key={b.id}
              position={b.position}
              rotation={b.rotation}
              width={b.width}
              depth={b.depth}
              height={b.height}
            />
          )
        ))}
      </group>
    </Suspense>
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
    <Suspense fallback={null}>
      <group>
        {/* Place buildings with names and rooftop signs */}
        {placeLots.map((lot) => (
          <PlaceBuilding key={lot.place.id} lot={lot} />
        ))}

        {/* Filler buildings - mix of Kenney models and textured towers */}
        <FillerBuildings buildings={fillerBuildings} />

        {/* Floating district signs */}
        <DistrictSigns signs={districtSigns} />
      </group>
    </Suspense>
  )
}
