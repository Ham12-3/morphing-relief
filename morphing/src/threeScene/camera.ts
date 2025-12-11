import { PerspectiveCamera } from "three/webgpu";

export function createIsometricCamera(
  width: number,
  height: number
): PerspectiveCamera {
  const isometricAngle = Math.PI / 6;
  const cameraDistance = 12;

  const cameraHeight = cameraDistance * Math.sin(isometricAngle);
  const cameraDistanceXY = cameraDistance * Math.cos(isometricAngle);

  const camera = new PerspectiveCamera(50, width / height, 0.1, 10000);
  camera.position.set(cameraDistanceXY, cameraHeight, cameraDistanceXY);
  camera.lookAt(0, 0, 0);

  return camera;
}
