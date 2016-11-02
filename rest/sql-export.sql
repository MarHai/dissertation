###
# export all resulting tables as .csv
# in HeidiSQL, use complete Excel CSV tables with UTF-8 encoding and NA as null values
###

# media outlets
SELECT nMedId, sName FROM `media` ORDER BY sName ASC;

# sns
SELECT nSnsId, nMedId, eType FROM `sns`;

# ping stats
SELECT sSource, dCreate, nTime FROM `ping`;

# articles
SELECT * FROM `article` ORDER BY dCreate ASC;

# highlight rankings
SELECT nArtId, nValue, dCreate FROM `highlight_ranking` ORDER BY dCreate ASC;

# homepage rankings
SELECT nArtId, nValue, dCreate FROM `homepage_ranking` ORDER BY dCreate ASC;

# updates
SELECT nArtId, sType, sValue, dCreate FROM `update` ORDER BY dCreate ASC;

# post mentions
SELECT a.nArtId, b.nSnsId, b.dCreate, b.sPost FROM `post_mention` a, `post` b WHERE a.nPosId = b.nPosId ORDER BY b.dCreate ASC;

# popularity
SELECT nArtId, sType, dCreate, nValue FROM `popularity`;