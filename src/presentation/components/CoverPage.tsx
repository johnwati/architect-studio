import React from 'react';
import { CoverPageSettings } from '../../domain/entities/Project';

interface CoverPageProps {
  projectName?: string;
  projectDescription?: string;
  version?: string;
  date?: string;
  settings?: CoverPageSettings;
}

const CoverPage: React.FC<CoverPageProps> = ({ 
  projectName = 'Solution Design Document',
  projectDescription = '',
  version = '1.0',
  date,
  settings
}) => {
  const displayDate = date || new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  const showOrangeLine = settings?.showOrangeLine !== false;
  const showOrganization = settings?.showOrganization !== false;
  const showProjectName = settings?.showProjectName !== false; // Default to true if not set
  const organizationName = settings?.organizationName || 'Equity Group Holdings PLC';
  const logoText = settings?.logoText || 'EQUITY';
  const footerText = settings?.footerText;

  return (
    <div className="cover-page bg-white min-h-[800px] flex flex-col items-center justify-center relative py-16" style={{ pageBreakAfter: 'always' }}>
      {/* Orange Vertical Line */}
      {showOrangeLine && (
        <div 
          className="absolute top-0 bottom-0 right-0"
          style={{
            width: '4px',
            backgroundColor: '#FF6B35',
            right: '20%'
          }}
        />
      )}
      
      {/* Logo Section - Removed */}

      {/* Document Title - Only show if showProjectName is true */}
      {showProjectName && (
        <div className="text-center mb-8" style={{ width: '80%', maxWidth: '600px' }}>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{projectName}</h2>
          {projectDescription && (
            <p className="text-xl text-gray-600 mb-6">{projectDescription}</p>
          )}
        </div>
      )}

      {/* Document Metadata - Removed */}

      {/* Footer Text - Removed */}
    </div>
  );
};

export default CoverPage;

