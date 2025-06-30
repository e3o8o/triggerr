# PRD-INFRA-001: Task Scheduler & Background Jobs

**Status**: Ready for Implementation  
**Priority**: High - Essential for Automation  
**Dependencies**: PRD-ENGINE-003 (Payout Engine), PRD-DATA-001 (Flight Data Aggregator), PRD-CORE-001 (Database)  
**Estimated Timeline**: 1-2 weeks  

## 1. Overview

### 1.1 Purpose
The Task Scheduler & Background Jobs system provides automated execution of critical platform operations including flight monitoring, payout processing, data refresh, and maintenance tasks. This enables the core value proposition of automatic parametric insurance payouts.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Scheduler     │    │   Job Queue      │    │   Executors     │
│                 │────▶│                  │────▶│                 │
│ Cron Scheduler  │    │ Priority Queue   │    │ Flight Monitor  │
│ Event Triggers  │    │ Retry Logic      │    │ Payout Process  │
│ Manual Triggers │    │ Dead Letter      │    │ Data Refresh    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 Task Scheduler Implementation

```typescript
export class TaskScheduler {
  private cronJobs: Map<string, CronJob> = new Map();
  private jobQueue: JobQueue;
  private executors: Map<JobType, JobExecutor> = new Map();

  constructor(config: SchedulerConfig) {
    this.jobQueue = new JobQueue(config.queue);
    this.initializeExecutors();
  }

  async start(): Promise<void> {
    // Start core monitoring jobs
    await this.scheduleRecurring('flight-monitor', {
      schedule: '*/2 * * * *', // Every 2 minutes
      executor: 'FlightMonitorExecutor',
      priority: JobPriority.HIGH
    });

    await this.scheduleRecurring('policy-expiration-check', {
      schedule: '0 * * * *', // Every hour
      executor: 'PolicyExpirationExecutor',
      priority: JobPriority.MEDIUM
    });

    await this.scheduleRecurring('data-cache-refresh', {
      schedule: '*/15 * * * *', // Every 15 minutes
      executor: 'CacheRefreshExecutor',
      priority: JobPriority.LOW
    });

    await this.scheduleRecurring('cleanup-expired-data', {
      schedule: '0 2 * * *', // Daily at 2 AM
      executor: 'CleanupExecutor',
      priority: JobPriority.LOW
    });
  }

  async scheduleRecurring(
    jobId: string, 
    config: ScheduleConfig
  ): Promise<void> {
    const cronJob = new CronJob(config.schedule, async () => {
      await this.enqueueJob({
        id: generateJobId(jobId),
        type: config.executor,
        payload: config.payload || {},
        priority: config.priority,
        scheduledAt: new Date(),
        maxRetries: config.maxRetries || 3
      });
    });

    this.cronJobs.set(jobId, cronJob);
    cronJob.start();

    taskSchedulerMetrics.scheduledJobsTotal.inc({ job_type: jobId });
  }

  async scheduleOnce(
    jobId: string,
    executeAt: Date,
    config: JobConfig
  ): Promise<void> {
    const delay = executeAt.getTime() - Date.now();
    
    if (delay <= 0) {
      // Execute immediately
      await this.enqueueJob({
        id: jobId,
        type: config.executor,
        payload: config.payload,
        priority: config.priority || JobPriority.MEDIUM,
        scheduledAt: new Date(),
        maxRetries: config.maxRetries || 3
      });
    } else {
      // Schedule for future execution
      setTimeout(async () => {
        await this.enqueueJob({
          id: jobId,
          type: config.executor,
          payload: config.payload,
          priority: config.priority || JobPriority.MEDIUM,
          scheduledAt: executeAt,
          maxRetries: config.maxRetries || 3
        });
      }, delay);
    }
  }

  private async enqueueJob(job: Job): Promise<void> {
    await this.jobQueue.add(job);
    taskSchedulerMetrics.jobsEnqueued.inc({ 
      job_type: job.type,
      priority: job.priority 
    });
  }
}
```

### 2.2 Job Queue System

```typescript
export class JobQueue {
  private queue: PriorityQueue<Job>;
  private workers: Worker[] = [];
  private isProcessing: boolean = false;

  constructor(config: QueueConfig) {
    this.queue = new PriorityQueue((a, b) => 
      this.comparePriority(a.priority, b.priority)
    );
    this.initializeWorkers(config.workerCount || 3);
  }

  async add(job: Job): Promise<void> {
    this.queue.enqueue(job);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (!this.queue.isEmpty()) {
      const job = this.queue.dequeue();
      if (job) {
        const availableWorker = this.getAvailableWorker();
        if (availableWorker) {
          availableWorker.execute(job);
        } else {
          // Re-queue if no workers available
          this.queue.enqueue(job);
          await this.waitForAvailableWorker();
        }
      }
    }

    this.isProcessing = false;
  }

  private async executeJob(job: Job): Promise<void> {
    const startTime = Date.now();
    
    try {
      const executor = this.getExecutor(job.type);
      await executor.execute(job.payload);
      
      // Record success metrics
      taskSchedulerMetrics.jobsCompleted.inc({ 
        job_type: job.type,
        status: 'success' 
      });
      
      taskSchedulerMetrics.jobDuration.observe(
        { job_type: job.type },
        (Date.now() - startTime) / 1000
      );

    } catch (error) {
      await this.handleJobFailure(job, error);
    }
  }

  private async handleJobFailure(job: Job, error: Error): Promise<void> {
    job.retryCount = (job.retryCount || 0) + 1;
    job.lastError = error.message;

    if (job.retryCount < job.maxRetries) {
      // Exponential backoff for retries
      const delay = Math.pow(2, job.retryCount) * 1000; // 2s, 4s, 8s...
      
      setTimeout(() => {
        this.add(job);
      }, delay);

      taskSchedulerMetrics.jobsRetried.inc({ 
        job_type: job.type,
        retry_count: job.retryCount.toString() 
      });
    } else {
      // Move to dead letter queue
      await this.moveToDeadLetter(job, error);
      
      taskSchedulerMetrics.jobsFailed.inc({ 
        job_type: job.type,
        error: error.constructor.name 
      });
    }
  }
}
```

### 2.3 Job Executors

#### Flight Monitor Executor
```typescript
export class FlightMonitorExecutor implements JobExecutor {
  private payoutEngine: PayoutEngine;
  private policyService: PolicyService;

  async execute(payload: FlightMonitorPayload): Promise<void> {
    const activePolicies = await this.policyService.getActivePolicies();
    
    for (const policy of activePolicies) {
      try {
        // Check if policy needs monitoring (not too close to departure)
        if (this.shouldMonitorPolicy(policy)) {
          await this.payoutEngine.evaluatePolicyForPayout(policy);
        }
      } catch (error) {
        // Log error but continue with other policies
        console.error(`Failed to monitor policy ${policy.id}:`, error);
        
        taskSchedulerMetrics.policyMonitoringErrors.inc({ 
          policy_id: policy.id,
          error: error.constructor.name 
        });
      }
    }
  }

  private shouldMonitorPolicy(policy: Policy): boolean {
    const now = new Date();
    const departure = new Date(policy.flight.departureScheduledAt);
    const arrival = new Date(policy.flight.arrivalScheduledAt);
    
    // Monitor from 2 hours before departure to 24 hours after arrival
    const monitorStart = new Date(departure.getTime() - 2 * 60 * 60 * 1000);
    const monitorEnd = new Date(arrival.getTime() + 24 * 60 * 60 * 1000);
    
    return now >= monitorStart && now <= monitorEnd;
  }
}
```

#### Policy Expiration Executor
```typescript
export class PolicyExpirationExecutor implements JobExecutor {
  private policyService: PolicyService;
  private escrowManager: EscrowManager;

  async execute(payload: ExpirationCheckPayload): Promise<void> {
    const expiredPolicies = await this.policyService.getExpiredPolicies();
    
    for (const policy of expiredPolicies) {
      try {
        await this.handleExpiredPolicy(policy);
      } catch (error) {
        console.error(`Failed to handle expired policy ${policy.id}:`, error);
      }
    }
  }

  private async handleExpiredPolicy(policy: Policy): Promise<void> {
    // Update policy status
    await this.policyService.updateStatus(policy.id, 'EXPIRED');
    
    // Release escrow back to provider if no payout occurred
    if (policy.escrow && policy.escrow.status !== 'FULFILLED') {
      await this.escrowManager.releaseEscrow(policy.escrow);
    }
    
    // Send expiration notification
    await this.notifyPolicyExpiration(policy);
  }
}
```

#### Cache Refresh Executor
```typescript
export class CacheRefreshExecutor implements JobExecutor {
  private flightAggregator: FlightDataAggregator;
  private cacheManager: CacheManager;

  async execute(payload: CacheRefreshPayload): Promise<void> {
    const tasks = [
      this.refreshFlightDataCache(),
      this.refreshWeatherDataCache(),
      this.refreshAirportDataCache(),
      this.cleanupExpiredCache()
    ];

    await Promise.allSettled(tasks);
  }

  private async refreshFlightDataCache(): Promise<void> {
    // Refresh flight data for active policies
    const activePolicies = await this.getActivePolicies();
    
    for (const policy of activePolicies) {
      try {
        await this.flightAggregator.refreshFlightData(
          policy.flight.flightNumber,
          policy.flight.departureScheduledAt
        );
      } catch (error) {
        // Log but continue with other flights
        console.error(`Failed to refresh flight data for ${policy.flight.flightNumber}:`, error);
      }
    }
  }
}
```

## 3. Job Types and Configurations

### 3.1 Core Job Types
```typescript
enum JobType {
  FLIGHT_MONITOR = 'FlightMonitorExecutor',
  POLICY_EXPIRATION = 'PolicyExpirationExecutor',
  CACHE_REFRESH = 'CacheRefreshExecutor',
  CLEANUP = 'CleanupExecutor',
  PAYOUT_PROCESS = 'PayoutProcessExecutor',
  NOTIFICATION_SEND = 'NotificationExecutor'
}

enum JobPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

interface Job {
  id: string;
  type: JobType;
  payload: any;
  priority: JobPriority;
  scheduledAt: Date;
  executedAt?: Date;
  completedAt?: Date;
  retryCount?: number;
  maxRetries: number;
  lastError?: string;
}
```

### 3.2 Schedule Configurations
```typescript
const CORE_SCHEDULES = {
  // Critical monitoring every 2 minutes
  flightMonitor: {
    schedule: '*/2 * * * *',
    priority: JobPriority.HIGH,
    maxRetries: 3,
    timeout: 120000 // 2 minutes
  },
  
  // Policy expiration checks every hour
  policyExpiration: {
    schedule: '0 * * * *',
    priority: JobPriority.MEDIUM,
    maxRetries: 2,
    timeout: 300000 // 5 minutes
  },
  
  // Cache refresh every 15 minutes
  cacheRefresh: {
    schedule: '*/15 * * * *',
    priority: JobPriority.LOW,
    maxRetries: 1,
    timeout: 600000 // 10 minutes
  },
  
  // Daily cleanup at 2 AM
  cleanup: {
    schedule: '0 2 * * *',
    priority: JobPriority.LOW,
    maxRetries: 1,
    timeout: 1800000 // 30 minutes
  }
};
```

## 4. Error Handling & Monitoring

### 4.1 Retry Logic
```typescript
class RetryHandler {
  static calculateDelay(retryCount: number, baseDelay: number = 1000): number {
    // Exponential backoff with jitter
    const exponentialDelay = Math.pow(2, retryCount) * baseDelay;
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return exponentialDelay + jitter;
  }

  static shouldRetry(error: Error, retryCount: number, maxRetries: number): boolean {
    if (retryCount >= maxRetries) return false;
    
    // Don't retry certain error types
    if (error instanceof ValidationError) return false;
    if (error instanceof AuthenticationError) return false;
    
    return true;
  }
}
```

### 4.2 Monitoring & Metrics
```typescript
export const taskSchedulerMetrics = {
  scheduledJobsTotal: new Counter({
    name: 'task_scheduler_scheduled_jobs_total',
    help: 'Total scheduled jobs',
    labelNames: ['job_type']
  }),
  
  jobsEnqueued: new Counter({
    name: 'task_scheduler_jobs_enqueued_total',
    help: 'Jobs added to queue',
    labelNames: ['job_type', 'priority']
  }),
  
  jobsCompleted: new Counter({
    name: 'task_scheduler_jobs_completed_total',
    help: 'Completed jobs',
    labelNames: ['job_type', 'status']
  }),
  
  jobsFailed: new Counter({
    name: 'task_scheduler_jobs_failed_total',
    help: 'Failed jobs',
    labelNames: ['job_type', 'error']
  }),
  
  jobDuration: new Histogram({
    name: 'task_scheduler_job_duration_seconds',
    help: 'Job execution duration',
    labelNames: ['job_type'],
    buckets: [1, 5, 10, 30, 60, 300]
  }),
  
  queueSize: new Gauge({
    name: 'task_scheduler_queue_size',
    help: 'Current queue size',
    labelNames: ['priority']
  })
};
```

## 5. API Endpoints

### 5.1 Administrative APIs
```
GET /api/admin/scheduler/status
```
**Response:**
```json
{
  "status": "RUNNING",
  "activeJobs": 245,
  "queueSize": 12,
  "workers": {
    "available": 2,
    "busy": 1,
    "total": 3
  },
  "uptime": "2d 14h 32m"
}
```

### 5.2 Job Management
```
POST /api/admin/scheduler/jobs
```
**Request:**
```json
{
  "type": "FLIGHT_MONITOR",
  "executeAt": "2025-06-15T10:30:00Z",
  "payload": {
    "policyId": "policy_123"
  },
  "priority": "HIGH"
}
```

### 5.3 Job History
```
GET /api/admin/scheduler/jobs?type=FLIGHT_MONITOR&status=failed&limit=100
```

## 6. Configuration

### 6.1 Environment Configuration
```typescript
interface SchedulerConfig {
  enabled: boolean;
  workerCount: number;
  maxConcurrentJobs: number;
  defaultRetries: number;
  jobTimeout: number;
  deadLetterQueueSize: number;
  cleanupInterval: number;
  metrics: {
    enabled: boolean;
    port: number;
  };
}

const SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: process.env.SCHEDULER_ENABLED === 'true',
  workerCount: parseInt(process.env.SCHEDULER_WORKERS || '3'),
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '10'),
  defaultRetries: parseInt(process.env.DEFAULT_RETRIES || '3'),
  jobTimeout: parseInt(process.env.JOB_TIMEOUT || '300000'), // 5 minutes
  deadLetterQueueSize: 1000,
  cleanupInterval: 86400000, // 24 hours
  metrics: {
    enabled: true,
    port: 9090
  }
};
```

## 7. Implementation Timeline

### Week 1: Core Infrastructure
- Task scheduler setup with cron
- Job queue implementation
- Basic job executors
- Error handling and retry logic

### Week 2: Integration & Monitoring
- Flight monitor executor
- Policy expiration handling
- Metrics and monitoring
- Admin APIs for job management

## 8. Success Metrics

### Performance
- Job execution time: < 2 minutes for flight monitoring
- Queue processing: < 5 seconds average
- Retry success rate: > 85%
- System uptime: > 99.9%

### Business
- Payout accuracy: > 99% (correct triggering)
- Monitoring coverage: 100% of active policies
- Alert response time: < 5 minutes

## 9. Security Considerations

### 9.1 Job Payload Security
- Encrypt sensitive data in job payloads
- Validate all job parameters
- Audit trail for all job executions
- Rate limiting for manual job creation

### 9.2 Resource Protection
- Memory limits per job
- CPU time limits
- Disk space monitoring
- Network timeout enforcement

---

**Dependencies**: PRD-ENGINE-003 (Payout Engine), PRD-DATA-001 (Flight Data Aggregator)  
**Integration**: Enables automated parametric insurance operations  
**Status**: Implementation Ready