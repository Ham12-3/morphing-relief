// mapModel.ts
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Box3, Vector3 } from "three";
import { Scene, PerspectiveCamera, Group } from "three/webgpu";
import { createMapPin } from "./mapPin";

export type MapLoadParams = {
  loader: GLTFLoader;
  scene: Scene;
  camera: PerspectiveCamera;
  groundY: number;
  groundWidth: number;
  groundHeight: number;
};

export type MapLoadResult = {
  mapModel: any;
  pin: Group;
};

export async function loadMapModel({
  loader,
  scene,
  camera,
  groundY,
  groundWidth,
  groundHeight,
}: MapLoadParams): Promise<MapLoadResult> {
  const gltf = await loader.loadAsync("./assets/models/map.glb");
  const mapModel = gltf.scene;

  if (gltf.animations && gltf.animations.length > 0) {
    console.log("Found animations in GLB:", gltf.animations.length);
  }

  mapModel.rotation.set(0, 0, 0);
  mapModel.traverse((child: any) => {
    if (child.rotation) {
      child.rotation.set(0, 0, 0);
    }
  });

  const box = new Box3().setFromObject(mapModel);
  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());

  mapModel.position.sub(center);
  mapModel.position.y = groundY + size.y / 2 + 0.1;

  const targetSize = Math.min(groundWidth, groundHeight) * 0.8;
  const stretchX = 1.25;
  const stretchZ = 0.9;

  let scaleX = (targetSize * stretchX) / size.x;
  let scaleZ = (targetSize * stretchZ) / size.z;

  const heightMultiplier = 2.5;
  let scaleY = ((scaleX + scaleZ) / 2) * heightMultiplier;

  mapModel.scale.set(scaleX, scaleY, scaleZ);

  const scaledBox = new Box3().setFromObject(mapModel);
  const scaledSize = scaledBox.getSize(new Vector3());
  mapModel.position.y = groundY + scaledSize.y / 2 + 0.1;

  const verticalFovRad = (camera.fov * Math.PI) / 180;
  const horizontalFovRad =
    2 * Math.atan(Math.tan(verticalFovRad / 2) * camera.aspect);

  const distanceToModel = camera.position.length();
  const fullViewWidth =
    2 * distanceToModel * Math.tan(horizontalFovRad / 2);
  const targetModelWidth = fullViewWidth * 0.8;

  const currentModelWidth = scaledSize.x;
  const widthScale = targetModelWidth / currentModelWidth;
  mapModel.scale.multiplyScalar(widthScale);

  const finalBox = new Box3().setFromObject(mapModel);
  const finalSize = finalBox.getSize(new Vector3());
  mapModel.position.y = groundY + finalSize.y / 2 + 0.1;

  scene.add(mapModel);

  const pin = createMapPin();

  // your tuned position
  pin.position.set(
    0,
    finalSize.y / 2 - 1.5,
    0
  );

  mapModel.add(pin);

  const topViewAspectRatio = finalSize.x / finalSize.z;
  const isSquare =
    Math.abs(topViewAspectRatio - 1.0) < 0.1;
  const shapeDescription = isSquare
    ? "SQUARE"
    : topViewAspectRatio > 1
    ? "RECTANGULAR (wider)"
    : "RECTANGULAR (deeper)";

  console.log("=== MODEL SHAPE ANALYSIS (TOP VIEW) ===");
  console.log("Original model size:", {
    width: size.x.toFixed(2),
    height: size.y.toFixed(2),
    depth: size.z.toFixed(2),
    originalAspectRatio: (size.x / size.z).toFixed(2),
  });
  console.log("Applied scaling factors:", {
    scaleX: scaleX.toFixed(3),
    scaleY: scaleY.toFixed(3),
    scaleZ: scaleZ.toFixed(3),
    widthScale: widthScale.toFixed(3),
  });
  console.log("Final model dimensions (after viewport scaling):", {
    width: finalSize.x.toFixed(2),
    height: finalSize.y.toFixed(2),
    depth: finalSize.z.toFixed(2),
    topViewAspectRatio: topViewAspectRatio.toFixed(2),
    viewWidth: fullViewWidth.toFixed(2),
    targetWidth: targetModelWidth.toFixed(2),
  });
  console.log("Top view shape:", shapeDescription);
  console.log("Ground dimensions:", {
    width: groundWidth,
    height: groundHeight,
    groundAspectRatio: (groundWidth / groundHeight).toFixed(2),
  });
  console.log("========================================");

 
  return { mapModel, pin };
}
