/**
 * Apple Notes Web App — script.js
 *
 * Architecture:
 *   State     → app-wide state object
 *   DataStore → CRUD operations on notes array
 *   UI        → DOM rendering helpers
 *   Router    → list ↔ detail navigation
 *   Admin     → password gate + edit mode
 *   Events    → all event listeners
 *
 * GitHub Pages deployment:
 *   1. Push all files to your repo.
 *   2. Settings → Pages → Source: main / root
 *   3. Visit https://<you>.github.io/<repo>/
 *   4. notes.json is read from the same directory.
 *   5. Admin edits generate a new notes.json download —
 *      replace the file in the repo to persist changes.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────────── */
const State = {
  notes:        [],          // Full notes array
  filtered:     [],          // Search-filtered view
  adminMode:    false,       // Is developer mode active?
  openNote:     null,        // Currently opened note object
  editingNote:  null,        // Note being created/edited (null = new)
  deleteTarget: null,        // Note queued for deletion
  pinBuffer:    '',          // PIN input accumulator
};

/* Developer password — obfuscated slightly (reverse of actual) */
const _p = ['0', '3', '1', '0'];
const ADMIN_PASSWORD = _p.join('');

/* ─────────────────────────────────────────────────────────────
   DATA STORE
───────────────────────────────────────────────────────────── */
const DataStore = {
  /** Load notes.json from the same origin */
  async load() {
    try {
      const res = await fetch('./notes.json?v=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      State.notes = await res.json();
      State.filtered = [...State.notes];
      return true;
    } catch (err) {
      console.warn('[Notes] Could not load notes.json:', err.message);
      State.notes = [];
      State.filtered = [];
      return false;
    }
  },

  /** Filter notes by search query */
  search(q) {
    const query = q.trim().toLowerCase();
    if (!query) {
      State.filtered = [...State.notes];
    } else {
      State.filtered = State.notes.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      );
    }
  },

  /** Create a new note */
  create({ title, content }) {
    const note = {
      id:        'note-' + Date.now(),
      title:     title.trim() || 'Sin título',
      content:   content.trim(),
      createdAt: new Date().toISOString(),
      sender:    'Marcelo',
      receiver:  'Dianney',
    };
    State.notes.unshift(note);
    State.filtered = [...State.notes];
    return note;
  },

  /** Update an existing note */
  update(id, { title, content }) {
    const idx = State.notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    State.notes[idx] = {
      ...State.notes[idx],
      title:   title.trim() || 'Sin título',
      content: content.trim(),
    };
    State.filtered = [...State.notes];
    return State.notes[idx];
  },

  /** Remove a note by id */
  delete(id) {
    State.notes    = State.notes.filter(n => n.id !== id);
    State.filtered = [...State.notes];
  },

  /** Export current notes as a downloadable JSON file */
  export() {
    const json    = JSON.stringify(State.notes, null, 2);
    const blob    = new Blob([json], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = 'notes.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    UI.toast('notes.json descargado ✓ — súbelo al repositorio');
  },
};

/* ─────────────────────────────────────────────────────────────
   UI HELPERS
───────────────────────────────────────────────────────────── */
const UI = {
  /** Format ISO date to human-friendly string */
  formatDate(iso) {
    const d    = new Date(iso);
    const now  = new Date();
    const diff = (now - d) / 1000;

    if (diff < 60)            return 'Ahora';
    if (diff < 3600)          return Math.floor(diff / 60) + ' min';
    if (diff < 86400)         return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800)        return d.toLocaleDateString('es-MX', { weekday: 'long' });
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  /** First ~120 chars of content for card preview */
  preview(content) {
    const clean = content.replace(/\n+/g, ' ').trim();
    return clean.length > 110 ? clean.slice(0, 110) + '…' : clean;
  },

  /** Build a single note card element */
  buildCard(note) {
    const card = document.createElement('article');
    card.className  = 'note-card';
    card.dataset.id = note.id;

    card.innerHTML = `
      <div class="card-meta">
        <span class="card-date">${UI.formatDate(note.createdAt)}</span>
        <div class="card-badge">
          <span class="badge-chip badge-sender">${note.sender}</span>
          <span class="badge-chip badge-receiver">${note.receiver}</span>
        </div>
      </div>
      <h2 class="card-title">${escapeHTML(note.title)}</h2>
      <p  class="card-preview">${escapeHTML(UI.preview(note.content))}</p>
      <div class="card-admin-actions ${State.adminMode ? 'visible' : ''}">
        <button class="btn btn-yellow btn-edit-card" data-id="${note.id}">Editar</button>
        <button class="btn btn-red   btn-delete-card" data-id="${note.id}">Eliminar</button>
      </div>
    `;

    return card;
  },

  /** Render the full notes list */
  renderList() {
    const list  = document.getElementById('notes-list');
    const count = document.getElementById('note-count');

    list.innerHTML = '';
    count.textContent = State.filtered.length + ' nota' + (State.filtered.length !== 1 ? 's' : '');

    if (State.filtered.length === 0) {
      list.appendChild(UI.buildEmptyState());
      return;
    }

    const frag = document.createDocumentFragment();
    State.filtered.forEach(n => frag.appendChild(UI.buildCard(n)));
    list.appendChild(frag);
  },

  buildEmptyState() {
    const el = document.createElement('div');
    el.className = 'empty-state';
    el.innerHTML = `
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <p class="empty-title">Sin notas</p>
      <p class="empty-subtitle">No hay notas que mostrar.<br>Las notas aparecerán aquí.</p>
    `;
    return el;
  },

  /** Populate and open the detail screen */
  openDetail(note) {
    document.getElementById('detail-title').textContent = note.title;
    document.getElementById('detail-date').textContent  =
      new Date(note.createdAt).toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    document.getElementById('detail-sender').textContent   = note.sender;
    document.getElementById('detail-receiver').textContent = note.receiver;
    document.getElementById('detail-content').textContent  = note.content;

    // Admin bar in detail
    const adminBar = document.getElementById('detail-admin-bar');
    if (State.adminMode) {
      adminBar.classList.add('visible');
      document.getElementById('detail-edit-btn').dataset.id   = note.id;
      document.getElementById('detail-delete-btn').dataset.id = note.id;
    } else {
      adminBar.classList.remove('visible');
    }

    // Open with animation
    const screen = document.getElementById('detail-screen');
    screen.classList.add('open');
    document.getElementById('list-screen').classList.add('slide-out');

    // Reset scroll
    document.getElementById('detail-body').scrollTop = 0;

    State.openNote = note;
  },

  closeDetail() {
    const screen = document.getElementById('detail-screen');
    screen.classList.remove('open');
    document.getElementById('list-screen').classList.remove('slide-out');
    State.openNote = null;
  },

  /** Show/hide admin FAB and controls */
  applyAdminUI() {
    const fab = document.getElementById('fab-new');
    const ind = document.getElementById('admin-indicator');

    if (State.adminMode) {
      fab.classList.add('visible');
      ind.classList.add('visible');
    } else {
      fab.classList.remove('visible');
      ind.classList.remove('visible');
    }

    // Re-render cards to toggle admin controls
    UI.renderList();
  },

  /** Toast notification */
  toast(msg, duration = 2800) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(UI._toastTimer);
    UI._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  },

  _toastTimer: null,
};

/* ─────────────────────────────────────────────────────────────
   MODALS
───────────────────────────────────────────────────────────── */
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  close(id) {
    const el = document.getElementById(id);
    el.classList.remove('open');
    document.body.style.overflow = '';
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(el => {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  },
};

/* ─────────────────────────────────────────────────────────────
   ADMIN / PASSWORD GATE
───────────────────────────────────────────────────────────── */
const Admin = {
  /** Open the PIN prompt */
  promptPassword() {
    State.pinBuffer = '';
    Admin._updateDots();
    Modal.open('password-modal');
    // Focus trap handled by keypad buttons
  },

  /** Add a digit to the PIN buffer */
  pressKey(digit) {
    if (State.pinBuffer.length >= 4) return;
    State.pinBuffer += digit;
    Admin._updateDots();
    if (State.pinBuffer.length === 4) {
      setTimeout(Admin._checkPin, 120);
    }
  },

  deleteKey() {
    State.pinBuffer = State.pinBuffer.slice(0, -1);
    Admin._updateDots();
  },

  _checkPin() {
    if (State.pinBuffer === ADMIN_PASSWORD) {
      Modal.close('password-modal');
      State.adminMode = true;
      UI.applyAdminUI();
      UI.toast('Modo desarrollador activado 🔓');
    } else {
      // Error shake
      document.querySelectorAll('.pin-dot').forEach(d => {
        d.classList.remove('filled');
        d.classList.add('error');
        setTimeout(() => d.classList.remove('error'), 450);
      });
      State.pinBuffer = '';
      setTimeout(Admin._updateDots, 460);
    }
  },

  _updateDots() {
    document.querySelectorAll('.pin-dot').forEach((dot, i) => {
      dot.classList.toggle('filled', i < State.pinBuffer.length);
    });
  },

  /** Open create-note sheet */
  openCreate() {
    State.editingNote = null;
    document.getElementById('edit-modal-title').textContent  = 'Nueva nota';
    document.getElementById('edit-title-input').value        = '';
    document.getElementById('edit-content-input').value      = '';
    Modal.open('note-edit-modal');
    setTimeout(() => document.getElementById('edit-title-input').focus(), 350);
  },

  /** Open edit sheet for a given note id */
  openEdit(id) {
    const note = State.notes.find(n => n.id === id);
    if (!note) return;
    State.editingNote = note;
    document.getElementById('edit-modal-title').textContent = 'Editar nota';
    document.getElementById('edit-title-input').value       = note.title;
    document.getElementById('edit-content-input').value     = note.content;
    Modal.open('note-edit-modal');
    setTimeout(() => document.getElementById('edit-title-input').focus(), 350);
  },

  /** Save the current note (create or update) */
  saveNote() {
    const title   = document.getElementById('edit-title-input').value;
    const content = document.getElementById('edit-content-input').value;

    if (!title.trim() && !content.trim()) {
      UI.toast('Escribe algo primero');
      return;
    }

    if (State.editingNote) {
      DataStore.update(State.editingNote.id, { title, content });
      UI.toast('Nota actualizada ✓');
    } else {
      DataStore.create({ title, content });
      UI.toast('Nota creada ✓');
    }

    Modal.close('note-edit-modal');
    UI.renderList();
    DataStore.export();
  },

  /** Prompt delete confirmation */
  confirmDelete(id) {
    State.deleteTarget = id;
    const note = State.notes.find(n => n.id === id);
    document.getElementById('delete-note-title').textContent =
      note ? `"${note.title}"` : 'esta nota';
    Modal.open('delete-confirm-modal');
  },

  /** Execute deletion after confirmation */
  executeDelete() {
    if (!State.deleteTarget) return;

    // If deleting the currently open note, close detail first
    if (State.openNote && State.openNote.id === State.deleteTarget) {
      UI.closeDetail();
    }

    DataStore.delete(State.deleteTarget);
    State.deleteTarget = null;
    Modal.close('delete-confirm-modal');
    UI.renderList();
    UI.toast('Nota eliminada');
    DataStore.export();
  },
};

/* ─────────────────────────────────────────────────────────────
   EVENTS
───────────────────────────────────────────────────────────── */
function bindEvents() {
  /* ── Keyboard shortcut: CTRL + SPACE → admin prompt ── */
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      if (!State.adminMode) {
        Admin.promptPassword();
      } else {
        // Toggle admin off
        State.adminMode = false;
        UI.applyAdminUI();
        UI.toast('Modo desarrollador desactivado 🔒');
      }
    }
    if (e.key === 'Escape') Modal.closeAll();
  });

  /* ── Scroll: header shrinks ── */
  const listHeader = document.querySelector('.list-header');
  window.addEventListener('scroll', () => {
    listHeader.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  /* ── Search ── */
  document.getElementById('search-input').addEventListener('input', e => {
    DataStore.search(e.target.value);
    UI.renderList();
  });

  /* ── Note list clicks (delegation) ── */
  document.getElementById('notes-list').addEventListener('click', e => {
    // Edit button
    const editBtn = e.target.closest('.btn-edit-card');
    if (editBtn) { e.stopPropagation(); Admin.openEdit(editBtn.dataset.id); return; }

    // Delete button
    const delBtn = e.target.closest('.btn-delete-card');
    if (delBtn) { e.stopPropagation(); Admin.confirmDelete(delBtn.dataset.id); return; }

    // Card click → open detail
    const card = e.target.closest('.note-card');
    if (card) {
      // Ripple
      const ripple = document.createElement('div');
      ripple.className = 'card-ripple';
      card.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());

      const note = State.notes.find(n => n.id === card.dataset.id);
      if (note) UI.openDetail(note);
    }
  });

  /* ── Detail — back button ── */
  document.getElementById('back-btn').addEventListener('click', UI.closeDetail);

  /* ── Detail — edit/delete (admin) ── */
  document.getElementById('detail-edit-btn').addEventListener('click', e => {
    Admin.openEdit(e.currentTarget.dataset.id);
  });
  document.getElementById('detail-delete-btn').addEventListener('click', e => {
    Admin.confirmDelete(e.currentTarget.dataset.id);
  });

  /* ── FAB — new note ── */
  document.getElementById('fab-new').addEventListener('click', Admin.openCreate);

  /* ── Password modal — numpad ── */
  document.getElementById('numpad').addEventListener('click', e => {
    const key = e.target.closest('.numpad-key');
    if (!key) return;
    const val = key.dataset.value;
    if (val === 'delete') Admin.deleteKey();
    else if (val === 'cancel') { State.pinBuffer = ''; Admin._updateDots(); Modal.close('password-modal'); }
    else Admin.pressKey(val);
  });

  /* ── Edit modal — save / cancel ── */
  document.getElementById('save-note-btn').addEventListener('click', Admin.saveNote);
  document.getElementById('cancel-edit-btn').addEventListener('click', () => Modal.close('note-edit-modal'));

  /* ── Delete confirm ── */
  document.getElementById('confirm-delete-btn').addEventListener('click', Admin.executeDelete);
  document.getElementById('cancel-delete-btn').addEventListener('click', () => Modal.close('delete-confirm-modal'));

  /* ── Tap overlay backdrop to dismiss ── */
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) Modal.close(overlay.id);
    });
  });

  /* ── Swipe down to close detail (touch) ── */
  let touchStartY = 0;
  const detailEl = document.getElementById('detail-screen');
  detailEl.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  detailEl.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientY - touchStartY;
    const bodyScrollTop = document.getElementById('detail-body').scrollTop;
    if (delta > 80 && bodyScrollTop <= 0) UI.closeDetail();
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────── */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────────── */
async function init() {
  await DataStore.load();
  UI.renderList();
  bindEvents();

  // Show footer note count once loaded
  document.getElementById('note-count').textContent =
    State.notes.length + ' nota' + (State.notes.length !== 1 ? 's' : '');
}

document.addEventListener('DOMContentLoaded', init);
