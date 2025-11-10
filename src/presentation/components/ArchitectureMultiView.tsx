import {
    BarChart3,
    GitCompare,
    Layers,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import React, { useState } from 'react';
import { ArchitectureDiagram, HeatmapCell, HeatmapData } from '../../domain/entities/Architecture';
import { ProjectEntity } from '../../domain/entities/Project';

interface ArchitectureMultiViewProps {
  project: ProjectEntity | null;
  asIsDiagram?: ArchitectureDiagram;
  toBeDiagram?: ArchitectureDiagram;
  scenarioDiagrams?: ArchitectureDiagram[];
}

interface ComparisonResult {
  addedElements: number;
  removedElements: number;
  modifiedElements: number;
  costImpact: number;
  complexityImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  riskImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  performanceImpact: number;
}

const ArchitectureMultiView: React.FC<ArchitectureMultiViewProps> = ({
  project,
  asIsDiagram,
  toBeDiagram,
  scenarioDiagrams = [],
}) => {
  const [selectedComparison, setSelectedComparison] = useState<'AS_IS_TO_BE' | 'SCENARIO'>('AS_IS_TO_BE');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Generate comparison results
  const generateComparison = (): ComparisonResult => {
    if (!asIsDiagram || !toBeDiagram) {
      return {
        addedElements: 0,
        removedElements: 0,
        modifiedElements: 0,
        costImpact: 0,
        complexityImpact: 'LOW',
        riskImpact: 'LOW',
        performanceImpact: 0,
      };
    }

    const asIsNodes = asIsDiagram.canvasData?.nodes || [];
    const toBeNodes = toBeDiagram.canvasData?.nodes || [];

    const asIsIds = new Set(asIsNodes.map(n => n.id));
    const toBeIds = new Set(toBeNodes.map(n => n.id));

    const added = toBeNodes.filter(n => !asIsIds.has(n.id)).length;
    const removed = asIsNodes.filter(n => !toBeIds.has(n.id)).length;
    const modified = toBeNodes.filter(n => {
      if (!asIsIds.has(n.id)) return false;
      const asIsNode = asIsNodes.find(a => a.id === n.id);
      return JSON.stringify(asIsNode) !== JSON.stringify(n);
    }).length;

    // Calculate impacts (simplified - in production would use actual metrics)
    const costImpact = (added + modified) * 10000 + removed * 5000;
    const complexityImpact = added + modified > 10 ? 'HIGH' : added + modified > 5 ? 'MEDIUM' : 'LOW';
    const riskImpact = removed > 5 ? 'HIGH' : removed > 2 ? 'MEDIUM' : 'LOW';
    const performanceImpact = ((added - removed) / Math.max(asIsNodes.length, 1)) * 100;

    return {
      addedElements: added,
      removedElements: removed,
      modifiedElements: modified,
      costImpact,
      complexityImpact,
      riskImpact,
      performanceImpact,
    };
  };

  const comparison = generateComparison();

  // Generate heatmap data
  const generateHeatmap = (): HeatmapData => {
    const dimensions = ['Cost', 'Complexity', 'Risk', 'Performance', 'Timeline'];
    const scenarios = ['As-Is', 'To-Be', ...scenarioDiagrams.map(s => s.name)];
    
    const data: HeatmapCell[] = [];
    
    dimensions.forEach((dim, dimIdx) => {
      scenarios.forEach((scenario, scenIdx) => {
        let value = 0;
        if (dim === 'Cost') {
          value = scenIdx === 0 ? 50 : scenIdx === 1 ? 80 : 70;
        } else if (dim === 'Complexity') {
          value = scenIdx === 0 ? 60 : scenIdx === 1 ? 75 : 70;
        } else if (dim === 'Risk') {
          value = scenIdx === 0 ? 40 : scenIdx === 1 ? 55 : 50;
        } else if (dim === 'Performance') {
          value = scenIdx === 0 ? 70 : scenIdx === 1 ? 90 : 85;
        } else if (dim === 'Timeline') {
          value = scenIdx === 0 ? 50 : scenIdx === 1 ? 30 : 40;
        }
        
        data.push({
          x: dim,
          y: scenario,
          value,
          label: `${value}%`,
        });
      });
    });

    return { dimensions, data };
  };

  const heatmapData = generateHeatmap();

  if (!project) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <GitCompare size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600">Please select a project to view architecture comparisons</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GitCompare size={24} />
          <div>
            <h2 className="text-xl font-bold">Multi-View Architecture Comparison</h2>
            <p className="text-sm text-purple-100">As-Is / To-Be / Scenario Analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center space-x-2 bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <BarChart3 size={16} />
            <span>{showHeatmap ? 'Hide' : 'Show'} Heatmap</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Comparison Selector */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setSelectedComparison('AS_IS_TO_BE')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedComparison === 'AS_IS_TO_BE'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            As-Is vs To-Be
          </button>
          {scenarioDiagrams.length > 0 && (
            <button
              onClick={() => setSelectedComparison('SCENARIO')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedComparison === 'SCENARIO'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Scenario Comparison
            </button>
          )}
        </div>

        {/* Comparison Results */}
        {selectedComparison === 'AS_IS_TO_BE' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">Added Elements</span>
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700">{comparison.addedElements}</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-800">Removed Elements</span>
                  <TrendingDown size={20} className="text-red-600" />
                </div>
                <div className="text-3xl font-bold text-red-700">{comparison.removedElements}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800">Modified Elements</span>
                  <Layers size={20} className="text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-yellow-700">{comparison.modifiedElements}</div>
              </div>
            </div>

            {/* Impact Analysis */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Impact Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Cost Impact</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${comparison.costImpact.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min(comparison.costImpact / 100000 * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Complexity Impact</span>
                    <span className={`text-lg font-bold ${
                      comparison.complexityImpact === 'HIGH' ? 'text-red-600' :
                      comparison.complexityImpact === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {comparison.complexityImpact}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        comparison.complexityImpact === 'HIGH' ? 'bg-red-600' :
                        comparison.complexityImpact === 'MEDIUM' ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{
                        width: comparison.complexityImpact === 'HIGH' ? '100%' :
                               comparison.complexityImpact === 'MEDIUM' ? '66%' : '33%'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Risk Impact</span>
                    <span className={`text-lg font-bold ${
                      comparison.riskImpact === 'CRITICAL' ? 'text-red-700' :
                      comparison.riskImpact === 'HIGH' ? 'text-red-600' :
                      comparison.riskImpact === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {comparison.riskImpact}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        comparison.riskImpact === 'CRITICAL' ? 'bg-red-700' :
                        comparison.riskImpact === 'HIGH' ? 'bg-red-600' :
                        comparison.riskImpact === 'MEDIUM' ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{
                        width: comparison.riskImpact === 'CRITICAL' ? '100%' :
                               comparison.riskImpact === 'HIGH' ? '75%' :
                               comparison.riskImpact === 'MEDIUM' ? '50%' : '25%'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Performance Impact</span>
                    <span className={`text-lg font-bold ${
                      comparison.performanceImpact > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {comparison.performanceImpact > 0 ? '+' : ''}{comparison.performanceImpact.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        comparison.performanceImpact > 0 ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(Math.abs(comparison.performanceImpact), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scenario Comparison */}
        {selectedComparison === 'SCENARIO' && scenarioDiagrams.length > 0 && (
          <div className="space-y-4">
            {scenarioDiagrams.map(scenario => (
              <div
                key={scenario.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => setSelectedScenario(selectedScenario === scenario.id ? null : scenario.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">{scenario.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Elements</div>
                    <div className="text-lg font-bold text-gray-800">
                      {scenario.canvasData?.nodes?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Heatmap Visualization */}
        {showHeatmap && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Impact Heatmap</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 font-semibold text-gray-700">Dimension</th>
                    {heatmapData.data
                      .filter((cell, idx, arr) => arr.findIndex(c => c.y === cell.y) === idx)
                      .map(cell => (
                        <th key={cell.y} className="text-center p-2 font-semibold text-gray-700 min-w-[100px]">
                          {cell.y}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.dimensions.map(dim => (
                    <tr key={dim}>
                      <td className="p-2 font-medium text-gray-700">{dim}</td>
                      {heatmapData.data
                        .filter(cell => cell.x === dim)
                        .map(cell => {
                          const intensity = cell.value / 100;
                          const bgColor = intensity > 0.7 ? 'bg-red-500' :
                                         intensity > 0.5 ? 'bg-yellow-500' :
                                         'bg-green-500';
                          return (
                            <td key={`${cell.x}-${cell.y}`} className="p-2 text-center">
                              <div
                                className={`${bgColor} text-white rounded px-2 py-1 inline-block font-semibold`}
                                style={{ opacity: 0.7 + intensity * 0.3 }}
                              >
                                {cell.label}
                              </div>
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectureMultiView;

