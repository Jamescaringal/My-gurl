/* ===== EASY SETTINGS — edit these ===== */
const CONFIG = {
  songTitle: 'We Fell in Love in October',
  songArtist: 'girl in red',
  typingSpeed: 42            // ms per character in the love letter
};
/* Files to replace (put them in /assets): music.mp3, video.mp4, poster.jpg (optional),
   cover.jpg (optional album art), photo1.jpg … photo4.jpg. Letter text lives in index.html. */

const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#songTitle').textContent = CONFIG.songTitle;
$('#songArtist').textContent = CONFIG.songArtist;
const h1 = $('#intro h1');   // letter-by-letter title
h1.innerHTML = [...h1.textContent].map((c, i) => `<span class="ch" style="animation-delay:${1.2 + i * .09}s">${c === ' ' ? '&nbsp;' : c}</span>`).join('');

/* ---------- Music ---------- */
const audio = $('#audio'), player = $('#player'), musicBtn = $('#musicBtn');
function setMusicUI(on){ player.classList.toggle('on', on); musicBtn.textContent = on ? '❚❚' : '▶'; }
function playMusic(){
  audio.volume = 0;
  audio.play().then(() => { setMusicUI(true); let v = 0;            // gentle 3s fade-in
    const t = setInterval(() => { v = Math.min(1, v + .05); audio.volume = v; if (v >= 1) clearInterval(t); }, 150);
  }).catch(() => setMusicUI(false));
}
musicBtn.onclick = () => audio.paused ? playMusic() : (audio.pause(), setMusicUI(false));
audio.addEventListener('error', () => { $('.meta small').textContent = 'add assets/music.mp3'; });

/* ---------- Open button (first user interaction starts music) ---------- */
$('#openBtn').onclick = () => {
  $('#intro').classList.add('out');
  $('#main').hidden = false; player.hidden = false;
  document.body.classList.remove('locked');
  window.scrollTo(0, 0);
  playMusic();
  initObservers();
  const r = $('#openBtn').getBoundingClientRect();
  sparkle(r.left + r.width / 2, r.top + r.height / 2, 24); burst('petal', 30);
  navigator.vibrate && navigator.vibrate(40);
  setTimeout(() => $('.hero').classList.add('go'), 900);
};

/* ---------- Video ---------- */
const vid = $('#vid'), vPlay = $('#vPlay');
vPlay.onclick = () => vid.paused ? vid.play() : vid.pause();
vid.onclick = vPlay.onclick;
vid.addEventListener('loadedmetadata', () => { if (vid.videoWidth) vid.style.aspectRatio = vid.videoWidth + '/' + vid.videoHeight; });  // fits any video shape
vid.addEventListener('play', () => { vPlay.textContent = '❚❚'; if (!audio.paused) { audio.pause(); setMusicUI(false); audio._resume = true; } });
vid.addEventListener('pause', () => { vPlay.textContent = '▶'; if (audio._resume) { audio._resume = false; playMusic(); } });
vid.addEventListener('timeupdate', () => { $('#vProg').style.width = (vid.currentTime / (vid.duration || 1) * 100) + '%'; });
$('#vBar').onclick = e => { const b = e.currentTarget.getBoundingClientRect(); if (vid.duration) vid.currentTime = (e.clientX - b.left) / b.width * vid.duration; };
$('#vFull').onclick = () => {
  if (vid.requestFullscreen) vid.requestFullscreen();
  else if (vid.webkitEnterFullscreen) vid.webkitEnterFullscreen();   // iPhone Safari
  else if (vid.webkitRequestFullscreen) vid.webkitRequestFullscreen();
};

/* ---------- Letter (typing animation) ---------- */
let typed = false;
$('#envelope').onclick = e => {
  e.currentTarget.classList.add('open');
  const b = e.currentTarget.getBoundingClientRect(); sparkle(b.left + b.width / 2, b.top + 40, 16); burst('petal', 24);
  $('#envHint').hidden = true;
  $('#letter').hidden = false;
  if (typed) return; typed = true;
  const text = $('#letterSrc').content.textContent.trim(), out = $('#letterText');
  out.classList.add('typing');
  let i = 0;
  (function tick(){
    out.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, reduce ? 1 : CONFIG.typingSpeed);
    else out.classList.remove('typing');
  })();
  setTimeout(() => $('#letter').scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
};

$('#replay').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

/* ---------- Scroll reveals, gallery focus, finale ---------- */
function initObservers(){
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  const gal = $('.gallery');
  const figs = [...gal.querySelectorAll('figure')], dots = $('#dots');
  dots.innerHTML = figs.map(() => '<i></i>').join('');
  const go = new IntersectionObserver(es => es.forEach(e => {
    e.target.classList.toggle('active', e.isIntersecting);
    if (e.isIntersecting) [...dots.children].forEach((d, i) => d.classList.toggle('on', figs[i] === e.target));
  }), { root: gal, threshold: .6 });
  figs.forEach(f => go.observe(f));

  const fin = new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting) return; o.disconnect();
    ['.f1', '.f2', '.f3'].forEach((s, i) => setTimeout(() => $(s).classList.add('show'), 400 + i * 2600));
    setTimeout(() => $('#replay').classList.add('show'), 400 + 3 * 2600);
    burst('heart', 20); burst('petal', 20);
  }, { threshold: .5 });
  fin.observe($('#finale'));
}

/* ---------- Particles: hearts, petals, glow dots + tap sparkles (one light canvas) ---------- */
const cv = $('#fx'), ctx = cv.getContext('2d');
let W, H, DPR = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2), parts = [], sparks = [], running = true, dirty = false;
const COUNT = reduce ? 0 : (innerWidth < 700 ? 18 : 46);
function resize(){ W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
addEventListener('resize', resize); resize();

function make(kind, fromBottom){
  const k = kind || ['heart', 'heart', 'petal', 'petal', 'petal', 'dot', 'dot'][Math.random() * 7 | 0];
  const p = { k, x: Math.random() * W, s: k === 'dot' ? 1.5 + Math.random() * 2.5 : 6 + Math.random() * 10,
    r: Math.random() * 6.28, vr: (Math.random() - .5) * .03, ph: Math.random() * 6.28,
    a: .25 + Math.random() * .5, c: k === 'petal' ? ['#ff8fb0', '#ffc2d4', '#f25c84'][Math.random() * 3 | 0] : k === 'heart' ? '#ff5d8f' : '#ffd9a8' };
  if (k === 'heart' || k === 'dot') { p.vy = -(.25 + Math.random() * .6); p.y = fromBottom ? H + 20 : Math.random() * H; }
  else { p.vy = .35 + Math.random() * .7; p.y = fromBottom ? -20 : Math.random() * H; }
  return p;
}
for (let i = 0; i < COUNT; i++) parts.push(make());

function burst(kind = 'heart', n = 14){            // temporary extras that leave the screen and vanish
  if (reduce) return;
  for (let i = 0; i < n; i++){ const p = make(kind, true); p.temp = true; p.a = .7;
    if (kind === 'petal'){ p.y = -Math.random() * H * .7; p.vy += .6; } else p.y = H + Math.random() * H * .5;
    parts.push(p); }
}
function sparkle(x, y, n = 8){                     // tap/click hearts
  if (reduce || sparks.length > 100) return;
  for (let i = 0; i < n; i++){ const a = Math.random() * 6.28, v = 1 + Math.random() * 3;
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, l: 1, s: 5 + Math.random() * 7, c: Math.random() < .7 ? '#ff5d8f' : '#ffd9a8' }); }
}
addEventListener('pointerdown', e => { if (!document.body.classList.contains('locked')) sparkle(e.clientX, e.clientY, 7); });

function heart(s){ ctx.beginPath(); ctx.moveTo(0, s * .35); ctx.bezierCurveTo(-s, -s * .3, -s * .4, -s, 0, -s * .4);
  ctx.bezierCurveTo(s * .4, -s, s, -s * .3, 0, s * .35); ctx.fill(); }
function frame(){
  if (!running) return;
  ctx.clearRect(0, 0, W, H);
  for (const p of parts){
    p.y += p.vy; p.ph += .02; p.x += Math.sin(p.ph) * .5; p.r += p.vr;
    if (p.y < -40 || p.y > H + 40){
      if (p.temp){ p.dead = dirty = true; continue; }
      Object.assign(p, make(p.k, true)); if (p.k === 'dot' || p.k === 'heart') p.y = H + 20;
    }
    ctx.save(); ctx.globalAlpha = p.a * (p.k === 'dot' ? .6 + Math.sin(p.ph * 3) * .4 : 1);
    ctx.translate(p.x, p.y); ctx.fillStyle = p.c;
    if (p.k === 'dot'){ ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.28); ctx.fill(); }
    else if (p.k === 'heart'){ ctx.rotate(Math.sin(p.ph) * .3); heart(p.s); }
    else { ctx.rotate(p.r); ctx.beginPath(); ctx.ellipse(0, 0, p.s * .7, p.s * .35, 0, 0, 6.28); ctx.fill(); }
    ctx.restore();
  }
  if (dirty){ parts = parts.filter(p => !p.dead); dirty = false; }
  for (const s of sparks){
    s.x += s.vx; s.y += s.vy; s.vy += .06; s.l -= .018;
    ctx.globalAlpha = Math.max(s.l, 0); ctx.fillStyle = s.c;
    ctx.save(); ctx.translate(s.x, s.y); heart(s.s * s.l); ctx.restore();
  }
  ctx.globalAlpha = 1;
  if (sparks.length) sparks = sparks.filter(s => s.l > 0);
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) frame(); });
frame();
