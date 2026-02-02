import { useEffect, useRef, useState } from 'react';
import { Game } from '../game/Game';
import { BlockType } from '../game/types';
import { blockNames } from '../game/blocks';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockType>(BlockType.GRASS);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new Game(canvasRef.current);
    game.onBlockSelect = setSelectedBlock;
    gameRef.current = game;
    game.start();

    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg pointer-events-none text-sm">
        <span className="font-medium">Block: {blockNames[selectedBlock]}</span>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-8 h-8">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/80"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/80"></div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white px-4 py-3 rounded-lg text-xs space-y-1 pointer-events-none max-w-xs">
        <p className="font-bold mb-2">Controls:</p>
        <p>Touch Left: Move Forward</p>
        <p>Touch Right: Break/Place</p>
        <p>Swipe: Look Around</p>
        <p>Tap Block Selector: Change Block</p>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => {
            const blockTypes = [BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.WOOD, BlockType.LEAVES, BlockType.SAND];
            const idx = blockTypes.indexOf(selectedBlock);
            const newIdx = (idx + 1) % blockTypes.length;
            gameRef.current?.setSelectedBlock(blockTypes[newIdx]);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded pointer-events-auto"
        >
          Next Block
        </button>
      </div>
    </div>
  );
}
