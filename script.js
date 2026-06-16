  // ============================================================
  // STATE — penyimpanan in-memory (catatan tersimpan selama sesi)
  // ============================================================
  // Ambil data dari localStorage jika ada, kalau tidak ada baru pakai array kosong
let notes = JSON.parse(localStorage.getItem('catatan_pro_data')) || [];
let currentNoteId = null;
let toastTimer = null;

  // ============================================================
  // UTILS
  // ============================================================
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function formatDate(isoString) {
    const d = new Date(isoString);
    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const hari = days[d.getDay()];
    const tgl = d.getDate();
    const bln = months[d.getMonth()];
    const thn = d.getFullYear();
    const jam = String(d.getHours()).padStart(2,'0');
    const mnt = String(d.getMinutes()).padStart(2,'0');
    return `${hari}, ${tgl} ${bln} ${thn} · ${jam}:${mnt}`;
  }

  function formatDateShort(isoString) {
    const d = new Date(isoString);
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const today = new Date();
    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      return `Hari ini, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ============================================================
  // RENDER DAFTAR
  // ============================================================
  function renderList() {
    const list = document.getElementById('note-list');
    const count = document.getElementById('note-count');
    const n = notes.length;
    count.textContent = n === 0 ? '' : `${n} catatan`;

    if (n === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-label">Belum ada catatan</div>
          <div class="empty-hint">Ketuk tombol <strong>+</strong> untuk mulai menulis</div>
        </div>`;
      return;
    }

    // Urutkan: terbaru dulu
    const sorted = [...notes].sort((a,b) => new Date(b.diubah) - new Date(a.diubah));
    list.innerHTML = sorted.map(note => {
      const judul = note.judul.trim() || null;
      const isi = note.isi.trim();
      const previewIsi = isi.replace(/\n+/g,' ').slice(0, 120);
      return `
        <div class="note-card" data-id="${note.id}" role="button" tabindex="0" aria-label="Buka catatan: ${judul || 'Tanpa judul'}">
          <div class="note-meta">${formatDateShort(note.diubah)}</div>
          <div class="note-title ${judul ? '' : 'untitled'}">${judul ? escHtml(judul) : 'Tanpa Judul'}</div>
          ${isi ? `<div class="note-preview">${escHtml(previewIsi)}</div>` : ''}
        </div>`;
    }).join('');

    // Event listeners pada kartu
    list.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => openNote(card.dataset.id));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openNote(card.dataset.id); });
    });
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ============================================================
  // NAVIGASI
  // ============================================================
  function openEditor() {
    document.getElementById('app').classList.add('editor-open');
  }

  function closeEditor() {
    document.getElementById('app').classList.remove('editor-open');
    currentNoteId = null;
    renderList();
  }

  function openNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    currentNoteId = id;
    document.getElementById('input-judul').value = note.judul;
    document.getElementById('input-isi').value = note.isi;
    document.getElementById('editor-timestamp').textContent = 'Diubah ' + formatDate(note.diubah);
    openEditor();
    // Fokus ke isi jika judul kosong, else ke isi
    setTimeout(() => {
      document.getElementById(note.judul ? 'input-isi' : 'input-judul').focus();
    }, 300);
  }

  function newNote() {
    const id = generateId();
    const now = new Date().toISOString();
    const note = { id, judul: '', isi: '', dibuat: now, diubah: now };
    notes.unshift(note);
    currentNoteId = id;
    document.getElementById('input-judul').value = '';
    document.getElementById('input-isi').value = '';
    document.getElementById('editor-timestamp').textContent = 'Dibuat ' + formatDate(now);
    openEditor();
    setTimeout(() => document.getElementById('input-judul').focus(), 300);
  }

  // ============================================================
  // SIMPAN
  // ============================================================
  function saveNote() {
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;
  note.judul = document.getElementById('input-judul').value.trim();
  note.isi   = document.getElementById('input-isi').value.trim();
  note.diubah = new Date().toISOString();

  // Hapus jika benar-benar kosong
  if (!note.judul && !note.isi) {
    notes = notes.filter(n => n.id !== currentNoteId);
    
    // TAMBAHKAN INI: Update localStorage jika catatan kosong dihapus
    localStorage.setItem('catatan_pro_data', JSON.stringify(notes));
    
    closeEditor();
    showToast('Catatan kosong dihapus');
    return;
  }

  // TAMBAHKAN INI: Simpan array terbaru ke localStorage dalam bentuk teks JSON
  localStorage.setItem('catatan_pro_data', JSON.stringify(notes));

  showToast('Catatan disimpan ✓');
  document.getElementById('editor-timestamp').textContent = 'Diubah ' + formatDate(note.diubah);
}

  // ============================================================
  // HAPUS
  // ============================================================
  function deleteNote() {
  notes = notes.filter(n => n.id !== currentNoteId);
  
  // TAMBAHKAN INI: Update localStorage setelah catatan dihapus
  localStorage.setItem('catatan_pro_data', JSON.stringify(notes));
  
  closeConfirmOverlay();
  closeEditor();
  showToast('Catatan dihapus');
}

  function openConfirmOverlay() {
    document.getElementById('confirm-overlay').classList.add('show');
  }

  function closeConfirmOverlay() {
    document.getElementById('confirm-overlay').classList.remove('show');
  }

  // ============================================================
  // AUTO-RESIZE JUDUL TEXTAREA
  // ============================================================
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  document.getElementById('fab-new').addEventListener('click', newNote);
  document.getElementById('btn-back').addEventListener('click', () => {
    saveNote();
    closeEditor();
  });
  document.getElementById('btn-save').addEventListener('click', () => {
    saveNote();
  });
  document.getElementById('btn-delete').addEventListener('click', openConfirmOverlay);
  document.getElementById('btn-cancel-confirm').addEventListener('click', closeConfirmOverlay);
  document.getElementById('btn-delete-confirm').addEventListener('click', deleteNote);

  // Tutup overlay saat klik luar sheet
  document.getElementById('confirm-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeConfirmOverlay();
  });

  // Auto-resize judul
  const judulInput = document.getElementById('input-judul');
  judulInput.addEventListener('input', () => autoResize(judulInput));

  // Simpan dengan Ctrl+S / Cmd+S
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (document.getElementById('app').classList.contains('editor-open')) saveNote();
    }
    if (e.key === 'Escape') {
      if (document.getElementById('confirm-overlay').classList.contains('show')) {
        closeConfirmOverlay();
      } else if (document.getElementById('app').classList.contains('editor-open')) {
        saveNote();
        closeEditor();
      }
    }
  });

  // ============================================================
  // INIT
  // ============================================================
  renderList();
