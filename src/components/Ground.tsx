import { RigidBody } from '@react-three/rapier'
import { getCityBounds } from '../data/cityLayout'

export function Ground() {
  const bounds = getCityBounds()
  const size = Math.max(bounds.width, bounds.depth) * 2

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0a0a0f" />
      </mesh>
    </RigidBody>
  )
}
