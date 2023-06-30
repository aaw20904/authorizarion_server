CREATE DATABASE  IF NOT EXISTS `my_bot` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `my_bot`;
-- MySQL dump 10.13  Distrib 8.0.29, for Win64 (x86_64)
--
-- Host: localhost    Database: my_bot
-- ------------------------------------------------------
-- Server version	8.0.29

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `counter_types`
--

DROP TABLE IF EXISTS `counter_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `counter_types` (
  `cnt_typ` int NOT NULL AUTO_INCREMENT,
  `descr` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`cnt_typ`),
  KEY `coumner_types_descr` (`descr`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counter_types`
--

LOCK TABLES `counter_types` WRITE;
/*!40000 ALTER TABLE `counter_types` DISABLE KEYS */;
INSERT INTO `counter_types` VALUES (2,'cold_water'),(4,'electricity'),(1,'gas'),(3,'warm_water');
/*!40000 ALTER TABLE `counter_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counters`
--

DROP TABLE IF EXISTS `counters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `counters` (
  `cnt_id` bigint NOT NULL AUTO_INCREMENT,
  `fact_n` bigint DEFAULT NULL,
  `prov_id` bigint DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `abon_num` bigint DEFAULT NULL,
  `cnt_typ` int DEFAULT NULL,
  PRIMARY KEY (`cnt_id`),
  UNIQUE KEY `fact_n` (`fact_n`,`prov_id`,`user_id`),
  KEY `prov_id` (`prov_id`),
  KEY `user_id` (`user_id`),
  KEY `cnt_typ` (`cnt_typ`),
  CONSTRAINT `counters_ibfk_1` FOREIGN KEY (`prov_id`) REFERENCES `providers` (`prov_id`),
  CONSTRAINT `counters_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `counters_ibfk_3` FOREIGN KEY (`cnt_typ`) REFERENCES `counter_types` (`cnt_typ`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counters`
--

LOCK TABLES `counters` WRITE;
/*!40000 ALTER TABLE `counters` DISABLE KEYS */;
/*!40000 ALTER TABLE `counters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objects`
--

DROP TABLE IF EXISTS `objects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objects` (
  `cnt_id` bigint NOT NULL,
  `city` varchar(32) DEFAULT NULL,
  `village` varchar(32) DEFAULT NULL,
  `street` varchar(32) DEFAULT NULL,
  `build_n` smallint DEFAULT NULL,
  `flat_n` smallint DEFAULT NULL,
  PRIMARY KEY (`cnt_id`),
  CONSTRAINT `objects_ibfk_1` FOREIGN KEY (`cnt_id`) REFERENCES `counters` (`cnt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objects`
--

LOCK TABLES `objects` WRITE;
/*!40000 ALTER TABLE `objects` DISABLE KEYS */;
/*!40000 ALTER TABLE `objects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `providers`
--

DROP TABLE IF EXISTS `providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `providers` (
  `prov_id` bigint NOT NULL AUTO_INCREMENT,
  `prov_name` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`prov_id`),
  KEY `idx_providers` (`prov_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `providers`
--

LOCK TABLES `providers` WRITE;
/*!40000 ALTER TABLE `providers` DISABLE KEYS */;
INSERT INTO `providers` VALUES (1,'kyiv_electro'),(2,'kyiv_gaz'),(5,'kyiv_oblgaz'),(4,'kyiv_teplo'),(3,'kyiv_vodokanal');
/*!40000 ALTER TABLE `providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `readings`
--

DROP TABLE IF EXISTS `readings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `readings` (
  `tr_id` bigint NOT NULL AUTO_INCREMENT,
  `tr_date` datetime DEFAULT NULL,
  `state` smallint DEFAULT '0',
  `cnt_id` bigint DEFAULT NULL,
  `cnt_val` bigint DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`tr_id`),
  KEY `cnt_id` (`cnt_id`),
  KEY `k012` (`user_id`),
  CONSTRAINT `readings_ibfk_1` FOREIGN KEY (`cnt_id`) REFERENCES `counters` (`cnt_id`),
  CONSTRAINT `readings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `readings`
--

LOCK TABLES `readings` WRITE;
/*!40000 ALTER TABLE `readings` DISABLE KEYS */;
/*!40000 ALTER TABLE `readings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `hi_p` bigint unsigned NOT NULL,
  `lo_p` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `expired` bigint unsigned DEFAULT NULL,
  `priv_k` blob,
  `pub_k` blob,
  `last_d` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`hi_p`,`lo_p`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session`
--

LOCK TABLES `session` WRITE;
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
INSERT INTO `session` VALUES (6441479333184133276,9087954014856100930,1,1687773675430,_binary '-----BEGIN ENCRYPTED PRIVATE KEY-----\nMIIFLTBXBgkqhkiG9w0BBQ0wSjApBgkqhkiG9w0BBQwwHAQIi8EwMAy9bWQCAggA\nMAwGCCqGSIb3DQIJBQAwHQYJYIZIAWUDBAEqBBC5Rp/5srlUQxt9RRJo6/igBIIE\n0HhxHJhFA3wbOM87b/YoJ0LYYX7NLAoKmkqYjj9o1wQug5ol4UuMIJQqXQobW3RN\nXY7sgk5OF7gayyrQ0PrSpGOP/i892tPhD3U9hxSnHVsnr1ve3RuFfETghpi+eSka\nzmqNS5seC4StSe7ScQ08WgZjQDTfl3cprTXSAKHNFTpxz0sr6e4h2MQRHwfi6esz\n6fkGGYEg/5TkU0wZh0nOLxTc47XBzmDd++Uaq14vqIhdOiMt9E9pgVN6KMa8XfI5\nEHqYeAkep7f/1MzTMSDTuNoC5Q5PqLh56NjquohlXZoecLn8zbIvtB7IwgWwqSlB\njLut6A1B8tmsllH9E3UZsYTIBHWdwdgP+TMExDqFSgN6GZ26AYg3PAADofNQq6w+\no0g2TDsIZjfMxsHR22ouUXElMdIu+aGaL07+X0c5cd9CV8RquP/xfBfJpVmqSbb+\nQMeZcFe0O4Ynkh4RJBvKkwUluVg+XDlGKeZqDWtoBLa1xkj64kSXEtICQN0BvAHN\nb2P8RbWYyCuivdMukhfeNfBaTeNS2chO6X+uvlgdtUMTG2lWftyRw9bmGmpLKq3y\nGLFnENwJgpa5QOkRbD1RbFctxilMoVYGIcg/sGIE0JwW2H1bq9HxDEut148DeB8K\nz4dehaepjK95S/5Re0wgLIgwCwVccrb22B9oGlbWETp9wotAbL8mAfv8TwIeW62k\nQzscbibbU8ucCMGCXM9imoPVakdCaldol5jugHQuLyW2E1aj5SV7zVFHP5FHXSK8\ntpZGmNOAp4kX3ZJymesLJljAyQ5Kw9+tKIDD6xL5u67yO8FnzJCjyhC6fZKWh1Mg\ng3oZolalRhg226/nAUeKRBhP5fknltev0sxIytKWjlK5xILWPzKEDRYgFF/jcKGU\nBSS+zu5Cop15ILkPy+tEbL63siDuhZzL96eb2uC5uWrXZTS3gM76n3lgZ2zf/60D\n2mOqRCzQbM7yTowGggOdhC7qDIsMKPHx2+/xBncTvpW6Xf7O6hSrfckUWSftkSAS\nNVtfZgTpTmxLbuLD7pXrx6UHOJpswjP1aJUCMvK0L1auw8cFVv8/XWReSJNPoD+S\n026SO7Pd/PApo/Oxda8kAgAcyelocMzZIEMGaLOWh72S79BVG9/FTlG7n7XJYZ3Q\nJTtsInA/HSsZ7J+ZVbh3fvOIeSPtqx8Hh/PnF9zIX+/nPVGHny9ByxsGFqwleix8\ninp65G15wHZe0y207aq83yEdLR+X9lJGxFt9s/oDqNgczve52tTmycwD14/OZ+Oz\nuvYDXDDrLalqGT5KOPc37mr6tSZIg2gehhzAPrB/WOA/u/9HT24wuFtiMTfSm/Ru\ny+oLRnh/8UghJ8kr1U4T843tj+em+T3rZsqAY+aBVkxEAWylPKV0b+2pWAxHdmHP\nxYj4POEd8bdpsex6UTq3vIczI3uNoSfBGLRyilurIVGm2JKH8bABhH5NuYr8ijF4\nnLZbBjEnZVMZGABi/o2o+PFv7X6B2gBQO+U0zEbBKV6KcB1/1IboDUCNTG3ggKaw\nVtcFtRGr9HAN7VvgwWhmK63UZ89bZecE3AevnyDkWCeV1P61oCVbDb1DcqRuJUNE\n4Ild+XP07EY/cfUdJun1pzYfO8H6WlihLr7A1cFKwWcs\n-----END ENCRYPTED PRIVATE KEY-----\n',_binary '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsXlrpM4ALKFck6TZfMQl\nY53kFyXa8c5GXTDwO8sWYgDf0Cak4WoFWTRUJXwOHf379wmF4kzR27X01XCycTAY\nvn8o+Y2dAkaNDzwTcYRxRPuj2RKHC9UfUKAShBmp/wh3YxpsZzPObG92L+p8ChoO\ncd2ixs5I776pigX2X2W8dSkKfSCZVpCEDThgsOIM3sflU9ya3QPuin8s34/FH/B6\nwPWA5M2Mkl9fChn4ZkzhpCgdYsEBagbYGrOh4MVX5m2t2QNUgU8Dmnaf6aG5tlCw\nsRJlMnl/Y/nDk6UgxlxIHus4NvNSC3a9vt25wwfy4ZnQQlOXvSOX/M3mMdNX8AkF\n+wIDAQAB\n-----END PUBLIC KEY-----\n',1687769475430),(14600444038512300657,4312371431895289161,17,1687965497281,_binary '-----BEGIN ENCRYPTED PRIVATE KEY-----\nMIIFLTBXBgkqhkiG9w0BBQ0wSjApBgkqhkiG9w0BBQwwHAQIHu2mhPhiv18CAggA\nMAwGCCqGSIb3DQIJBQAwHQYJYIZIAWUDBAEqBBD9/QibAQCD0X7/OMFL0cH+BIIE\n0PxPDRu99mSSi13NzORfQKUepfuRBE6TodWTEliVmKVTxgUyhtaD48bvNK3eVcER\ngzSDwhrlWqBrdgjt0T0lz5YO7pN1obJfdbO/qkEbfE2KqY1p0JG3MqRyCX6rv5tV\nLkpVV47L4fGLr4tcIWo7ZT3VEfL9L3dTyLbHXW0nvj4kJfgf6aJfOcYXhdBNhgSP\ns5WLXDz8bofuNpcmISFZRKlGXxB86T4oLHwxRDAREcOQ0xaAkjSCgrlmAqkjrs+/\nYm9uN76MkB0N3bK7CHKutiNKOl1mkt/VpU+tmzozPXGKNPzuhXVUYj7VmTzfGPiO\nbvMu6jy45qpEyMQUIrhed1IcgLJWBM7SlCf3oTODYjfxfAm8MaVcKknMtxSPmrTN\nXXF3pebhroYvzgmVwWVqsnCEhi9UJgspSlmICus/R8iuK/TpchErAZ7JP3MFYudY\nJdPbRNt4zHfBck/k9eyGQB9ck59LZCkmYepCDRAevv/XpGcXa6SsQ+Ij3NAGkqpB\nTzQbCrl1HFCKeQVbmHS6cvCc1jX4bA/O4bemYfEsuWqb8HdktsQlc4Y4jr27lyes\nKNwHDJkeSFygq+y3Xa+oSe2eOMSmW9SFPUIjwt4Gt8EJ3zdL7D8aOy9xJ6bGHYu7\nLhiZ/T6luqnWlnucRUIjQi4LajdNGNzXGd/hga2w2uryxOE4URhT5k8rJKrpNUl+\neix3v1l4wLW013pGdaUvifd8iLuWtyzXl7kwhTaz2J3ziCPBAlRKXB1b6t7dil4H\n518c0H9zaQog/VrDsw7zLChMPpnmhIyDJLKyAFHBMpqymGNCklgrEdE7kMwxYBSf\nZyYcz4hPWXfts+m4MZbnIvN3QVCaCGT61YaS6KhM0GDBN4FGlS59fCcXIUK9Ur3H\nucKnkuI5GCM5XskbJuzQiBUgH+3R7YCtPkTutf6Ka8a1OurCoa2ajIwFuU4c+Ho7\nxe1fIrM/LUN+0OPyp+jaW1kWmDzXiFebihOkOzOfyWYq94+F5fM763WnNy2mDyJo\nI83BkSlsPi+F/7MUkfBryPagOkt6TSklavELywh8IlBYD4Vgj5qg0ZiwixilcrBw\nzxkBeKvr9b7H9N9+SbCpLV3nlZmdI/NyrhCKeuanNt6CJJfFulHwdvYLIiZvZbs7\nwX1w3WIGEr79X447wYD6apCtOYjv676CezXM/IWy4er8uU3sJxW6rNvPoS7tYBkG\n32kzzDVeyZkehJ/SBg8zQJOCQWyDEpH1HizP3Jq3oqLmMezGTTl/Ido2WYOk20gU\nAEht1JBQHlZvTox6fUHA4E66WA0z5PT1F2Oq70ROLyOzpWtNp27QhIZ6aAWVeMDa\npwvsC0xEkJ6m3aigIpWpcSy/rS7ji3wLhbHdDZHvRQ8M3IRtoL2JlGLAhQoPrCFK\n724yhroFr+/BV0Xwwo3LeUmt+VQ8QXkH0n0m9OwesB6ukBKE9pqWX3Eh1r6g8HOa\ndhzfqqkHdENoLu86suFgPFVVOsim8oNcQeVphFg4Qck+vNGMaT8diWV+LjqfhlSH\nui/wMh38UnO7QIr88tqXXLzB3W2p7r0D9checVFTxSBYg5q3Y5Hp9wPL19quX4hW\n7bHsptchPNcCAd+T2cNqd62HBIvNUZ0OoCz4PHZoh6qI\n-----END ENCRYPTED PRIVATE KEY-----\n',_binary '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjlkq8sjtRnhb2KF2zs/N\ntRix1MQs+dLbNCq8Wg0PIqnVupyusg5kcxLAGFKREcfD1uiTjpiAdFFlNa0kcs9y\nGYu6SXCIB+hBS6EqvIDim3VOMFKDH/PkvZa1KedNHE1jBi0nH+70GdP/TUWY6+vJ\na91nzEuBWBCTBeiAosLVx06zMqSL1mLBEs08UDgt5RUFXQN0EeItupMlIGvYU4IL\ntfJEE6UxA2MfFXXRUeCE0ryAgzVAiT3q/o9hOf9tRACflAqcGvfZpH/cKHglnv/X\n+jTNO8Rtnd9nxR8Ti0zja8yFkhV+hB81tkW03sax2Cbra3hCqxYL8Iyrhuzdon/c\nFwIDAQAB\n-----END PUBLIC KEY-----\n',1687961297281);
/*!40000 ALTER TABLE `session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(45) NOT NULL,
  `passw` blob,
  `picture` blob,
  `name` varchar(45) DEFAULT NULL,
  `salt` blob,
  `fail_a` int DEFAULT '0',
  `fail_date` bigint DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'wasya@mail.ru',_binary '123',_binary 'jpeeeeg','Wasya',NULL,0,0),(17,'andrej_chud@meta.ua',_binary '\Øp\ÄÁ°{\×zŠ\ni¡aÈ—ø4U¬dÀu\íC\ÙJ\Ì\ì÷|X\èEü\Ðc¯ @Á(²s\Øh[VPò|‡ºw®',_binary '0','Alexander',_binary '19932df3bd9aeaa254f5862ab08e7758',1,1687952699000);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-06-30 19:41:37
