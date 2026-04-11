'use strict';
/**
 * Tier A/B expansion pack — analytic “particle” fields (noise + SDF swarms), mobile-first loops.
 * See docs/SCENE-AUTHORING.md for cost tags and compile targets.
 */
(function () {
  var H = NX.HEAD;
  var PAL = ['#2dd4bf', '#f472b6', '#fbbf24', '#60a5fa', '#a78bfa', '#4ade80', '#fb7185', '#38bdf8'];

  function mkScene(name, hex, tier, kz, kf, steps) {
    var st = String(steps);
    var body = [
      'float map(vec3 p){',
      ' float r=length(p)-0.82+sin(p.z*' + kz + '+T*0.35)*0.07;',
      ' float f=fbm(p.xy*' + kf + '+vec2(T*0.08,0.));',
      ' return r-f*0.34;',
      '}',
      'void main(){',
      'vec2 sc=(uv-.5)*vec2(R.x/R.y,1.)*2.;',
      'vec3 ro=vec3(0.,0.,-2.4);',
      'vec3 rd=normalize(vec3(sc,1.08));',
      'float t=0.;vec3 col=vec3(0.015);',
      'for(int i=0;i<' + st + ';i++){',
      ' vec3 p=ro+rd*t;',
      ' float d=map(p);',
      ' if(d<0.004){',
      '  vec3 e=vec3(0.0045,0,0);',
      '  vec3 n=normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));',
      '  col=blinnPhong(n,-rd,normalize(vec3(0.35,0.55,1.)),pal(dot(p,p)+T*0.12+B*0.05),0.18);',
      '  break;',
      '}',
      ' t+=max(d*0.52,0.004);',
      ' if(t>14.) break;',
      '}',
      'gl_FragColor=vec4(sat(col),1.);',
      '}'
    ].join('\n');
    NX.registerScene({
      n: name,
      c: hex,
      cost: tier === 'A' ? 'low' : 'med',
      rx: tier === 'A' ? 1 : 2,
      tags: ['intense', 'particle'],
      fs: H + body
    });
  }

  var names = [
    'SPARK VEIL', 'EMBER SWARM', 'ION DRIFT', 'PLASMA MOTES', 'ARC DUST', 'NEBULA SPECKS',
    'WAVE GRAIN', 'FLUX ORBS', 'AURORA SPARKS', 'VOID ASH', 'CRYO GLINT', 'SOLAR SPRAY',
    'MICRO STORM', 'ECHO SPARKS', 'DEEP FLOAT', 'TIDE MOTES', 'RIFT DUST', 'HALO SPECKS'
  ];
  var i;
  for (i = 0; i < names.length; i++) {
    var tier = i % 5 === 0 ? 'B' : 'A';
    var steps = tier === 'A' ? 52 : 64;
    var kz = (1.15 + (i * 0.031)).toFixed(3);
    var kf = (1.75 + (i % 7) * 0.11).toFixed(3);
    mkScene(names[i], PAL[i % PAL.length], tier, kz, kf, steps);
  }
})();
