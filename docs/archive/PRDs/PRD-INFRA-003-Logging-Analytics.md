# PRD-INFRA-003: Logging & Analytics

**Status**: Ready for Implementation  
**Priority**: Medium - Operational Insights  
**Dependencies**: All Core PRDs, PRD-INFRA-002 (Monitoring)  
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Logging & Analytics system provides comprehensive operational insights, debugging capabilities, and business intelligence for the triggerr platform. It enables real-time monitoring, historical analysis, and data-driven decision making.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Log Sources   │    │  Logging Engine  │    │   Analytics     │
│                 │────▶│                  │────▶│                 │
│ Application     │    │ Structured Logs  │    │ Business Metrics│
│ API Endpoints   │    │ Event Tracking   │    │ Performance     │
│ Background Jobs │    │ Error Capture    │    │ User Behavior   │
│ Integrations    │    │ Audit Trail      │    │ Financial Data  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 Logging Engine

```typescript
export class LoggingEngine {
  private loggers: Map<string, Logger>;
  private analyticsCollector: AnalyticsCollector;
  private auditLogger: AuditLogger;
  private errorTracker: ErrorTracker;

  constructor(config: LoggingConfig) {
    this.loggers = new Map();
    this.analyticsCollector = new AnalyticsCollector(config.analytics);
    this.auditLogger = new AuditLogger(config.audit);
    this.errorTracker = new ErrorTracker(config.errorTracking);
    this.initializeLoggers(config.loggers);
  }

  createLogger(category: LogCategory): Logger {
    const logger = new StructuredLogger({
      category,
      level: this.getLogLevel(category),
      transports: this.getTransports(category),
      formatters: this.getFormatters(category)
    });

    this.loggers.set(category, logger);
    return logger;
  }

  async logEvent(event: LogEvent): Promise<void> {
    const logger = this.getLogger(event.category);
    
    // Structured logging
    await logger.log(event.level, event.message, {
      ...event.metadata,
      timestamp: new Date().toISOString(),
      requestId: event.requestId,
      userId: event.userId,
      component: event.component
    });

    // Analytics collection
    if (event.analytics) {
      await this.analyticsCollector.track(event);
    }

    // Audit trail
    if (event.audit) {
      await this.auditLogger.record(event);
    }

    // Error tracking
    if (event.level === 'error' || event.error) {
      await this.errorTracker.capture(event);
    }
  }

  async logBusinessEvent(event: BusinessEvent): Promise<void> {
    await this.analyticsCollector.trackBusinessEvent(event);
    
    const logEvent: LogEvent = {
      category: 'business',
      level: 'info',
      message: `Business event: ${event.type}`,
      metadata: event.data,
      analytics: true,
      audit: event.requiresAudit || false
    };

    await this.logEvent(logEvent);
  }
}
```

### 2.2 Structured Logger

```typescript
export class StructuredLogger implements Logger {
  private category: LogCategory;
  private transports: LogTransport[];
  private formatters: LogFormatter[];

  async log(level: LogLevel, message: string, metadata: LogMetadata): Promise<void> {
    const logEntry: LogEntry = {
      id: generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      category: this.category,
      message,
      metadata,
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION
    };

    // Format log entry
    const formattedEntry = await this.formatLogEntry(logEntry);

    // Send to all transports
    await Promise.all(
      this.transports.map(transport => transport.write(formattedEntry))
    );

    // Update metrics
    loggingMetrics.logsWritten.inc({ 
      level, 
      category: this.category 
    });
  }

  private async formatLogEntry(entry: LogEntry): Promise<FormattedLogEntry> {
    let formatted = entry;

    for (const formatter of this.formatters) {
      formatted = await formatter.format(formatted);
    }

    return formatted;
  }

  // Convenience methods
  async info(message: string, metadata?: LogMetadata): Promise<void> {
    await this.log('info', message, metadata);
  }

  async warn(message: string, metadata?: LogMetadata): Promise<void> {
    await this.log('warn', message, metadata);
  }

  async error(message: string, error?: Error, metadata?: LogMetadata): Promise<void> {
    const errorMetadata = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : {};

    await this.log('error', message, { ...metadata, ...errorMetadata });
  }

  async debug(message: string, metadata?: LogMetadata): Promise<void> {
    await this.log('debug', message, metadata);
  }
}
```

### 2.3 Analytics Collector

```typescript
export class AnalyticsCollector {
  private eventStore: EventStore;
  private aggregators: Map<string, MetricAggregator>;
  private realTimeProcessor: RealTimeProcessor;

  async trackBusinessEvent(event: BusinessEvent): Promise<void> {
    // Store raw event
    await this.eventStore.store(event);

    // Process for real-time metrics
    await this.realTimeProcessor.process(event);

    // Update aggregations
    const aggregator = this.aggregators.get(event.type);
    if (aggregator) {
      await aggregator.aggregate(event);
    }

    // Track specific business metrics
    switch (event.type) {
      case 'quote_generated':
        await this.trackQuoteMetrics(event);
        break;
      case 'policy_created':
        await this.trackPolicyMetrics(event);
        break;
      case 'payout_processed':
        await this.trackPayoutMetrics(event);
        break;
      case 'api_request':
        await this.trackAPIMetrics(event);
        break;
    }
  }

  private async trackQuoteMetrics(event: BusinessEvent): Promise<void> {
    const { premium, coverageAmount, riskScore } = event.data;

    analyticsMetrics.quotesGenerated.inc({
      coverageType: event.data.coverageType
    });

    analyticsMetrics.premiumAmount.observe(premium);
    analyticsMetrics.coverageAmount.observe(coverageAmount);
    analyticsMetrics.riskScore.observe(riskScore);

    // Update business dashboards
    await this.updateBusinessDashboard('quotes', {
      totalQuotes: 1,
      totalPremium: premium,
      avgRiskScore: riskScore
    });
  }

  private async trackPolicyMetrics(event: BusinessEvent): Promise<void> {
    const { policyId, premium, providerId } = event.data;

    analyticsMetrics.policiesCreated.inc({
      provider: providerId
    });

    analyticsMetrics.policyValue.observe(premium);

    // Track conversion rate
    const conversionRate = await this.calculateConversionRate();
    analyticsMetrics.conversionRate.set(conversionRate);
  }

  private async trackPayoutMetrics(event: BusinessEvent): Promise<void> {
    const { amount, reason, delayMinutes } = event.data;

    analyticsMetrics.payoutsProcessed.inc({
      reason
    });

    analyticsMetrics.payoutAmount.observe(amount);
    
    if (delayMinutes) {
      analyticsMetrics.payoutDelayMinutes.observe(delayMinutes);
    }

    // Calculate payout ratio
    const payoutRatio = await this.calculatePayoutRatio();
    analyticsMetrics.payoutRatio.set(payoutRatio);
  }
}
```

### 2.4 Audit Logger

```typescript
export class AuditLogger {
  private auditStore: AuditStore;
  private complianceChecker: ComplianceChecker;

  async record(event: LogEvent): Promise<void> {
    const auditEntry: AuditEntry = {
      id: generateAuditId(),
      timestamp: new Date().toISOString(),
      userId: event.userId,
      action: event.action || 'unknown',
      resource: event.resource,
      resourceId: event.resourceId,
      changes: event.changes,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      requestId: event.requestId,
      result: event.result || 'unknown'
    };

    // Store audit entry
    await this.auditStore.store(auditEntry);

    // Check compliance requirements
    await this.complianceChecker.validate(auditEntry);

    auditMetrics.entriesRecorded.inc({
      action: auditEntry.action,
      resource: auditEntry.resource
    });
  }

  async recordUserAction(action: UserAction): Promise<void> {
    await this.record({
      category: 'audit',
      level: 'info',
      message: `User action: ${action.type}`,
      userId: action.userId,
      action: action.type,
      resource: action.resource,
      resourceId: action.resourceId,
      changes: action.changes,
      ipAddress: action.ipAddress,
      userAgent: action.userAgent,
      requestId: action.requestId,
      audit: true
    });
  }

  async recordSystemAction(action: SystemAction): Promise<void> {
    await this.record({
      category: 'audit',
      level: 'info',
      message: `System action: ${action.type}`,
      action: action.type,
      resource: action.resource,
      resourceId: action.resourceId,
      changes: action.changes,
      requestId: action.requestId,
      result: action.result,
      audit: true
    });
  }
}
```

### 2.5 Error Tracker

```typescript
export class ErrorTracker {
  private errorStore: ErrorStore;
  private alertManager: AlertManager;
  private errorAggregator: ErrorAggregator;

  async capture(event: LogEvent): Promise<void> {
    const errorEntry: ErrorEntry = {
      id: generateErrorId(),
      timestamp: new Date().toISOString(),
      level: event.level,
      message: event.message,
      error: event.error,
      metadata: event.metadata,
      stackTrace: event.error?.stack,
      userId: event.userId,
      requestId: event.requestId,
      component: event.component,
      environment: process.env.NODE_ENV
    };

    // Store error
    await this.errorStore.store(errorEntry);

    // Aggregate error metrics
    await this.errorAggregator.aggregate(errorEntry);

    // Check if alert is needed
    const shouldAlert = await this.shouldAlert(errorEntry);
    if (shouldAlert) {
      await this.alertManager.sendAlert(errorEntry);
    }

    errorMetrics.errorsTracked.inc({
      level: event.level,
      component: event.component
    });
  }

  private async shouldAlert(error: ErrorEntry): Promise<boolean> {
    // Critical errors always alert
    if (error.level === 'critical') {
      return true;
    }

    // Check error rate thresholds
    const errorRate = await this.errorAggregator.getErrorRate(
      error.component,
      '5m'
    );

    return errorRate > 0.1; // Alert if error rate > 10%
  }
}
```

## 3. Data Types

```typescript
interface LogEvent {
  category: LogCategory;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  requestId?: string;
  userId?: string;
  component?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  result?: string;
  error?: Error;
  analytics?: boolean;
  audit?: boolean;
}

type LogCategory = 
  | 'api'
  | 'business'
  | 'system'
  | 'security'
  | 'integration'
  | 'blockchain'
  | 'database'
  | 'audit';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogMetadata {
  [key: string]: any;
}

interface BusinessEvent {
  type: BusinessEventType;
  data: any;
  userId?: string;
  timestamp?: Date;
  requiresAudit?: boolean;
}

type BusinessEventType =
  | 'quote_generated'
  | 'quote_expired'
  | 'policy_created'
  | 'policy_activated'
  | 'payout_processed'
  | 'api_request'
  | 'user_registered'
  | 'provider_registered'
  | 'escrow_created'
  | 'escrow_fulfilled';

interface AuditEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  result: string;
}

interface ErrorEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: Error;
  metadata?: LogMetadata;
  stackTrace?: string;
  userId?: string;
  requestId?: string;
  component?: string;
  environment?: string;
}
```

## 4. Log Transports

### 4.1 Console Transport
```typescript
export class ConsoleTransport implements LogTransport {
  async write(entry: FormattedLogEntry): Promise<void> {
    const output = this.formatForConsole(entry);
    
    switch (entry.level) {
      case 'error':
      case 'critical':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  private formatForConsole(entry: FormattedLogEntry): string {
    return `[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.category}] ${entry.message} ${JSON.stringify(entry.metadata)}`;
  }
}
```

### 4.2 File Transport
```typescript
export class FileTransport implements LogTransport {
  private logDirectory: string;
  private rotationConfig: RotationConfig;

  async write(entry: FormattedLogEntry): Promise<void> {
    const filename = this.getLogFilename(entry);
    const logLine = JSON.stringify(entry) + '\n';
    
    await fs.appendFile(filename, logLine);
    
    // Check if rotation is needed
    await this.checkRotation(filename);
  }

  private async checkRotation(filename: string): Promise<void> {
    const stats = await fs.stat(filename);
    
    if (stats.size > this.rotationConfig.maxSize) {
      await this.rotateFile(filename);
    }
  }
}
```

### 4.3 Database Transport
```typescript
export class DatabaseTransport implements LogTransport {
  private db: PrismaClient;

  async write(entry: FormattedLogEntry): Promise<void> {
    await this.db.logEntry.create({
      data: {
        id: entry.id,
        timestamp: new Date(entry.timestamp),
        level: entry.level,
        category: entry.category,
        message: entry.message,
        metadata: entry.metadata,
        userId: entry.userId,
        requestId: entry.requestId,
        component: entry.component
      }
    });
  }
}
```

## 5. Analytics Dashboards

### 5.1 Business Metrics Dashboard
```typescript
export class BusinessDashboard {
  async generateDashboard(timeRange: TimeRange): Promise<DashboardData> {
    const [
      quoteMetrics,
      policyMetrics,
      payoutMetrics,
      revenueMetrics,
      userMetrics
    ] = await Promise.all([
      this.getQuoteMetrics(timeRange),
      this.getPolicyMetrics(timeRange),
      this.getPayoutMetrics(timeRange),
      this.getRevenueMetrics(timeRange),
      this.getUserMetrics(timeRange)
    ]);

    return {
      timeRange,
      quotes: quoteMetrics,
      policies: policyMetrics,
      payouts: payoutMetrics,
      revenue: revenueMetrics,
      users: userMetrics,
      generatedAt: new Date()
    };
  }

  private async getQuoteMetrics(timeRange: TimeRange): Promise<QuoteMetrics> {
    return {
      totalQuotes: await this.countQuotes(timeRange),
      conversionRate: await this.calculateConversionRate(timeRange),
      averagePremium: await this.calculateAveragePremium(timeRange),
      topRoutes: await this.getTopRoutes(timeRange),
      riskDistribution: await this.getRiskDistribution(timeRange)
    };
  }
}
```

### 5.2 Operational Dashboard
```typescript
export class OperationalDashboard {
  async generateDashboard(): Promise<OperationalData> {
    const [
      systemHealth,
      apiMetrics,
      errorRates,
      performanceMetrics,
      integrationStatus
    ] = await Promise.all([
      this.getSystemHealth(),
      this.getAPIMetrics(),
      this.getErrorRates(),
      this.getPerformanceMetrics(),
      this.getIntegrationStatus()
    ]);

    return {
      systemHealth,
      apiMetrics,
      errorRates,
      performance: performanceMetrics,
      integrations: integrationStatus,
      generatedAt: new Date()
    };
  }
}
```

## 6. Monitoring & Metrics

```typescript
export const loggingMetrics = {
  logsWritten: new Counter({
    name: 'logging_logs_written_total',
    help: 'Total logs written',
    labelNames: ['level', 'category']
  }),

  logWriteErrors: new Counter({
    name: 'logging_write_errors_total',
    help: 'Log write errors',
    labelNames: ['transport', 'error']
  })
};

export const analyticsMetrics = {
  quotesGenerated: new Counter({
    name: 'analytics_quotes_generated_total',
    help: 'Total quotes generated',
    labelNames: ['coverageType']
  }),

  policiesCreated: new Counter({
    name: 'analytics_policies_created_total',
    help: 'Total policies created',
    labelNames: ['provider']
  }),

  payoutsProcessed: new Counter({
    name: 'analytics_payouts_processed_total',
    help: 'Total payouts processed',
    labelNames: ['reason']
  }),

  conversionRate: new Gauge({
    name: 'analytics_conversion_rate',
    help: 'Quote to policy conversion rate'
  })
};

export const errorMetrics = {
  errorsTracked: new Counter({
    name: 'error_tracking_errors_total',
    help: 'Total errors tracked',
    labelNames: ['level', 'component']
  }),

  errorRate: new Gauge({
    name: 'error_tracking_error_rate',
    help: 'Current error rate',
    labelNames: ['component']
  })
};
```

## 7. Configuration

```typescript
export interface LoggingConfig {
  loggers: LoggerConfig[];
  analytics: AnalyticsConfig;
  audit: AuditConfig;
  errorTracking: ErrorTrackingConfig;
}

export interface LoggerConfig {
  category: LogCategory;
  level: LogLevel;
  transports: TransportConfig[];
  formatters: FormatterConfig[];
}

export interface AnalyticsConfig {
  enabled: boolean;
  realTimeProcessing: boolean;
  retention: {
    rawEvents: string; // e.g., "30d"
    aggregatedMetrics: string; // e.g., "1y"
  };
  dashboards: {
    business: boolean;
    operational: boolean;
    custom: boolean;
  };
}
```

## 8. Implementation Timeline

### Week 1: Core Logging Infrastructure
- Structured logging engine
- Basic transports (console, file, database)
- Log formatters and metadata handling
- Initial metrics collection

### Week 2: Analytics & Business Intelligence
- Analytics collector implementation
- Business event tracking
- Dashboard data generation
- Real-time metric processing

### Week 3: Advanced Features
- Audit logging system
- Error tracking and alerting
- Log rotation and retention
- Performance optimization

## 9. Success Metrics

### Performance
- Log write latency: < 10ms
- Analytics processing: < 100ms
- Dashboard generation: < 2 seconds
- Storage efficiency: < 100GB/month

### Operational
- Log retention: 30 days raw, 1 year aggregated
- Error detection: < 1 minute for critical issues
- Dashboard availability: > 99.9%
- Compliance audit trail: 100% coverage

---

**Dependencies**: All Core PRDs, PRD-INFRA-002 (Monitoring)  
**Integration**: Provides operational insights for entire platform  
**Status**: Implementation Ready