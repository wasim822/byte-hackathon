import { places, Place, District, DISTRICT_INFO } from '../data/places'

// City dimensions (in meters)
export const PLAZA_RADIUS = 45
export const RING_RADII = [45, 130, 220] // Inner edge of roundabout, middle ring, outer ring
export const OUTER_RADIUS = 250 // Water starts here
export const LANE_WIDTH = 3.5
export const AVENUE_LANES = 4
export const RING_LANES = 4
export const ROAD_WIDTH = LANE_WIDTH * AVENUE_LANES // 14m wide roads
export const NUM_AVENUES = 10
export const AVENUE_ANGLE_STEP = 360 / NUM_AVENUES // 36 degrees

export interface RoadSegment {
  id: string
  type: 'ring' | 'avenue'
  centerline: { x: number; z: number }[]
  width: number
  ringIndex?: number
  avenueIndex?: number
}

export interface Block {
  id: string
  district: District
  innerRadius: number
  outerRadius: number
  startAngle: number // degrees
  endAngle: number // degrees
  vertices: { x: number; z: number }[] // For curb collider
}

export interface PlaceLot {
  place: Place
  position: { x: number; z: number }
  rotation: number // radians, facing the road
  width: number
  depth: number
  height: number
}

export interface FillerBuilding {
  id: string
  position: { x: number; z: number }
  rotation: number
  width: number
  depth: number
  height: number
  color: string
}

export interface Tree {
  id: string
  position: { x: number; z: number }
  scale: number
}

export interface Streetlight {
  id: string
  position: { x: number; z: number }
  rotation: number
}

export interface DistrictSign {
  district: District
  position: { x: number; y: number; z: number }
  rotation: number
  label: string
  color: string
}

export interface CityData {
  roads: RoadSegment[]
  blocks: Block[]
  placeLots: PlaceLot[]
  fillerBuildings: FillerBuilding[]
  trees: Tree[]
  streetlights: Streetlight[]
  districtSigns: DistrictSign[]
  plazaCenter: { x: number; z: number }
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function angleToPosition(angleDeg: number, radius: number): { x: number; z: number } {
  // 0° is north (-z), clockwise positive
  const rad = degToRad(angleDeg - 90) // Adjust so 0° points to -z
  return {
    x: Math.cos(rad) * radius,
    z: -Math.sin(rad) * radius,
  }
}

function getDistrictForAngle(angleDeg: number): District {
  // Normalize angle to 0-360
  const normalized = ((angleDeg % 360) + 360) % 360

  // Districts are 72° wedges centered on their angles
  // Social: 36° (0-72)
  // Entertainment: 108° (72-144)
  // Gaming: 180° (144-216)
  // Food & Insurance: 252° (216-288)
  // Technology: 324° (288-360)

  if (normalized < 72) return 'social'
  if (normalized < 144) return 'entertainment'
  if (normalized < 216) return 'gaming'
  if (normalized < 288) return 'food-insurance'
  return 'technology'
}

function generateRingRoad(ringIndex: number, radius: number): RoadSegment {
  const segments = 72 // Points around the ring
  const centerline: { x: number; z: number }[] = []

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 360
    const pos = angleToPosition(angle, radius)
    centerline.push(pos)
  }

  return {
    id: `ring-${ringIndex}`,
    type: 'ring',
    centerline,
    width: ROAD_WIDTH,
    ringIndex,
  }
}

function generateAvenue(avenueIndex: number): RoadSegment {
  const angle = avenueIndex * AVENUE_ANGLE_STEP
  const centerline: { x: number; z: number }[] = []

  // From plaza roundabout to outer ring
  const innerRadius = RING_RADII[0] + ROAD_WIDTH / 2
  const outerRadius = RING_RADII[2]

  const segments = 20
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const radius = innerRadius + t * (outerRadius - innerRadius)
    const pos = angleToPosition(angle, radius)
    centerline.push(pos)
  }

  return {
    id: `avenue-${avenueIndex}`,
    type: 'avenue',
    centerline,
    width: ROAD_WIDTH,
    avenueIndex,
  }
}

function generateBlocks(): Block[] {
  const blocks: Block[] = []
  let blockId = 0

  // Blocks between rings
  for (let ringIdx = 0; ringIdx < RING_RADII.length - 1; ringIdx++) {
    const innerR = RING_RADII[ringIdx] + ROAD_WIDTH / 2
    const outerR = RING_RADII[ringIdx + 1] - ROAD_WIDTH / 2

    for (let aveIdx = 0; aveIdx < NUM_AVENUES; aveIdx++) {
      const startAngle = aveIdx * AVENUE_ANGLE_STEP + 2 // Small gap for road
      const endAngle = (aveIdx + 1) * AVENUE_ANGLE_STEP - 2
      const midAngle = (startAngle + endAngle) / 2
      const district = getDistrictForAngle(midAngle)

      // Generate vertices for curb collider (curved trapezoid)
      const vertices: { x: number; z: number }[] = []
      const arcSegments = 8

      // Inner arc
      for (let i = 0; i <= arcSegments; i++) {
        const angle = startAngle + (i / arcSegments) * (endAngle - startAngle)
        vertices.push(angleToPosition(angle, innerR))
      }

      // Outer arc (reverse order)
      for (let i = arcSegments; i >= 0; i--) {
        const angle = startAngle + (i / arcSegments) * (endAngle - startAngle)
        vertices.push(angleToPosition(angle, outerR))
      }

      blocks.push({
        id: `block-${blockId++}`,
        district,
        innerRadius: innerR,
        outerRadius: outerR,
        startAngle,
        endAngle,
        vertices,
      })
    }
  }

  return blocks
}

function assignPlacesToLots(blocks: Block[]): PlaceLot[] {
  const placeLots: PlaceLot[] = []
  const placesByDistrict: Record<string, Place[]> = {
    social: [],
    entertainment: [],
    gaming: [],
    'food-insurance': [],
    technology: [],
    plaza: [],
  }

  // Group places by district
  places.forEach(p => {
    placesByDistrict[p.district].push(p)
  })

  // Google goes in plaza center
  const google = placesByDistrict.plaza[0]
  if (google) {
    placeLots.push({
      place: google,
      position: { x: 0, z: 0 },
      rotation: 0,
      width: 25,
      depth: 25,
      height: 35,
    })
  }

  // Assign places to blocks facing ring roads
  const districtBlocks: Record<District, Block[]> = {
    social: [],
    entertainment: [],
    gaming: [],
    'food-insurance': [],
    technology: [],
  }

  blocks.forEach(block => {
    districtBlocks[block.district].push(block)
  })

  // For each district, assign places to blocks
  Object.entries(districtBlocks).forEach(([district, dBlocks]) => {
    const dPlaces = placesByDistrict[district as District]
    dPlaces.forEach((place, idx) => {
      const block = dBlocks[idx % dBlocks.length]
      if (!block) return

      const midAngle = (block.startAngle + block.endAngle) / 2
      const midRadius = (block.innerRadius + block.outerRadius) / 2

      // Position building in the block, facing the inner ring road
      const pos = angleToPosition(midAngle, midRadius)
      const rotation = degToRad(midAngle) // Face outward (toward road)

      // Random size within constraints
      const seed = place.id.charCodeAt(0) + place.id.charCodeAt(1)
      const width = 18 + (seed % 10)
      const depth = 16 + ((seed * 3) % 8)
      const height = 14 + ((seed * 7) % 26)

      placeLots.push({
        place,
        position: pos,
        rotation,
        width,
        depth,
        height,
      })
    })
  })

  return placeLots
}

function generateFillerBuildings(blocks: Block[], placeLots: PlaceLot[]): FillerBuilding[] {
  const fillers: FillerBuilding[] = []
  let fillerId = 0

  const placedPositions = new Set(
    placeLots.map(p => `${Math.round(p.position.x / 10)},${Math.round(p.position.z / 10)}`)
  )

  blocks.forEach(block => {
    const midAngle = (block.startAngle + block.endAngle) / 2
    const angleSpan = block.endAngle - block.startAngle

    // Add 2-4 filler buildings per block
    const numFillers = 2 + (fillerId % 3)

    for (let i = 0; i < numFillers; i++) {
      const angleOffset = (i / numFillers - 0.5) * angleSpan * 0.6
      const angle = midAngle + angleOffset
      const radiusOffset = ((i % 2) - 0.5) * 20
      const radius = (block.innerRadius + block.outerRadius) / 2 + radiusOffset

      const pos = angleToPosition(angle, radius)
      const key = `${Math.round(pos.x / 10)},${Math.round(pos.z / 10)}`

      if (placedPositions.has(key)) continue
      placedPositions.add(key)

      const seed = fillerId * 17
      fillers.push({
        id: `filler-${fillerId++}`,
        position: pos,
        rotation: degToRad(angle) + Math.PI / 2,
        width: 8 + (seed % 8),
        depth: 8 + ((seed * 3) % 6),
        height: 8 + ((seed * 7) % 20),
        color: '#1a1a2e',
      })
    }
  })

  return fillers
}

function generateStreetlights(roads: RoadSegment[]): Streetlight[] {
  const lights: Streetlight[] = []
  let lightId = 0

  roads.forEach(road => {
    const spacing = 25 // meters between lights
    const centerline = road.centerline
    let accumulated = 0

    for (let i = 1; i < centerline.length; i++) {
      const prev = centerline[i - 1]
      const curr = centerline[i]
      const dx = curr.x - prev.x
      const dz = curr.z - prev.z
      const segmentLength = Math.sqrt(dx * dx + dz * dz)
      accumulated += segmentLength

      if (accumulated >= spacing) {
        accumulated = 0
        const angle = Math.atan2(dx, -dz)

        // Lights on both sides of road
        const offset = road.width / 2 + 1
        lights.push({
          id: `light-${lightId++}`,
          position: {
            x: curr.x + Math.cos(angle + Math.PI / 2) * offset,
            z: curr.z - Math.sin(angle + Math.PI / 2) * offset,
          },
          rotation: angle,
        })
        lights.push({
          id: `light-${lightId++}`,
          position: {
            x: curr.x + Math.cos(angle - Math.PI / 2) * offset,
            z: curr.z - Math.sin(angle - Math.PI / 2) * offset,
          },
          rotation: angle + Math.PI,
        })
      }
    }
  })

  return lights
}

function generateTrees(blocks: Block[], placeLots: PlaceLot[]): Tree[] {
  const trees: Tree[] = []
  let treeId = 0

  const placedPositions = new Set(
    placeLots.map(p => `${Math.round(p.position.x / 5)},${Math.round(p.position.z / 5)}`)
  )

  blocks.forEach(block => {
    // Add 1-3 trees per block near the edges
    const numTrees = 1 + (treeId % 3)
    const midAngle = (block.startAngle + block.endAngle) / 2

    for (let i = 0; i < numTrees; i++) {
      const angleOffset = ((i / numTrees) - 0.5) * (block.endAngle - block.startAngle) * 0.4
      const angle = midAngle + angleOffset
      const radius = block.innerRadius + 5 + (i % 2) * 10

      const pos = angleToPosition(angle, radius)
      const key = `${Math.round(pos.x / 5)},${Math.round(pos.z / 5)}`

      if (placedPositions.has(key)) continue

      trees.push({
        id: `tree-${treeId++}`,
        position: pos,
        scale: 0.8 + Math.random() * 0.4,
      })
    }
  })

  return trees
}

function generateDistrictSigns(): DistrictSign[] {
  const signs: DistrictSign[] = []

  Object.entries(DISTRICT_INFO).forEach(([district, info]) => {
    const pos = angleToPosition(info.centerAngle, 175) // Between middle and outer ring
    signs.push({
      district: district as District,
      position: { x: pos.x, y: 60, z: pos.z },
      rotation: degToRad(info.centerAngle),
      label: info.label,
      color: info.color,
    })
  })

  return signs
}

export function generateCity(): CityData {
  const roads: RoadSegment[] = []

  // Generate ring roads
  RING_RADII.forEach((radius, idx) => {
    roads.push(generateRingRoad(idx, radius))
  })

  // Generate avenues
  for (let i = 0; i < NUM_AVENUES; i++) {
    roads.push(generateAvenue(i))
  }

  const blocks = generateBlocks()
  const placeLots = assignPlacesToLots(blocks)
  const fillerBuildings = generateFillerBuildings(blocks, placeLots)
  const streetlights = generateStreetlights(roads)
  const trees = generateTrees(blocks, placeLots)
  const districtSigns = generateDistrictSigns()

  return {
    roads,
    blocks,
    placeLots,
    fillerBuildings,
    trees,
    streetlights,
    districtSigns,
    plazaCenter: { x: 0, z: 0 },
  }
}

// Utility to get district at a world position
export function getDistrictAtPosition(x: number, z: number): District | null {
  const distance = Math.sqrt(x * x + z * z)
  if (distance < PLAZA_RADIUS) return null // In plaza

  // Calculate angle (0° is north/-z, clockwise positive)
  let angle = Math.atan2(x, -z) * (180 / Math.PI)
  if (angle < 0) angle += 360

  return getDistrictForAngle(angle)
}
