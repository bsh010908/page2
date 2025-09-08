// assets/js/movie-quiz.js
// TMDB API 키 필수!
const API_KEY = "dabb632914c69efca691e384dd571999"; 
const TMDB = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const $ = (s, r=document)=> r.querySelector(s);

// DOM
const poster = $("#mqPoster");
const overlay = $("#mqOverlay");
const scoreEl = $("#mqScore");
const livesEl = $("#mqLives");
const msg = $("#mqMsg");
const form = $("#mqForm");
const input = $("#mqInput");
const btnHint = $("#mqHint");
const btnSkip = $("#mqSkip");
const nicknameLabel = $("#mqNicknameLabel");

// 상태
const state = {
  nickname: null,
  score: 0,
  lives: 3,
  blurStep: 0,
  movie: null,
};

// ======= 로컬 스토리지 헬퍼 =======
const STORAGE_KEY = "movieQuiz.records";
function loadRecords(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveRecords(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
// 기록 저장: 닉네임 별 세션 기록 push
function pushRecord(nickname, {score, correct, wrong, timestamp}) {
  const all = loadRecords();
  if (!all[nickname]) all[nickname] = { sessions: [] };
  all[nickname].sessions.push({ score, correct, wrong, timestamp });
  saveRecords(all);
}
// 최고점 반환
function getHighScoresTopN(n=8){
  const all = loadRecords();
  const rows = Object.entries(all).map(([nick, val])=>{
    const best = Math.max(...val.sessions.map(s=> s.score), 0);
    return { nick, best };
  });
  rows.sort((a,b)=> b.best - a.best);
  return rows.slice(0,n);
}
// 특정 유저 라인 시리즈(세션별 점수)
function getUserScoreSeries(nick){
  const all = loadRecords();
  const sessions = all[nick]?.sessions || [];
  return sessions.map(s => ({ x: new Date(s.timestamp), y: s.score }));
}
// 특정 유저 누적 정오 비율
function getUserCorrectPie(nick){
  const all = loadRecords();
  const sessions = all[nick]?.sessions || [];
  let c=0, w=0;
  sessions.forEach(s => { c += s.correct || 0; w += s.wrong || 0; });
  return { correct: c, wrong: w };
}

// ======= ApexCharts 세팅 =======
let barChart, pieChart, lineChart;
function ensureCharts(){
  // window.ApexCharts 가 있어야 함 (이미 html에서 로드됨)
  const Apex = window.ApexCharts;
  if (!Apex) { console.error("ApexCharts 미로드"); return; }

  // 1) chart-bar: 닉네임별 최고점 Top N
  if (!barChart){
    barChart = new Apex(document.querySelector("#chart-bar"), {
      chart: { type: "bar", height: 320, toolbar: { show:false } },
      series: [{ name:"최고점", data: [] }],
      xaxis: { categories: [] },
      dataLabels: { enabled: true },
      title: { text: "🏆 플레이어 최고점 TOP", align: "left" }
    });
    barChart.render();
  }
  // 2) chart-pie: 현재 플레이어 누적 정답/오답
  if (!pieChart){
    pieChart = new Apex(document.querySelector("#chart-pie"), {
      chart: { type: "donut", height: 320 },
      series: [0, 0],
      labels: ["정답", "오답"],
      title: { text: "📊 내 누적 정오 비율", align: "left" },
      legend: { position: "bottom" }
    });
    pieChart.render();
  }
  // 3) chart-line: 현재 플레이어 세션별 점수 추이
  if (!lineChart){
    lineChart = new Apex(document.querySelector("#chart-line"), {
      chart: { type: "line", height: 320, toolbar: { show:false } },
      series: [{ name:"세션 점수", data: [] }],
      xaxis: { type: "datetime" },
      stroke: { width: 3 },
      title: { text: "📈 내 세션 점수 추이", align: "left" }
    });
    lineChart.render();
  }

  refreshCharts();
}
function refreshCharts(){
  // bar
  const top = getHighScoresTopN(10);
  barChart.updateOptions({ xaxis: { categories: top.map(x=> x.nick) }});
  barChart.updateSeries([{ name:"최고점", data: top.map(x=> x.best) }]);

  // pie & line for current user
  if (state.nickname){
    const pie = getUserCorrectPie(state.nickname);
    pieChart.updateSeries([pie.correct, pie.wrong]);

    const line = getUserScoreSeries(state.nickname);
    lineChart.updateSeries([{ name:"세션 점수", data: line }]);
  }
}

// ======= 닉네임 모달 =======
function askNickname(){
  return new Promise(resolve=>{
    const modal = document.createElement("div");
    modal.className = "mq-modal";
    modal.innerHTML = `
      <div class="mq-dialog">
        <h3>플레이어 닉네임</h3>
        <p>차트에 기록을 남기려면 닉네임을 입력하세요.</p>
        <div class="row">
          <input id="mqNicknameInput" type="text" placeholder="예) 수현" />
          <button id="mqNicknameOk">시작</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const inp = $("#mqNicknameInput", modal);
    const ok = $("#mqNicknameOk", modal);
    const done = () => {
      const v = (inp.value || "").trim();
      if (!v) return;
      modal.remove();
      resolve(v);
    };
    ok.addEventListener("click", done);
    inp.addEventListener("keydown", (e)=> { if (e.key === "Enter") done(); });
    setTimeout(()=> inp.focus(), 50);
  });
}

// ======= TMDB 통신 =======
async function tmdb(path, params={}) {
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
  const fallback = await tmdb("/movie/popular", { page: 1 });
  return (fallback.results||[]).find(m=>m.poster_path) || fallback.results?.[0];
}

// ======= 게임 로직 =======
function normalizeTitle(s){
  return String(s||"").toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g," ")
    .trim();
}
function setLives(n){ state.lives = n; livesEl.textContent = "❤️".repeat(n); }
function setScore(n){ state.score = n; scoreEl.textContent = n; }
function say(t, k=""){ msg.textContent = t||""; msg.className = "mq-msg" + (k? " "+k : ""); }
const delay = ms => new Promise(r=> setTimeout(r, ms));

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
  try {
    const m = await getRandomMovie();
    state.movie = m;
    poster.src = IMG_BASE + m.poster_path;
    overlay.style.display = "none";
  } catch(e){
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

// 현재 세션 정오 누적 (차트 갱신용)
const sessionStats = { correct: 0, wrong: 0 };

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
      // 세션 저장 -> 차트 반영
      pushRecord(state.nickname, {
        score: state.score,
        correct: sessionStats.correct,
        wrong: sessionStats.wrong,
        timestamp: Date.now()
      });
      refreshCharts();
      // 리셋
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

function onHint(){
  if (state.blurStep < 3) revealStep();
}
async function onSkip(){
  say(`건너뛰기! 정답: “${state.movie.title}”`, "bad");
  sessionStats.wrong++;
  setLives(Math.max(0, state.lives - 1));
  await delay(700);
  await nextRound(true);
}

// ======= 초기화 =======
async function init(){
  // 닉네임
  let nick = localStorage.getItem("movieQuiz.nickname");
  if (!nick) {
    nick = await askNickname();
    localStorage.setItem("movieQuiz.nickname", nick);
  }
  state.nickname = nick;
  nicknameLabel.textContent = nick;

  // 차트
  ensureCharts();

  // 게임 초기 상태
  setScore(0);
  setLives(3);
  await nextRound(false);

  // 이벤트
  form.addEventListener("submit", onSubmit);
  btnHint.addEventListener("click", onHint);
  btnSkip.addEventListener("click", onSkip);
}

init().catch(err=>{
  console.error(err);
  overlay.style.display = "flex";
  overlay.textContent = "초기화 실패: " + err.message;
});
