# Professional output — OBS, NDI, and Syphon expectations

NEXUS runs in the **browser**. It does **not** embed native macOS **Syphon** or cross-platform **NDI** transmitters directly. For pro venue workflows, treat NEXUS as a **high-quality WebGL + WebRTC-era visual surface** and route pixels through a **capture path** you control.

## Recommended: OBS Studio (all platforms)

1. Run NEXUS from the **canonical live build** **[https://jordanz00.github.io/nexus-music-visualizer/](https://jordanz00.github.io/nexus-music-visualizer/)** (or `http://localhost` for dev — mic needs a **secure context** except localhost).
2. Add a **Browser Source**; set the URL to that hosted root (trailing slash on GitHub Pages project sites helps asset resolution).
3. Set the Browser Source resolution to **1920×1080** (or your show resolution).
4. Inside NEXUS, press **`P`** or tap **Present** so chrome and panels hide for a clean program feed.
5. Use **REC** inside NEXUS for a direct WebM capture, **or** use OBS **Start Recording / Streaming** to encode with your preferred codec/bitrate.

### Audio

- For **stream mix**, use OBS **Application Audio Capture** / **Desktop Audio** as appropriate; NEXUS mic input is separate from OBS unless you wire a virtual audio cable (advanced).
- For **silent visuals** driven by a DAW, route DAW audio into the machine input NEXUS listens to.

## NDI / Syphon (expectations)

| Technology | In-browser NEXUS | Practical approach |
|------------|------------------|----------------------|
| **NDI** | Not built-in | OBS **NDI Output** plugin, or capture OBS Virtual Camera into an NDI tool chain. |
| **Syphon** | Not available in browser | Use **OBS** or a **native host** wrapping a WebView; or capture GPU output with OS tools. |
| **Spout** (Windows) | Same as above | OBS / external bridge. |

If you need **pixel-perfect internal GPU texture sharing**, plan a **native shell** (Electron/Tauri) or a **companion app**—out of scope for the static `NEXUS/` tree today.

## Present mode + Browser Source tips

- Match **frame rate** (60 fps) between NEXUS transport bar and OBS scene settings when possible.
- Disable **hardware acceleration** troubleshooting only when OBS docs recommend it; NEXUS prefers **high-performance** WebGL.

## Future companion (roadmap)

A small native **frame bridge** (Syphon/NDI sender) that captures a dedicated window or OBS output is a common industry pattern. NEXUS JSON **showfiles** are designed so a future companion could reload the same creative state while changing only the output path.
