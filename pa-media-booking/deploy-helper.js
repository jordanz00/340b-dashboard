async function paDeployPluginFile(relPath) {
  const file = 'pa-media-booking/' + relPath;
  const localUrl = 'http://127.0.0.1:8765/' + relPath;
  const content = await (await fetch(localUrl)).text();
  const editorUrl = '/wp-admin/plugin-editor.php?file=' + encodeURIComponent(file).replace(/%2F/g, '%2F');
  const html = await (await fetch(editorUrl, { credentials: 'include' })).text();
  const nonce = (html.match(/name="_wpnonce" value="([^"]+)"/) || [])[1];
  if (!nonce) return 'no-nonce:' + relPath;
  const body = new URLSearchParams();
  body.set('_wpnonce', nonce);
  body.set('action', 'update');
  body.set('file', file);
  body.set('newcontent', content);
  body.set('submit', 'Update File');
  const res = await fetch('/wp-admin/plugin-editor.php', { method: 'POST', credentials: 'include', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  return relPath + ':' + (res.ok ? 'ok' : 'fail-' + res.status);
}
