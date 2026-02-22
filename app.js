let notes = [];
let activeNote = null;

// Load notes when page opens
function init() {
    const stored = localStorage.getItem('quicknotes');
    if (stored) {
        notes = JSON.parse(stored);
    }
    renderNotesList();
}

// Save notes to local storage
function saveToStorage() {
    localStorage.setItem('quicknotes', JSON.stringify(notes));
}

// Render the notes list
function renderNotesList() {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';

    notes.forEach((note) => {
        const div = document.createElement('div');
        div.className = 'note-item' + (activeNote === note ? ' active' : '');
        div.innerHTML = `
            <h3>${note.title || 'Untitled'}</h3>
            <p>${note.body.substring(0, 60) || 'No content'}</p>
        `;
        div.onclick = () => selectNote(note);
        list.appendChild(div);
    });

    // Update notes count
    document.getElementById('notes-count').textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
}

// Select a note
function selectNote(note) {
    activeNote = note;
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('editor').style.display = 'flex';
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-body').value = note.body;
    renderNotesList();
}

// Add new note
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

// Save current note
function saveNote() {
    if (activeNote) {
        activeNote.title = document.getElementById('note-title').value;
        activeNote.body = document.getElementById('note-body').value;
        saveToStorage();
        renderNotesList();
    }
}

// Delete current note
function deleteNote() {
    if (activeNote) {
        const index = notes.indexOf(activeNote);
        if (index > -1 && confirm('Are you sure you want to delete this note?')) {
            notes.splice(index, 1);
            activeNote = notes.length > 0 ? notes[0] : null;
            saveToStorage();
            renderNotesList();
            
            if (activeNote) {
                selectNote(activeNote);
            } else {
                document.getElementById('empty-state').style.display = 'flex';
                document.getElementById('editor').style.display = 'none';
            }
        }
    }
}

// Start the app
init();