import * as THREE from 'three';
import { BlockType, CHUNK_SIZE, WORLD_HEIGHT } from './types';
import { blockMaterials } from './blocks';
import { SimplexNoise } from './noise';

export class World {
  private blocks: Map<string, BlockType> = new Map();
  private meshes: Map<string, THREE.Mesh> = new Map();
  private scene: THREE.Scene;
  private noise: SimplexNoise;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.noise = new SimplexNoise();
    this.generateTerrain();
  }

  private getBlockKey(x: number, y: number, z: number): string {
    return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  getBlock(x: number, y: number, z: number): BlockType {
    const key = this.getBlockKey(x, y, z);
    return this.blocks.get(key) || BlockType.AIR;
  }

  setBlock(x: number, y: number, z: number, type: BlockType): void {
    const key = this.getBlockKey(x, y, z);

    if (type === BlockType.AIR) {
      this.blocks.delete(key);
    } else {
      this.blocks.set(key, type);
    }

    this.updateChunkMesh(Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE));
  }

  private generateTerrain(): void {
    const size = CHUNK_SIZE * 4;

    for (let x = -size; x < size; x++) {
      for (let z = -size; z < size; z++) {
        const height = this.getTerrainHeight(x, z);

        for (let y = 0; y < height; y++) {
          let blockType: BlockType;

          if (y < 2) {
            blockType = BlockType.STONE;
          } else if (y < height - 1) {
            blockType = BlockType.DIRT;
          } else {
            if (height < 8) {
              blockType = BlockType.SAND;
            } else {
              blockType = BlockType.GRASS;
            }
          }

          this.blocks.set(this.getBlockKey(x, y, z), blockType);
        }

        if (height < 7) {
          for (let y = height; y < 7; y++) {
            this.blocks.set(this.getBlockKey(x, y, z), BlockType.WATER);
          }
        }

        if (height > 8 && Math.random() < 0.02) {
          this.generateTree(x, height, z);
        }
      }
    }

    const size2 = Math.floor(size / CHUNK_SIZE);
    for (let cx = -size2; cx < size2; cx++) {
      for (let cz = -size2; cz < size2; cz++) {
        this.updateChunkMesh(cx, cz);
      }
    }
  }

  private getTerrainHeight(x: number, z: number): number {
    const scale1 = 0.02;
    const scale2 = 0.05;

    const noise1 = this.noise.noise2D(x * scale1, z * scale1);
    const noise2 = this.noise.noise2D(x * scale2, z * scale2);

    const combined = noise1 * 0.7 + noise2 * 0.3;
    return Math.floor(8 + combined * 6);
  }

  private generateTree(x: number, y: number, z: number): void {
    const trunkHeight = 4 + Math.floor(Math.random() * 2);

    for (let dy = 0; dy < trunkHeight; dy++) {
      this.blocks.set(this.getBlockKey(x, y + dy, z), BlockType.WOOD);
    }

    const leafY = y + trunkHeight;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = -2; dy <= 1; dy++) {
          if (dx === 0 && dz === 0 && dy <= 0) continue;

          const distance = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
          if (distance <= 3 && Math.random() > 0.2) {
            this.blocks.set(
              this.getBlockKey(x + dx, leafY + dy, z + dz),
              BlockType.LEAVES
            );
          }
        }
      }
    }
  }

  private updateChunkMesh(chunkX: number, chunkZ: number): void {
    const key = `${chunkX},${chunkZ}`;

    const existingMesh = this.meshes.get(key);
    if (existingMesh) {
      this.scene.remove(existingMesh);
      existingMesh.geometry.dispose();
      this.meshes.delete(key);
    }

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];

    const startX = chunkX * CHUNK_SIZE;
    const startZ = chunkZ * CHUNK_SIZE;

    for (let x = startX; x < startX + CHUNK_SIZE; x++) {
      for (let z = startZ; z < startZ + CHUNK_SIZE; z++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          const blockType = this.getBlock(x, y, z);
          if (blockType === BlockType.AIR) continue;

          const materials = blockMaterials[blockType];
          if (!materials) continue;

          this.addBlockFaces(x, y, z, blockType, positions, normals, uvs, colors);
        }
      }
    }

    if (positions.length === 0) return;

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);

    this.scene.add(mesh);
    this.meshes.set(key, mesh);
  }

  private addBlockFaces(
    x: number, y: number, z: number,
    blockType: BlockType,
    positions: number[],
    normals: number[],
    uvs: number[],
    colors: number[]
  ): void {
    const materials = blockMaterials[blockType];
    if (!materials) return;

    const faces = [
      { dir: [0, 1, 0], corners: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], mat: materials.top || materials.side },
      { dir: [0, -1, 0], corners: [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]], mat: materials.bottom || materials.side },
      { dir: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], mat: materials.side },
      { dir: [-1, 0, 0], corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], mat: materials.side },
      { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], mat: materials.side },
      { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], mat: materials.side },
    ];

    for (const face of faces) {
      const [dx, dy, dz] = face.dir;
      const neighbor = this.getBlock(x + dx, y + dy, z + dz);

      if (neighbor !== BlockType.AIR && !(neighbor === BlockType.WATER && blockType !== BlockType.WATER)) {
        continue;
      }

      const color = new THREE.Color(face.mat.color);

      const ndx = positions.length / 3;
      for (const corner of face.corners) {
        positions.push(x + corner[0], y + corner[1], z + corner[2]);
        normals.push(...face.dir);
        uvs.push(corner[0], corner[1]);
        colors.push(color.r, color.g, color.b);
      }

      const indices = [0, 1, 2, 0, 2, 3];
      for (let i = 0; i < 6; i += 3) {
        positions.push(
          positions[(ndx + indices[i]) * 3],
          positions[(ndx + indices[i]) * 3 + 1],
          positions[(ndx + indices[i]) * 3 + 2],
          positions[(ndx + indices[i + 1]) * 3],
          positions[(ndx + indices[i + 1]) * 3 + 1],
          positions[(ndx + indices[i + 1]) * 3 + 2],
          positions[(ndx + indices[i + 2]) * 3],
          positions[(ndx + indices[i + 2]) * 3 + 1],
          positions[(ndx + indices[i + 2]) * 3 + 2]
        );
        normals.push(...face.dir, ...face.dir, ...face.dir);
        uvs.push(0, 0, 1, 0, 1, 1);
        colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
      }

      positions.splice(ndx * 3, 12);
      normals.splice(ndx * 3, 12);
      uvs.splice(ndx * 2, 8);
      colors.splice(ndx * 3, 12);
    }
  }

  raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number = 10): { position: THREE.Vector3; normal: THREE.Vector3; block: BlockType } | null {
    const step = 0.1;
    const pos = origin.clone();
    const dir = direction.clone().normalize().multiplyScalar(step);

    for (let i = 0; i < maxDistance / step; i++) {
      pos.add(dir);

      const blockType = this.getBlock(pos.x, pos.y, pos.z);
      if (blockType !== BlockType.AIR) {
        const blockPos = new THREE.Vector3(
          Math.floor(pos.x),
          Math.floor(pos.y),
          Math.floor(pos.z)
        );

        pos.sub(dir);
        const prevPos = new THREE.Vector3(
          Math.floor(pos.x),
          Math.floor(pos.y),
          Math.floor(pos.z)
        );

        const normal = blockPos.clone().sub(prevPos);

        return {
          position: blockPos,
          normal,
          block: blockType
        };
      }
    }

    return null;
  }
}
