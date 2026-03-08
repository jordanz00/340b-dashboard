# Vendor Asset Notes

These files are local copies of third-party assets used by the dashboard.

## Files

### `d3.min.js`

- Purpose: map rendering and SVG drawing
- Source: [D3](https://d3js.org/)
- Verification date: March 2026
- SHA256: `f2094bbf6141b359722c4fe454eb6c4b0f0e42cc10cc7af921fc158fceb86539`

### `topojson-client.min.js`

- Purpose: convert TopoJSON atlas data into GeoJSON features
- Source: [TopoJSON Client](https://github.com/topojson/topojson-client)
- Verification date: March 2026
- SHA256: `25cd02ae486cc5063e0215a4e4cfb15de83700c87ac48bac4d57dc6aaf3ebb89`

### `states-10m.json`

- Purpose: raw U.S. atlas data
- Source: [us-atlas](https://github.com/topojson/us-atlas)
- Verification date: March 2026
- SHA256: `d76b391ccfa8bff601d51e3e3da5d43a89fa46cd5caca72ce731b383be5596d0`

### `states-10m.js`

- Purpose: bundled atlas data used for reliable in-browser loading without a runtime fetch
- Derived from: `states-10m.json`
- Verification date: March 2026
- SHA256: `f942c7d43f0c874ea7f3b979ad1e7e22f2a99cafbbb7a6efcd1de8ae2840d4bc`

## Update rule

If you replace any file in this folder:

1. update the source/version notes above
2. re-run SHA256 checks
3. verify the map still renders and the fallback still works
