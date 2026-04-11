# NEXUS — QA matrix & recording regression

Use this matrix for manual releases; combine with `python3 NEXUS/scripts/nexus_smoke.py` for static checks.

## Automated smoke

From repository root:

```bash
python3 NEXUS/scripts/nexus_smoke.py
```

Exit code **0** = required files and bootstrap markers present.

## Manual matrix (tick per release)

| # | Case | Steps | Pass criteria |
|---|------|-------|----------------|
| 1 | Cold load | Open `index.html` via local server or GH Pages URL **with trailing slash** | Splash → Launch; no console error about `NX` missing |
| 2 | WebGL | Launch | Canvas shows motion (not `nx-fatal-no-webgl`) |
| 3 | Scene advance | Space / Next | Scene name updates; no black freeze |
| 4 | Random | R twice | Different scene index (high probability) |
| 5 | Session seed | More → New seed → note HUD | `DNA` driven look changes subtly; seed display updates |
| 6 | Seed URL | Reload with `?seed=12345` | Same seed string shown after load (deterministic pick order when using session RNG) |
| 7 | Mic | M, allow mic | Meters move; Butterchurn can connect when in BC/hybrid mode |
| 8 | Meyda (optional) | Audio → enable Meyda | After lazy load, readout shows numeric centroid; disable clears without error |
| 9 | Present | P | UI hidden; canvas full window |
| 10 | OBS hint | `?obs=1` | Present behavior per README |
| 11 | Record | REC 5–10s, stop | WebM downloads; playback shows A/V sync acceptable |
| 12 | iOS / Safari | Repeat 1–4 on iPhone | No tab kill after 2 min; rotate portrait/landscape recovers canvas |

## Recording regression clips (optional artifact)

After major visual changes, capture **10s** clips (balanced preset, hybrid mode, one intense scene):

- Filename: `qa-<date>-<short-git-sha>.webm`
- Store outside git or in `NEXUS/qa-artifacts/` if `.gitignore` allows; otherwise keep local.

Compare subjectively: bloom halos, trail smear, Butterchurn blend, hue shift.
