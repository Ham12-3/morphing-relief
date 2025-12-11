import type { Sketch, SketchSettings } from "ssam";
import { ssam } from "ssam";
import { Mesh, Group } from "three/webgpu";
import { Raycaster, Vector2, Vector3 } from "three";

import {
  maxPixelRatio,
  GROUND_WIDTH,
  GROUND_HEIGHT,
  rotationSpeed,
} from "./constants";
import { getAppBgColour } from "./theme";
import { createRenderer, setRendererBackground } from "./renderer";
import { createIsometricCamera } from "./camera";
import { createSceneWithLights } from "./scene";
import { createGround } from "./ground";
import { createClouds } from "./clouds";
import { createLoaders } from "./loaders";
import { setupControls } from "./controls";
import { loadMapModel } from "./mapModel";
import { disposeMesh } from "./dispose";

const sketch: Sketch<"webgpu"> = async ({
  wrap,
  canvas,
  width,
  height,
  pixelRatio,
}) => {
  if (import.meta.hot) {
    import.meta.hot.dispose(() => wrap.dispose());
    import.meta.hot.accept(() => wrap.hotReload());
  }

  const appBg = getAppBgColour();
  const renderer = createRenderer(canvas, width, height, pixelRatio);
  setRendererBackground(renderer, appBg);
  await renderer.init();

  const camera = createIsometricCamera(width, height);
  const scene = createSceneWithLights(appBg);
  const ground = createGround(scene, appBg);

  const { clouds, cloudGroups } = createClouds(scene);
  const { dracoLoader, loader } = createLoaders();

  let mapModel: any = null;
  let pin: Group | null = null;
  let pinObject: Group | null = null;

  const { keys, cleanupControls } = setupControls(canvas, () => mapModel);

  // raycasting
  const raycaster = new Raycaster();
  const mouse = new Vector2();

  // camera animation state
  let cameraAnimating = false;
  let cameraAnimProgress = 0;
  let cameraZoomedToPin = false;

  // original camera view
  const defaultCameraPos = camera.position.clone();
  const defaultLookAt = new Vector3(0, 0, 0);

  const cameraStartPos = new Vector3();
  const cameraTargetPos = new Vector3();
  const cameraStartLookAt = new Vector3();
  const cameraTargetLookAt = new Vector3();
  const tempLookAt = new Vector3();

  function startCameraZoomToPin() {
    if (!pinObject) return;

    const pinWorldPos = new Vector3();
    pinObject.getWorldPosition(pinWorldPos);

    // start from current camera state
    cameraStartPos.copy(camera.position);
    cameraStartLookAt.copy(defaultLookAt);

    // target is around the pin
    cameraTargetLookAt.copy(pinWorldPos);
    cameraTargetPos.copy(pinWorldPos).add(new Vector3(0, 2.5, 3));

    cameraAnimProgress = 0;
    cameraAnimating = true;
    cameraZoomedToPin = true;
  }

  function startCameraZoomToDefault() {
    const pinWorldPos = new Vector3();
    if (pinObject) {
      pinObject.getWorldPosition(pinWorldPos);
    } else {
      pinWorldPos.copy(defaultLookAt);
    }

    cameraStartPos.copy(camera.position);
    cameraStartLookAt.copy(pinWorldPos);

    cameraTargetPos.copy(defaultCameraPos);
    cameraTargetLookAt.copy(defaultLookAt);

    cameraAnimProgress = 0;
    cameraAnimating = true;
    cameraZoomedToPin = false;
  }

  function handleCanvasClick(event: MouseEvent) {
    if (!pinObject) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(pinObject, true);

    if (intersects.length > 0) {
      // toggle between zoom in and zoom out
      if (!cameraZoomedToPin) {
        startCameraZoomToPin();
      } else {
        startCameraZoomToDefault();
      }
    }
  }

  try {
    const result = await loadMapModel({
      loader,
      scene,
      camera,
      groundY: ground.position.y,
      groundWidth: GROUND_WIDTH,
      groundHeight: GROUND_HEIGHT,
    });

    mapModel = result.mapModel;
    pin = result.pin;
    pinObject = pin;
  } catch (error) {
    console.error("Error loading map:", error);
  }

  canvas.addEventListener("click", handleCanvasClick);

  wrap.render = ({ playhead }) => {
    // camera zoom animation
    if (cameraAnimating) {
      cameraAnimProgress += 0.05; // smaller is slower and smoother

      if (cameraAnimProgress >= 1) {
        cameraAnimProgress = 1;
        cameraAnimating = false;
      }

      const t = cameraAnimProgress;

      camera.position.lerpVectors(cameraStartPos, cameraTargetPos, t);
      tempLookAt.lerpVectors(cameraStartLookAt, cameraTargetLookAt, t);
      camera.lookAt(tempLookAt);
    }

    if (mapModel) {
      if (keys["arrowleft"] || keys["a"] || keys["keya"]) {
        mapModel.rotation.y += rotationSpeed;
      }
      if (keys["arrowright"] || keys["d"] || keys["keyd"]) {
        mapModel.rotation.y -= rotationSpeed;
      }
      if (keys["arrowup"] || keys["w"] || keys["keyw"]) {
        mapModel.rotation.x += rotationSpeed;
      }
      if (keys["arrowdown"] || keys["s"] || keys["keys"]) {
        mapModel.rotation.x -= rotationSpeed;
      }
      if (keys["q"]) {
        mapModel.rotation.z += rotationSpeed;
      }
      if (keys["e"]) {
        mapModel.rotation.z -= rotationSpeed;
      }
    }

    cloudGroups.forEach((cloud, index) => {
      cloud.position.x += Math.sin(playhead * Math.PI * 2 + index) * 0.001;
      cloud.position.z += Math.cos(playhead * Math.PI * 2 + index) * 0.001;
    });

    renderer.render(scene, camera);
  };

  wrap.resize = ({ width, height }) => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  wrap.unload = () => {
    cleanupControls();
    canvas.removeEventListener("click", handleCanvasClick);

    if (mapModel) {
      scene.remove(mapModel);
      mapModel.traverse((child: any) => {
        if (child instanceof Mesh) {
          disposeMesh(child);
        }
      });
    }

    clouds.forEach((cloud) => disposeMesh(cloud));
    disposeMesh(ground);

    renderer.dispose();
    dracoLoader.dispose();
  };
};

const settings: SketchSettings = {
  mode: "webgpu",
  pixelRatio: Math.min(window.devicePixelRatio, maxPixelRatio),
  animate: true,
  duration: 6_000,
  playFps: 60,
  exportFps: 60,
  framesFormat: ["webm"],
};

ssam(sketch, settings);
