// Analysis & Reporting Domain Models

export interface DependencyAnalysis {
  id: string;
  projectId: string;
  systemId: string; // Architecture element ID
  systemName: string;
  analysisDate: Date;
  directDependencies: DependencyImpact[];
  transitiveDependencies: DependencyImpact[];
  affectedSystems: AffectedSystem[];
  impactScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

export interface DependencyImpact {
  systemId: string;
  systemName: string;
  relationshipType: string;
  impactType: 'BREAKING' | 'MODERATE' | 'MINOR' | 'NONE';
  description: string;
  mitigation: string[];
}

export interface AffectedSystem {
  systemId: string;
  systemName: string;
  layer: 'BUSINESS' | 'APPLICATION' | 'DATA' | 'TECHNOLOGY' | 'SOLUTION';
  impactSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedComponents: string[];
  estimatedDowntime?: number; // hours
}

export interface GapAnalysis {
  id: string;
  projectId: string;
  asIsArchitectureId: string;
  toBeArchitectureId: string;
  analysisDate: Date;
  gaps: ArchitectureGap[];
  summary: GapSummary;
  recommendations: GapRecommendation[];
}

export interface ArchitectureGap {
  id: string;
  category: 'MISSING_COMPONENT' | 'MISSING_INTEGRATION' | 'MISSING_CAPABILITY' | 'TECHNOLOGY_GAP' | 'PROCESS_GAP' | 'DATA_GAP';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedLayers: ('BUSINESS' | 'APPLICATION' | 'DATA' | 'TECHNOLOGY' | 'SOLUTION')[];
  estimatedEffort: number; // person-days
  priority: number; // 1-10
  dependencies: string[]; // Gap IDs that must be resolved first
}

export interface GapSummary {
  totalGaps: number;
  criticalGaps: number;
  highGaps: number;
  mediumGaps: number;
  lowGaps: number;
  estimatedTotalEffort: number; // person-days
  estimatedCost: number;
  estimatedTimeline: number; // months
}

export interface GapRecommendation {
  gapId: string;
  recommendation: string;
  priority: number;
  estimatedEffort: number;
  dependencies: string[];
}

export interface PortfolioDashboard {
  id: string;
  projectId?: string; // Optional: project-specific or portfolio-wide
  dashboardDate: Date;
  health: PortfolioHealth;
  maturity: PortfolioMaturity;
  technicalDebt: TechnicalDebt;
  summary: PortfolioSummary;
}

export interface PortfolioHealth {
  overallScore: number; // 0-100
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  metrics: {
    availability: number; // percentage
    performance: number; // score 0-100
    security: number; // score 0-100
    compliance: number; // score 0-100
    maintainability: number; // score 0-100
  };
  systemsByHealth: {
    healthy: number;
    warning: number;
    critical: number;
  };
}

export interface PortfolioMaturity {
  overallLevel: 'INITIAL' | 'DEVELOPING' | 'DEFINED' | 'MANAGED' | 'OPTIMIZING';
  levelScore: number; // 0-100
  dimensions: {
    processMaturity: number; // 0-100
    technologyMaturity: number; // 0-100
    dataMaturity: number; // 0-100
    integrationMaturity: number; // 0-100
    governanceMaturity: number; // 0-100
  };
  roadmap: MaturityRoadmapItem[];
}

export interface MaturityRoadmapItem {
  dimension: string;
  currentLevel: string;
  targetLevel: string;
  initiatives: string[];
  estimatedTime: number; // months
}

export interface TechnicalDebt {
  totalDebt: number; // in person-days
  debtByCategory: {
    codeQuality: number;
    architecture: number;
    documentation: number;
    testing: number;
    security: number;
    performance: number;
  };
  debtBySystem: Array<{
    systemId: string;
    systemName: string;
    debt: number;
    category: string;
  }>;
  priorityDebt: Array<{
    id: string;
    description: string;
    debt: number;
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
}

export interface PortfolioSummary {
  totalSystems: number;
  totalIntegrations: number;
  totalDataEntities: number;
  totalTechnologies: number;
  activeProjects: number;
  completedProjects: number;
}

export interface RiskScoring {
  id: string;
  projectId?: string;
  analysisDate: Date;
  overallRiskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risks: RiskItem[];
  heatmap: RiskHeatmap;
  trends: RiskTrend[];
}

export interface RiskItem {
  id: string;
  category: 'TECHNICAL' | 'BUSINESS' | 'SECURITY' | 'COMPLIANCE' | 'OPERATIONAL' | 'STRATEGIC';
  title: string;
  description: string;
  probability: number; // 0-100
  impact: number; // 0-100
  riskScore: number; // probability * impact
  mitigation: string[];
  owner?: string;
  status: 'OPEN' | 'MITIGATED' | 'ACCEPTED' | 'MONITORING';
}

export interface RiskHeatmap {
  dimensions: {
    x: string; // e.g., 'Impact'
    y: string; // e.g., 'Probability'
  };
  cells: RiskHeatmapCell[];
}

export interface RiskHeatmapCell {
  x: number; // Impact value
  y: number; // Probability value
  riskCount: number;
  riskIds: string[];
  color: string; // Hex color for visualization
}

export interface RiskTrend {
  date: Date;
  riskScore: number;
  riskCount: number;
  criticalRisks: number;
}

export interface CostEstimation {
  id: string;
  projectId?: string;
  architectureId: string;
  estimationDate: Date;
  totalCost: number;
  costBreakdown: CostBreakdown;
  assumptions: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CostBreakdown {
  infrastructure: {
    cloud: number;
    onPremise: number;
    hybrid: number;
    total: number;
  };
  software: {
    licenses: number;
    subscriptions: number;
    customDevelopment: number;
    total: number;
  };
  services: {
    consulting: number;
    implementation: number;
    support: number;
    training: number;
    total: number;
  };
  operations: {
    maintenance: number;
    monitoring: number;
    backup: number;
    disasterRecovery: number;
    total: number;
  };
  byLayer: {
    business: number;
    application: number;
    data: number;
    technology: number;
    solution: number;
  };
  bySystem: Array<{
    systemId: string;
    systemName: string;
    cost: number;
    category: string;
  }>;
}

export type CloudProvider = 'AWS' | 'AZURE' | 'GCP';

export type CloudPricingDataSource = 'LIVE_API' | 'CACHED' | 'STATIC';

export interface CloudServiceUsage {
  id: string;
  provider: CloudProvider;
  region: string;
  service: string;
  resource: string;
  unit: string;
  quantity: number;
  description?: string;
  assumptions?: string[];
  metadata?: Record<string, any>;
}

export interface CloudPricingRequest {
  currency?: string;
  discountRate?: number; // enterprise discount percentage 0-100
  usage: CloudServiceUsage[];
}

export interface CloudPricePoint {
  sku: string;
  description: string;
  unit: string;
  pricePerUnit: number;
  currency: string;
  provider: CloudProvider;
  region: string;
  service: string;
  lastUpdated: Date;
  source: CloudPricingDataSource;
  additionalMetadata?: Record<string, any>;
}

export interface CloudServiceCost {
  usage: CloudServiceUsage;
  pricePoint: CloudPricePoint;
  hourlyCost: number;
  monthlyCost: number;
  annualCost: number;
  blendedDiscount?: number;
  notes?: string[];
}

export interface CloudCostEstimate {
  request: CloudPricingRequest;
  services: CloudServiceCost[];
  totals: {
    hourly: number;
    monthly: number;
    annual: number;
    discounts: number;
  };
  dataSource: CloudPricingDataSource;
  assumptions: string[];
  generatedAt: Date;
}

export interface ArchitectureKPIs {
  id: string;
  projectId?: string;
  reportDate: Date;
  reuseRate: ReuseRateMetrics;
  integrationCount: IntegrationMetrics;
  slaCompliance: SLAComplianceMetrics;
  otherKPIs: Record<string, number>;
}

export interface WorkloadProfile {
  id: string;
  name: string;
  description?: string;
  peakTransactionsPerSecond: number;
  averageTransactionsPerSecond: number;
  concurrency: number;
  payloadSizeKb: number;
  growthRateMonthly: number; // percent
  availabilityTarget: number; // percent
  latencyTargetMs: number;
}

export interface PerformanceBottleneck {
  id: string;
  componentId?: string;
  componentName?: string;
  layer: 'BUSINESS' | 'APPLICATION' | 'DATA' | 'TECHNOLOGY' | 'SOLUTION';
  metric: 'CPU' | 'MEMORY' | 'IO' | 'NETWORK' | 'THROUGHPUT' | 'LATENCY';
  currentUtilization: number; // percent
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendations: string[];
}

export interface CapacityPlan {
  currentCapacityUnits: number;
  requiredCapacityNow: number;
  requiredCapacityPeak: number;
  requiredCapacityIn12Months: number;
  bufferPercentage: number;
  scalingStrategy: 'VERTICAL' | 'HORIZONTAL' | 'AUTO_SCALING';
  estimatedMonthlyCost: number;
  estimatedUpgradeTimelineWeeks: number;
  notes?: string[];
}

export interface PerformanceModel {
  id: string;
  projectId?: string;
  generatedAt: Date;
  workload: WorkloadProfile;
  capacityPlan: CapacityPlan;
  bottlenecks: PerformanceBottleneck[];
  recommendations: string[];
}

export interface ComplianceFramework {
  id: 'SOC2' | 'HIPAA' | 'GDPR' | 'CUSTOM';
  name: string;
  description: string;
  categories: string[];
  controls: ComplianceControl[];
}

export interface ComplianceControl {
  id: string;
  category: string;
  title: string;
  description: string;
  requirement: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ComplianceCheckResult {
  controlId: string;
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
  evidence?: string[];
  owner?: string;
  dueDate?: Date;
  remediationActions?: string[];
  notes?: string;
}

export interface ComplianceReport {
  id: string;
  framework: ComplianceFramework;
  generatedAt: Date;
  summary: {
    complianceScore: number;
    compliant: number;
    partial: number;
    nonCompliant: number;
    notApplicable: number;
  };
  results: Array<ComplianceCheckResult & { control: ComplianceControl }>;
  highRiskControls: string[];
  recommendations: string[];
}

export interface TechnologyRequirement {
  id: string;
  category: 'FRONTEND' | 'BACKEND' | 'DATA' | 'DEVOPS' | 'SECURITY' | 'INTEGRATION';
  description: string;
  priority: 'MUST_HAVE' | 'SHOULD_HAVE' | 'NICE_TO_HAVE';
  weight: number; // 1-5
  rationale?: string;
}

export interface TechnologyOption {
  id: string;
  name: string;
  category: TechnologyRequirement['category'];
  description: string;
  maturity: 'EMERGING' | 'ESTABLISHED' | 'LEGACY';
  ecosystemScore: number; // 0-100
  complianceFit: number; // 0-100
  costProfile: 'LOW' | 'MEDIUM' | 'HIGH';
  skillsAvailability: 'LOW' | 'MEDIUM' | 'HIGH';
  pros: string[];
  cons: string[];
}

export interface StackRecommendation {
  id: string;
  projectId?: string;
  generatedAt: Date;
  requirements: TechnologyRequirement[];
  options: Array<TechnologyOption & {
    score: number;
    fit: 'HIGH' | 'MEDIUM' | 'LOW';
    gapAnalysis: string[];
  }>;
  recommendedStack: TechnologyOption[];
  summary: {
    overallFit: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedRampUpEffortWeeks: number;
    keyRisks: string[];
    mitigationPlan: string[];
  };
}

export interface RiskMitigation {
  id: string;
  riskId: string;
  action: string;
  owner: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED';
  dueDate: Date;
  progressPercentage: number;
  notes?: string;
}

export interface RiskRegister {
  id: string;
  generatedAt: Date;
  scope?: {
    projectId?: string;
    architectureId?: string;
  };
  risks: RiskItem[];
  mitigations: RiskMitigation[];
  summary: {
    openRisks: number;
    mitigatedRisks: number;
    acceptedRisks: number;
    highSeverityOpen: number;
    nextReviewDate: Date;
  };
  recommendations: string[];
}

export interface ReuseRateMetrics {
  overallRate: number; // percentage
  byType: {
    components: number;
    patterns: number;
    services: number;
    dataModels: number;
  };
  topReused: Array<{
    id: string;
    name: string;
    reuseCount: number;
    type: string;
  }>;
  trends: Array<{
    date: Date;
    rate: number;
  }>;
}

export interface IntegrationMetrics {
  totalIntegrations: number;
  byType: {
    api: number;
    messageQueue: number;
    database: number;
    file: number;
    webhook: number;
  };
  byStatus: {
    active: number;
    inactive: number;
    deprecated: number;
  };
  integrationHealth: {
    healthy: number;
    warning: number;
    critical: number;
  };
  trends: Array<{
    date: Date;
    count: number;
  }>;
}

export interface SLAComplianceMetrics {
  overallCompliance: number; // percentage
  bySLA: Array<{
    slaId: string;
    slaName: string;
    target: number; // percentage or value
    actual: number;
    compliance: number; // percentage
    status: 'MET' | 'WARNING' | 'BREACHED';
  }>;
  bySystem: Array<{
    systemId: string;
    systemName: string;
    compliance: number;
    breaches: number;
  }>;
  trends: Array<{
    date: Date;
    compliance: number;
  }>;
}

