import * as THREE from 'three';
import { World } from './World';
import { Player } from './Player';
import { BlockType } from './types';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: World;
  private player: Player;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private selectedBlockType: BlockType = BlockType.GRASS;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    this.scene.add(directionalLight);

    this.world = new World(this.scene);
    this.player = new Player(this.camera);
    this.player.setupControls(canvas);

    this.clock = new THREE.Clock();

    this.setupMouseControls(canvas);
    this.setupResize();
  }

  private setupMouseControls(canvas: HTMLCanvasElement): void {
    let lastTouchX = 0;
    let lastTouchY = 0;

    canvas.addEventListener('mousedown', (event) => {
      const direction = this.player.getViewDirection();
      const hit = this.world.raycast(this.camera.position, direction);

      if (hit) {
        if (event.button === 0) {
          this.world.setBlock(hit.position.x, hit.position.y, hit.position.z, BlockType.AIR);
        } else if (event.button === 2) {
          const placePos = hit.position.clone().add(hit.normal);
          this.world.setBlock(placePos.x, placePos.y, placePos.z, this.selectedBlockType);
        }
      }
    });

    canvas.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        lastTouchX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        lastTouchY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      }
    });

    canvas.addEventListener('touchend', (event) => {
      if (event.touches.length === 1) {
        const direction = this.player.getViewDirection();
        const hit = this.world.raycast(this.camera.position, direction);

        if (hit) {
          const touchX = event.touches[0].clientX;
          if (touchX < window.innerWidth / 2) {
            this.world.setBlock(hit.position.x, hit.position.y, hit.position.z, BlockType.AIR);
          } else {
            const placePos = hit.position.clone().add(hit.normal);
            this.world.setBlock(placePos.x, placePos.y, placePos.z, this.selectedBlockType);
          }
        }
      }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const blockTypes = [
        BlockType.GRASS,
        BlockType.DIRT,
        BlockType.STONE,
        BlockType.WOOD,
        BlockType.LEAVES,
        BlockType.SAND,
      ];

      const currentIndex = blockTypes.indexOf(this.selectedBlockType);
      let newIndex = currentIndex + (event.deltaY > 0 ? 1 : -1);
      if (newIndex < 0) newIndex = blockTypes.length - 1;
      if (newIndex >= blockTypes.length) newIndex = 0;

      this.selectedBlockType = blockTypes[newIndex];
      this.onBlockSelect?.(this.selectedBlockType);
    });
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.player.update(delta, (x, y, z) => this.world.getBlock(x, y, z));

    this.renderer.render(this.scene, this.camera);
  };

  start(): void {
    this.animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose(): void {
    this.stop();
    this.renderer.dispose();
  }

  onBlockSelect?: (blockType: BlockType) => void;

  getSelectedBlock(): BlockType {
    return this.selectedBlockType;
  }

  setSelectedBlock(blockType: BlockType): void {
    this.selectedBlockType = blockType;
    this.onBlockSelect?.(this.selectedBlockType);
  }
}
