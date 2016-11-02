<?php

define('DB_HOST', 'localhost');
define('DB_NAME', 'my_database');
define('DB_USER', 'root');
define('DB_PASSWORD', 'the_best_password_ever');

define('ADMIN_PASSWORD', 'hashed#admin#password');

define('BACKUP_DAYS', 7);
define('PING_THRESHOLD', 600);
define('PING_SDTHRESHOLD', 1.0);
define('CREATE_THRESHOLD', [ 
        'homepage' => 600,
        'highlight' => 600,
        'article' => 14400
    ]);

?>