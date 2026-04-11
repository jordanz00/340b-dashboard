'use strict';
/**
 * Wires Show tab: cues list, executors, clip file picker, FX chain sync with Aurora bloom checkbox.
 */
(function () {
  function setClipStatus(msg, asError) {
    var el = document.getElementById('nx-clip-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = asError ? 'rgba(255,138,128,.92)' : 'rgba(200,230,255,.78)';
  }

  function summarizeLoadedSlots() {
    if (!NX.ClipLayers || !NX.ClipLayers.getAllSlotStates) return '';
    var st = NX.ClipLayers.getAllSlotStates();
    var bits = [];
    var i;
    for (i = 0; i < 4; i++) {
      if (st.above[i].hasMedia) bits.push('overlay ' + i + (st.above[i].fileName ? ' (' + st.above[i].fileName + ')' : ''));
      if (st.below[i].hasMedia) bits.push('behind ' + i + (st.below[i].fileName ? ' (' + st.below[i].fileName + ')' : ''));
    }
    return bits.length ? ' Active: ' + bits.join(' · ') + '.' : '';
  }

  function refreshCueList() {
    var ul = document.getElementById('nx-cue-list');
    if (!ul || !NX.CueEngine) return;
    while (ul.firstChild) ul.removeChild(ul.firstChild);
    NX.CueEngine.getCues().forEach(function (c) {
      var li = document.createElement('li');
      li.className = 'nx-cue-li';
      var lab;
      if (c.trigger === 'beat') {
        lab = (c.label || c.id) + ' · beat ÷' + (c.everyBeats | 0) + ' ph' + (c.phaseBeats | 0);
      } else {
        var t = typeof c.tSec === 'number' ? c.tSec : 0;
        lab = (c.label || c.id) + ' @ ' + t.toFixed(2) + 's';
      }
      li.textContent = lab;
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'nx-cue-rm';
      rm.textContent = '×';
      rm.setAttribute('aria-label', 'Remove cue');
      rm.addEventListener('click', function () {
        NX.CueEngine.removeCue(c.id);
        refreshCueList();
      });
      li.appendChild(rm);
      ul.appendChild(li);
    });
  }

  function wireExecutors() {
    for (var i = 0; i < 6; i++) {
      (function (idx) {
        var btn = document.getElementById('nx-exec-' + idx);
        var sel = document.getElementById('nx-exec-sel-' + idx);
        if (btn) {
          btn.addEventListener('click', function () {
            if (NX.CueEngine) NX.CueEngine.fireExecutor(idx);
          });
        }
        if (sel) {
          sel.addEventListener('change', function () {
            if (NX.CueEngine) NX.CueEngine.bindExecutor(idx, sel.value);
          });
        }
      })(i);
    }
  }

  function syncExecSelectors() {
    var cues = NX.CueEngine ? NX.CueEngine.getCues() : [];
    for (var i = 0; i < 6; i++) {
      var sel = document.getElementById('nx-exec-sel-' + i);
      if (!sel) continue;
      var cur = NX.CueEngine ? (NX.CueEngine.getExecutors()[i] || {}).cueId : '';
      while (sel.options.length > 1) sel.remove(1);
      cues.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.label || c.id;
        sel.appendChild(o);
      });
      if (cur) sel.value = cur;
    }
  }

  function pushChainFromUI() {
    if (!NX.WgslGraph) return;
    var box = document.getElementById('nx-wgpu-chain-list');
    if (!box) return;
    var rows = box.querySelectorAll('.nx-wgpu-row');
    var list = [];
    var i;
    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      var sel = row.querySelector('select.nx-wgpu-type');
      var rg = row.querySelector('input[type="range"]');
      var bp = row.querySelector('input.nx-wgpu-bypass');
      if (!sel) continue;
      list.push({
        type: sel.value,
        intensity: rg ? parseInt(rg.value, 10) / 100 : 0.5,
        bypass: bp ? !!bp.checked : false
      });
    }
    if (!list.length) list = [{ type: 'passthrough', intensity: 0, bypass: false }];
    NX.WgslGraph.setChain(list);
  }

  function rebuildWgpuChainList() {
    var box = document.getElementById('nx-wgpu-chain-list');
    if (!box || !NX.WgslGraph) return;
    while (box.firstChild) box.removeChild(box.firstChild);
    var types = NX.WgslGraph.NODE_TYPES || [];
    var chain = NX.WgslGraph.getChain();
    chain.forEach(function (node) {
      var row = document.createElement('div');
      row.className = 'nx-wgpu-row';
      var up = document.createElement('button');
      up.type = 'button';
      up.className = 'sm-btn nx-wgpu-move';
      up.textContent = '↑';
      up.title = 'Move up';
      var dn = document.createElement('button');
      dn.type = 'button';
      dn.className = 'sm-btn nx-wgpu-move';
      dn.textContent = '↓';
      dn.title = 'Move down';
      var bypass = document.createElement('input');
      bypass.type = 'checkbox';
      bypass.className = 'nx-wgpu-bypass';
      bypass.title = 'Bypass node';
      bypass.checked = !!node.bypass;
      var sel = document.createElement('select');
      sel.className = 'preset-select nx-wgpu-type';
      var t;
      for (t = 0; t < types.length; t++) {
        var o = document.createElement('option');
        o.value = types[t];
        o.textContent = types[t];
        if (types[t] === node.type) o.selected = true;
        sel.appendChild(o);
      }
      var rg = document.createElement('input');
      rg.type = 'range';
      rg.min = '0';
      rg.max = '100';
      rg.value = String(Math.round(node.intensity * 100));
      rg.title = 'Intensity';
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'sm-btn nx-wgpu-rm';
      rm.textContent = '×';
      rm.setAttribute('aria-label', 'Remove node');
      function swapRow(delta) {
        var parent = row.parentNode;
        if (!parent) return;
        var sibs = Array.prototype.slice.call(parent.querySelectorAll('.nx-wgpu-row'));
        var idx = sibs.indexOf(row);
        var j = idx + delta;
        if (j < 0 || j >= sibs.length) return;
        var other = sibs[j];
        if (delta < 0) parent.insertBefore(row, other);
        else parent.insertBefore(other, row);
        pushChainFromUI();
      }
      up.addEventListener('click', function () { swapRow(-1); });
      dn.addEventListener('click', function () { swapRow(1); });
      sel.addEventListener('change', pushChainFromUI);
      rg.addEventListener('input', pushChainFromUI);
      bypass.addEventListener('change', pushChainFromUI);
      rm.addEventListener('click', function () {
        if (box.querySelectorAll('.nx-wgpu-row').length <= 1) return;
        row.remove();
        pushChainFromUI();
      });
      row.appendChild(up);
      row.appendChild(dn);
      row.appendChild(bypass);
      row.appendChild(sel);
      row.appendChild(rg);
      row.appendChild(rm);
      box.appendChild(row);
    });
  }

  function wireWgpu() {
    var st = document.getElementById('nx-wgpu-status');
    var en = document.getElementById('nx-wgpu-enable');
    var add = document.getElementById('nx-wgpu-add-node');
    if (!NX.WgslGraph) {
      if (st) st.textContent = 'WGSL graph not loaded';
      return;
    }
    NX.WgslGraph.tryInit().then(function (ok) {
      if (st) {
        st.textContent = ok
          ? 'WebGPU ready — enable layer to composite over WebGL.'
          : 'WebGPU unavailable (use a supported browser or disable).';
      }
      if (en) en.disabled = !ok;
      if (!ok && typeof NX.ui !== 'undefined' && NX.ui.setAppBanner) {
        NX.ui.setAppBanner('WebGPU WGSL rack is not available in this browser (Chrome/Edge recommended).', 'warn');
        setTimeout(function () { if (NX.ui && NX.ui.setAppBanner) NX.ui.setAppBanner('', ''); }, 6000);
      }
    });
    rebuildWgpuChainList();
    if (add) {
      add.addEventListener('click', function () {
        var ch = NX.WgslGraph.getChain().slice();
        ch.push({ type: 'passthrough', intensity: 0.45 });
        NX.WgslGraph.setChain(ch.slice(0, 8));
        rebuildWgpuChainList();
      });
    }
    if (en) {
      en.addEventListener('change', function () {
        NX.WgslGraph.tryInit().then(function (ok) {
          if (ok) NX.WgslGraph.setEnabled(!!en.checked);
          else {
            en.checked = false;
            NX.WgslGraph.setEnabled(false);
          }
        });
      });
    }
    var hr = document.getElementById('nx-wgpu-half-res');
    if (hr && NX.WgslGraph) {
      hr.checked = !!NX.WgslGraph.getHalfResChain();
      hr.addEventListener('change', function () {
        NX.WgslGraph.setHalfResChain(!!hr.checked);
      });
    }
    var rackSel = document.getElementById('nx-wgpu-rack-preset');
    var rackGo = document.getElementById('nx-wgpu-apply-rack-preset');
    if (rackGo && NX.WgslGraph && NX.WgslGraph.applyRackPreset) {
      rackGo.addEventListener('click', function () {
        var id = rackSel && rackSel.value;
        if (!id) return;
        NX.WgslGraph.applyRackPreset(id);
        rebuildWgpuChainList();
      });
    }
  }

  function buildClipDeck() {
    var root = document.getElementById('nx-clip-deck');
    if (!root || !NX.ClipLayers) return;
    while (root.firstChild) root.removeChild(root.firstChild);
    function col(title, below) {
      var c = document.createElement('div');
      c.className = 'nx-clip-deck-col';
      var h = document.createElement('h4');
      h.textContent = title;
      c.appendChild(h);
      for (var s = 0; s < 4; s++) {
        (function (slot, isBelow) {
          var row = document.createElement('div');
          row.className = 'nx-clip-slot';
          var lab = document.createElement('span');
          lab.className = 'nx-clip-slot-label';
          lab.textContent = String(slot);
          var play = document.createElement('button');
          play.type = 'button';
          play.className = 'sm-btn';
          play.textContent = 'Play';
          var pause = document.createElement('button');
          pause.type = 'button';
          pause.className = 'sm-btn';
          pause.textContent = 'Pause';
          var solo = document.createElement('button');
          solo.type = 'button';
          solo.className = 'sm-btn';
          solo.textContent = 'Solo';
          var op = document.createElement('input');
          op.type = 'range';
          op.min = '0';
          op.max = '100';
          op.value = '100';
          op.title = 'Opacity %';
          function refreshOp() {
            var stt = NX.ClipLayers.getSlotState(slot, isBelow);
            if (stt) op.value = String(Math.round((stt.opacity != null ? stt.opacity : 0) * 100));
          }
          play.addEventListener('click', function () { NX.ClipLayers.playSlot(slot, isBelow); refreshOp(); });
          pause.addEventListener('click', function () { NX.ClipLayers.stopSlot(slot, isBelow); refreshOp(); });
          solo.addEventListener('click', function () { NX.ClipLayers.setSolo(isBelow, slot); refreshOp(); });
          op.addEventListener('input', function () {
            NX.ClipLayers.setOpacity(slot, isBelow, parseInt(op.value, 10) / 100);
          });
          row.appendChild(lab);
          row.appendChild(play);
          row.appendChild(pause);
          row.appendChild(solo);
          row.appendChild(op);
          c.appendChild(row);
          refreshOp();
        })(s, below);
      }
      root.appendChild(c);
    }
    col('Under WebGL', true);
    col('Over WebGL', false);
  }

  function syncCueTriggerFields() {
    var trig = document.getElementById('nx-cue-trigger');
    var beat = trig && trig.value === 'beat';
    ['nx-cue-tsec', 'nx-cue-every-beats', 'nx-cue-phase-beats'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var row = el.closest('label');
      if (row) {
        if (id === 'nx-cue-tsec') row.style.display = beat ? 'none' : '';
        if (id === 'nx-cue-every-beats' || id === 'nx-cue-phase-beats') row.style.display = beat ? '' : 'none';
      }
    });
  }

  function init() {
    buildClipDeck();
    wireExecutors();
    var trigEl = document.getElementById('nx-cue-trigger');
    if (trigEl) {
      trigEl.addEventListener('change', syncCueTriggerFields);
      syncCueTriggerFields();
    }
    var add = document.getElementById('nx-cue-add');
    if (add) {
      add.addEventListener('click', function () {
        var tEl = document.getElementById('nx-cue-tsec');
        var sEl = document.getElementById('nx-cue-scene');
        var trig = document.getElementById('nx-cue-trigger');
        var evEl = document.getElementById('nx-cue-every-beats');
        var phEl = document.getElementById('nx-cue-phase-beats');
        var tSec = tEl ? parseFloat(tEl.value) : 0;
        var idx = sEl ? parseInt(sEl.value, 10) : 0;
        if (isNaN(tSec) || tSec < 0) tSec = 0;
        if (isNaN(idx)) idx = 0;
        var everyB = evEl ? parseInt(evEl.value, 10) : 8;
        var phaseB = phEl ? parseInt(phEl.value, 10) : 0;
        if (isNaN(everyB) || everyB < 1) everyB = 8;
        if (isNaN(phaseB) || phaseB < 0) phaseB = 0;
        var cue;
        if (trig && trig.value === 'beat') {
          cue = {
            label: 'Beat ÷' + everyB,
            trigger: 'beat',
            everyBeats: everyB,
            phaseBeats: phaseB % everyB,
            tSec: 0,
            enabled: true,
            actions: [{ type: 'scene', index: idx }]
          };
        } else {
          cue = {
            label: 'Cue ' + tSec.toFixed(1) + 's',
            tSec: tSec,
            enabled: true,
            actions: [{ type: 'scene', index: idx }]
          };
        }
        NX.CueEngine.addCue(cue);
        refreshCueList();
        syncExecSelectors();
      });
    }
    var arm = document.getElementById('nx-cue-arm');
    if (arm) arm.addEventListener('click', function () { if (NX.CueEngine) NX.CueEngine.armAll(); });

    var fin = document.getElementById('nx-clip-file');
    var slot = document.getElementById('nx-clip-slot');
    var below = document.getElementById('nx-clip-below');
    var go = document.getElementById('nx-clip-load');
    if (go && fin) {
      go.addEventListener('click', function () {
        var f = fin.files && fin.files[0];
        if (!NX.ClipLayers) {
          setClipStatus('Clip layers are not available.', true);
          return;
        }
        if (!f) {
          setClipStatus('Choose a video or image file first.', true);
          return;
        }
        var sl = slot ? parseInt(slot.value, 10) : 0;
        var bl = below ? !!below.checked : false;
        NX.ClipLayers.loadFile(f, bl, sl).then(function () {
          NX.ClipLayers.playSlot(sl, bl);
          var where = bl ? 'Behind WebGL (often hidden — see note above)' : 'Overlay on WebGL';
          setClipStatus('Playing — ' + where + ', slot ' + sl + ': ' + (f.name || 'media') + '.' + summarizeLoadedSlots(), false);
        }).catch(function (err) {
          console.warn('NEXUS clip load failed', err);
          setClipStatus('Could not decode that file. Try MP4 (H.264), WebM, or JPEG/PNG.', true);
          if (typeof NX.ui !== 'undefined' && NX.ui.setAppBanner) {
            NX.ui.setAppBanner('Clip decode failed — try H.264 MP4 or WebM.', 'error');
            setTimeout(function () { if (NX.ui && NX.ui.setAppBanner) NX.ui.setAppBanner('', ''); }, 7000);
          }
        });
      });
    }
    var opR = document.getElementById('nx-clip-opacity');
    var opGo = document.getElementById('nx-clip-opacity-set');
    if (opGo && opR) {
      opGo.addEventListener('click', function () {
        var slEl = document.getElementById('nx-clip-slot');
        var blEl = document.getElementById('nx-clip-below');
        var sl = slEl ? parseInt(slEl.value, 10) : 0;
        var bl = blEl ? !!blEl.checked : false;
        var v = parseInt(opR.value, 10) / 100;
        if (NX.ClipLayers) {
          NX.ClipLayers.setOpacity(sl, bl, v);
          setClipStatus('Opacity ' + Math.round(v * 100) + '% for slot ' + sl + '.' + summarizeLoadedSlots(), false);
        }
      });
    }
    var blSel = document.getElementById('nx-clip-blend');
    var blGo = document.getElementById('nx-clip-blend-set');
    if (blGo && blSel && NX.ClipLayers) {
      blGo.addEventListener('click', function () {
        var slEl = document.getElementById('nx-clip-slot');
        var blEl = document.getElementById('nx-clip-below');
        var sl = slEl ? parseInt(slEl.value, 10) : 0;
        var bl = blEl ? !!blEl.checked : false;
        NX.ClipLayers.setBlend(sl, bl, blSel.value);
        setClipStatus('Blend mode: ' + blSel.value + '.' + summarizeLoadedSlots(), false);
      });
    }

    function refreshPresetSelect() {
      var sel = document.getElementById('nx-preset-sel');
      if (!sel || !NX.ScenePresets) return;
      var cur = sel.value;
      while (sel.options.length > 1) sel.remove(1);
      NX.ScenePresets.listNames().forEach(function (n) {
        var o = document.createElement('option');
        o.value = n;
        o.textContent = n;
        sel.appendChild(o);
      });
      if (cur && Array.prototype.some.call(sel.options, function (o) { return o.value === cur; })) sel.value = cur;
    }
    var psave = document.getElementById('nx-preset-save');
    var papp = document.getElementById('nx-preset-apply');
    var psel = document.getElementById('nx-preset-sel');
    var pname = document.getElementById('nx-preset-name');
    if (psave && NX.ScenePresets) {
      psave.addEventListener('click', function () {
        var n = pname ? pname.value : '';
        if (NX.ScenePresets.save(n)) refreshPresetSelect();
      });
    }
    if (papp && psel && NX.ScenePresets) {
      papp.addEventListener('click', function () {
        if (psel.value) NX.ScenePresets.apply(psel.value);
      });
    }
    refreshPresetSelect();

    var ltcTh = document.getElementById('nx-ltc-thresh');
    var ltcSv = document.getElementById('nx-ltc-cal-save');
    if (ltcTh && ltcSv && NX.LtcDecodeCore && NX.LtcDecodeCore.saveCalibration) {
      try {
        var cal = JSON.parse(localStorage.getItem('nexus.ltc.cal') || '{}');
        if (typeof cal.hi === 'number') ltcTh.value = String(Math.round(cal.hi * 100));
      } catch (eCal) { /* ignore */ }
      ltcSv.addEventListener('click', function () {
        var v = parseInt(ltcTh.value, 10);
        if (isNaN(v)) v = 8;
        NX.LtcDecodeCore.saveCalibration(v / 100);
      });
    }

    refreshCueList();
    syncExecSelectors();
    wireWgpu();
  }

  window.NX = window.NX || {};
  NX.ShowWorkbench = { init: init, refreshCueList: refreshCueList, syncExecSelectors: syncExecSelectors, setClipStatus: setClipStatus };
})();
