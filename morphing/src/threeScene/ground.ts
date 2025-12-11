import {
  Scene,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  Color,
} from "three/webgpu";
import { GROUND_WIDTH, GROUND_HEIGHT, GROUND_Y } from "./constants";

export function createGround(scene: Scene, appBg: string): Mesh {
  const groundGeometry = new PlaneGeometry(GROUND_WIDTH, GROUND_HEIGHT, 1, 1);

  const groundMaterial = new MeshBasicMaterial({
    color: new Color(appBg),
  });

  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  ground.receiveShadow = false;
  scene.add(ground);

  return ground;
}
