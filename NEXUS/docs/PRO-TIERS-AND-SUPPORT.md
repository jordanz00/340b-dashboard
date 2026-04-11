# Pro tiers, watermark, and support bundle

## Free vs Pro (in-repo behaviour)

- **Free:** Corner watermark (`js/watermark.js`), `localStorage` key `nx_pro_key` absent or not equal to unlock value.  
- **Pro (dev unlock):** `NX.watermark.unlock('NEXUS_MK4_PRO')` or `earlyaccess2026` — removes watermark client-side.  
- **Honest tiering:** Pro features must match **actually shipped** modules (hybrid stack, WGSL rack, recording profiles, MIDI depth, clip deck, etc.). Update marketing copy when modules change.

## Support without a backend

Static hosting cannot run crash telemetry. Use:

1. **Structured console markers** — e.g. `[NEXUS] boot { scenes, seed }` on startup (`index.html` bootstrap).  
2. **Export debug bundle** — **System** tab → **Export debug bundle** (`NX.ui.exportDebugBundle`) downloads JSON (UA, scene count, session seed, WebGPU flag, MIDI map count).

## Credits

- In-app **Credits** disclosure + `THIRD_PARTY_NOTICES.md` (repo) for Butterchurn, Meyda (optional), preset packs, and any future WASM.
