# Optional “second viz” engine — license & size audit

## Policy

Any additional real-time visual engine (WASM bundle, second WebGL stack, etc.) ships **only** if:

1. **License** is OSI-approved and compatible with distribution (MIT / BSD / Apache-2.0 preferred).  
2. **Authorship and patent** clauses reviewed for your deployment context.  
3. **Bundle size** fits the PWA budget (gzip + parse time on mid-tier phones).  
4. **Security**: no `eval`, no remote code without SRI + allowlist, no mixed-license assets without attribution file updates.

## Candidates (examples — not bundled by default)

| Project | Typical license | Notes |
|---------|-----------------|-------|
| Butterchurn (in tree) | MIT | Already primary Aurora path |
| Community MilkDrop JSON | Per-preset / pack | Keep `THIRD_PARTY_NOTICES.md` updated |

## Outcome

**Default NEXUS build:** Butterchurn + custom WebGL1 scenes + optional WebGPU WGSL rack only.  
**Second viz:** ship as **optional plugin** (lazy `import()` or separate script tag) after human legal sign-off — do not vendor un-audited minified stacks.
