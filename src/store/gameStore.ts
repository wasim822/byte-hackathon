import { create } from 'zustand'
import * as THREE from 'three'

interface GameState {
  // Car state
  carPosition: THREE.Vector3
  carRotation: number
  carVelocity: THREE.Vector3

  // Camera state
  cameraZoom: number
  minZoom: number
  maxZoom: number

  // Input state
  keys: {
    forward: boolean
    backward: boolean
    left: boolean
    right: boolean
    boost: boolean
  }

  // Actions
  setCarPosition: (position: THREE.Vector3) => void
  setCarRotation: (rotation: number) => void
  setCarVelocity: (velocity: THREE.Vector3) => void
  setCameraZoom: (zoom: number) => void
  setKey: (key: keyof GameState['keys'], pressed: boolean) => void
}

export const useGameStore = create<GameState>((set) => ({
  // Initial car state
  carPosition: new THREE.Vector3(0, 0.5, 0),
  carRotation: 0,
  carVelocity: new THREE.Vector3(0, 0, 0),

  // Camera zoom (distance from car)
  cameraZoom: 50,
  minZoom: 20,
  maxZoom: 200,

  // Input state
  keys: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
  },

  // Actions
  setCarPosition: (position) => set({ carPosition: position }),
  setCarRotation: (rotation) => set({ carRotation: rotation }),
  setCarVelocity: (velocity) => set({ carVelocity: velocity }),
  setCameraZoom: (zoom) =>
    set((state) => ({
      cameraZoom: Math.max(state.minZoom, Math.min(state.maxZoom, zoom)),
    })),
  setKey: (key, pressed) =>
    set((state) => ({
      keys: { ...state.keys, [key]: pressed },
    })),
}))
