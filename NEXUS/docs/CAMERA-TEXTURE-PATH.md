# Camera / video → GPU texture path (PWA decision)

## Goal

Route `getUserMedia` / `getDisplayMedia` into the compositor so clips or a live camera plate sit **under** or **over** WebGL without blocking the main rAF loop.

## Recommended architecture

1. **Primary (today): DOM / canvas compositor**  
   - `video` + `mix-blend-mode` stacks (`#nx-clip-under`, `#nx-clip-over`) already avoid uploading camera frames into WebGL1.  
   - Recording uses `drawImage` from video/canvas in `clip-layers.js` — **no WebGL2 required** for MVP.

2. **Optional upgrade: WebGL2 texture upload**  
   - If you need **sampling inside GLSL** (UV distort on live video), move `#c` to WebGL2 and upload `HTMLVideoElement` to a `TEXTURE_2D` with `texImage2D`.  
   - Gate behind feature detect; keep WebGL1 scene lane as fallback.

3. **CPU fallback**  
   - 2D `drawImage` each frame into an offscreen canvas, then treat as today’s clip path — acceptable for low resolutions only.

## iOS limits (Safari)

- Autoplay rules: muted + `playsInline` + user gesture before `play()` (already required for clips).  
- `getDisplayMedia` is often **desktop-only**; do not assume screen share on iOS.  
- Camera resolution caps and thermal throttling are common — default to **720p** requests and respect `OverconstrainedError`.

## Related

- `OSS-SPIKE-2-COMPOSITOR.md` — earlier compositor spike notes  
