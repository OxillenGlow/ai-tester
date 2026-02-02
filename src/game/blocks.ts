import * as THREE from 'three';
import { BlockType } from './types';

export interface BlockMaterial {
  top?: THREE.MeshLambertMaterial;
  bottom?: THREE.MeshLambertMaterial;
  side: THREE.MeshLambertMaterial;
}

const createMaterial = (color: number): THREE.MeshLambertMaterial => {
  return new THREE.MeshLambertMaterial({ color });
};

export const blockMaterials: Record<BlockType, BlockMaterial | null> = {
  [BlockType.AIR]: null,
  [BlockType.GRASS]: {
    top: createMaterial(0x5a8c3f),
    bottom: createMaterial(0x8b6f47),
    side: createMaterial(0x6b7f3f),
  },
  [BlockType.DIRT]: {
    side: createMaterial(0x8b6f47),
  },
  [BlockType.STONE]: {
    side: createMaterial(0x888888),
  },
  [BlockType.WOOD]: {
    top: createMaterial(0x6d4c30),
    bottom: createMaterial(0x6d4c30),
    side: createMaterial(0x8b6f47),
  },
  [BlockType.LEAVES]: {
    side: createMaterial(0x2d5016),
  },
  [BlockType.SAND]: {
    side: createMaterial(0xe0c896),
  },
  [BlockType.WATER]: {
    side: new THREE.MeshLambertMaterial({
      color: 0x4a90e2,
      transparent: true,
      opacity: 0.7
    }),
  },
};

export const blockNames: Record<BlockType, string> = {
  [BlockType.AIR]: 'Air',
  [BlockType.GRASS]: 'Grass',
  [BlockType.DIRT]: 'Dirt',
  [BlockType.STONE]: 'Stone',
  [BlockType.WOOD]: 'Wood',
  [BlockType.LEAVES]: 'Leaves',
  [BlockType.SAND]: 'Sand',
  [BlockType.WATER]: 'Water',
};
