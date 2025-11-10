import {
    Activity,
    AlertTriangle,
    BarChart3,
    ChevronRight,
    ClipboardList,
    Cloud,
    DollarSign,
    Download,
    Layers,
    Network,
    PieChart,
    RefreshCw,
    ServerCog,
    Shield,
    ShieldCheck,
    Target,
    TrendingUp
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ArchitectureKPIs,
    CloudCostEstimate,
    CloudPricingRequest,
    ComplianceReport,
    CostEstimation,
    DependencyAnalysis,
    GapAnalysis,
    PerformanceModel,
    PortfolioDashboard,
    RiskRegister,
    RiskScoring,
    StackRecommendation,
    TechnologyRequirement,
    WorkloadProfile
} from '../../domain/entities/Analysis';
import { ArchitectureElement, ArchitectureRelationship } from '../../domain/entities/Architecture';
import { ProjectEntity } from '../../domain/entities/Project';
import { AnalysisService } from '../../domain/services/analysisService';
import { CloudPricingAdapter } from '../../infrastructure/services/CloudPricingAdapter';

interface AnalysisReportingProps {
  project: ProjectEntity | null;
}

const AnalysisReporting: React.FC<AnalysisReportingProps> = ({ project }) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'dependency' | 'gap' | 'risk' | 'cost' | 'kpis' | 'cloud' | 'capacity' | 'compliance' | 'stack' | 'riskRegister'>('portfolio');
  const [loading, setLoading] = useState(false);
  const [dependencyAnalysis, setDependencyAnalysis] = useState<DependencyAnalysis | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [portfolioDashboard, setPortfolioDashboard] = useState<PortfolioDashboard | null>(null);
  const [riskScoring, setRiskScoring] = useState<RiskScoring | null>(null);
  const [costEstimation, setCostEstimation] = useState<CostEstimation | null>(null);
  const [architectureKPIs, setArchitectureKPIs] = useState<ArchitectureKPIs | null>(null);
  const [cloudCostEstimate, setCloudCostEstimate] = useState<CloudCostEstimate | null>(null);
  const [performanceModel, setPerformanceModel] = useState<PerformanceModel | null>(null);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [stackRecommendation, setStackRecommendation] = useState<StackRecommendation | null>(null);
  const [riskRegister, setRiskRegister] = useState<RiskRegister | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);

  const analysisService = useMemo(() => new AnalysisService(new CloudPricingAdapter()), []);

  // Mock data - in real app, this would come from the database
  const mockElements: ArchitectureElement[] = useMemo(() => [
    {
      id: 'sys1',
      layer: 'APPLICATION',
      name: 'Core Banking System',
      description: 'Main banking application',
      type: 'System',
      metadata: { risk: 'MEDIUM', cost: 500000, lifecycleStage: 'PRODUCTION' },
      relationships: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      tags: ['reusable'],
      state: 'AS_IS'
    },
    {
      id: 'sys2',
      layer: 'APPLICATION',
      name: 'Mobile Banking App',
      description: 'Mobile application',
      type: 'System',
      metadata: { risk: 'LOW', cost: 300000, lifecycleStage: 'PRODUCTION' },
      relationships: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '2.0',
      tags: [],
      state: 'AS_IS'
    }
  ], []);

  const mockRelationships: ArchitectureRelationship[] = useMemo(() => [
    {
      id: 'rel1',
      sourceId: 'sys2',
      targetId: 'sys1',
      type: 'DEPENDS_ON',
      description: 'Mobile app depends on core banking'
    }
  ], []);

  useEffect(() => {
    if (project) {
      loadAnalyses();
    }
  }, [project]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      // Generate portfolio dashboard
      const portfolio = analysisService.generatePortfolioDashboard(mockElements, mockRelationships);
      setPortfolioDashboard(portfolio);

      // Generate risk scoring
      const risk = analysisService.calculateRiskScoring(mockElements, mockRelationships);
      setRiskScoring(risk);

      // Build risk register for mitigation tracking
      const register = analysisService.buildRiskRegister(risk.risks);
      setRiskRegister(register);

      // Generate cost estimation (traditional)
      const cost = analysisService.estimateCosts(mockElements, mockRelationships);
      setCostEstimation(cost);

      // Cloud cost estimation using pricing adapter
      const cloudRequest: CloudPricingRequest = {
        discountRate: 8,
        usage: [
          {
            id: 'core-banking-compute',
            provider: 'AWS',
            region: 'us-east-1',
            service: 'EC2',
            resource: 't3.medium',
            unit: 'HOURS',
            quantity: 730,
            description: 'Core banking compute capacity',
            assumptions: ['Always-on workload', 'General purpose instances']
          },
          {
            id: 'mobile-storage',
            provider: 'AWS',
            region: 'us-east-1',
            service: 'S3',
            resource: 'Standard Storage',
            unit: 'GB-MONTH',
            quantity: 2500,
            description: 'Mobile channel object storage',
            assumptions: ['Standard tier, lifecycle policies applied']
          },
          {
            id: 'analytics-warehouse',
            provider: 'GCP',
            region: 'us-central1',
            service: 'BigQuery',
            resource: 'Data Warehouse',
            unit: 'TB-MONTH',
            quantity: 4,
            description: 'Enterprise analytics data warehouse',
            assumptions: ['Shared workload, enterprise support']
          }
        ]
      };
      const cloudEstimate = await analysisService.estimateCloudCosts(cloudRequest, mockElements);
      setCloudCostEstimate(cloudEstimate);

      // Performance and capacity modelling
      const workload: WorkloadProfile = {
        id: 'retail-banking-workload',
        name: 'Retail Banking Daily Load',
        description: 'Transactions, API traffic, and nightly batch workloads',
        peakTransactionsPerSecond: 1800,
        averageTransactionsPerSecond: 650,
        concurrency: 1200,
        payloadSizeKb: 384,
        growthRateMonthly: 6,
        availabilityTarget: 99.5,
        latencyTargetMs: 180
      };
      const performance = analysisService.modelPerformance(workload, mockElements, mockRelationships);
      setPerformanceModel(performance);

      // Compliance evaluation across frameworks
      const compliance = analysisService.evaluateCompliance(['SOC2', 'HIPAA', 'GDPR'], {
        'soc2-cc1': {
          status: 'COMPLIANT',
          evidence: ['Access reviews completed Q3'],
          remediationActions: []
        },
        'hipaa-164-312': {
          status: 'PARTIAL',
          evidence: ['Session timeout policy set to 15 minutes'],
          remediationActions: ['Extend MFA coverage to shared terminals'],
          owner: 'Security Operations'
        },
        'gdpr-30': {
          status: 'PARTIAL',
          evidence: ['Data inventory maintained in Collibra'],
          remediationActions: ['Automate quarterly data processing reviews'],
          owner: 'Data Governance'
        }
      });
      setComplianceReports(compliance);

      // Technology stack recommendations
      const requirements: TechnologyRequirement[] = [
        {
          id: 'req-frontend',
          category: 'FRONTEND',
          description: 'Modern web experience with reusable component model',
          priority: 'MUST_HAVE',
          weight: 5
        },
        {
          id: 'req-backend',
          category: 'BACKEND',
          description: 'Cloud-native APIs with enterprise security integrations',
          priority: 'MUST_HAVE',
          weight: 5
        },
        {
          id: 'req-data',
          category: 'DATA',
          description: 'Elastic analytical store supporting governed data sharing',
          priority: 'SHOULD_HAVE',
          weight: 4
        },
        {
          id: 'req-devops',
          category: 'DEVOPS',
          description: 'Infrastructure-as-code with policy enforcement',
          priority: 'SHOULD_HAVE',
          weight: 3
        },
        {
          id: 'req-security',
          category: 'SECURITY',
          description: 'Embedded application security controls aligned to OWASP ASVS',
          priority: 'MUST_HAVE',
          weight: 4
        }
      ];
      const stack = analysisService.recommendTechnologyStack(requirements, ['React', 'PostgreSQL']);
      setStackRecommendation(stack);

      // Generate KPIs
      const kpis = analysisService.calculateKPIs(mockElements, mockRelationships);
      setArchitectureKPIs(kpis);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDependencyAnalysis = (systemId: string) => {
    try {
      const analysis = analysisService.analyzeDependencies(systemId, mockElements, mockRelationships);
      setDependencyAnalysis(analysis);
      setActiveTab('dependency');
    } catch (error) {
      console.error('Error analyzing dependencies:', error);
    }
  };

  const handleGapAnalysis = () => {
    try {
      const asIsElements = mockElements.filter(e => e.state === 'AS_IS');
      const toBeElements = mockElements.filter(e => e.state === 'TO_BE');
      const gap = analysisService.analyzeGaps(asIsElements, toBeElements, mockRelationships, mockRelationships);
      setGapAnalysis(gap);
      setActiveTab('gap');
    } catch (error) {
      console.error('Error analyzing gaps:', error);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !portfolioDashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto text-purple-500 mb-4" size={32} />
          <p className="text-gray-600">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <BarChart3 className="text-purple-600" size={28} />
              <span>Analysis & Reporting</span>
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive architecture analysis and insights</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadAnalyses}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'portfolio', label: 'Portfolio Dashboard', icon: PieChart },
            { id: 'dependency', label: 'Dependency Analysis', icon: Network },
            { id: 'gap', label: 'Gap Analysis', icon: Target },
            { id: 'risk', label: 'Risk Scoring', icon: AlertTriangle },
            { id: 'cost', label: 'Cost Estimation', icon: DollarSign },
            { id: 'cloud', label: 'Cloud Costs', icon: Cloud },
            { id: 'capacity', label: 'Capacity Planning', icon: ServerCog },
            { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
            { id: 'stack', label: 'Stack Recommendations', icon: Layers },
            { id: 'riskRegister', label: 'Risk Register', icon: ClipboardList },
            { id: 'kpis', label: 'Architecture KPIs', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'portfolio' && portfolioDashboard && (
            <PortfolioDashboardView dashboard={portfolioDashboard} getHealthColor={getHealthColor} getHealthBgColor={getHealthBgColor} />
          )}

          {activeTab === 'dependency' && (
            <DependencyAnalysisView
              analysis={dependencyAnalysis}
              elements={mockElements}
              onAnalyze={handleDependencyAnalysis}
              selectedSystemId={selectedSystemId}
              setSelectedSystemId={setSelectedSystemId}
            />
          )}

          {activeTab === 'gap' && (
            <GapAnalysisView
              analysis={gapAnalysis}
              onAnalyze={handleGapAnalysis}
            />
          )}

          {activeTab === 'risk' && riskScoring && (
            <RiskScoringView riskScoring={riskScoring} getRiskColor={getRiskColor} />
          )}

          {activeTab === 'cost' && costEstimation && (
            <CostEstimationView costEstimation={costEstimation} />
          )}

          {activeTab === 'cloud' && cloudCostEstimate && (
            <CloudCostView cloudCostEstimate={cloudCostEstimate} />
          )}

          {activeTab === 'capacity' && performanceModel && (
            <PerformanceModelView performanceModel={performanceModel} />
          )}

          {activeTab === 'compliance' && complianceReports.length > 0 && (
            <ComplianceView reports={complianceReports} />
          )}

          {activeTab === 'stack' && stackRecommendation && (
            <StackRecommendationView recommendation={stackRecommendation} />
          )}

          {activeTab === 'riskRegister' && riskRegister && (
            <RiskRegisterView riskRegister={riskRegister} />
          )}

          {activeTab === 'kpis' && architectureKPIs && (
            <KPIsView kpis={architectureKPIs} />
          )}
        </div>
      </div>
    </div>
  );
};

// Portfolio Dashboard View
const PortfolioDashboardView: React.FC<{
  dashboard: PortfolioDashboard;
  getHealthColor: (score: number) => string;
  getHealthBgColor: (score: number) => string;
}> = ({ dashboard, getHealthColor, getHealthBgColor }) => {
  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-green-800">Overall Health</span>
            <Shield className="text-green-600" size={24} />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-bold ${getHealthColor(dashboard.health.overallScore)}`}>
              {dashboard.health.overallScore.toFixed(0)}
            </span>
            <span className="text-sm text-gray-600">/ 100</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getHealthBgColor(dashboard.health.overallScore)}`}
                style={{ width: `${dashboard.health.overallScore}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">Status: {dashboard.health.status}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-800">Maturity Level</span>
            <TrendingUp className="text-blue-600" size={24} />
          </div>
          <div className="text-2xl font-bold text-blue-700">{dashboard.maturity.overallLevel}</div>
          <p className="text-xs text-gray-600 mt-2">Score: {dashboard.maturity.levelScore.toFixed(0)}/100</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-orange-800">Technical Debt</span>
            <AlertTriangle className="text-orange-600" size={24} />
          </div>
          <div className="text-2xl font-bold text-orange-700">
            {dashboard.technicalDebt.totalDebt.toFixed(0)}
          </div>
          <p className="text-xs text-gray-600 mt-2">person-days</p>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(dashboard.health.metrics).map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 capitalize mb-1">{key}</div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-purple-600 h-1.5 rounded-full"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Systems by Health */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Systems by Health Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{dashboard.health.systemsByHealth.healthy}</div>
            <div className="text-sm text-gray-600">Healthy</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{dashboard.health.systemsByHealth.warning}</div>
            <div className="text-sm text-gray-600">Warning</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{dashboard.health.systemsByHealth.critical}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Systems</div>
            <div className="text-2xl font-bold text-gray-800">{dashboard.summary.totalSystems}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Integrations</div>
            <div className="text-2xl font-bold text-gray-800">{dashboard.summary.totalIntegrations}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Data Entities</div>
            <div className="text-2xl font-bold text-gray-800">{dashboard.summary.totalDataEntities}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Technologies</div>
            <div className="text-2xl font-bold text-gray-800">{dashboard.summary.totalTechnologies}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dependency Analysis View
const DependencyAnalysisView: React.FC<{
  analysis: DependencyAnalysis | null;
  elements: ArchitectureElement[];
  onAnalyze: (systemId: string) => void;
  selectedSystemId: string | null;
  setSelectedSystemId: (system: string | null) => void;
}> = ({ analysis, elements, onAnalyze, selectedSystemId, setSelectedSystemId }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select System for Analysis</h3>
        <div className="space-y-2">
          {elements.map(element => (
            <button
              key={element.id}
              onClick={() => {
                setSelectedSystemId(element.id);
                onAnalyze(element.id);
              }}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedSystemId === element.id
                  ? 'bg-purple-50 border-purple-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{element.name}</div>
                  <div className="text-sm text-gray-600">{element.type} - {element.layer}</div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* Impact Score */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Impact Analysis</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                analysis.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                analysis.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                analysis.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {analysis.riskLevel}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-800">{analysis.impactScore.toFixed(0)}</span>
              <span className="text-gray-600">/ 100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div
                className="bg-purple-600 h-3 rounded-full"
                style={{ width: `${analysis.impactScore}%` }}
              />
            </div>
          </div>

          {/* Direct Dependencies */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Direct Dependencies ({analysis.directDependencies.length})
            </h3>
            <div className="space-y-3">
              {analysis.directDependencies.map((dep, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">{dep.systemName}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      dep.impactType === 'BREAKING' ? 'bg-red-100 text-red-700' :
                      dep.impactType === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {dep.impactType}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{dep.description}</div>
                  <div className="text-xs text-gray-500">Type: {dep.relationshipType}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Systems */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Affected Systems ({analysis.affectedSystems.length})
            </h3>
            <div className="space-y-3">
              {analysis.affectedSystems.map((system, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">{system.systemName}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      system.impactSeverity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      system.impactSeverity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      system.impactSeverity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {system.impactSeverity}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Layer: {system.layer}</div>
                  {system.estimatedDowntime && (
                    <div className="text-sm text-gray-600">Estimated Downtime: {system.estimatedDowntime} hours</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <ChevronRight className="text-purple-600 mt-1 flex-shrink-0" size={16} />
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Gap Analysis View
const GapAnalysisView: React.FC<{
  analysis: GapAnalysis | null;
  onAnalyze: () => void;
}> = ({ analysis, onAnalyze }) => {
  if (!analysis) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600 mb-4">No gap analysis available</p>
        <button
          onClick={onAnalyze}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Perform Gap Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Total Gaps</div>
          <div className="text-2xl font-bold text-gray-800">{analysis.summary.totalGaps}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-700">Critical</div>
          <div className="text-2xl font-bold text-red-700">{analysis.summary.criticalGaps}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-sm text-orange-700">High</div>
          <div className="text-2xl font-bold text-orange-700">{analysis.summary.highGaps}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-sm text-yellow-700">Medium</div>
          <div className="text-2xl font-bold text-yellow-700">{analysis.summary.mediumGaps}</div>
        </div>
      </div>

      {/* Gaps List */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Identified Gaps</h3>
        <div className="space-y-3">
          {analysis.gaps.map(gap => (
            <div key={gap.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{gap.description}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  gap.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  gap.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                  gap.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {gap.severity}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">Category: {gap.category.replace('_', ' ')}</div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Effort: {gap.estimatedEffort} days</span>
                <span>Priority: {gap.priority}/10</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Risk Scoring View
const RiskScoringView: React.FC<{
  riskScoring: RiskScoring;
  getRiskColor: (level: string) => string;
}> = ({ riskScoring, getRiskColor }) => {
  return (
    <div className="space-y-6">
      {/* Overall Risk */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Overall Risk Score</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(riskScoring.riskLevel)}`}>
            {riskScoring.riskLevel}
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold text-gray-800">{riskScoring.overallRiskScore.toFixed(1)}</span>
          <span className="text-gray-600">/ 100</span>
        </div>
      </div>

      {/* Risks List */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Identified Risks ({riskScoring.risks.length})</h3>
        <div className="space-y-3">
          {riskScoring.risks.map(risk => (
            <div key={risk.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{risk.title}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(riskScoring.riskLevel)}`}>
                  Score: {risk.riskScore.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{risk.description}</div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Category: {risk.category}</span>
                <span>Probability: {risk.probability}%</span>
                <span>Impact: {risk.impact}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Cost Estimation View
const CostEstimationView: React.FC<{
  costEstimation: CostEstimation;
}> = ({ costEstimation }) => {
  return (
    <div className="space-y-6">
      {/* Total Cost */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Total Estimated Cost</h3>
          <DollarSign className="text-green-600" size={24} />
        </div>
        <div className="text-4xl font-bold text-gray-800">
          ${(costEstimation.totalCost / 1000).toFixed(0)}K
        </div>
        <p className="text-sm text-gray-600 mt-2">Confidence: {costEstimation.confidence}</p>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">Infrastructure</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Cloud</span>
              <span className="font-semibold">${(costEstimation.costBreakdown.infrastructure.cloud / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">On-Premise</span>
              <span className="font-semibold">${(costEstimation.costBreakdown.infrastructure.onPremise / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-bold">${(costEstimation.costBreakdown.infrastructure.total / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">Software</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Licenses</span>
              <span className="font-semibold">${(costEstimation.costBreakdown.software.licenses / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Development</span>
              <span className="font-semibold">${(costEstimation.costBreakdown.software.customDevelopment / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-bold">${(costEstimation.costBreakdown.software.total / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cloud Cost View
const CloudCostView: React.FC<{
  cloudCostEstimate: CloudCostEstimate;
}> = ({ cloudCostEstimate }) => {
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-800">Monthly Cloud Spend</span>
            <Cloud className="text-blue-600" size={22} />
          </div>
          <div className="text-3xl font-bold text-blue-700">{currency.format(cloudCostEstimate.totals.monthly)}</div>
          <p className="text-xs text-blue-700 mt-2">Data Source: {cloudCostEstimate.dataSource}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <span className="text-sm font-semibold text-green-800">Annualized</span>
          <div className="text-3xl font-bold text-green-700 mt-2">{currency.format(cloudCostEstimate.totals.annual)}</div>
          <p className="text-xs text-green-700 mt-2">Includes applied enterprise discounts</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <span className="text-sm font-semibold text-yellow-800">Discount Impact</span>
          <div className="text-3xl font-bold text-yellow-700 mt-2">{currency.format(cloudCostEstimate.totals.discounts)}</div>
          <p className="text-xs text-yellow-700 mt-2">Savings vs. list price</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Provider</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Cost</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Monthly Cost</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {cloudCostEstimate.services.map(service => {
                const listMonthly = service.pricePoint.pricePerUnit * service.usage.quantity;
                const discount = Math.max(0, listMonthly - service.monthlyCost);
                return (
                  <tr key={service.usage.id}>
                    <td className="px-4 py-2">
                      <div className="font-semibold text-gray-800">{service.usage.description || service.pricePoint.description}</div>
                      <div className="text-xs text-gray-500">{service.pricePoint.service}</div>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{service.pricePoint.provider}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{currency.format(service.pricePoint.pricePerUnit)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{service.usage.quantity.toLocaleString()} {service.usage.unit}</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-800">{currency.format(service.monthlyCost)}</td>
                    <td className="px-4 py-2 text-right text-green-600">{currency.format(discount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {cloudCostEstimate.assumptions.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assumptions</h3>
          <ul className="space-y-2 list-disc list-inside text-gray-700">
            {cloudCostEstimate.assumptions.map((assumption, idx) => (
              <li key={idx}>{assumption}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Performance & Capacity View
const PerformanceModelView: React.FC<{
  performanceModel: PerformanceModel;
}> = ({ performanceModel }) => {
  const { capacityPlan, workload } = performanceModel;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <span className="text-sm font-semibold text-purple-800">Peak TPS Capacity</span>
          <div className="text-3xl font-bold text-purple-700 mt-2">{capacityPlan.requiredCapacityPeak}</div>
          <p className="text-xs text-purple-700 mt-2">Required capacity units at peak demand</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <span className="text-sm font-semibold text-blue-800">12-Month Requirement</span>
          <div className="text-3xl font-bold text-blue-700 mt-2">{capacityPlan.requiredCapacityIn12Months}</div>
          <p className="text-xs text-blue-700 mt-2">Capacity units incl. projected growth</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <span className="text-sm font-semibold text-green-800">Monthly Cost Projection</span>
          <div className="text-3xl font-bold text-green-700 mt-2">${capacityPlan.estimatedMonthlyCost.toLocaleString()}</div>
          <p className="text-xs text-green-700 mt-2">Based on recommended scaling strategy</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <span className="text-sm font-semibold text-yellow-800">Upgrade Timeline</span>
          <div className="text-3xl font-bold text-yellow-700 mt-2">{capacityPlan.estimatedUpgradeTimelineWeeks} weeks</div>
          <p className="text-xs text-yellow-700 mt-2">Estimated lead time for uplift</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Workload Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
          <div>
            <span className="block text-sm text-gray-500">Peak TPS</span>
            <span className="text-xl font-semibold">{workload.peakTransactionsPerSecond.toLocaleString()}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Average TPS</span>
            <span className="text-xl font-semibold">{workload.averageTransactionsPerSecond.toLocaleString()}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Concurrency</span>
            <span className="text-xl font-semibold">{workload.concurrency.toLocaleString()}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Payload Size</span>
            <span className="text-xl font-semibold">{workload.payloadSizeKb} KB</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Growth Rate</span>
            <span className="text-xl font-semibold">{workload.growthRateMonthly}% / month</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Availability Target</span>
            <span className="text-xl font-semibold">{workload.availabilityTarget}%</span>
          </div>
        </div>
      </div>

      {performanceModel.bottlenecks.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Identified Bottlenecks</h3>
          <div className="space-y-4">
            {performanceModel.bottlenecks.map(bottleneck => (
              <div key={bottleneck.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-800">{bottleneck.description}</div>
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    bottleneck.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                    bottleneck.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                    bottleneck.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {bottleneck.riskLevel}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">Layer: {bottleneck.layer} · Metric: {bottleneck.metric} · Utilization: {bottleneck.currentUtilization}%</div>
                <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                  {bottleneck.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {performanceModel.recommendations.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Capacity Recommendations</h3>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            {performanceModel.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Compliance View
const ComplianceView: React.FC<{
  reports: ComplianceReport[];
}> = ({ reports }) => {
  return (
    <div className="space-y-6">
      {reports.map(report => (
        <div key={report.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{report.framework.name}</h3>
                <p className="text-sm text-gray-600">{report.framework.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">{report.summary.complianceScore}%</div>
                <div className="text-xs text-gray-500">Compliance Score</div>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
            <div>
              <span className="block text-gray-500">Compliant</span>
              <span className="text-lg font-semibold text-green-600">{report.summary.compliant}</span>
            </div>
            <div>
              <span className="block text-gray-500">Partial</span>
              <span className="text-lg font-semibold text-yellow-600">{report.summary.partial}</span>
            </div>
            <div>
              <span className="block text-gray-500">Non-Compliant</span>
              <span className="text-lg font-semibold text-red-600">{report.summary.nonCompliant}</span>
            </div>
            <div>
              <span className="block text-gray-500">Not Applicable</span>
              <span className="text-lg font-semibold text-gray-700">{report.summary.notApplicable}</span>
            </div>
          </div>

          {report.highRiskControls.length > 0 && (
            <div className="px-6 pb-6">
              <h4 className="text-sm font-semibold text-red-600 mb-2">High Priority Controls</h4>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                {report.highRiskControls.map((control, idx) => (
                  <li key={idx}>{control}</li>
                ))}
              </ul>
            </div>
          )}

          {report.recommendations.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Recommendations</h4>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                {report.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Stack Recommendation View
const StackRecommendationView: React.FC<{
  recommendation: StackRecommendation;
}> = ({ recommendation }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <span className="text-sm text-gray-500">Overall Fit</span>
          <div className="text-3xl font-bold text-purple-600 mt-2">{recommendation.summary.overallFit}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <span className="text-sm text-gray-500">Ramp-up Effort</span>
          <div className="text-3xl font-bold text-gray-800 mt-2">{recommendation.summary.estimatedRampUpEffortWeeks} weeks</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <span className="text-sm text-gray-500">Key Risks</span>
          <div className="text-lg font-semibold text-red-600 mt-2">{recommendation.summary.keyRisks.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommended Stack</h3>
        <div className="space-y-3">
          {recommendation.recommendedStack.map(option => (
            <div key={option.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{option.name}</div>
                  <div className="text-sm text-gray-600">{option.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-purple-600">{option.score}</div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
              </div>
              <div className="text-sm text-gray-700 mt-2">{option.description}</div>
              {option.gapAnalysis.length > 0 && (
                <ul className="text-xs text-gray-600 mt-2 list-disc list-inside space-y-1">
                  {option.gapAnalysis.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Alternative Options</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Technology</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recommendation.options.map(option => (
                <tr key={option.id}>
                  <td className="px-4 py-2 text-gray-800">{option.name}</td>
                  <td className="px-4 py-2 text-gray-600">{option.category}</td>
                  <td className="px-4 py-2 text-right text-gray-800 font-semibold">{option.score}</td>
                  <td className="px-4 py-2 text-gray-600">{option.fit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recommendation.summary.mitigationPlan.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Mitigation Plan</h3>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            {recommendation.summary.mitigationPlan.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Risk Register View
const RiskRegisterView: React.FC<{
  riskRegister: RiskRegister;
}> = ({ riskRegister }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <span className="block text-sm text-gray-500">Open Risks</span>
          <span className="text-2xl font-bold text-red-600">{riskRegister.summary.openRisks}</span>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <span className="block text-sm text-gray-500">Mitigated</span>
          <span className="text-2xl font-bold text-green-600">{riskRegister.summary.mitigatedRisks}</span>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <span className="block text-sm text-gray-500">Accepted</span>
          <span className="text-2xl font-bold text-yellow-600">{riskRegister.summary.acceptedRisks}</span>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <span className="block text-sm text-gray-500">Next Review</span>
          <span className="text-2xl font-bold text-gray-800">{riskRegister.summary.nextReviewDate.toLocaleDateString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Active Risks</h3>
        <div className="space-y-3">
          {riskRegister.risks.map(risk => (
            <div key={risk.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{risk.title}</div>
                  <div className="text-xs text-gray-500">Category: {risk.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-600">{risk.riskScore.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Probability {risk.probability}% · Impact {risk.impact}%</div>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2">{risk.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Mitigation Actions</h3>
        <div className="space-y-3">
          {riskRegister.mitigations.map(mitigation => (
            <div key={mitigation.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{mitigation.action}</div>
                  <div className="text-xs text-gray-500">Owner: {mitigation.owner}</div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  Due {mitigation.dueDate.toLocaleDateString()} · {mitigation.progressPercentage}%
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-purple-600"
                    style={{ width: `${mitigation.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {riskRegister.recommendations.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h3>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            {riskRegister.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// KPIs View
const KPIsView: React.FC<{
  kpis: ArchitectureKPIs;
}> = ({ kpis }) => {
  return (
    <div className="space-y-6">
      {/* Reuse Rate */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Reuse Rate</h3>
        <div className="flex items-baseline space-x-2 mb-4">
          <span className="text-4xl font-bold text-purple-600">{kpis.reuseRate.overallRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-purple-600 h-3 rounded-full"
            style={{ width: `${kpis.reuseRate.overallRate}%` }}
          />
        </div>
      </div>

      {/* Integration Count */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Integration Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-800">{kpis.integrationCount.totalIntegrations}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">{kpis.integrationCount.byStatus.active}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Inactive</div>
            <div className="text-2xl font-bold text-yellow-600">{kpis.integrationCount.byStatus.inactive}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Deprecated</div>
            <div className="text-2xl font-bold text-red-600">{kpis.integrationCount.byStatus.deprecated}</div>
          </div>
        </div>
      </div>

      {/* SLA Compliance */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">SLA Compliance</h3>
        <div className="flex items-baseline space-x-2 mb-4">
          <span className="text-4xl font-bold text-green-600">{kpis.slaCompliance.overallCompliance.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full"
            style={{ width: `${kpis.slaCompliance.overallCompliance}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisReporting;

