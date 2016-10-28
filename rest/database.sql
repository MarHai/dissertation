/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

CREATE TABLE IF NOT EXISTS `article` (
  `nArtId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nMedId` int(11) unsigned NOT NULL,
  `sUrl` text NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nArtId`),
  KEY `nMedId` (`nMedId`),
  FULLTEXT KEY `sUrl` (`sUrl`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `highlight` (
  `nHigId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nMedId` int(11) unsigned NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nHigId`),
  KEY `nMedId` (`nMedId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 ROW_FORMAT=FIXED;


CREATE TABLE IF NOT EXISTS `highlight_ranking` (
  `nHiRId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nArtId` int(11) unsigned NOT NULL,
  `nHigId` int(11) unsigned NOT NULL,
  `nValue` int(35) unsigned NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nHiRId`),
  KEY `nArtId` (`nArtId`),
  KEY `nHigId` (`nHigId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `homepage` (
  `nHomId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nMedId` int(11) unsigned NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nHomId`),
  KEY `nMedId` (`nMedId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `homepage_ranking` (
  `nHoRId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nArtId` int(11) unsigned NOT NULL,
  `nHomId` int(11) unsigned NOT NULL,
  `nValue` int(35) unsigned NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nHoRId`),
  KEY `nArtId` (`nArtId`),
  KEY `nHomId` (`nHomId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `media` (
  `nMedId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `sName` varchar(50) NOT NULL,
  `bActive` tinyint(2) unsigned NOT NULL DEFAULT '0',
  `sBaseUrl` text NOT NULL,
  `sPrefixUrl` text NOT NULL,
  `sHomepageUrl` text NOT NULL,
  `sHomepageSelector` text NOT NULL,
  `sHomepageLinkExtractor` text NOT NULL,
  `sHighlightUrl` text NOT NULL,
  `sHighlightSelector` text NOT NULL,
  `sHighlightLinkExtractor` text NOT NULL,
  `sArticleHeadlineSelector` text NOT NULL,
  `sArticleImageSelector` text NOT NULL,
  `sArticleCommentSelector` text NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  `dUpdate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nMedId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `ping` (
  `nPinId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `sSource` varchar(50) NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  `nTime` int(11) unsigned NOT NULL,
  PRIMARY KEY (`nPinId`),
  KEY `sSource` (`sSource`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `popularity` (
  `nPopId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nArtId` int(11) unsigned NOT NULL,
  `sType` varchar(50) NOT NULL,
  `nValue` int(35) unsigned NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nPopId`),
  KEY `sType` (`sType`),
  KEY `nArtId` (`nArtId`),
  KEY `nArtId_sType` (`nArtId`,`sType`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `post` (
  `nPosId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nSnsId` int(11) unsigned NOT NULL,
  `sPostId` varchar(100) NOT NULL,
  `sPost` text NOT NULL,
  `sPostMeta` text NOT NULL,
  `bThoroughlyCheckedForMentions` tinyint(2) unsigned NOT NULL DEFAULT '0',
  `dCreate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nPosId`),
  KEY `nSnsId` (`nSnsId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `post_mention` (
  `nPoMId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nArtId` int(11) unsigned NOT NULL,
  `nPosId` int(11) unsigned NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nPoMId`),
  KEY `nArtId` (`nArtId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `sns` (
  `nSnsId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nMedId` int(11) unsigned NOT NULL,
  `bActive` tinyint(2) unsigned NOT NULL DEFAULT '0',
  `eType` enum('Twitter','Facebook') NOT NULL,
  `sPlatformName` varchar(150) NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  `dUpdate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nSnsId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `update` (
  `nUpdId` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nArtId` int(11) unsigned NOT NULL DEFAULT '0',
  `sType` varchar(50) NOT NULL,
  `sValue` text NOT NULL,
  `sImageHash` varchar(50) NOT NULL,
  `dCreate` int(35) unsigned NOT NULL,
  PRIMARY KEY (`nUpdId`),
  KEY `sType` (`sType`),
  KEY `nArtId_sType` (`nArtId`,`sType`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
