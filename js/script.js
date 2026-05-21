/**
 * Apple Notes Web App — script.js v2
 *
 * Key change: Card-expand animation
 *   - Grid layout instead of list
 *   - Clicking a card reads its getBoundingClientRect()
 *   - A fixed #card-expand overlay is placed at exactly the card's rect
 *   - CSS transition animates it to fill the full viewport
 *   - On close, the reverse plays — the panel shrinks back to the card's position
 *   - This creates the iOS "hero" expansion feel without any library
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────────── */
const State = {
  notes:        [],
  filtered:     [],
  adminMode:    false,
  openNote:     null,
  editingNote:  null,
  deleteTarget: null,
  pinBuffer:    '',
  expanding:    false,   // lock during animation
};

const _p = ['0','3','1','0'];
const ADMIN_PASSWORD = _p.join('');

/* ─────────────────────────────────────────────────────────────
   DATA STORE
───────────────────────────────────────────────────────────── */
const DataStore = {
  async load() {
    try {
      const res = await fetch('./notes.json?v=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      State.notes    = await res.json();
      State.filtered = [...State.notes];
      return true;
    } catch (err) {
      console.warn('[Notes] Could not load notes.json:', err.message);
      State.notes = State.filtered = [];
      return false;
    }
  },

  search(q) {
    const query = q.trim().toLowerCase();
    State.filtered = query
      ? State.notes.filter(n =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query))
      : [...State.notes];
  },

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

  update(id, { title, content }) {
    const idx = State.notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    State.notes[idx] = { ...State.notes[idx], title: title.trim() || 'Sin título', content: content.trim() };
    State.filtered = [...State.notes];
    return State.notes[idx];
  },

  delete(id) {
    State.notes    = State.notes.filter(n => n.id !== id);
    State.filtered = [...State.notes];
  },

  export() {
    const blob = new Blob([JSON.stringify(State.notes, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'notes.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    UI.toast('notes.json descargado ✓ — súbelo al repositorio');
  },
};

/* ─────────────────────────────────────────────────────────────
   EXPAND ENGINE
   Animates any card element → fullscreen → back
───────────────────────────────────────────────────────────── */
const Expander = {
  _panel:    null,
  _scrim:    null,
  _sourceRect: null,   // original card rect, used for collapse

  init() {
    this._panel = document.getElementById('card-expand');
    this._scrim = document.getElementById('expand-scrim');

    // Back button inside expand panel
    document.getElementById('expand-back-btn').addEventListener('click', () => Expander.close());

    // Swipe down to close
    let ty0 = 0;
    this._panel.addEventListener('touchstart', e => { ty0 = e.touches[0].clientY; }, { passive: true });
    this._panel.addEventListener('touchend', e => {
      const body = document.getElementById('expand-body');
      if (e.changedTouches[0].clientY - ty0 > 80 && body.scrollTop <= 0) Expander.close();
    }, { passive: true });

    // Admin buttons inside expand panel
    document.getElementById('expand-edit-btn').addEventListener('click', e => {
      Admin.openEdit(e.currentTarget.dataset.id);
    });
    document.getElementById('expand-delete-btn').addEventListener('click', e => {
      Admin.confirmDelete(e.currentTarget.dataset.id);
    });
  },

  /**
   * Expand `cardEl` to fullscreen and show `note` content.
   * @param {HTMLElement} cardEl - The clicked .note-card element
   * @param {Object} note
   */
  open(cardEl, note) {
    if (State.expanding) return;
    State.expanding = true;
    State.openNote  = note;

    const panel  = this._panel;
    const scrim  = this._scrim;

    // 1. Read card's position in the viewport
    const rect = cardEl.getBoundingClientRect();
    this._sourceRect = rect;

    // 2. Populate content (hidden, fades in once expanded)
    this._populate(note);

    // 3. Place panel exactly over the card
    panel.style.transition = 'none';
    panel.style.top        = rect.top  + 'px';
    panel.style.left       = rect.left + 'px';
    panel.style.width      = rect.width  + 'px';
    panel.style.height     = rect.height + 'px';
    panel.style.borderRadius = '18px';
    panel.style.opacity    = '1';
    panel.style.transform  = 'none';
    panel.classList.add('expanding');
    panel.classList.remove('expanded');

    // 4. Force paint, then animate to fullscreen
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Target: full viewport (accounting for max-width container)
        const appEl   = document.getElementById('app');
        const appRect = appEl.getBoundingClientRect();

        panel.style.transition = [
          'top 420ms cubic-bezier(0.32, 0.72, 0, 1)',
          'left 420ms cubic-bezier(0.32, 0.72, 0, 1)',
          'width 420ms cubic-bezier(0.32, 0.72, 0, 1)',
          'height 420ms cubic-bezier(0.32, 0.72, 0, 1)',
          'border-radius 420ms cubic-bezier(0.32, 0.72, 0, 1)',
        ].join(', ');

        panel.style.top    = appRect.top  + 'px';
        panel.style.left   = appRect.left + 'px';
        panel.style.width  = appRect.width  + 'px';
        panel.style.height = window.innerHeight + 'px';
        panel.style.borderRadius = '0px';

        // Dim background
        scrim.classList.add('active');
        // Fade list
        document.getElementById('list-screen').classList.add('dimmed');

        // After expand animation, show content
        setTimeout(() => {
          panel.classList.add('expanded');
          State.expanding = false;
        }, 430);
      });
    });
  },

  close() {
    if (State.expanding) return;
    State.expanding = true;

    const panel = this._panel;
    const scrim = this._scrim;
    const rect  = this._sourceRect;

    // Hide content immediately
    panel.classList.remove('expanded');

    // Small delay so content fade-out plays first
    setTimeout(() => {
      panel.style.transition = [
        'top 380ms cubic-bezier(0.32, 0.72, 0, 1)',
        'left 380ms cubic-bezier(0.32, 0.72, 0, 1)',
        'width 380ms cubic-bezier(0.32, 0.72, 0, 1)',
        'height 380ms cubic-bezier(0.32, 0.72, 0, 1)',
        'border-radius 380ms cubic-bezier(0.32, 0.72, 0, 1)',
        'opacity 200ms 180ms ease',
      ].join(', ');

      panel.style.top          = rect.top    + 'px';
      panel.style.left         = rect.left   + 'px';
      panel.style.width        = rect.width  + 'px';
      panel.style.height       = rect.height + 'px';
      panel.style.borderRadius = '18px';
      panel.style.opacity      = '0';

      scrim.classList.remove('active');
      document.getElementById('list-screen').classList.remove('dimmed');

      setTimeout(() => {
        panel.classList.remove('expanding');
        panel.style.opacity = '0';
        State.openNote  = null;
        State.expanding = false;
        // Reset expand-body scroll
        document.getElementById('expand-body').scrollTop = 0;
      }, 390);
    }, 80);
  },

  _populate(note) {
    document.getElementById('expand-title').textContent = note.title;
    document.getElementById('expand-date').textContent  =
      new Date(note.createdAt).toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    document.getElementById('expand-sender').textContent   = note.sender;
    document.getElementById('expand-receiver').textContent = note.receiver;
    document.getElementById('expand-content').textContent  = note.content;

    const adminBar = document.getElementById('expand-admin-bar');
    if (State.adminMode) {
      adminBar.classList.add('visible');
      document.getElementById('expand-edit-btn').dataset.id   = note.id;
      document.getElementById('expand-delete-btn').dataset.id = note.id;
    } else {
      adminBar.classList.remove('visible');
    }
  },
};

/* ─────────────────────────────────────────────────────────────
   UI HELPERS
───────────────────────────────────────────────────────────── */
const UI = {
  formatDate(iso) {
    const d    = new Date(iso);
    const now  = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60)     return 'Ahora';
    if (diff < 3600)   return Math.floor(diff / 60) + 'm';
    if (diff < 86400)  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800) return d.toLocaleDateString('es-MX', { weekday: 'short' });
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  },

  preview(content) {
    const clean = content.replace(/\n+/g, ' ').trim();
    return clean.length > 90 ? clean.slice(0, 90) + '…' : clean;
  },

  buildCard(note) {
    const card = document.createElement('article');
    card.className  = 'note-card';
    card.dataset.id = note.id;

    card.innerHTML = `
      <span class="card-date">${UI.formatDate(note.createdAt)}</span>
      <h2 class="card-title">${escapeHTML(note.title)}</h2>
      <p  class="card-preview">${escapeHTML(UI.preview(note.content))}</p>
      <p  class="card-from">
        <strong>${escapeHTML(note.sender)}</strong> → <strong>${escapeHTML(note.receiver)}</strong>
      </p>
      <div class="card-admin-actions ${State.adminMode ? 'visible' : ''}">
        <button class="btn btn-yellow btn-edit-card"   data-id="${note.id}">Editar</button>
        <button class="btn btn-red   btn-delete-card"  data-id="${note.id}">Eliminar</button>
      </div>
    `;
    return card;
  },

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
      <p class="empty-subtitle">Aún no hay notas que mostrar.</p>
    `;
    return el;
  },

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
    UI.renderList();
  },

  toast(msg, duration = 2800) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(UI._tt);
    UI._tt = setTimeout(() => el.classList.remove('show'), duration);
  },
  _tt: null,
};

/* ─────────────────────────────────────────────────────────────
   MODALS
───────────────────────────────────────────────────────────── */
const Modal = {
  open(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
  },
  close(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
    document.body.style.overflow = '';
  },
};

/* ─────────────────────────────────────────────────────────────
   ADMIN
───────────────────────────────────────────────────────────── */
const Admin = {
  promptPassword() {
    State.pinBuffer = '';
    Admin._updateDots();
    Modal.open('password-modal');
  },
  pressKey(digit) {
    if (State.pinBuffer.length >= 4) return;
    State.pinBuffer += digit;
    Admin._updateDots();
    if (State.pinBuffer.length === 4) setTimeout(Admin._checkPin, 120);
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
      document.querySelectorAll('.pin-dot').forEach(d => {
        d.classList.remove('filled');
        d.classList.add('error');
        setTimeout(() => d.classList.remove('error'), 440);
      });
      State.pinBuffer = '';
      setTimeout(Admin._updateDots, 450);
    }
  },
  _updateDots() {
    document.querySelectorAll('.pin-dot').forEach((dot, i) => {
      dot.classList.toggle('filled', i < State.pinBuffer.length);
    });
  },
  openCreate() {
    State.editingNote = null;
    document.getElementById('edit-modal-title').textContent = 'Nueva nota';
    document.getElementById('edit-title-input').value       = '';
    document.getElementById('edit-content-input').value     = '';
    Modal.open('note-edit-modal');
    setTimeout(() => document.getElementById('edit-title-input').focus(), 360);
  },
  openEdit(id) {
    const note = State.notes.find(n => n.id === id);
    if (!note) return;
    State.editingNote = note;
    document.getElementById('edit-modal-title').textContent = 'Editar nota';
    document.getElementById('edit-title-input').value       = note.title;
    document.getElementById('edit-content-input').value     = note.content;
    Modal.open('note-edit-modal');
    setTimeout(() => document.getElementById('edit-title-input').focus(), 360);
  },
  saveNote() {
    const title   = document.getElementById('edit-title-input').value;
    const content = document.getElementById('edit-content-input').value;
    if (!title.trim() && !content.trim()) { UI.toast('Escribe algo primero'); return; }
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
  confirmDelete(id) {
    State.deleteTarget = id;
    const note = State.notes.find(n => n.id === id);
    document.getElementById('delete-note-title').textContent = note ? `"${note.title}"` : 'esta nota';
    Modal.open('delete-confirm-modal');
  },
  executeDelete() {
    if (!State.deleteTarget) return;
    if (State.openNote && State.openNote.id === State.deleteTarget) Expander.close();
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
  // CTRL+SPACE → admin toggle
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      if (!State.adminMode) {
        Admin.promptPassword();
      } else {
        State.adminMode = false;
        UI.applyAdminUI();
        UI.toast('Modo desarrollador desactivado 🔒');
      }
    }
    if (e.key === 'Escape') {
      if (State.openNote) Expander.close();
      else Modal.closeAll();
    }
  });

  // Sticky header tint on scroll
  const listHeader = document.querySelector('.list-header');
  document.addEventListener('scroll', () => {
    listHeader.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

  // Search
  document.getElementById('search-input').addEventListener('input', e => {
    DataStore.search(e.target.value);
    UI.renderList();
  });

  // Grid clicks (delegation)
  document.getElementById('notes-list').addEventListener('click', e => {
    const editBtn = e.target.closest('.btn-edit-card');
    if (editBtn) { e.stopPropagation(); Admin.openEdit(editBtn.dataset.id); return; }

    const delBtn = e.target.closest('.btn-delete-card');
    if (delBtn) { e.stopPropagation(); Admin.confirmDelete(delBtn.dataset.id); return; }

    const card = e.target.closest('.note-card');
    if (card && !State.expanding) {
      const note = State.notes.find(n => n.id === card.dataset.id);
      if (note) Expander.open(card, note);
    }
  });

  // FAB
  document.getElementById('fab-new').addEventListener('click', Admin.openCreate);

  // PIN numpad
  document.getElementById('numpad').addEventListener('click', e => {
    const key = e.target.closest('.numpad-key');
    if (!key) return;
    const val = key.dataset.value;
    if (val === 'delete') Admin.deleteKey();
    else if (val === 'cancel') { State.pinBuffer = ''; Admin._updateDots(); Modal.close('password-modal'); }
    else Admin.pressKey(val);
  });

  // Edit modal
  document.getElementById('save-note-btn').addEventListener('click', Admin.saveNote);
  document.getElementById('cancel-edit-btn').addEventListener('click', () => Modal.close('note-edit-modal'));

  // Delete modal
  document.getElementById('confirm-delete-btn').addEventListener('click', Admin.executeDelete);
  document.getElementById('cancel-delete-btn').addEventListener('click', () => Modal.close('delete-confirm-modal'));

  // Tap backdrop to close modals
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) Modal.close(overlay.id); });
  });
}

/* ─────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────── */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────────── */
async function init() {
  Expander.init();
  await DataStore.load();
  UI.renderList();
  bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
