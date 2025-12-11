// src/threeScene/mapPin.ts
import {
  Group,
  Mesh,
  SphereGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  Color,
} from "three/webgpu";

export function createMapPin(colour: number = 0xff3333): Group {
  const pinGroup = new Group();

  const stemHeight = 0.3;
  const headRadius = 0.11;

  // stem: bottom at y = 0
  const stemGeo = new BoxGeometry(0.08, stemHeight, 0.08);
  const stemMat = new MeshStandardMaterial({
    color: new Color(colour),
  });
  const stemMesh = new Mesh(stemGeo, stemMat);
  stemMesh.position.y = stemHeight / 2; // bottom of box at 0
  pinGroup.add(stemMesh);

  // head: sits on top of stem
  const headGeo = new SphereGeometry(headRadius, 16, 16);
  const headMat = new MeshStandardMaterial({
    color: new Color(colour),
  });
  const headMesh = new Mesh(headGeo, headMat);
  headMesh.position.y = stemHeight + headRadius; // just above stem
  pinGroup.add(headMesh);

  return pinGroup;
}
