import type { Sketch, SketchSettings } from "ssam";
import { ssam } from "ssam";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Box3, Vector3 } from "three";
import {
  Color,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGPURenderer,
} from "three/webgpu";

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

  const renderer = new WebGPURenderer({ canvas, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(new Color(0xffffff), 1);
  await renderer.init();

  const camera = new PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(1, 2, 3);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);

  const stats = new Stats();
  document.body.appendChild(stats.dom);

  const scene = new Scene();

  // Setup Draco Loader (for compressed GLB files if needed)
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
  );

  // Setup GLTF Loader
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  // Load the boulder GLB model
  let boulderModel: any = null;

  try {
    const gltf = await loader.loadAsync("./assets/models/namaqualand_boulder_02_4k.glb");
    boulderModel = gltf.scene;

    // Traverse through all objects in the loaded model
    boulderModel.traverse((child: any) => {
      if (child instanceof Mesh) {
        // Enable shadows if needed
        child.castShadow = true;
        child.receiveShadow = true;
        console.log("Loaded boulder mesh:", child);
      }
    });

    // Calculate bounding box to center and scale the model appropriately
    const box = new Box3().setFromObject(boulderModel);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    
    // Center the model
    boulderModel.position.sub(center);
    
    // Scale to fit nicely in view (adjust as needed)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim; // Scale to fit in a 2-unit space
    boulderModel.scale.set(scale, scale, scale);

    // Add the model to the scene
    scene.add(boulderModel);
    
    // Adjust camera to better view the boulder
    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0, 0);
    
    console.log("Boulder model loaded successfully!");
  } catch (error) {
    console.error("Error loading GLB boulder model:", error);
    // You could add a fallback simple geometry here if model fails to load
  }

  wrap.render = ({ playhead }) => {
    // Animate the boulder model if it loaded successfully
    if (boulderModel) {
      // Slow rotation for nice viewing
      boulderModel.rotation.y = playhead * Math.PI * 2 * 0.25; // Quarter speed rotation
      
      // Optional: Add slight bobbing/breathing effect
      // boulderModel.position.y = Math.sin(playhead * Math.PI * 4) * 0.1;
    }

    controls.update();
    stats.update();
    renderer.render(scene, camera);
  };

  wrap.resize = ({ width, height }) => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  wrap.unload = () => {
    // Cleanup the loaded model
    if (boulderModel) {
      scene.remove(boulderModel);
      boulderModel.traverse((child: any) => {
        if (child instanceof Mesh) {
          child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: any) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
    renderer.dispose();
    dracoLoader.dispose();
  };
};

const settings: SketchSettings = {
  mode: "webgpu",
  // dimensions: [800, 800],
  pixelRatio: window.devicePixelRatio,
  animate: true,
  duration: 6_000,
  playFps: 60,
  exportFps: 60,
  framesFormat: ["webm"],
};

ssam(sketch, settings);
