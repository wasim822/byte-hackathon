import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, CameraMode } from '../store/gameStore'

// Camera settings per mode
const CAMERA_SETTINGS: Record<
  CameraMode,
  {
    distance: number
    height: number
    lookAhead: number
    fovBase: number
    fovSpeedBonus: number
    fovBoostBonus: number
  }
> = {
  'chase-close': {
    distance: 8,
    height: 3.5,
    lookAhead: 6,
    fovBase: 60,
    fovSpeedBonus: 10,
    fovBoostBonus: 5,
  },
  'chase-far': {
    distance: 15,
    height: 6,
    lookAhead: 10,
    fovBase: 55,
    fovSpeedBonus: 8,
    fovBoostBonus: 4,
  },
  'top-down': {
    distance: 0,
    height: 200,
    lookAhead: 0,
    fovBase: 45,
    fovSpeedBonus: 0,
    fovBoostBonus: 0,
  },
}

const CAMERA_FOLLOW_SPEED = 12 // Higher = more rigid follow
const LOOK_RETURN_DELAY = 1.5 // seconds
const LOOK_RETURN_SPEED = 2

export function ChaseCamera() {
  const { camera, gl } = useThree()

  const carPosition = useGameStore((state) => state.carPosition)
  const carRotation = useGameStore((state) => state.carRotation)
  const carSpeed = useGameStore((state) => state.carSpeed)
  const isBoosting = useGameStore((state) => state.isBoosting)
  const cameraMode = useGameStore((state) => state.cameraMode)
  const cameraLookOffset = useGameStore((state) => state.cameraLookOffset)
  const setCameraLookOffset = useGameStore((state) => state.setCameraLookOffset)
  const setLastInputTime = useGameStore((state) => state.setLastInputTime)
  const lastInputTime = useGameStore((state) => state.lastInputTime)
  const cycleCameraMode = useGameStore((state) => state.cycleCameraMode)

  // Camera state
  const currentPosition = useRef(new THREE.Vector3(0, 50, 50))
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const isDragging = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })

  // Raycaster for building collision
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  // Handle keyboard input for camera mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyC' && !e.repeat) {
        cycleCameraMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cycleCameraMode])

  // Handle mouse drag for look-around
  useEffect(() => {
    const canvas = gl.domElement

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging.current = true
        lastMousePos.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
      setLastInputTime(performance.now() / 1000)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      const deltaX = e.clientX - lastMousePos.current.x
      const deltaY = e.clientY - lastMousePos.current.y
      lastMousePos.current = { x: e.clientX, y: e.clientY }

      // Update look offset (limited range)
      const newX = Math.max(-Math.PI * 0.8, Math.min(Math.PI * 0.8, cameraLookOffset.x - deltaX * 0.005))
      const newY = Math.max(-0.3, Math.min(0.5, cameraLookOffset.y - deltaY * 0.003))

      setCameraLookOffset({ x: newX, y: newY })
      setLastInputTime(performance.now() / 1000)
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [gl.domElement, cameraLookOffset, setCameraLookOffset, setLastInputTime])

  useFrame((state, delta) => {
    const settings = CAMERA_SETTINGS[cameraMode]
    const dt = Math.min(delta, 0.05)
    const currentTime = performance.now() / 1000

    // Return look offset to center after delay
    if (!isDragging.current && currentTime - lastInputTime > LOOK_RETURN_DELAY) {
      const returnSpeed = LOOK_RETURN_SPEED * dt
      const newX = cameraLookOffset.x * (1 - returnSpeed)
      const newY = cameraLookOffset.y * (1 - returnSpeed)
      if (Math.abs(newX) > 0.001 || Math.abs(newY) > 0.001) {
        setCameraLookOffset({ x: newX, y: newY })
      }
    }

    // Calculate target camera position
    let targetPosition: THREE.Vector3
    let targetLookAt: THREE.Vector3

    if (cameraMode === 'top-down') {
      // Top-down view with slight tilt (15 degrees from vertical)
      const tiltAngle = Math.PI / 12 // 15 degrees
      targetPosition = new THREE.Vector3(
        carPosition.x + Math.sin(tiltAngle) * settings.height * 0.3,
        carPosition.y + settings.height,
        carPosition.z + Math.cos(tiltAngle) * settings.height * 0.3
      )
      targetLookAt = carPosition.clone()
    } else {
      // Chase camera
      const totalAngle = carRotation + cameraLookOffset.x

      // Camera behind the car
      const behindX = Math.sin(totalAngle) * settings.distance
      const behindZ = Math.cos(totalAngle) * settings.distance

      targetPosition = new THREE.Vector3(
        carPosition.x + behindX,
        carPosition.y + settings.height + cameraLookOffset.y * 5,
        carPosition.z + behindZ
      )

      // Look ahead of the car
      const aheadX = -Math.sin(carRotation) * settings.lookAhead
      const aheadZ = -Math.cos(carRotation) * settings.lookAhead

      targetLookAt = new THREE.Vector3(
        carPosition.x + aheadX,
        carPosition.y + 1,
        carPosition.z + aheadZ
      )
    }

    // Rigid follow with lerp
    const followSpeed = Math.min(dt * CAMERA_FOLLOW_SPEED, 1)
    currentPosition.current.lerp(targetPosition, followSpeed)

    // Rigid look-at follow
    currentLookAt.current.lerp(targetLookAt, followSpeed)

    // Building collision raycast (only in chase modes)
    if (cameraMode !== 'top-down') {
      const directionToCamera = currentPosition.current.clone().sub(carPosition)
      const distance = directionToCamera.length()
      directionToCamera.normalize()

      raycaster.set(carPosition, directionToCamera)
      raycaster.far = distance

      // Get all meshes in scene (simplified - in production you'd filter to buildings)
      const intersects = raycaster.intersectObjects(state.scene.children, true)

      // Find first building intersection
      const buildingHit = intersects.find(
        (hit) =>
          hit.object.type === 'Mesh' &&
          hit.distance < distance - 1 &&
          hit.distance > 2
      )

      if (buildingHit) {
        // Pull camera closer
        const pullDistance = buildingHit.distance - 1
        const pulledPosition = carPosition
          .clone()
          .add(directionToCamera.multiplyScalar(pullDistance))
        pulledPosition.y = Math.max(pulledPosition.y, carPosition.y + 2)
        currentPosition.current.lerp(pulledPosition, dt * 10)
      }
    }

    // Apply camera position
    camera.position.copy(currentPosition.current)
    camera.lookAt(currentLookAt.current)

    // Dynamic FOV based on speed
    if (camera instanceof THREE.PerspectiveCamera) {
      const speedRatio = Math.min(carSpeed / 30, 1)
      const targetFov =
        settings.fovBase +
        speedRatio * settings.fovSpeedBonus +
        (isBoosting ? settings.fovBoostBonus : 0)

      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 3)
      camera.updateProjectionMatrix()
    }
  })

  return null
}
