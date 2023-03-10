export function startDrag(...args) {
  let initialX = 0;
  let initialY = 0;

  function onMouseMove(ev) {
    let x = ev.screenX - initialX;
    let y = ev.screenY - initialY;
    window.pywebview._bridge.call('moveWindow', [x, y], 'move');
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove);
  }

  function onMouseDown(ev) {
    initialX = ev.clientX;
    initialY = ev.clientY;
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
  }

  if (window.pywebview)
    onMouseDown(...args)
}
