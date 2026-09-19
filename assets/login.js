
  var params = new URLSearchParams(window.location.search);
  if (params.get('error') === 'expired') {
    var status = document.getElementById('login-status');
    status.textContent = 'That link has expired or already been used. Request a new one below.';
    status.classList.add('show', 'error');
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function submitLogin() {
    var input = document.getElementById('login-email');
    var err = document.getElementById('login-email-err');
    var email = input.value.trim();
    var ok = isValidEmail(email);
    input.classList.toggle('invalid', !ok);
    err.classList.toggle('show', !ok);
    if (!ok) { input.focus(); return; }

    var btn = document.getElementById('login-submit-btn');
    var status = document.getElementById('login-status');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    status.classList.remove('show', 'error');

    try {
      var res = await fetch('/api/request-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });
      if (!res.ok) throw new Error('request failed');

      var data = await res.json();
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      document.getElementById('intro-copy').style.display = 'none';
      document.getElementById('login-form').innerHTML =
        '<p style="font-size:14px;line-height:1.7;color:var(--ink-soft)">If <strong>' + email.replace(/</g,'&lt;') + '</strong> is on our alumni list, a sign-in link is on its way — check your inbox (and spam folder) over the next few minutes.</p>';
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'Send me a sign-in link';
      status.textContent = 'Something went wrong sending this — please try again in a moment.';
      status.classList.add('show', 'error');
    }
  }

  document.getElementById('login-email').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') submitLogin();
  });

// Bind trusted, static page controls without inline script permissions.
document.querySelector('[data-bind-click="0"]').addEventListener('click', function(event) {
  var result = (function(event) { submitLogin() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
