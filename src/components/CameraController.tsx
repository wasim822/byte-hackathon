import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'

export function CameraController() {
  const { camera } = useThree()
  const { carPosition, cameraZoom, setCameraZoom } = useGameStore()
  const targetPosition = useRef(new THREE.Vector3())
  const currentPosition = useRef(new THREE.Vector3(0, 50, 50))

  // Set up scroll wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomDelta = e.deltaY * 0.1
      setCameraZoom(cameraZoom + zoomDelta)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [cameraZoom, setCameraZoom])

  // Set camera FOV for near-top-down view
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 28
      camera.updateProjectionMatrix()
    }
  }, [camera])

  useFrame(() => {
    // Calculate target camera position based on car position and zoom
    // Near-top-down view: camera is mostly above, slightly behind
    const angle = Math.PI / 6 // 30 degrees from vertical
    const height = cameraZoom * Math.cos(angle)
    const distance = cameraZoom * Math.sin(angle)

    targetPosition.current.set(
      carPosition.x,
      carPosition.y + height,
      carPosition.z + distance
    )

    // Smooth camera follow with lerp
    currentPosition.current.lerp(targetPosition.current, 0.05)
    camera.position.copy(currentPosition.current)

    // Look at the car
    camera.lookAt(carPosition.x, carPosition.y, carPosition.z)
  })

  return null
}
