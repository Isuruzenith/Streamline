// ─── API helper ───────────────────────────────────────────────────────────────

const API_KEY = localStorage.getItem('yt-z-api-key') || '';

async function api(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['X-API-Key'] = API_KEY;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

async function apiUpload(path, formData) {
  const headers = {};
  if (API_KEY) headers['X-API-Key'] = API_KEY;
  const res = await fetch(path, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

// ─── Nav queue badge ──────────────────────────────────────────────────────────

async function refreshQueueBadge() {
  try {
    const jobs = await api('GET', '/api/queue');
    const el = document.getElementById('queue-badge');
    if (!el) return;
    if (jobs.length > 0) {
      el.textContent = jobs.length;
      el.style.display = 'inline';
    } else {
      el.style.display = 'none';
    }
  } catch (_) {}
}

// ─── Download page ────────────────────────────────────────────────────────────

function initDownload() {
  const form      = document.getElementById('dl-form');
  const urlInput  = document.getElementById('url-input');
  const errEl     = document.getElementById('url-error');
  const submitBtn = document.getElementById('submit-btn');
  const queueEl   = document.getElementById('queue-list');

  // Auto-paste URL from clipboard if empty
  urlInput.addEventListener('focus', async () => {
    if (urlInput.value.trim()) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('http://') || text.startsWith('https://')) {
        urlInput.value = text;
      }
    } catch (_) {}
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    errEl.classList.remove('visible');

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      errEl.textContent = 'Enter a valid URL starting with http:// or https://';
      errEl.classList.add('visible');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'QUEUING…';

    try {
      await api('POST', '/api/download', {
        url,
        format: document.getElementById('fmt-select').value,
        quality: document.getElementById('quality-select').value,
      });
      urlInput.value = '';
      await pollQueue();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'DOWNLOAD';
    }
  });

  // Live queue on home page
  async function pollQueue() {
    try {
      const jobs = await api('GET', '/api/queue');
      renderHomeQueue(jobs, queueEl);
      refreshQueueBadge();
    } catch (_) {}
  }

  pollQueue();
  setInterval(pollQueue, 2000);
}

function renderHomeQueue(jobs, container) {
  if (!container) return;
  if (jobs.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = jobs.map(j => `
    <div class="job-row">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="min-width:0">
          <div class="job-title">${esc(j.title || j.url)}</div>
          <div class="job-meta">
            ${j.format.toUpperCase()}
            ${j.size_mb ? '· ' + j.size_mb.toFixed(0) + ' MB' : ''}
            <span class="status-${j.status}" style="margin-left:6px">${j.status}</span>
          </div>
          ${j.status === 'running' ? `
            <div class="progress-track">
              <div class="progress-fill" style="width:${j.progress}%"></div>
            </div>
          ` : ''}
        </div>
        ${j.status === 'queued' ? `
          <button class="btn-ghost" onclick="cancelJob('${j.id}')" style="flex-shrink:0">×</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// ─── Queue page ───────────────────────────────────────────────────────────────

function initQueue() {
  async function poll() {
    try {
      const jobs = await api('GET', '/api/queue');
      renderQueuePage(jobs);
      refreshQueueBadge();
    } catch (_) {}
  }
  poll();
  setInterval(poll, 2000);
}

function renderQueuePage(jobs) {
  const running = jobs.filter(j => j.status === 'running');
  const queued  = jobs.filter(j => j.status === 'queued');
  const el = document.getElementById('queue-page');
  if (!el) return;

  if (jobs.length === 0) {
    el.innerHTML = '<div class="empty">No active downloads.</div>';
    return;
  }

  let html = '';

  if (running.length) {
    html += `<p style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Running</p>
             <hr class="divider" style="margin-top:0">`;
    html += running.map(j => jobCard(j)).join('');
  }

  if (queued.length) {
    html += `<p style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px;margin-top:${running.length ? 28 : 0}px">Pending</p>
             <hr class="divider" style="margin-top:0">`;
    html += queued.map(j => jobCard(j)).join('');
  }

  el.innerHTML = html;
}

function jobCard(j) {
  return `
    <div class="job-row" id="job-${j.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="min-width:0;flex:1">
          <div class="job-title">${esc(j.title || j.url)}</div>
          <div class="job-meta">
            ${j.format.toUpperCase()}
            ${j.size_mb ? '· ' + j.size_mb.toFixed(0) + ' MB' : ''}
          </div>
          ${j.status === 'running' ? `
            <div class="progress-track">
              <div class="progress-fill" style="width:${j.progress}%"></div>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">${Math.round(j.progress)}%</div>
          ` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span class="status-${j.status}">${j.status}</span>
          ${j.status === 'queued' ? `<button class="btn-ghost" onclick="cancelJob('${j.id}')">×</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ─── History page ─────────────────────────────────────────────────────────────

function initHistory() {
  let limit = 20;
  loadHistory(limit);

  const moreBtn = document.getElementById('load-more');
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      limit += 20;
      loadHistory(limit);
    });
  }
}

async function loadHistory(limit) {
  const el = document.getElementById('hist-body');
  const moreBtn = document.getElementById('load-more');
  if (!el) return;

  try {
    const records = await api('GET', `/api/downloads?limit=${limit}`);

    if (records.length === 0) {
      el.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px 0;color:var(--muted)">No downloads yet.</td></tr>';
      if (moreBtn) moreBtn.style.display = 'none';
      return;
    }

    el.innerHTML = records.map(r => `
      <tr>
        <td>
          <span style="font-size:14px">${esc(r.title || r.url)}</span><br>
          <span style="font-size:12px;color:var(--muted)">${esc(r.url)}</span>
        </td>
        <td class="muted">${r.format.toUpperCase()}</td>
        <td class="muted">${fmtDate(r.completed_at || r.created_at)}</td>
      </tr>
    `).join('');

    if (moreBtn) moreBtn.style.display = records.length < limit ? 'none' : 'inline-block';
  } catch (err) {
    el.innerHTML = `<tr><td colspan="3" style="color:var(--danger);padding:20px 0">${esc(err.message)}</td></tr>`;
  }
}

// ─── Settings page ────────────────────────────────────────────────────────────

function initSettings() {
  loadSettings();

  // Cookie upload
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('cookie-file');
  const uploadStatus = document.getElementById('upload-status');

  if (zone) {
    zone.addEventListener('click', () => fileInput.click());

    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) uploadCookies(file, uploadStatus);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) uploadCookies(fileInput.files[0], uploadStatus);
    });
  }

  // API key
  const keyInput = document.getElementById('api-key-input');
  const saveKey  = document.getElementById('save-key-btn');
  if (keyInput) {
    keyInput.value = localStorage.getItem('yt-z-api-key') || '';
    saveKey.addEventListener('click', () => {
      const val = keyInput.value.trim();
      if (val) localStorage.setItem('yt-z-api-key', val);
      else localStorage.removeItem('yt-z-api-key');
      location.reload();
    });
  }
}

async function loadSettings() {
  try {
    const s = await api('GET', '/api/settings');
    const statusEl = document.getElementById('cookie-status');
    const pathEl   = document.getElementById('storage-path');
    if (statusEl) {
      statusEl.textContent = s.cookies_status === 'ok'
        ? `cookies.json — last updated ${s.cookies_updated || 'unknown'}`
        : 'No cookie file found. Downloads may fail on restricted content.';
      statusEl.style.color = s.cookies_status === 'ok' ? 'var(--success)' : 'var(--muted)';
    }
    if (pathEl) pathEl.textContent = s.download_path;
  } catch (_) {}
}

async function uploadCookies(file, statusEl) {
  if (!file.name.endsWith('.json')) {
    if (statusEl) { statusEl.textContent = 'File must be a .json file.'; statusEl.style.color = 'var(--danger)'; }
    return;
  }
  const fd = new FormData();
  fd.append('file', file);
  try {
    await apiUpload('/api/settings/cookies', fd);
    if (statusEl) { statusEl.textContent = 'Cookie file updated.'; statusEl.style.color = 'var(--success)'; }
    loadSettings();
  } catch (err) {
    if (statusEl) { statusEl.textContent = err.message; statusEl.style.color = 'var(--danger)'; }
  }
}

// ─── Shared actions ───────────────────────────────────────────────────────────

async function cancelJob(id) {
  try {
    await api('DELETE', `/api/queue/${id}`);
  } catch (_) {}
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (_) { return iso; }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  refreshQueueBadge();
  setInterval(refreshQueueBadge, 5000);

  // Mark active nav link
  const path = location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  const page = document.body.dataset.page;
  if (page === 'download') initDownload();
  if (page === 'queue')    initQueue();
  if (page === 'history')  initHistory();
  if (page === 'settings') initSettings();
});
