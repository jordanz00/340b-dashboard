/**
 * Run from wp-admin console (logged in). Serves files from LOCAL_TUNNEL.
 * Path: pa-media-booking.disabled (active plugin folder on live).
 */
(async function paDeployGlassBooking() {
  const BASE = window.__PA_DEPLOY_BASE || 'REPLACE_TUNNEL_URL/';
  const PLUGIN = 'pa-media-booking.disabled';
  const files = [
    'assets/booking.js',
    'assets/site.js',
    'assets/site.css',
    'assets/glass.css',
    'includes/class-frontend.php',
    'pa-media-booking.php',
  ];

  async function deploy(rel) {
    const content = await (await fetch(BASE + rel)).text();
    const file = PLUGIN + '/' + rel;
    const html = await (await fetch(
      '/wp-admin/plugin-editor.php?file=' + encodeURIComponent(file) + '&plugin=' + encodeURIComponent(PLUGIN + '/pa-media-booking.php'),
      { credentials: 'include' }
    )).text();
    const m =
      html.match(/name=["'](?:_wpnonce|nonce)["'][^>]*value=["']([^"']+)"/) ||
      html.match(/value=["']([^"']+)["'][^>]*name=["'](?:_wpnonce|nonce)["']/);
    const nonce = m ? m[1] : '';
    if (!nonce) return rel + ':no-nonce';
    const body = new URLSearchParams({
      nonce,
      action: 'update',
      file,
      newcontent: content,
      submit: 'Update File',
    });
    const res = await fetch('/wp-admin/plugin-editor.php', {
      method: 'POST',
      credentials: 'include',
      body,
    });
    return rel + ':' + (res.ok ? 'ok' : 'fail-' + res.status);
  }

  const out = [];
  for (const f of files) {
    out.push(await deploy(f));
  }
  console.log('PA deploy:', out.join(' | '));
  return out;
})();
