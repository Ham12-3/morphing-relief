import { WebGPURenderer, Color } from "three/webgpu";
import { maxPixelRatio } from "./constants";

export function createRenderer(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  pixelRatio?: number
) {
  const safePixelRatio = Math.min(pixelRatio ?? 1, maxPixelRatio);
  const isHighDpi = (pixelRatio ?? 1) > maxPixelRatio;

  const renderer = new WebGPURenderer({
    canvas,
    antialias: !isHighDpi,
  });

  renderer.setSize(width, height);
  renderer.setPixelRatio(safePixelRatio);

  return renderer;
}

export function setRendererBackground(
  renderer: WebGPURenderer,
  appBg: string
) {
  renderer.setClearColor(new Color(appBg), 0);
}
