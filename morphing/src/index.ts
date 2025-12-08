import type { Sketch, SketchSettings } from "ssam";
import { ssam } from "ssam";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Box3, Vector3, MathUtils } from "three";
import {
  Color,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGPURenderer,
  PlaneGeometry,
  SphereGeometry,
  AmbientLight,
  DirectionalLight,
  MeshStandardMaterial,
  Group,
  Shape,
  ShapeGeometry,
  BoxGeometry,
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
  
  // Cloudy white background
  renderer.setClearColor(new Color(0xE8F4F8), 1); // Soft cloudy white/blue
  await renderer.init();

  // Isometric camera setup
  // Isometric = equal angles, typically 30 degrees from horizontal
  const isometricAngle = Math.PI / 6; // 30 degrees in radians
  const cameraDistance = 12;
  
  // Calculate isometric camera position
  const cameraHeight = cameraDistance * Math.sin(isometricAngle);
  const cameraDistanceXY = cameraDistance * Math.cos(isometricAngle);
  
  const camera = new PerspectiveCamera(50, width / height, 0.1, 10000);
  // Position camera at isometric angle (45 degrees around, 30 degrees up)
  camera.position.set(cameraDistanceXY, cameraHeight, cameraDistanceXY);
  camera.lookAt(0, 0, 0);

  const scene = new Scene();

  // Lighting for the scene
  const ambientLight = new AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  // Create kite/diamond-shaped ground plane
  function createKiteShape(width: number, height: number) {
    const shape = new Shape();
    const w = width / 2;
    const h = height / 2;
    
    // Make it more rectangular (wider than tall)
    shape.moveTo(0, h * 0.6);        // Top point (shorter)
    shape.lineTo(w, 0);               // Right point
    shape.lineTo(0, -h * 0.6);       // Bottom point (shorter)
    shape.lineTo(-w, 0);              // Left point
    shape.lineTo(0, h * 0.6);        // Close back to top
    
    return new ShapeGeometry(shape);
  }

  // Create rectangular ground plane (not kite)
  const groundWidth = 15;
  const groundHeight = 15;
  const groundGeometry = new PlaneGeometry(groundWidth, groundHeight, 1, 1);
  const groundMaterial = new MeshStandardMaterial({
    color: new Color(0x8B7355), // Earth/brown color
    roughness: 0.8,
    metalness: 0.1,
  });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal (flat)
  ground.position.y = -2; // Position below the map
  ground.receiveShadow = true;
  scene.add(ground);
  // Create 3D clouds
  const clouds: Mesh[] = [];
  
  function createCloud(x: number, y: number, z: number, size: number) {
    const cloudGroup = new Group(); 
    
    // Create cloud using rectangular boxes instead of spheres
    const cloudMaterial = new MeshStandardMaterial({
      color: new Color(0xffffff),
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9,
    });

    // Create rectangular cloud pieces using boxes
    const mainClouds = [
      { x: 0, y: 0, z: 0, w: size * 2, h: size * 1.2, d: size * 1.5 },
      { x: size * 1.2, y: 0, z: 0, w: size * 1.4, h: size, d: size * 1.2 },
      { x: -size * 1, y: 0, z: size * 0.6, w: size * 1.2, h: size * 0.8, d: size },
      { x: 0, y: size * 0.5, z: 0, w: size * 1.8, h: size, d: size * 1.4 },
    ];

    mainClouds.forEach((cloudPart) => {
      const cloudGeometry = new BoxGeometry(cloudPart.w, cloudPart.h, cloudPart.d);
      const cloudMesh = new Mesh(cloudGeometry, cloudMaterial);
      cloudMesh.position.set(cloudPart.x, cloudPart.y, cloudPart.z);
      cloudMesh.rotation.y = (Math.random() - 0.5) * 0.4; // Slight random rotation
      cloudGroup.add(cloudMesh);
      clouds.push(cloudMesh);
    });

    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);
    
    return cloudGroup;
  }
  // Create multiple clouds at different positions (at the top/sky level)
  const cloudPositions = [
    { x: -15, y: 8, z: -10, size: 2 },
    { x: 10, y: 10, z: -8, size: 2.5 },
    { x: -5, y: 12, z: 5, size: 2.2 },
    { x: 15, y: 9, z: 8, size: 2.3 },
    { x: 0, y: 11, z: -12, size: 2.1 },
  ];

  const cloudGroups: any[] = [];
  for (const pos of cloudPositions) {
    const cloud = createCloud(pos.x, pos.y, pos.z, pos.size); 
    cloudGroups.push(cloud);
  }

  // Setup loaders for GLB
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
  );

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  let mapModel: any = null;

  // Keyboard controls state
  const keys: { [key: string]: boolean } = {};
  const rotationSpeed = 0.02;

  function handleKeyDown(event: KeyboardEvent) {
    keys[event.key.toLowerCase()] = true;
    keys[event.code.toLowerCase()] = true;
  }

  function handleKeyUp(event: KeyboardEvent) {
    keys[event.key.toLowerCase()] = false;
    keys[event.code.toLowerCase()] = false;
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  // Load the map GLB
  try {
    const gltf = await loader.loadAsync("./assets/models/map.glb");
    mapModel = gltf.scene;

    // Stop animations if any
    if (gltf.animations && gltf.animations.length > 0) {
      console.log("Found animations in GLB:", gltf.animations.length);
    }
    // Stop animations if any
    if (gltf.animations && gltf.animations.length > 0) {
      console.log("Found animations in GLB:", gltf.animations.length);
    }

    // Reset rotations
    mapModel.rotation.set(0, 0, 0);
    mapModel.traverse((child: any) => {
      if (child.rotation) {
        child.rotation.set(0, 0, 0);
      }
    });

    // Calculate bounding box
    const box = new Box3().setFromObject(mapModel);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());

    // Center the model
    mapModel.position.sub(center);
    
    // Position map on the ground (slightly above)
    mapModel.position.y = -2 + size.y / 2 + 0.1;

        // Scale model to match rectangular ground aspect ratio
        const maxDim = Math.max(size.x, size.y, size.z);
    
        // Get ground dimensions
        const groundWidth = 15;
        const groundHeight = 15;
        const groundAspectRatio = groundWidth / groundHeight;
        
        // Calculate model's horizontal aspect ratio (X to Z)
        const modelHorizontalAspect = size.x / size.z;
        
        // Determine target size - use smaller dimension to ensure it fits
        const targetSize = Math.min(groundWidth, groundHeight) * 0.8; // 80% padding
        
        // Scale to fit the ground's rectangular shape
        // Scale X and Z to match ground proportions
        let scaleX: number;
        let scaleZ: number;
        let scaleY: number;
        
        if (modelHorizontalAspect > groundAspectRatio) {
          // Model is wider relative to ground - fit by width
          scaleX = (targetSize * groundAspectRatio) / size.x;
          scaleZ = targetSize / size.z;
        } else {
          // Model is taller/narrower - fit by height
          scaleX = targetSize / size.x;
          scaleZ = (targetSize / groundAspectRatio) / size.z;
        }
        
              // Increase Y scale to make model thicker/taller
              const heightMultiplier = 2.5; // Increase this number to make it taller
              scaleY = ((scaleX + scaleZ) / 2) * heightMultiplier;
              
              // Apply non-uniform scaling to make model rectangular
              mapModel.scale.set(scaleX, scaleY, scaleZ);
        
        // Reposition after scaling
        const scaledBox = new Box3().setFromObject(mapModel);
        const scaledSize = scaledBox.getSize(new Vector3());
        mapModel.position.y = -2 + scaledSize.y / 2 + 0.1;

    scene.add(mapModel);

    console.log("Map loaded and positioned on ground!", {
      size: size,
      scaleX: scaleX,
      scaleY: scaleY,
      scaleZ: scaleZ,
      position: mapModel.position,
    });
  } catch (error) {
    console.error("Error loading map:", error);
  }

  wrap.render = ({ playhead }) => {
    // Keyboard-controlled rotation for map
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

    // Optional: Animate clouds slowly (drift)
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
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);

    if (mapModel) {
      scene.remove(mapModel);
      mapModel.traverse((child: any) => {
        if (child instanceof Mesh) {
          child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }

      // Clean up clouds
      clouds.forEach((cloud) => {
        cloud.geometry.dispose();
        if (cloud.material) {
          if (Array.isArray(cloud.material)) {
            cloud.material.forEach((mat: any) => mat.dispose());
          } else {
            cloud.material.dispose();
          }
        }
      });

    // Clean up ground
    ground.geometry.dispose();
    if (ground.material) {
      ground.material.dispose();
    }

    renderer.dispose();
    dracoLoader.dispose();
  };
};

const settings: SketchSettings = {
  mode: "webgpu",
  pixelRatio: window.devicePixelRatio,
  animate: true,
  duration: 6_000,
  playFps: 60,
  exportFps: 60,
  framesFormat: ["webm"],
};

ssam(sketch, settings);