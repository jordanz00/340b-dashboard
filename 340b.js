/**
 * HAP 340B Advocacy Dashboard — Map, state data, and UI interactions
 * Depends on: D3.js, Topojson (loaded before this script)
 */
(function() {
  var FIPS_TO_ABBR = { 1:"AL",2:"AK",4:"AZ",5:"AR",6:"CA",8:"CO",9:"CT",10:"DE",11:"DC",12:"FL",13:"GA",15:"HI",16:"ID",17:"IL",18:"IN",19:"IA",20:"KS",21:"KY",22:"LA",23:"ME",24:"MD",25:"MA",26:"MI",27:"MN",28:"MS",29:"MO",30:"MT",31:"NE",32:"NV",33:"NH",34:"NJ",35:"NM",36:"NY",37:"NC",38:"ND",39:"OH",40:"OK",41:"OR",42:"PA",44:"RI",45:"SC",46:"SD",47:"TN",48:"TX",49:"UT",50:"VT",51:"VA",53:"WA",54:"WV",55:"WI",56:"WY" };
  var STATE_NAMES = { AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"D.C.",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming" };
  function getStateAbbr(d) { var id = d.id != null ? d.id : (d.properties && (d.properties.FIPS || d.properties.STATE)); if (!id) return null; var n = parseInt(id,10); return FIPS_TO_ABBR[!isNaN(n)?n:id] || FIPS_TO_ABBR[String(id)] || null; }
  function getStateName(abbr,d) { return (abbr && STATE_NAMES[abbr]) || (d&&d.properties&&d.properties.name) || abbr || "State"; }
  var STATE_340B = { AL:{y:2021,pbm:true,cp:false,notes:""}, AZ:{y:2022,pbm:true,cp:false,notes:""}, AR:{y:2021,pbm:true,cp:true,notes:"First to enact; upheld in court."}, CA:{y:2023,pbm:true,cp:false,notes:""}, CO:{y:2022,pbm:true,cp:true,notes:"Contract pharmacy 2025."}, CT:{y:2023,pbm:true,cp:false,notes:""}, GA:{y:2020,pbm:true,cp:false,notes:""}, HI:{y:2025,pbm:false,cp:true,notes:"Reporting required."}, IL:{y:2022,pbm:true,cp:false,notes:""}, IN:{y:2021,pbm:true,cp:false,notes:""}, IA:{y:2023,pbm:true,cp:false,notes:""}, KS:{y:2024,pbm:false,cp:true,notes:""}, KY:{y:2020,pbm:true,cp:false,notes:""}, LA:{y:2023,pbm:true,cp:true,notes:"Upheld in court."}, ME:{y:2025,pbm:false,cp:true,notes:"Hybrid 2025."}, MD:{y:2024,pbm:false,cp:true,notes:""}, MA:{y:null,pbm:false,cp:false,notes:""}, MI:{y:2022,pbm:true,cp:false,notes:""}, MN:{y:2019,pbm:true,cp:true,notes:"Upheld in court."}, MS:{y:2024,pbm:true,cp:true,notes:""}, MO:{y:2024,pbm:false,cp:true,notes:"Upheld in court."}, MT:{y:2021,pbm:true,cp:false,notes:""}, NE:{y:2022,pbm:true,cp:true,notes:""}, NV:{y:2023,pbm:true,cp:false,notes:""}, NH:{y:2024,pbm:true,cp:false,notes:""}, NJ:{y:null,pbm:false,cp:false,notes:""}, NM:{y:2023,pbm:true,cp:true,notes:""}, NY:{y:null,pbm:false,cp:false,notes:""}, NC:{y:2021,pbm:true,cp:false,notes:""}, ND:{y:2021,pbm:true,cp:true,notes:""}, OH:{y:2021,pbm:true,cp:false,notes:"Hybrid 2025."}, OK:{y:2025,pbm:false,cp:true,notes:""}, OR:{y:2025,pbm:true,cp:true,notes:""}, PA:{y:null,pbm:false,cp:false,notes:"In progress."}, RI:{y:2025,pbm:true,cp:true,notes:"Upheld in court."}, SC:{y:null,pbm:false,cp:false,notes:""}, SD:{y:2024,pbm:true,cp:true,notes:""}, TN:{y:2021,pbm:true,cp:true,notes:"Upheld in court."}, TX:{y:null,pbm:false,cp:false,notes:""}, UT:{y:2020,pbm:true,cp:true,notes:""}, VT:{y:2021,pbm:true,cp:true,notes:"Hybrid 2025."}, VA:{y:2021,pbm:true,cp:false,notes:"Governor vetoed protection."}, WA:{y:null,pbm:false,cp:false,notes:""}, WV:{y:2024,pbm:true,cp:true,notes:""}, WI:{y:null,pbm:false,cp:false,notes:""}, WY:{y:null,pbm:false,cp:false,notes:""}, FL:{y:null,pbm:false,cp:false,notes:""}, DE:{y:null,pbm:false,cp:false,notes:""}, ID:{y:null,pbm:false,cp:false,notes:""}, DC:{y:null,pbm:false,cp:false,notes:""} };
  var STATES_WITH_PROTECTION = ["AR","CO","HI","KS","LA","ME","MD","MN","MS","MO","NE","NM","ND","OK","OR","RI","SD","TN","UT","VT","WV"];

  function drawMap() {
    var c = document.getElementById("us-map");
    if (!c) return;
    var w = Math.min(c.offsetWidth||800,960), h = Math.round(w*0.55);
    if (typeof d3==="undefined"||typeof topojson==="undefined") { c.innerHTML="<p style='padding:2rem;text-align:center;color:#718096;font-size:0.9rem'>Loading map…</p>"; return; }
    c.innerHTML="";
    var svg = d3.select("#us-map").append("svg").attr("viewBox",[0,0,w,h]).attr("width","100%").attr("height","auto");
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(function(us){
      var st = topojson.feature(us,us.objects.states);
      var proj = d3.geoAlbersUsa().fitSize([w,h],st);
      var path = d3.geoPath(proj);
      var g = svg.append("g");
      var idx = st.features.map(function(d,i){return{d:d,i:i};});
      idx.sort(function(a,b){var ca=path.centroid(a.d),cb=path.centroid(b.d);return ca[0]-cb[0];});
      idx.forEach(function(it,o){it.o=o;});
      var om={}; idx.forEach(function(it){om[it.i]=it.o;});
      var reduceMotion = window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var paths = g.selectAll("path").data(st.features).join("path")
        .attr("class",function(d,i){var ab=getStateAbbr(d); var b="state "+(ab&&STATES_WITH_PROTECTION.indexOf(ab)>=0?"protection":"no-protection"); return reduceMotion?b:b+" state-domino";})
        .attr("d",path).attr("data-state",function(d){return getStateAbbr(d)||"";})
        .attr("fill",function(d){var ab=getStateAbbr(d); return ab&&STATES_WITH_PROTECTION.indexOf(ab)>=0?"#0066a1":"#e2e8f0";})
        .attr("stroke","rgba(255,255,255,0.9)").attr("stroke-width",1)
        .each(function(_,i){this.style.animationDelay=(om[i]||0)*55+"ms";});
      bindMap(paths);
      var wrap = document.getElementById("us-map-wrap");
      if (wrap) {
        if (reduceMotion) wrap.classList.add("visible","map-visible");
        else {
          var io = new IntersectionObserver(function(entries){ if(entries[0].isIntersecting){wrap.classList.add("visible","map-visible");} },{threshold:0.1});
          io.observe(wrap);
        }
      }
      var skel = document.getElementById("map-loading-skeleton");
      if (skel) skel.classList.add("hidden");
    }).catch(function(){ c.innerHTML="<p style='padding:2rem;text-align:center;color:#718096;font-size:0.9rem'>Map data temporarily unavailable. Please refresh.</p>"; var skel = document.getElementById("map-loading-skeleton"); if (skel) skel.classList.add("hidden"); });
  }
  function bindMap(paths) {
    var tt = document.getElementById("map-tooltip"), panel = document.getElementById("state-detail-panel");
    if (!tt||!panel) return;
    function place(ev){ tt.style.left=ev.clientX+"px"; tt.style.top=(ev.clientY+14)+"px"; }
    paths.on("mouseenter",function(ev,d){ var ab=getStateAbbr(d); tt.textContent=getStateName(ab,d); place(ev); tt.classList.add("visible"); tt.setAttribute("aria-hidden","false"); })
      .on("mousemove",place)
      .on("mouseleave",function(){ tt.classList.remove("visible"); tt.setAttribute("aria-hidden","true"); })
      .on("click",function(ev,d){
        ev.stopPropagation();
        tt.classList.remove("visible");
        var ab=getStateAbbr(d), name=getStateName(ab,d), data=ab?STATE_340B[ab]:null;
        panel.classList.remove("empty");
        if(!data) panel.innerHTML="<h4>"+name+"</h4><p>No state law data.</p>";
        else {
          var h="<h4>"+name+"</h4><p><span class='badge "+(data.cp?"yes":"no")+"'>Contract pharmacy: "+(data.cp?"Yes":"No")+"</span> <span class='badge "+(data.pbm?"yes":"no")+"'>PBM: "+(data.pbm?"Yes":"No")+"</span></p>";
          if(data.y) h+="<p>Law year: "+data.y+"</p>";
          if(data.notes) h+="<p>"+data.notes+"</p>";
          panel.innerHTML=h;
        }
      });
    document.addEventListener("click",function(ev){ if(!panel.contains(ev.target)&&!ev.target.closest("#us-map path")){ panel.classList.add("empty"); panel.innerHTML="<p>Select a state</p>"; }});
  }

  function initStateListHover() {
    var tt = document.getElementById("state-list-tooltip");
    if (!tt) return;
    document.querySelectorAll(".state-chip").forEach(function(chip){
      var ab = chip.getAttribute("data-state"), data = ab ? STATE_340B[ab] : null;
      chip.setAttribute("title", (STATE_NAMES[ab]||ab) + (data&&data.notes ? ": "+data.notes : ""));
      chip.setAttribute("tabindex", "0");
      chip.setAttribute("role", "button");
      function showTooltip(ev){ var name=STATE_NAMES[ab]||ab; var html="<strong>"+name+"</strong>"; if(data){ html+=" <span class='badge "+(data.cp?"yes":"no")+"'>CP: "+(data.cp?"Yes":"No")+"</span> <span class='badge "+(data.pbm?"yes":"no")+"'>PBM: "+(data.pbm?"Yes":"No")+"</span>"; if(data.y) html+="<br>Year: "+data.y; if(data.notes) html+="<br>"+data.notes; } tt.innerHTML=html; if(ev&&ev.clientX!=null){ tt.style.left=ev.clientX+"px"; tt.style.top=(ev.clientY-12)+"px"; } else { var r=chip.getBoundingClientRect(); tt.style.left=(r.left+r.width/2-80)+"px"; tt.style.top=(r.top-8)+"px"; } tt.classList.add("visible"); }
      chip.addEventListener("mouseenter",function(ev){ showTooltip(ev); });
      chip.addEventListener("focus",showTooltip);
      chip.addEventListener("mousemove",function(ev){ tt.style.left=ev.clientX+"px"; tt.style.top=(ev.clientY-12)+"px"; });
      chip.addEventListener("mouseleave",function(){ tt.classList.remove("visible"); });
      chip.addEventListener("blur",function(){ tt.classList.remove("visible"); });
    });
  }

  function initCountUp() {
    var els = document.querySelectorAll("[data-count-up]");
    if (window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(function(el){ var t=parseFloat(el.getAttribute("data-count-up")); var s=el.getAttribute("data-suffix")||""; var d=parseInt(el.getAttribute("data-decimals"),10)||0; el.textContent=(d?t.toFixed(d):Math.round(t))+s; });
      return;
    }
    var obs = new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(!e.isIntersecting) return; var el=e.target; if(el.dataset.done) return; el.dataset.done="1"; var t=parseFloat(el.getAttribute("data-count-up")), s=el.getAttribute("data-suffix")||"", d=parseInt(el.getAttribute("data-decimals"),10)||0, start=performance.now(); function up(now){ var x=Math.min((now-start)/1200,1); x=1-Math.pow(1-x,2); el.textContent=(d?(t*x).toFixed(d):Math.round(t*x))+s; if(x<1) requestAnimationFrame(up); } requestAnimationFrame(up); }); },{threshold:0.1});
    els.forEach(function(el){ obs.observe(el); });
  }

  function initNavHighlight() {
    var navLinks = document.querySelectorAll(".dashboard-nav a[href^='#']");
    var policySections = ["oversight","pa-impact","community-benefit","access","pa-safeguards"];
    navLinks.forEach(function(a){
      a.addEventListener("click", function(){ navLinks.forEach(function(l){ l.classList.remove("active"); }); a.classList.add("active"); });
    });
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function(a){
          a.classList.remove("active");
          var href = a.getAttribute("href");
          if(href==="#"+id) a.classList.add("active");
          else if(href==="#policy" && policySections.indexOf(id)>=0) a.classList.add("active");
        });
      });
    },{rootMargin:"-80px 0 -50% 0", threshold: 0});
    document.querySelectorAll("#what-is-340b, #overview, #state-laws, #eligibility, #oversight, #pa-impact, #community-benefit, #access, #pa-safeguards").forEach(function(s){ observer.observe(s); });
  }

  function initPrint(){ var b=document.getElementById("btn-print"); if(b) b.addEventListener("click",function(){ window.print(); }); }
  function initPresentation(){ var b=document.getElementById("btn-presentation"), ex=document.getElementById("exit-presentation"), d=document.querySelector(".dashboard"); if(b){ b.addEventListener("click",function(){ d.classList.toggle("presentation-mode"); b.classList.toggle("active",d.classList.contains("presentation-mode")); }); } if(ex) ex.addEventListener("click",function(){ d.classList.remove("presentation-mode"); if(b) b.classList.remove("active"); }); document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&d.classList.contains("presentation-mode")){ d.classList.remove("presentation-mode"); if(b) b.classList.remove("active"); } }); }
  function initDarkMode(){ var b=document.getElementById("btn-dark"), d=document.querySelector(".dashboard"); if(b){ var v=localStorage.getItem("340b-dark")==="1"; if(v) d.classList.add("dark-mode"); b.classList.toggle("active",v); b.addEventListener("click",function(){ d.classList.toggle("dark-mode"); var on=d.classList.contains("dark-mode"); localStorage.setItem("340b-dark",on?"1":"0"); b.classList.toggle("active",on); }); } }
  function initMethodology(){ var t=document.getElementById("methodology-toggle"), c=document.getElementById("methodology-content"); if(t&&c){ t.addEventListener("click",function(){ c.classList.toggle("open"); t.setAttribute("aria-expanded",c.classList.contains("open")); }); } }
  function initViewToggle(){ var mapBtn=document.getElementById("view-map-btn"), tableBtn=document.getElementById("view-table-btn"), mapC=document.getElementById("map-container"), tableW=document.getElementById("state-table-wrap"), listsW=document.getElementById("state-lists-wrap"); if(!mapBtn||!tableBtn||!mapC||!tableW) return; function showMap(){ mapC.hidden=false; tableW.hidden=true; if(listsW) listsW.hidden=false; mapBtn.setAttribute("aria-pressed","true"); tableBtn.setAttribute("aria-pressed","false"); }
  function showTable(){ mapC.hidden=true; tableW.hidden=false; if(listsW) listsW.hidden=true; mapBtn.setAttribute("aria-pressed","false"); tableBtn.setAttribute("aria-pressed","true"); }
  mapBtn.addEventListener("click",showMap); tableBtn.addEventListener("click",showTable); }
  function initStateTable(){ var tbody=document.getElementById("state-table-body"); if(!tbody) return; var states=["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]; states.forEach(function(ab){ var d=STATE_340B[ab]||{}; var row="<tr><td>"+(STATE_NAMES[ab]||ab)+"</td><td><span class='badge "+(d.cp?"yes":"no")+"'>"+(d.cp?"Yes":"No")+"</span></td><td><span class='badge "+(d.pbm?"yes":"no")+"'>"+(d.pbm?"Yes":"No")+"</span></td><td>"+(d.y||"—")+"</td><td>"+(d.notes||"—")+"</td></tr>"; tbody.innerHTML+=row; }); }
  var lastW=0, touch = "ontouchstart" in window || navigator.maxTouchPoints>0;
  function resize(){ if(touch) return; var c=document.getElementById("us-map"); if(!c) return; var w=c.offsetWidth; if(Math.abs(w-lastW)<40 && lastW) return; lastW=w; drawMap(); }
  function go(){ drawMap(); var c=document.getElementById("us-map"); if(c) lastW=c.offsetWidth; initCountUp(); initStateListHover(); initNavHighlight(); initPrint(); initPresentation(); initDarkMode(); initMethodology(); initViewToggle(); initStateTable(); if(!touch) window.addEventListener("resize",function(){ clearTimeout(window._rt); window._rt=setTimeout(resize,300); }); }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",go);
  else go();
})();
