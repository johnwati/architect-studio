export type ReviewSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface SmartReviewSectionInput {
  sectionId: string;
  sectionTitle: string;
  content: string;
}

export interface SmartReviewArtifactInput {
  id: string;
  fileName: string;
  fileType: string;
  fileContent: string;
  artifactType: string;
}

export interface SmartReviewRequest {
  projectContext?: {
    name?: string;
    description?: string;
  };
  sections: SmartReviewSectionInput[];
  artifacts?: SmartReviewArtifactInput[];
  focusAreas?: Array<'COMPLIANCE' | 'SECURITY' | 'PERFORMANCE' | 'COST' | 'ANTI_PATTERN'>;
}

export interface SmartReviewSummary {
  overallScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  maturityLevel: 'FOUNDATIONAL' | 'EMERGING' | 'DEFINED' | 'OPTIMIZED';
  keyFindings: string[];
  immediateActions: string[];
  strengths: string[];
}

export interface ComplianceFinding {
  standard: string;
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  pillar?: string;
  evidence: string;
  gaps?: string[];
  recommendations: string[];
}

export interface ReviewIssue {
  id: string;
  title: string;
  severity: ReviewSeverity;
  category: string;
  description: string;
  indicators?: string[];
  impactedComponents?: string[];
  recommendations: string[];
  estimatedImpact?: string;
}

export interface CostOptimizationInsight {
  area: string;
  opportunity: string;
  estimatedSavings?: string;
  effortLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}

export interface AntiPatternFinding {
  name: string;
  severity: ReviewSeverity;
  description: string;
  indicators: string[];
  technicalDebtImpact?: string;
  remediation: string[];
}

export interface SmartReviewResult {
  summary: SmartReviewSummary;
  compliance: {
    summary: string;
    coverage: number;
    findings: ComplianceFinding[];
    recommendedActions: string[];
  };
  security: {
    summary: string;
    vulnerabilities: ReviewIssue[];
    defensiveGaps: string[];
  };
  performance: {
    summary: string;
    risks: ReviewIssue[];
    optimizationIdeas: string[];
  };
  cost: {
    summary: string;
    opportunities: CostOptimizationInsight[];
    totalPotentialSavings?: string;
  };
  antiPatterns: {
    summary: string;
    patterns: AntiPatternFinding[];
    remediationThemes: string[];
  };
  metadata: {
    generatedAt: string;
    model: string;
    promptTokens?: number;
    completionTokens?: number;
  };
  rawResponse?: string;
}
