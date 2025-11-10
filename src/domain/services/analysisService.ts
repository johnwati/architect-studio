// Analysis & Reporting Service
import {
    AffectedSystem,
    ArchitectureGap,
    ArchitectureKPIs,
    CapacityPlan,
    CloudCostEstimate,
    CloudPricePoint,
    CloudPricingDataSource,
    CloudPricingRequest,
    CloudProvider,
    CloudServiceCost,
    CloudServiceUsage,
    ComplianceCheckResult,
    ComplianceControl,
    ComplianceFramework,
    ComplianceReport,
    CostBreakdown,
    CostEstimation,
    DependencyAnalysis,
    DependencyImpact,
    GapAnalysis,
    GapSummary,
    IntegrationMetrics,
    PerformanceBottleneck,
    PerformanceModel,
    PortfolioDashboard,
    PortfolioHealth,
    PortfolioMaturity,
    ReuseRateMetrics,
    RiskHeatmap,
    RiskItem,
    RiskMitigation,
    RiskRegister,
    RiskScoring,
    SLAComplianceMetrics,
    StackRecommendation,
    TechnicalDebt,
    TechnologyOption,
    TechnologyRequirement,
    WorkloadProfile
} from '../entities/Analysis';
import {
    ArchitectureElement,
    ArchitectureLayer,
    ArchitectureRelationship
} from '../entities/Architecture';
import { ICloudPricingAdapter } from '../ports/ICloudPricingAdapter';

export class AnalysisService {
  constructor(private cloudPricingAdapter?: ICloudPricingAdapter) {}

  setCloudPricingAdapter(adapter: ICloudPricingAdapter) {
    this.cloudPricingAdapter = adapter;
  }

  /**
   * Analyze dependencies and impact of changing a system
   */
  analyzeDependencies(
    systemId: string,
    elements: ArchitectureElement[],
    relationships: ArchitectureRelationship[]
  ): DependencyAnalysis {
    const system = elements.find(e => e.id === systemId);
    if (!system) {
      throw new Error(`System ${systemId} not found`);
    }

    // Find direct dependencies
    const directDeps = relationships
      .filter(r => r.sourceId === systemId)
      .map(r => {
        const target = elements.find(e => e.id === r.targetId);
        return {
          systemId: r.targetId,
          systemName: target?.name || 'Unknown',
          relationshipType: r.type,
          impactType: this.calculateImpactType(r.type, target?.metadata.risk),
          description: r.description || `Dependency on ${target?.name}`,
          mitigation: this.getMitigationStrategies(r.type)
        } as DependencyImpact;
      });

    // Find transitive dependencies (dependencies of dependencies)
    const transitiveDeps = this.findTransitiveDependencies(systemId, relationships, elements);

    // Find affected systems
    const affectedSystems = this.findAffectedSystems(systemId, relationships, elements);

    // Calculate impact score
    const impactScore = this.calculateImpactScore(directDeps, transitiveDeps, affectedSystems);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(impactScore, affectedSystems);

    // Generate recommendations
    const recommendations = this.generateDependencyRecommendations(
      directDeps,
      transitiveDeps,
      affectedSystems,
      riskLevel
    );

    return {
      id: `dep-${systemId}-${Date.now()}`,
      projectId: '',
      systemId,
      systemName: system.name,
      analysisDate: new Date(),
      directDependencies: directDeps,
      transitiveDependencies: transitiveDeps,
      affectedSystems,
      impactScore,
      riskLevel,
      recommendations
    };
  }

  /**
   * Perform gap analysis between As-Is and To-Be architectures
   */
  analyzeGaps(
    asIsElements: ArchitectureElement[],
    toBeElements: ArchitectureElement[],
    asIsRelationships: ArchitectureRelationship[],
    toBeRelationships: ArchitectureRelationship[]
  ): GapAnalysis {
    const gaps: ArchitectureGap[] = [];

    // Find missing components
    const asIsIds = new Set(asIsElements.map(e => e.id));
    const toBeIds = new Set(toBeElements.map(e => e.id));
    
    toBeElements.forEach(toBeElement => {
      if (!asIsIds.has(toBeElement.id)) {
        gaps.push({
          id: `gap-${toBeElement.id}`,
          category: this.determineGapCategory(toBeElement),
          description: `Missing ${toBeElement.type}: ${toBeElement.name}`,
          severity: this.calculateGapSeverity(toBeElement),
          affectedLayers: [toBeElement.layer],
          estimatedEffort: this.estimateEffort(toBeElement),
          priority: this.calculatePriority(toBeElement),
          dependencies: []
        });
      }
    });

    // Find missing integrations
    const asIsIntegrationIds = new Set(
      asIsRelationships
        .filter(r => r.type === 'INTEGRATES_WITH' || r.type === 'DEPENDS_ON')
        .map(r => `${r.sourceId}-${r.targetId}`)
    );

    toBeRelationships
      .filter(r => r.type === 'INTEGRATES_WITH' || r.type === 'DEPENDS_ON')
      .forEach(rel => {
        const relKey = `${rel.sourceId}-${rel.targetId}`;
        if (!asIsIntegrationIds.has(relKey)) {
          const source = toBeElements.find(e => e.id === rel.sourceId);
          const target = toBeElements.find(e => e.id === rel.targetId);
          gaps.push({
            id: `gap-int-${rel.id}`,
            category: 'MISSING_INTEGRATION',
            description: `Missing integration: ${source?.name} → ${target?.name}`,
            severity: 'MEDIUM',
            affectedLayers: source ? [source.layer] : [],
            estimatedEffort: 5, // days
            priority: 7,
            dependencies: []
          });
        }
      });

    // Calculate summary
    const summary = this.calculateGapSummary(gaps);

    // Generate recommendations
    const recommendations = gaps.map(gap => ({
      gapId: gap.id,
      recommendation: this.generateGapRecommendation(gap),
      priority: gap.priority,
      estimatedEffort: gap.estimatedEffort,
      dependencies: gap.dependencies
    }));

    return {
      id: `gap-${Date.now()}`,
      projectId: '',
      asIsArchitectureId: '',
      toBeArchitectureId: '',
      analysisDate: new Date(),
      gaps,
      summary,
      recommendations
    };
  }

  /**
   * Generate portfolio dashboard with health, maturity, and technical debt
   */
  generatePortfolioDashboard(
    elements: ArchitectureElement[],
    relationships: ArchitectureRelationship[]
  ): PortfolioDashboard {
    const health = this.calculatePortfolioHealth(elements);
    const maturity = this.calculatePortfolioMaturity(elements);
    const technicalDebt = this.calculateTechnicalDebt(elements);

    const summary = {
      totalSystems: elements.filter(e => e.layer === 'APPLICATION').length,
      totalIntegrations: relationships.filter(r => r.type === 'INTEGRATES_WITH').length,
      totalDataEntities: elements.filter(e => e.layer === 'DATA').length,
      totalTechnologies: elements.filter(e => e.layer === 'TECHNOLOGY').length,
      activeProjects: 0, // Would come from project data
      completedProjects: 0
    };

    return {
      id: `dashboard-${Date.now()}`,
      dashboardDate: new Date(),
      health,
      maturity,
      technicalDebt,
      summary
    };
  }

  /**
   * Calculate risk scoring and generate heatmap
   */
  calculateRiskScoring(
    elements: ArchitectureElement[],
    relationships: ArchitectureRelationship[]
  ): RiskScoring {
    const risks: RiskItem[] = [];

    // Analyze each element for risks
    elements.forEach(element => {
      // Technical risks
      if (element.metadata.risk === 'HIGH' || element.metadata.risk === 'CRITICAL') {
        risks.push({
          id: `risk-${element.id}`,
          category: 'TECHNICAL',
          title: `High Risk: ${element.name}`,
          description: `Element ${element.name} has ${element.metadata.risk} risk level`,
          probability: this.riskToProbability(element.metadata.risk),
          impact: this.riskToImpact(element.metadata.risk),
          riskScore: this.riskToProbability(element.metadata.risk) * this.riskToImpact(element.metadata.risk) / 100,
          mitigation: this.getRiskMitigation(element),
          status: 'OPEN'
        });
      }

      // Lifecycle risks
      if (element.metadata.lifecycleStage === 'DEPRECATED' || element.metadata.lifecycleStage === 'DECOMMISSIONED') {
        risks.push({
          id: `risk-lifecycle-${element.id}`,
          category: 'OPERATIONAL',
          title: `Deprecated System: ${element.name}`,
          description: `System ${element.name} is ${element.metadata.lifecycleStage}`,
          probability: 70,
          impact: 60,
          riskScore: 42,
          mitigation: ['Plan migration', 'Identify replacement', 'Document dependencies'],
          status: 'OPEN'
        });
      }
    });

    // Calculate overall risk score
    const overallRiskScore = risks.length > 0
      ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length
      : 0;

    const riskLevel = overallRiskScore >= 70 ? 'CRITICAL' :
                     overallRiskScore >= 50 ? 'HIGH' :
                     overallRiskScore >= 30 ? 'MEDIUM' : 'LOW';

    // Generate heatmap
    const heatmap = this.generateRiskHeatmap(risks);

    // Generate trends (simplified - would use historical data)
    const trends: RiskTrend[] = [
      {
        date: new Date(),
        riskScore: overallRiskScore,
        riskCount: risks.length,
        criticalRisks: risks.filter(r => r.riskScore >= 70).length
      }
    ];

    return {
      id: `risk-${Date.now()}`,
      analysisDate: new Date(),
      overallRiskScore,
      riskLevel,
      risks,
      heatmap,
      trends
    };
  }

  /**
   * Estimate costs based on architecture composition
   */
  estimateCosts(
    elements: ArchitectureElement[],
    relationships: ArchitectureRelationship[]
  ): CostEstimation {
    const breakdown: CostBreakdown = {
      infrastructure: {
        cloud: 0,
        onPremise: 0,
        hybrid: 0,
        total: 0
      },
      software: {
        licenses: 0,
        subscriptions: 0,
        customDevelopment: 0,
        total: 0
      },
      services: {
        consulting: 0,
        implementation: 0,
        support: 0,
        training: 0,
        total: 0
      },
      operations: {
        maintenance: 0,
        monitoring: 0,
        backup: 0,
        disasterRecovery: 0,
        total: 0
      },
      byLayer: {
        business: 0,
        application: 0,
        data: 0,
        technology: 0,
        solution: 0
      },
      bySystem: []
    };

    // Calculate costs per element
    elements.forEach(element => {
      const cost = element.metadata.cost || 0;
      
      // Add to layer costs
      switch (element.layer) {
        case 'BUSINESS':
          breakdown.byLayer.business += cost;
          break;
        case 'APPLICATION':
          breakdown.byLayer.application += cost;
          breakdown.software.customDevelopment += cost * 0.6;
          breakdown.services.implementation += cost * 0.3;
          breakdown.operations.maintenance += cost * 0.1;
          break;
        case 'DATA':
          breakdown.byLayer.data += cost;
          breakdown.infrastructure.cloud += cost * 0.4;
          breakdown.software.licenses += cost * 0.3;
          breakdown.operations.backup += cost * 0.3;
          break;
        case 'TECHNOLOGY':
          breakdown.byLayer.technology += cost;
          breakdown.infrastructure.onPremise += cost * 0.5;
          breakdown.infrastructure.cloud += cost * 0.3;
          breakdown.infrastructure.hybrid += cost * 0.2;
          break;
        case 'SOLUTION':
          breakdown.byLayer.solution += cost;
          break;
      }

      breakdown.bySystem.push({
        systemId: element.id,
        systemName: element.name,
        cost,
        category: element.type
      });
    });

    // Calculate totals
    breakdown.infrastructure.total = 
      breakdown.infrastructure.cloud +
      breakdown.infrastructure.onPremise +
      breakdown.infrastructure.hybrid;

    breakdown.software.total =
      breakdown.software.licenses +
      breakdown.software.subscriptions +
      breakdown.software.customDevelopment;

    breakdown.services.total =
      breakdown.services.consulting +
      breakdown.services.implementation +
      breakdown.services.support +
      breakdown.services.training;

    breakdown.operations.total =
      breakdown.operations.maintenance +
      breakdown.operations.monitoring +
      breakdown.operations.backup +
      breakdown.operations.disasterRecovery;

    const totalCost = 
      breakdown.infrastructure.total +
      breakdown.software.total +
      breakdown.services.total +
      breakdown.operations.total;

    return {
      id: `cost-${Date.now()}`,
      architectureId: '',
      estimationDate: new Date(),
      totalCost,
      costBreakdown: breakdown,
      assumptions: [
        'Costs are annual estimates',
        'Based on current architecture state',
        'Does not include one-time setup costs'
      ],
      confidence: 'MEDIUM'
    };
  }

  async estimateCloudCosts(
    request: CloudPricingRequest,
    elements?: ArchitectureElement[]
  ): Promise<CloudCostEstimate> {
    const assumptionSet = new Set<string>();
    let services: CloudServiceCost[] = [];
    let dataSource: CloudPricingDataSource = 'STATIC';

    if (this.cloudPricingAdapter) {
      try {
        const response = await this.cloudPricingAdapter.estimate(request);
        services = response.services;
        dataSource = response.dataSource;
        response.assumptions.forEach(assumption => assumptionSet.add(assumption));
      } catch (error) {
        console.warn('Cloud pricing adapter failed, falling back to heuristics', error);
        assumptionSet.add('Live cloud pricing API was unavailable; heuristic pricing applied.');
      }
    } else {
      assumptionSet.add('Cloud pricing adapter not configured; heuristic pricing applied.');
    }

    if (!services.length) {
      services = request.usage.map(usage => this.estimateServiceCostHeuristically(usage, request.discountRate));
      dataSource = 'STATIC';
    } else if (request.discountRate && request.discountRate > 0) {
      services = services.map(service => this.applyEnterpriseDiscount(service, request.discountRate!));
    }

    if (elements && elements.length > 0) {
      services = services.map(service => {
        const matches = elements.filter(el =>
          (el.metadata.customFields?.cloudServiceId && el.metadata.customFields.cloudServiceId === service.usage.id) ||
          el.name.toLowerCase().includes(service.usage.service.toLowerCase())
        );
        if (matches.length > 0) {
          const notes = service.notes ? [...service.notes] : [];
          notes.push(`Linked to ${matches.length} architecture element(s): ${matches.map(m => m.name).join(', ')}`);
          return { ...service, notes };
        }
        return service;
      });
    }

    const totals = this.calculateCloudCostTotals(services);

    if (request.discountRate && request.discountRate > 0) {
      assumptionSet.add(`Enterprise discount of ${request.discountRate}% applied across eligible services.`);
    }

    if (!services.length) {
      assumptionSet.add('No services provided in cost request.');
    }

    return {
      request,
      services,
      totals,
      dataSource,
      assumptions: Array.from(assumptionSet),
      generatedAt: new Date()
    };
  }

  modelPerformance(
    workload: WorkloadProfile,
    elements: ArchitectureElement[],
    relationships: ArchitectureRelationship[]
  ): PerformanceModel {
    const capacityPerUnit = this.estimateBaselineCapacity(workload, elements);
    const currentCapacityUnits = this.countCurrentCapacityUnits(elements, relationships);
    const requiredCapacityNow = Math.max(1, Math.ceil(workload.peakTransactionsPerSecond / capacityPerUnit));
    const seasonalBuffer = 1 + Math.min(0.5, workload.concurrency / 1000);
    const requiredCapacityPeak = Math.ceil(requiredCapacityNow * seasonalBuffer);
    const growthMultiplier = Math.pow(1 + workload.growthRateMonthly / 100, 12);
    const requiredCapacityIn12Months = Math.ceil(requiredCapacityPeak * growthMultiplier);
    const bufferPercentage = Math.min(50, 20 + workload.availabilityTarget / 10);
    const estimatedMonthlyCost = requiredCapacityIn12Months * this.estimateCapacityUnitCost(elements);
    const estimatedUpgradeTimelineWeeks = this.estimateUpgradeTimeline(requiredCapacityIn12Months, currentCapacityUnits);

    const capacityPlan: CapacityPlan = {
      currentCapacityUnits,
      requiredCapacityNow,
      requiredCapacityPeak,
      requiredCapacityIn12Months,
      bufferPercentage,
      scalingStrategy: this.determineScalingStrategy(workload, elements),
      estimatedMonthlyCost,
      estimatedUpgradeTimelineWeeks,
      notes: this.generateCapacityNotes(workload, requiredCapacityIn12Months, currentCapacityUnits)
    };

    const bottlenecks = this.identifyPerformanceBottlenecks(workload, elements, relationships, capacityPerUnit);
    const recommendations = this.generatePerformanceRecommendations(workload, capacityPlan, bottlenecks);

    return {
      id: `perf-${Date.now()}`,
      generatedAt: new Date(),
      workload,
      capacityPlan,
      bottlenecks,
      recommendations
    };
  }

  /**
   * Calculate Architecture KPIs
   */
  calculateKPIs(
    elements: ArchitectureElement[],
    relationships: ArchitectureRelationship[]
  ): ArchitectureKPIs {
    const reuseRate = this.calculateReuseRate(elements);
    const integrationCount = this.calculateIntegrationMetrics(relationships);
    const slaCompliance = this.calculateSLACompliance(elements);

    return {
      id: `kpi-${Date.now()}`,
      reportDate: new Date(),
      reuseRate,
      integrationCount,
      slaCompliance,
      otherKPIs: {
        totalComponents: elements.length,
        averageComplexity: this.calculateAverageComplexity(elements),
        documentationCoverage: this.calculateDocumentationCoverage(elements)
      }
    };
  }

  evaluateCompliance(
    frameworkIds: Array<ComplianceFramework['id']>,
    coverage: Partial<Record<string, ComplianceCheckResult>> = {}
  ): ComplianceReport[] {
    const catalog = this.getComplianceFrameworkCatalog();

    return frameworkIds.map(id => {
      const framework = catalog[id] || catalog['CUSTOM'];
      const results = framework.controls.map(control => {
        const provided = coverage[control.id];
        const status = provided?.status || this.inferComplianceStatus(control, coverage);
        const remediationActions = provided?.remediationActions || this.generateControlRemediation(control, status);
        return {
          control,
          controlId: control.id,
          status,
          evidence: provided?.evidence || [],
          owner: provided?.owner,
          dueDate: provided?.dueDate,
          remediationActions,
          notes: provided?.notes
        };
      });

      const summary = this.calculateComplianceSummary(results);
      const highRiskControls = results
        .filter(result => result.status !== 'COMPLIANT' && result.control.severity === 'HIGH')
        .map(result => result.control.title);
      const recommendations = this.generateComplianceRecommendations(framework, results, summary);

      return {
        id: `compliance-${framework.id}-${Date.now()}`,
        framework,
        generatedAt: new Date(),
        summary,
        results,
        highRiskControls,
        recommendations
      };
    });
  }

  recommendTechnologyStack(
    requirements: TechnologyRequirement[],
    existingTechnologies: string[] = []
  ): StackRecommendation {
    const catalog = this.getTechnologyCatalog();
    const evaluatedOptions = catalog.map(option => this.evaluateTechnologyOption(option, requirements, existingTechnologies));

    const recommendedStack: TechnologyOption[] = [];
    const categoriesVisited = new Set<string>();
    evaluatedOptions
      .sort((a, b) => b.score - a.score)
      .forEach(option => {
        if (!categoriesVisited.has(option.category) && option.fit !== 'LOW') {
          recommendedStack.push(option);
          categoriesVisited.add(option.category);
        }
      });

    const averageScore = evaluatedOptions.reduce((sum, option) => sum + option.score, 0) / (evaluatedOptions.length || 1);
    const overallFit = averageScore >= 75 ? 'HIGH' : averageScore >= 55 ? 'MEDIUM' : 'LOW';
    const keyRisks = this.identifyStackRisks(recommendedStack, requirements);
    const mitigationPlan = this.generateStackMitigations(keyRisks);

    return {
      id: `stack-${Date.now()}`,
      generatedAt: new Date(),
      requirements,
      options: evaluatedOptions,
      recommendedStack,
      summary: {
        overallFit,
        estimatedRampUpEffortWeeks: this.estimateRampUpEffort(recommendedStack, existingTechnologies),
        keyRisks,
        mitigationPlan
      }
    };
  }

  buildRiskRegister(
    risks: RiskItem[],
    existingMitigations: RiskMitigation[] = []
  ): RiskRegister {
    const mitigations = risks.map(risk => {
      const existing = existingMitigations.find(mitigation => mitigation.riskId === risk.id);
      if (existing) {
        return existing;
      }
      return this.generateDefaultMitigation(risk);
    });

    const summary = this.calculateRiskRegisterSummary(risks, mitigations);
    const recommendations = this.generateRiskRegisterRecommendations(risks, mitigations);

    return {
      id: `risk-register-${Date.now()}`,
      generatedAt: new Date(),
      risks,
      mitigations,
      summary,
      recommendations
    };
  }

  // Helper methods

  private findTransitiveDependencies(
    systemId: string,
    relationships: ArchitectureRelationship[],
    elements: ArchitectureElement[]
  ): DependencyImpact[] {
    const visited = new Set<string>();
    const transitive: DependencyImpact[] = [];

    const traverse = (currentId: string, depth: number) => {
      if (depth > 3 || visited.has(currentId)) return; // Limit depth
      visited.add(currentId);

      relationships
        .filter(r => r.sourceId === currentId)
        .forEach(r => {
          const target = elements.find(e => e.id === r.targetId);
          if (target && !visited.has(r.targetId)) {
            transitive.push({
              systemId: r.targetId,
              systemName: target.name,
              relationshipType: r.type,
              impactType: depth === 1 ? 'MODERATE' : 'MINOR',
              description: `Transitive dependency (depth ${depth}): ${target.name}`,
              mitigation: []
            });
            traverse(r.targetId, depth + 1);
          }
        });
    };

    relationships
      .filter(r => r.sourceId === systemId)
      .forEach(r => traverse(r.targetId, 1));

    return transitive;
  }

  private findAffectedSystems(
    systemId: string,
    relationships: ArchitectureRelationship[],
    elements: ArchitectureElement[]
  ): AffectedSystem[] {
    const affected: AffectedSystem[] = [];
    const reverseDeps = relationships.filter(r => r.targetId === systemId);

    reverseDeps.forEach(rel => {
      const source = elements.find(e => e.id === rel.sourceId);
      if (source) {
        affected.push({
          systemId: source.id,
          systemName: source.name,
          layer: source.layer,
          impactSeverity: this.calculateImpactSeverity(rel.type, source),
          affectedComponents: [source.type],
          estimatedDowntime: this.estimateDowntime(source)
        });
      }
    });

    return affected;
  }

  private calculateImpactScore(
    direct: DependencyImpact[],
    transitive: DependencyImpact[],
    affected: AffectedSystem[]
  ): number {
    let score = 0;
    
    direct.forEach(dep => {
      score += dep.impactType === 'BREAKING' ? 30 :
               dep.impactType === 'MODERATE' ? 15 :
               dep.impactType === 'MINOR' ? 5 : 0;
    });

    transitive.forEach(dep => {
      score += dep.impactType === 'MODERATE' ? 5 :
               dep.impactType === 'MINOR' ? 2 : 0;
    });

    affected.forEach(sys => {
      score += sys.impactSeverity === 'CRITICAL' ? 20 :
               sys.impactSeverity === 'HIGH' ? 10 :
               sys.impactSeverity === 'MEDIUM' ? 5 : 0;
    });

    return Math.min(100, score);
  }

  private determineRiskLevel(score: number, affected: AffectedSystem[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 70 || affected.some(s => s.impactSeverity === 'CRITICAL')) return 'CRITICAL';
    if (score >= 50 || affected.some(s => s.impactSeverity === 'HIGH')) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }

  private calculateImpactType(type: string, risk?: string): 'BREAKING' | 'MODERATE' | 'MINOR' | 'NONE' {
    if (type === 'DEPENDS_ON' && risk === 'CRITICAL') return 'BREAKING';
    if (type === 'INTEGRATES_WITH' && risk === 'HIGH') return 'MODERATE';
    if (type === 'CONSUMES' || type === 'PROVIDES') return 'MODERATE';
    return 'MINOR';
  }

  private getMitigationStrategies(type: string): string[] {
    const strategies: Record<string, string[]> = {
      'DEPENDS_ON': ['Implement circuit breaker', 'Add fallback mechanisms', 'Monitor dependency health'],
      'INTEGRATES_WITH': ['Version APIs', 'Implement retry logic', 'Add integration tests'],
      'CONSUMES': ['Cache responses', 'Implement rate limiting', 'Monitor consumption'],
      'PROVIDES': ['Document API contracts', 'Version services', 'Monitor usage']
    };
    return strategies[type] || ['Review dependency', 'Document relationship'];
  }

  private generateDependencyRecommendations(
    direct: DependencyImpact[],
    transitive: DependencyImpact[],
    affected: AffectedSystem[],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      recommendations.push('Implement comprehensive testing before deployment');
      recommendations.push('Create rollback plan');
      recommendations.push('Notify all affected stakeholders');
    }

    if (direct.length > 10) {
      recommendations.push('Consider reducing direct dependencies');
      recommendations.push('Evaluate dependency consolidation opportunities');
    }

    if (transitive.length > 20) {
      recommendations.push('Review transitive dependency chain');
      recommendations.push('Consider breaking circular dependencies');
    }

    if (affected.length > 5) {
      recommendations.push('Coordinate change with all affected systems');
      recommendations.push('Plan phased rollout');
    }

    return recommendations;
  }

  private determineGapCategory(element: ArchitectureElement): ArchitectureGap['category'] {
    if (element.layer === 'APPLICATION') return 'MISSING_COMPONENT';
    if (element.layer === 'TECHNOLOGY') return 'TECHNOLOGY_GAP';
    if (element.layer === 'DATA') return 'DATA_GAP';
    if (element.layer === 'BUSINESS') return 'MISSING_CAPABILITY';
    return 'MISSING_COMPONENT';
  }

  private calculateGapSeverity(element: ArchitectureElement): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (element.metadata.risk === 'CRITICAL') return 'CRITICAL';
    if (element.metadata.risk === 'HIGH') return 'HIGH';
    if (element.layer === 'APPLICATION' || element.layer === 'DATA') return 'MEDIUM';
    return 'LOW';
  }

  private estimateEffort(element: ArchitectureElement): number {
    const baseEffort: Record<ArchitectureLayer, number> = {
      'BUSINESS': 10,
      'APPLICATION': 20,
      'DATA': 15,
      'TECHNOLOGY': 25,
      'SOLUTION': 30
    };
    return baseEffort[element.layer] || 15;
  }

  private calculatePriority(element: ArchitectureElement): number {
    let priority = 5;
    if (element.metadata.risk === 'CRITICAL') priority += 3;
    if (element.metadata.risk === 'HIGH') priority += 2;
    if (element.layer === 'APPLICATION') priority += 1;
    return Math.min(10, priority);
  }

  private calculateGapSummary(gaps: ArchitectureGap[]): GapSummary {
    return {
      totalGaps: gaps.length,
      criticalGaps: gaps.filter(g => g.severity === 'CRITICAL').length,
      highGaps: gaps.filter(g => g.severity === 'HIGH').length,
      mediumGaps: gaps.filter(g => g.severity === 'MEDIUM').length,
      lowGaps: gaps.filter(g => g.severity === 'LOW').length,
      estimatedTotalEffort: gaps.reduce((sum, g) => sum + g.estimatedEffort, 0),
      estimatedCost: gaps.reduce((sum, g) => sum + g.estimatedEffort * 1000, 0), // $1000 per day
      estimatedTimeline: Math.ceil(gaps.reduce((sum, g) => sum + g.estimatedEffort, 0) / 20) // 20 days per month
    };
  }

  private generateGapRecommendation(gap: ArchitectureGap): string {
    return `Address ${gap.category.toLowerCase().replace('_', ' ')}: ${gap.description}`;
  }

  private calculatePortfolioHealth(elements: ArchitectureElement[]): PortfolioHealth {
    const systems = elements.filter(e => e.layer === 'APPLICATION');
    const healthy = systems.filter(s => s.metadata.risk === 'LOW' || !s.metadata.risk).length;
    const warning = systems.filter(s => s.metadata.risk === 'MEDIUM').length;
    const critical = systems.filter(s => s.metadata.risk === 'HIGH' || s.metadata.risk === 'CRITICAL').length;

    const overallScore = systems.length > 0
      ? ((healthy * 100 + warning * 60 + critical * 20) / systems.length)
      : 100;

    return {
      overallScore,
      status: overallScore >= 80 ? 'HEALTHY' : overallScore >= 60 ? 'WARNING' : 'CRITICAL',
      metrics: {
        availability: 95, // Would come from monitoring
        performance: 85,
        security: 90,
        compliance: 88,
        maintainability: 75
      },
      systemsByHealth: { healthy, warning, critical }
    };
  }

  private calculatePortfolioMaturity(elements: ArchitectureElement[]): PortfolioMaturity {
    // Simplified maturity calculation
    const processMaturity = 70;
    const technologyMaturity = 65;
    const dataMaturity = 60;
    const integrationMaturity = 75;
    const governanceMaturity = 70;

    const avgMaturity = (
      processMaturity +
      technologyMaturity +
      dataMaturity +
      integrationMaturity +
      governanceMaturity
    ) / 5;

    const level = avgMaturity >= 80 ? 'OPTIMIZING' :
                  avgMaturity >= 60 ? 'MANAGED' :
                  avgMaturity >= 40 ? 'DEFINED' :
                  avgMaturity >= 20 ? 'DEVELOPING' : 'INITIAL';

    return {
      overallLevel: level,
      levelScore: avgMaturity,
      dimensions: {
        processMaturity,
        technologyMaturity,
        dataMaturity,
        integrationMaturity,
        governanceMaturity
      },
      roadmap: []
    };
  }

  private calculateTechnicalDebt(elements: ArchitectureElement[]): TechnicalDebt {
    const totalDebt = elements.length * 5; // Simplified

    return {
      totalDebt,
      debtByCategory: {
        codeQuality: totalDebt * 0.3,
        architecture: totalDebt * 0.25,
        documentation: totalDebt * 0.2,
        testing: totalDebt * 0.15,
        security: totalDebt * 0.05,
        performance: totalDebt * 0.05
      },
      debtBySystem: elements.map(e => ({
        systemId: e.id,
        systemName: e.name,
        debt: 5,
        category: e.type
      })),
      priorityDebt: []
    };
  }

  private riskToProbability(risk: string | undefined): number {
    if (!risk) return 20;
    switch (risk) {
      case 'CRITICAL': return 90;
      case 'HIGH': return 70;
      case 'MEDIUM': return 50;
      case 'LOW': return 30;
      default: return 20;
    }
  }

  private riskToImpact(risk: string | undefined): number {
    if (!risk) return 30;
    switch (risk) {
      case 'CRITICAL': return 100;
      case 'HIGH': return 80;
      case 'MEDIUM': return 60;
      case 'LOW': return 40;
      default: return 30;
    }
  }

  private getRiskMitigation(element: ArchitectureElement): string[] {
    return [
      'Review architecture',
      'Implement monitoring',
      'Create contingency plan',
      'Document dependencies'
    ];
  }

  private generateRiskHeatmap(risks: RiskItem[]): RiskHeatmap {
    const cells: RiskHeatmapCell[] = [];
    
    // Create 5x5 grid
    for (let impact = 0; impact <= 100; impact += 20) {
      for (let prob = 0; prob <= 100; prob += 20) {
        const matchingRisks = risks.filter(r => 
          r.impact >= impact && r.impact < impact + 20 &&
          r.probability >= prob && r.probability < prob + 20
        );

        let color = '#22c55e'; // green
        if (impact >= 60 && prob >= 60) color = '#ef4444'; // red
        else if (impact >= 40 || prob >= 40) color = '#f59e0b'; // amber

        cells.push({
          x: impact + 10,
          y: prob + 10,
          riskCount: matchingRisks.length,
          riskIds: matchingRisks.map(r => r.id),
          color
        });
      }
    }

    return {
      dimensions: { x: 'Impact', y: 'Probability' },
      cells
    };
  }

  private calculateImpactSeverity(type: string, element: ArchitectureElement): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (element.metadata.risk === 'CRITICAL') return 'CRITICAL';
    if (element.metadata.risk === 'HIGH') return 'HIGH';
    if (type === 'DEPENDS_ON') return 'MEDIUM';
    return 'LOW';
  }

  private estimateDowntime(element: ArchitectureElement): number {
    if (element.metadata.risk === 'CRITICAL') return 24;
    if (element.metadata.risk === 'HIGH') return 12;
    if (element.metadata.risk === 'MEDIUM') return 6;
    return 2;
  }

  private calculateReuseRate(elements: ArchitectureElement[]): ReuseRateMetrics {
    // Simplified - would track actual reuse
    const totalComponents = elements.length;
    const reusedComponents = elements.filter(e => e.tags?.includes('reusable')).length;
    const overallRate = totalComponents > 0 ? (reusedComponents / totalComponents) * 100 : 0;

    return {
      overallRate,
      byType: {
        components: overallRate * 0.4,
        patterns: overallRate * 0.3,
        services: overallRate * 0.2,
        dataModels: overallRate * 0.1
      },
      topReused: [],
      trends: []
    };
  }

  private calculateIntegrationMetrics(relationships: ArchitectureRelationship[]): IntegrationMetrics {
    const integrations = relationships.filter(r => r.type === 'INTEGRATES_WITH');
    
    return {
      totalIntegrations: integrations.length,
      byType: {
        api: integrations.length * 0.6,
        messageQueue: integrations.length * 0.2,
        database: integrations.length * 0.1,
        file: integrations.length * 0.05,
        webhook: integrations.length * 0.05
      },
      byStatus: {
        active: integrations.length * 0.8,
        inactive: integrations.length * 0.15,
        deprecated: integrations.length * 0.05
      },
      integrationHealth: {
        healthy: integrations.length * 0.7,
        warning: integrations.length * 0.2,
        critical: integrations.length * 0.1
      },
      trends: []
    };
  }

  private calculateSLACompliance(elements: ArchitectureElement[]): SLAComplianceMetrics {
    // Simplified - would use actual SLA data
    return {
      overallCompliance: 95,
      bySLA: [],
      bySystem: elements.map(e => ({
        systemId: e.id,
        systemName: e.name,
        compliance: 95,
        breaches: 0
      })),
      trends: []
    };
  }

  private calculateAverageComplexity(elements: ArchitectureElement[]): number {
    // Simplified complexity calculation
    return elements.length > 0 ? 50 : 0;
  }

  private calculateDocumentationCoverage(elements: ArchitectureElement[]): number {
    const documented = elements.filter(e => e.description && e.description.length > 50).length;
    return elements.length > 0 ? (documented / elements.length) * 100 : 0;
  }

  private estimateServiceCostHeuristically(usage: CloudServiceUsage, discountRate = 0): CloudServiceCost {
    const pricePoint = this.getHeuristicPricePoint(usage);
    const baseMonthlyCost = pricePoint.pricePerUnit * usage.quantity;
    const effectiveDiscount = discountRate || usage.metadata?.discountRate || 0;
    const discountMultiplier = 1 - Math.min(Math.max(effectiveDiscount, 0), 80) / 100;
    const monthlyCost = baseMonthlyCost * discountMultiplier;
    const hourlyCost = monthlyCost / (30 * 24);
    const annualCost = monthlyCost * 12;

    return {
      usage,
      pricePoint,
      hourlyCost,
      monthlyCost,
      annualCost,
      blendedDiscount: Math.round((1 - discountMultiplier) * 10000) / 100,
      notes: usage.assumptions ? [...usage.assumptions] : []
    };
  }

  private getHeuristicPricePoint(usage: CloudServiceUsage): CloudPricePoint {
    const serviceKey = this.normalizeServiceKey(usage.service);
    const heuristicRates: Record<CloudProvider, Record<string, number>> = {
      AWS: {
        compute: 0.11,
        container: 0.095,
        serverless: 0.00002,
        database: 0.25,
        datawarehouse: 0.35,
        storage: 0.023,
        objectstorage: 0.021,
        blockstorage: 0.08,
        network: 0.09,
        analytics: 0.19,
        monitoring: 0.015,
        security: 0.04,
        default: 0.12
      },
      AZURE: {
        compute: 0.10,
        container: 0.09,
        serverless: 0.000018,
        database: 0.22,
        datawarehouse: 0.32,
        storage: 0.02,
        objectstorage: 0.019,
        blockstorage: 0.075,
        network: 0.085,
        analytics: 0.18,
        monitoring: 0.013,
        security: 0.038,
        default: 0.11
      },
      GCP: {
        compute: 0.098,
        container: 0.088,
        serverless: 0.000017,
        database: 0.20,
        datawarehouse: 0.30,
        storage: 0.020,
        objectstorage: 0.0185,
        blockstorage: 0.07,
        network: 0.082,
        analytics: 0.17,
        monitoring: 0.012,
        security: 0.036,
        default: 0.10
      }
    };

    const providerRates = heuristicRates[usage.provider];
    const pricePerUnit = providerRates[serviceKey] ?? providerRates.default ?? 0.12;

    return {
      sku: `${usage.provider}-${serviceKey}-${usage.region}`,
      description: `Heuristic pricing for ${usage.service}`,
      unit: usage.unit,
      pricePerUnit,
      currency: 'USD',
      provider: usage.provider,
      region: usage.region,
      service: usage.service,
      lastUpdated: new Date(),
      source: 'STATIC'
    };
  }

  private normalizeServiceKey(service: string): string {
    const key = service.toLowerCase();
    if (key.includes('lambda') || key.includes('serverless') || key.includes('functions')) return 'serverless';
    if (key.includes('kubernetes') || key.includes('container')) return 'container';
    if (key.includes('sql') || key.includes('database') || key.includes('postgres') || key.includes('mysql')) return 'database';
    if (key.includes('warehouse') || key.includes('redshift') || key.includes('bigquery') || key.includes('synapse')) return 'datawarehouse';
    if (key.includes('storage') && key.includes('object')) return 'objectstorage';
    if (key.includes('storage') && key.includes('block')) return 'blockstorage';
    if (key.includes('storage')) return 'storage';
    if (key.includes('network') || key.includes('bandwidth')) return 'network';
    if (key.includes('analytics') || key.includes('insight')) return 'analytics';
    if (key.includes('monitor') || key.includes('observability') || key.includes('logging')) return 'monitoring';
    if (key.includes('security') || key.includes('iam') || key.includes('identity')) return 'security';
    if (key.includes('compute') || key.includes('ec2') || key.includes('vm') || key.includes('instance')) return 'compute';
    return 'default';
  }

  private applyEnterpriseDiscount(service: CloudServiceCost, discountRate: number): CloudServiceCost {
    const safeDiscount = Math.min(Math.max(discountRate, 0), 80);
    const listMonthly = service.pricePoint.pricePerUnit * service.usage.quantity;
    const discountedMonthly = listMonthly * (1 - safeDiscount / 100);
    const hourlyCost = discountedMonthly / (30 * 24);
    const annualCost = discountedMonthly * 12;
    const blendedDiscount = Math.max(service.blendedDiscount ?? 0, safeDiscount);
    const notes = new Set<string>(service.notes || []);
    notes.add(`Enterprise discount (${safeDiscount}%) applied.`);

    return {
      ...service,
      hourlyCost,
      monthlyCost: discountedMonthly,
      annualCost,
      blendedDiscount,
      notes: Array.from(notes)
    };
  }

  private calculateCloudCostTotals(services: CloudServiceCost[]): CloudCostEstimate['totals'] {
    return services.reduce<CloudCostEstimate['totals']>((totals, service) => {
      const listMonthly = service.pricePoint.pricePerUnit * service.usage.quantity;
      const discount = Math.max(0, listMonthly - service.monthlyCost);

      return {
        hourly: totals.hourly + service.hourlyCost,
        monthly: totals.monthly + service.monthlyCost,
        annual: totals.annual + service.annualCost,
        discounts: totals.discounts + discount
      };
    }, { hourly: 0, monthly: 0, annual: 0, discounts: 0 });
  }

  private estimateBaselineCapacity(workload: WorkloadProfile, elements: ArchitectureElement[]): number {
    const technologyElements = elements.filter(element => element.layer === 'TECHNOLOGY');
    const declaredCapacities = technologyElements
      .map(element => element.metadata.customFields?.capacityPerUnit)
      .filter((value): value is number => typeof value === 'number' && value > 0);

    let baseline = declaredCapacities.length > 0
      ? declaredCapacities.reduce((sum, value) => sum + value, 0) / declaredCapacities.length
      : 600;

    if (workload.payloadSizeKb > 512) {
      baseline *= Math.max(0.5, 1 - (workload.payloadSizeKb - 512) / 2048);
    }

    if (workload.availabilityTarget >= 99.9) {
      baseline *= 0.9;
    }

    return Math.max(150, Math.round(baseline));
  }

  private countCurrentCapacityUnits(
    elements: ArchitectureElement[],
    relationships: ArchitectureRelationship[]
  ): number {
    const computeElements = elements.filter(element =>
      element.layer === 'TECHNOLOGY' &&
      (element.type.toLowerCase().includes('compute') || element.tags.includes('compute') ||
        element.metadata.customFields?.category === 'COMPUTE')
    );

    const integrationOverhead = relationships.filter(rel => rel.type === 'INTEGRATES_WITH').length;
    const derivedUnits = Math.ceil(integrationOverhead / 10);

    return Math.max(1, computeElements.length + derivedUnits);
  }

  private estimateCapacityUnitCost(elements: ArchitectureElement[]): number {
    const cloudElements = elements.filter(element => element.metadata.customFields?.platform === 'CLOUD');
    if (cloudElements.length > 0) {
      return 320;
    }
    const onPrem = elements.filter(element => element.metadata.customFields?.platform === 'ON_PREM');
    if (onPrem.length > 0) {
      return 280;
    }
    return 300;
  }

  private estimateUpgradeTimeline(requiredCapacity: number, currentCapacity: number): number {
    const additionalUnits = Math.max(0, requiredCapacity - currentCapacity);
    if (additionalUnits <= 0) return 2;
    if (additionalUnits < 5) return 4;
    if (additionalUnits < 10) return 6;
    return Math.min(16, Math.ceil(additionalUnits / 2));
  }

  private determineScalingStrategy(workload: WorkloadProfile, elements: ArchitectureElement[]): CapacityPlan['scalingStrategy'] {
    const usesCloud = elements.some(element => element.metadata.customFields?.platform === 'CLOUD');
    if (usesCloud && workload.concurrency > 250) {
      return 'AUTO_SCALING';
    }
    if (workload.peakTransactionsPerSecond > workload.averageTransactionsPerSecond * 1.5) {
      return 'HORIZONTAL';
    }
    return 'VERTICAL';
  }

  private generateCapacityNotes(
    workload: WorkloadProfile,
    requiredCapacityIn12Months: number,
    currentCapacity: number
  ): string[] {
    const notes: string[] = [];
    if (requiredCapacityIn12Months > currentCapacity * 1.5) {
      notes.push('Capacity requirement grows more than 50% over 12 months. Plan phased upgrades.');
    }
    if (workload.growthRateMonthly > 5) {
      notes.push(`High workload growth rate detected (${workload.growthRateMonthly}% per month).`);
    }
    if (workload.availabilityTarget >= 99.9) {
      notes.push('Availability targets require N+1 redundancy in production.');
    }
    return notes;
  }

  private identifyPerformanceBottlenecks(
    workload: WorkloadProfile,
    elements: ArchitectureElement[],
    relationships: ArchitectureRelationship[],
    capacityPerUnit: number
  ): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    const applicationElements = elements.filter(element => element.layer === 'APPLICATION');
    const dataElements = elements.filter(element => element.layer === 'DATA');

    if (workload.peakTransactionsPerSecond > capacityPerUnit * applicationElements.length) {
      bottlenecks.push({
        id: 'bottleneck-compute',
        layer: 'APPLICATION',
        metric: 'CPU',
        currentUtilization: Math.min(99, Math.round((workload.peakTransactionsPerSecond / (capacityPerUnit * Math.max(applicationElements.length, 1))) * 100)),
        riskLevel: 'HIGH',
        description: 'Peak throughput exceeds current compute capacity.',
        recommendations: ['Introduce auto-scaling at application tier', 'Optimize critical transaction flows']
      });
    }

    if (workload.concurrency > 500 || relationships.filter(rel => rel.type === 'INTEGRATES_WITH').length > 20) {
      bottlenecks.push({
        id: 'bottleneck-integration',
        layer: 'TECHNOLOGY',
        metric: 'NETWORK',
        currentUtilization: Math.min(99, Math.round(workload.concurrency / 10)),
        riskLevel: 'MEDIUM',
        description: 'High concurrency and integration volume may saturate network links.',
        recommendations: ['Implement connection pooling', 'Add API gateway throttling policies']
      });
    }

    if (dataElements.length > 0 && workload.payloadSizeKb > 256) {
      bottlenecks.push({
        id: 'bottleneck-data',
        layer: 'DATA',
        metric: 'IO',
        currentUtilization: Math.min(99, Math.round((workload.payloadSizeKb / 1024) * 80)),
        riskLevel: workload.payloadSizeKb > 1024 ? 'HIGH' : 'MEDIUM',
        description: 'Large payload sizes can degrade database IO performance.',
        recommendations: ['Introduce caching for read-heavy flows', 'Consider data sharding or partitioning']
      });
    }

    if (workload.latencyTargetMs < 150 && workload.peakTransactionsPerSecond > 1000) {
      bottlenecks.push({
        id: 'bottleneck-latency',
        layer: 'SOLUTION',
        metric: 'LATENCY',
        currentUtilization: 85,
        riskLevel: 'MEDIUM',
        description: 'Aggressive latency targets under high load may require edge acceleration.',
        recommendations: ['Review CDN / edge strategy', 'Implement request prioritization']
      });
    }

    return bottlenecks;
  }

  private generatePerformanceRecommendations(
    workload: WorkloadProfile,
    capacityPlan: CapacityPlan,
    bottlenecks: PerformanceBottleneck[]
  ): string[] {
    const recommendations = new Set<string>();

    bottlenecks.forEach(bottleneck => bottleneck.recommendations.forEach(rec => recommendations.add(rec)));

    if (capacityPlan.scalingStrategy === 'AUTO_SCALING') {
      recommendations.add('Implement predictive auto-scaling policies for peak seasons.');
    }

    if (workload.growthRateMonthly > 7) {
      recommendations.add('Review capacity every quarter to stay ahead of demand.');
    }

    if (capacityPlan.bufferPercentage < 25) {
      recommendations.add('Increase buffer capacity to absorb failover events.');
    }

    return Array.from(recommendations);
  }

  private getComplianceFrameworkCatalog(): Record<ComplianceFramework['id'], ComplianceFramework> {
    const frameworks: Record<ComplianceFramework['id'], ComplianceFramework> = {
      SOC2: {
        id: 'SOC2',
        name: 'SOC 2 Type II',
        description: 'Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.',
        categories: ['Security', 'Availability', 'Confidentiality'],
        controls: [
          {
            id: 'soc2-cc1',
            category: 'Security',
            title: 'Access Control Policies',
            description: 'Documented access management policies covering provisioning, review, and revocation.',
            requirement: 'Access is provisioned based on least privilege and reviewed quarterly.',
            severity: 'HIGH'
          },
          {
            id: 'soc2-cc2',
            category: 'Availability',
            title: 'Business Continuity Planning',
            description: 'Defined and tested business continuity and disaster recovery plans.',
            requirement: 'Recovery procedures are tested annually and results are documented.',
            severity: 'MEDIUM'
          },
          {
            id: 'soc2-cc3',
            category: 'Confidentiality',
            title: 'Encryption in Transit and at Rest',
            description: 'Sensitive data is encrypted during transmission and storage.',
            requirement: 'Industry-standard encryption (TLS 1.2+, AES-256) is enforced.',
            severity: 'HIGH'
          }
        ]
      },
      HIPAA: {
        id: 'HIPAA',
        name: 'HIPAA Security Rule',
        description: 'Security standards protecting the confidentiality, integrity, and availability of electronic PHI.',
        categories: ['Administrative', 'Technical', 'Physical'],
        controls: [
          {
            id: 'hipaa-164-308',
            category: 'Administrative',
            title: 'Risk Analysis and Management',
            description: 'Conduct an accurate assessment of potential risks to ePHI.',
            requirement: 'Risk analysis performed annually with documented mitigation steps.',
            severity: 'HIGH'
          },
          {
            id: 'hipaa-164-312',
            category: 'Technical',
            title: 'Access Control Mechanisms',
            description: 'Unique user identification and automatic logoff for systems with ePHI.',
            requirement: 'Sessions automatically terminate after defined inactivity period.',
            severity: 'MEDIUM'
          },
          {
            id: 'hipaa-164-316',
            category: 'Physical',
            title: 'Facility Access Controls',
            description: 'Policies to limit physical access to systems containing ePHI.',
            requirement: 'Visitor logs and access badges enforced at all data centers.',
            severity: 'MEDIUM'
          }
        ]
      },
      GDPR: {
        id: 'GDPR',
        name: 'GDPR Data Protection',
        description: 'Regulation governing personal data protection for EU residents.',
        categories: ['Lawfulness', 'Data Subject Rights', 'Security'],
        controls: [
          {
            id: 'gdpr-6',
            category: 'Lawfulness',
            title: 'Lawful Basis for Processing',
            description: 'Documented lawful basis for each personal data processing activity.',
            requirement: 'Consent records or alternative lawful bases are captured and auditable.',
            severity: 'HIGH'
          },
          {
            id: 'gdpr-32',
            category: 'Security',
            title: 'Security of Processing',
            description: 'Appropriate technical and organisational measures to ensure security.',
            requirement: 'Security controls reviewed annually with penetration tests.',
            severity: 'HIGH'
          },
          {
            id: 'gdpr-30',
            category: 'Data Subject Rights',
            title: 'Records of Processing Activities',
            description: 'Maintain records of processing activities for personal data.',
            requirement: 'Data inventory maintained and reviewed at least annually.',
            severity: 'MEDIUM'
          }
        ]
      },
      CUSTOM: {
        id: 'CUSTOM',
        name: 'Custom Framework',
        description: 'Configurable compliance checklist.',
        categories: [],
        controls: []
      }
    };

    return frameworks;
  }

  private inferComplianceStatus(
    control: ComplianceControl,
    coverage: Partial<Record<string, ComplianceCheckResult>>
  ): ComplianceCheckResult['status'] {
    const provided = coverage[control.id];
    if (provided) {
      return provided.status;
    }

    return control.severity === 'HIGH' ? 'NON_COMPLIANT' : 'PARTIAL';
  }

  private generateControlRemediation(
    control: ComplianceControl,
    status: ComplianceCheckResult['status']
  ): string[] {
    if (status === 'COMPLIANT') {
      return [];
    }

    const actions: Record<string, string[]> = {
      Security: ['Perform gap assessment of security controls', 'Implement missing monitoring and alerting'],
      Availability: ['Update disaster recovery playbooks', 'Schedule regular failover testing'],
      Confidentiality: ['Review data encryption posture', 'Harden access control policies'],
      Administrative: ['Document missing policies and procedures', 'Provide workforce training on updated policies'],
      Technical: ['Enable MFA for privileged access', 'Automate access review workflows'],
      Physical: ['Review facility access logs', 'Install physical security controls'],
      Lawfulness: ['Update privacy notices to reflect lawful basis', 'Maintain consent records in centralized system'],
      SecurityDefault: ['Implement missing technical safeguards'],
      'Data Subject Rights': ['Publish DSAR response procedure', 'Implement data retention automation']
    };

    const categoryKey = actions[control.category] ? control.category : 'SecurityDefault';
    return actions[categoryKey] || ['Conduct detailed control remediation planning'];
  }

  private calculateComplianceSummary(
    results: Array<ComplianceCheckResult & { control: ComplianceControl }>
  ): ComplianceReport['summary'] {
    const summary = results.reduce<ComplianceReport['summary']>((accumulator, result) => {
      accumulator.compliant += result.status === 'COMPLIANT' ? 1 : 0;
      accumulator.partial += result.status === 'PARTIAL' ? 1 : 0;
      accumulator.nonCompliant += result.status === 'NON_COMPLIANT' ? 1 : 0;
      accumulator.notApplicable += result.status === 'NOT_APPLICABLE' ? 1 : 0;
      return accumulator;
    }, {
      complianceScore: 0,
      compliant: 0,
      partial: 0,
      nonCompliant: 0,
      notApplicable: 0
    });

    const totalControls = Math.max(1, results.length - summary.notApplicable);
    summary.complianceScore = Math.round(
      ((summary.compliant + summary.partial * 0.5) / totalControls) * 100
    );

    return summary;
  }

  private generateComplianceRecommendations(
    framework: ComplianceFramework,
    results: Array<ComplianceCheckResult & { control: ComplianceControl }>,
    summary: ComplianceReport['summary']
  ): string[] {
    const recommendations: string[] = [];

    if (summary.nonCompliant > 0) {
      recommendations.push(`Address ${summary.nonCompliant} non-compliant control(s) in ${framework.name}.`);
    }

    const highSeverityGaps = results.filter(result => result.control.severity === 'HIGH' && result.status !== 'COMPLIANT');
    if (highSeverityGaps.length > 0) {
      recommendations.push('Prioritize remediation of high-severity controls within the next quarter.');
    }

    if (summary.complianceScore < 80) {
      recommendations.push('Schedule executive review of compliance roadmap.');
    }

    if (!results.some(result => result.status === 'NOT_APPLICABLE')) {
      recommendations.push('Validate applicability of each control to avoid unnecessary scope.');
    }

    return recommendations;
  }

  private getTechnologyCatalog(): TechnologyOption[] {
    return [
      {
        id: 'frontend-react',
        name: 'React + TypeScript',
        category: 'FRONTEND',
        description: 'Component-driven UI framework with strong ecosystem.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 90,
        complianceFit: 80,
        costProfile: 'LOW',
        skillsAvailability: 'HIGH',
        pros: ['Large talent pool', 'Strong tooling support', 'Rich component libraries'],
        cons: ['Requires state management discipline', 'Fast-moving ecosystem']
      },
      {
        id: 'frontend-angular',
        name: 'Angular',
        category: 'FRONTEND',
        description: 'Opinionated enterprise-ready frontend framework.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 80,
        complianceFit: 85,
        costProfile: 'MEDIUM',
        skillsAvailability: 'MEDIUM',
        pros: ['Built-in architectural conventions', 'Strong CLI tooling'],
        cons: ['Steep learning curve', 'Framework upgrades require planning']
      },
      {
        id: 'backend-node',
        name: 'Node.js (NestJS)',
        category: 'BACKEND',
        description: 'TypeScript backend framework with modular architecture.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 85,
        complianceFit: 78,
        costProfile: 'LOW',
        skillsAvailability: 'HIGH',
        pros: ['Full-stack TypeScript', 'Rich package ecosystem'],
        cons: ['Requires operational hardening for CPU-intensive workloads']
      },
      {
        id: 'backend-spring',
        name: 'Java Spring Boot',
        category: 'BACKEND',
        description: 'Mature enterprise backend framework with strong security integrations.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 88,
        complianceFit: 90,
        costProfile: 'MEDIUM',
        skillsAvailability: 'HIGH',
        pros: ['Excellent security tooling', 'Robust ecosystem'],
        cons: ['Higher resource footprint', 'Longer developer ramp-up']
      },
      {
        id: 'data-postgres',
        name: 'PostgreSQL',
        category: 'DATA',
        description: 'Open-source relational database with strong community.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 92,
        complianceFit: 85,
        costProfile: 'LOW',
        skillsAvailability: 'HIGH',
        pros: ['Extensible', 'Strong ACID compliance'],
        cons: ['Requires tuning for large-scale analytics']
      },
      {
        id: 'data-snowflake',
        name: 'Snowflake',
        category: 'DATA',
        description: 'Cloud-native data warehouse with elastic scaling.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 87,
        complianceFit: 92,
        costProfile: 'HIGH',
        skillsAvailability: 'MEDIUM',
        pros: ['Separation of storage and compute', 'Strong governance features'],
        cons: ['Usage-based costs require monitoring']
      },
      {
        id: 'devops-terraform',
        name: 'Terraform + Atlantis',
        category: 'DEVOPS',
        description: 'Infrastructure-as-Code with workflow automation.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 84,
        complianceFit: 88,
        costProfile: 'LOW',
        skillsAvailability: 'MEDIUM',
        pros: ['Multi-cloud support', 'Policy enforcement capabilities'],
        cons: ['State management requires diligence']
      },
      {
        id: 'devops-githubactions',
        name: 'GitHub Actions',
        category: 'DEVOPS',
        description: 'CI/CD automation integrated with GitHub.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 82,
        complianceFit: 75,
        costProfile: 'LOW',
        skillsAvailability: 'HIGH',
        pros: ['Integrated with version control', 'Marketplace of reusable actions'],
        cons: ['Enterprise features require higher-tier plans']
      },
      {
        id: 'security-owaspasvs',
        name: 'OWASP ASVS Controls',
        category: 'SECURITY',
        description: 'Security verification standard for application security.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 75,
        complianceFit: 95,
        costProfile: 'LOW',
        skillsAvailability: 'MEDIUM',
        pros: ['Aligns with industry standards', 'Strong control coverage'],
        cons: ['Requires disciplined implementation']
      },
      {
        id: 'integration-mulesoft',
        name: 'MuleSoft Anypoint',
        category: 'INTEGRATION',
        description: 'Enterprise integration platform with API management.',
        maturity: 'ESTABLISHED',
        ecosystemScore: 80,
        complianceFit: 88,
        costProfile: 'HIGH',
        skillsAvailability: 'MEDIUM',
        pros: ['Unified API management', 'Prebuilt connectors'],
        cons: ['License cost', 'Specialized skills required']
      }
    ];
  }

  private evaluateTechnologyOption(
    option: TechnologyOption,
    requirements: TechnologyRequirement[],
    existingTechnologies: string[]
  ): TechnologyOption & { score: number; fit: 'HIGH' | 'MEDIUM' | 'LOW'; gapAnalysis: string[] } {
    const baseScore = this.scoreTechnologyOption(option, requirements);
    const familiarityBonus = existingTechnologies.some(tech => tech.toLowerCase() === option.name.toLowerCase()) ? 8 : 0;
    const totalScore = Math.min(100, Math.round(baseScore + familiarityBonus));
    const fit = totalScore >= 75 ? 'HIGH' : totalScore >= 55 ? 'MEDIUM' : 'LOW';
    const gapAnalysis = this.generateOptionGapAnalysis(option, requirements, existingTechnologies);

    return {
      ...option,
      score: totalScore,
      fit,
      gapAnalysis
    };
  }

  private scoreTechnologyOption(option: TechnologyOption, requirements: TechnologyRequirement[]): number {
    const relevantRequirements = requirements.filter(requirement => requirement.category === option.category);
    if (relevantRequirements.length === 0) {
      return option.ecosystemScore * 0.6 + option.complianceFit * 0.4;
    }

    const weightSum = relevantRequirements.reduce((sum, requirement) => sum + requirement.weight, 0);
    const weightedFit = relevantRequirements.reduce((sum, requirement) => {
      let fitMultiplier = 1;
      const description = requirement.description.toLowerCase();

      if (description.includes('regulatory') || description.includes('compliance')) {
        fitMultiplier += option.complianceFit / 100;
      }
      if (description.includes('time-to-market') || description.includes('speed')) {
        fitMultiplier += option.ecosystemScore / 120;
      }
      if (description.includes('cost') || description.includes('budget')) {
        fitMultiplier += option.costProfile === 'LOW' ? 0.4 : option.costProfile === 'MEDIUM' ? 0.2 : 0;
      }

      return sum + requirement.weight * fitMultiplier;
    }, 0);

    const base = option.ecosystemScore * 0.5 + option.complianceFit * 0.3 + (option.skillsAvailability === 'HIGH' ? 15 : option.skillsAvailability === 'MEDIUM' ? 8 : 0);
    return Math.min(100, base + (weightedFit / Math.max(weightSum, 1)) * 10);
  }

  private generateOptionGapAnalysis(
    option: TechnologyOption,
    requirements: TechnologyRequirement[],
    existingTechnologies: string[]
  ): string[] {
    const gaps: string[] = [];
    const relevantRequirements = requirements.filter(requirement => requirement.category === option.category);

    if (relevantRequirements.length === 0) {
      gaps.push('No explicit requirements captured for this category; validate alignment.');
    }

    if (option.costProfile === 'HIGH') {
      gaps.push('Higher cost profile may require additional budget approvals.');
    }

    if (!existingTechnologies.some(tech => tech.toLowerCase() === option.name.toLowerCase())) {
      gaps.push('Team training and onboarding plan required.');
    }

    return gaps;
  }

  private identifyStackRisks(
    recommendedStack: TechnologyOption[],
    requirements: TechnologyRequirement[]
  ): string[] {
    const risks: string[] = [];
    const highPriorityRequirements = requirements.filter(requirement => requirement.priority === 'MUST_HAVE');

    highPriorityRequirements.forEach(requirement => {
      if (!recommendedStack.some(option => option.category === requirement.category)) {
        risks.push(`No recommended technology covers must-have requirement: ${requirement.description}`);
      }
    });

    if (recommendedStack.some(option => option.costProfile === 'HIGH')) {
      risks.push('Portfolio contains high-cost components; establish cost monitoring.');
    }

    if (!recommendedStack.some(option => option.category === 'SECURITY')) {
      risks.push('Security tooling missing from recommended stack.');
    }

    return risks;
  }

  private generateStackMitigations(risks: string[]): string[] {
    if (risks.length === 0) {
      return ['Maintain quarterly architecture reviews to validate continued fit.'];
    }

    return risks.map(risk => {
      if (risk.includes('cost')) {
        return 'Implement FinOps guardrails and budget alerts for high-cost services.';
      }
      if (risk.includes('Security')) {
        return 'Introduce security automation (SAST/DAST) into delivery pipeline.';
      }
      if (risk.includes('must-have')) {
        return 'Capture additional options for the missing requirement and reassess.';
      }
      return 'Assign owner to develop mitigation plan for identified stack risk.';
    });
  }

  private estimateRampUpEffort(recommendedStack: TechnologyOption[], existingTechnologies: string[]): number {
    const newTechnologies = recommendedStack.filter(option => !existingTechnologies.some(tech => tech.toLowerCase() === option.name.toLowerCase()));
    return Math.max(2, newTechnologies.length * 3 + 2);
  }

  private generateDefaultMitigation(risk: RiskItem): RiskMitigation {
    const baseDueDate = new Date();
    baseDueDate.setDate(baseDueDate.getDate() + (risk.impact > 70 ? 30 : 60));

    return {
      id: `mitigation-${risk.id}`,
      riskId: risk.id,
      action: risk.mitigation?.[0] || 'Define mitigation plan',
      owner: risk.owner || 'Unassigned',
      status: 'PLANNED',
      dueDate: baseDueDate,
      progressPercentage: 0
    };
  }

  private calculateRiskRegisterSummary(risks: RiskItem[], mitigations: RiskMitigation[]): RiskRegister['summary'] {
    const openRisks = risks.filter(risk => risk.status === 'OPEN' || risk.status === 'MONITORING').length;
    const mitigatedRisks = risks.filter(risk => risk.status === 'MITIGATED').length;
    const acceptedRisks = risks.filter(risk => risk.status === 'ACCEPTED').length;
    const highSeverityOpen = risks.filter(risk => (risk.impact >= 70 || risk.probability >= 70) && risk.status === 'OPEN').length;
    const nextReviewDate = this.calculateNextReviewDate(mitigations);

    return {
      openRisks,
      mitigatedRisks,
      acceptedRisks,
      highSeverityOpen,
      nextReviewDate
    };
  }

  private calculateNextReviewDate(mitigations: RiskMitigation[]): Date {
    const upcoming = mitigations
      .filter(mitigation => mitigation.status !== 'COMPLETE')
      .map(mitigation => mitigation.dueDate)
      .sort((a, b) => a.getTime() - b.getTime());

    if (upcoming.length > 0) {
      return upcoming[0];
    }

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return defaultDate;
  }

  private generateRiskRegisterRecommendations(risks: RiskItem[], mitigations: RiskMitigation[]): string[] {
    const recommendations: string[] = [];
    const overdueMitigations = mitigations.filter(mitigation => mitigation.status !== 'COMPLETE' && mitigation.dueDate.getTime() < Date.now());

    if (overdueMitigations.length > 0) {
      recommendations.push(`Expedite ${overdueMitigations.length} overdue mitigation action(s).`);
    }

    const highRiskOpen = risks.filter(risk => risk.status === 'OPEN' && risk.riskScore >= 50);
    if (highRiskOpen.length > 0) {
      recommendations.push('Escalate high risk items to program steering committee.');
    }

    if (!recommendations.length) {
      recommendations.push('Maintain weekly monitoring of mitigation progress.');
    }

    return recommendations;
  }
}

