import * as THREE from 'three';

export class Player {
  camera: THREE.PerspectiveCamera;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private canJump = false;
  private readonly speed = 5;
  private readonly jumpSpeed = 8;
  private readonly gravity = 20;

  private yaw = 0;
  private pitch = 0;
  private readonly sensitivity = 0.002;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.position.set(0, 20, 0);
  }

  setupControls(canvas: HTMLCanvasElement): void {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'Space':
          if (this.canJump) {
            this.velocity.y = this.jumpSpeed;
            this.canJump = false;
          }
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      this.yaw -= event.movementX * this.sensitivity;
      this.pitch -= event.movementY * this.sensitivity;
      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;

        this.yaw -= deltaX * this.sensitivity * 0.5;
        this.pitch -= deltaY * this.sensitivity * 0.5;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

        touchStartX = touchX;
        touchStartY = touchY;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  }

  setMoveForward(value: boolean): void {
    this.moveForward = value;
  }

  setJump(): void {
    if (this.canJump) {
      this.velocity.y = this.jumpSpeed;
      this.canJump = false;
    }
  }

  update(delta: number, getBlockAt: (x: number, y: number, z: number) => number): void {
    this.velocity.y -= this.gravity * delta;

    const forward = new THREE.Vector3(
      Math.sin(this.yaw),
      0,
      Math.cos(this.yaw)
    );
    const right = new THREE.Vector3(
      Math.sin(this.yaw + Math.PI / 2),
      0,
      Math.cos(this.yaw + Math.PI / 2)
    );

    const moveDirection = new THREE.Vector3();
    if (this.moveForward) moveDirection.add(forward);
    if (this.moveBackward) moveDirection.sub(forward);
    if (this.moveLeft) moveDirection.sub(right);
    if (this.moveRight) moveDirection.add(right);

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      this.camera.position.x += moveDirection.x * this.speed * delta;
      this.camera.position.z += moveDirection.z * this.speed * delta;
    }

    this.camera.position.y += this.velocity.y * delta;

    const groundY = this.getGroundHeight(getBlockAt);
    if (this.camera.position.y <= groundY + 1.6) {
      this.camera.position.y = groundY + 1.6;
      this.velocity.y = 0;
      this.canJump = true;
    }

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  private getGroundHeight(getBlockAt: (x: number, y: number, z: number) => number): number {
    const px = this.camera.position.x;
    const pz = this.camera.position.z;

    for (let y = Math.floor(this.camera.position.y); y >= 0; y--) {
      if (getBlockAt(px, y, pz) !== 0) {
        return y + 1;
      }
    }
    return 0;
  }

  getViewDirection(): THREE.Vector3 {
    return new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      -Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
  }
}
