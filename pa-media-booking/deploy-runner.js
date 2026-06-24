(async function () {
  async function deploy(relPath) {
    const file = 'pa-media-booking/' + relPath;
    const content = await (await fetch('http://127.0.0.1:8765/' + relPath)).text();
    const html = await (await fetch('/wp-admin/plugin-editor.php?file=' + encodeURIComponent(file), { credentials: 'include' })).text();
    const nonce = (html.match(/name="_wpnonce" value="([^"]+)"/) || [])[1];
    if (!nonce) return relPath + ':no-nonce';
    const body = new URLSearchParams({ _wpnonce: nonce, action: 'update', file: file, newcontent: content, submit: 'Update File' });
    const res = await fetch('/wp-admin/plugin-editor.php', { method: 'POST', credentials: 'include', body });
    return relPath + ':' + (res.ok ? 'ok' : 'fail');
  }
  const files = [
    'assets/booking.js',
    'assets/booking.css',
    'includes/class-frontend.php',
    'includes/class-rest.php',
    'pa-media-booking.php',
  ];
  const results = [];
  for (const f of files) {
    results.push(await deploy(f));
  }
  window.paDeployResult = results.join('|');
})();
