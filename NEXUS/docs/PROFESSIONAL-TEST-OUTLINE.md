# NEXUS — Professional test outline system

This document adapts the **Professional Test Outline System** to the NEXUS codebase: static hosting, **no default build step**, `window.NX` / `window.NexusEngine` globals, **WebGL1**, Butterchurn, audio graph, and browser-only APIs (mic, MIDI, MediaRecorder).

Use it for **new** automated tests and for **manual QA** documentation that mirrors the same metadata discipline. It complements [QA-UPGRADE-MATRIX.md](../QA-UPGRADE-MATRIX.md) (human pass/fail matrix).

---

## NEXUS-specific testing reality

| Concern | Implication |
|--------|----------------|
| **WebGL** | Node `jsdom` has no real GL; unit-test **pure logic** (math, parsers, preset keys) in Node; GPU paths need **browser** runners (Playwright, Puppeteer) or extracted functions + mocks. |
| **Globals** | Scripts load from `index.html` in order; tests often need a **small harness HTML** or ESM wrappers that `import` refactored modules. Prefer testing **exported** or **injectable** units. |
| **Repo root runners** | `npm run test:nexus` (Vitest, `vitest.nexus.config.mjs` → `tests/nexus/`) and `npm run test:nexus:e2e` (Playwright, `playwright.nexus.config.mjs` → `NEXUS/e2e/`). |
| **Sensitive surfaces** | Mic, `localStorage`, URL params — follow validation rules in [.cursor/rules/nexus-ai-collaboration.mdc](../../.cursor/rules/nexus-ai-collaboration.mdc); tests must not require secrets. |

**Suggested first automated targets (high ROI, low GL):**

- URL / query parsing (`?demo=`, `?obs=`, seeds) with allowlists.
- Pure helpers under `js/nexus-engine/` that do not touch `gl` in the test path.
- Preset catalog / key lists / merge logic (no fabricated preset JSON).

---

## File header block (required for every NEXUS test file)

````text
/**
 * ============================================================================
 * TEST SUITE: [Descriptive Suite Name]
 * ============================================================================
 *
 * MODULE UNDER TEST: [e.g. js/nexus-engine/PresetLibrary.js | js/post.js | URL bootstrap]
 * PRODUCT: NEXUS Engine (static WebGL + Butterchurn)
 * TEST TYPE: [Unit / Integration / E2E / Performance / Manual-checklist]
 * FRAMEWORK: [Vitest | Playwright | PyTest | Mocha | Manual | TBD]
 *
 * AUTHOR: [Developer Name] <[email]>
 * CREATED: [YYYY-MM-DD]
 * LAST MODIFIED: [YYYY-MM-DD]
 * VERSION: [semver]
 *
 * DESCRIPTION:
 * [What behavior this suite validates; link to QA matrix rows if applicable]
 *
 * DEPENDENCIES:
 * - [dependency_1]: [version] - [purpose]
 * - [dependency_2]: [version] - [purpose]
 *
 * COVERAGE SCOPE:
 * ✓ [functionality_1]
 * ✓ [functionality_2]
 * ✗ [excluded_functionality] - [reason — e.g. requires real GPU]
 *
 * EXECUTION REQUIREMENTS:
 * - Environment: [development / CI headless Chrome / staging]
 * - Prerequisites: [e.g. Chrome for WebGPU row; none for pure unit]
 * - Runtime: [estimated ms]
 *
 * NEXUS SURFACES (blast radius):
 * - [ ] index.html shell / script order
 * - [ ] WebGL host (js/engine.js)
 * - [ ] Post (js/post.js)
 * - [ ] NexusEngine bundle (js/nexus-engine/*)
 * - [ ] Vendor (vendor/*) — note license/size if bumped
 *
 * ============================================================================
 */
````

---

## Import and setup section (JavaScript / TypeScript)

When you introduce a runner (recommended: **Vitest** for units, **Playwright** for browser), group imports like this:

````js
// EXTERNAL DEPENDENCIES
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// MODULE UNDER TEST
// Prefer path aliases once configured, e.g.:
// import { parseDemoQuery } from '../js/lib/demo-query.js';

// TEST UTILITIES AND MOCKS
// import { makeFakeCanvas } from './helpers/webgl-mock.js';

// GLOBAL TEST CONFIGURATION
const TEST_CONFIG = {
  timeout: 30_000,
  retries: 0,
  environment: 'node', // or 'chromium' for Playwright project name
};
````

**NEXUS note:** Until modules are importable, keep **logic in small files** and leave IIFE shells thin; tests import the small files.

---

## Suite organization

````js
describe('[Module/Feature Name] - [Test Category]', () => {
  // ========================================================================
  // SUITE METADATA
  // ========================================================================
  const SUITE_INFO = {
    name: '[descriptive-suite-name]',
    purpose: '[what this suite validates]',
    scope: '[specific functionality covered]',
    testCount: 0, // update when adding tests
  };

  // ========================================================================
  // SETUP AND TEARDOWN
  // ========================================================================
  beforeAll(() => {
    console.log(`Starting test suite: ${SUITE_INFO.name}`);
    // WebGL / canvas: create once per suite if browser environment
  });

  beforeEach(() => {
    // Per-test: reset DOM fixtures, clear nx-specific localStorage keys in harness only
  });

  afterEach(() => {
    // Per-test: dispose WebGL contexts, cancel rAF, revoke object URLs
  });

  afterAll(() => {
    console.log(`Completed test suite: ${SUITE_INFO.name}`);
  });
````

---

## Individual test format

````js
  describe('[Functionality Context]', () => {
    test('[should_expected_behavior_when_specific_condition]', async () => {
      const testInfo = {
        id: 'NX-[AREA]-[NNN]',
        category: 'happy-path', // or edge-case | error-handling
        priority: 'high', // critical | high | medium | low
        author: '[developer-name]',
        created: '2026-04-10',
      };

      console.log(`▶ Starting: ${testInfo.id}`);

      try {
        // ARRANGE
        const testData = {
          input: {},
          expected: {},
          context: { product: 'NEXUS' },
        };

        console.log(`  📋 Test Data:`, testData);

        // ACT
        console.log(`  ⚡ Executing: [functionUnderTest]`);
        const result = await Promise.resolve(/* invoke */);

        console.log(`  📊 Result:`, result);

        // ASSERT
        expect(result).toEqual(testData.expected);

        console.log(`  ✅ PASSED: ${testInfo.id}`);
      } catch (error) {
        console.error(`  ❌ FAILED: ${testInfo.id}`);
        console.error(`  🔍 Error Details:`, {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    });
  });
````

**Naming:** Prefer `should_..._when_...` or Jest-style `it('does X when Y')` — pick one per repo and stay consistent.

---

## Logging standards

Use structured logs so CI artifacts are searchable:

````js
console.log(`🚀 SUITE START: [suite-name] at ${new Date().toISOString()}`);
console.log(`▶ TEST START: [test-name]`);
console.log(`📋 TEST DATA:`, params);
console.log(`⚡ EXECUTING: [function-name]`);
console.log(`📊 RESULT:`, output);
console.log(`✅ PASSED: [test-name]`);

console.error(`❌ FAILED: [test-name]`);
console.error(`🔍 FAILURE DETAILS:`, {
  expected,
  actual,
  difference: '[human or diff summary]',
  context: {},
  timestamp: new Date().toISOString(),
});

console.debug(`🔧 DEBUG: [name] =`, value);
````

**CI tip:** If logs are too noisy, gate verbose blocks behind `process.env.NX_TEST_VERBOSE === '1'`.

---

## Function-level documentation (for complex tests)

````js
/**
 * TEST FUNCTION: [descriptive-name]
 *
 * PURPOSE: [behavior under test]
 * METHODOLOGY: [arrange/act/assert; mocks used]
 *
 * INPUTS:
 * - [parameter_1]: [type] - [description]
 *
 * EXPECTED OUTCOMES:
 * - [outcome_1]: [description]
 *
 * FAILURE SCENARIOS:
 * - [scenario_1]: [expected error/behavior]
 *
 * DEPENDENCIES: [browser APIs / files]
 * MAINTENANCE NOTES: [e.g. update when index.html script order changes]
 */
````

---

## Metadata schema (required fields)

````js
const TEST_METADATA = {
  testId: 'NX-[AREA]-[NNN]',
  testName: '[descriptive-name]',
  moduleUnderTest: '[path or symbol]',

  testType: 'unit', // unit | integration | e2e | performance
  category: 'happy-path', // happy-path | edge-case | error-handling
  priority: 'high', // critical | high | medium | low

  author: '[developer-name]',
  reviewer: '[reviewer-name]',
  createdDate: '2026-04-10',
  lastModified: '2026-04-10',
  version: '0.1.0',

  framework: 'Vitest',
  environment: 'node',
  expectedDuration: '50ms',
  dependencies: [],

  reviewCycle: 'per-release',
  deprecationDate: null,
  maintenanceNotes: '[e.g. skipped on Safari CI]',
};
````

---

## Resource management (NEXUS-oriented)

````js
const setupTestResources = async () => {
  console.log('🔧 Initializing test resources...');
  const resources = {
    canvas: null, // HTMLCanvasElement in browser tests
    gl: null, // WebGLRenderingContext or mock
    rafIds: [],
    objectUrls: [],
  };
  console.log('✅ Test resources initialized');
  return resources;
};

const cleanupTestResources = async (resources) => {
  console.log('🧹 Cleaning up test resources...');
  resources.rafIds.forEach((id) => cancelAnimationFrame(id));
  resources.objectUrls.forEach((u) => URL.revokeObjectURL(u));
  // Lose context or dispose GPU objects in GL suites
  console.log('✅ Test resources cleaned up');
};
````

---

## Cross-framework mapping

| Style | NEXUS usage |
|-------|-------------|
| **Vitest** | Default for **unit** tests (`describe`, `test`, `beforeAll`, hooks). |
| **Playwright** | **E2E**: launch `index.html` or dev server; assert canvas presence, no fatal overlay, key UI toggles. |
| **PyTest** | Optional CLI checks (parity with parent repo `tests/e2e-smoke.py` pattern) for HTTP 200 / asset presence if NEXUS is deployed separately. |
| **Manual** | Rows in [QA-UPGRADE-MATRIX.md](../QA-UPGRADE-MATRIX.md) — reuse `TEST_METADATA`-style IDs in spreadsheet/PR for traceability. |

---

## Checklist before merging new tests

- [ ] Header block complete (module path, framework, exclusions for GPU).
- [ ] No secrets; no reliance on real user mic in CI unless explicitly tagged `@live`.
- [ ] Cleanup closes GL, timers, and `MediaRecorder` mocks.
- [ ] Manual QA matrix updated if behavior is user-visible and not fully automated.

---

## Version

- **Document version:** 1.0.0  
- **Aligned product doc:** NEXUS `README.md`, `QA-UPGRADE-MATRIX.md`  
- **Last updated:** 2026-04-10
