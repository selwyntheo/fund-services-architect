# Multi-Instance Microservices Application

## Overview

This is a Spring Boot microservices application with React frontend, MongoDB backend, and Kafka for inter-service communication. The application is designed for multi-tenant deployment across different instances and use cases within the organization.

## Architecture

```
┌─────────────────┐
│  React Frontend │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────┐
│   API Gateway   │◄────►│    Eureka    │
└────────┬────────┘      │   Discovery  │
         │               └──────────────┘
         ↓
    ┌────────────────────────────┐
    │   Microservices Layer      │
    ├────────────────────────────┤
    │ ┌──────────┐ ┌──────────┐ │
    │ │Service A │ │Service B │ │
    │ └─────┬────┘ └────┬─────┘ │
    │       │           │        │
    │       └─────┬─────┘        │
    └─────────────┼──────────────┘
                  ↓
         ┌────────────────┐
         │  Kafka Cluster │
         └────────────────┘
                  ↓
         ┌────────────────┐
         │    MongoDB     │
         └────────────────┘
```

## Table of Contents

1. [Prerequisites](#prerequisites)
1. [Quick Start](#quick-start)
1. [Project Structure](#project-structure)
1. [Configuration](#configuration)
1. [Kafka Setup](#kafka-setup)
1. [MongoDB Setup](#mongodb-setup)
1. [Service Dependencies](#service-dependencies)
1. [GitLab CI/CD](#gitlab-cicd)
1. [Deployment](#deployment)
1. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

-----

## Prerequisites

### Required Software

|Software     |Version|Purpose            |
|-------------|-------|-------------------|
|Java JDK     |17+    |Application runtime|
|Maven        |3.8+   |Build tool         |
|Node.js      |18+    |Frontend build     |
|MongoDB      |5.0+   |Primary database   |
|Apache Kafka |3.4+   |Message broker     |
|Docker       |20.10+ |Containerization   |
|GitLab Runner|Latest |CI/CD automation   |

### Required Access

- GitLab repository access with appropriate permissions
- MongoDB cluster connection credentials
- Kafka cluster connection details
- Container registry access (if using Docker)
- Target deployment environment access

-----

## Quick Start

### 1. Clone the Repository

```bash
git clone https://gitlab.yourorg.com/your-group/microservices-app.git
cd microservices-app
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your instance-specific values
nano .env
```

### 3. Build All Services

```bash
# Build backend services
mvn clean install -DskipTests

# Build frontend
cd frontend
npm install
npm run build
cd ..
```

### 4. Run Locally (Development)

```bash
# Start infrastructure
docker-compose up -d mongodb kafka zookeeper

# Start services (in separate terminals)
cd service-a && mvn spring-boot:run
cd service-b && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run

# Start frontend
cd frontend && npm start
```

-----

## Project Structure

```
microservices-app/
├── README.md
├── docker-compose.yml
├── .env.example
├── pom.xml (parent)
│
├── api-gateway/
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile
│   └── application.yml
│
├── service-discovery/
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile
│   └── application.yml
│
├── service-a/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       ├── application-staging.yml
│   │   │       └── application-prod.yml
│   ├── pom.xml
│   ├── Dockerfile
│   └── .gitlab-ci.yml
│
├── service-b/
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile
│   └── .gitlab-ci.yml
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   ├── .env.example
│   └── .gitlab-ci.yml
│
├── config/
│   ├── kafka/
│   │   ├── topics.json
│   │   └── setup-topics.sh
│   ├── mongodb/
│   │   ├── init-db.js
│   │   └── indexes.js
│   └── nginx/
│       └── nginx.conf
│
├── scripts/
│   ├── setup-local.sh
│   ├── deploy-instance.sh
│   └── health-check.sh
│
└── docs/
    ├── DEPLOYMENT.md
    ├── CONFIGURATION.md
    ├── KAFKA_TOPICS.md
    ├── MONGODB_SCHEMA.md
    └── TROUBLESHOOTING.md
```

-----

## Configuration

### Environment Variables

Each service requires specific environment variables. Copy `.env.example` to `.env` and configure:

#### Global Configuration

```bash
# Instance Identification
INSTANCE_NAME=production-instance-01
ENVIRONMENT=production

# Service Discovery
EUREKA_SERVER_URL=http://service-discovery:8761/eureka

# MongoDB Configuration
MONGODB_URI=mongodb://username:password@mongodb-host:27017/
MONGODB_DATABASE=microservices_db_${INSTANCE_NAME}

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=kafka-broker1:9092,kafka-broker2:9092
KAFKA_GROUP_ID=${INSTANCE_NAME}-consumer-group
KAFKA_TOPIC_PREFIX=${INSTANCE_NAME}

# Security
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=86400000

# Logging
LOG_LEVEL=INFO
LOG_PATH=/var/logs/microservices
```

#### Service-Specific Configuration

**API Gateway (`api-gateway/application.yml`)**

```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      routes:
        - id: service-a
          uri: lb://service-a
          predicates:
            - Path=/api/service-a/**
          filters:
            - RewritePath=/api/service-a/(?<path>.*), /$\{path}
        
        - id: service-b
          uri: lb://service-b
          predicates:
            - Path=/api/service-b/**
          filters:
            - RewritePath=/api/service-b/(?<path>.*), /$\{path}

eureka:
  client:
    serviceUrl:
      defaultZone: ${EUREKA_SERVER_URL}
  instance:
    preferIpAddress: true
```

**Service A (`service-a/application.yml`)**

```yaml
server:
  port: 8081

spring:
  application:
    name: service-a
  
  data:
    mongodb:
      uri: ${MONGODB_URI}
      database: ${MONGODB_DATABASE}
      auto-index-creation: true
  
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS}
    consumer:
      group-id: ${KAFKA_GROUP_ID}
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: '*'
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    
eureka:
  client:
    serviceUrl:
      defaultZone: ${EUREKA_SERVER_URL}
  instance:
    preferIpAddress: true

# Service-specific configuration
service-a:
  kafka:
    topics:
      input: ${KAFKA_TOPIC_PREFIX}.service-a.input
      output: ${KAFKA_TOPIC_PREFIX}.service-a.output
      error: ${KAFKA_TOPIC_PREFIX}.service-a.error
```

### Profile-Based Configuration

Use Spring profiles for environment-specific settings:

```bash
# Development
java -jar service-a.jar --spring.profiles.active=dev

# Staging
java -jar service-a.jar --spring.profiles.active=staging

# Production
java -jar service-a.jar --spring.profiles.active=prod
```

-----

## Kafka Setup

### Topic Naming Convention

```
{instance-name}.{service-name}.{topic-type}

Examples:
- prod-01.service-a.user-events
- prod-01.service-b.order-processing
- prod-01.common.notifications
```

### Required Topics

Create topics using the provided configuration:

**config/kafka/topics.json**

```json
{
  "topics": [
    {
      "name": "{INSTANCE_NAME}.service-a.user-events",
      "partitions": 3,
      "replication-factor": 2,
      "config": {
        "retention.ms": "604800000",
        "cleanup.policy": "delete"
      }
    },
    {
      "name": "{INSTANCE_NAME}.service-a.user-events-dlq",
      "partitions": 1,
      "replication-factor": 2,
      "config": {
        "retention.ms": "2592000000"
      }
    },
    {
      "name": "{INSTANCE_NAME}.service-b.order-processing",
      "partitions": 5,
      "replication-factor": 2,
      "config": {
        "retention.ms": "604800000"
      }
    },
    {
      "name": "{INSTANCE_NAME}.service-b.order-processing-dlq",
      "partitions": 1,
      "replication-factor": 2
    },
    {
      "name": "{INSTANCE_NAME}.common.notifications",
      "partitions": 2,
      "replication-factor": 2,
      "config": {
        "retention.ms": "259200000"
      }
    }
  ]
}
```

### Creating Topics

**Automated Setup Script (`config/kafka/setup-topics.sh`)**

```bash
#!/bin/bash

INSTANCE_NAME=$1
KAFKA_BOOTSTRAP_SERVERS=$2

if [ -z "$INSTANCE_NAME" ] || [ -z "$KAFKA_BOOTSTRAP_SERVERS" ]; then
    echo "Usage: ./setup-topics.sh <instance-name> <kafka-bootstrap-servers>"
    exit 1
fi

# Read topics from JSON and create them
jq -r '.topics[] | @json' config/kafka/topics.json | while read topic; do
    TOPIC_NAME=$(echo $topic | jq -r '.name' | sed "s/{INSTANCE_NAME}/$INSTANCE_NAME/g")
    PARTITIONS=$(echo $topic | jq -r '.partitions')
    REPLICATION=$(echo $topic | jq -r '."replication-factor"')
    
    echo "Creating topic: $TOPIC_NAME"
    
    kafka-topics.sh --create \
        --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS \
        --topic $TOPIC_NAME \
        --partitions $PARTITIONS \
        --replication-factor $REPLICATION \
        --if-not-exists
    
    # Apply additional configurations
    CONFIGS=$(echo $topic | jq -r '.config // empty | to_entries | map("--config \(.key)=\(.value)") | join(" ")')
    
    if [ ! -z "$CONFIGS" ]; then
        kafka-configs.sh --alter \
            --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS \
            --topic $TOPIC_NAME \
            $CONFIGS
    fi
done

echo "Kafka topics setup completed!"
```

### Kafka Consumer Configuration

```java
@Configuration
@EnableKafka
public class KafkaConsumerConfig {
    
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;
    
    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;
    
    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        
        return new DefaultKafkaConsumerFactory<>(config);
    }
    
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        
        // Error handling
        factory.setCommonErrorHandler(new DefaultErrorHandler(
            new FixedBackOff(1000L, 3)
        ));
        
        return factory;
    }
}
```

### Kafka Producer Configuration

```java
@Configuration
public class KafkaProducerConfig {
    
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;
    
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        
        return new DefaultKafkaProducerFactory<>(config);
    }
    
    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

-----

## MongoDB Setup

### Connection Configuration

**Application Configuration**

```yaml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI}
      database: ${MONGODB_DATABASE}
      auto-index-creation: true
      
      # Connection pool settings
      connection-pool:
        max-size: 50
        min-size: 10
        max-wait-time: 120000
        max-connection-life-time: 0
        max-connection-idle-time: 0
```

### Database Initialization

**config/mongodb/init-db.js**

```javascript
// Initialize database for new instance
db = db.getSiblingDB('microservices_db_' + process.env.INSTANCE_NAME);

// Create collections
db.createCollection('users');
db.createCollection('orders');
db.createCollection('transactions');
db.createCollection('audit_logs');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });
db.users.createIndex({ "status": 1, "lastLogin": -1 });

db.orders.createIndex({ "orderId": 1 }, { unique: true });
db.orders.createIndex({ "userId": 1, "createdAt": -1 });
db.orders.createIndex({ "status": 1, "createdAt": -1 });
db.orders.createIndex({ "totalAmount": 1 });

db.transactions.createIndex({ "transactionId": 1 }, { unique: true });
db.transactions.createIndex({ "orderId": 1 });
db.transactions.createIndex({ "userId": 1, "timestamp": -1 });
db.transactions.createIndex({ "status": 1 });

db.audit_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 7776000 }); // 90 days
db.audit_logs.createIndex({ "entityType": 1, "entityId": 1, "timestamp": -1 });

print('Database initialization completed for instance: ' + process.env.INSTANCE_NAME);
```

### MongoDB Entity Examples

```java
@Document(collection = "users")
@Data
public class User {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String email;
    
    @Indexed(unique = true)
    private String username;
    
    private String firstName;
    private String lastName;
    
    @Indexed
    private String status;
    
    @Indexed
    private LocalDateTime createdAt;
    
    @Indexed
    private LocalDateTime lastLogin;
    
    private Map<String, Object> metadata;
}
```

### Repository Configuration

```java
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    
    @Query("{ 'status': ?0, 'lastLogin': { $gte: ?1 } }")
    List<User> findActiveUsersSince(String status, LocalDateTime since);
    
    @Aggregation(pipeline = {
        "{ $match: { 'status': 'ACTIVE' } }",
        "{ $group: { _id: '$country', count: { $sum: 1 } } }",
        "{ $sort: { count: -1 } }"
    })
    List<UserCountByCountry> getUserStatsByCountry();
}
```

-----

## Service Dependencies

### Maven Parent POM

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.5</version>
    </parent>
    
    <groupId>com.yourorg</groupId>
    <artifactId>microservices-parent</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    
    <properties>
        <java.version>17</java.version>
        <spring-cloud.version>2022.0.4</spring-cloud.version>
        <lombok.version>1.18.30</lombok.version>
    </properties>
    
    <modules>
        <module>api-gateway</module>
        <module>service-discovery</module>
        <module>service-a</module>
        <module>service-b</module>
    </modules>
    
    <dependencyManagement>
        <dependencies>
            <!-- Spring Cloud -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    
    <dependencies>
        <!-- Common dependencies for all services -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### Service POM Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>com.yourorg</groupId>
        <artifactId>microservices-parent</artifactId>
        <version>1.0.0</version>
    </parent>
    
    <artifactId>service-a</artifactId>
    <version>1.0.0</version>
    
    <dependencies>
        <!-- Spring Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Spring Data MongoDB -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-mongodb</artifactId>
        </dependency>
        
        <!-- Spring Kafka -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>
        
        <!-- Eureka Client -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        
        <!-- Spring Cloud Config Client (optional) -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-config</artifactId>
        </dependency>
        
        <!-- Resilience4j (Circuit Breaker) -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
        </dependency>
        
        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- Security (if needed) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        
        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.11.5</version>
        </dependency>
        
        <!-- Micrometer for metrics -->
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
        </dependency>
    </dependencies>
</project>
```

-----

## GitLab CI/CD

### Pipeline Configuration

**.gitlab-ci.yml (Service Example)**

```yaml
stages:
  - build
  - test
  - package
  - deploy

variables:
  MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"
  DOCKER_REGISTRY: registry.gitlab.com/yourorg
  SERVICE_NAME: service-a

cache:
  paths:
    - .m2/repository
    - target/

build:
  stage: build
  image: maven:3.8-openjdk-17
  script:
    - mvn clean compile
  artifacts:
    paths:
      - target/
    expire_in: 1 hour
  only:
    - branches

test:
  stage: test
  image: maven:3.8-openjdk-17
  script:
    - mvn test
    - mvn jacoco:report
  coverage: '/Total.*?([0-9]{1,3})%/'
  artifacts:
    reports:
      junit:
        - target/surefire-reports/TEST-*.xml
      coverage_report:
        coverage_format: cobertura
        path: target/site/jacoco/jacoco.xml
  only:
    - branches

package:
  stage: package
  image: maven:3.8-openjdk-17
  script:
    - mvn package -DskipTests
    - mv target/*.jar target/${SERVICE_NAME}.jar
  artifacts:
    paths:
      - target/${SERVICE_NAME}.jar
    expire_in: 1 week
  only:
    - main
    - develop
    - /^release\/.*$/

docker-build:
  stage: package
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_REGISTRY/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA} .
    - docker tag $DOCKER_REGISTRY/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA} $DOCKER_REGISTRY/${SERVICE_NAME}:latest
    - docker push $DOCKER_REGISTRY/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA}
    - docker push $DOCKER_REGISTRY/${SERVICE_NAME}:latest
  dependencies:
    - package
  only:
    - main
    - develop

deploy-dev:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no deploy@dev-server "
        docker pull $DOCKER_REGISTRY/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA} &&
        docker stop ${SERVICE_NAME} || true &&
        docker rm ${SERVICE_NAME} || true &&
        docker run -d 
          --name ${SERVICE_NAME}
          --network microservices-network
          -e SPRING_PROFILES_ACTIVE=dev
          -e MONGODB_URI=${DEV_MONGODB_URI}
          -e KAFKA_BOOTSTRAP_SERVERS=${DEV_KAFKA_SERVERS}
          -e EUREKA_SERVER_URL=${DEV_EUREKA_URL}
          --restart unless-stopped
          $DOCKER_REGISTRY/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA}
      "
  environment:
    name: development
    url: https://dev.yourorg.com
  only:
    - develop

deploy-staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
  script:
    - ssh -o StrictHostKeyChecking=no deploy@staging-server "
        docker pull $DOCKER_REGISTRY/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA} &&
        docker stop ${SERVICE_NAME} || true &&
        docker rm ${SERVICE_NAME} || true &&
        docker run -d 
          --name ${SERVICE_NAME}
          --network microservices-network
          -e SPRING_PROFILES_ACTIVE=staging
          -e MONGODB_URI=${STAGING_MONGODB_URI}
          -e KAFKA_BOOTSTRAP_SERVERS=${STAGING_KAFKA_SERVERS}
          -e EUREKA_SERVER_URL=${STAGING_EUREKA_URL}
          --restart unless-stopped
          $DOCKER_REGISTRY/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA}
      "
  environment:
    name: staging
    url: https://staging.yourorg.com
  when: manual
  only:
    - main

deploy-production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
  script:
    - ssh -o StrictHostKeyChecking=no deploy@prod-server "
        docker pull $DOCKER_REGISTRY/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA} &&
        docker stop ${SERVICE_NAME} || true &&
        docker rm ${SERVICE_NAME} || true &&
        docker run -d 
          --name ${SERVICE_NAME}
          --network microservices-network
          -e SPRING_PROFILES_ACTIVE=prod
          -e MONGODB_URI=${PROD_MONGODB_URI}
          -e KAFKA_BOOTSTRAP_SERVERS=${PROD_KAFKA_SERVERS}
          -e EUREKA_SERVER_URL=${PROD_EUREKA_URL}
          --restart unless-stopped
          $DOCKER_REGISTRY/${SERVICE_NAME}:${CI_COMMIT_SHORT_SHA}
      "
  environment:
    name: production
    url: https://app.yourorg.com
  when: manual
  only:
    - main
```

-----

## Deployment

### New Instance Deployment Checklist

- [ ] **Step 1**: Define instance name and environment variables
- [ ] **Step 2**: Provision MongoDB database
- [ ] **Step 3**: Create Kafka topics with instance prefix
- [ ] **Step 4**: Configure GitLab CI/CD variables
- [ ] **Step 5**: Deploy infrastructure services (Eureka, Config Server)
- [ ] **Step 6**: Deploy backend microservices
- [ ] **Step 7**: Deploy API Gateway
- [ ] **Step 8**: Deploy frontend application
- [ ] **Step 9**: Verify health endpoints
- [ ] **Step 10**: Run smoke tests

### Deployment Script

**scripts/deploy-instance.sh**

```bash
#!/bin/bash

set -e

INSTANCE_NAME=$1
ENVIRONMENT=$2
MONGODB_URI=$3
KAFKA_SERVERS=$4

if [ -z "$INSTANCE_NAME" ] || [ -z "$ENVIRONMENT" ] || [ -z "$MONGODB_URI" ] || [ -z "$KAFKA_SERVERS" ]; then
    echo "Usage: ./deploy-instance.sh <instance-name> <environment> <mongodb-uri> <kafka-servers>"
    echo "Example: ./deploy-instance.sh prod-01 production mongodb://... kafka1:9092,kafka2:9092"
    exit 1
fi

echo "=========================================="
echo "Deploying Instance: $INSTANCE_NAME"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# 1. Setup MongoDB
echo "Step 1: Initializing MongoDB..."
MONGODB_DATABASE="microservices_db_${INSTANCE_NAME}"
export INSTANCE_NAME
mongosh "$MONGODB_URI" < config/mongodb/init-db.js
echo "✓ MongoDB initialized"

# 2. Setup Kafka Topics
echo "Step 2: Creating Kafka topics..."
./config/kafka/setup-topics.sh "$INSTANCE_NAME" "$KAFKA_SERVERS"
echo "✓ Kafka topics created"

# 3. Deploy Services
echo "Step 3: Deploying microservices..."

# Service Discovery
docker run -d \
    --name ${INSTANCE_NAME}-service-discovery \
    --network microservices-network \
    -p 8761:8761 \
    -e SPRING_PROFILES_ACTIVE=$ENVIRONMENT \
    -e INSTANCE_NAME=$INSTANCE_NAME \
    --restart unless-stopped \
    registry.gitlab.com/yourorg/service-discovery:latest

sleep 30 # Wait for Eureka to start

# Service A
docker run -d \
    --name ${INSTANCE_NAME}-service-a \
    --network microservices-network \
    -e SPRING_PROFILES_ACTIVE=$ENVIRONMENT \
    -e INSTANCE_NAME=$INSTANCE_NAME \
    -e MONGODB_URI=$MONGODB_URI \
    -e MONGODB_DATABASE=$MONGODB_DATABASE \
    -e KAFKA_BOOTSTRAP_SERVERS=$KAFKA_SERVERS \
    -e KAFKA_TOPIC_PREFIX=$INSTANCE_NAME \
    -e EUREKA_SERVER_URL=http://${INSTANCE_NAME}-service-discovery:8761/eureka \
    --restart unless-stopped \
    registry.gitlab.com/yourorg/service-a:latest

# Service B
docker run -d \
    --name ${INSTANCE_NAME}-service-b \
    --network microservices-network \
    -e SPRING_PROFILES_ACTIVE=$ENVIRONMENT \
    -e INSTANCE_NAME=$INSTANCE_NAME \
    -e MONGODB_URI=$MONGODB_URI \
    -e MONGODB_DATABASE=$MONGODB_DATABASE \
    -e KAFKA_BOOTSTRAP_SERVERS=$KAFKA_SERVERS \
    -e KAFKA_TOPIC_PREFIX=$INSTANCE_NAME \
    -e EUREKA_SERVER_URL=http://${INSTANCE_NAME}-service-discovery:8761/eureka \
    --restart unless-stopped \
    registry.gitlab.com/yourorg/service-b:latest

sleep 20 # Wait for services to register

# API Gateway
docker run -d \
    --name ${INSTANCE_NAME}-api-gateway \
    --network microservices-network \
    -p 8080:8080 \
    -e SPRING_PROFILES_ACTIVE=$ENVIRONMENT \
    -e INSTANCE_NAME=$INSTANCE_NAME \
    -e EUREKA_SERVER_URL=http://${INSTANCE_NAME}-service-discovery:8761/eureka \
    --restart unless-stopped \
    registry.gitlab.com/yourorg/api-gateway:latest

# Frontend
docker run -d \
    --name ${INSTANCE_NAME}-frontend \
    --network microservices-network \
    -p 3000:80 \
    -e REACT_APP_API_URL=http://${INSTANCE_NAME}-api-gateway:8080 \
    -e REACT_APP_INSTANCE_NAME=$INSTANCE_NAME \
    --restart unless-stopped \
    registry.gitlab.com/yourorg/frontend:latest

echo "✓ All services deployed"

# 4. Health Check
echo "Step 4: Running health checks..."
sleep 30
./scripts/health-check.sh $INSTANCE_NAME
echo "✓ Health checks passed"

echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="
echo "Instance: $INSTANCE_NAME"
echo "Service Discovery: http://localhost:8761"
echo "API Gateway: http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo "=========================================="
```

### Health Check Script

**scripts/health-check.sh**

```bash
#!/bin/bash

INSTANCE_NAME=$1

if [ -z "$INSTANCE_NAME" ]; then
    echo "Usage: ./health-check.sh <instance-name>"
    exit 1
fi

echo "Running health checks for instance: $INSTANCE_NAME"

# Function to check service health
check_service() {
    local service_name=$1
    local health_url=$2
    local max_attempts=10
    local attempt=1
    
    echo -n "Checking $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        response=$(curl -s -o /dev/null -w "%{http_code}" $health_url)
        
        if [ "$response" = "200" ]; then
            echo " ✓ Healthy"
            return 0
        fi
        
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo " ✗ Failed"
    return 1
}

# Check all services
check_service "Service Discovery" "http://localhost:8761/actuator/health"
check_service "Service A" "http://localhost:8081/actuator/health"
check_service "Service B" "http://localhost:8082/actuator/health"
check_service "API Gateway" "http://localhost:8080/actuator/health"
check_service "Frontend" "http://localhost:3000"

echo "Health check completed!"
```

-----

## Monitoring & Troubleshooting

### Health Endpoints

All services expose Spring Boot Actuator endpoints:

```
GET /actuator/health          # Basic health status
GET /actuator/health/liveness # Kubernetes liveness probe
GET /actuator/health/readiness # Kubernetes readiness probe
GET /actuator/info            # Application info
GET /actuator/metrics         # Available metrics
GET /actuator/prometheus      # Prometheus metrics
```

### Logging Configuration

**application.yml**

```yaml
logging:
  level:
    root: INFO
    com.yourorg: DEBUG
    org.springframework.kafka: INFO
    org.springframework.data.mongodb: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: /var/logs/microservices/${spring.application.name}.log
    max-size: 100MB
    max-history: 30
```

### Common Issues and Solutions

#### 1. Service Discovery Issues

**Problem**: Services not registering with Eureka

**Solution**:

```bash
# Check Eureka logs
docker logs ${INSTANCE_NAME}-service-discovery

# Verify service configuration
curl http://localhost:8761/eureka/apps

# Check network connectivity
docker network inspect microservices-network
```

#### 2. Kafka Connection Issues

**Problem**: Cannot connect to Kafka brokers

**Solution**:

```bash
# Test Kafka connectivity
kafka-console-consumer.sh \
    --bootstrap-server $KAFKA_SERVERS \
    --topic ${INSTANCE_NAME}.test \
    --from-beginning

# Check consumer group status
kafka-consumer-groups.sh \
    --bootstrap-server $KAFKA_SERVERS \
    --describe \
    --group ${INSTANCE_NAME}-consumer-group

# View topic configuration
kafka-topics.sh \
    --bootstrap-server $KAFKA_SERVERS \
    --describe \
    --topic ${INSTANCE_NAME}.service-a.user-events
```

#### 3. MongoDB Connection Issues

**Problem**: Cannot connect to MongoDB

**Solution**:

```bash
# Test MongoDB connection
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"

# Check database exists
mongosh "$MONGODB_URI" --eval "show dbs"

# Verify collections
mongosh "$MONGODB_URI" --eval "use microservices_db_${INSTANCE_NAME}; show collections"

# Check indexes
mongosh "$MONGODB_URI" --eval "use microservices_db_${INSTANCE_NAME}; db.users.getIndexes()"
```

#### 4. Performance Issues

**Problem**: Slow response times

**Diagnostic Steps**:

```bash
# Check service metrics
curl http://localhost:8080/actuator/metrics/http.server.requests

# Monitor Kafka lag
kafka-consumer-groups.sh \
    --bootstrap-server $KAFKA_SERVERS \
    --describe \
    --group ${INSTANCE_NAME}-consumer-group

# Check MongoDB slow queries
mongosh "$MONGODB_URI" --eval "
    use microservices_db_${INSTANCE_NAME};
    db.setProfilingLevel(1, { slowms: 100 });
    db.system.profile.find().limit(10).sort({ ts: -1 }).pretty()
"

# View active connections
docker stats
```

### Useful Commands

```bash
# View all running containers for an instance
docker ps | grep ${INSTANCE_NAME}

# View logs for a specific service
docker logs -f ${INSTANCE_NAME}-service-a

# Execute command in container
docker exec -it ${INSTANCE_NAME}-service-a bash

# View Kafka topics
kafka-topics.sh --bootstrap-server $KAFKA_SERVERS --list | grep $INSTANCE_NAME

# MongoDB shell access
mongosh "$MONGODB_URI"

# Restart a service
docker restart ${INSTANCE_NAME}-service-a

# Stop all services for an instance
docker stop $(docker ps -q --filter name=${INSTANCE_NAME})

# Remove all containers for an instance
docker rm $(docker ps -aq --filter name=${INSTANCE_NAME})
```

-----

## Frontend Configuration

### Environment Variables

**frontend/.env.example**

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080/ws

# Instance Configuration
REACT_APP_INSTANCE_NAME=dev-instance
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG=false

# OAuth (if applicable)
REACT_APP_AUTH_DOMAIN=auth.yourorg.com
REACT_APP_AUTH_CLIENT_ID=your-client-id
```

### Build Configuration

**frontend/package.json**

```json
{
  "name": "microservices-frontend",
  "version": "1.0.0",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src/**/*.{js,jsx,ts,tsx}",
    "format": "prettier --write src/**/*.{js,jsx,ts,tsx,css,md}"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "axios": "^1.5.0",
    "react-query": "^3.39.0",
    "@tanstack/react-table": "^8.10.0",
    "recharts": "^2.8.0",
    "lucide-react": "^0.263.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

### Frontend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

**config/nginx/nginx.conf**

```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Caching for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://api-gateway:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket proxy
    location /ws/ {
        proxy_pass http://api-gateway:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    error_page 404 /index.html;
}
```

-----

## Docker Compose (Development)

**docker-compose.yml**

```yaml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    networks:
      - microservices-network

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    networks:
      - microservices-network

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
      - ./config/mongodb/init-db.js:/docker-entrypoint-initdb.d/init-db.js
    networks:
      - microservices-network

  service-discovery:
    build: ./service-discovery
    ports:
      - "8761:8761"
    environment:
      SPRING_PROFILES_ACTIVE: dev
    networks:
      - microservices-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8761/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  service-a:
    build: ./service-a
    ports:
      - "8081:8081"
    environment:
      SPRING_PROFILES_ACTIVE: dev
      MONGODB_URI: mongodb://admin:password@mongodb:27017/
      MONGODB_DATABASE: microservices_db_dev
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      KAFKA_TOPIC_PREFIX: dev
      EUREKA_SERVER_URL: http://service-discovery:8761/eureka
    depends_on:
      - mongodb
      - kafka
      - service-discovery
    networks:
      - microservices-network

  service-b:
    build: ./service-b
    ports:
      - "8082:8082"
    environment:
      SPRING_PROFILES_ACTIVE: dev
      MONGODB_URI: mongodb://admin:password@mongodb:27017/
      MONGODB_DATABASE: microservices_db_dev
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      KAFKA_TOPIC_PREFIX: dev
      EUREKA_SERVER_URL: http://service-discovery:8761/eureka
    depends_on:
      - mongodb
      - kafka
      - service-discovery
    networks:
      - microservices-network

  api-gateway:
    build: ./api-gateway
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: dev
      EUREKA_SERVER_URL: http://service-discovery:8761/eureka
    depends_on:
      - service-discovery
    networks:
      - microservices-network

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      REACT_APP_API_URL: http://localhost:8080
      REACT_APP_INSTANCE_NAME: dev
    depends_on:
      - api-gateway
    networks:
      - microservices-network

volumes:
  mongodb_data:

networks:
  microservices-network:
    driver: bridge
```

-----

## Additional Documentation Files

### docs/CONFIGURATION.md

Detailed configuration guide for each service covering:

- Environment-specific configurations
- Security settings
- Performance tuning
- Monitoring and observability

### docs/KAFKA_TOPICS.md

Comprehensive Kafka documentation:

- Topic naming conventions
- Message schemas and contracts
- Consumer group configurations
- Error handling and retry strategies
- Dead letter queue patterns

### docs/MONGODB_SCHEMA.md

MongoDB schema documentation:

- Collection schemas
- Index strategies
- Data migration procedures
- Backup and restore procedures

### docs/TROUBLESHOOTING.md

Common issues and resolutions:

- Service startup issues
- Network connectivity problems
- Performance bottlenecks
- Data consistency issues

-----

## Security Considerations

### Environment Variables

**Never commit sensitive information**. Use:

- GitLab CI/CD variables for secrets
- Environment-specific configuration files (gitignored)
- External secret management (HashiCorp Vault, AWS Secrets Manager)

### Network Security

```yaml
# Example: Restrict network access
networks:
  microservices-network:
    driver: bridge
    internal: true  # Prevents external access
```

### Application Security

```java
// JWT Configuration Example
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS);
        
        return http.build();
    }
}
```

-----

## Support and Contribution

### Getting Help

- **Documentation**: Check the `/docs` folder
- **Issues**: Create a GitLab issue with detailed information
- **Internal Support**: Contact devops@yourorg.com

### Contributing

1. Create a feature branch from `develop`
1. Make your changes
1. Write tests
1. Submit a merge request
1. Wait for code review approval

-----

## License

Copyright © 2024 Your Organization. All rights reserved.

-----

## Appendix

### Service Ports

|Service          |Port |Purpose           |
|-----------------|-----|------------------|
|Service Discovery|8761 |Eureka Server     |
|API Gateway      |8080 |Main entry point  |
|Service A        |8081 |Business logic    |
|Service B        |8082 |Business logic    |
|Frontend         |3000 |React application |
|MongoDB          |27017|Database          |
|Kafka            |9092 |Message broker    |
|Zookeeper        |2181 |Kafka coordination|

### Environment Profiles

|Profile|Purpose               |Database       |Kafka             |
|-------|----------------------|---------------|------------------|
|dev    |Local development     |localhost      |localhost         |
|staging|Pre-production testing|staging-db     |staging-kafka     |
|prod   |Production            |prod-db-cluster|prod-kafka-cluster|

-----

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained By**: Platform Engineering Team
