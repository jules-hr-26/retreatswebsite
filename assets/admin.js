
var currentAdmin = null;

// ── Init ─────────────────────────────────────────────────────────
(async function init() {
  try {
    var [statsData, me] = await Promise.all([
      api('GET', '?action=stats'),
      api('GET', '?action=me').catch(() => null),
    ]);
    loadStats(statsData);
    if (me) {
      currentAdmin = { role: me.role };
      var displayName = [me.firstName, me.lastName].filter(Boolean).join(' ') || me.email;
      document.getElementById('admin-name').textContent = displayName;
      document.getElementById('admin-role').textContent = me.role === 'super_admin' ? 'Super Admin' : 'Admin';
      document.querySelector('.admin-avatar').textContent = displayName.charAt(0).toUpperCase();
      if (me.role === 'super_admin') {
        document.getElementById('settings-link').style.display = 'flex';
        document.getElementById('allowlist-export-btn').style.display = '';
      }
    }
    document.body.style.opacity = '1';
  } catch(e) {
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('main').style.display = 'none';
    document.getElementById('access-denied').style.display = 'flex';
    document.body.style.opacity = '1';
  }
})();

// ── API helper ───────────────────────────────────────────────────
async function api(method, path, body) {
  var opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch('/api/admin' + path, opts);
  if (res.status === 401) throw new Error('unauthorized');
  var data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'request failed');
  return data;
}

function toast(msg, isError) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (isError ? ' error' : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = '', 3000);
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'}); } catch(e) { return s; }
}

// ── Tabs ─────────────────────────────────────────────────────────
var tabLoaders = { members: loadMembers, allowlist: loadAllowlist, events: loadEvents, proposed: loadProposed, offerings: loadOfferings, forum: function() { loadForum(); loadForumMemberships(); }, settings: loadAdmins };
var tabTitles  = { dashboard:'Dashboard', members:'Members', allowlist:'Members (Allowlist)', events:'Events', proposed:'Proposed Events', offerings:'Offerings', forum:'Forum Moderation', settings:'Admins' };

function errRow(n) {
  return '<tr><td colspan="' + n + '" class="empty" style="line-height:1.8">Something went wrong.<br><em style="font-size:12px;color:var(--ink-light)">Please take a slow breath in… and out, then try again.</em></td></tr>';
}

function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#sidebar nav a').forEach(a => a.classList.remove('active'));
  var panel = document.getElementById('tab-' + tab);
  var link  = document.querySelector('#sidebar nav a[data-tab="' + tab + '"]');
  if (panel) panel.classList.add('active');
  if (link)  link.classList.add('active');
  document.getElementById('topbar-title').textContent = tabTitles[tab] || tab;
  document.getElementById('topbar-actions').innerHTML = '';
  if (tabLoaders[tab]) tabLoaders[tab]();
}

document.querySelectorAll('#sidebar nav a[data-tab]').forEach(function(a) {
  a.addEventListener('click', function() { switchTab(this.dataset.tab); });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

function debounce(fn, ms) { var t; return function() { clearTimeout(t); t = setTimeout(fn, ms); }; }

// ── Dashboard ────────────────────────────────────────────────────
function loadStats(data) {
  document.getElementById('stat-members').textContent  = data.members;
  document.getElementById('stat-allowlist').textContent = data.allowlist;
  document.getElementById('stat-events').textContent   = data.events;
  document.getElementById('stat-offerings').textContent = data.offerings;
}

async function refreshStats() {
  try { var d = await api('GET', '?action=stats'); loadStats(d); } catch(e) {}
}

// ── Members ──────────────────────────────────────────────────────
async function loadMembers() {
  var search = document.getElementById('members-search').value;
  var tbody = document.getElementById('members-tbody');
  tbody.innerHTML = '<tr><td colspan="7"><span class="spinner"></span></td></tr>';
  try {
    var data = await api('GET', '?action=members' + (search ? '&search=' + encodeURIComponent(search) : ''));
    if (!data.members.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">No members found.</td></tr>'; return; }
    tbody.innerHTML = data.members.map(m => `
      <tr>
        <td>${esc(m.first_name)} ${esc(m.last_name)}</td>
        <td class="truncate">${esc(m.auth_email)}</td>
        <td class="truncate">${esc(m.organisation)}</td>
        <td>${esc(m.country)}</td>
        <td class="truncate">${esc(m.cohort)}</td>
        <td>${m.in_directory ? '✓' : ''}</td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" ${actionAttrs("viewMember", [m])}>View</button>
          ${currentAdmin?.role !== 'super_admin' ? '' : `<button class="btn btn-ghost btn-sm" ${actionAttrs("exportMember", [m.auth_email])}>Export</button>
          <button class="btn btn-ghost btn-sm" ${actionAttrs("deleteMember", [m.auth_email, m.first_name + " " + m.last_name])}>Delete</button>
          <button class="btn btn-danger btn-sm" ${actionAttrs("gdprEraseMember", [m.auth_email, m.first_name + " " + m.last_name])}>GDPR Erase</button>`}
        </div></td>
      </tr>`).join('');
  } catch(e) { tbody.innerHTML = errRow(7); }
}

document.getElementById('members-search').addEventListener('keydown', e => { if (e.key === 'Enter') loadMembers(); });
document.getElementById('members-search').addEventListener('input', debounce(loadMembers, 350));

async function exportMember(email) {
  try {
    var data = await api('POST', '', { action: 'export-member', email });
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'member-data-' + email.replace(/[^a-z0-9]/gi, '_') + '.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Data exported');
  } catch(e) { toast(e.message, true); }
}

async function deleteMember(email, name) {
  if (!confirm('Delete ' + name + ' (' + email + ')?\n\nThis removes their profile, event RSVPs, forum posts, and offerings. Their allowlist entry is kept — they can re-register.\n\nThis cannot be undone.')) return;
  try {
    await api('POST', '', { action: 'delete-member', email });
    toast('Member deleted');
    loadMembers(); refreshStats();
  } catch(e) { toast(e.message, true); }
}

async function gdprEraseMember(email, name) {
  if (!confirm('GDPR Right to Erasure — fully erase ' + name + ' (' + email + ')?\n\nThis removes their profile, event RSVPs, forum posts, offerings, AND their allowlist entry. They will not be able to re-register.\n\nThis cannot be undone.')) return;
  try {
    await api('POST', '', { action: 'gdpr-erase-member', email });
    toast('Member fully erased');
    loadMembers(); refreshStats();
  } catch(e) { toast(e.message, true); }
}

function viewMember(m) {
  var fields = [
    ['Name',         [m.first_name, m.last_name].filter(Boolean).join(' ')],
    ['Login email',  m.auth_email],
    ['Display email',m.display_email],
    ['Organisation', m.organisation],
    ['Role / Title', m.role_title],
    ['Sector',       m.sector],
    ['City',         m.city],
    ['Country',      m.country],
    ['Cohort',       m.cohort],
    ['In directory', m.in_directory ? 'Yes' : 'No'],
    ['Registered',   m.created_at ? fmtDate(m.created_at) : ''],
    ['GDPR consent', m.gdpr_consent_at ? fmtDate(m.gdpr_consent_at) : ''],
  ].filter(([, v]) => v);
  document.getElementById('modal-detail-title').textContent = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.auth_email;
  document.getElementById('modal-detail-body').innerHTML = fields.map(([k, v]) => `<div class="detail-row"><div class="detail-label">${esc(k)}</div><div class="detail-value">${esc(String(v))}</div></div>`).join('');
  openModal('modal-detail');
}

// ── Allowlist ────────────────────────────────────────────────────
async function loadAllowlist() {
  var search = document.getElementById('allowlist-search').value;
  var tbody = document.getElementById('allowlist-tbody');
  tbody.innerHTML = '<tr><td colspan="4"><span class="spinner"></span></td></tr>';
  try {
    var data = await api('GET', '?action=allowlist' + (search ? '&search=' + encodeURIComponent(search) : ''));
    if (!data.allowlist.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty">No entries found.</td></tr>'; return; }
    tbody.innerHTML = data.allowlist.map(r => `
      <tr>
        <td>${esc(r.first_name)}</td>
        <td>${esc(r.last_name)}</td>
        <td>${esc(r.email)}</td>
        <td><div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" ${actionAttrs("openEditAllowlist", [r.id, r.first_name, r.last_name, r.email])}>Edit</button>
          <button class="btn btn-ghost btn-sm" ${actionAttrs("removeAllowlist", [r.email])}>Remove</button>
        </div></td>
      </tr>`).join('');
  } catch(e) { tbody.innerHTML = errRow(4); }
}

document.getElementById('allowlist-search').addEventListener('keydown', e => { if (e.key === 'Enter') loadAllowlist(); });
document.getElementById('allowlist-search').addEventListener('input', debounce(loadAllowlist, 350));

var _editingAllowlistId = null;

function openAddAllowlist() {
  _editingAllowlistId = null;
  document.getElementById('al-first').value = '';
  document.getElementById('al-last').value = '';
  document.getElementById('al-email').value = '';
  document.getElementById('modal-al-title').textContent = 'Add to allowlist';
  document.getElementById('modal-al-submit').textContent = 'Add person';
  openModal('modal-allowlist');
}

function openEditAllowlist(id, firstName, lastName, email) {
  _editingAllowlistId = id;
  document.getElementById('al-first').value = firstName;
  document.getElementById('al-last').value = lastName;
  document.getElementById('al-email').value = email;
  document.getElementById('modal-al-title').textContent = 'Edit allowlist entry';
  document.getElementById('modal-al-submit').textContent = 'Save changes';
  openModal('modal-allowlist');
}

async function submitAddAllowlist() {
  var email = document.getElementById('al-email').value.trim();
  if (!email) { toast('Email required', true); return; }
  var firstName = document.getElementById('al-first').value.trim();
  var lastName  = document.getElementById('al-last').value.trim();
  try {
    if (_editingAllowlistId) {
      await api('POST', '', { action: 'update-allowlist', id: _editingAllowlistId, email, firstName, lastName });
      toast('Entry updated');
    } else {
      await api('POST', '', { action: 'add-allowlist', email, firstName, lastName });
      toast('Added to allowlist');
    }
    closeModal('modal-allowlist');
    loadAllowlist(); refreshStats();
  } catch(e) { toast(e.message, true); }
}

async function exportAllowlist() {
  try {
    var data = await api('GET', '?action=export-allowlist');
    var blob = new Blob([data.csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'members-allowlist.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) { toast(e.message, true); }
}

async function removeAllowlist(email) {
  if (!confirm('Remove ' + email + ' from the allowlist? They will no longer be able to register.')) return;
  try {
    await api('POST', '', { action: 'remove-allowlist', email });
    toast('Removed from allowlist');
    loadAllowlist(); refreshStats();
  } catch(e) { toast(e.message, true); }
}

// ── Events ───────────────────────────────────────────────────────
var _eventsRows = [];

async function loadEvents() {
  var tbody = document.getElementById('events-tbody');
  tbody.innerHTML = '<tr><td colspan="4"><span class="spinner"></span></td></tr>';
  try {
    var data = await api('GET', '?action=events');
    _eventsRows = data.events;
    renderEventsRows();
  } catch(e) { tbody.innerHTML = errRow(4); }
}

function renderEventsRows() {
  var tbody = document.getElementById('events-tbody');
  var q = (document.getElementById('events-search').value || '').toLowerCase().trim();
  var rows = q ? _eventsRows.filter(e => (e.name + ' ' + e.city).toLowerCase().includes(q)) : _eventsRows;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">' + (q ? 'No events match your search.' : 'No events yet.') + '</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(e => `
    <tr>
      <td class="truncate">${esc(e.name)}</td>
      <td>${esc(e.start_date)}</td>
      <td>${esc(e.city)}</td>
      <td><div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" ${actionAttrs("openEditEvent", [e])}>Edit</button>
        <button class="btn btn-danger btn-sm" ${actionAttrs("deleteEvent", [e.id, e.name])}>Delete</button>
      </div></td>
    </tr>`).join('');
}

document.getElementById('events-search').addEventListener('input', debounce(renderEventsRows, 250));

function openAddEvent() {
  document.getElementById('event-modal-title').textContent = 'Add event';
  document.getElementById('ev-id').value = '';
  ['ev-name','ev-start','ev-end','ev-city','ev-desc','ev-link'].forEach(id => document.getElementById(id).value = '');
  openModal('modal-event');
}

function openEditEvent(ev) {
  document.getElementById('event-modal-title').textContent = 'Edit event';
  document.getElementById('ev-id').value = ev.id || '';
  document.getElementById('ev-name').value = ev.name || '';
  document.getElementById('ev-start').value = ev.start_date || '';
  document.getElementById('ev-end').value = ev.end_date || '';
  document.getElementById('ev-city').value = ev.city || '';
  document.getElementById('ev-desc').value = ev.description || '';
  document.getElementById('ev-link').value = ev.discussion_link || '';
  openModal('modal-event');
}

async function submitEvent() {
  var id = document.getElementById('ev-id').value;
  var name = document.getElementById('ev-name').value.trim();
  if (!name) { toast('Name required', true); return; }
  var payload = { name, startDate: document.getElementById('ev-start').value, endDate: document.getElementById('ev-end').value, city: document.getElementById('ev-city').value, description: document.getElementById('ev-desc').value, discussionLink: document.getElementById('ev-link').value, status: 'approved' };
  try {
    if (id) { await api('POST', '', { action: 'update-event', id, ...payload }); }
    else { await api('POST', '', { action: 'add-event', ...payload }); }
    closeModal('modal-event');
    toast('Event saved');
    loadEvents(); refreshStats();
  } catch(e) { toast(e.message, true); }
}

async function deleteEvent(id, name) {
  if (!confirm('Delete event "' + name + '"? This cannot be undone.')) return;
  try {
    await api('POST', '', { action: 'delete-event', id });
    toast('Event deleted');
    loadEvents(); refreshStats();
  } catch(e) { toast(e.message, true); }
}

// ── Proposed events ──────────────────────────────────────────────
async function loadProposed() {
  var tbody = document.getElementById('proposed-tbody');
  tbody.innerHTML = '<tr><td colspan="6"><span class="spinner"></span></td></tr>';
  try {
    var data = await api('GET', '?action=proposed');
    if (!data.proposed.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">No proposed events.</td></tr>'; return; }
    tbody.innerHTML = data.proposed.map(p => `
      <tr>
        <td class="truncate">${esc(p.title)}</td>
        <td>${esc(p.date)}</td>
        <td>${esc(p.format)}</td>
        <td class="truncate">${esc(p.location)}</td>
        <td><span class="badge badge-${esc(p.status)}">${esc(p.status)}</span></td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap">
          ${p.status === 'pending' ? `
          <button class="btn btn-success btn-sm" ${actionAttrs("approveProposed", [p.id])}>Approve</button>
          <button class="btn btn-warn btn-sm" ${actionAttrs("rejectProposed", [p.id])}>Reject</button>` : ''}
          <button class="btn btn-ghost btn-sm" ${actionAttrs("viewProposed", [p])}>View</button>
        </div></td>
      </tr>`).join('');
  } catch(e) { tbody.innerHTML = errRow(6); }
}

function viewProposed(p) {
  var fields = [['Title',p.title],['Date',p.date],['Format',p.format],['Duration',p.duration],['Location',p.location],['Link',p.link],['Description',p.description],['Proposed by',p.proposed_by]].filter(([,v])=>v);
  document.getElementById('modal-detail-title').textContent = p.title || 'Proposed Event';
  document.getElementById('modal-detail-body').innerHTML = fields.map(([k,v])=>`<div class="detail-row"><div class="detail-label">${esc(k)}</div><div class="detail-value">${esc(String(v))}</div></div>`).join('');
  openModal('modal-detail');
}

async function approveProposed(id) {
  if (!confirm('Approve this event and add it to the events list?')) return;
  try {
    await api('POST', '', { action: 'approve-proposed', id });
    toast('Event approved and added');
    loadProposed();
  } catch(e) { toast(e.message, true); }
}

async function rejectProposed(id) {
  if (!confirm('Reject this proposed event?')) return;
  try {
    await api('POST', '', { action: 'reject-proposed', id });
    toast('Event rejected');
    loadProposed();
  } catch(e) { toast(e.message, true); }
}

// ── Offerings ────────────────────────────────────────────────────
var _offeringsRows = [];

async function loadOfferings() {
  var tbody = document.getElementById('offerings-tbody');
  tbody.innerHTML = '<tr><td colspan="5"><span class="spinner"></span></td></tr>';
  try {
    var data = await api('GET', '?action=offerings');
    _offeringsRows = data.offerings;
    renderOfferingsRows();
  } catch(e) { tbody.innerHTML = errRow(5); }
}

function renderOfferingsRows() {
  var tbody = document.getElementById('offerings-tbody');
  var q = (document.getElementById('offerings-search').value || '').toLowerCase().trim();
  var rows = q ? _offeringsRows.filter(o => (o.name + ' ' + o.title + ' ' + o.category).toLowerCase().includes(q)) : _offeringsRows;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">' + (q ? 'No offerings match your search.' : 'No offerings submitted.') + '</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(o => `
    <tr>
      <td>${esc(o.name)}</td>
      <td class="truncate">${esc(o.email)}</td>
      <td class="truncate">${esc(o.title)}</td>
      <td>${esc(o.category)}</td>
      <td><div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" ${actionAttrs("viewOffering", [o])}>View</button>
        <button class="btn btn-danger btn-sm" ${actionAttrs("deleteOffering", [o.id, o.title])}>Delete</button>
      </div></td>
    </tr>`).join('');
}

document.getElementById('offerings-search').addEventListener('input', debounce(renderOfferingsRows, 250));

function viewOffering(o) {
  var fields = [['Name',o.name],['Email',o.email],['Title',o.title],['Category',o.category],['Fee type',o.fee_type],['Fee details',o.fee_info],['Format',o.format],['Location',o.location],['Website',o.website],['LinkedIn',o.linkedin],['Description',o.description]].filter(([,v])=>v);
  document.getElementById('modal-detail-title').textContent = o.title || 'Offering';
  document.getElementById('modal-detail-body').innerHTML = fields.map(([k,v])=>`<div class="detail-row"><div class="detail-label">${esc(k)}</div><div class="detail-value">${esc(String(v))}</div></div>`).join('');
  openModal('modal-detail');
}

async function deleteOffering(id, title) {
  if (!confirm('Delete offering "' + title + '"? This cannot be undone.')) return;
  try {
    await api('POST', '', { action: 'delete-offering', id });
    toast('Offering deleted');
    loadOfferings(); refreshStats();
  } catch(e) { toast(e.message, true); }
}

// ── Forum ────────────────────────────────────────────────────────
var _forumRows = [];

async function loadForum() {
  var tbody = document.getElementById('forum-tbody');
  tbody.innerHTML = '<tr><td colspan="6"><span class="spinner"></span></td></tr>';
  try {
    var data = await api('GET', '?action=forum');
    _forumRows = [];
    (data.posts || []).forEach(p => _forumRows.push({ type:'Post', forum: p.forum_name, author: p.author_name || '', content: (p.title ? p.title + ': ' : '') + (p.body || ''), date: p.created_at, id: p.post_id, isPost: true }));
    (data.replies || []).forEach(r => _forumRows.push({ type:'Reply', forum: r.forum_name, author: r.author_name || '', content: r.body || '', date: r.created_at, id: r.reply_id, isPost: false }));
    _forumRows.sort((a,b) => new Date(b.date) - new Date(a.date));
    renderForumRows();
  } catch(e) { tbody.innerHTML = errRow(6); }
}

function renderForumRows() {
  var tbody = document.getElementById('forum-tbody');
  var q = (document.getElementById('forum-search').value || '').toLowerCase().trim();
  var rows = q
    ? _forumRows.filter(r => (r.author + ' ' + r.forum + ' ' + r.content).toLowerCase().includes(q))
    : _forumRows;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">' + (q ? 'No results for "' + esc(q) + '".' : 'No forum activity yet.') + '</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${esc(r.type)}</td>
      <td>${esc(r.forum)}</td>
      <td>${esc(r.author)}</td>
      <td class="truncate">${esc(r.content)}</td>
      <td>${fmtDate(r.date)}</td>
      <td><button class="btn btn-danger btn-sm" ${actionAttrs("deleteForumItem", [r.id, r.isPost])}>Delete</button></td>
    </tr>`).join('');
}

document.getElementById('forum-search').addEventListener('input', debounce(renderForumRows, 250));

async function deleteForumItem(id, isPost) {
  if (!confirm('Delete this ' + (isPost ? 'post (and all its replies)' : 'reply') + '?')) return;
  try {
    await api('POST', '', isPost ? { action: 'delete-post', postId: id } : { action: 'delete-reply', replyId: id });
    toast('Deleted');
    loadForum();
  } catch(e) { toast(e.message, true); }
}

async function loadForumMemberships() {
  var tbody = document.getElementById('memberships-tbody');
  tbody.innerHTML = '<tr><td colspan="4"><span class="spinner"></span></td></tr>';
  try {
    var data = await api('GET', '?action=forum-memberships');
    if (!data.memberships.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">No forum memberships yet.</td></tr>';
      return;
    }
    tbody.innerHTML = data.memberships.map(function(r) {
      return '<tr' + (r.notify === 'left' ? ' style="opacity:0.5"' : '') + '>' +
        '<td>' + esc(r.forum_name) + '</td>' +
        '<td>' + esc(r.member_email) + '</td>' +
        '<td><span class="badge badge-' + (r.notify === 'yes' ? 'approved' : r.notify === 'left' ? 'rejected' : 'pending') + '">' + (r.notify === 'yes' ? 'On' : r.notify === 'left' ? 'Left' : 'Off') + '</span></td>' +
        '<td>' + fmtDate(r.created_at) + '</td>' +
        '</tr>';
    }).join('');
  } catch(e) { tbody.innerHTML = errRow(4); }
}

// ── Settings / Admins ────────────────────────────────────────────
async function loadAdmins() {
  var tbody = document.getElementById('admins-tbody');
  tbody.innerHTML = '<tr><td colspan="5"><span class="spinner"></span></td></tr>';
  try {
    var data = await api('GET', '?action=admins');
    tbody.innerHTML = data.admins.map(a => `
      <tr>
        <td>${esc(a.name)}</td>
        <td>${esc(a.email)}</td>
        <td>${a.role === 'super_admin' ? 'Super Admin' : 'Admin'}</td>
        <td>${fmtDate(a.created_at)}</td>
        <td><div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" ${actionAttrs("openEditAdmin", [a.email, a.name, a.role])}>Edit</button>
          <button class="btn btn-danger btn-sm" ${actionAttrs("removeAdmin", [a.email, a.name])}>Remove</button>
        </div></td>
      </tr>`).join('');
  } catch(e) { tbody.innerHTML = errRow(5); }
}

var _editingAdminEmail = null;

function openAddAdmin() {
  _editingAdminEmail = null;
  document.getElementById('adm-name').value = '';
  document.getElementById('adm-email').value = '';
  document.getElementById('adm-email').readOnly = false;
  document.getElementById('adm-role').value = 'admin';
  document.getElementById('modal-admin-title').textContent = 'Add admin';
  document.getElementById('modal-admin-submit').textContent = 'Add admin';
  openModal('modal-admin');
}

function openEditAdmin(email, name, role) {
  _editingAdminEmail = email;
  document.getElementById('adm-name').value = name;
  document.getElementById('adm-email').value = email;
  document.getElementById('adm-email').readOnly = true;
  document.getElementById('adm-role').value = role;
  document.getElementById('modal-admin-title').textContent = 'Edit admin';
  document.getElementById('modal-admin-submit').textContent = 'Save changes';
  openModal('modal-admin');
}

async function submitAddAdmin() {
  var email = _editingAdminEmail || document.getElementById('adm-email').value.trim();
  var name  = document.getElementById('adm-name').value.trim();
  var role  = document.getElementById('adm-role').value;
  if (!email || !name) { toast('Name and email required', true); return; }
  try {
    if (_editingAdminEmail) {
      await api('POST', '', { action: 'update-admin', email, name, role });
      toast('Admin updated');
    } else {
      await api('POST', '', { action: 'add-admin', email, name, role });
      toast('Admin added — invitation email sent');
    }
    closeModal('modal-admin');
    loadAdmins();
  } catch(e) { toast(e.message, true); }
}

async function removeAdmin(email, name) {
  if (!confirm('Remove admin access for ' + name + '?')) return;
  try {
    await api('POST', '', { action: 'remove-admin', email });
    toast('Admin removed');
    loadAdmins();
  } catch(e) { toast(e.message, true); }
}

// ── CSV Import ───────────────────────────────────────────────────
var _importRows = [];

function triggerImportCSV() { document.getElementById('csv-file-input').click(); }

function parseCSV(text) {
  text = text.replace(/^﻿/, ''); // strip BOM
  var lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  function parseLine(line) {
    var fields = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
      else if (c === ',' && !inQ) { fields.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    fields.push(cur.trim());
    return fields;
  }
  var headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
  var fi = headers.findIndex(h => h.startsWith('first') || h === 'givenname');
  var li = headers.findIndex(h => h.startsWith('last') || h.includes('family') || h.includes('surname'));
  var ei = headers.findIndex(h => h.includes('email'));
  var ni = headers.findIndex(h => h === 'name' || h === 'fullname');
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    var f = parseLine(lines[i]);
    if (!f.some(v => v)) continue;
    var first = fi >= 0 ? (f[fi] || '') : '';
    var last  = li >= 0 ? (f[li] || '') : '';
    var email = ei >= 0 ? (f[ei] || '') : '';
    if (!first && !last && ni >= 0) {
      var parts = (f[ni] || '').split(/\s+/);
      first = parts[0] || ''; last = parts.slice(1).join(' ');
    }
    if (email.includes('@')) rows.push({ firstName: first.trim(), lastName: last.trim(), email: email.trim().toLowerCase() });
  }
  return rows;
}

async function handleCSVFile(input) {
  if (!input.files.length) return;
  var file = input.files[0];
  input.value = '';
  var text = await file.text();
  var parsed = parseCSV(text);
  if (!parsed.length) { toast('No valid rows found in CSV', true); return; }
  var existing = [];
  try { var d = await api('GET', '?action=allowlist'); existing = d.allowlist || []; } catch(e) {}
  var emailSet = new Set(existing.map(r => r.email.toLowerCase()));
  var nameSet  = new Set(existing.map(r => (r.first_name + ' ' + r.last_name).toLowerCase().trim()).filter(Boolean));
  _importRows = parsed.map(r => {
    var dupEmail = emailSet.has(r.email);
    var dupName  = nameSet.has((r.firstName + ' ' + r.lastName).toLowerCase().trim());
    var status   = dupEmail ? 'dup-email' : dupName ? 'name-match' : 'new';
    return { ...r, status, selected: status !== 'dup-email' };
  });
  renderImportPreview();
  openModal('modal-import');
}

function renderImportPreview() {
  var total    = _importRows.length;
  var dupCount = _importRows.filter(r => r.status === 'dup-email').length;
  var warnCount= _importRows.filter(r => r.status === 'name-match').length;
  var parts = [total + ' rows parsed'];
  if (dupCount)  parts.push(dupCount + ' already in list (unchecked)');
  if (warnCount) parts.push(warnCount + ' name match — review carefully');
  document.getElementById('import-summary').textContent = parts.join(' · ');
  var sel = _importRows.filter(r => r.selected).length;
  document.getElementById('import-submit').textContent = 'Import ' + sel + ' people';
  document.getElementById('import-tbody').innerHTML = _importRows.map((r, i) => {
    var badge = r.status === 'new'
      ? '<span class="badge badge-approved">New</span>'
      : r.status === 'dup-email'
        ? '<span class="badge badge-rejected">Already in list</span>'
        : '<span class="badge badge-pending">Name match ⚠</span>';
    var cls = r.status === 'name-match' ? 'import-warn' : r.status === 'dup-email' ? 'import-dup' : '';
    return `<tr class="${cls}">
      <td style="text-align:center"><input type="checkbox" ${r.selected?'checked':''} data-import-row="${i}"></td>
      <td>${esc(r.firstName)}</td><td>${esc(r.lastName)}</td>
      <td>${esc(r.email)}</td><td>${badge}</td>
    </tr>`;
  }).join('');
}

function toggleImportRow(i, checked) {
  _importRows[i].selected = checked;
  var sel = _importRows.filter(r => r.selected).length;
  document.getElementById('import-submit').textContent = 'Import ' + sel + ' people';
}

async function submitImport() {
  var rows = _importRows.filter(r => r.selected);
  if (!rows.length) { toast('No rows selected', true); return; }
  var btn = document.getElementById('import-submit');
  btn.disabled = true; btn.textContent = 'Importing…';
  try {
    var data = await api('POST', '', { action: 'bulk-add-allowlist', rows });
    closeModal('modal-import');
    toast(data.added + ' people added to allowlist');
    loadAllowlist(); refreshStats();
  } catch(e) {
    toast(e.message, true);
    btn.disabled = false;
    btn.textContent = 'Import ' + rows.length + ' people';
  }
}

// ── Modal helpers ────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
});

SafeUI.bindActions({ viewMember, exportMember, deleteMember, gdprEraseMember, openEditAllowlist, removeAllowlist, openEditEvent, deleteEvent, approveProposed, rejectProposed, viewProposed, viewOffering, deleteOffering, deleteForumItem, openEditAdmin, removeAdmin });
document.addEventListener('change', function(event) {
  if (event.target.matches('[data-import-row]')) toggleImportRow(Number(event.target.dataset.importRow), event.target.checked);
});

// Bind trusted, static page controls without inline script permissions.
document.querySelector('[data-bind-click="0"]').addEventListener('click', function(event) {
  var result = (function(event) { switchTab('members') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="1"]').addEventListener('click', function(event) {
  var result = (function(event) { switchTab('allowlist') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="2"]').addEventListener('click', function(event) {
  var result = (function(event) { switchTab('events') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="3"]').addEventListener('click', function(event) {
  var result = (function(event) { switchTab('offerings') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="4"]').addEventListener('click', function(event) {
  var result = (function(event) { loadMembers() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="5"]').addEventListener('click', function(event) {
  var result = (function(event) { openAddAllowlist() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="6"]').addEventListener('click', function(event) {
  var result = (function(event) { triggerImportCSV() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="7"]').addEventListener('click', function(event) {
  var result = (function(event) { loadAllowlist() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="8"]').addEventListener('click', function(event) {
  var result = (function(event) { exportAllowlist() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-change="9"]').addEventListener('change', function(event) {
  var result = (function(event) { handleCSVFile(this) }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="10"]').addEventListener('click', function(event) {
  var result = (function(event) { openAddEvent() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="11"]').addEventListener('click', function(event) {
  var result = (function(event) { loadEvents() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="12"]').addEventListener('click', function(event) {
  var result = (function(event) { loadProposed() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="13"]').addEventListener('click', function(event) {
  var result = (function(event) { loadOfferings() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="14"]').addEventListener('click', function(event) {
  var result = (function(event) { loadForum() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="15"]').addEventListener('click', function(event) {
  var result = (function(event) { loadForumMemberships() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="16"]').addEventListener('click', function(event) {
  var result = (function(event) { openAddAdmin() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="17"]').addEventListener('click', function(event) {
  var result = (function(event) { loadAdmins() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="18"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-allowlist') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="19"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-allowlist') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="20"]').addEventListener('click', function(event) {
  var result = (function(event) { submitAddAllowlist() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="21"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-event') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="22"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-event') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="23"]').addEventListener('click', function(event) {
  var result = (function(event) { submitEvent() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="24"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-admin') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="25"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-admin') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="26"]').addEventListener('click', function(event) {
  var result = (function(event) { submitAddAdmin() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="27"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-detail') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="28"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-detail') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="29"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-import') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="30"]').addEventListener('click', function(event) {
  var result = (function(event) { closeModal('modal-import') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="31"]').addEventListener('click', function(event) {
  var result = (function(event) { submitImport() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
