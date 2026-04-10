# NEXUS — Benchmark harness (frame time / FPS)

Minimal procedure to compare **before** and **after** graphics or engine changes. Use with [AGENT-MESH.md](./AGENT-MESH.md) proposals.

---

## Goals

- Capture **median** and **p95** frame time (or FPS) under comparable conditions.
- Separate **GPU-bound** vs **UI jank** when possible (e.g. Present mode hides chrome).

---

## Standard test conditions

1. **URL:** Local `http://localhost:<port>/` or deployed equivalent; note **exact URL** and query string (`?obs=1` if testing clean output).
2. **Mode:** Record **visual mode** (shader / Aurora / hybrid) and **quality** (Performance / Balanced / Ultra from UI).
3. **Audio:** State **mic on/off** and approximate input level (or silent).
4. **Scene:** Fixed scene index or preset name; disable **auto-morph** for repeatability unless testing morph cost.
5. **Duration:** **60 seconds** minimum after warmup (see below).
6. **Device:** Fill a row in the device matrix in [AGENT-MESH.md](./AGENT-MESH.md).

---

## Warmup

- After load, wait **10 s** before recording.
- Toggle **Present** off/on once if testing present path.
- If testing Aurora: pick a **fixed** preset from the dropdown (not random morph).

---

## Method A — In-app FPS badge (manual)

1. Launch app; dismiss splash; enable FPS overlay (**backtick** ` per [README](../README.md)).
2. Start a **visible** timer (phone stopwatch or screen recording).
3. At **T+0** after warmup, note FPS readout every **10 s** (6 samples over 60 s).
4. Record **min / max / eyeball median** of those samples (or average if stable).

**Report:** `method=A`, samples[], `medianFps`, `minFps`, scene, mode, quality, mic, URL, device.

---

## Method B — DevTools Performance (Chrome / Edge)

1. Open **Performance** panel; **6× CPU throttle** optional for “budget device” simulation (note if used).
2. Start recording; interact as little as possible for **10–15 s** on a fixed scene.
3. Stop; inspect **Frames** lane: note dropped frames and **mean frame time** if shown.

**Report:** `method=B`, `meanFrameMs` or qualitative drop rate, same metadata as Method A.

---

## Method C — Scripted rAF sampling (bookmarklet or console)

Paste in DevTools console **after** warmup (does not modify repo):

```javascript
(function () {
  var n = 120, t0 = performance.now(), frames = [];
  function tick(now) {
    frames.push(now);
    if (frames.length <= n) requestAnimationFrame(tick);
    else {
      var dt = [];
      for (var i = 1; i < frames.length; i++) dt.push(frames[i] - frames[i - 1]);
      dt.sort(function (a, b) { return a - b; });
      var med = dt[Math.floor(dt.length / 2)];
      var p95 = dt[Math.floor(dt.length * 0.95)];
      console.log("NEXUS rAF sample:", n, "frames");
      console.log("median dt ms:", med.toFixed(2), "p95 dt ms:", p95.toFixed(2));
      console.log("approx median FPS:", (1000 / med).toFixed(1));
    }
  }
  requestAnimationFrame(tick);
})();
```

**Report:** `method=C`, `medianMs`, `p95Ms`, `approxMedianFps`, scene, mode, quality, device.

---

## Recording path regression

For changes touching **REC** or composite canvas:

- Start **30 s** recording at **1080p** (or Stream 1080p); confirm file completes and **no** console errors.
- Note **file size** order-of-magnitude (sanity check for black frames).

---

## Acceptance hints (not hard SLAs)

- **Regression:** p95 frame time **> 25% worse** than baseline on the same device → investigate before merge.
- **iOS:** If median FPS drops below **~24** on a flagship phone for **Balanced** quality on a **med**-cost scene, treat as **high** safariIosRisk for the proposal.

Adjust thresholds per product decision; document overrides in the proposal’s `benchmarkNotes`.
