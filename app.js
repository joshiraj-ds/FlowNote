let notes = [];
let activeNote = null;
let searchQuery = "";

// INIT
function init() {
   const toggle = document.getElementById("theme-toggle");

// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark");
    toggle.checked = true;
}

// Toggle event
toggle.addEventListener("change", () => {
    if (toggle.checked) {
        document.body.classList.add("dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.body.classList.remove("dark");
        localStorage.setItem("theme", "light");
    }
});
}

// SAVE STORAGE
function saveToStorage() {
    localStorage.setItem('quicknotes', JSON.stringify(notes));
}

// RENDER LIST
function renderNotesList() {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    
    
    const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery) ||
    note.body.toLowerCase().includes(searchQuery)
);

filteredNotes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-item' + (activeNote && activeNote.id === note.id ? ' active' : '');
        div.innerHTML = `
            <h3>${note.title || 'Untitled'}</h3>
            <p>${note.body.substring(0, 60) || 'No content'}</p>
        `;
        div.onclick = () => selectNote(note);
        list.appendChild(div);
    });

    document.getElementById('notes-count').textContent =
        `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
}

// SELECT NOTE
function selectNote(note) {
    activeNote = note;

    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('editor').style.display = 'flex';

    document.getElementById('note-title').value = note.title;
    document.getElementById('note-body').value = note.body;

    renderNotesList();
}

// ADD NOTE
function addNote() {
    const newNote = {
        id: Date.now(),
        title: '',
        body: ''
    };

    notes.unshift(newNote);
    activeNote = newNote;

    saveToStorage();
    renderNotesList();
    selectNote(newNote);
}

// SAVE NOTE
function saveNote() {
    if (!activeNote) return;

    activeNote.title = document.getElementById('note-title').value;
    activeNote.body = document.getElementById('note-body').value;

    saveToStorage();
    renderNotesList();
}

// DELETE NOTE
function deleteNote() {
    if (!activeNote) return;

    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(n => n.id !== activeNote.id);
        activeNote = null;

        saveToStorage();
        renderNotesList();

        document.getElementById('editor').style.display = 'none';
        document.getElementById('empty-state').style.display = 'flex';
    }
}

// AUTO SAVE EVENTS
document.addEventListener('DOMContentLoaded', () => {
    init();
     const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderNotesList();
});
    document.getElementById('note-title').addEventListener('input', saveNote);
    document.getElementById('note-body').addEventListener('input', saveNote);
});