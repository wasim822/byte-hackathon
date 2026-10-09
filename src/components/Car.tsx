import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CollisionEnterPayload } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { defaultVehicle } from '../data/vehicleConfigs'
import { places } from '../data/places'

// Get config from vehicleConfigs.ts
const config = defaultVehicle

// Store place lot positions for E key proximity check
let placeLotPositions: Map<string, THREE.Vector3> = new Map()

export function setPlaceLotPositions(positions: Map<string, THREE.Vector3>) {
  placeLotPositions = positions
}

export function Car() {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    interact: false,
  })

  const setCarPosition = useGameStore((state) => state.setCarPosition)
  const setCarRotation = useGameStore((state) => state.setCarRotation)
  const setCarSpeed = useGameStore((state) => state.setCarSpeed)
  const setIsBoosting = useGameStore((state) => state.setIsBoosting)
  const mapOpen = useGameStore((state) => state.mapOpen)
  const showVisitPopup = useGameStore((state) => state.showVisitPopup)
  const canShowPopup = useGameStore((state) => state.canShowPopup)
  const visitPopup = useGameStore((state) => state.visitPopup)

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
        case 'KeyE':
          keysRef.current.interact = true
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
        case 'KeyE':
          keysRef.current.interact = false
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
    const boost = keys.boost ? config.boostMultiplier : 1
    const maxSpeed = keys.boost ? config.maxBoostSpeed : config.maxSpeed
    let acceleration = 0

    const dt = Math.min(delta, 0.033) // Cap delta time

    if (keys.forward && currentSpeed < maxSpeed) {
      acceleration = config.acceleration * boost * dt
    }
    if (keys.backward) {
      if (currentSpeed > 0.5) {
        // Braking
        acceleration = -config.brakeForce * dt
      } else if (currentSpeed > -maxSpeed / 3) {
        // Reversing
        acceleration = -config.acceleration * 0.5 * dt
      }
    }

    // Apply acceleration in forward direction
    let newVelX = velocity.x + forwardX * acceleration
    let newVelZ = velocity.z + forwardZ * acceleration

    // Apply friction (more friction when not accelerating)
    const frictionFactor = keys.forward || keys.backward ? config.friction : config.friction * 0.98
    newVelX *= frictionFactor
    newVelZ *= frictionFactor

    rb.setLinvel({ x: newVelX, y: velocity.y, z: newVelZ }, true)

    // Turning (scales with speed for arcade feel)
    const speedFactor = Math.min(absSpeed / 8, 1) * (0.5 + absSpeed / config.maxSpeed * 0.5)
    let turnAmount = 0

    if (keys.left) {
      turnAmount = config.turnSpeed * speedFactor
    }
    if (keys.right) {
      turnAmount = -config.turnSpeed * speedFactor
    }

    // Reverse turning direction when going backward
    if (currentSpeed < -0.5) {
      turnAmount = -turnAmount
    }

    // Apply angular velocity for turning
    const newAngVelY = angularVelocity.y * config.angularFriction + turnAmount
    rb.setAngvel({ x: 0, y: newAngVelY, z: 0 }, true)

    // Update store with car position and rotation
    const position = rb.translation()
    const carPos = new THREE.Vector3(position.x, position.y, position.z)
    setCarPosition(carPos)
    setCarRotation(carAngle)

    // Check for E key interaction with nearby place buildings
    if (keys.interact && !visitPopup && absSpeed < 5) {
      keysRef.current.interact = false // Consume the key press

      // Find closest place within 12m
      let closestPlace = null
      let closestDist = 12

      placeLotPositions.forEach((lotPos, placeId) => {
        const dist = carPos.distanceTo(lotPos)
        if (dist < closestDist && canShowPopup(placeId)) {
          closestDist = dist
          closestPlace = places.find(p => p.id === placeId)
        }
      })

      if (closestPlace) {
        showVisitPopup(closestPlace, carPos)
      }
    }
  })

  // Handle collision with place buildings
  const handleCollision = (payload: CollisionEnterPayload) => {
    const userData = payload.other.rigidBody?.userData as { placeId?: string } | undefined
    if (userData?.placeId && !visitPopup) {
      const place = places.find(p => p.id === userData.placeId)
      if (place && canShowPopup(place.id)) {
        const pos = rigidBodyRef.current?.translation()
        if (pos) {
          showVisitPopup(place, new THREE.Vector3(pos.x, pos.y, pos.z))
        }
      }
    }
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="cuboid"
      mass={config.mass}
      position={[0, 1.5, -60]} // Start on the roundabout
      linearDamping={config.linearDamping}
      angularDamping={config.angularDamping}
      enabledRotations={[false, true, false]}
      friction={0.7}
      onCollisionEnter={handleCollision}
    >
      <group>
        {/* Car body */}
        <mesh position={[0, config.height / 2 - 0.2, 0]} castShadow>
          <boxGeometry args={[config.width, config.height * 0.5, config.length]} />
          <meshStandardMaterial color={config.bodyColor} roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Car cabin */}
        <mesh position={[0, config.height - 0.2, -0.3]} castShadow>
          <boxGeometry args={[config.width * 0.85, config.height * 0.4, config.length * 0.5]} />
          <meshStandardMaterial color={config.cabinColor} roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Headlights */}
        <mesh position={[0.6, config.height / 2 - 0.1, -config.length / 2 - 0.02]}>
          <boxGeometry args={[0.3, 0.15, 0.05]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[-0.6, config.height / 2 - 0.1, -config.length / 2 - 0.02]}>
          <boxGeometry args={[0.3, 0.15, 0.05]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        {/* Taillights */}
        <mesh position={[0.7, config.height / 2 - 0.1, config.length / 2 + 0.02]}>
          <boxGeometry args={[0.25, 0.1, 0.05]} />
          <meshBasicMaterial color="#ff0040" toneMapped={false} />
        </mesh>
        <mesh position={[-0.7, config.height / 2 - 0.1, config.length / 2 + 0.02]}>
          <boxGeometry args={[0.25, 0.1, 0.05]} />
          <meshBasicMaterial color="#ff0040" toneMapped={false} />
        </mesh>

        {/* Neon underglow */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[config.width - 0.2, 0.03, config.length - 0.3]} />
          <meshBasicMaterial color={config.underglowColor} toneMapped={false} transparent opacity={0.9} />
        </mesh>
      </group>
    </RigidBody>
  )
}
