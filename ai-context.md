# AI Context Template - Java Library Development

**Library**: [library-name]  
**Version**: [1.0.0-SNAPSHOT]  
**Type**: Feature | Enhancement | Bug Fix  
**Status**: Planning | In Progress | Testing | Complete

-----

## 1. Library Architecture

### Purpose

[2-3 sentences: What problem does this library solve?]

### Core Components

```
com.company.library/
├── api/           → Public interfaces
├── core/          → Implementation
├── util/          → Helper classes
└── exception/     → Custom exceptions
```

### Dependencies

```xml
<!-- Required -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>6.1.0</version>
</dependency>

<!-- Optional -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.16.0</version>
    <optional>true</optional>
</dependency>
```

### Design Decisions

|Decision     |Choice                     |Rationale              |
|-------------|---------------------------|-----------------------|
|API Style    |Fluent Builder             |Intuitive, IDE-friendly|
|Thread Safety|Immutable Objects          |Safe for concurrent use|
|Serialization|Jackson + Java Serializable|Flexibility            |

-----

## 2. AI Prompts for Development

### Prompt 1: Public API Design

```
Design public API for [library-name]:

Purpose: [What it does]

Create interface with builder pattern:

```java
public interface ServiceClient {
    
    // Factory method
    static ServiceClientBuilder builder() {
        return new DefaultServiceClientBuilder();
    }
    
    // Core operations
    Response execute(Request request);
    CompletableFuture<Response> executeAsync(Request request);
    
    // Configuration
    interface Builder {
        Builder withCredentials(Credentials creds);
        Builder withTimeout(Duration timeout);
        Builder withRetryPolicy(RetryPolicy policy);
        ServiceClient build();
    }
}
```

Requirements:

- Immutable after construction
- Thread-safe
- Fluent API
- Null-safe with @NonNull annotations
- Complete JavaDoc

```
### Prompt 2: Core Implementation
```

Implement DefaultServiceClient:

```java
@ThreadSafe
public class DefaultServiceClient implements ServiceClient {
    
    private final Credentials credentials;
    private final Duration timeout;
    private final RetryPolicy retryPolicy;
    private final HttpClient httpClient;
    
    // Private constructor
    private DefaultServiceClient(Builder builder) {
        this.credentials = requireNonNull(builder.credentials);
        this.timeout = builder.timeout;
        this.retryPolicy = builder.retryPolicy;
        this.httpClient = createHttpClient();
    }
    
    @Override
    public Response execute(Request request) {
        // Implementation with retry logic
    }
}
```

Include:

- Input validation
- Error handling
- Resource management (AutoCloseable)
- Defensive copies for mutable params
- Unit tests with Mockito

```
### Prompt 3: Exception Hierarchy
```

Create exception hierarchy:

```java
// Base exception
public class ServiceException extends RuntimeException {
    private final String errorCode;
    private final int httpStatus;
    
    public ServiceException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}

// Specific exceptions
public class ServiceAuthException extends ServiceException { }
public class ServiceTimeoutException extends ServiceException { }
public class ServiceRateLimitException extends ServiceException { }
```

Requirements:

- Extend from appropriate base (Runtime vs Checked)
- Include error codes
- Serializable
- Builder for complex exceptions
- JavaDoc with usage examples

```
### Prompt 4: Utility Classes
```

Create utility classes:

```java
public final class ValidationUtils {
    
    private ValidationUtils() {
        throw new AssertionError("No instances");
    }
    
    public static <T> T requireNonNull(T obj, String paramName) {
        if (obj == null) {
            throw new IllegalArgumentException(paramName + " cannot be null");
        }
        return obj;
    }
    
    public static String requireNonEmpty(String str, String paramName) {
        requireNonNull(str, paramName);
        if (str.trim().isEmpty()) {
            throw new IllegalArgumentException(paramName + " cannot be empty");
        }
        return str;
    }
}
```

Include:

- Private constructor
- Static methods only
- Input validation
- Clear error messages
- Unit tests for all methods

```
### Prompt 5: Comprehensive Tests
```

Create test suite:

```java
@ExtendWith(MockitoExtension.class)
class DefaultServiceClientTest {
    
    @Mock
    private HttpClient mockHttpClient;
    
    private ServiceClient client;
    
    @BeforeEach
    void setUp() {
        client = ServiceClient.builder()
            .withCredentials(new Credentials("key", "secret"))
            .withTimeout(Duration.ofSeconds(30))
            .build();
    }
    
    @Test
    void execute_withValidRequest_returnsSuccess() {
        // Arrange
        Request request = Request.builder()
            .withAction("getUser")
            .withParam("id", "123")
            .build();
        
        when(mockHttpClient.send(any())).thenReturn(successResponse());
        
        // Act
        Response response = client.execute(request);
        
        // Assert
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).isNotNull();
    }
    
    @Test
    void execute_withTimeout_throwsTimeoutException() {
        // Test timeout behavior
    }
    
    @Test
    void builder_withNullCredentials_throwsException() {
        // Test validation
    }
}
```

Include:

- Unit tests (JUnit 5)
- Integration tests
- Edge cases
- Error scenarios
- Performance tests for critical paths
- 90%+ code coverage

```
---

## 3. Test Strategy

### Unit Tests (JUnit 5 + Mockito)
```java
// Positive cases
✓ Valid input returns expected output
✓ Builder creates valid instance
✓ Fluent API chains correctly

// Negative cases
✓ Null parameters throw IllegalArgumentException
✓ Invalid state throws IllegalStateException
✓ Timeout triggers retry mechanism

// Edge cases
✓ Empty collections handled
✓ Very large inputs processed
✓ Concurrent access is thread-safe
```

### Integration Tests

```java
@SpringBootTest
class ServiceClientIntegrationTest {
    
    @Test
    void endToEndWorkflow() {
        // Real HTTP calls to test environment
        // Verify complete request/response cycle
    }
}
```

### Coverage Target

- Line Coverage: **90%+**
- Branch Coverage: **85%+**
- Critical paths: **100%**

-----

## 4. Documentation

### JavaDoc Standard

```java
/**
 * A thread-safe client for interacting with the XYZ service.
 * 
 * <p>This client supports both synchronous and asynchronous operations,
 * with built-in retry logic and connection pooling.
 * 
 * <p><b>Thread Safety:</b> This class is immutable and thread-safe.
 * 
 * <p><b>Example Usage:</b>
 * <pre>{@code
 * ServiceClient client = ServiceClient.builder()
 *     .withCredentials(new Credentials("key", "secret"))
 *     .withTimeout(Duration.ofSeconds(30))
 *     .build();
 * 
 * Response response = client.execute(
 *     Request.builder()
 *         .withAction("getUser")
 *         .withParam("id", "123")
 *         .build()
 * );
 * }</pre>
 * 
 * @author Your Name
 * @since 1.0.0
 * @see Request
 * @see Response
 */
public interface ServiceClient {
    
    /**
     * Executes a request synchronously.
     * 
     * @param request the request to execute, must not be {@code null}
     * @return the response, never {@code null}
     * @throws ServiceException if the request fails
     * @throws IllegalArgumentException if request is {@code null}
     */
    Response execute(@NonNull Request request);
}
```

### README.md

```markdown
# Library Name

Brief description of what the library does.

## Features
- Feature 1
- Feature 2
- Feature 3

## Installation

Maven:
```xml
<dependency>
    <groupId>com.company</groupId>
    <artifactId>library-name</artifactId>
    <version>1.0.0</version>
</dependency>
```

Gradle:

```gradle
implementation 'com.company:library-name:1.0.0'
```

## Quick Start

```java
ServiceClient client = ServiceClient.builder()
    .withCredentials(new Credentials("key", "secret"))
    .build();

Response response = client.execute(
    Request.builder()
        .withAction("getUser")
        .withParam("id", "123")
        .build()
);
```

## Configuration

|Property   |Type       |Default    |Description    |
|-----------|-----------|-----------|---------------|
|timeout    |Duration   |30s        |Request timeout|
|retryPolicy|RetryPolicy|Exponential|Retry strategy |

## Advanced Usage

### Async Operations

```java
CompletableFuture<Response> future = client.executeAsync(request);
future.thenAccept(response -> {
    // Handle response
});
```

### Custom Retry Policy

```java
ServiceClient client = ServiceClient.builder()
    .withRetryPolicy(RetryPolicy.builder()
        .withMaxAttempts(5)
        .withBackoff(Duration.ofSeconds(1))
        .build())
    .build();
```

## Error Handling

```java
try {
    Response response = client.execute(request);
} catch (ServiceAuthException e) {
    // Handle authentication error
} catch (ServiceTimeoutException e) {
    // Handle timeout
} catch (ServiceException e) {
    // Handle general error
}
```

## Requirements

- Java 11+
- Spring Framework 6.0+ (optional)

## License

Apache 2.0

```
### CHANGELOG.md
```markdown
# Changelog

## [1.0.0] - 2024-12-11

### Added
- Initial release
- ServiceClient with sync/async operations
- Builder pattern API
- Retry mechanism
- Connection pooling

### Fixed
- None

### Changed
- None

### Deprecated
- None
```

-----

## 5. Maven Configuration

### pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.company</groupId>
    <artifactId>library-name</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>
    
    <name>Library Name</name>
    <description>Brief description</description>
    <url>https://github.com/company/library-name</url>
    
    <properties>
        <java.version>11</java.version>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <dependencies>
        <!-- Required dependencies -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>6.1.0</version>
        </dependency>
        
        <!-- Optional dependencies -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.16.0</version>
            <optional>true</optional>
        </dependency>
        
        <!-- Test dependencies -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.1</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.mockito</groupId>
            <artifactId>mockito-core</artifactId>
            <version>5.8.0</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.assertj</groupId>
            <artifactId>assertj-core</artifactId>
            <version>3.24.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <!-- Compiler -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
            </plugin>
            
            <!-- Tests -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.3</version>
            </plugin>
            
            <!-- Code Coverage -->
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>0.8.11</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>prepare-agent</goal>
                        </goals>
                    </execution>
                    <execution>
                        <id>report</id>
                        <phase>test</phase>
                        <goals>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
            
            <!-- JavaDoc -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-javadoc-plugin</artifactId>
                <version>3.6.3</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>jar</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
            
            <!-- Sources -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-source-plugin</artifactId>
                <version>3.3.0</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>jar</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

-----

## 6. Development Checklist

### API Design

- [ ] Public interfaces defined
- [ ] Builder pattern implemented
- [ ] Method signatures clear and consistent
- [ ] Null-safe with annotations
- [ ] Thread-safety documented

### Implementation

- [ ] Core classes implemented
- [ ] Immutable where possible
- [ ] Input validation
- [ ] Resource cleanup (AutoCloseable)
- [ ] Exception hierarchy defined

### Testing

- [ ] Unit tests: 90%+ coverage
- [ ] Integration tests
- [ ] Edge cases covered
- [ ] Thread-safety verified
- [ ] Performance benchmarks

### Documentation

- [ ] JavaDoc on all public APIs
- [ ] README with examples
- [ ] CHANGELOG maintained
- [ ] Usage guide
- [ ] Migration guide (if applicable)

### Build

- [ ] Maven build succeeds
- [ ] Tests pass
- [ ] JavaDoc generates without warnings
- [ ] Sources JAR created
- [ ] No compiler warnings

### Quality

- [ ] Code style consistent
- [ ] No PMD/Checkstyle violations
- [ ] Dependencies up-to-date
- [ ] Security scan clean
- [ ] License headers present

-----

## 7. Quick Usage with AI

### Daily Workflow

**1. Fill Architecture (10 min)**

```
Purpose: [What it solves]
Components: [Package structure]
Dependencies: [Key libraries]
```

**2. Execute Prompts in Windsurf/Cursor**

```
Copy architecture + Prompt 1 → Generate API
Review → Test → Commit

Copy Prompt 2 → Generate Implementation  
Review → Test → Commit

Repeat for Prompts 3-5
```

**3. Validate**

```bash
mvn clean test
mvn jacoco:report  # Check coverage
mvn javadoc:javadoc  # Verify docs
```

### Common Commands

```bash
# Build
mvn clean install

# Test with coverage
mvn clean test jacoco:report

# Generate docs
mvn javadoc:javadoc

# Check for updates
mvn versions:display-dependency-updates

# Create release
mvn release:prepare
mvn release:perform
```

-----

## Tips for Java Libraries

✅ **Do This:**

- Use builder pattern for complex objects
- Make classes immutable when possible
- Validate inputs early
- Document thread-safety
- Provide fluent APIs
- Include usage examples in JavaDoc

❌ **Avoid This:**

- Public mutable fields
- Mutable static state
- Throwing generic Exception
- Exposing implementation details
- Breaking changes in minor versions

-----

**Version**: 1.0  
**Updated**: 2024-12-11
