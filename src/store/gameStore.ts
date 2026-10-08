import { create } from 'zustand'
import * as THREE from 'three'
import { District } from '../data/places'

export type CameraMode = 'chase-close' | 'chase-far' | 'top-down'

interface GameState {
  // Car state
  carPosition: THREE.Vector3
  carRotation: number
  carVelocity: THREE.Vector3
  carSpeed: number
  isBoosting: boolean

  // Camera state
  cameraMode: CameraMode
  cameraLookOffset: { x: number; y: number }
  lastInputTime: number

  // Map state
  mapOpen: boolean

  // District state
  currentDistrict: District | null
  districtDisplayName: string | null
  districtFadeState: 'in' | 'hold' | 'out' | 'hidden'

  // Actions
  setCarPosition: (position: THREE.Vector3) => void
  setCarRotation: (rotation: number) => void
  setCarVelocity: (velocity: THREE.Vector3) => void
  setCarSpeed: (speed: number) => void
  setIsBoosting: (boosting: boolean) => void
  setCameraMode: (mode: CameraMode) => void
  cycleCameraMode: () => void
  setCameraLookOffset: (offset: { x: number; y: number }) => void
  setLastInputTime: (time: number) => void
  setMapOpen: (open: boolean) => void
  toggleMap: () => void
  setCurrentDistrict: (district: District | null) => void
  showDistrictName: (name: string) => void
  setDistrictFadeState: (state: 'in' | 'hold' | 'out' | 'hidden') => void
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial car state
  carPosition: new THREE.Vector3(0, 1, -60),
  carRotation: 0,
  carVelocity: new THREE.Vector3(0, 0, 0),
  carSpeed: 0,
  isBoosting: false,

  // Camera state
  cameraMode: 'chase-close',
  cameraLookOffset: { x: 0, y: 0 },
  lastInputTime: 0,

  // Map state
  mapOpen: false,

  // District state
  currentDistrict: null,
  districtDisplayName: null,
  districtFadeState: 'hidden',

  // Actions
  setCarPosition: (position) => set({ carPosition: position }),
  setCarRotation: (rotation) => set({ carRotation: rotation }),
  setCarVelocity: (velocity) => set({ carVelocity: velocity }),
  setCarSpeed: (speed) => set({ carSpeed: speed }),
  setIsBoosting: (boosting) => set({ isBoosting: boosting }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  cycleCameraMode: () => {
    const modes: CameraMode[] = ['chase-close', 'chase-far', 'top-down']
    const current = get().cameraMode
    const idx = modes.indexOf(current)
    const next = modes[(idx + 1) % modes.length]
    set({ cameraMode: next })
  },
  setCameraLookOffset: (offset) => set({ cameraLookOffset: offset }),
  setLastInputTime: (time) => set({ lastInputTime: time }),
  setMapOpen: (open) => set({ mapOpen: open }),
  toggleMap: () => set((state) => ({ mapOpen: !state.mapOpen })),
  setCurrentDistrict: (district) => set({ currentDistrict: district }),
  showDistrictName: (name) =>
    set({
      districtDisplayName: name,
      districtFadeState: 'in',
    }),
  setDistrictFadeState: (state) => set({ districtFadeState: state }),
}))
