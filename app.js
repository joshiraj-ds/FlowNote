let notes       = JSON.parse(localStorage.getItem('flownote') || '[]');
let activeNote  = null;
let searchQuery = '';
let toastTimer  = null;
let saveTimer   = null;

// ── HELPERS ──
function getBody()  { return document.getElementById('note-body'); }
function getTitle() { return document.getElementById('note-title'); }

// ── TOAST ──
function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ── THEME ──
const themeToggle = document.getElementById('theme-toggle');
const themeLabel  = document.getElementById('theme-label');

function applyTheme(dark) {
    document.body.classList.toggle('dark', dark);
    themeLabel.textContent = dark ? 'Dark' : 'Light';
    themeToggle.checked    = dark;
}
applyTheme(localStorage.getItem('theme') === 'dark');
themeToggle.addEventListener('change', () => {
    const dark = themeToggle.checked;
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    applyTheme(dark);
});

// ── STORAGE ──
function persist() {
    localStorage.setItem('flownote', JSON.stringify(notes));
}

// Debounced save 
function debounceSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNote, 300);
}

// ── RENDER SIDEBAR LIST ──
function renderList() {
    const list = document.getElementById('notes-list');

    const filtered = notes
        .filter(n =>
            n.title.toLowerCase().includes(searchQuery) ||
            stripHtml(n.body).toLowerCase().includes(searchQuery)
        )
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    list.innerHTML = '';

    if (filtered.length === 0 && searchQuery) {
        list.innerHTML = '<div class="no-results">No notes found</div>';
    }

    filtered.forEach(n => {
        const div  = document.createElement('div');
        div.className = 'note-item' +
            (activeNote?.id === n.id ? ' active' : '') +
            (n.pinned ? ' pinned' : '');

        const date    = new Date(n.updated || n.id)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const preview = stripHtml(n.body).substring(0, 80) || 'No content…';

        div.innerHTML = `
            <div class="note-item-title">${n.pinned ? '📌 ' : ''}${escHtml(n.title) || 'Untitled Note'}</div>
            <div class="note-item-preview">${escHtml(preview)}</div>
            <div class="note-item-date">${date}</div>
        `;
        div.onclick = () => openNote(n);
        list.appendChild(div);
    });

    document.getElementById('notes-count').textContent =
        `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
}

function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return d.textContent || '';
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── OPEN NOTE ──
function openNote(note) {
    activeNote = note;

    document.getElementById('empty-state').style.display = 'none';
    const editor = document.getElementById('editor');
    editor.classList.remove('visible');
    void editor.offsetWidth;
    editor.classList.add('visible');

    getTitle().value    = note.title;
    getBody().innerHTML = note.body || '';

    updatePinBtn();
    updateMeta();
    updateStats();
    renderList();

    // Put cursor at end
    getBody().focus();
    const range = document.createRange();
    const sel   = window.getSelection();
    range.selectNodeContents(getBody());
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

// ── PIN ──
function togglePin() {
    if (!activeNote) return;
    activeNote.pinned = !activeNote.pinned;
    persist();
    updatePinBtn();
    renderList();
    toast(activeNote.pinned ? '📌 Note pinned' : '📌 Note unpinned');
}

function updatePinBtn() {
    const btn = document.getElementById('pin-btn');
    if (!activeNote) return;
    btn.textContent = activeNote.pinned ? '📌 Pinned' : '📌 Pin';
    btn.classList.toggle('pinned', !!activeNote.pinned);
}

// ── META & STATS ──
function updateMeta() {
    if (!activeNote) return;
    const d = new Date(activeNote.updated || activeNote.id);
    document.getElementById('note-meta').textContent =
        'Last edited ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function updateStats() {
    const text  = stripHtml(getBody().innerHTML).trim();
    const words = text ? text.split(/\s+/).length : 0;
    const mins  = Math.max(1, Math.ceil(words / 200));
    document.getElementById('word-count').textContent = `${words} word${words !== 1 ? 's' : ''}`;
    document.getElementById('read-time').textContent  = `${mins} min read`;
}

// ── ADD NOTE ──
function addNote() {
    const note = { id: Date.now(), title: '', body: '', updated: Date.now(), pinned: false };
    notes.unshift(note);
    persist();
    renderList();
    openNote(note);
    setTimeout(() => getTitle().focus(), 60);
}

// ── SAVE ──
function saveNote() {
    if (!activeNote) return;
    activeNote.title   = getTitle().value;
    activeNote.body    = getBody().innerHTML;
    activeNote.updated = Date.now();
    updateMeta();
    updateStats();
    persist();
    updateActiveItem(); 
}

// Update active note item in the sidebar 
function updateActiveItem() {
    const items = document.querySelectorAll('.note-item');
    items.forEach(el => {
        if (el.classList.contains('active')) {
            const titleEl   = el.querySelector('.note-item-title');
            const previewEl = el.querySelector('.note-item-preview');
            if (titleEl)   titleEl.textContent   = (activeNote.pinned ? '📌 ' : '') + (activeNote.title || 'Untitled Note');
            if (previewEl) previewEl.textContent  = stripHtml(activeNote.body).substring(0, 80) || 'No content…';
        }
    });
    document.getElementById('notes-count').textContent =
        `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
}

// ── DELETE ──
function deleteNote() {
    if (!activeNote) return;
    showDeleteModal();
}

function showDeleteModal() {
    const title = activeNote.title || 'Untitled Note';
    document.getElementById('modal-note-title').textContent = `"${title}"`;
    document.getElementById('delete-modal').classList.add('open');
}

function confirmDelete() {
    document.getElementById('delete-modal').classList.remove('open');
    notes = notes.filter(n => n.id !== activeNote.id);
    activeNote = null;
    persist();
    renderList();
    document.getElementById('editor').classList.remove('visible');
    document.getElementById('empty-state').style.display = 'flex';
    toast('🗑 Note deleted');
}

function cancelDelete() {
    document.getElementById('delete-modal').classList.remove('open');
}

// ── DUPLICATE ──
function duplicateNote(event) {
    if (event) event.preventDefault();
    if (!activeNote) return;
    saveNote();
    const copy = {
        id:      Date.now(),
        title:   (activeNote.title || 'Untitled') + ' (Copy)',
        body:    activeNote.body,
        updated: Date.now(),
        pinned:  false
    };
    notes.unshift(copy);
    persist();
    renderList();
    openNote(copy);
    toast('⧉ Note duplicated');
}

// ── COPY ───
function copyNote(event) {
    if (event) event.preventDefault();
    if (!activeNote) return;
    const text = (activeNote.title ? activeNote.title + '\n\n' : '') + stripHtml(activeNote.body);
    navigator.clipboard.writeText(text)
        .then(() => toast('📋 Copied to clipboard'))
        .catch(() => toast('❌ Copy failed'));
}

// ── DOWNLOAD ──
function downloadNote(event) {
    if (event) event.preventDefault();
    if (!activeNote) return;
    saveNote();
    const title   = activeNote.title || 'note';
    const body    = stripHtml(activeNote.body);
    const content = title ? `${title}\n${'─'.repeat(title.length)}\n\n${body}` : body;
    const blob    = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a       = document.createElement('a');
    a.href        = URL.createObjectURL(blob);
    a.download    = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast('⬇ Note downloaded');
}

// ── CLEAR BODY ──
function clearBody(event) {
    if (event) event.preventDefault();
    if (!activeNote) return;
    document.getElementById('clear-modal').classList.add('open');
}

function confirmClear() {
    document.getElementById('clear-modal').classList.remove('open');
    getBody().innerHTML = '';
    saveNote();
    toast('✕ Content cleared');
}

function cancelClear() {
    document.getElementById('clear-modal').classList.remove('open');
}

// ── FIND & REPLACE ──
function toggleFind(event) {
    if (event) event.preventDefault();
    const bar = document.getElementById('find-bar');
    bar.classList.toggle('open');
    if (bar.classList.contains('open')) {
        setTimeout(() => document.getElementById('find-input').focus(), 50);
    } else {
        document.getElementById('find-count').textContent = '';
    }
}

function closeFindBar() {
    document.getElementById('find-bar').classList.remove('open');
    document.getElementById('find-count').textContent = '';
}

function replaceAll() {
    const term    = document.getElementById('find-input').value;
    const replace = document.getElementById('replace-input').value;
    if (!term || !activeNote) return;

    const body = getBody();
    const html = body.innerHTML;

    try {
        const rx    = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const count = (html.match(rx) || []).length;
        if (!count) {
            document.getElementById('find-count').textContent = 'Not found';
            return;
        }
        body.innerHTML = html.replace(rx, replace);
        document.getElementById('find-count').textContent = `${count} replaced`;
        saveNote();
        toast(`🔍 ${count} replacement${count !== 1 ? 's' : ''} made`);
    } catch { /* ignore */ }
}

// Live count
document.getElementById('find-input').addEventListener('input', () => {
    const term = document.getElementById('find-input').value;
    if (!term) { document.getElementById('find-count').textContent = ''; return; }
    try {
        const rx    = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const count = (stripHtml(getBody().innerHTML).match(rx) || []).length;
        document.getElementById('find-count').textContent = count ? `${count} found` : 'Not found';
    } catch { /* ignore */ }
});

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', e => {
    const inBody = document.activeElement === getBody();
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); toggleFind(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && activeNote) { e.preventDefault(); duplicateNote(); }
    // Bold / Italic / Underline are natively handled by contenteditable + browser
});

// ── SEARCH ──
document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase();
    renderList();
});

// ── INPUT LISTENERS ──
getTitle().addEventListener('input', debounceSave);
getBody().addEventListener('input',  debounceSave);

// ── INIT ──
renderList();
if (notes.length > 0) openNote(notes[0]);