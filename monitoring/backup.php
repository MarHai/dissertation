<?php

require_once('config.php');

/**
 * Dumps the database and compresses the dump.
 * Backups are organized in /year/month/yyyymmdd.sql.gz dir-file structures
 *
 * Process:
 * * find last backup
 * * check if it is at least BACKUP_DAYS days old (if so, a new backup should be made)
 * * backup (and put the file into the according folder)
 * * send an email about the backup's status
 */

$dLastBackup = 0;
$dEarliestBackup = time();
$bMakeABackup = FALSE;
$nBackupsAvailable = 0;

//find last backup
foreach(new DirectoryIterator('./') as $oYear) {
	if(!$oYear->isDot() && $oYear->isDir()) {
		foreach(new DirectoryIterator('./'.$oYear->getFilename().'/') as $oMonth) {
			if(!$oMonth->isDot() && $oMonth->isDir()) {
				foreach(new DirectoryIterator('./'.$oYear->getFilename().'/'.$oMonth->getFilename().'/') as $oBackup) {
					if(!$oBackup->isDot() && $oBackup->isFile()) {
						if(substr($oBackup->getFilename(), 8) == '.sql.gz') {
							$dCurrentBackup = mktime(0, 0, 0, $oMonth->getFilename(), substr($oBackup->getFilename(), 6, 2), $oYear->getFilename());
							if($dCurrentBackup > 0) {
								$nBackupsAvailable++;
								if($dCurrentBackup > $dLastBackup) {
									$dLastBackup = $dCurrentBackup;
								}
								if($dCurrentBackup < $dEarliestBackup) {
									$dEarliestBackup = $dCurrentBackup;
								}
							}
						}
					}
				}
			}
		}
	}
}

//check if backup is necessary
if($dLastBackup < (time() - (BACKUP_DAYS*24*60*60))) {
	$bMakeABackup = TRUE;
	if(!is_dir(date('Y'))) {
		if(!mkdir(date('Y'))) {
			@mail(
				'haim@ifkw.lmu.de',
				'=?UTF-8?B?'.base64_encode('[DissMonitor] Datenbank-Backup fehlgeschlagen').'?=',
                'Hallo,'.chr(10).chr(10).
                'ich habe versucht, ein neues Backup der Datenbank zu ziehen, das hat aber nicht geklappt. '.
                'Grund dafür ist, dass der Jahresordner nicht erstellt werden konnte. '.
                'Das nächste Backup versuche ich dann, in '.BACKUP_DAYS.' Tagen zu ziehen.'.chr(10),
				implode(chr(10), [
					'From: DissMonitor <mario@haim.it>',
					'X-Mailer: PHP/'.phpversion(),
					'MIME-Version: 1.0',
					'Content-type: text/plain; charset=utf-8',
					'Content-Transfer-Encoding: 7bit'
				])
			);
		}
	}
	if(!is_dir(date('Y/m'))) {
		$bExternalBackup = TRUE;
		if(!mkdir(date('Y/m'))) {
			@mail(
				'haim@ifkw.lmu.de',
				'=?UTF-8?B?'.base64_encode('[DissMonitor] Datenbank-Backup fehlgeschlagen').'?=',
                'Hallo,'.chr(10).chr(10).
                'beim Versuch, ein neues Backup der Datenbank zu ziehen, bin ich dieses Mal leider gescheitert. '.
                'Den nächsten Anlaufe wage ich dann wieder in '.BACKUP_DAYS.' Tagen.'.chr(10),
				implode(chr(10), [
					'From: DissMonitor <mario@haim.it>',
					'X-Mailer: PHP/'.phpversion(),
					'MIME-Version: 1.0',
					'Content-type: text/plain; charset=utf-8',
					'Content-Transfer-Encoding: 7bit'
				])
			);
		}
	}
}

if($bMakeABackup) {
	//backup (and put the file into the according folder)
	$sBackupFile = date('Y/m/Ymd').'.sql.gz';
	exec('mysqldump --opt --user='.DB_USER.' --password='.DB_PASSWORD.' '.DB_NAME.' | gzip > '.$sBackupFile);
	$nBackupSize = filesize($sBackupFile);
	if($nBackupSize > 0) {
		$nBackupsAvailable++;
	}

	//send an email about the file's status
	$i = 0;
	while($nBackupSize > 1024) {
		$i++;
		$nBackupSize /= 1024;
	}
	@mail(
		'haim@ifkw.lmu.de',
		'=?UTF-8?B?'.base64_encode('[DissMonitor] Datenbank-Backup durchgeführt').'?=',
        'Hallo,'.chr(10).chr(10).
        'ich habe ein neues Backup der Datenbank (Nur der Datenbank!) erstellt. Zumindest glaube ich das. Die komprimierte Datei liegt derzeit auf meinem Server unter '.chr(10).chr(10).
        '> https://diss-admin.haim.it/monitoring/'.$sBackupFile.chr(10).chr(10).
        'und "wiegt" rund '.str_replace('.', ',', round($nBackupSize, 1)).' '.([ 'Byte', 'KByte', 'MByte', 'GByte', 'TByte', 'PByte' ][$i]).'. '.
        'Es '.($nBackupsAvailable == 1 ? 'ist' : 'sind').' jetzt '.$nBackupsAvailable.' Backup(s) gespeichert.'.
        'Das nächste Backup erstelle ich dann in '.BACKUP_DAYS.' Tagen.'.chr(10),
		implode(chr(10), [
			'From: DissMonitor <mario@haim.it>',
			'X-Mailer: PHP/'.phpversion(),
			'MIME-Version: 1.0',
			'Content-type: text/plain; charset=utf-8',
			'Content-Transfer-Encoding: 7bit'
		])
	);
}

?>