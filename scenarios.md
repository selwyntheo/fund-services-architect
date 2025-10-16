# Detailed Requirements: Parallel Tasks Failure and Recovery

## 1. Parallel Execution Scenarios

### 1.1 Independent Parallel Tasks

**Scenario:** Tasks A, B, C have no dependencies between them and execute simultaneously.

```
    START
   /  |  \
  A   B   C
   \  |  /
     END
```

**Requirements:**

**R1.1.1 - Isolation Principle**
Each parallel task must execute in complete isolation. Failure of Task A must not directly impact the execution of Tasks B or C. Each task must have its own thread/execution context, error state, and retry counters.

**R1.1.2 - Failure Detection Window**
The system must detect failures as they occur but must allow all in-flight parallel tasks to reach a terminal state (success, failure after retries, or timeout) before making DAG-level decisions. This prevents premature termination of work that might succeed.

**R1.1.3 - Result Aggregation**
The system must wait for all parallel tasks to complete (successfully or after exhausting retries) before proceeding to dependent tasks, unless fail-fast mode is explicitly enabled.

### 1.2 Diamond Pattern (Converging Parallel Paths)

**Scenario:** Task D depends on both B and C, which are independent parallel tasks.

```
      A
     / \
    B   C
     \ /
      D
```

**Requirements:**

**R1.2.1 - Partial Failure Handling**
When B succeeds but C fails:

- *Strict Mode:* Task D must not execute. It enters BLOCKED state.
- *Partial Mode:* Task D receives notification that C failed and B succeeded. Task D’s implementation decides whether to proceed with partial input.
- *Optional Dependency Mode:* If C is marked as optional, D proceeds with only B’s output.

**R1.2.2 - Failure Recovery Strategy - Retry with Coordination**
If C fails but is retryable:

1. C enters RETRYING state
1. Task D remains in PENDING state
1. Task B’s result is cached/stored
1. When C retries and succeeds, D executes using cached B result + new C result
1. If C exhausts retries, apply partial failure handling rules

**R1.2.3 - Simultaneous Failure**
If both B and C fail simultaneously:

- All failures must be collected atomically
- If either is retryable, both retry independently
- Task D waits until both tasks reach terminal states
- D blocks only after all retry attempts are exhausted on both tasks

**R1.2.4 - Retry Synchronization Corner Case**
If B succeeds, C fails and retries, then B’s result expires (cache timeout) before C completes retry:

- The system must either: (a) extend B’s result lifetime until C completes, or (b) re-execute B when C succeeds
- Default behavior: extend result lifetime with warning log
- Configurable behavior: allow B re-execution for data freshness

### 1.3 Fan-Out Pattern

**Scenario:** Task A produces output consumed by parallel tasks B, C, D.

```
      A
    / | \
   B  C  D
```

**Requirements:**

**R1.3.1 - Parent Failure Impact**
If Task A fails:

- Tasks B, C, D must not execute
- All three enter BLOCKED state immediately
- If A is retryable, B, C, D remain in PENDING state
- When A succeeds after retry, B, C, D execute in parallel

**R1.3.2 - Child Failure Independence**
If Task B fails but C and D succeed:

- C and D results are preserved
- Only B enters retry logic
- Downstream tasks depending only on C or D can proceed
- Downstream tasks depending on B remain blocked

**R1.3.3 - Partial Result Utilization**
For tasks depending on outputs from B, C, D:

- The system must track which results are available vs. missing
- Support “ANY”, “ALL”, or “MAJORITY” dependency modes
- Provide clear metadata to downstream tasks about which inputs are present

## 2. Failure Detection and State Management

### 2.1 Atomic State Transitions

**R2.1.1 - Thread-Safe State Updates**
State transitions for parallel tasks must use atomic operations or locks to prevent race conditions:

```java
// Example state machine
PENDING → RUNNING (when thread picks up task)
RUNNING → SUCCEEDED | FAILED | TIMED_OUT (atomic transition)
FAILED → RETRYING (if retry policy allows)
RETRYING → RUNNING (when retry executes)
FAILED → PERMANENTLY_FAILED (when retries exhausted)
```

**R2.1.2 - State Visibility**
When Task A fails, the state change must be immediately visible to:

- The scheduler (to determine dependent task eligibility)
- Monitoring systems (for real-time progress)
- Other parallel tasks if they have conditional logic
- Error handlers and listeners

**R2.1.3 - Multi-Task State Synchronization**
The system must maintain a consistent view of all task states:

```java
// Pseudo-code for state consistency
synchronized (dagExecutionContext) {
    if (allParentTasksInTerminalState(task)) {
        if (allParentTasksSucceeded(task)) {
            scheduleTask(task);
        } else {
            markTaskAsBlocked(task, getFailedParents(task));
        }
    }
}
```

### 2.2 Failure Classification in Parallel Context

**R2.2.1 - Transient Failure Handling**
When multiple parallel tasks experience transient failures (network issues, temporary unavailability):

- Each task retries independently according to its retry policy
- Retry delays should be jittered to prevent synchronized retry storms
- Global rate limiting may apply to prevent overwhelming shared resources

**Example Scenario:**

```
Time T0: Tasks A, B, C call external API in parallel
Time T1: API returns 503 (Service Unavailable) to all three
Time T2: Task A retries after 1s
Time T3: Task B retries after 1.3s (with jitter)
Time T4: Task C retries after 1.7s (with jitter)
```

**R2.2.2 - Permanent Failure Fast-Path**
When a parallel task encounters a permanent failure (invalid configuration, missing required file):

- The task must fail immediately without retry
- Dependent tasks are blocked immediately
- Other parallel tasks continue unless fail-fast mode is enabled
- The permanent failure is clearly marked in execution logs

### 2.3 Timeout Handling in Parallel Execution

**R2.3.1 - Individual Task Timeouts**
Each task must have its own timeout:

```java
Task A: timeout = 30s, executing since T0
Task B: timeout = 60s, executing since T0
Task C: timeout = 45s, executing since T0

At T0+30s: A times out, enters FAILED/RETRYING state
At T0+45s: C times out
Task B continues running until completion or T0+60s
```

**R2.3.2 - Global Execution Timeout**
The entire DAG execution must support a global timeout that supersedes individual task timeouts:

```java
Global timeout = 5 minutes
Time 0: DAG execution starts
Time 4m: Tasks still running normally
Time 5m: Global timeout triggers
  - All RUNNING tasks are interrupted
  - All PENDING tasks are marked CANCELLED
  - DAG status = TIMED_OUT
```

**R2.3.3 - Timeout Recovery Strategy**
When a task times out during parallel execution:

- If retryable, the timeout counts as one retry attempt
- The task thread must be interrupted cleanly
- Resources must be released before retry
- If the task is non-interruptible, the system must log warning and wait for forced termination
- Downstream tasks remain pending until timeout task completes retry or exhausts attempts

## 3. Recovery Strategies

### 3.1 Strategy: Fail-Fast Mode

**R3.1.1 - Implementation**
When ANY task fails permanently (after all retries):

1. Set global cancellation flag
1. Interrupt all RUNNING tasks
1. Mark all PENDING tasks as CANCELLED
1. Wait for graceful shutdown of interrupted tasks (with timeout)
1. Report first/primary failure as DAG failure cause

**R3.1.2 - Parallel Task Cancellation**

```
Time T0: Tasks A, B, C running in parallel
Time T1: Task A fails permanently
Time T1+10ms: Cancellation signal sent to B and C
Time T1+100ms: Tasks B and C check cancellation flag and stop
Time T1+200ms: Cleanup handlers run for B and C
Time T1+500ms: DAG marked as FAILED
```

**R3.1.3 - Race Condition Handling**
If Task B completes successfully at the exact moment Task A fails:

- B’s successful result must still be recorded
- The system must not lose B’s work
- However, downstream tasks still won’t execute due to A’s failure
- On reprocessing, B’s result can be reused if cached

### 3.2 Strategy: Fail-Independent Mode (Maximum Completion)

**R3.2.1 - Branch Isolation**
Each independent branch of the DAG continues execution despite failures in other branches:

```
      START
     /  |  \
    A   B   C
    |   |   |
    D   E   F
     \  |  /
       END
```

If B fails:

- Task E is blocked
- Tasks A→D and C→F continue executing
- END task receives partial results (outputs from D and F only)
- Overall DAG status = PARTIAL_SUCCESS

**R3.2.2 - Dependency Chain Blocking**
When a task in a chain fails, all downstream tasks in that chain are blocked:

```
A → B → C → D
```

If B fails:

- Task A has already succeeded
- Tasks C and D are marked BLOCKED_BY_PARENT_FAILURE
- C and D are not attempted at all (saves resources)
- The blockage reason includes reference to B’s failure

**R3.2.3 - Partial Success Reporting**
The system must provide detailed completion metrics:

```java
ExecutionResult {
    status: PARTIAL_SUCCESS
    totalTasks: 10
    succeededTasks: 7
    failedTasks: 1
    blockedTasks: 2
    successRate: 70%
    completedBranches: ["branch-A", "branch-C"]
    failedBranches: ["branch-B"]
}
```

### 3.3 Strategy: Retry-All-Before-Failure

**R3.3.1 - Coordinated Retry Completion**
Before marking the DAG as failed, ensure all retryable tasks have exhausted their retry attempts:

```
Time T0: Tasks A, B, C running
Time T1: Task A fails (max retries = 3, delay = 5s)
Time T2: Task B fails (max retries = 2, delay = 10s)
Time T3: Task C succeeds
Time T6: Task A retry #1 starts
Time T11: Task A retry #1 fails
Time T12: Task B retry #1 starts
Time T16: Task A retry #2 starts
Time T22: Task B retry #1 fails
Time T21: Task A retry #2 fails
Time T26: Task A retry #3 starts (final attempt)
Time T32: Task B retry #2 starts (final attempt)
Time T31: Task A retry #3 fails → A permanently failed
Time T42: Task B retry #2 fails → B permanently failed
Time T42: ALL retries exhausted, DAG marked as FAILED
```

**R3.3.2 - Independent Retry Schedulers**
Each failed task must have its own retry scheduler:

- No blocking between retry attempts of different tasks
- Exponential backoff calculations are per-task
- Retry counters are per-task, not shared

### 3.4 Strategy: Checkpoint and Resume

**R3.4.1 - State Persistence Requirements**
For parallel task execution to support resume, persist:

```java
TaskExecutionState {
    taskId: "task-B"
    status: SUCCEEDED
    startTime: "2025-01-15T10:00:00Z"
    endTime: "2025-01-15T10:05:00Z"
    attemptNumber: 2  // Succeeded on second attempt
    outputLocation: "s3://bucket/task-b-output.json"
    outputChecksum: "abc123..."  // For validation
    errorHistory: [
        {attempt: 1, error: "ConnectionTimeout", timestamp: "..."}
    ]
}
```

**R3.4.2 - Resume Logic**
When resuming a failed DAG execution with parallel tasks:

```
Original Execution:
  A (SUCCESS) → parallel [B (SUCCESS), C (FAILED), D (SUCCESS)] → E (NOT_RUN)

Resume Execution:
  1. Load persisted state
  2. Skip Task A (already succeeded)
  3. Skip Task B (already succeeded)
  4. Skip Task D (already succeeded)
  5. Re-execute only Task C
  6. When C succeeds, execute Task E with outputs from B, C, D
```

**R3.4.3 - Output Validation on Resume**
Before reusing results from previous execution:

- Verify output checksums match
- Check output expiry/TTL hasn’t elapsed
- Validate output is still accessible (file exists, DB record present)
- If validation fails, re-execute the task even if marked as succeeded

**R3.4.4 - Partial Re-execution**
Support selective task re-execution in parallel groups:

```java
resumeConfig {
    forceRerun: ["task-B"]  // Rerun B even though it succeeded
    // This will cause all downstream tasks to re-execute with new B output
}
```

### 3.5 Strategy: Compensating Actions

**R3.5.1 - Rollback on Parallel Failure**
When parallel tasks have side effects and some fail:

```
Tasks A, B, C write to database in parallel
Task A: INSERT record_1 (SUCCESS)
Task B: INSERT record_2 (FAILED)
Task C: INSERT record_3 (SUCCESS)

Rollback Strategy:
1. Invoke compensating action for Task A: DELETE record_1
2. Invoke compensating action for Task C: DELETE record_3
3. Mark DAG as FAILED with clean state
```

**R3.5.2 - Compensating Action Requirements**

- Each task must optionally provide a compensating action/rollback handler
- Compensating actions execute in reverse dependency order
- If a compensating action fails, log error but continue other rollbacks
- Compensating actions must be idempotent (safe to call multiple times)

## 4. Advanced Corner Cases

### 4.1 Cascading Failures

**Scenario:** Task A succeeds, triggers parallel tasks B, C, D. Task B fails, which causes external resource exhaustion affecting C and D.

**R4.1.1 - Correlation Detection**
The system should detect correlated failures:

```java
Time T0: B fails with "Database connection pool exhausted"
Time T0+50ms: C fails with "Database connection pool exhausted"
Time T0+100ms: D fails with "Database connection pool exhausted"

System recognizes: Correlated failure pattern
Action: Pause all retries for 30 seconds to allow resource recovery
After pause: Retry B, C, D with circuit breaker pattern
```

**R4.1.2 - Circuit Breaker Integration**
For shared resource access in parallel tasks:

- Implement circuit breaker per resource
- CLOSED: Normal operation
- OPEN: Fail fast without attempting (after threshold failures)
- HALF_OPEN: Allow limited retry attempts

### 4.2 Resource Starvation

**Scenario:** Thread pool has 10 threads. 8 tasks are running and 2 have deadlocked. New ready tasks cannot execute.

**R4.2.1 - Deadlock Detection**

- Monitor task execution time vs. expected duration
- If tasks exceed expected duration by configurable factor (e.g., 5x), flag as potentially deadlocked
- Provide mechanism to interrupt and restart suspected deadlocked tasks

**R4.2.2 - Thread Pool Saturation Handling**

```java
Thread pool: max 10 threads
Running tasks: 10 (all executing)
Ready tasks (dependencies satisfied): 5

Options:
1. Queue ready tasks (bounded queue to prevent memory issues)
2. Warn if queue grows beyond threshold
3. Implement priority system to execute critical path tasks first
```

### 4.3 Non-Deterministic Failures

**Scenario:** Task A succeeds 80% of the time due to external factors (race conditions, network variability).

**R4.3.1 - Statistical Retry**

```java
retryPolicy {
    maxAttempts: 5
    expectedSuccessRate: 0.8
    confidenceLevel: 0.95
    // With 5 attempts and 80% success rate, 
    // probability of all failures = (0.2)^5 = 0.032 < 0.05
}
```

**R4.3.2 - Retry Jitter Strategy**
Prevent synchronized retry attempts:

```java
baseDelay = 1000ms
jitterPercent = 50%
actualDelay = baseDelay * (1.0 + random(-jitterPercent, +jitterPercent))
// Results in delays between 500ms and 1500ms
```

### 4.4 Memory Pressure from Parallel Results

**Scenario:** 100 parallel tasks each produce 100MB output. Storing all in memory = 10GB.

**R4.4.1 - Streaming/Spilling Strategy**

```java
taskOutputStrategy {
    threshold: 50MB
    below_threshold: STORE_IN_MEMORY
    above_threshold: SPILL_TO_DISK
    location: "/tmp/dag-execution/${executionId}/"
    cleanup: ON_DAG_COMPLETION
}
```

**R4.4.2 - Lazy Evaluation**

- Don’t materialize all outputs immediately
- Provide handles/references to outputs
- Downstream tasks pull data only when needed
- Cleanup upstream outputs after downstream consumption

## 5. Recovery Decision Matrix

### 5.1 Decision Tree for Parallel Failure Handling

```
Parallel Task Fails
│
├─ Is failure permanent (non-retryable)?
│  ├─ YES
│  │  ├─ Is fail-fast mode enabled?
│  │  │  ├─ YES → Cancel all tasks, fail DAG
│  │  │  └─ NO → Block dependent tasks, continue independent branches
│  │  
│  └─ NO (retryable)
│     ├─ Have retry attempts been exhausted?
│     │  ├─ YES → Treat as permanent failure (see above)
│     │  └─ NO → Schedule retry
│     │
│     └─ While retrying:
│        ├─ Other parallel tasks continue
│        ├─ Dependent tasks wait
│        └─ Monitor global timeout
│
└─ On retry success:
   └─ Resume normal execution flow
```

### 5.2 Configuration Matrix

|Scenario          |Fail-Fast            |Fail-Independent|Retry-All|Best For                    |
|------------------|---------------------|----------------|---------|----------------------------|
|Critical pipeline |✓                    |                |         |Quick failure notification  |
|Data processing   |                     |✓               |         |Maximum work completion     |
|Network operations|                     |                |✓        |Transient failure resilience|
|Mixed workload    |Configurable per task|                |         |Flexible requirements       |

## 6. Implementation Recommendations

### 6.1 Core Interfaces

```java
interface ParallelExecutionStrategy {
    void onTaskFailure(Task failedTask, TaskException error);
    boolean shouldContinueExecution(DAGContext context);
    Set<Task> getTasksToCancel(Task failedTask, DAGContext context);
    Set<Task> getBlockedTasks(Task failedTask, DAGContext context);
}

interface RetryPolicy {
    boolean shouldRetry(Task task, TaskException error, int attemptNumber);
    Duration getRetryDelay(int attemptNumber);
    int getMaxAttempts();
}

interface FailureRecoveryStrategy {
    RecoveryAction determineAction(
        Task failedTask,
        List<Task> parallelTasks,
        DAGState currentState
    );
}
```

### 6.2 State Synchronization

```java
class ParallelTaskCoordinator {
    private final ConcurrentHashMap<TaskId, TaskState> taskStates;
    private final CountDownLatch parallelCompletion;
    private final AtomicInteger failureCount;
    private final ReentrantReadWriteLock stateLock;
    
    public void onTaskComplete(Task task, TaskResult result) {
        stateLock.writeLock().lock();
        try {
            taskStates.put(task.getId(), result.getState());
            if (result.isFailed()) {
                failureCount.incrementAndGet();
            }
            parallelCompletion.countDown();
            notifyDependentTasks(task);
        } finally {
            stateLock.writeLock().unlock();
        }
    }
    
    public boolean allParallelTasksComplete() {
        return parallelCompletion.await(timeout);
    }
}
```

This comprehensive specification should give you a solid foundation for implementing robust parallel task failure handling and recovery in your DAG system. Would you like me to elaborate on any specific aspect or provide implementation examples for particular scenarios?​​​​​​​​​​​​​​​​
