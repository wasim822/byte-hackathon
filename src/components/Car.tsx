import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'

// Car physics constants
const CAR_ACCELERATION = 400
const CAR_BOOST_MULTIPLIER = 2.5
const CAR_MAX_SPEED = 80
const CAR_MAX_BOOST_SPEED = 150
const CAR_TURN_SPEED = 4
const CAR_FRICTION = 0.96
const CAR_ANGULAR_FRICTION = 0.8

export function Car() {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false, boost: false })

  const setCarPosition = useGameStore((state) => state.setCarPosition)
  const setCarRotation = useGameStore((state) => state.setCarRotation)

  // Set up keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = true
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.boost = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = false
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.boost = false
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame(() => {
    if (!rigidBodyRef.current) return

    const rb = rigidBodyRef.current
    const keys = keysRef.current

    // Get current velocity
    const velocity = rb.linvel()
    const angularVelocity = rb.angvel()

    // Get car's current rotation (y-axis)
    const rotation = rb.rotation()
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
    )
    const carAngle = euler.y

    // Calculate forward direction
    const forwardX = -Math.sin(carAngle)
    const forwardZ = -Math.cos(carAngle)

    // Calculate current speed in forward direction
    const currentSpeed = velocity.x * forwardX + velocity.z * forwardZ

    // Acceleration
    const boost = keys.boost ? CAR_BOOST_MULTIPLIER : 1
    const maxSpeed = keys.boost ? CAR_MAX_BOOST_SPEED : CAR_MAX_SPEED
    let acceleration = 0

    if (keys.forward && currentSpeed < maxSpeed) {
      acceleration = CAR_ACCELERATION * boost * 0.016 // Fixed timestep
    }
    if (keys.backward && currentSpeed > -maxSpeed / 2) {
      acceleration = -CAR_ACCELERATION * 0.016 * 0.7
    }

    // Apply acceleration in forward direction
    let newVelX = velocity.x + forwardX * acceleration
    let newVelZ = velocity.z + forwardZ * acceleration

    // Apply friction
    newVelX *= CAR_FRICTION
    newVelZ *= CAR_FRICTION

    rb.setLinvel({ x: newVelX, y: velocity.y, z: newVelZ }, true)

    // Turning (only when moving)
    const speedFactor = Math.min(Math.abs(currentSpeed) / 5, 1)
    let turnAmount = 0

    if (keys.left) {
      turnAmount = CAR_TURN_SPEED * speedFactor
    }
    if (keys.right) {
      turnAmount = -CAR_TURN_SPEED * speedFactor
    }

    // Reverse turning direction when going backward
    if (currentSpeed < -1) {
      turnAmount = -turnAmount
    }

    // Apply angular velocity for turning
    const newAngVelY = angularVelocity.y * CAR_ANGULAR_FRICTION + turnAmount
    rb.setAngvel({ x: 0, y: newAngVelY, z: 0 }, true)

    // Update store with car position and rotation
    const position = rb.translation()
    setCarPosition(new THREE.Vector3(position.x, position.y, position.z))
    setCarRotation(carAngle)
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="cuboid"
      mass={1}
      position={[0, 2, 0]}
      linearDamping={0.3}
      angularDamping={0.5}
      enabledRotations={[false, true, false]}
      lockRotations={false}
    >
      <group>
        {/* Car body */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[2, 0.8, 4]} />
          <meshStandardMaterial color="#2a2a4a" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Car cabin */}
        <mesh position={[0, 0.9, -0.3]} castShadow>
          <boxGeometry args={[1.6, 0.6, 2]} />
          <meshStandardMaterial color="#1a1a3a" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Headlights - these will bloom */}
        <mesh position={[0.6, 0.4, -2.05]}>
          <boxGeometry args={[0.4, 0.2, 0.1]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[-0.6, 0.4, -2.05]}>
          <boxGeometry args={[0.4, 0.2, 0.1]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        {/* Taillights - red glow */}
        <mesh position={[0.7, 0.4, 2.05]}>
          <boxGeometry args={[0.3, 0.15, 0.1]} />
          <meshBasicMaterial color="#ff0040" toneMapped={false} />
        </mesh>
        <mesh position={[-0.7, 0.4, 2.05]}>
          <boxGeometry args={[0.3, 0.15, 0.1]} />
          <meshBasicMaterial color="#ff0040" toneMapped={false} />
        </mesh>

        {/* Neon underglow */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[1.8, 0.05, 3.8]} />
          <meshBasicMaterial color="#00ffff" toneMapped={false} transparent opacity={0.8} />
        </mesh>
      </group>
    </RigidBody>
  )
}
