import { create } from 'zustand'
import * as THREE from 'three'
import { District, Place } from '../data/places'

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

  // Popup state
  visitPopup: { place: Place; position: THREE.Vector3 } | null
  recentlyVisited: Map<string, number>

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
  showVisitPopup: (place: Place, position: THREE.Vector3) => void
  hideVisitPopup: () => void
  markRecentlyVisited: (placeId: string) => void
  canShowPopup: (placeId: string) => boolean
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

  // Popup state
  visitPopup: null,
  recentlyVisited: new Map(),

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
  showVisitPopup: (place, position) => set({ visitPopup: { place, position } }),
  hideVisitPopup: () => set({ visitPopup: null }),
  markRecentlyVisited: (placeId) => {
    const map = new Map(get().recentlyVisited)
    map.set(placeId, Date.now())
    set({ recentlyVisited: map })
  },
  canShowPopup: (placeId) => {
    const lastVisit = get().recentlyVisited.get(placeId)
    if (!lastVisit) return true
    return Date.now() - lastVisit > 5000 // 5 second cooldown
  },
}))
