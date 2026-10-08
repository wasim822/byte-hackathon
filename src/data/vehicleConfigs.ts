// Vehicle configuration - all car tuning lives here
// Real-world scale: 1 unit = 1 meter

export interface VehicleConfig {
  // Dimensions
  length: number
  width: number
  height: number

  // Physics
  mass: number
  acceleration: number
  brakeForce: number
  maxSpeed: number
  boostMultiplier: number
  maxBoostSpeed: number
  turnSpeed: number
  friction: number
  angularFriction: number
  linearDamping: number
  angularDamping: number

  // Visual
  bodyColor: string
  cabinColor: string
  underglowColor: string
}

export const defaultVehicle: VehicleConfig = {
  // Dimensions (meters)
  length: 4.5,
  width: 2,
  height: 1.4,

  // Physics
  mass: 1200,
  acceleration: 120,
  brakeForce: 80,
  maxSpeed: 120,
  boostMultiplier: 2,
  maxBoostSpeed: 180,
  turnSpeed: 2.2,
  friction: 0.975,
  angularFriction: 0.75,
  linearDamping: 0.1,
  angularDamping: 0.3,

  // Visual
  bodyColor: '#1a1a2e',
  cabinColor: '#0a0a1a',
  underglowColor: '#00ffff',
}

// Future vehicle variants can be added here
export const vehicles = {
  default: defaultVehicle,
} as const

export type VehicleType = keyof typeof vehicles
