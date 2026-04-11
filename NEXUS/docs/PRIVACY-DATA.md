# NEXUS — Privacy & data handling

NEXUS Engine Pro is a **static web application**. There is **no NEXUS-operated backend** in this repository: audio and visuals run entirely in your browser unless you connect optional local services (for example OLA / DMX proxy as documented in-app).

## Microphone and audio

- Audio from the **microphone** or **line input** is processed locally for analysis and visualization.
- NEXUS does **not** send mic audio to a remote server as part of this static build.

## localStorage

The app may persist:

- Session seed (`nx_session_seed`) for reproducible visuals.
- User presets, MIDI maps, favorites, LTC calibration, and similar operator preferences (see `js/presets.js`, MIDI modules, and Show tab code).

Operators can clear site data for the origin to remove these entries.

## Recording export

- **WebM** files are generated locally and downloaded to your device.
- Optional **logo image** for branded composite recording is held as a **blob URL in memory** until you close the tab or clear the file input; it is **not uploaded** by NEXUS.

## URL parameters

Only a small **allowlist** of query parameters is interpreted (`seed`, `demo`, `soak`, `director`, etc.). Unknown parameters are ignored. See `README.md` and `js/nexus-bootstrap-query.js`.

## Telemetry

This build does **not** include analytics or third-party telemetry. If you embed the page inside another product that adds tracking, that layer is outside this repository’s scope.

## Contact

For enterprise privacy questionnaires, document what your host (GitHub Pages, internal static server, etc.) logs at the HTTP layer separately from NEXUS application logic.
