# Dissertation
Tools used for scraping and administration throughout the quantitative part of my dissertation.

## REST server
Central database and API backend in order to store and provide data.
This is just PHP (and MySQL). Run `php composer.phar install`, use on a publicly available server, provide with necessary writing permissions, and you are good.
Requires database-connection configuration as well as the administrator's password hash.

## Node
Scraping scripts, called regularly through cronjobs. Push data to the REST server.
You need to have node installed. Run `npm install` and put all `node-**xyz**.js` files into five-minute-intervalled cronjobs. Use this on a server that has a rather good internet connection.
Needs the REST address set as well as a given administrator's password hash.

## Frontend
Configuration and administration frontend. Allows for configuring media outlets as well as observe the scraping process. Builds on data from the REST server.
Run `npm install`, `bower install`, and `gulp`. Deploy all files within `dist/` in order to get a decent, mostly JavaScript-driven, frontend that also runs as a web app on your smartphone.
Needs the REST address set.

## Monitoring
Single scripts (called through cronjobs) to maintain data integrity and security. Includes regular backups of the database (`backup.php`), post-hoc integrity checks for the mentioning of articles within social-network-site posts (`mentions.php`), as well as status-information emails (`status.php`).
This is really boring PHP. Just push to a server, configure the REST address, database-connection settings, and the administrator's password hash, and put all three files (with write permissions set for `backup.php`) into cronjob loops. Meaningful intervals include a daily backup, an hourly integrity check, and a status check every 5-8 minutes.