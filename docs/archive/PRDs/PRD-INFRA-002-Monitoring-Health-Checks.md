# PRD-INFRA-002: Monitoring & Health Checks

**Status**: Ready for Implementation  
**Priority**: Medium - Operational Excellence  
**Dependencies**: All Core PRDs, PRD-API-001 (Public API), PRD-INFRA-001 (Task Scheduler)  
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Monitoring & Health Checks system provides comprehensive observability, alerting, and performance tracking for the triggerr platform. It ensures operational excellence through proactive monitoring, automated health checks, and real-time alerting for all system components.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Monitoring    │    │  Health Checks   │    │   Alerting      │
│                 │────▶│                  │────▶│                 │
│ Metrics Collection    │ Service Health   │    │ Real-time Alerts│
│ Performance Tracking  │ API Endpoints    │    │ Incident Mgmt   │
│ Business Analytics    │ External APIs    │    │ Notifications   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 System Monitoring Engine

```typescript
export class SystemMonitor {
  private metricsCollector: MetricsCollector;
  private healthChecker: HealthChecker;
  private alertManager: AlertManager;
  private dashboardManager: DashboardManager;

  constructor(config: MonitoringConfig) {
    this.metricsCollector = new MetricsCollector(config.metrics);
    this.healthChecker = new HealthChecker(config.healthChecks);
    this.alertManager = new AlertManager(config.alerting);
    this.dashboardManager = new DashboardManager(config.dashboards);
  }

  async startMonitoring(): Promise<void> {
    // Start metrics collection
    await this.metricsCollector.start();
    
    // Start health check scheduler
    await this.healthChecker.startScheduledChecks();
    
    // Initialize alert rules
    await this.alertManager.loadAlertRules();
    
    // Setup dashboards
    await this.dashboardManager.initializeDashboards();

    monitoringMetrics.systemStarted.inc();
  }

  async collectMetrics(): Promise<SystemMetrics> {
    const metrics = {
      system: await this.collectSystemMetrics(),
      application: await this.collectApplicationMetrics(),
      business: await this.collectBusinessMetrics(),
      external: await this.collectExternalServiceMetrics()
    };

    await this.evaluateAlerts(metrics);
    return metrics;
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    return {
      cpu: await this.getCPUUsage(),
      memory: await this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
      network: await this.getNetworkStats(),
      database: await this.getDatabaseMetrics(),
      uptime: process.uptime()
    };
  }

  private async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    return {
      apiLatency: await this.getAPILatencyMetrics(),
      errorRate: await this.getErrorRateMetrics(),
      throughput: await this.getThroughputMetrics(),
      activeConnections: await this.getActiveConnections(),
      queueDepth: await this.getQueueDepthMetrics()
    };
  }

  private async collectBusinessMetrics(): Promise<BusinessMetrics> {
    return {
      quotesGenerated: await this.getQuotesGeneratedCount(),
      policiesCreated: await this.getPoliciesCreatedCount(),
      payoutsProcessed: await this.getPayoutsProcessedCount(),
      revenue: await this.getRevenueMetrics(),
      userActivity: await this.getUserActivityMetrics()
    };
  }
}
```

### 2.2 Health Check System

```typescript
export class HealthChecker {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private scheduler: TaskScheduler;

  async registerHealthCheck(name: string, check: HealthCheck): Promise<void> {
    this.healthChecks.set(name, check);
    
    // Schedule regular health checks
    await this.scheduler.scheduleRecurring(`health_${name}`, {
      interval: check.interval || '*/30 * * * * *', // Every 30 seconds
      task: () => this.performHealthCheck(name)
    });
  }

  async performHealthCheck(name: string): Promise<HealthCheckResult> {
    const check = this.healthChecks.get(name);
    if (!check) {
      throw new MonitoringError('HEALTH_CHECK_NOT_FOUND', `Health check ${name} not found`);
    }

    const startTime = Date.now();
    try {
      const result = await check.execute();
      const duration = Date.now() - startTime;

      const healthResult: HealthCheckResult = {
        name,
        status: result.healthy ? 'HEALTHY' : 'UNHEALTHY',
        responseTime: duration,
        details: result.details,
        timestamp: new Date(),
        metadata: result.metadata
      };

      await this.recordHealthCheck(healthResult);
      
      if (!result.healthy) {
        await this.triggerUnhealthyAlert(healthResult);
      }

      return healthResult;

    } catch (error) {
      const healthResult: HealthCheckResult = {
        name,
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        error: error.message,
        timestamp: new Date()
      };

      await this.recordHealthCheck(healthResult);
      await this.triggerErrorAlert(healthResult);
      
      return healthResult;
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.allSettled(
      Array.from(this.healthChecks.keys()).map(name => 
        this.performHealthCheck(name)
      )
    );

    const results = checks.map(check => 
      check.status === 'fulfilled' ? check.value : null
    ).filter(Boolean);

    const healthyCount = results.filter(r => r.status === 'HEALTHY').length;
    const totalCount = results.length;

    return {
      status: this.calculateOverallHealth(results),
      checks: results,
      summary: {
        total: totalCount,
        healthy: healthyCount,
        unhealthy: totalCount - healthyCount,
        healthPercentage: (healthyCount / totalCount) * 100
      },
      timestamp: new Date()
    };
  }

  private calculateOverallHealth(results: HealthCheckResult[]): SystemHealthStatus {
    const criticalChecks = results.filter(r => r.name.includes('critical'));
    const hasCriticalFailures = criticalChecks.some(r => r.status !== 'HEALTHY');

    if (hasCriticalFailures) {
      return 'CRITICAL';
    }

    const healthyPercentage = (results.filter(r => r.status === 'HEALTHY').length / results.length) * 100;

    if (healthyPercentage >= 95) return 'HEALTHY';
    if (healthyPercentage >= 80) return 'DEGRADED';
    return 'UNHEALTHY';
  }
}
```

### 2.3 Pre-configured Health Checks

```typescript
export const SYSTEM_HEALTH_CHECKS = {
  database: {
    name: 'database_connectivity',
    interval: '*/30 * * * * *',
    execute: async (): Promise<HealthCheckResult> => {
      const startTime = Date.now();
      try {
        await prisma.$queryRaw`SELECT 1`;
        return {
          healthy: true,
          responseTime: Date.now() - startTime,
          details: 'Database connection successful'
        };
      } catch (error) {
        return {
          healthy: false,
          responseTime: Date.now() - startTime,
          details: 'Database connection failed',
          error: error.message
        };
      }
    }
  },

  paygoConnection: {
    name: 'paygo_blockchain',
    interval: '*/60 * * * * *', // Every minute
    execute: async (): Promise<HealthCheckResult> => {
      const paygoClient = new PaygoClient();
      const startTime = Date.now();
      
      try {
        const account = await paygoClient.getAccount('test-address');
        return {
          healthy: true,
          responseTime: Date.now() - startTime,
          details: 'PayGo blockchain connection successful'
        };
      } catch (error) {
        return {
          healthy: false,
          responseTime: Date.now() - startTime,
          details: 'PayGo blockchain connection failed',
          error: error.message
        };
      }
    }
  },

  externalAPIs: {
    name: 'external_apis',
    interval: '*/120 * * * * *', // Every 2 minutes
    execute: async (): Promise<HealthCheckResult> => {
      const apiChecks = await Promise.allSettled([
        this.checkAviationStackAPI(),
        this.checkFlightAwareAPI(),
        this.checkWeatherAPI()
      ]);

      const healthyAPIs = apiChecks.filter(check => 
        check.status === 'fulfilled' && check.value.healthy
      ).length;

      return {
        healthy: healthyAPIs >= 2, // At least 2 APIs should be healthy
        details: `${healthyAPIs}/3 external APIs healthy`,
        metadata: { healthyCount: healthyAPIs, totalCount: 3 }
      };
    }
  },

  memoryUsage: {
    name: 'memory_usage',
    interval: '*/60 * * * * *',
    execute: async (): Promise<HealthCheckResult> => {
      const memUsage = process.memoryUsage();
      const usedMB = memUsage.heapUsed / 1024 / 1024;
      const totalMB = memUsage.heapTotal / 1024 / 1024;
      const usagePercentage = (usedMB / totalMB) * 100;

      return {
        healthy: usagePercentage < 85, // Alert if memory usage > 85%
        details: `Memory usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (${usagePercentage.toFixed(1)}%)`,
        metadata: { usagePercentage, usedMB, totalMB }
      };
    }
  }
};
```

### 2.4 Alert Management System

```typescript
export class AlertManager {
  private alertRules: Map<string, AlertRule> = new Map();
  private notificationChannels: NotificationChannel[] = [];

  async loadAlertRules(): Promise<void> {
    const rules = [
      {
        name: 'high_error_rate',
        condition: (metrics: SystemMetrics) => metrics.application.errorRate > 0.05,
        severity: 'HIGH',
        message: 'API error rate exceeds 5%',
        cooldown: 300000 // 5 minutes
      },
      {
        name: 'database_down',
        condition: (health: SystemHealth) => 
          health.checks.find(c => c.name === 'database_connectivity')?.status !== 'HEALTHY',
        severity: 'CRITICAL',
        message: 'Database connectivity lost',
        cooldown: 60000 // 1 minute
      },
      {
        name: 'payout_processing_failure',
        condition: (metrics: SystemMetrics) => 
          metrics.business.payoutFailureRate > 0.02,
        severity: 'HIGH',
        message: 'Payout failure rate exceeds 2%',
        cooldown: 600000 // 10 minutes
      },
      {
        name: 'external_api_degradation',
        condition: (health: SystemHealth) => {
          const apiCheck = health.checks.find(c => c.name === 'external_apis');
          return apiCheck?.metadata?.healthyCount < 2;
        },
        severity: 'MEDIUM',
        message: 'External API availability degraded',
        cooldown: 300000
      }
    ];

    rules.forEach(rule => this.alertRules.set(rule.name, rule));
  }

  async evaluateAlerts(metrics: SystemMetrics, health: SystemHealth): Promise<void> {
    for (const [name, rule] of this.alertRules) {
      try {
        const shouldAlert = rule.condition(metrics, health);
        
        if (shouldAlert && !this.isInCooldown(name)) {
          await this.triggerAlert(name, rule);
        }
      } catch (error) {
        monitoringMetrics.alertEvaluationErrors.inc({ rule: name });
      }
    }
  }

  private async triggerAlert(name: string, rule: AlertRule): Promise<void> {
    const alert: Alert = {
      id: generateAlertId(),
      rule: name,
      severity: rule.severity,
      message: rule.message,
      timestamp: new Date(),
      metadata: { rule }
    };

    // Send to all notification channels
    await Promise.all(
      this.notificationChannels.map(channel => 
        channel.sendAlert(alert)
      )
    );

    // Record alert
    await this.recordAlert(alert);
    
    // Set cooldown
    this.setCooldown(name, rule.cooldown);

    monitoringMetrics.alertsTriggered.inc({ 
      rule: name, 
      severity: rule.severity 
    });
  }
}
```

## 3. Data Types

```typescript
interface SystemMetrics {
  system: {
    cpu: number;
    memory: number;
    disk: number;
    network: NetworkStats;
    database: DatabaseMetrics;
    uptime: number;
  };
  application: {
    apiLatency: LatencyMetrics;
    errorRate: number;
    throughput: number;
    activeConnections: number;
    queueDepth: number;
  };
  business: {
    quotesGenerated: number;
    policiesCreated: number;
    payoutsProcessed: number;
    revenue: RevenueMetrics;
    userActivity: UserActivityMetrics;
  };
  external: {
    aviationStackHealth: ServiceHealth;
    flightAwareHealth: ServiceHealth;
    weatherAPIHealth: ServiceHealth;
  };
}

interface HealthCheckResult {
  name: string;
  status: 'HEALTHY' | 'UNHEALTHY' | 'ERROR';
  responseTime: number;
  details?: string;
  error?: string;
  timestamp: Date;
  metadata?: any;
}

interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'CRITICAL';
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    healthPercentage: number;
  };
  timestamp: Date;
}

interface AlertRule {
  name: string;
  condition: (metrics: SystemMetrics, health?: SystemHealth) => boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  cooldown: number;
}

interface Alert {
  id: string;
  rule: string;
  severity: string;
  message: string;
  timestamp: Date;
  resolved?: Date;
  metadata?: any;
}
```

## 4. API Endpoints

### 4.1 Health Check Endpoints

#### GET /health
System health overview.

**Response:**
```json
{
  "status": "HEALTHY",
  "checks": [
    {
      "name": "database_connectivity",
      "status": "HEALTHY",
      "responseTime": 12,
      "details": "Database connection successful",
      "timestamp": "2025-01-27T12:00:00Z"
    }
  ],
  "summary": {
    "total": 5,
    "healthy": 5,
    "unhealthy": 0,
    "healthPercentage": 100
  }
}
```

#### GET /health/{service}
Specific service health check.

#### GET /metrics
Prometheus-compatible metrics endpoint.

### 4.2 Monitoring Endpoints

#### GET /admin/monitoring/dashboard
Real-time monitoring dashboard data.

**Response:**
```json
{
  "system": {
    "cpu": 45.2,
    "memory": 67.8,
    "uptime": 86400
  },
  "application": {
    "apiLatency": { "p50": 120, "p95": 450, "p99": 800 },
    "errorRate": 0.02,
    "throughput": 150
  },
  "business": {
    "quotesGenerated": 1247,
    "policiesCreated": 891,
    "payoutsProcessed": 23
  }
}
```

#### GET /admin/monitoring/alerts
Active alerts and alert history.

#### POST /admin/monitoring/alerts/{alertId}/resolve
Resolve an active alert.

## 5. Metrics Collection

```typescript
export const monitoringMetrics = {
  systemStarted: new Counter({
    name: 'monitoring_system_started_total',
    help: 'Monitoring system start events'
  }),

  healthChecksExecuted: new Counter({
    name: 'monitoring_health_checks_total',
    help: 'Health checks executed',
    labelNames: ['check_name', 'status']
  }),

  alertsTriggered: new Counter({
    name: 'monitoring_alerts_triggered_total',
    help: 'Alerts triggered',
    labelNames: ['rule', 'severity']
  }),

  systemCPU: new Gauge({
    name: 'monitoring_system_cpu_percent',
    help: 'System CPU usage percentage'
  }),

  systemMemory: new Gauge({
    name: 'monitoring_system_memory_percent',
    help: 'System memory usage percentage'
  }),

  apiLatency: new Histogram({
    name: 'monitoring_api_latency_seconds',
    help: 'API response latency',
    labelNames: ['endpoint', 'method'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  businessMetrics: new Gauge({
    name: 'monitoring_business_metrics',
    help: 'Business metrics',
    labelNames: ['metric_type']
  })
};
```

## 6. Dashboard Configuration

### 6.1 System Dashboard
- **CPU/Memory/Disk Usage**: Real-time system resource monitoring
- **Database Performance**: Query latency, connections, locks
- **API Performance**: Response times, error rates, throughput
- **Health Status**: Service health indicators

### 6.2 Business Dashboard
- **Quote Metrics**: Quotes generated, conversion rates
- **Policy Metrics**: Active policies, premium collected
- **Payout Metrics**: Automatic payouts, success rate
- **User Activity**: Daily/monthly active users

### 6.3 External Service Dashboard
- **API Status**: AviationStack, FlightAware, OpenSky availability
- **Response Times**: External API latency tracking
- **Rate Limits**: Usage vs. limits for paid APIs
- **Cost Tracking**: API usage costs

## 7. Error Handling

```typescript
export class MonitoringError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MonitoringError';
  }
}

export const MONITORING_ERROR_CODES = {
  HEALTH_CHECK_NOT_FOUND: 'HEALTH_CHECK_NOT_FOUND',
  METRICS_COLLECTION_FAILED: 'METRICS_COLLECTION_FAILED',
  ALERT_DELIVERY_FAILED: 'ALERT_DELIVERY_FAILED',
  DASHBOARD_GENERATION_FAILED: 'DASHBOARD_GENERATION_FAILED'
} as const;
```

## 8. Implementation Timeline

### Week 1: Core Infrastructure
- Basic health check system
- System metrics collection
- Database monitoring
- Alert rule engine

### Week 2: Advanced Monitoring
- Business metrics tracking
- External API monitoring
- Dashboard implementation
- Notification channels

### Week 3: Production Readiness
- Alert fine-tuning
- Performance optimization
- Documentation
- Integration testing

## 9. Success Metrics

### Performance
- Health check response time: < 100ms
- Metrics collection frequency: Every 30 seconds
- Alert delivery time: < 30 seconds
- Dashboard load time: < 2 seconds

### Reliability
- Monitoring system uptime: > 99.9%
- False positive rate: < 5%
- Alert coverage: > 95% of critical issues
- Mean time to detection: < 2 minutes

### Business Value
- Incident resolution time: 50% reduction
- System availability: > 99.9%
- Proactive issue detection: > 80%
- Operational visibility: Complete coverage

---

**Dependencies**: All Core PRDs, PRD-API-001, PRD-INFRA-001  
**Integration**: Monitors all system components and external dependencies  
**Status**: Implementation Ready for Phase 4