export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  SAND = 6,
  WATER = 7,
}

export interface BlockData {
  x: number;
  y: number;
  z: number;
  type: BlockType;
}

export interface WorldData {
  blocks: Map<string, BlockType>;
}

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 32;
export const RENDER_DISTANCE = 4;
