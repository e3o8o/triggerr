# PRD-APP-002: Admin Dashboard

**Status**: Ready for Implementation  
**Priority**: Medium - Operational Management  
**Dependencies**: PRD-API-001 (Public API), PRD-CORE-002 (Auth), PRD-ENGINE-004 (Provider Management)  
**Estimated Timeline**: 3-4 weeks  

## 1. Overview

### 1.1 Purpose
The Admin Dashboard provides a comprehensive administrative interface for managing the triggerr parametric insurance platform. It enables platform administrators to oversee providers, policies, users, system health, and business operations through an intuitive web interface.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin UI      │    │   Admin API      │    │  Core Services  │
│                 │────▶│                  │────▶│                 │
│ React Dashboard │    │ Admin Endpoints  │    │ Provider Engine │
│ Charts & Tables │    │ RBAC Middleware  │    │ Policy Engine   │
│ Real-time Data  │    │ Audit Logging    │    │ Revenue Engine  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 Admin Dashboard Application

```typescript
export class AdminDashboard {
  private authService: AdminAuthService;
  private providerService: ProviderManagementService;
  private policyService: PolicyManagementService;
  private systemMonitor: SystemMonitoringService;
  private analyticsService: AnalyticsService;

  constructor(config: AdminDashboardConfig) {
    this.authService = new AdminAuthService(config.auth);
    this.providerService = new ProviderManagementService(config.providers);
    this.policyService = new PolicyManagementService(config.policies);
    this.systemMonitor = new SystemMonitoringService(config.monitoring);
    this.analyticsService = new AnalyticsService(config.analytics);
  }

  async initialize(): Promise<void> {
    // Setup admin authentication
    await this.authService.initialize();
    
    // Initialize real-time monitoring
    await this.systemMonitor.startRealTimeMonitoring();
    
    // Setup analytics tracking
    await this.analyticsService.initialize();
  }
}
```

### 2.2 Provider Management Interface

```typescript
export class ProviderManagementInterface {
  async getProviderApplications(status?: ProviderStatus): Promise<ProviderApplication[]> {
    return await this.providerService.getApplications({
      status,
      includeDocuments: true,
      sortBy: 'appliedAt',
      order: 'desc'
    });
  }

  async approveProvider(
    providerId: string, 
    approvalData: ProviderApprovalData
  ): Promise<void> {
    // Validate approval requirements
    await this.validateApprovalRequirements(providerId);
    
    // Update provider status
    await this.providerService.approveProvider(providerId, {
      approvedBy: approvalData.adminId,
      tier: approvalData.tier,
      revenueSharing: approvalData.revenueSharing,
      notes: approvalData.notes
    });

    // Send approval notification
    await this.notificationService.sendProviderApproval(providerId);
    
    // Log admin action
    await this.auditLogger.logAction({
      action: 'PROVIDER_APPROVED',
      adminId: approvalData.adminId,
      resourceId: providerId,
      details: approvalData
    });
  }

  async suspendProvider(
    providerId: string, 
    reason: string, 
    adminId: string
  ): Promise<void> {
    await this.providerService.suspendProvider(providerId, reason);
    
    // Disable all provider products
    await this.providerService.disableProviderProducts(providerId);
    
    // Log suspension
    await this.auditLogger.logAction({
      action: 'PROVIDER_SUSPENDED',
      adminId,
      resourceId: providerId,
      details: { reason }
    });
  }
}
```

### 2.3 Policy Management Interface

```typescript
export class PolicyManagementInterface {
  async getPoliciesOverview(): Promise<PolicyOverview> {
    const [
      activePolicies,
      pendingPayouts,
      recentPayouts,
      flaggedPolicies
    ] = await Promise.all([
      this.policyService.getActivePolicies(),
      this.policyService.getPendingPayouts(),
      this.policyService.getRecentPayouts(24), // Last 24 hours
      this.policyService.getFlaggedPolicies()
    ]);

    return {
      activePolicies: activePolicies.length,
      pendingPayouts: pendingPayouts.length,
      recentPayouts: recentPayouts.length,
      flaggedPolicies: flaggedPolicies.length,
      totalPremiumCollected: this.calculateTotalPremium(activePolicies),
      totalPayoutsProcessed: this.calculateTotalPayouts(recentPayouts)
    };
  }

  async manuallyTriggerPayout(
    policyId: string, 
    reason: string, 
    adminId: string
  ): Promise<void> {
    const policy = await this.policyService.getPolicyById(policyId);
    
    if (policy.status !== 'ACTIVE') {
      throw new AdminError('INVALID_POLICY_STATUS', 'Policy must be active for manual payout');
    }

    // Create manual payout request
    await this.payoutService.processManualPayout({
      policyId,
      reason,
      triggeredBy: adminId,
      amount: policy.payoutAmount
    });

    // Log manual intervention
    await this.auditLogger.logAction({
      action: 'MANUAL_PAYOUT_TRIGGERED',
      adminId,
      resourceId: policyId,
      details: { reason, amount: policy.payoutAmount }
    });
  }

  async flagPolicyForReview(
    policyId: string, 
    flagReason: string, 
    adminId: string
  ): Promise<void> {
    await this.policyService.flagPolicy(policyId, {
      reason: flagReason,
      flaggedBy: adminId,
      flaggedAt: new Date(),
      requiresReview: true
    });
  }
}
```

### 2.4 System Monitoring Interface

```typescript
export class SystemMonitoringInterface {
  async getSystemHealth(): Promise<SystemHealthStatus> {
    const [
      apiHealth,
      databaseHealth,
      externalAPIsHealth,
      blockchainHealth
    ] = await Promise.all([
      this.checkAPIHealth(),
      this.checkDatabaseHealth(),
      this.checkExternalAPIsHealth(),
      this.checkBlockchainHealth()
    ]);

    return {
      overall: this.calculateOverallHealth([apiHealth, databaseHealth, externalAPIsHealth, blockchainHealth]),
      components: {
        api: apiHealth,
        database: databaseHealth,
        externalAPIs: externalAPIsHealth,
        blockchain: blockchainHealth
      },
      lastChecked: new Date()
    };
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      apiMetrics: {
        requestsPerMinute: await this.getAPIRequestRate(),
        averageResponseTime: await this.getAverageResponseTime(),
        errorRate: await this.getAPIErrorRate()
      },
      businessMetrics: {
        quotesGeneratedToday: await this.getQuotesGeneratedToday(),
        policiesCreatedToday: await this.getPoliciesCreatedToday(),
        payoutsProcessedToday: await this.getPayoutsProcessedToday()
      },
      systemMetrics: {
        memoryUsage: await this.getMemoryUsage(),
        cpuUsage: await this.getCPUUsage(),
        diskUsage: await this.getDiskUsage()
      }
    };
  }

  private async checkExternalAPIsHealth(): Promise<ExternalAPIHealth> {
    const sources = ['aviationstack', 'flightaware', 'opensky', 'weather'];
    const healthChecks = await Promise.all(
      sources.map(source => this.checkAPISourceHealth(source))
    );

    return {
      overall: healthChecks.every(check => check.healthy) ? 'HEALTHY' : 'DEGRADED',
      sources: healthChecks.reduce((acc, check, index) => {
        acc[sources[index]] = check;
        return acc;
      }, {} as Record<string, APIHealthCheck>)
    };
  }
}
```

### 2.5 Analytics and Reporting

```typescript
export class AnalyticsInterface {
  async generateBusinessReport(period: ReportPeriod): Promise<BusinessReport> {
    const dateRange = this.getDateRange(period);
    
    const [
      revenueData,
      policyData,
      providerData,
      userActivity
    ] = await Promise.all([
      this.getRevenueAnalytics(dateRange),
      this.getPolicyAnalytics(dateRange),
      this.getProviderAnalytics(dateRange),
      this.getUserActivityAnalytics(dateRange)
    ]);

    return {
      period,
      dateRange,
      revenue: revenueData,
      policies: policyData,
      providers: providerData,
      users: userActivity,
      generatedAt: new Date()
    };
  }

  private async getRevenueAnalytics(dateRange: DateRange): Promise<RevenueAnalytics> {
    return {
      totalRevenue: await this.calculateTotalRevenue(dateRange),
      platformFees: await this.calculatePlatformFees(dateRange),
      providerPayouts: await this.calculateProviderPayouts(dateRange),
      revenueByProvider: await this.getRevenueByProvider(dateRange),
      revenueGrowth: await this.calculateRevenueGrowth(dateRange)
    };
  }

  async exportReport(reportType: ReportType, format: ExportFormat): Promise<ExportResult> {
    const report = await this.generateReport(reportType);
    
    switch (format) {
      case 'CSV':
        return await this.exportToCSV(report);
      case 'PDF':
        return await this.exportToPDF(report);
      case 'EXCEL':
        return await this.exportToExcel(report);
      default:
        throw new AdminError('UNSUPPORTED_EXPORT_FORMAT', `Format ${format} not supported`);
    }
  }
}
```

## 3. Data Types

```typescript
interface AdminDashboardConfig {
  auth: AdminAuthConfig;
  permissions: AdminPermissions;
  monitoring: MonitoringConfig;
  analytics: AnalyticsConfig;
}

interface ProviderApplication {
  id: string;
  name: string;
  category: ProviderCategory;
  status: ProviderStatus;
  appliedAt: Date;
  businessInfo: BusinessInfo;
  financialInfo: FinancialInfo;
  documents: ApplicationDocument[];
  reviewNotes?: string;
}

interface PolicyOverview {
  activePolicies: number;
  pendingPayouts: number;
  recentPayouts: number;
  flaggedPolicies: number;
  totalPremiumCollected: number;
  totalPayoutsProcessed: number;
}

interface SystemHealthStatus {
  overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  components: {
    api: ComponentHealth;
    database: ComponentHealth;
    externalAPIs: ExternalAPIHealth;
    blockchain: ComponentHealth;
  };
  lastChecked: Date;
}

interface PerformanceMetrics {
  apiMetrics: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
  businessMetrics: {
    quotesGeneratedToday: number;
    policiesCreatedToday: number;
    payoutsProcessedToday: number;
  };
  systemMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
}

interface BusinessReport {
  period: ReportPeriod;
  dateRange: DateRange;
  revenue: RevenueAnalytics;
  policies: PolicyAnalytics;
  providers: ProviderAnalytics;
  users: UserActivityAnalytics;
  generatedAt: Date;
}

type ReportPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
type ExportFormat = 'CSV' | 'PDF' | 'EXCEL' | 'JSON';
```

## 4. User Interface Structure

### 4.1 Main Dashboard Layout
```typescript
interface DashboardLayout {
  sidebar: {
    sections: [
      'Overview',
      'Providers',
      'Policies', 
      'Users',
      'System Health',
      'Analytics',
      'Settings'
    ];
  };
  header: {
    breadcrumbs: boolean;
    notifications: boolean;
    userMenu: boolean;
  };
  content: {
    widgets: DashboardWidget[];
    filters: FilterOptions;
  };
}
```

### 4.2 Key Dashboard Widgets
- **System Health Overview**: Real-time status indicators
- **Active Policies Map**: Geographic distribution of policies
- **Revenue Trends**: Charts showing revenue over time
- **Provider Performance**: Provider metrics and rankings
- **Recent Activity Feed**: Latest system events
- **Alert Center**: Flagged policies and system alerts

## 5. API Endpoints

### 5.1 Admin Authentication
```
POST /admin/auth/login
POST /admin/auth/logout
GET  /admin/auth/profile
PUT  /admin/auth/profile
```

### 5.2 Provider Management
```
GET    /admin/providers                    # List all providers
GET    /admin/providers/:id               # Get provider details
PUT    /admin/providers/:id/approve       # Approve provider
PUT    /admin/providers/:id/suspend       # Suspend provider
GET    /admin/providers/:id/products      # Get provider products
PUT    /admin/providers/:id/products/:pid # Update product status
```

### 5.3 Policy Management
```
GET    /admin/policies                    # List all policies
GET    /admin/policies/:id               # Get policy details
PUT    /admin/policies/:id/flag          # Flag policy for review
POST   /admin/policies/:id/payout        # Manual payout trigger
GET    /admin/policies/flagged           # Get flagged policies
GET    /admin/policies/analytics         # Policy analytics
```

### 5.4 System Monitoring
```
GET    /admin/system/health              # System health status
GET    /admin/system/metrics             # Performance metrics
GET    /admin/system/logs                # System logs
GET    /admin/system/alerts              # System alerts
```

### 5.5 Analytics and Reporting
```
GET    /admin/analytics/revenue          # Revenue analytics
GET    /admin/analytics/policies         # Policy analytics
GET    /admin/analytics/providers        # Provider analytics
POST   /admin/reports/generate           # Generate custom report
GET    /admin/reports/:id/export         # Export report
```

## 6. Security and Permissions

### 6.1 Role-Based Access Control
```typescript
interface AdminRole {
  name: string;
  permissions: AdminPermission[];
}

type AdminPermission = 
  | 'PROVIDERS_READ'
  | 'PROVIDERS_APPROVE'
  | 'PROVIDERS_SUSPEND'
  | 'POLICIES_READ'
  | 'POLICIES_MANAGE'
  | 'POLICIES_PAYOUT'
  | 'USERS_READ'
  | 'USERS_MANAGE'
  | 'SYSTEM_MONITOR'
  | 'ANALYTICS_READ'
  | 'REPORTS_GENERATE'
  | 'SETTINGS_MANAGE';

const ADMIN_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Administrator',
    permissions: ['*'] // All permissions
  },
  OPERATIONS_MANAGER: {
    name: 'Operations Manager', 
    permissions: [
      'PROVIDERS_READ', 'PROVIDERS_APPROVE',
      'POLICIES_READ', 'POLICIES_MANAGE',
      'SYSTEM_MONITOR', 'ANALYTICS_READ'
    ]
  },
  SUPPORT_AGENT: {
    name: 'Support Agent',
    permissions: [
      'POLICIES_READ', 'USERS_READ',
      'SYSTEM_MONITOR'
    ]
  }
};
```

### 6.2 Audit Logging
```typescript
interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

## 7. Error Handling

```typescript
export class AdminError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

export const ADMIN_ERROR_CODES = {
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  INVALID_POLICY_STATUS: 'INVALID_POLICY_STATUS',
  PAYOUT_ALREADY_PROCESSED: 'PAYOUT_ALREADY_PROCESSED',
  REPORT_GENERATION_FAILED: 'REPORT_GENERATION_FAILED',
  EXPORT_FORMAT_UNSUPPORTED: 'EXPORT_FORMAT_UNSUPPORTED'
} as const;
```

## 8. Implementation Timeline

### Week 1: Foundation and Authentication
- Admin authentication system
- Role-based access control
- Basic dashboard layout
- Navigation structure

### Week 2: Provider and Policy Management
- Provider approval workflow
- Policy management interface
- Manual payout functionality
- Audit logging system

### Week 3: System Monitoring and Analytics
- Real-time system health monitoring
- Performance metrics dashboard
- Basic analytics and reporting
- Alert system

### Week 4: Advanced Features and Polish
- Advanced analytics and custom reports
- Export functionality
- UI/UX optimization
- Testing and bug fixes

## 9. Success Metrics

### Performance
- Dashboard load time: < 3 seconds
- Real-time data refresh: < 5 seconds
- Report generation: < 30 seconds
- System availability: > 99.9%

### Business
- Reduce provider approval time by 70%
- Improve policy issue resolution time by 50%
- Enable self-service reporting for stakeholders
- Provide real-time system visibility

### User Experience
- Admin task completion rate: > 95%
- Average time to complete common tasks: < 2 minutes
- User satisfaction score: > 4.5/5
- Support ticket reduction: 40%

---

**Dependencies**: PRD-API-001 (Public API), PRD-CORE-002 (Auth), PRD-ENGINE-004 (Provider Management)  
**Integration**: Comprehensive administrative interface for platform operations  
**Status**: Implementation Ready for Phase 4-5