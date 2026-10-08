import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'

// Real-world scale: 1 unit = 1 meter
// Car is ~4.5m long, ~2m wide
const CAR_LENGTH = 4.5
const CAR_WIDTH = 2
const CAR_HEIGHT = 1.4

// Physics tuned for fast arcade feel
const CAR_ACCELERATION = 120 // Very fast acceleration
const CAR_BRAKE_FORCE = 80
const CAR_BOOST_MULTIPLIER = 2
const CAR_MAX_SPEED = 120 // ~430 km/h
const CAR_MAX_BOOST_SPEED = 180 // ~650 km/h
const CAR_TURN_SPEED = 2.2 // Smoother turning
const CAR_FRICTION = 0.975
const CAR_ANGULAR_FRICTION = 0.75 // More damping on rotation

export function Car() {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
  })

  const setCarPosition = useGameStore((state) => state.setCarPosition)
  const setCarRotation = useGameStore((state) => state.setCarRotation)
  const setCarSpeed = useGameStore((state) => state.setCarSpeed)
  const setIsBoosting = useGameStore((state) => state.setIsBoosting)
  const mapOpen = useGameStore((state) => state.mapOpen)

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

  useFrame((_, delta) => {
    if (!rigidBodyRef.current) return

    // Don't process input when map is open
    if (mapOpen) return

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
    const absSpeed = Math.abs(currentSpeed)

    // Update store
    setCarSpeed(absSpeed)
    setIsBoosting(keys.boost && keys.forward)

    // Acceleration
    const boost = keys.boost ? CAR_BOOST_MULTIPLIER : 1
    const maxSpeed = keys.boost ? CAR_MAX_BOOST_SPEED : CAR_MAX_SPEED
    let acceleration = 0

    const dt = Math.min(delta, 0.033) // Cap delta time

    if (keys.forward && currentSpeed < maxSpeed) {
      acceleration = CAR_ACCELERATION * boost * dt
    }
    if (keys.backward) {
      if (currentSpeed > 0.5) {
        // Braking
        acceleration = -CAR_BRAKE_FORCE * dt
      } else if (currentSpeed > -maxSpeed / 3) {
        // Reversing
        acceleration = -CAR_ACCELERATION * 0.5 * dt
      }
    }

    // Apply acceleration in forward direction
    let newVelX = velocity.x + forwardX * acceleration
    let newVelZ = velocity.z + forwardZ * acceleration

    // Apply friction (more friction when not accelerating)
    const frictionFactor = keys.forward || keys.backward ? CAR_FRICTION : CAR_FRICTION * 0.98
    newVelX *= frictionFactor
    newVelZ *= frictionFactor

    rb.setLinvel({ x: newVelX, y: velocity.y, z: newVelZ }, true)

    // Turning (scales with speed for arcade feel)
    const speedFactor = Math.min(absSpeed / 8, 1) * (0.5 + absSpeed / CAR_MAX_SPEED * 0.5)
    let turnAmount = 0

    if (keys.left) {
      turnAmount = CAR_TURN_SPEED * speedFactor
    }
    if (keys.right) {
      turnAmount = -CAR_TURN_SPEED * speedFactor
    }

    // Reverse turning direction when going backward
    if (currentSpeed < -0.5) {
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
      mass={1500} // ~1500 kg car
      position={[0, 1.5, -60]} // Start on the roundabout
      linearDamping={0.1}
      angularDamping={0.3}
      enabledRotations={[false, true, false]}
      friction={0.7}
    >
      <group>
        {/* Car body */}
        <mesh position={[0, CAR_HEIGHT / 2 - 0.2, 0]} castShadow>
          <boxGeometry args={[CAR_WIDTH, CAR_HEIGHT * 0.5, CAR_LENGTH]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Car cabin */}
        <mesh position={[0, CAR_HEIGHT - 0.2, -0.3]} castShadow>
          <boxGeometry args={[CAR_WIDTH * 0.85, CAR_HEIGHT * 0.4, CAR_LENGTH * 0.5]} />
          <meshStandardMaterial color="#0a0a1a" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Headlights */}
        <mesh position={[0.6, CAR_HEIGHT / 2 - 0.1, -CAR_LENGTH / 2 - 0.02]}>
          <boxGeometry args={[0.3, 0.15, 0.05]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[-0.6, CAR_HEIGHT / 2 - 0.1, -CAR_LENGTH / 2 - 0.02]}>
          <boxGeometry args={[0.3, 0.15, 0.05]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        {/* Taillights */}
        <mesh position={[0.7, CAR_HEIGHT / 2 - 0.1, CAR_LENGTH / 2 + 0.02]}>
          <boxGeometry args={[0.25, 0.1, 0.05]} />
          <meshBasicMaterial color="#ff0040" toneMapped={false} />
        </mesh>
        <mesh position={[-0.7, CAR_HEIGHT / 2 - 0.1, CAR_LENGTH / 2 + 0.02]}>
          <boxGeometry args={[0.25, 0.1, 0.05]} />
          <meshBasicMaterial color="#ff0040" toneMapped={false} />
        </mesh>

        {/* Neon underglow */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[CAR_WIDTH - 0.2, 0.03, CAR_LENGTH - 0.3]} />
          <meshBasicMaterial color="#00ffff" toneMapped={false} transparent opacity={0.9} />
        </mesh>
      </group>
    </RigidBody>
  )
}
