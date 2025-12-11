import {
  Scene,
  Fog,
  AmbientLight,
  DirectionalLight,
  Color,
} from "three/webgpu";

export function createSceneWithLights(appBg: string): Scene {
  const scene = new Scene();

//   const fogColour = new Color(appBg).getHex();
//   scene.fog = new Fog(fogColour, 17, 22);

  const ambientLight = new AmbientLight(new Color(0x9f988c), 0.8);
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true; // set to false if you want more speed
  scene.add(directionalLight);

  return scene;
}
