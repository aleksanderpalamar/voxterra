export function startGameLoop(window, onFrame) {
  let previousTimestamp = null;
  const frame = (timestamp) => {
    const elapsed = previousTimestamp === null ? 0 : (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;
    onFrame(elapsed);
    window.requestAnimationFrame(frame);
  };
  window.requestAnimationFrame(frame);
}
