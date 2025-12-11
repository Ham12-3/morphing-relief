export type ControlsSetup = {
  keys: { [key: string]: boolean };
  cleanupControls: () => void;
};

export function setupControls(
  canvas: HTMLCanvasElement,
  getMapModel: () => any | null
): ControlsSetup {
  const keys: { [key: string]: boolean } = {};

  let isDragging = false;
  let previousMouseX = 0;
  let previousMouseY = 0;
  const mouseRotationSpeed = 0.005;

  function handleKeyDown(event: KeyboardEvent) {
    keys[event.key.toLowerCase()] = true;
    keys[event.code.toLowerCase()] = true;
  }

  function handleKeyUp(event: KeyboardEvent) {
    keys[event.key.toLowerCase()] = false;
    keys[event.code.toLowerCase()] = false;
  }

  function handlePointerDown(event: PointerEvent) {
    isDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
    canvas.style.cursor = "grabbing";
  }

  function handlePointerMove(event: PointerEvent) {
    const mapModel = getMapModel();
    if (!isDragging || !mapModel) return;

    const deltaX = event.clientX - previousMouseX;
    const deltaY = event.clientY - previousMouseY;

    previousMouseX = event.clientX;
    previousMouseY = event.clientY;

    mapModel.rotation.y += deltaX * mouseRotationSpeed;
    mapModel.rotation.x += deltaY * mouseRotationSpeed;
  }

  function handlePointerUp() {
    isDragging = false;
    canvas.style.cursor = "default";
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerUp);

  function cleanupControls() {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerup", handlePointerUp);
    canvas.removeEventListener("pointerleave", handlePointerUp);
  }

  return { keys, cleanupControls };
}
