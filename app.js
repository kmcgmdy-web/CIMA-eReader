const API_BASE = '/api'; // netlify functions
let USER = null;
let CURRENT = { courseId: null, chapterId: null, lessonId: null };
let sessionStart = Date.now();
let timerInterval = null;
let ttsUtterance = null;
let currentPdfDoc = null;
let currentPdfTextCache = ''; // for TTS/search

document.addEventListener('DOMContentLoaded', init);

async function init(){
  bindUI();
  await loadUser();
  await loadCourses();
  startTimer();
  await loadAssistantContext();
  if(CURRENT.courseId) await loadCourseStructure(CURRENT.courseId);
  if(CURRENT.chapterId) await loadChapter(CURRENT.chapterId);
  await loadAnnotations();
}

function bindUI(){
  document.getElementById('search').addEventListener('input', onSearch);
  document.getElementById('btn-tts').addEventListener('click', toggleTTS);
  document.getElementById('fontSize').addEventListener('change', (e)=> {
    document.querySelector('.content').style.fontSize = e.target.value + 'px';
  });
  document.getElementById('contrast').addEventListener('click', ()=>document.body.classList.toggle('high-contrast'));
  document.getElementById('bookmark').addEventListener('click', saveBookmark);
  document.getElementById('saveNote').addEventListener('click', saveNote);
  document.getElementById('complete').addEventListener('click', markComplete);
}

async function api(path, opts = {}){
  const res = await fetch(API_BASE + path, { headers:{ 'content-type':'application/json' }, ...opts });
  if(!res.ok) throw new Error('API error ' + res.status);
  return res.json();
}

async function loadUser(){
  try{
    USER = await api('/user-me');
    document.getElementById('status').textContent = `Signed in: ${USER.name}`;
  }catch(e){
    document.getElementById('status').textContent = 'Guest';
  }
}

async function loadCourses(){
  try{
    const data = await api('/courses-enrolled');
    if(!CURRENT.courseId && data.length) CURRENT.courseId = data[0].courseId;
  }catch(e){}
}

async function loadAssistantContext(){
  try{
    const ctx = await api('/assistant-context');
    if(ctx && ctx.courseId) CURRENT = { ...CURRENT, ...ctx };
  }catch(e){}
}

async function loadCourseStructure(courseId){
  const structure = await api(`/course-structure?courseId=${encodeURIComponent(courseId)}`);
  const ul = document.getElementById('chaptersList');
  ul.innerHTML = '';
  structure.chapters.forEach(ch => {
    const li = document.createElement('li');
    li.textContent = ch.title;
    li.dataset.chapterId = ch.id;
    li.addEventListener('click', async ()=>{
      CURRENT.chapterId = ch.id;
      await loadChapter(ch.id);
      await api(`/assistant-context`, { method:'POST', body: JSON.stringify(CURRENT) });
    });
    ul.appendChild(li);
  });
}

async function loadChapter(chapterId){
  // permission check could go here if needed
  const data = await api(`/content?contentId=${encodeURIComponent(chapterId)}`);
  const meta = document.getElementById('meta');
  meta.textContent = `${data.title} • ${data.chapter}`;
  const pdfContainer = document.getElementById('pdfContainer');
  pdfContainer.innerHTML = '';
  currentPdfTextCache = '';
  if(data.type === 'pdf'){
    await renderPdf(data.url, pdfContainer);
  }else if(data.type === 'html'){
    document.getElementById('content').innerHTML = data.html;
  }
}

async function renderPdf(url, container){
  // Using pdf.js to render pages
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  if(!pdfjsLib) { container.innerHTML = '<p>PDF viewer not available.</p>'; return; }
  currentPdfDoc = await pdfjsLib.getDocument({ url }).promise;
  const numPages = currentPdfDoc.numPages;
  for(let i=1;i<=numPages;i++){
    const page = await currentPdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.25 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    container.appendChild(canvas);
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Collect text for TTS/search
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(it => it.str).join(' ');
    currentPdfTextCache += '\n' + pageText;
  }
}

function onSearch(e){
  const q = e.target.value.trim();
  if(!q) return; // simple prototype: rely on browser's find or implement overlay
  // naive: speak a quick result count
  const count = (currentPdfTextCache.toLowerCase().match(new RegExp(q.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))||[]).length;
  if(count>0) document.getElementById('meta').textContent += ` • Matches: ${count}`;
}

function toggleTTS(){
  if(!('speechSynthesis' in window)) return alert('TTS not supported');
  if(!ttsUtterance){
    const text = currentPdfTextCache || document.getElementById('content').innerText;
    if(!text) return;
    ttsUtterance = new SpeechSynthesisUtterance(text.substring(0, 20000)); // limit
    speechSynthesis.speak(ttsUtterance);
    ttsUtterance.onend = ()=> { ttsUtterance = null; document.getElementById('btn-tts').textContent = 'Read'; };
    document.getElementById('btn-tts').textContent = 'Stop';
  }else{
    speechSynthesis.cancel();
    ttsUtterance = null;
    document.getElementById('btn-tts').textContent = 'Read';
  }
}

async function saveBookmark(){
  await api('/assistant-context', { method:'POST', body: JSON.stringify({ courseId:CURRENT.courseId, chapterId:CURRENT.chapterId, lessonId:CURRENT.lessonId }) });
  alert('Bookmark saved');
}

async function saveNote(){
  const text = document.getElementById('noteInput').value.trim();
  if(!text) return alert('Add a note or select text first');
  const payload = { chapterId: CURRENT.chapterId, text, userId: USER?.id || 'guest' };
  await api('/annotations', { method:'POST', body: JSON.stringify(payload) });
  document.getElementById('noteInput').value='';
  await loadAnnotations();
}

async function loadAnnotations(){
  try{
    const ann = await api(`/annotations?chapterId=${encodeURIComponent(CURRENT.chapterId || '')}`);
    renderAnnotations(ann || []);
  }catch(e){}
}

function renderAnnotations(list){
  const container = document.getElementById('annotationsList');
  container.innerHTML='';
  (list||[]).forEach(a=>{
    const div = document.createElement('div');
    div.className='annotation';
    div.innerHTML = `<strong>${a.userName}</strong> • ${new Date(a.createdAt).toLocaleString()} <div>${escapeHtml(a.text)}</div>`;
    container.appendChild(div);
  });
}

async function markComplete(){
  await api('/progress', { method:'POST', body: JSON.stringify({ userId: USER?.id || 'guest', courseId:CURRENT.courseId, chapterId:CURRENT.chapterId, completed:true }) });
  alert('Marked complete');
}

function startTimer(){
  const el = document.getElementById('timer');
  setInterval(()=>{
    const seconds = Math.floor((Date.now() - sessionStart)/1000);
    el.textContent = 'Session: ' + new Date(seconds*1000).toISOString().substr(11,8);
    if(seconds % 30 === 0){
      navigator.sendBeacon('/api/progress', JSON.stringify({ userId: USER?.id || 'guest', courseId: CURRENT.courseId, chapterId: CURRENT.chapterId, heartbeat:true, deltaSeconds:30 }));
    }
  },1000);
}

function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
