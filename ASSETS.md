# Third-Party Assets

This document lists third-party assets used in this project along with their sources and licenses.

**Total assets size: 14.05 MB** (target: <25 MB)

## 3D Models

### Quaternius Ultimate Nature Pack

- **Source**: [Quaternius Ultimate Nature Pack](https://quaternius.com/packs/ultimatenature.html)
- **License**: CC0 1.0 Universal (Public Domain Dedication)
- **Location**: `public/assets/models/nature/`
- **Size**: 0.12 MB

| File | Size | Description | Model Height |
|------|------|-------------|--------------|
| tree-common-01.glb | ~41 KB | Common deciduous tree | ~8.7m |
| tree-common-02.glb | ~25 KB | Common deciduous tree variant | ~9.7m |
| tree-birch-01.glb | ~29 KB | Birch tree | ~9.6m |
| bush-01.glb | 7.46 KB | Green bush | ~1.2m |
| bush-02.glb | 6.04 KB | Green bush variant | ~1.2m |
| grass-01.glb | 4.88 KB | Grass tuft | ~1.0m |
| grass-short-01.glb | 4.88 KB | Short grass tuft | ~0.5m |
| rock-01.glb | 3.16 KB | Small rock | ~0.8m |
| rock-02.glb | 3.35 KB | Small rock variant | ~0.8m |
| rock-03.glb | 3.26 KB | Small rock variant | ~0.6m |

**Processing**: Models converted from FBX to GLB using fbx2gltf, trees scaled to 6-10m range, then optimized with @gltf-transform/cli using meshopt compression.

### Kenney Asset Packs

All Kenney assets are licensed under CC0 1.0 Universal (Public Domain Dedication).

#### Kenney Cars
- **Source**: [Kenney Car Kit](https://kenney.nl/assets/car-kit)
- **License**: CC0 1.0 Universal
- **Location**: `public/assets/models/kenney-cars/`
- **Size**: 5.38 MB
- **Contents**: 51 GLB files (vehicles, debris, wheels) + colormap texture

#### Kenney Roads
- **Source**: [Kenney Road Pack](https://kenney.nl/assets/road-textures)
- **License**: CC0 1.0 Universal
- **Location**: `public/assets/models/kenney-roads/`
- **Size**: 1.51 MB
- **Contents**: Road tiles, street furniture, construction items + colormap texture

#### Kenney Commercial Buildings
- **Source**: [Kenney City Kit Commercial](https://kenney.nl/assets/city-kit-commercial)
- **License**: CC0 1.0 Universal
- **Location**: `public/assets/models/kenney-commercial/`
- **Size**: 3.58 MB
- **Contents**: 42 GLB files (buildings, skyscrapers, details) + colormap texture

## Textures (PBR)

All textures are 1K resolution, converted to WebP format.

### Asphalt
- **Source**: [Poly Haven - Asphalt 01](https://polyhaven.com/a/asphalt_01)
- **License**: CC0 1.0 Universal
- **Location**: `public/assets/textures/asphalt/`
- **Size**: 572 KB
- **Files**: color.webp, normal.webp, roughness.webp

### Sidewalk (Concrete Pavement)
- **Source**: [Poly Haven - Concrete Pavement](https://polyhaven.com/a/concrete_pavement)
- **License**: CC0 1.0 Universal
- **Location**: `public/assets/textures/sidewalk/`
- **Size**: 708 KB
- **Files**: color.webp, normal.webp, roughness.webp

### Grass
- **Source**: [Poly Haven - Grass Ground](https://polyhaven.com/a/grass_ground)
- **License**: CC0 1.0 Universal
- **Location**: `public/assets/textures/grass/`
- **Size**: 685 KB
- **Files**: color.webp, normal.webp, roughness.webp

### Building Facade
- **Source**: [ambientCG - Facade001](https://ambientcg.com/a/Facade001)
- **License**: CC0 1.0 Universal
- **Location**: `public/assets/textures/facade-01/`
- **Size**: 58 KB
- **Files**: color.webp, normal.webp, roughness.webp

## HDRI

### City Day Environment
- **Source**: [Poly Haven - Blue Lagoon](https://polyhaven.com/a/blue_lagoon)
- **License**: CC0 1.0 Universal
- **Location**: `public/assets/hdri/`
- **Size**: 1.49 MB
- **File**: city-day-1k.hdr

## Reference Images

### docs/reference/
- [ ] `gta-day.png` - GTA V daytime visual reference (user to provide)
