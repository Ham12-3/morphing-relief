import { Mesh } from "three/webgpu";

export function disposeMesh(mesh: Mesh) {
  mesh.geometry.dispose();
  const material: any = mesh.material;
  if (Array.isArray(material)) {
    material.forEach((mat) => mat.dispose());
  } else if (material) {
    material.dispose();
  }
}
