setwd(choose.dir())

dfMedia <- read.csv('media.csv', encoding='UTF-8')

dfSns <- read.csv('sns.csv', encoding='UTF-8')
dfSns$nMedId <- factor(dfSns$nMedId, dfMedia$nMedId, dfMedia$sName)

dfArticle <- read.csv('article.csv', encoding='UTF-8')
dfArticle$nMedId <- factor(dfArticle$nMedId, dfMedia$nMedId, dfMedia$sName)
dfArticle$dCreate <- as.POSIXct(dfArticle$dCreate, origin='1970-01-01', tz='Europe/Berlin')

dfHighlight <- read.csv('highlight.csv', encoding='UTF-8')
dfHighlight$nArtId <- factor(dfHighlight$nArtId, dfArticle$nArtId, dfArticle$sUrl)
dfHighlight$dCreate <- as.POSIXct(dfHighlight$dCreate, origin='1970-01-01', tz='Europe/Berlin')

dfHomepage <- read.csv('homepage.csv', encoding='UTF-8')
dfHomepage$nArtId <- factor(dfHomepage$nArtId, dfArticle$nArtId, dfArticle$sUrl)
dfHomepage$dCreate <- as.POSIXct(dfHomepage$dCreate, origin='1970-01-01', tz='Europe/Berlin')

dfUpdate <- read.csv('update.csv', encoding='UTF-8')
dfUpdate$nArtId <- factor(dfUpdate$nArtId, dfArticle$nArtId, dfArticle$sUrl)
dfUpdate$dCreate <- as.POSIXct(dfUpdate$dCreate, origin='1970-01-01', tz='Europe/Berlin')

dfPost <- read.csv('post.csv', sep=',', encoding='UTF-8')
dfPost$nArtId <- factor(dfPost$nArtId, dfArticle$nArtId, dfArticle$sUrl)
dfPost$nSnsId <- factor(dfPost$nSnsId, dfSns$nSnsId, paste(dfSns$nMedId, dfSns$eType))
dfPost$dCreate <- as.POSIXct(dfPost$dCreate, origin='1970-01-01', tz='Europe/Berlin')

dfPopularity <- read.csv('popularity.csv', encoding='UTF-8')
dfPopularity$nArtId <- factor(dfPopularity$nArtId, dfArticle$nArtId, dfArticle$sUrl)
dfPopularity$dCreate <- as.POSIXct(dfPopularity$dCreate, origin='1970-01-01', tz='Europe/Berlin')

dfPing <- read.csv('ping.csv', encoding='UTF-8')
dfPing$dCreate <- as.POSIXct(dfPing$dCreate, origin='1970-01-01', tz='Europe/Berlin')
