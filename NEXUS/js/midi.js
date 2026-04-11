'use strict';
/*  midi.js — WebMIDI support with learn mode, scene triggers, CC mapping.
    Falls back gracefully when MIDI is unavailable.                        */

(function () {
  var S = NX.S, P = NX.P;
  var access = null, inputs = [], mappings = {}, learnTarget = null;
  var profiles = {};
  var activeProfile = 'default';
  var _sceneFamilyBucket = -1;
  var _nextRandomPrev = 0;

  function rnd01() {
    return typeof NX.randomUnit === 'function' ? NX.randomUnit() : Math.random();
  }

  function loadProfilesFromStorage() {
    profiles = { default: {} };
    try {
      var p = localStorage.getItem('nx_midi_profiles');
      if (p) profiles = JSON.parse(p);
    } catch (e0) { profiles = { default: {} }; }
    try {
      var leg = localStorage.getItem('nx_midi');
      if (leg && (!profiles.default || Object.keys(profiles.default).length === 0)) {
        profiles.default = JSON.parse(leg);
      }
    } catch (e1) { /* ignore */ }
    try {
      activeProfile = localStorage.getItem('nx_midi_profile') || 'default';
    } catch (e2) {
      activeProfile = 'default';
    }
    if (!profiles[activeProfile]) activeProfile = Object.keys(profiles)[0] || 'default';
    if (!profiles[activeProfile]) profiles[activeProfile] = {};
    mappings = profiles[activeProfile];
  }

  function saveMappings() {
    try {
      profiles[activeProfile] = mappings;
      localStorage.setItem('nx_midi_profiles', JSON.stringify(profiles));
      localStorage.setItem('nx_midi_profile', activeProfile);
      localStorage.setItem('nx_midi', JSON.stringify(mappings));
    } catch (e) { /* ignore */ }
  }

  /* Map a CC channel → a param */
  var paramDefs = {
    speed: { set: function (v) { P.SPD = v * 10; var e = document.getElementById('rspd'); if (e) e.value = P.SPD; } },
    react: { set: function (v) { P.RCT = v * 10; var e = document.getElementById('rrct'); if (e) e.value = P.RCT; } },
    warp: { set: function (v) { P.WRP = v * 10; var e = document.getElementById('rwrp'); if (e) e.value = P.WRP; } },
    gain: { set: function (v) { P.GAIN = v * 2; var e = document.getElementById('rgain'); if (e) e.value = P.GAIN * 100; } },
    morph: { set: function (v) { S.morphDurationSec = 0.55 + v * 3.65; } },
    palette: { set: function (v) { P.PAL = Math.floor(v * 6); if (NX.ui && NX.ui.setPalette) NX.ui.setPalette(P.PAL); } },
    bloom: { set: function (v) { S.postBloomMul = v * 2.2; } },
    colorShift: { set: function (v) { S.hueShift = (v - 0.5) * 0.55; var el = document.getElementById('r-hue'); if (el) el.value = String(Math.round(S.hueShift * 200)); } },
    bcNext: { set: function () {
      if (!NX.PresetLibrary || !NX.VisualEngineManager) return;
      var keys = NX.PresetLibrary.getKeys();
      if (!keys || !keys.length) return;
      var k = keys[Math.floor(rnd01() * keys.length)];
      var p = NX.PresetLibrary.getPreset(k);
      if (p) NX.VisualEngineManager.loadPreset(p, 1.8, k);
    } },
    visualMode: { set: function (v) {
      var modes = ['shader', 'butterchurn', 'hybrid'];
      var i = Math.min(2, Math.floor(v * 3));
      if (NX.SceneManager) NX.SceneManager.setMode(modes[i], { crossfade: true });
    } },
    intensity: { set: function (v) {
      S.bcIntensity = 0.15 + v * 1.25;
      if (NX.VisualEngineManager && NX.VisualEngineManager.setIntensity) NX.VisualEngineManager.setIntensity(S.bcIntensity);
    } },
    trailsAmt: { set: function (v) {
      S.nexusPostTrails = Math.max(0, Math.min(1, v));
      var el = document.getElementById('nx-trails');
      if (el) el.value = String(Math.round(S.nexusPostTrails * 100));
    } },
    kaleido: { set: function (v) { S.postFxKaleido = Math.max(0, Math.min(1, v)); } },
    glitch: { set: function (v) { S.postFxGlitch = Math.max(0, Math.min(1, v)); } },
    postFx: { set: function (v) {
      S.postFxKaleido = Math.max(0, Math.min(1, v * 0.55));
      S.postFxGlitch = Math.max(0, Math.min(1, v * 0.45));
    } },
    nextRandom: { set: function (v) {
      if (v > 0.9 && _nextRandomPrev <= 0.9) NX.goRandom();
      _nextRandomPrev = v;
    } },
    sceneFamily: { set: function (v) {
      var tags = ['calm', 'intense', 'fractal', 'tunnel', 'sacred'];
      var b = Math.min(tags.length - 1, Math.floor(Math.max(0, Math.min(1, v)) * tags.length));
      if (b === _sceneFamilyBucket) return;
      _sceneFamilyBucket = b;
      var tag = tags[b];
      if (!NX.sceneHasTag) return;
      var pool = [];
      for (var i = 0; i < NX.scenes.length; i++) if (NX.sceneHasTag(i, tag)) pool.push(i);
      if (!pool.length) return;
      var pick = pool[Math.floor(rnd01() * pool.length)];
      if (pick === S.curS && pool.length > 1) {
        var j = pool.indexOf(pick);
        pick = pool[(j + 1 + Math.floor(rnd01() * (pool.length - 1))) % pool.length];
      }
      NX.goNext(pick);
    } },
    clipUnder0: { set: function (v) { if (NX.ClipLayers) NX.ClipLayers.setOpacity(0, true, v); } },
    clipUnder1: { set: function (v) { if (NX.ClipLayers) NX.ClipLayers.setOpacity(1, true, v); } },
    clipUnder2: { set: function (v) { if (NX.ClipLayers) NX.ClipLayers.setOpacity(2, true, v); } },
    clipUnder3: { set: function (v) { if (NX.ClipLayers) NX.ClipLayers.setOpacity(3, true, v); } },
    clipOver0: { set: function (v) { if (NX.ClipLayers) NX.ClipLayers.setOpacity(0, false, v); } },
    clipOver1: { set: function (v) { if (NX.ClipLayers) NX.ClipLayers.setOpacity(1, false, v); } },
    clipOver2: { set: function (v) { if (NX.ClipLayers) NX.ClipLayers.setOpacity(2, false, v); } },
    clipOver3: { set: function (v) { if (NX.ClipLayers) NX.ClipLayers.setOpacity(3, false, v); } },
    postBloom: { set: function (v) {
      var el = document.getElementById('nx-fx-bloom');
      if (el) { el.checked = v > 0.5; if (NX.FxChain && NX.FxChain.applyFromUI) NX.FxChain.applyFromUI(); }
    } },
    postGrade: { set: function (v) {
      var el = document.getElementById('nx-fx-grade');
      if (el) { el.checked = v > 0.5; if (NX.FxChain && NX.FxChain.applyFromUI) NX.FxChain.applyFromUI(); }
    } },
    postGlitch: { set: function (v) {
      var el = document.getElementById('nx-fx-glitch-chain');
      if (el) { el.checked = v > 0.5; if (NX.FxChain && NX.FxChain.applyFromUI) NX.FxChain.applyFromUI(); }
    } },
    autoMorphCc: { set: function (v) {
      S.autoMorph = v > 0.5;
      var ab = document.getElementById('autobtn');
      if (ab) ab.classList.toggle('on', S.autoMorph);
      var t = document.getElementById('auto-timer'); if (t) t.textContent = S.autoMorph ? '-' : 'OFF';
    } },
    explodePulse: { set: function (v) {
      if (v > 0.88) { S.explode = 0.95; S.beat = 0.72; }
    } }
  };

  function handleMessage(e) {
    var data = e.data;
    if (!data || data.length < 3) return;
    var status = data[0] & 0xf0, ch = data[0] & 0x0f, note = data[1], vel = data[2];

    /* Learn mode: map this CC or note to the current target */
    if (learnTarget) {
      var key = ch + ':' + note;
      if (status === 0xb0) {
        mappings[key] = { type: 'cc', param: learnTarget };
      } else if (status === 0x90) {
        mappings[key] = { type: 'note', param: learnTarget };
      }
      saveMappings();
      learnTarget = null;
      if (NX.ui && NX.ui.setMidiStatus) NX.ui.setMidiStatus('mapped');
      if (NX.ui && NX.ui.refreshMidiMapPanel) NX.ui.refreshMidiMapPanel();
      return;
    }

    var mkey = ch + ':' + note;

    /* Note On → scene trigger or explode */
    if (status === 0x90 && vel > 0) {
      var m = mappings[mkey];
      if (m && m.type === 'note' && m.param === 'explode') { S.explode = 0.95; S.beat = 0.72; return; }
      if (m && m.type === 'note' && typeof m.param === 'number') { NX.goNext(m.param); return; }
      if (note < NX.scenes.length) NX.goNext(note);
      return;
    }

    /* CC → parameter control */
    if (status === 0xb0) {
      var v01 = vel / 127;
      var m2 = mappings[mkey];
      if (m2 && m2.type === 'cc' && paramDefs[m2.param]) {
        if (m2.param === 'bcNext') paramDefs.bcNext.set();
        else paramDefs[m2.param].set(v01);
        if (NX.ui && NX.ui.flashControl) NX.ui.flashControl(m2.param);
      }
    }
  }

  function refreshProfileSelect() {
    var sel = document.getElementById('nx-midi-profile-sel');
    if (!sel) return;
    while (sel.firstChild) sel.removeChild(sel.firstChild);
    Object.keys(profiles).sort().forEach(function (name) {
      var o = document.createElement('option');
      o.value = name;
      o.textContent = name;
      if (name === activeProfile) o.selected = true;
      sel.appendChild(o);
    });
  }

  function wireProfileControls() {
    if (!profiles || Object.keys(profiles).length === 0) loadProfilesFromStorage();
    var sel = document.getElementById('nx-midi-profile-sel');
    if (!sel || sel.dataset.nxWired === '1') return;
    sel.dataset.nxWired = '1';
    sel.addEventListener('change', function () {
      saveMappings();
      activeProfile = sel.value || 'default';
      if (!profiles[activeProfile]) profiles[activeProfile] = {};
      mappings = profiles[activeProfile];
      try { localStorage.setItem('nx_midi_profile', activeProfile); } catch (e0) { /* ignore */ }
      if (NX.ui && NX.ui.refreshMidiMapPanel) NX.ui.refreshMidiMapPanel();
    });
    var nw = document.getElementById('nx-midi-profile-new');
    if (nw) {
      nw.addEventListener('click', function () {
        var name = window.prompt('New profile name', 'live-' + ((Date.now() / 1000) | 0));
        if (!name || !String(name).trim()) return;
        name = String(name).trim().slice(0, 48);
        saveMappings();
        profiles[name] = JSON.parse(JSON.stringify(mappings));
        activeProfile = name;
        mappings = profiles[name];
        saveMappings();
        refreshProfileSelect();
        if (NX.ui && NX.ui.refreshMidiMapPanel) NX.ui.refreshMidiMapPanel();
      });
    }
    var ex = document.getElementById('nx-midi-export');
    if (ex) {
      ex.addEventListener('click', function () {
        saveMappings();
        var blob = new Blob([JSON.stringify({ version: 1, profiles: profiles, activeProfile: activeProfile }, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'NEXUS_midi_profiles.json';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    }
    var ib = document.getElementById('nx-midi-import-btn');
    var ifile = document.getElementById('nx-midi-import-file');
    if (ib && ifile) {
      ib.addEventListener('click', function () { ifile.click(); });
      ifile.addEventListener('change', function () {
        var f = ifile.files && ifile.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          try {
            var j = JSON.parse(String(r.result || ''));
            if (j.profiles && typeof j.profiles === 'object') profiles = j.profiles;
            if (j.activeProfile && profiles[j.activeProfile]) activeProfile = j.activeProfile;
            mappings = profiles[activeProfile] || {};
            saveMappings();
            refreshProfileSelect();
            if (NX.ui && NX.ui.refreshMidiMapPanel) NX.ui.refreshMidiMapPanel();
          } catch (eImp) {
            if (typeof console !== 'undefined' && console.warn) console.warn('MIDI import failed', eImp);
          }
        };
        r.readAsText(f);
        ifile.value = '';
      });
    }
    var pan = document.getElementById('nx-midi-panic');
    if (pan) {
      pan.addEventListener('click', function () {
        mappings = {};
        saveMappings();
        if (NX.ui && NX.ui.refreshMidiMapPanel) NX.ui.refreshMidiMapPanel();
        if (NX.ui && NX.ui.setMidiStatus) NX.ui.setMidiStatus('cleared');
      });
    }
  }

  async function init() {
    loadProfilesFromStorage();
    refreshProfileSelect();
    wireProfileControls();
    if (!navigator.requestMIDIAccess) { console.log('WebMIDI not available'); return; }
    try {
      access = await navigator.requestMIDIAccess({ sysex: false });
      access.onstatechange = refreshInputs;
      refreshInputs();
    } catch (e) { console.warn('MIDI access denied:', e.message); }
  }

  function refreshInputs() {
    inputs.forEach(function (inp) { inp.onmidimessage = null; });
    inputs = [];
    if (!access) return;
    access.inputs.forEach(function (inp) {
      inputs.push(inp);
      inp.onmidimessage = handleMessage;
    });
    console.log('MIDI inputs:', inputs.map(function (i) { return i.name; }));
    if (NX.ui && NX.ui.setMidiStatus) NX.ui.setMidiStatus(inputs.length ? 'connected' : 'none');
  }

  function startLearn(paramName) { learnTarget = paramName; if (NX.ui && NX.ui.setMidiStatus) NX.ui.setMidiStatus('learning: ' + paramName); }
  function clearMappings() { mappings = {}; saveMappings(); }
  function getMappings() { return Object.assign({}, mappings); }

  function getMappingList() {
    var out = [];
    Object.keys(mappings).forEach(function (k) {
      var m = mappings[k];
      if (m) out.push({ midiKey: k, type: m.type, param: m.param });
    });
    return out;
  }

  function getParamCatalog() {
    return Object.keys(paramDefs);
  }

  NX.midi = {
    init: init, startLearn: startLearn, clearMappings: clearMappings, getMappings: getMappings,
    getMappingList: getMappingList, getParamCatalog: getParamCatalog, paramDefs: paramDefs,
    refreshProfileSelect: refreshProfileSelect, wireProfileControls: wireProfileControls
  };
})();
