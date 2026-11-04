<?php
// Copy to config.php (deploy writes it from GitHub secrets). Never commit config.php.
return [
    'db_host' => 'localhost',
    'db_port' => 3306,
    'db_name' => 'xxx_elektroplan',
    'db_user' => 'xxx_elektro',
    'db_pass' => '',
    'migrate_token' => 'long-random-string',
];
