// assets/js/movie-quiz.js (안전 바인딩 버전)

// === TMDB 설정 (반드시 교체!) ===
const API_KEY = "dabb632914c69efca691e384dd571999";
const TMDB = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// === 유틸 ===
const $ = (s, r=document)=> r.querySelector(s);
const delay = (ms)=> new Promise(r=> setTimeout(r, ms));
function normalizeTitle(s){
  return String(s||"").toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 안전하게 요소 필수 확인
function mustEl(id){
  const el = document.getElementById(id);
  if (!el) throw new Error(`필수 요소 #${id} 를 찾지 못했습니다. HTML에 해당 id가 있는지 확인하세요.`);
  return el;
}

// 전역 상태
const state = {
  nickname: null,
  score: 0,
  lives: 3,
  blurStep: 0,
  movie: null,
};
const sessionStats = { correct: 0, wrong: 0 };

// 로컬 스토리지 기록
const STORAGE_KEY = "movieQuiz.records";
function loadRecords(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveRecords(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function pushRecord(nickname, {score, correct, wrong, timestamp}) {
  const all = loadRecords();
  if (!all[nickname]) all[nickname] = { sessions: [] };
  all[nickname].sessions.push({ score, correct, wrong, timestamp });
  saveRecords(all);
}
function getHighScoresTopN(n=8){
  const all = loadRecords();
  const rows = Object.entries(all).map(([nick, val])=>{
    const best = val.sessions.length ? Math.max(...val.sessions.map(s=> s.score)) : 0;
    return { nick, best };
  });
  rows.sort((a,b)=> b.best - a.best);
  return rows.slice(0,n);
}
function getUserScoreSeries(nick){
  const all = loadRecords();
  const sessions = all[nick]?.sessions || [];
  return sessions.map(s => ({ x: new Date(s.timestamp), y: s.score }));
}
function getUserCorrectPie(nick){
  const all = loadRecords();
  const sessions = all[nick]?.sessions || [];
  let c=0, w=0; sessions.forEach(s=>{ c+=s.correct||0; w+=s.wrong||0; });
  return { correct:c, wrong:w };
}

// 닉네임: 항상 묻기 + 최근 사용
function getKnownNicknames() {
  const all = loadRecords();
  const arr = Object.entries(all).map(([nick, val])=>{
    const last = val.sessions.length ? val.sessions[val.sessions.length - 1].timestamp : 0;
    return { nick, last };
  });
  arr.sort((a,b)=> b.last - a.last);
  return arr.map(x=> x.nick);
}
function getLastNickname() {
  return localStorage.getItem("movieQuiz.lastNickname") || "";
}
function setLastNickname(nick) {
  localStorage.setItem("movieQuiz.lastNickname", nick);
}
function askNickname(){
  const known = getKnownNicknames();
  const last = getLastNickname();

  return new Promise(resolve=>{
    const modal = document.createElement("div");
    modal.className = "mq-modal";
    modal.innerHTML = `
      <div class="mq-dialog">
        <h3>플레이어 닉네임</h3>
        <p>차트에 기록을 남길 닉네임을 입력하거나, 아래에서 선택하세요.</p>
        <div class="row" style="display:flex;gap:8px;margin-top:8px;">
          <input id="mqNicknameInput" type="text" placeholder="예) 수현" value="${last ? last.replace(/"/g,'&quot;') : ''}" />
          <button id="mqNicknameOk">시작</button>
        </div>
        ${known.length ? `
          <div style="margin-top:10px;">
            <small style="opacity:.8;">최근 사용:</small>
            <div id="mqNickList" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;"></div>
          </div>` : ``}
      </div>
    `;
    document.body.appendChild(modal);
    const inp = modal.querySelector("#mqNicknameInput");
    const ok  = modal.querySelector("#mqNicknameOk");
    const listWrap = modal.querySelector("#mqNickList");

    if (listWrap) {
      known.forEach(n => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = n;
        b.style.cssText = "padding:6px 10px;border:1px solid #d0d7de;border-radius:10px;background:#fff;cursor:pointer;";
        b.addEventListener("click", ()=> { inp.value = n; });
        listWrap.appendChild(b);
      });
    }

    const done = () => {
      const v = (inp.value || "").trim();
      if (!v) return;
      modal.remove();
      setLastNickname(v);
      resolve(v);
    };
    ok.addEventListener("click", done);
    inp.addEventListener("keydown", (e)=> { if (e.key === "Enter") done(); });
    setTimeout(()=> inp.focus(), 30);
  });
}

// ApexCharts (지연 로드 감지)
let barChart, pieChart, lineChart;
function chartsAvailable(){ return !!window.ApexCharts; }
function ensureChartsOnce(){
  if (!chartsAvailable() || barChart || pieChart || lineChart) return;

  const Apex = window.ApexCharts;

  barChart = new Apex(document.querySelector("#chart-bar"), {
    chart: { type: "bar", height: 320, toolbar: { show:false } },
    series: [{ name:"최고점", data: [] }],
    xaxis: { categories: [] },
    dataLabels: { enabled: true },
    title: { text: "🏆 플레이어 최고점 TOP", align: "left" }
  });
  barChart.render();

  pieChart = new Apex(document.querySelector("#chart-pie"), {
    chart: { type: "donut", height: 320 },
    series: [0, 0],
    labels: ["정답", "오답"],
    title: { text: "📊 내 누적 정오 비율", align: "left" },
    legend: { position: "bottom" }
  });
  pieChart.render();

  lineChart = new Apex(document.querySelector("#chart-line"), {
    chart: { type: "line", height: 320, toolbar: { show:false } },
    series: [{ name:"세션 점수", data: [] }],
    xaxis: { type: "datetime" },
    stroke: { width: 3 },
    title: { text: "📈 내 세션 점수 추이", align: "left" }
  });
  lineChart.render();

  refreshCharts();
}
const chartsPoller = setInterval(()=>{
  try {
    ensureChartsOnce();
    if (barChart && pieChart && lineChart) clearInterval(chartsPoller);
  } catch(e){
    console.warn("차트 초기화 재시도:", e.message);
  }
}, 300);
function refreshCharts(){
  if (!(barChart && pieChart && lineChart)) return;
  const top = getHighScoresTopN(10);
  barChart.updateOptions({ xaxis: { categories: top.map(x=> x.nick) }});
  barChart.updateSeries([{ name:"최고점", data: top.map(x=> x.best) }]);

  if (state.nickname){
    const pie = getUserCorrectPie(state.nickname);
    pieChart.updateSeries([pie.correct, pie.wrong]);
    const line = getUserScoreSeries(state.nickname);
    lineChart.updateSeries([{ name:"세션 점수", data: line }]);
  }
}

// TMDB
async function tmdb(path, params={}){
  const url = new URL(TMDB + path);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "ko-KR");
  Object.entries(params).forEach(([k,v])=> url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status} ${res.statusText}`);
  return res.json();
}
async function getRandomMovie(){
  for (let i=0;i<6;i++){
    const page = 1 + Math.floor(Math.random()*10);
    const data = await tmdb("/movie/popular", { page });
    const list = (data.results||[]).filter(m => m.poster_path && (m.vote_count||0) >= 50);
    if (list.length) return list[Math.floor(Math.random()*list.length)];
  }
  const fb = await tmdb("/movie/popular", { page: 1 });
  return (fb.results||[]).find(m=>m.poster_path) || fb.results?.[0];
}

// ======= 초기화(안전 바인딩) =======
window.addEventListener("DOMContentLoaded", async ()=>{
  let poster, overlay, scoreEl, livesEl, msg, form, input, btnHint, btnSkip, nicknameLabel;

  try {
    // 필수 요소 바인딩 (없으면 명확히 오류)
    poster         = mustEl("mqPoster");
    overlay        = mustEl("mqOverlay");
    scoreEl        = mustEl("mqScore");
    livesEl        = mustEl("mqLives");
    msg            = mustEl("mqMsg");
    form           = mustEl("mqForm");
    input          = mustEl("mqInput");
    btnHint        = mustEl("mqHint");
    btnSkip        = mustEl("mqSkip");
    nicknameLabel  = mustEl("mqNicknameLabel");
  } catch (e) {
    console.error(e.message);
    // 게임 섹션이 없는 페이지에서는 조용히 무시 (필요하면 alert로 바꿔도 됨)
    return;
  }

  // 내부에서만 쓰는 헬퍼 (DOM 의존)
  function say(t, k=""){ msg.textContent = t||""; msg.className = "mq-msg" + (k? " "+k : ""); }
  function setLives(n){ state.lives = n; livesEl.textContent = "❤️".repeat(n); }
  function setScore(n){ state.score = n; scoreEl.textContent = n; }
  function revealStep(){
    state.blurStep = Math.min(3, state.blurStep + 1);
    poster.classList.toggle("reveal-1", state.blurStep >= 1);
    poster.classList.toggle("reveal-2", state.blurStep >= 2);
    poster.classList.toggle("reveal-3", state.blurStep >= 3);
  }
  async function nextRound(skip=false){
    overlay.style.display = "flex";
    overlay.textContent = skip ? "건너뛰는 중…" : "로딩중…";
    say(""); input.value = "";
    state.blurStep = 0;
    poster.classList.remove("reveal-1","reveal-2","reveal-3");
    try{
      const m = await getRandomMovie();
      state.movie = m;
      poster.src = IMG_BASE + m.poster_path;
      overlay.style.display = "none";
    }catch(e){
      overlay.textContent = "불러오기에 실패했어요.";
    }
  }
  function isCorrect(guess, movie){
    const g = normalizeTitle(guess);
    if (!g) return false;
    const t1 = normalizeTitle(movie.title);
    const t2 = normalizeTitle(movie.original_title);
    if (g === t1 || g === t2) return true;
    if (g.length >= 4 && (t1.includes(g) || t2.includes(g))) return true;
    return false;
  }
  async function onSubmit(e){
    e.preventDefault();
    const guess = input.value;

    if (isCorrect(guess, state.movie)) {
      setScore(state.score + 1);
      sessionStats.correct++;
      say(`정답! “${state.movie.title}”`, "good");
      poster.classList.add("reveal-3");
      await delay(800);
      await nextRound(false);
    } else {
      sessionStats.wrong++;
      revealStep();
      setLives(Math.max(0, state.lives - 1));

      if (state.lives <= 0){
        say(`게임오버! 정답: “${state.movie.title}”`, "bad");
        pushRecord(state.nickname, {
          score: state.score,
          correct: sessionStats.correct,
          wrong: sessionStats.wrong,
          timestamp: Date.now()
        });
        refreshCharts();
        await delay(1200);
        sessionStats.correct = 0;
        sessionStats.wrong = 0;
        setScore(0);
        setLives(3);
        await nextRound(false);
      } else {
        const year = (state.movie.release_date||"").slice(0,4) || "????";
        say(`아쉬워요! (힌트: ${year}년)`, "bad");
      }
    }
  }
  function onHint(){ if (state.blurStep < 3) revealStep(); }
  async function onSkip(){
    say(`건너뛰기! 정답: “${state.movie.title}”`, "bad");
    sessionStats.wrong++;
    setLives(Math.max(0, state.lives - 1));
    await delay(700);
    await nextRound(true);
  }

  // 닉네임: 항상 물어보기
  const nick = await askNickname();
  state.nickname = nick;
  nicknameLabel.textContent = nick;

  // 차트(지연 로드 대비)
  ensureChartsOnce();

  // 게임 시작
  setScore(0);
  setLives(3);
  await nextRound(false);

  // 이벤트
  form.addEventListener("submit", onSubmit);
  btnHint.addEventListener("click", onHint);
  btnSkip.addEventListener("click", onSkip);
});
