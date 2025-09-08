// assets/js/orgni.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/* =========================
   🔧 설정값
   ========================= */
const API_KEY   = "dabb632914c69efca691e384dd571999";  // 꼭 따옴표 포함
const V4_TOKEN  = "";                                    // v4 토큰 쓸 땐 API_KEY 비우기
const DEFAULT_MOVIE_ID = 238;                            // 초기 로드 영화 (대부)

/* 표시 옵션 (기본값) */
const HIDE_CREW_DEPT = true;  // TMDB 'Crew' 부서 숨기기(노이즈 줄임)
const MAX_CAST       = 18;    // 캐스트 최대
const MAX_PER_DEPT   = 10;    // 부서별 인원 최대

/* 카드 크기(더 크게) */
const CARD = {
  root:   { w: 260, h: 72 },
  dept:   { w: 200, h: 52 },
  person: { w: 240, h: 62 },
};

/* 부서 우선순위(배치 안정화용) */
const DEPT_ORDER = [
  "Directing","Writing","Production","Cast","Art","Camera",
  "Sound","Editing","Costume & Make-Up","Visual Effects","Lighting","Other","Crew"
];

/* 보기 모드: all | cast | crew */
let VIEW_MODE = "all";

/* 마지막으로 불러온 영화/크레딧 캐시 */
let lastMovie = null;
let lastCredits = null;

/* =========================
   공통 유틸
   ========================= */
const $ = (sel, root=document) => root.querySelector(sel);
function debounce(fn, ms=300){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
const getId = (x) => (x && typeof x === "object") ? x.id : x;

/* TMDB 호출 (v3 키 또는 v4 토큰 자동 선택) */
async function tmdbFetch(path, params = {}) {
  const base = "https://api.themoviedb.org/3";
  const url  = new URL(base + path);
  if (API_KEY) url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "ko-KR");
  for (const [k,v] of Object.entries(params)) url.searchParams.set(k, v);

  const opts = {};
  if (!API_KEY && V4_TOKEN) opts.headers = { Authorization: `Bearer ${V4_TOKEN}` };

  const res = await fetch(url.toString(), opts);
  if (!res.ok) {
    const text = await res.text().catch(()=> "");
    throw new Error(`TMDB ${res.status}: ${res.statusText} ${text}`);
  }
  return res.json();
}

async function searchMovies(query, page=1){ return tmdbFetch(`/search/movie`, { query, page }); }
async function fetchCredits(movieId){
  const [movie, credits] = await Promise.all([
    tmdbFetch(`/movie/${movieId}`),
    tmdbFetch(`/movie/${movieId}/credits`)
  ]);
  return { movie, credits };
}

/* =========================
   TMDB 데이터 → 그래프 변환
   ========================= */
function toGraph(movie, credits, view = "all") {
  const nodes = [];
  const links = [];

  // 루트(작품)
  const rootId = `movie-${movie?.id ?? "unknown"}`;
  nodes.push({
    id: rootId, kind: "root",
    name: movie?.title || movie?.original_title || "제목",
    w: CARD.root.w, h: CARD.root.h
  });

  const deptIdByName = new Map();
  const addDept = (name) => {
    const id = `dept-${name}`;
    if (!deptIdByName.has(name)) {
      nodes.push({ id, kind: "dept", name, w: CARD.dept.w, h: CARD.dept.h });
      links.push({ source: rootId, target: id, strength: 0.05 });
      deptIdByName.set(name, id);
    }
    return deptIdByName.get(name);
  };

  const includeCast = (view === "all" || view === "cast");
  const includeCrew = (view === "all" || view === "crew");

  // 캐스트
  if (includeCast) {
    const cast = (credits?.cast ?? []).slice(0, MAX_CAST);
    if (cast.length) {
      const castDeptId = addDept("Cast");
      cast.forEach(c => {
        const pid = `cast-${c.id ?? Math.random().toString(36).slice(2)}`;
        nodes.push({
          id: pid, kind: "person",
          name: c.name, role: c.character ? `as ${c.character}` : "",
          w: CARD.person.w, h: CARD.person.h
        });
        links.push({ source: castDeptId, target: pid, strength: 0.08 });
      });
    }
  }

  // 크루 → 부서
  if (includeCrew) {
    const crew = (credits?.crew ?? []);
    const grouped = d3.group(crew, d => d.department || "Other");
    for (const [dept, members] of grouped.entries()) {
      if (HIDE_CREW_DEPT && dept === "Crew") continue;
      if (dept === "Cast") continue; // 안전장치
      const deptId = addDept(dept);
      members.slice(0, MAX_PER_DEPT).forEach(m => {
        const pid = `crew-${m.id ?? Math.random().toString(36).slice(2)}-${m.job ?? "job"}`;
        nodes.push({
          id: pid, kind: "person",
          name: m.name, role: m.job || "",
          w: CARD.person.w, h: CARD.person.h
        });
        links.push({ source: deptId, target: pid, strength: 0.08 });
      });
    }
  }

  // 부서 정렬 키
  nodes.forEach(n => {
    if (n.kind === "dept") {
      n.order = DEPT_ORDER.indexOf(n.name);
      if (n.order < 0) n.order = 999;
    }
  });

  return { nodes, links };
}

/* =========================
   SVG & 시뮬레이션 레이어
   ========================= */
const svg = d3.select("#orgChartCanvas");
let zoomLayer, linkLayer, nodeLayer, sim;

function resetLayers(){
  svg.selectAll("*").remove();
  zoomLayer = svg.append("g");
  linkLayer = zoomLayer.append("g");
  nodeLayer = zoomLayer.append("g");

  svg.call(
    d3.zoom()
      .scaleExtent([0.5, 2.2])
      .on("zoom", (ev) => zoomLayer.attr("transform", ev.transform))
  );
}

/* =========================
   렌더링
   ========================= */
function draw({ nodes, links }) {
  if (sim) sim.stop();

  // 링크
  const link = linkLayer.selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link");

  // 노드(카드)
  const node = nodeLayer.selectAll("g.card")
    .data(nodes, d => d.id)
    .join(enter => {
      const g = enter.append("g")
        .attr("class", d => `card ${d.kind === "dept" ? "card--dept" : ""}`);

      g.append("rect")
        .attr("x", d => -d.w/2)
        .attr("y", d => -d.h/2)
        .attr("width",  d => d.w)
        .attr("height", d => d.h);

      g.each(function(d) {
        const el = d3.select(this);
        if (d.kind === "root") {
          el.append("text").attr("class", "name")
            .attr("text-anchor", "middle").attr("dy","-0.2em").text(d.name);
          el.append("text").attr("class", "sub")
            .attr("text-anchor", "middle").attr("dy","1.2em").text("작품");
        } else if (d.kind === "dept") {
          el.append("text").attr("class", "dept")
            .attr("text-anchor","middle").attr("dy",".35em").text(d.name);
        } else {
          el.append("text").attr("class", "name")
            .attr("x", -d.w/2+12).attr("y", -6).text(d.name);
          el.append("text").attr("class", "sub")
            .attr("x", -d.w/2+12).attr("y", 14).text(d.role || "");
        }
      });

      return g;
    })
    .call(d3.drag()
      .on("start", (e,d) => { if (!e.active) sim.alphaTarget(0.2).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag",  (e,d) => { d.fx = e.x; d.fy = e.y; })
      .on("end",   (e,d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );

  // 하이라이트(hover): 이웃만 선명
  const neighbors = new Map();
  links.forEach(l => {
    const s = getId(l.source), t = getId(l.target);
    if (!neighbors.has(s)) neighbors.set(s, new Set());
    if (!neighbors.has(t)) neighbors.set(t, new Set());
    neighbors.get(s).add(t);
    neighbors.get(t).add(s);
  });
  node.on("mouseenter", function(_, d) {
    const ids = neighbors.get(d.id) || new Set(); ids.add(d.id);
    node.classed("dimmed", n => !ids.has(n.id));
    link.classed("dimmed", l => !(getId(l.source) === d.id || getId(l.target) === d.id));
    zoomLayer.classed("highlight", true);
  }).on("mouseleave", () => {
    node.classed("dimmed", false);
    link.classed("dimmed", false);
    zoomLayer.classed("highlight", false);
  });

  // 레이아웃(부서 클러스터링)
  const W = 1600, H = 750;
  const center = { x: W/2, y: H/2 };

  const deptNodes = nodes.filter(n => n.kind === "dept").sort((a,b)=>a.order-b.order);
  const radius = Math.min(W, H) * 0.32;
  deptNodes.forEach((d, i) => {
    const angle = (i / Math.max(1, deptNodes.length)) * Math.PI * 2;
    d.tx = center.x + Math.cos(angle) * radius;
    d.ty = center.y + Math.sin(angle) * radius;
  });

  const deptCenterById = new Map(deptNodes.map(d => [d.id, {x:d.tx, y:d.ty}]));
  const linkByTarget = new Map(links.map(l => [getId(l.target), l])); // target=person
  nodes.forEach(n => {
    if (n.kind === "person") {
      const lk = linkByTarget.get(n.id);
      const deptId = lk ? getId(lk.source) : null;
      const dc = deptId ? deptCenterById.get(deptId) : null;
      if (dc) { n.tx = dc.x; n.ty = dc.y; }
    }
  });

  // 👉 느긋하게 움직이도록 튜닝(속도 ↓)
  sim = d3.forceSimulation(nodes)
    .velocityDecay(0.6)
    .alphaDecay(0.02)
    .force("link", d3.forceLink(links).id(d => d.id)
      .distance(d => ( (d.source.kind==="root") || (d.target.kind==="dept") ) ? 180 : 140)
      .strength(d => d.strength ?? 0.05)
    )
    .force("charge", d3.forceManyBody().strength(-90))
    .force("collide", d3.forceCollide().radius(d => Math.max(d.w, d.h)/2 + 12).iterations(2))
    .force("center", d3.forceCenter(center.x, center.y))
    .force("forceX", d3.forceX(d => d.tx ?? center.x)
      .strength(d => d.kind==="dept" ? 0.18 : (d.kind==="person" ? 0.08 : 0.1)))
    .force("forceY", d3.forceY(d => d.ty ?? center.y)
      .strength(d => d.kind==="dept" ? 0.18 : (d.kind==="person" ? 0.08 : 0.1)))
    .on("tick", () => {
      link
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
}

/* =========================
   툴바(검색창 + 보기탭) 주입
   ========================= */
function injectToolbar(){
  const work = document.getElementById("workarea");
  if (!work) return;

  // 기존 제거
  const oldTb = $(".toolbar", work); if (oldTb) oldTb.remove();
  const oldAc = $(".autocomplete", work); if (oldAc) oldAc.remove();

  // 툴바
  const tb = document.createElement("div");
  tb.className = "toolbar";
  tb.innerHTML = `
    <div class="toolbar-row">
      <input type="text" id="movieInput" placeholder="영화 제목 또는 TMDB ID / URL 입력" />
      <button id="movieBtn">불러오기</button>
      <span class="note">예: "The Godfather" 또는 238</span>
    </div>
    <div class="view-tabs" role="tablist" aria-label="보기 모드">
      <button class="tab active" data-view="all"  role="tab" aria-selected="true">전체보기</button>
      <button class="tab"        data-view="cast" role="tab" aria-selected="false">출연진만</button>
      <button class="tab"        data-view="crew" role="tab" aria-selected="false">스태프만</button>
    </div>
  `;
  work.appendChild(tb);

  // 자동완성
  const ac = document.createElement("div");
  ac.className = "autocomplete";
  ac.style.display = "none";
  work.appendChild(ac);

  const input = $("#movieInput", tb);
  const btn   = $("#movieBtn", tb);

  // TMDB URL → ID 추출
  const parseId = (txt) => {
    const m = String(txt).match(/movie\/(\d+)/);   // https://www.themoviedb.org/movie/238
    if (m) return Number(m[1]);
    if (/^\d+$/.test(String(txt).trim())) return Number(txt);
    return null;
  };

  async function handleSearch(q){
    const id = parseId(q);
    if (id) { ac.style.display = "none"; await renderForMovie(id); return; }

    if (!q || q.trim().length < 2) { ac.style.display = "none"; return; }
    try {
      const data = await searchMovies(q.trim());
      const results = (data?.results ?? []).slice(0, 10);

      if (!results.length) { ac.style.display = "none"; return; }
      ac.innerHTML = results.map(r => {
        const title = r.title || r.original_title || "(제목 없음)";
        const year = (r.release_date || "").slice(0,4) || "";
        return `
          <div class="item" data-id="${r.id}">
            <span class="title">${title}</span>
            <span class="meta">${year}</span>
          </div>
        `;
      }).join("");
      ac.style.display = "block";

      ac.querySelectorAll(".item").forEach(el => {
        el.addEventListener("click", async () => {
          const mid = Number(el.getAttribute("data-id"));
          ac.style.display = "none";
          input.value = el.querySelector(".title").textContent;
          await renderForMovie(mid);
        });
      });
    } catch(e) {
      console.error(e);
      ac.style.display = "none";
      alert("검색에 실패했습니다.");
    }
  }

  const doSearch = debounce(handleSearch, 300);
  input.addEventListener("input", (e)=> doSearch(e.target.value));
  btn.addEventListener("click", async ()=>{
    const v = input.value;
    const id = parseId(v);
    if (id) { await renderForMovie(id); return; }
    await handleSearch(v);
  });

  // 보기 탭 전환
  tb.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-view"); // all | cast | crew
      if (!v || v === VIEW_MODE) return;
      VIEW_MODE = v;

      // 탭 UI 상태 업데이트
      tb.querySelectorAll(".tab").forEach(b => {
        const isActive = b.getAttribute("data-view") === VIEW_MODE;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-selected", String(isActive));
      });

      // 캐시로 즉시 리렌더
      if (lastMovie && lastCredits) {
        redrawFromCache();
      }
    });
  });

  // 바깥 클릭 시 자동완성 닫기
  document.addEventListener("click", (e)=>{
    if (!ac.contains(e.target) && e.target !== input) ac.style.display = "none";
  });
}

/* =========================
   리렌더(캐시 사용)
   ========================= */
function redrawFromCache(){
  resetLayers();
  const graph = toGraph(lastMovie, lastCredits, VIEW_MODE);
  draw(graph);
}

/* =========================
   특정 영화 렌더
   ========================= */
async function renderForMovie(movieId){
  resetLayers();
  try {
    const { movie, credits } = await fetchCredits(movieId);
    lastMovie = movie;
    lastCredits = credits;
    const graph = toGraph(movie, credits, VIEW_MODE);
    draw(graph);
  } catch (err) {
    console.error(err);
    d3.select("#orgChartCanvas")
      .append("text").attr("x", 16).attr("y", 24)
      .text(`데이터 로드 실패: ${err.message}`);
  }
}

/* =========================
   시작
   ========================= */
injectToolbar();
renderForMovie(DEFAULT_MOVIE_ID);
