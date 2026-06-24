<?php
/**
 * One-time remote update. DELETE after successful run.
 * GET /wp-content/plugins/pa-media-booking/pa-remote-update.php?token=pa-deploy-2026
 */
if (!isset($_GET['token']) || $_GET['token'] !== 'pa-deploy-2026') {
    http_response_code(403);
    exit('Forbidden');
}

$zipUrl = 'ZIP_URL_PLACEHOLDER';
$root = __DIR__;
$tmp = sys_get_temp_dir() . '/pa-booking-update-' . time() . '.zip';

$ctx = stream_context_create(array('http' => array('timeout' => 120)));
$body = @file_get_contents($zipUrl, false, $ctx);
if (!$body) {
    http_response_code(500);
    exit('Download failed');
}

file_put_contents($tmp, $body);
$zip = new ZipArchive();
if ($zip->open($tmp) !== true) {
    @unlink($tmp);
    http_response_code(500);
    exit('Bad zip');
}
$zip->extractTo($root);
$zip->close();
@unlink($tmp);

$muDir = dirname($root, 2) . '/mu-plugins';
if (!is_dir($muDir)) {
    mkdir($muDir, 0755, true);
}
$mu = <<<'PHP'
<?php
if (!defined('ABSPATH')) { exit; }
define('PA_BOOKING_STRIPE_PK', 'PK_PLACEHOLDER');
define('PA_BOOKING_STRIPE_SK', 'SK_PLACEHOLDER');
PHP;
file_put_contents($muDir . '/pa-booking-stripe-keys.php', $mu);

header('Content-Type: text/plain; charset=utf-8');
echo "OK pa-media-booking updated\n";
if (function_exists('opcache_reset')) {
    opcache_reset();
}
