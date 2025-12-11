import {
  Scene,
  Group,
  Mesh,
  MeshStandardMaterial,
  BoxGeometry,
  Color,
} from "three/webgpu";

export type CloudsInfo = {
  clouds: Mesh[];
  cloudGroups: Group[];
};

export function createClouds(scene: Scene): CloudsInfo {
  const clouds: Mesh[] = [];
  const cloudGroups: Group[] = [];

  function createCloud(x: number, y: number, z: number, size: number) {
    const cloudGroup = new Group();

    const cloudMaterial = new MeshStandardMaterial({
      color: new Color(0xffffff),
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9,
    });

    const mainClouds = [
      { x: 0, y: 0, z: 0, w: size * 2, h: size * 1.2, d: size * 1.5 },
      { x: size * 1.2, y: 0, z: 0, w: size * 1.4, h: size, d: size * 1.2 },
      {
        x: -size * 1,
        y: 0,
        z: size * 0.6,
        w: size * 1.2,
        h: size * 0.8,
        d: size,
      },
      { x: 0, y: size * 0.5, z: 0, w: size * 1.8, h: size, d: size * 1.4 },
    ];

    mainClouds.forEach((cloudPart) => {
      const cloudGeometry = new BoxGeometry(
        cloudPart.w,
        cloudPart.h,
        cloudPart.d
      );
      const cloudMesh = new Mesh(cloudGeometry, cloudMaterial);
      cloudMesh.position.set(cloudPart.x, cloudPart.y, cloudPart.z);
      cloudMesh.rotation.y = (Math.random() - 0.5) * 0.4;
      cloudGroup.add(cloudMesh);
      clouds.push(cloudMesh);
    });

    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);
    cloudGroups.push(cloudGroup);
  }

  const cloudPositions = [
    { x: -15, y: 8, z: -10, size: 2 },
    { x: 10, y: 10, z: -8, size: 2.5 },
    { x: -5, y: 12, z: 5, size: 2.2 },
    { x: 15, y: 9, z: 8, size: 2.3 },
    { x: 0, y: 11, z: -12, size: 2.1 },
  ];

  cloudPositions.forEach((pos) => {
    createCloud(pos.x, pos.y, pos.z, pos.size);
  });

  return { clouds, cloudGroups };
}
