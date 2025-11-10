import { AlertCircle, CheckCircle2, FileCheck, XCircle } from 'lucide-react';
import React, { useMemo } from 'react';
import { GeneratedSectionEntity, ProjectEntity } from '../../domain/entities/Project';
import { SECTIONS } from '../../domain/services/sections';

interface ComplianceCheckerProps {
  project: ProjectEntity;
  sections: GeneratedSectionEntity[];
  generatedContent: { [sectionId: string]: string };
}

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  check: (project: ProjectEntity, sections: GeneratedSectionEntity[], content: { [sectionId: string]: string }) => ComplianceResult;
}

interface ComplianceResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({ project, sections, generatedContent }) => {
  const complianceRules: ComplianceRule[] = [
    {
      id: 'cover-page',
      name: 'Cover Page Required',
      description: 'Document must have a cover page with title and version',
      check: (proj) => {
        const hasCoverPage = proj.coverPageSettings !== undefined;
        return {
          passed: hasCoverPage,
          message: hasCoverPage 
            ? 'Cover page is configured'
            : 'Cover page settings are missing',
          severity: 'error'
        };
      }
    },
    {
      id: 'document-control',
      name: 'Document Control Section',
      description: 'Document must have document control information',
      check: (proj) => {
        const hasStatus = proj.status !== undefined;
        const hasVersion = proj.version !== undefined;
        return {
          passed: hasStatus && hasVersion,
          message: hasStatus && hasVersion
            ? 'Document control information is complete'
            : 'Missing document status or version',
          severity: 'error'
        };
      }
    },
    {
      id: 'required-sections',
      name: 'Required Sections',
      description: 'Key sections must be generated',
      check: (proj, secs, content) => {
        const requiredSections = ['introduction', 'architecture', 'security', 'data-architecture'];
        const missing = requiredSections.filter(id => !content[id]);
        const missingNames = missing.map(id => {
          const section = SECTIONS.find(s => s.id === id);
          return section ? section.title : id;
        });
        return {
          passed: missing.length === 0,
          message: missing.length === 0
            ? 'All required sections are generated'
            : `Missing sections: ${missingNames.join(', ')}`,
          severity: missing.length === 0 ? 'info' : 'error'
        };
      }
    },
    {
      id: 'content-quality',
      name: 'Content Quality',
      description: 'Generated sections should have substantial content',
      check: (proj, secs, content) => {
        const emptySections = Object.entries(content)
          .filter(([_, text]) => !text || text.trim().length < 100)
          .map(([id]) => id);
        
        return {
          passed: emptySections.length === 0,
          message: emptySections.length === 0
            ? 'All sections have adequate content'
            : `${emptySections.length} section(s) have minimal content`,
          severity: emptySections.length === 0 ? 'info' : 'warning'
        };
      }
    },
    {
      id: 'approvals',
      name: 'Approval Workflow',
      description: 'Document should have approvers assigned',
      check: (proj) => {
        // This would check if approvers exist - placeholder for now
        return {
          passed: proj.status === 'APPROVED' || proj.status === 'PUBLISHED',
          message: proj.status === 'APPROVED' || proj.status === 'PUBLISHED'
            ? 'Document has been approved'
            : 'Document requires approval',
          severity: 'warning'
        };
      }
    },
    {
      id: 'classification',
      name: 'Document Classification',
      description: 'Document should have classification label',
      check: (proj) => {
        return {
          passed: !!proj.documentClassification,
          message: proj.documentClassification
            ? `Document classified as: ${proj.documentClassification}`
            : 'Document classification is missing',
          severity: 'warning'
        };
      }
    },
    {
      id: 'banking-compliance',
      name: 'Banking Compliance',
      description: 'Document should reference banking standards (CBK, PCI-DSS, GDPR)',
      check: (proj, secs, content) => {
        const allContent = Object.values(content).join(' ').toLowerCase();
        const hasCBK = allContent.includes('cbk') || allContent.includes('central bank');
        const hasPCI = allContent.includes('pci') || allContent.includes('pci-dss');
        const hasGDPR = allContent.includes('gdpr') || allContent.includes('data protection');
        
        const complianceCount = [hasCBK, hasPCI, hasGDPR].filter(Boolean).length;
        
        return {
          passed: complianceCount >= 2,
          message: complianceCount >= 2
            ? `References ${complianceCount} banking standards`
            : `Should reference more banking standards (CBK, PCI-DSS, GDPR)`,
          severity: complianceCount >= 2 ? 'info' : 'warning'
        };
      }
    }
  ];

  const results = useMemo(() => {
    return complianceRules.map(rule => ({
      ...rule,
      result: rule.check(project, sections, generatedContent)
    }));
  }, [project, sections, generatedContent]);

  const passedCount = results.filter(r => r.result.passed).length;
  const errorCount = results.filter(r => !r.result.passed && r.result.severity === 'error').length;
  const warningCount = results.filter(r => !r.result.passed && r.result.severity === 'warning').length;

  const getIcon = (result: ComplianceResult) => {
    if (result.passed) {
      return <CheckCircle2 size={20} className="text-green-600" />;
    }
    if (result.severity === 'error') {
      return <XCircle size={20} className="text-red-600" />;
    }
    return <AlertCircle size={20} className="text-yellow-600" />;
  };

  const getColor = (result: ComplianceResult) => {
    if (result.passed) return 'bg-green-50 border-green-200';
    if (result.severity === 'error') return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <FileCheck className="text-red-700" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">Compliance Checker</h3>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{passedCount}</div>
          <div className="text-sm text-green-600">Passed</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{errorCount}</div>
          <div className="text-sm text-red-600">Errors</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
          <div className="text-sm text-yellow-600">Warnings</div>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-3">
        {results.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-lg border ${getColor(rule.result)}`}
          >
            <div className="flex items-start space-x-3">
              {getIcon(rule.result)}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">{rule.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                <p className={`text-sm font-medium ${
                  rule.result.passed 
                    ? 'text-green-700' 
                    : rule.result.severity === 'error' 
                      ? 'text-red-700' 
                      : 'text-yellow-700'
                }`}>
                  {rule.result.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Status */}
      <div className={`mt-6 p-4 rounded-lg border ${
        errorCount === 0 && warningCount === 0
          ? 'bg-green-50 border-green-200'
          : errorCount > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          {errorCount === 0 && warningCount === 0 ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className={errorCount > 0 ? 'text-red-600' : 'text-yellow-600'} />
          )}
          <p className={`font-semibold ${
            errorCount === 0 && warningCount === 0
              ? 'text-green-700'
              : errorCount > 0
                ? 'text-red-700'
                : 'text-yellow-700'
          }`}>
            {errorCount === 0 && warningCount === 0
              ? 'Document is compliant with all standards'
              : errorCount > 0
                ? `Document has ${errorCount} critical issue(s) that must be addressed`
                : `Document has ${warningCount} warning(s) that should be reviewed`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceChecker;

