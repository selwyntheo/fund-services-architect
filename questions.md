# In-Depth Java Interview Questions with Code Snippets

## 1. Memory Management & JVM

### Question 1: String Memory Management

```java
public class StringMemoryDemo {
    public static void main(String[] args) {
        String s1 = "Hello";
        String s2 = "Hello";
        String s3 = new String("Hello");
        String s4 = new String("Hello").intern();
        
        System.out.println("s1 == s2: " + (s1 == s2));
        System.out.println("s1 == s3: " + (s1 == s3));
        System.out.println("s1 == s4: " + (s1 == s4));
        System.out.println("s3 == s4: " + (s3 == s4));
    }
}
```

**Question:** Explain the output and why. How many String objects are created in memory?

**Expected Output:**

```
s1 == s2: true
s1 == s3: false
s1 == s4: true
s3 == s4: false
```

**Key Points to Cover:**

- String literal pool vs heap memory
- String interning mechanism
- Memory optimization with string literals
- Performance implications

-----

### Question 2: Reference Types and GC

```java
import java.lang.ref.*;
import java.util.*;

public class ReferenceDemo {
    public static void main(String[] args) throws InterruptedException {
        Object strongRef = new Object();
        WeakReference<Object> weakRef = new WeakReference<>(strongRef);
        SoftReference<Object> softRef = new SoftReference<>(strongRef);
        
        System.out.println("Before nullifying strong reference:");
        System.out.println("Weak ref: " + weakRef.get());
        System.out.println("Soft ref: " + softRef.get());
        
        strongRef = null;
        System.gc();
        Thread.sleep(100);
        
        System.out.println("After GC:");
        System.out.println("Weak ref: " + weakRef.get());
        System.out.println("Soft ref: " + softRef.get());
    }
}
```

**Question:** What will be the output? Explain when each reference type becomes null.

**Key Points to Cover:**

- WeakReference vs SoftReference vs PhantomReference
- GC behavior with different reference types
- Memory pressure scenarios
- Use cases for each reference type

-----

## 2. Concurrency & Threading

### Question 3: Volatile vs Synchronized

```java
public class VolatileDemo {
    private static boolean flag = false;
    private static volatile boolean volatileFlag = false;
    private static int counter = 0;
    
    public static void main(String[] args) throws InterruptedException {
        // Thread 1 - Writer
        Thread writer = new Thread(() -> {
            try {
                Thread.sleep(1000);
                flag = true;
                volatileFlag = true;
                counter = 100;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        // Thread 2 - Reader
        Thread reader = new Thread(() -> {
            while (!flag) {
                // This might loop forever
            }
            System.out.println("Flag changed, counter: " + counter);
        });
        
        writer.start();
        reader.start();
        
        reader.join();
        writer.join();
    }
}
```

**Question:** Will this code always terminate? What if we change `flag` to `volatileFlag`? Explain visibility guarantees.

**Key Points to Cover:**

- Memory visibility issues
- Happens-before relationship
- CPU caching and cache coherence
- When to use volatile vs synchronized

-----

### Question 4: Producer-Consumer with wait/notify

```java
import java.util.*;

public class ProducerConsumer {
    private Queue<Integer> queue = new LinkedList<>();
    private final int CAPACITY = 5;
    private final Object lock = new Object();
    
    public void produce() throws InterruptedException {
        int value = 0;
        while (true) {
            synchronized (lock) {
                while (queue.size() == CAPACITY) {
                    lock.wait();
                }
                queue.add(value++);
                System.out.println("Produced: " + (value - 1));
                lock.notifyAll();
            }
            Thread.sleep(1000);
        }
    }
    
    public void consume() throws InterruptedException {
        while (true) {
            synchronized (lock) {
                while (queue.isEmpty()) {
                    lock.wait();
                }
                int value = queue.poll();
                System.out.println("Consumed: " + value);
                lock.notifyAll();
            }
            Thread.sleep(1500);
        }
    }
    
    public static void main(String[] args) {
        ProducerConsumer pc = new ProducerConsumer();
        
        Thread producer = new Thread(() -> {
            try {
                pc.produce();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        Thread consumer = new Thread(() -> {
            try {
                pc.consume();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        producer.start();
        consumer.start();
    }
}
```

**Question:** Why use `notifyAll()` instead of `notify()`? What happens if we remove the `while` loops around `wait()`?

**Key Points to Cover:**

- Spurious wakeups
- notify() vs notifyAll() trade-offs
- Lost notification problem
- Alternative approaches using BlockingQueue

-----

## 3. Collections Framework Deep Dive

### Question 5: HashMap Collision Handling

```java
import java.util.*;

public class HashMapCollision {
    static class BadHashCode {
        private String value;
        
        public BadHashCode(String value) {
            this.value = value;
        }
        
        @Override
        public int hashCode() {
            return 1; // Intentionally bad - all objects have same hash
        }
        
        @Override
        public boolean equals(Object obj) {
            if (this == obj) return true;
            if (obj == null || getClass() != obj.getClass()) return false;
            BadHashCode that = (BadHashCode) obj;
            return Objects.equals(value, that.value);
        }
        
        @Override
        public String toString() {
            return value;
        }
    }
    
    public static void main(String[] args) {
        Map<BadHashCode, String> map = new HashMap<>();
        
        for (int i = 0; i < 10; i++) {
            map.put(new BadHashCode("key" + i), "value" + i);
        }
        
        System.out.println("Map size: " + map.size());
        System.out.println("Getting key5: " + map.get(new BadHashCode("key5")));
    }
}
```

**Question:** How does HashMap handle this scenario? What’s the performance impact? How does Java 8 improve this?

**Key Points to Cover:**

- Chaining vs open addressing
- Tree-ification in Java 8 (TREEIFY_THRESHOLD = 8)
- Load factor and rehashing
- Performance degradation from O(1) to O(n) to O(log n)

-----

### Question 6: ConcurrentHashMap vs HashMap

```java
import java.util.*;
import java.util.concurrent.*;

public class ConcurrentMapDemo {
    private static Map<String, Integer> hashMap = new HashMap<>();
    private static Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();
    
    public static void main(String[] args) throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(10);
        
        // Test HashMap
        for (int i = 0; i < 1000; i++) {
            final int index = i;
            executor.submit(() -> {
                hashMap.put("key" + index, index);
            });
        }
        
        // Test ConcurrentHashMap
        for (int i = 0; i < 1000; i++) {
            final int index = i;
            executor.submit(() -> {
                concurrentMap.put("key" + index, index);
            });
        }
        
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);
        
        System.out.println("HashMap size: " + hashMap.size());
        System.out.println("ConcurrentHashMap size: " + concurrentMap.size());
    }
}
```

**Question:** What issues might occur with HashMap? How does ConcurrentHashMap solve these problems?

**Key Points to Cover:**

- Race conditions and infinite loops in HashMap
- Segment-based locking (Java 7) vs CAS operations (Java 8+)
- Lock-free reads
- Performance comparison

-----

## 4. Advanced Language Features

### Question 7: Lambda vs Method Reference Performance

```java
import java.util.*;
import java.util.function.*;

public class LambdaPerformance {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("apple", "banana", "cherry");
        
        // Method reference
        list.forEach(System.out::println);
        
        // Lambda expression
        list.forEach(s -> System.out.println(s));
        
        // Stored in variable
        Consumer<String> printer = System.out::println;
        list.forEach(printer);
        
        // Complex lambda
        list.forEach(s -> {
            String upper = s.toUpperCase();
            System.out.println(upper);
        });
        
        // Performance test
        performanceTest();
    }
    
    private static void performanceTest() {
        List<Integer> numbers = new ArrayList<>();
        for (int i = 0; i < 1000000; i++) {
            numbers.add(i);
        }
        
        long start = System.currentTimeMillis();
        numbers.forEach(System.out::println);
        long methodRefTime = System.currentTimeMillis() - start;
        
        start = System.currentTimeMillis();
        numbers.forEach(n -> System.out.println(n));
        long lambdaTime = System.currentTimeMillis() - start;
        
        System.out.println("Method reference time: " + methodRefTime + "ms");
        System.out.println("Lambda time: " + lambdaTime + "ms");
    }
}
```

**Question:** Which approach is more efficient? How are lambdas implemented under the hood (invokedynamic)?

**Key Points to Cover:**

- invokedynamic and lambda metafactory
- Method reference optimization
- Capturing vs non-capturing lambdas
- Bootstrap method generation

-----

### Question 8: Generic Type Erasure

```java
import java.lang.reflect.*;
import java.util.*;

public class TypeErasureDemo<T> {
    private List<T> list = new ArrayList<>();
    
    public void addItem(T item) {
        list.add(item);
    }
    
    // This won't compile - why?
    // public T createNew() {
    //     return new T();
    // }
    
    // Workaround using Class<T>
    public T createNew(Class<T> clazz) throws InstantiationException, IllegalAccessException {
        return clazz.newInstance();
    }
    
    // Generic method with bounds
    public <U extends Number> void processNumber(U number) {
        System.out.println("Processing: " + number.doubleValue());
    }
    
    @SuppressWarnings("unchecked")
    public static void demonstrateTypeErasure() {
        List<String> stringList = new ArrayList<>();
        List<Integer> intList = new ArrayList<>();
        
        System.out.println("Same class? " + (stringList.getClass() == intList.getClass()));
        
        // Runtime type information is lost
        List rawList = stringList;
        rawList.add(123); // No compile error, but ClassCastException at runtime
        
        try {
            String str = stringList.get(0); // ClassCastException here
        } catch (ClassCastException e) {
            System.out.println("Type erasure caused: " + e.getMessage());
        }
    }
    
    public static void main(String[] args) {
        demonstrateTypeErasure();
        
        TypeErasureDemo<String> demo = new TypeErasureDemo<>();
        demo.processNumber(42);
        demo.processNumber(3.14);
    }
}
```

**Question:** Why can’t you create `new T()`? How does type erasure affect runtime behavior?

**Key Points to Cover:**

- Backward compatibility with pre-generics code
- Bridge methods
- Heap pollution
- Reflection and generics

-----

## 5. Stream API & Functional Programming

### Question 9: Stream Laziness and Performance

```java
import java.util.*;
import java.util.stream.*;

public class StreamLaziness {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        
        System.out.println("=== Demonstrating Lazy Evaluation ===");
        // Lazy evaluation
        Stream<Integer> stream = numbers.stream()
            .peek(n -> System.out.println("Processing: " + n))
            .filter(n -> n % 2 == 0)
            .peek(n -> System.out.println("After filter: " + n))
            .map(n -> n * 2)
            .peek(n -> System.out.println("After map: " + n));
        
        System.out.println("Stream created, but no processing yet...");
        
        // Terminal operation triggers processing
        List<Integer> result = stream.limit(2).collect(Collectors.toList());
        System.out.println("Result: " + result);
        
        System.out.println("\n=== Parallel vs Sequential ===");
        parallelStreamDemo();
    }
    
    // Parallel streams
    public static void parallelStreamDemo() {
        List<Integer> largeList = IntStream.rangeClosed(1, 1000000)
                                          .boxed()
                                          .collect(Collectors.toList());
        
        // Sequential processing
        long start = System.currentTimeMillis();
        long sum1 = largeList.stream()
                            .mapToLong(Integer::longValue)
                            .sum();
        long sequential = System.currentTimeMillis() - start;
        
        // Parallel processing
        start = System.currentTimeMillis();
        long sum2 = largeList.parallelStream()
                            .mapToLong(Integer::longValue)
                            .sum();
        long parallel = System.currentTimeMillis() - start;
        
        System.out.println("Sequential sum: " + sum1 + " (Time: " + sequential + "ms)");
        System.out.println("Parallel sum: " + sum2 + " (Time: " + parallel + "ms)");
        
        // Demonstrate when parallel can be slower
        demonstrateParallelOverhead();
    }
    
    private static void demonstrateParallelOverhead() {
        List<Integer> smallList = IntStream.rangeClosed(1, 100).boxed().collect(Collectors.toList());
        
        long start = System.currentTimeMillis();
        smallList.stream().mapToInt(i -> i * 2).sum();
        long seqTime = System.currentTimeMillis() - start;
        
        start = System.currentTimeMillis();
        smallList.parallelStream().mapToInt(i -> i * 2).sum();
        long parTime = System.currentTimeMillis() - start;
        
        System.out.println("Small list - Sequential: " + seqTime + "ms, Parallel: " + parTime + "ms");
    }
}
```

**Question:** Why is only limited processing shown? When might parallel streams be slower than sequential?

**Key Points to Cover:**

- Intermediate vs terminal operations
- Short-circuiting operations
- ForkJoinPool and work-stealing
- Overhead of parallel processing for small datasets

-----

### Question 10: Custom Collector

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class CustomCollectorDemo {
    
    // Custom collector to group by length and collect to TreeMap
    public static Collector<String, ?, TreeMap<Integer, List<String>>> 
            groupByLengthToTreeMap() {
        return Collector.of(
            TreeMap::new,  // supplier
            (map, item) -> {  // accumulator
                map.computeIfAbsent(item.length(), k -> new ArrayList<>()).add(item);
            },
            (map1, map2) -> {  // combiner for parallel processing
                map2.forEach((key, value) -> 
                    map1.merge(key, value, (list1, list2) -> {
                        list1.addAll(list2);
                        return list1;
                    })
                );
                return map1;
            }
        );
    }
    
    // Advanced custom collector with characteristics
    public static Collector<Integer, ?, Statistics> toStatistics() {
        return Collector.of(
            Statistics::new,  // supplier
            Statistics::accept,  // accumulator  
            Statistics::combine,  // combiner
            Collector.Characteristics.UNORDERED
        );
    }
    
    static class Statistics {
        private long count = 0;
        private long sum = 0;
        private int min = Integer.MAX_VALUE;
        private int max = Integer.MIN_VALUE;
        
        void accept(int value) {
            count++;
            sum += value;
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
        
        Statistics combine(Statistics other) {
            Statistics result = new Statistics();
            result.count = this.count + other.count;
            result.sum = this.sum + other.sum;
            result.min = Math.min(this.min, other.min);
            result.max = Math.max(this.max, other.max);
            return result;
        }
        
        double getAverage() {
            return count > 0 ? (double) sum / count : 0.0;
        }
        
        @Override
        public String toString() {
            return String.format("Statistics{count=%d, sum=%d, min=%d, max=%d, avg=%.2f}", 
                               count, sum, min, max, getAverage());
        }
    }
    
    public static void main(String[] args) {
        List<String> words = Arrays.asList("apple", "cat", "elephant", "dog", "banana", "a");
        
        // Using custom collector
        TreeMap<Integer, List<String>> grouped = words.stream()
            .collect(groupByLengthToTreeMap());
        
        System.out.println("=== Grouped by Length ===");
        grouped.forEach((length, wordList) -> 
            System.out.println("Length " + length + ": " + wordList)
        );
        
        // Using statistics collector
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        Statistics stats = numbers.stream().collect(toStatistics());
        System.out.println("\n=== Statistics ===");
        System.out.println(stats);
    }
}
```

**Question:** Explain each component of the custom collector. Why do we need a combiner function?

**Key Points to Cover:**

- Supplier, accumulator, combiner, finisher functions
- Collector characteristics (CONCURRENT, UNORDERED, IDENTITY_FINISH)
- Parallel processing requirements
- Performance considerations

-----

## 6. Exception Handling & Best Practices

### Question 11: Exception Performance

```java
public class ExceptionPerformance {
    private static final int ITERATIONS = 100000;
    
    public static void main(String[] args) {
        System.out.println("Testing exception performance...");
        
        // Method 1: Using exceptions for control flow (BAD)
        long start = System.currentTimeMillis();
        for (int i = 0; i < ITERATIONS; i++) {
            try {
                riskyMethod(i);
            } catch (CustomException e) {
                // Handle exception - expensive!
            }
        }
        long exceptionTime = System.currentTimeMillis() - start;
        
        // Method 2: Using return codes (GOOD)
        start = System.currentTimeMillis();
        for (int i = 0; i < ITERATIONS; i++) {
            int result = safeMethod(i);
            if (result == -1) {
                // Handle error case - cheap!
            }
        }
        long returnCodeTime = System.currentTimeMillis() - start;
        
        // Method 3: Exception creation cost
        start = System.currentTimeMillis();
        for (int i = 0; i < 1000; i++) {  // Much fewer iterations
            Exception e = new Exception("Test exception " + i);
        }
        long creationTime = System.currentTimeMillis() - start;
        
        System.out.println("Exception handling approach: " + exceptionTime + "ms");
        System.out.println("Return code approach: " + returnCodeTime + "ms");
        System.out.println("Exception creation (1000 times): " + creationTime + "ms");
        System.out.println("Performance ratio: " + (exceptionTime / (double) returnCodeTime) + "x slower");
    }
    
    private static void riskyMethod(int value) throws CustomException {
        if (value % 2 == 0) {
            throw new CustomException("Even number: " + value);
        }
    }
    
    private static int safeMethod(int value) {
        return value % 2 == 0 ? -1 : value;
    }
    
    static class CustomException extends Exception {
        public CustomException(String message) {
            super(message);
        }
    }
}
```

**Question:** Why are exceptions expensive? When should you use exceptions vs return codes?

**Key Points to Cover:**

- Stack trace generation cost
- Exception object creation overhead
- Control flow vs exceptional circumstances
- JVM optimization limitations with exceptions

-----

### Question 12: Try-with-Resources Deep Dive

```java
import java.io.*;

public class ResourceManagement {
    
    // Custom resource class
    static class CustomResource implements AutoCloseable {
        private String name;
        private boolean shouldFailOnClose;
        
        public CustomResource(String name) throws Exception {
            this(name, false);
        }
        
        public CustomResource(String name, boolean shouldFailOnClose) throws Exception {
            this.name = name;
            this.shouldFailOnClose = shouldFailOnClose;
            System.out.println("Opening " + name);
            
            if (name.equals("failing")) {
                throw new Exception("Failed to open " + name);
            }
        }
        
        public void doWork() throws Exception {
            System.out.println("Working with " + name);
            if (name.equals("workfail")) {
                throw new Exception("Work failed with " + name);
            }
        }
        
        @Override
        public void close() throws Exception {
            System.out.println("Closing " + name);
            if (shouldFailOnClose || name.equals("closefail")) {
                throw new Exception("Failed to close " + name);
            }
        }
    }
    
    public static void main(String[] args) {
        System.out.println("=== Normal Case ===");
        normalCase();
        
        System.out.println("\n=== Exception in Try Block ===");
        exceptionInTryBlock();
        
        System.out.println("\n=== Exception in Close ===");
        exceptionInClose();
        
        System.out.println("\n=== Multiple Exceptions ===");
        multipleExceptions();
    }
    
    private static void normalCase() {
        try (CustomResource r1 = new CustomResource("resource1");
             CustomResource r2 = new CustomResource("resource2")) {
            
            r1.doWork();
            r2.doWork();
            System.out.println("Work completed successfully");
            
        } catch (Exception e) {
            System.out.println("Caught: " + e.getMessage());
        }
    }
    
    private static void exceptionInTryBlock() {
        try (CustomResource r1 = new CustomResource("resource1");
             CustomResource r2 = new CustomResource("workfail")) {
            
            r1.doWork();
            r2.doWork();  // This will throw
            
        } catch (Exception e) {
            System.out.println("Caught: " + e.getMessage());
        }
    }
    
    private static void exceptionInClose() {
        try (CustomResource r1 = new CustomResource("resource1", true)) {
            
            r1.doWork();
            
        } catch (Exception e) {
            System.out.println("Caught: " + e.getMessage());
        }
    }
    
    private static void multipleExceptions() {
        try (CustomResource r1 = new CustomResource("resource1", true);
             CustomResource r2 = new CustomResource("workfail")) {
            
            r1.doWork();
            r2.doWork();  // Exception in try block
            
        } catch (Exception e) {
            System.out.println("Primary exception: " + e.getMessage());
            
            // Check for suppressed exceptions
            Throwable[] suppressed = e.getSuppressed();
            for (Throwable t : suppressed) {
                System.out.println("Suppressed: " + t.getMessage());
            }
        }
    }
}
```

**Question:** What happens if both the try block and close() method throw exceptions? How does the suppressed exception mechanism work?

**Key Points to Cover:**

- AutoCloseable interface
- Resource initialization order vs closing order
- Suppressed exceptions mechanism
- addSuppressed() method
- Exception priority (primary vs suppressed)

-----

## Additional Advanced Questions

### Question 13: ClassLoader and Static Variables

```java
import java.io.*;
import java.lang.reflect.*;

public class ClassLoaderDemo {
    static class TestClass {
        static int staticVar = 0;
        static {
            staticVar = 42;
            System.out.println("Static block executed, staticVar = " + staticVar);
        }
    }
    
    // Custom ClassLoader
    static class CustomClassLoader extends ClassLoader {
        @Override
        protected Class<?> findClass(String name) throws ClassNotFoundException {
            // This is a simplified version - in practice, you'd load from file/network
            return super.findClass(name);
        }
    }
    
    public static void main(String[] args) throws Exception {
        // Load class with default classloader
        Class<?> cls1 = TestClass.class;
        Field field1 = cls1.getDeclaredField("staticVar");
        System.out.println("Class 1 - staticVar: " + field1.get(null));
        
        // Modify static variable
        field1.set(null, 100);
        System.out.println("Modified staticVar to 100");
        
        // Access again with same classloader
        Class<?> cls2 = Class.forName("ClassLoaderDemo$TestClass");
        Field field2 = cls2.getDeclaredField("staticVar");
        System.out.println("Class 2 (same ClassLoader) - staticVar: " + field2.get(null));
        
        System.out.println("Same class? " + (cls1 == cls2));
    }
}
```

**Question:** What happens to static variables when the same class is loaded by different ClassLoaders?

-----

### Question 14: Annotation Processing

```java
import java.lang.annotation.*;
import java.lang.reflect.*;

// Custom annotation
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
@interface Benchmark {
    String value() default "";
    int iterations() default 1;
}

// Annotation processor using reflection
public class AnnotationProcessingDemo {
    
    @Benchmark(value = "Fast method", iterations = 1000000)
    public void fastMethod() {
        // Simple operation
        int x = 1 + 1;
    }
    
    @Benchmark(value = "Slow method", iterations = 100000)
    public void slowMethod() throws InterruptedException {
        // Simulate work
        Thread.sleep(0, 1000); // Sleep for 1 microsecond
    }
    
    public static void main(String[] args) throws Exception {
        AnnotationProcessingDemo demo = new AnnotationProcessingDemo();
        Class<?> clazz = demo.getClass();
        
        // Process all methods with @Benchmark annotation
        for (Method method : clazz.getDeclaredMethods()) {
            if (method.isAnnotationPresent(Benchmark.class)) {
                Benchmark benchmark = method.getAnnotation(Benchmark.class);
                
                System.out.println("Benchmarking: " + benchmark.value());
                System.out.println("Method: " + method.getName());
                System.out.println("Iterations: " + benchmark.iterations());
                
                // Run benchmark
                long start = System.nanoTime();
                for (int i = 0; i < benchmark.iterations(); i++) {
                    method.invoke(demo);
                }
                long end = System.nanoTime();
                
                long totalTime = end - start;
                double avgTime = (double) totalTime / benchmark.iterations();
                
                System.out.println("Total time: " + totalTime + " ns");
                System.out.println("Average time per iteration: " + avgTime + " ns");
                System.out.println("---");
            }
        }
    }
}
```

**Question:** How do annotations work at runtime vs compile-time? What’s the difference between RetentionPolicy values?

-----

## Summary

These questions cover:

- **Memory Management**: String pools, garbage collection, reference types
- **Concurrency**: Thread safety, synchronization, parallel processing
- **Collections**: Internal implementations, performance characteristics
- **Language Features**: Generics, lambdas, type system
- **Streams**: Lazy evaluation, parallel processing, custom collectors
- **Exception Handling**: Performance implications, resource management
- **Advanced Topics**: ClassLoaders, annotations, reflection

Each question tests both theoretical knowledge and practical understanding, making them excellent for senior Java developer positions.
