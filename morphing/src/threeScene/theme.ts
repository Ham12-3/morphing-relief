export function getAppBgColour(): string {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--app-bg")
      .trim() || "#9f988c"
  );
}
