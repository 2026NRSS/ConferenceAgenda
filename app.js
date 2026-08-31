const state = {
  data: null,
  activeView: 'home',
  activeDay: 'Thursday',
  favorites: new Set(JSON.parse(localStorage.getItem('nrss26-favorites') || '[]')),
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s='') => String(s).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));

function initials(name='') {
  const cleaned = name.replace(/\b(Ph\.?D\.?|M\.?S\.?|Ed\.?D\.?|D\.?O\.?|Dr\.?)\b/gi,'').trim();
  return cleaned.split(/\s+|\s*&\s*/).filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase() || 'RS';
}

function presenterImage(p, cls='presenter-photo') {
  if (!p?.headshot) return `<div class="presenter-initials">${esc(initials(p?.name))}</div>`;
  return `<img class="${cls}" src="${esc(p.headshot)}" alt="${esc(p.name)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;presenter-initials&quot;>${esc(initials(p.name))}</div>'">`;
}

function presenterById(id) { return state.data.presenters.find(p => p.id === id); }
function sessionById(id) { return state.data.sessions.find(s => s.id === id); }
function presentersForSession(s) { return (s.presenterIds || []).map(presenterById).filter(Boolean); }
function sessionsForPresenter(pid) { return state.data.sessions.filter(s => (s.presenterIds || []).includes(pid)); }
function presenterLine(s) { return presentersForSession(s).map(p => p.name).join(' · ') || 'Presenter details coming soon'; }

function saveFavorites() {
  localStorage.setItem('nrss26-favorites', JSON.stringify([...state.favorites]));
  renderMySchedule();
}

function toggleFavorite(id) {
  state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
  saveFavorites();
  renderSchedule();
  if ($('#detailDialog').open && sessionById(id)) showSession(id);
}

function setView(name, push = true) {
  state.activeView = name;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
  $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  if (push) history.replaceState(null, '', `#${name}`);
  window.scrollTo({top:0, behavior:'smooth'});
  if (name === 'mine') renderMySchedule();
}

function sessionCard(s) {
  const saved = state.favorites.has(s.id);
  return `<article class="session-card" data-session="${s.id}" tabindex="0" role="button" aria-label="Open ${esc(s.title)}">
    <span class="session-type">${esc(s.type)}</span>
    <button type="button" class="favorite-button ${saved ? 'saved' : ''}" data-favorite="${s.id}" aria-label="${saved ? 'Remove from' : 'Add to'} My Schedule">${saved ? '★' : '☆'}</button>
    <h3>${esc(s.title)}</h3>
    <p>${esc(presenterLine(s))}</p>
    <span class="session-room">${s.room ? `Room ${esc(s.room)}` : 'Location to be announced'}</span>
  </article>`;
}

function renderSchedule() {
  if (!state.data) return;
  const q = ($('#sessionSearch')?.value || '').trim().toLowerCase();
  const room = $('#roomFilter')?.value || '';
  const type = $('#typeFilter')?.value || '';
  let sessions = state.data.sessions.filter(s => s.day === state.activeDay);
  if (q) sessions = sessions.filter(s => {
    const hay = [s.title, s.description, s.room, s.type, presenterLine(s)].join(' ').toLowerCase();
    return hay.includes(q);
  });
  if (room) sessions = sessions.filter(s => String(s.room || '') === room);
  if (type) sessions = sessions.filter(s => s.type === type);

  const groups = new Map();
  sessions.forEach(s => {
    const key = `${s.startMinutes}|${s.time}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  });
  const out = [...groups.entries()].sort((a,b) => Number(a[0].split('|')[0]) - Number(b[0].split('|')[0])).map(([k,items]) => {
    const label = k.split('|').slice(1).join('|');
    return `<section class="time-group"><div class="time-label">${esc(label)}</div><div class="time-sessions">${items.map(sessionCard).join('')}</div></section>`;
  }).join('');
  $('#scheduleResults').innerHTML = out || `<div class="empty-state"><strong>No sessions found</strong>Try a different search or filter.</div>`;
  bindSessionCards($('#scheduleResults'));
}

function renderMySchedule() {
  if (!state.data || !$('#myScheduleResults')) return;
  const selected = state.data.sessions.filter(s => state.favorites.has(s.id));
  if (!selected.length) {
    $('#myScheduleResults').innerHTML = `<div class="empty-state"><strong>Your schedule is empty</strong>Tap ☆ on any session to save it here. Your choices remain on this device.</div>`;
    return;
  }
  const byDay = ['Thursday','Friday'].map(day => {
    const dayItems = selected.filter(s => s.day === day);
    if (!dayItems.length) return '';
    const groups = new Map();
    dayItems.forEach(s => {
      const key = `${s.startMinutes}|${s.time}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    });
    return `<div class="section-heading"><div><p class="eyebrow">${day === 'Thursday' ? 'September 3' : 'September 4'}</p><h2>${day}</h2></div></div>` +
      [...groups.entries()].sort((a,b)=>Number(a[0].split('|')[0])-Number(b[0].split('|')[0])).map(([k,items]) => `<section class="time-group"><div class="time-label">${esc(k.split('|').slice(1).join('|'))}</div><div class="time-sessions">${items.map(sessionCard).join('')}</div></section>`).join('');
  }).join('');
  $('#myScheduleResults').innerHTML = byDay;
  bindSessionCards($('#myScheduleResults'));
}

function bindSessionCards(root) {
  $$('[data-session]', root).forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('[data-favorite]')) return;
      showSession(card.dataset.session);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showSession(card.dataset.session); }
    });
  });
  $$('[data-favorite]', root).forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); toggleFavorite(btn.dataset.favorite); }));
}

function renderPresenters() {
  if (!state.data) return;
  const q = ($('#presenterSearch')?.value || '').trim().toLowerCase();
  const list = state.data.presenters.filter(p => {
    const sessionText = sessionsForPresenter(p.id).map(s => s.title).join(' ');
    return [p.name,p.bio,sessionText].join(' ').toLowerCase().includes(q);
  });
  $('#presenterGrid').innerHTML = list.map(p => `<button type="button" class="presenter-card" data-presenter="${p.id}">${presenterImage(p)}<span><h3>${esc(p.name)}</h3><small>${sessionsForPresenter(p.id).length} session${sessionsForPresenter(p.id).length === 1 ? '' : 's'}</small></span></button>`).join('') || `<div class="empty-state"><strong>No presenters found</strong>Try another name or keyword.</div>`;
  $$('[data-presenter]', $('#presenterGrid')).forEach(b => b.addEventListener('click', () => showPresenter(b.dataset.presenter)));
}

function showSession(id) {
  const s = sessionById(id); if (!s) return;
  const ps = presentersForSession(s);
  const saved = state.favorites.has(id);
  $('#dialogContent').innerHTML = `<div class="detail-head"><span class="session-type">${esc(s.type)}</span><h2>${esc(s.title)}</h2><div class="detail-meta">${esc(s.day)} · ${esc(s.time)}${s.room ? ` · Room ${esc(s.room)}` : ''}</div></div>
    ${s.description ? `<div class="detail-description">${esc(s.description)}</div>` : `<div class="detail-description"><em>Session description coming soon.</em></div>`}
    <div class="button-row"><button type="button" class="button primary small" data-dialog-favorite="${s.id}">${saved ? '★ Saved to My Schedule' : '☆ Add to My Schedule'}</button></div>
    ${ps.length ? `<div class="detail-presenters"><h3>Presenter${ps.length > 1 ? 's' : ''}</h3>${ps.map(p => `<div class="detail-presenter-row">${presenterImage(p)}<button type="button" data-dialog-presenter="${p.id}">${esc(p.name)}</button></div>`).join('')}</div>` : ''}`;
  $('[data-dialog-favorite]')?.addEventListener('click', () => toggleFavorite(s.id));
  $$('[data-dialog-presenter]').forEach(b => b.addEventListener('click', () => showPresenter(b.dataset.dialogPresenter)));
  if (!$('#detailDialog').open) $('#detailDialog').showModal();
}

function showPresenter(id) {
  const p = presenterById(id); if (!p) return;
  const sessions = sessionsForPresenter(id);
  $('#dialogContent').innerHTML = `<div class="presenter-detail-header">${presenterImage(p)}<div><p class="eyebrow">Presenter</p><h2>${esc(p.name)}</h2></div></div>
    <div class="presenter-bio">${p.bio ? esc(p.bio) : '<em>Presenter bio coming soon.</em>'}</div>
    ${sessions.length ? `<div class="presenter-session-links"><h3>Sessions</h3>${sessions.map(s => `<button type="button" data-dialog-session="${s.id}"><strong>${esc(s.title)}</strong><br><small>${esc(s.day)} · ${esc(s.time)}${s.room ? ` · Room ${esc(s.room)}` : ''}</small></button>`).join('')}</div>` : ''}`;
  $$('[data-dialog-session]').forEach(b => b.addEventListener('click', () => showSession(b.dataset.dialogSession)));
  if (!$('#detailDialog').open) $('#detailDialog').showModal();
}

function renderHome() {
  const keynote = state.data.sessions.find(s => s.type === 'Keynote') || state.data.sessions.find(s => s.title.toLowerCase().includes('stemm leaders as talent builders'));
  if (keynote) {
    $('#keynoteCard').innerHTML = `<article class="feature-card"><div><span class="session-type">Keynote</span><h3>${esc(keynote.title)}</h3><div class="feature-meta">${esc(keynote.day)} · ${esc(keynote.time)} · ${esc(presenterLine(keynote))}</div></div><button class="button primary small" type="button" data-keynote="${keynote.id}">View keynote</button></article>`;
    $('[data-keynote]').addEventListener('click', () => showSession(keynote.id));
  }
  $('#hostLogos').innerHTML = state.data.hosts.map(h => `<img src="${esc(h.logo)}" alt="${esc(h.name)}" />`).join('');
  renderStatus();
}

function renderStatus() {
  const now = new Date();
  const tzParts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Phoenix',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(now).reduce((a,p)=>(a[p.type]=p.value,a),{});
  const localDate = `${tzParts.year}-${tzParts.month}-${tzParts.day}`;
  const localMin = Number(tzParts.hour) * 60 + Number(tzParts.minute);
  const start = new Date('2026-09-03T00:00:00-07:00');
  const end = new Date('2026-09-05T00:00:00-07:00');
  if (now < start) {
    $('#statusTitle').textContent = 'Summit countdown';
    $('#statusBadge').textContent = 'Upcoming';
    const diff = start - now;
    const days = Math.floor(diff / 86400000), hours = Math.floor(diff / 3600000) % 24, mins = Math.floor(diff / 60000) % 60;
    $('#statusContent').innerHTML = `<div class="countdown"><div class="count-box"><strong>${days}</strong><span>days</span></div><div class="count-box"><strong>${hours}</strong><span>hours</span></div><div class="count-box"><strong>${mins}</strong><span>minutes</span></div></div><p class="status-message">The 2026 National Rural STEM Summit begins Thursday, September 3 at Midwestern University.</p>`;
    return;
  }
  if (now >= end) {
    $('#statusTitle').textContent = 'Thank you for joining us'; $('#statusBadge').textContent = 'Complete';
    $('#statusContent').innerHTML = `<p class="status-message">We hope the summit strengthened your network and gave you ideas you can use right away.</p>`;
    return;
  }
  const todays = state.data.sessions.filter(s => s.date === localDate);
  const current = todays.filter(s => s.startMinutes <= localMin && localMin < s.startMinutes + (s.type === 'Mini Talk' ? 15 : 60));
  const nextMin = Math.min(...todays.filter(s => s.startMinutes > localMin).map(s=>s.startMinutes));
  const next = todays.filter(s => s.startMinutes === nextMin);
  $('#statusTitle').textContent = current.length ? 'Happening now' : 'Coming up'; $('#statusBadge').textContent = localDate === '2026-09-03' ? 'Thursday' : 'Friday';
  const items = current.length ? current : next;
  $('#statusContent').innerHTML = items.length ? `<div class="time-sessions">${items.slice(0,4).map(sessionCard).join('')}</div>` : `<p class="status-message">No additional scheduled sessions are listed for today.</p>`;
  bindSessionCards($('#statusContent'));
}

function renderSponsors() {
  $('#sponsorGrid').innerHTML = state.data.sponsors.map(s => `<article class="sponsor-card" data-tier="${esc(s.tier)}"><div><div class="sponsor-tier">${esc(s.tier)} sponsor · ${esc(s.amount)}</div>${s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.name)}" />` : `<div class="sponsor-name">${esc(s.name)}</div>`}${s.logo ? `<div class="sr-only">${esc(s.name)}</div>` : ''}</div></article>`).join('');
}

function setupFilters() {
  const rooms = [...new Set(state.data.sessions.map(s=>s.room).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  $('#roomFilter').innerHTML = `<option value="">All rooms</option>` + rooms.map(r=>`<option value="${esc(r)}">Room ${esc(r)}</option>`).join('');
  const types = [...new Set(state.data.sessions.map(s=>s.type))].sort();
  $('#typeFilter').innerHTML = `<option value="">All types</option>` + types.map(t=>`<option>${esc(t)}</option>`).join('');
}

function globalSearchResults(q) {
  q = q.trim().toLowerCase();
  if (!q) return `<div class="empty-state"><strong>Search the summit</strong>Try a presenter name, topic, room, or session title.</div>`;
  const sessions = state.data.sessions.filter(s => [s.title,s.description,s.room,presenterLine(s)].join(' ').toLowerCase().includes(q)).slice(0,10);
  const presenters = state.data.presenters.filter(p => [p.name,p.bio].join(' ').toLowerCase().includes(q)).slice(0,10);
  if (!sessions.length && !presenters.length) return `<div class="empty-state"><strong>No matches found</strong>Try another search term.</div>`;
  return [...sessions.map(s=>`<button class="search-result" type="button" data-search-session="${s.id}"><small>Session</small><strong>${esc(s.title)}</strong><span>${esc(s.day)} · ${esc(s.time)}</span></button>`), ...presenters.map(p=>`<button class="search-result" type="button" data-search-presenter="${p.id}"><small>Presenter</small><strong>${esc(p.name)}</strong></button>`)].join('');
}

function bindGlobalSearch() {
  const render = () => {
    $('#globalSearchResults').innerHTML = globalSearchResults($('#globalSearch').value);
    $$('[data-search-session]').forEach(b=>b.addEventListener('click',()=>{ $('#searchDialog').close(); showSession(b.dataset.searchSession); }));
    $$('[data-search-presenter]').forEach(b=>b.addEventListener('click',()=>{ $('#searchDialog').close(); showPresenter(b.dataset.searchPresenter); }));
  };
  $('#globalSearchButton').addEventListener('click',()=>{ $('#searchDialog').showModal(); setTimeout(()=>$('#globalSearch').focus(),40); render(); });
  $('#searchClose').addEventListener('click',()=>$('#searchDialog').close());
  $('#globalSearch').addEventListener('input',render);
}

async function init() {
  try {
    const res = await fetch('conference-data.json', {cache:'no-store'});
    if (!res.ok) throw new Error('Could not load conference data');
    state.data = await res.json();
    setupFilters(); renderHome(); renderSchedule(); renderMySchedule(); renderPresenters(); renderSponsors();

    $$('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
    $$('.day-toggle button').forEach(b=>b.addEventListener('click',()=>{
      state.activeDay = b.dataset.day;
      $$('.day-toggle button').forEach(x=>{ x.classList.toggle('active',x===b); x.setAttribute('aria-selected',x===b?'true':'false'); });
      renderSchedule();
    }));
    ['sessionSearch','roomFilter','typeFilter'].forEach(id=>$('#'+id).addEventListener(id==='sessionSearch'?'input':'change',renderSchedule));
    $('#presenterSearch').addEventListener('input',renderPresenters);
    $('#dialogClose').addEventListener('click',()=>$('#detailDialog').close());
    $('#detailDialog').addEventListener('click',e=>{ if (e.target === $('#detailDialog')) $('#detailDialog').close(); });
    $('#searchDialog').addEventListener('click',e=>{ if (e.target === $('#searchDialog')) $('#searchDialog').close(); });
    bindGlobalSearch();

    const mapImg = $('.map-panel img');
    mapImg.addEventListener('error',()=>{ mapImg.remove(); $('.map-panel').classList.add('missing-map'); });

    const hash = location.hash.replace('#','');
    if (['home','schedule','mine','presenters','info'].includes(hash)) setView(hash,false); else setView('home',false);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  } catch (err) {
    document.body.innerHTML = `<main style="max-width:760px;margin:60px auto;padding:24px;font-family:system-ui"><h1>Conference site could not load</h1><p>${esc(err.message)}</p><p>Make sure <code>conference-data.json</code> is uploaded beside <code>index.html</code>.</p></main>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
