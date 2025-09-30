# SQL Stored Procedure to Java + MongoDB Migration Prompt

## How to Use This Prompt

1. Copy this entire markdown file content
1. Open VSCode and press `Ctrl+I` (Windows/Linux) or `Cmd+I` (Mac) to open GitHub Copilot Chat
1. Paste the prompt and replace `[PASTE YOUR STORED PROCEDURE HERE]` with your actual stored procedure
1. Submit to Claude LLM via Copilot

-----

## Migration Prompt Template

### Context

I need to migrate SQL stored procedures to Java application code using MongoDB as the database. The migration should follow modern Java best practices with Spring Boot and MongoDB.

### Current Environment

- **Source**: SQL Server/PostgreSQL/Oracle stored procedures
- **Target**: Java 21 with Spring Boot 3.x
- **Database**: MongoDB 7.0+
- **Framework**: Spring Data MongoDB
- **Build Tool**: Maven or Gradle

### Requirements

#### Code Generation Standards

1. Convert SQL stored procedure logic to Java methods
1. Use Spring Data MongoDB for database operations
1. Implement proper error handling and logging
1. Follow clean code principles and SOLID design patterns
1. Add comprehensive JavaDoc comments
1. Include unit tests with JUnit 5 and Mockito
1. Use reactive programming patterns where beneficial

#### MongoDB Conversion Guidelines

1. Transform SQL queries to MongoDB aggregation pipelines
1. Convert JOINs to appropriate MongoDB operations:
- Use `$lookup` for reference relationships
- Use embedded documents for one-to-one or one-to-many relationships
- Use application-level joins when necessary
1. Replace SQL transactions with MongoDB multi-document transactions where needed
1. Optimize queries using MongoDB indexes
1. Use reactive programming (Project Reactor) for async operations where beneficial
1. Implement proper data denormalization strategies

#### Architecture Pattern

- **Service Layer**: Business logic implementation
- **Repository Layer**: Data access with Spring Data MongoDB
- **DTO Pattern**: Request/Response objects for API layer
- **Entity Mapping**: MongoDB document models
- **Dependency Injection**: Constructor-based injection
- **Exception Handling**: Custom exception hierarchy
- **Validation**: Bean Validation (JSR-380)

### Stored Procedure to Convert

```sql
[PASTE YOUR STORED PROCEDURE HERE]

-- Example:
-- CREATE PROCEDURE sp_GetCustomerOrders
--     @CustomerId INT,
--     @StartDate DATE,
--     @EndDate DATE
-- AS
-- BEGIN
--     SELECT o.OrderId, o.OrderDate, o.TotalAmount, c.CustomerName
--     FROM Orders o
--     INNER JOIN Customers c ON o.CustomerId = c.CustomerId
--     WHERE o.CustomerId = @CustomerId
--       AND o.OrderDate BETWEEN @StartDate AND @EndDate
--     ORDER BY o.OrderDate DESC;
-- END
```

### Expected Output

Generate the following Java components with complete, production-ready code:

#### 1. Entity Classes (MongoDB Documents)

```java
// Requirements:
- Use @Document annotation for collection mapping
- Use @Id for primary key (typically String for MongoDB ObjectId)
- Use @Field annotation for field mapping
- Include @Indexed annotations for performance
- Add validation annotations (@NotNull, @Size, @Email, etc.)
- Implement builder pattern using Lombok @Builder
- Add @Data or specific @Getter/@Setter annotations
- Include proper equals() and hashCode() methods
- Add createdDate and lastModifiedDate audit fields
- Use @Version for optimistic locking if needed
```

#### 2. Repository Interfaces

```java
// Requirements:
- Extend MongoRepository<Entity, String> or ReactiveMongoRepository
- Define custom query methods with proper naming convention
- Use @Query annotation for complex MongoDB queries
- Implement aggregation pipeline methods if needed
- Add @Aggregation annotation for aggregation pipelines
- Include pagination and sorting support
- Use Optional<T> for single result queries
```

#### 3. Service Classes

```java
// Requirements:
- Use @Service annotation
- Implement interface-based design
- Use constructor-based dependency injection
- Add @Transactional where needed (MongoDB transactions)
- Implement proper error handling with custom exceptions
- Add logging with SLF4J (@Slf4j from Lombok)
- Use @Async for asynchronous operations
- Implement caching with @Cacheable where appropriate
- Add business validation logic
- Document all public methods with JavaDoc
```

#### 4. DTO Classes (Data Transfer Objects)

```java
// Requirements:
- Separate Request and Response DTOs
- Use Java records for immutable DTOs (Java 14+)
- Add validation annotations on Request DTOs
- Create mapper classes or use MapStruct
- Include builder pattern for complex DTOs
- Add JsonProperty annotations for API contracts
- Implement proper serialization/deserialization
```

#### 5. Exception Handling

```java
// Requirements:
- Create custom exception hierarchy
- Implement @ControllerAdvice for global exception handling
- Define specific exceptions for business logic errors
- Include proper HTTP status codes
- Add error response DTOs
- Log exceptions appropriately
```

#### 6. Unit Tests

```java
// Requirements:
- Use JUnit 5 (@Test, @BeforeEach, @AfterEach)
- Mock dependencies with Mockito (@Mock, @InjectMocks)
- Use @DataMongoTest for repository tests
- Implement integration tests with embedded MongoDB
- Test happy path and edge cases
- Test exception scenarios
- Use AssertJ for fluent assertions
- Achieve minimum 80% code coverage
- Include test data builders
```

#### 7. MongoDB Aggregation Pipeline Documentation

```javascript
// Requirements:
- Document the equivalent MongoDB shell commands
- Explain the conversion logic from SQL to MongoDB
- Include index creation recommendations
- Add performance considerations and optimization tips
- Show query execution plans
- Suggest compound indexes for complex queries
```

#### 8. Configuration Classes

```java
// Requirements:
- MongoDB configuration class (@Configuration)
- Connection settings and replica set configuration
- Transaction manager setup
- Converter registration for custom types
- Audit configuration for createdDate/modifiedDate
- Index creation on application startup
```

### Code Style Requirements

#### Java Standards

- Use **Java 21 features**:
  - Records for immutable data classes
  - Pattern matching for instanceof
  - Text blocks for multi-line strings
  - Sealed classes where appropriate
  - Switch expressions
- Follow **Google Java Style Guide**
- Use **Lombok annotations** to reduce boilerplate:
  - `@Data`, `@Builder`, `@Slf4j`
  - `@RequiredArgsConstructor`, `@AllArgsConstructor`
  - `@Getter`, `@Setter` where needed
- Implement proper **exception handling hierarchy**
- Use **Spring Boot best practices**
- Follow **SOLID principles**

#### Naming Conventions

- **Classes**: PascalCase (e.g., `CustomerOrderService`)
- **Methods**: camelCase (e.g., `findCustomerOrders`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Packages**: lowercase (e.g., `com.company.service`)

#### Documentation

- Add JavaDoc for all public classes and methods
- Include `@param`, `@return`, `@throws` tags
- Document complex business logic with inline comments
- Add TODO comments for manual review items

### Additional Considerations

#### Performance Optimization

- Identify potential N+1 query problems and solutions
- Suggest batch operations where applicable
- Recommend connection pool settings
- Highlight queries that might need optimization
- Suggest using indexes and compound indexes
- Consider read preferences for queries (primary, secondary)

#### Schema Design

- Recommend MongoDB schema design improvements
- Suggest embedding vs referencing strategies
- Identify opportunities for denormalization
- Recommend sharding keys for scalability

#### Security

- Implement field-level encryption for sensitive data
- Use MongoDB roles and permissions
- Validate all inputs to prevent injection attacks
- Sanitize data before storage

#### Scalability

- Consider replica set configuration
- Suggest sharding strategy for large collections
- Recommend caching strategies (Redis, Caffeine)
- Implement circuit breaker pattern for resilience

#### Migration Notes

- Document any assumptions made during conversion
- Highlight SQL features that don’t have direct MongoDB equivalents
- Suggest alternative approaches for complex SQL logic
- Note any logic that requires manual review
- Explain schema design decisions

### Project Structure

```
src/main/java/com/company/project/
├── config/
│   ├── MongoConfig.java              # MongoDB configuration
│   ├── CacheConfig.java              # Cache configuration
│   └── AsyncConfig.java              # Async configuration
├── domain/
│   ├── entity/
│   │   ├── Customer.java             # MongoDB documents
│   │   ├── Order.java
│   │   └── OrderDetail.java
│   └── enums/                        # Enumerations
├── repository/
│   ├── CustomerRepository.java       # Spring Data repositories
│   ├── OrderRepository.java
│   └── custom/                       # Custom repository implementations
├── service/
│   ├── CustomerOrderService.java     # Service interfaces
│   ├── impl/
│   │   └── CustomerOrderServiceImpl.java
│   └── dto/
│       ├── request/
│       │   └── CustomerOrderRequest.java
│       ├── response/
│       │   └── CustomerOrderResponse.java
│       └── mapper/
│           └── CustomerOrderMapper.java
├── exception/
│   ├── CustomException.java          # Base exception
│   ├── ResourceNotFoundException.java
│   ├── BusinessValidationException.java
│   └── GlobalExceptionHandler.java
├── util/
│   ├── DateUtils.java                # Utility classes
│   └── MongoQueryBuilder.java
└── constants/
    └── AppConstants.java             # Application constants
```

### Example Usage

**Input Stored Procedure:**

```sql
CREATE PROCEDURE sp_GetCustomerOrderSummary
    @CustomerId INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SELECT 
        c.CustomerId,
        c.CustomerName,
        COUNT(o.OrderId) as TotalOrders,
        SUM(o.TotalAmount) as TotalRevenue
    FROM Customers c
    LEFT JOIN Orders o ON c.CustomerId = o.CustomerId
    WHERE o.OrderDate BETWEEN @StartDate AND @EndDate
    GROUP BY c.CustomerId, c.CustomerName
    ORDER BY TotalRevenue DESC;
END
```

Please generate complete, production-ready code with all necessary imports, annotations, and documentation.
