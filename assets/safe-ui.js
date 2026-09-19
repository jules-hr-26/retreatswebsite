/* Shared, data-only bindings. Never evaluate strings supplied by members. */
var SafeUI = {
  escape: function(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  },
  headshot: function(value) {
    return typeof value === 'string' && value.length <= 180000 && /^[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : '';
  },
  httpUrl: function(value) {
    try { var url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : ''; }
    catch (_) { return ''; }
  },
  bindActions: function(actions) {
    document.addEventListener('click', function(event) {
      var element = event.target.closest('[data-action]');
      if (!element || !Object.prototype.hasOwnProperty.call(actions, element.dataset.action)) return;
      var args;
      try { args = JSON.parse(element.dataset.args || '[]'); } catch (_) { return; }
      if (Array.isArray(args)) actions[element.dataset.action].apply(element, args);
    });
  }
};
function actionAttrs(action, args) {
  return 'data-action="' + SafeUI.escape(action) + '" data-args="' + SafeUI.escape(JSON.stringify(args)) + '"';
}
