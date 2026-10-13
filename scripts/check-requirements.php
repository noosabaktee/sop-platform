<?php
/** Run from CLI: php scripts/check-requirements.php (no Composer required). */
$minimum='8.2.0';$mandatory=['pdo_pgsql','pgsql','mbstring','openssl','fileinfo','json','pdo'];
$ok=version_compare(PHP_VERSION,$minimum,'>=');
echo 'PHP '.PHP_VERSION.($ok?' OK':' (requires >= '.$minimum.')').PHP_EOL;
foreach($mandatory as $extension){$has=extension_loaded($extension);echo ($has?'OK  ':'ERR ').$extension.PHP_EOL;$ok=$ok&&$has;}
$hasComposer=(bool)trim((string)@shell_exec('composer --version 2>&1'));
echo ($hasComposer?'OK  ':'ERR ').'Composer 2'.PHP_EOL;
$ok=$ok&&$hasComposer;
echo $ok?'Kebutuhan PHP utama terpenuhi. Verifikasi Node.js dan PostgreSQL secara terpisah.'.PHP_EOL:
 'Beberapa prasyarat belum tersedia. Perbaiki sebelum composer install/migrate.'.PHP_EOL;
exit($ok?0:1);
