-- MySQL dump 10.16  Distrib 10.1.35-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: SecurityTheoryMap
-- ------------------------------------------------------
-- Server version	10.1.34-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `groupName` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `groupName` (`groupName`)
) ENGINE=InnoDB AUTO_INCREMENT=490 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (28,'Antecedents'),(52,'Anti-security'),(44,'Constructivism'),(51,'Everyday Security'),(47,'Feminist Theory'),(50,'Human Security'),(48,'Ontological Security'),(43,'Peace Studies'),(49,'Positive Security'),(38,'Reaction to Realism'),(32,'Realism'),(54,'Technical Security'),(53,'Theories of Care');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `keywordMapping`
--

DROP TABLE IF EXISTS `keywordMapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `keywordMapping` (
  `theoryId` int(11) DEFAULT NULL,
  `keywordId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `keywordMapping`
--

LOCK TABLES `keywordMapping` WRITE;
/*!40000 ALTER TABLE `keywordMapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `keywordMapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `keywords`
--

DROP TABLE IF EXISTS `keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `keyword` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `keywords`
--

LOCK TABLES `keywords` WRITE;
/*!40000 ALTER TABLE `keywords` DISABLE KEYS */;
/*!40000 ALTER TABLE `keywords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logicMapping`
--

DROP TABLE IF EXISTS `logicMapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logicMapping` (
  `theoryID` int(11) DEFAULT NULL,
  `logicID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logicMapping`
--

LOCK TABLES `logicMapping` WRITE;
/*!40000 ALTER TABLE `logicMapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `logicMapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logics`
--

DROP TABLE IF EXISTS `logics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logics` (
  `logicsID` int(11) DEFAULT NULL,
  `logicsName` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logicsSummary` varchar(4096) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logicsCommentary` varchar(4096) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logicsObjects` text COLLATE utf8mb4_unicode_ci,
  `logicsPolitics` text COLLATE utf8mb4_unicode_ci,
  `logicsTechnology` text COLLATE utf8mb4_unicode_ci,
  `logicsPositiveSecurity` int(11) DEFAULT NULL,
  `logicsNegativeSecurity` int(11) DEFAULT NULL,
  `logicsUniversalist` int(11) DEFAULT NULL,
  `logicsOppositeLogic` text COLLATE utf8mb4_unicode_ci,
  `logicsCloselyRelated` text COLLATE utf8mb4_unicode_ci,
  `logicsExemplars` text COLLATE utf8mb4_unicode_ci,
  `logicsReferences` text COLLATE utf8mb4_unicode_ci,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logics`
--

LOCK TABLES `logics` WRITE;
/*!40000 ALTER TABLE `logics` DISABLE KEYS */;
/*!40000 ALTER TABLE `logics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logicsOpposite`
--

DROP TABLE IF EXISTS `logicsOpposite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logicsOpposite` (
  `logicId` int(11) DEFAULT NULL,
  `logicIdOpposite` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logicsOpposite`
--

LOCK TABLES `logicsOpposite` WRITE;
/*!40000 ALTER TABLE `logicsOpposite` DISABLE KEYS */;
/*!40000 ALTER TABLE `logicsOpposite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logicsRelations`
--

DROP TABLE IF EXISTS `logicsRelations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logicsRelations` (
  `logicID1` int(11) DEFAULT NULL,
  `logicID2` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logicsRelations`
--

LOCK TABLES `logicsRelations` WRITE;
/*!40000 ALTER TABLE `logicsRelations` DISABLE KEYS */;
/*!40000 ALTER TABLE `logicsRelations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referentobjects`
--

DROP TABLE IF EXISTS `referentobjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referentobjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `referentObject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referentobjects`
--

LOCK TABLES `referentobjects` WRITE;
/*!40000 ALTER TABLE `referentobjects` DISABLE KEYS */;
/*!40000 ALTER TABLE `referentobjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theories`
--

DROP TABLE IF EXISTS `theories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `theories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `theoryID` int(11) DEFAULT NULL,
  `theoryName` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theorySummary` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theoryPrinciples` text COLLATE utf8mb4_unicode_ci,
  `theoryExample` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theoryStructureOfTheInternationalSystem` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theoryRelationOfSystemToEnvironment` text COLLATE utf8mb4_unicode_ci,
  `theorySecurityReferentObject` int(11) DEFAULT NULL,
  `theoryAgent` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theoryThreatActors` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theorySourceOfResilience` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theoryInterventions` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theoryStrategy` text COLLATE utf8mb4_unicode_ci,
  `theoryPrimaryAuthors` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theoryYear` smallint(6) DEFAULT NULL,
  `theoryLimitations` text COLLATE utf8mb4_unicode_ci,
  `theoryGroupIndex` int(11) DEFAULT NULL,
  `theoryAudience` text COLLATE utf8mb4_unicode_ci,
  `theoryResearchDrawnUpon` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idTheoryGroupIndex` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theories`
--

LOCK TABLES `theories` WRITE;
/*!40000 ALTER TABLE `theories` DISABLE KEYS */;
/*!40000 ALTER TABLE `theories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theoryRelations`
--

DROP TABLE IF EXISTS `theoryRelations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `theoryRelations` (
  `theoryID` int(11) DEFAULT NULL,
  `theoryID2` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theoryRelations`
--

LOCK TABLES `theoryRelations` WRITE;
/*!40000 ALTER TABLE `theoryRelations` DISABLE KEYS */;
/*!40000 ALTER TABLE `theoryRelations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-09-08 13:28:14
