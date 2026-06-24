async function paDeployOne(relPath) {
  const content = await (await fetch('http://127.0.0.1:8765/' + relPath)).text();
  const file = 'pa-media-booking/' + relPath;
  const html = await (await fetch('/wp-admin/plugin-editor.php?file=' + encodeURIComponent(file), { credentials: 'include' })).text();
  const m = html.match(/name=["'](?:_wpnonce|nonce)["'][^>]*value=["']([^"']+)["']/) ||
    html.match(/value=["']([^"']+)["'][^>]*name=["'](?:_wpnonce|nonce)["']/);
  const nonce = m ? m[1] : '';
  if (!nonce) return relPath + ':no-nonce';
  const body = new URLSearchParams({ nonce: nonce, action: 'update', file, newcontent: content, submit: 'Update File' });
  const res = await fetch('/wp-admin/plugin-editor.php', { method: 'POST', credentials: 'include', body });
  return relPath + ':' + (res.ok ? 'ok' : 'fail-' + res.status);
}

(async function () {
  const files = [
    'includes/class-frontend.php',
    'includes/class-stripe.php',
    'assets/booking.js',
    'assets/booking.css',
    'pa-media-booking.php',
  ];
  const out = [];
  for (const f of files) {
    out.push(await paDeployOne(f));
  }
  window.__paDeployDone = out.join('|');
})();
