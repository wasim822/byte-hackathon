export interface Building {
  id: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: string
  emissiveColor: string
  emissiveIntensity: number
}

export interface Block {
  id: string
  gridX: number
  gridZ: number
  buildings: Building[]
  district?: string
}

export interface CityLayout {
  gridSize: number
  blockSize: number
  roadWidth: number
  blocks: Block[]
}

const GRID_SIZE = 6
const BLOCK_SIZE = 40
const ROAD_WIDTH = 10

function generateBuildings(blockId: string, gridX: number, gridZ: number): Building[] {
  const buildings: Building[] = []
  const centerX = (gridX - (GRID_SIZE - 1) / 2) * (BLOCK_SIZE + ROAD_WIDTH)
  const centerZ = (gridZ - (GRID_SIZE - 1) / 2) * (BLOCK_SIZE + ROAD_WIDTH)

  // Random seed based on position for consistent generation
  const seed = gridX * 100 + gridZ
  const random = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000
    return x - Math.floor(x)
  }

  // Generate 1-4 buildings per block
  const numBuildings = 1 + Math.floor(random(0) * 4)

  const neonColors = [
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ff0080', // Hot pink
    '#00ff80', // Mint
    '#8000ff', // Purple
    '#ff8000', // Orange
    '#0080ff', // Blue
    '#ff0040', // Red-pink
  ]

  if (numBuildings === 1) {
    // Single large building
    const height = 15 + random(1) * 40
    const size = 25 + random(2) * 10
    const colorIndex = Math.floor(random(3) * neonColors.length)
    buildings.push({
      id: `${blockId}-0`,
      x: centerX,
      z: centerZ,
      width: size,
      depth: size,
      height,
      color: '#1a1a2e',
      emissiveColor: neonColors[colorIndex],
      emissiveIntensity: 0.5,
    })
  } else {
    // Multiple smaller buildings
    const positions = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
    ]

    for (let i = 0; i < numBuildings; i++) {
      const pos = positions[i]
      const height = 10 + random(i + 1) * 35
      const width = 8 + random(i + 10) * 8
      const depth = 8 + random(i + 20) * 8
      const colorIndex = Math.floor(random(i + 30) * neonColors.length)

      buildings.push({
        id: `${blockId}-${i}`,
        x: centerX + pos.x,
        z: centerZ + pos.z,
        width,
        depth,
        height,
        color: '#1a1a2e',
        emissiveColor: neonColors[colorIndex],
        emissiveIntensity: 0.5,
      })
    }
  }

  return buildings
}

function generateBlocks(): Block[] {
  const blocks: Block[] = []

  for (let gridX = 0; gridX < GRID_SIZE; gridX++) {
    for (let gridZ = 0; gridZ < GRID_SIZE; gridZ++) {
      const blockId = `block-${gridX}-${gridZ}`
      blocks.push({
        id: blockId,
        gridX,
        gridZ,
        buildings: generateBuildings(blockId, gridX, gridZ),
        district: 'placeholder',
      })
    }
  }

  return blocks
}

export const cityLayout: CityLayout = {
  gridSize: GRID_SIZE,
  blockSize: BLOCK_SIZE,
  roadWidth: ROAD_WIDTH,
  blocks: generateBlocks(),
}

// Helper to get total city dimensions
export const getCityBounds = () => {
  const totalSize = GRID_SIZE * BLOCK_SIZE + (GRID_SIZE - 1) * ROAD_WIDTH
  return {
    width: totalSize,
    depth: totalSize,
    halfWidth: totalSize / 2,
    halfDepth: totalSize / 2,
  }
}
