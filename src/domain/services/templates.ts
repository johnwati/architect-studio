import { Section } from '../entities/Section';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'SDD' | 'ISD' | 'BRD' | 'FSD';
  sections: Section[];
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'sdd-template',
    name: 'Solution Design Document (SDD)',
    description: 'Comprehensive solution architecture design document for enterprise solutions',
    type: 'SDD',
    sections: [
      {
        id: 'cover-page',
        title: 'Cover Page',
        subsections: [
          { number: '', title: 'Document Title', description: 'The main title of the Solution Design Document' },
          { number: '', title: 'Project Information', description: 'Project name, description, and basic details' },
          { number: '', title: 'Version and Date', description: 'Document version number and publication date' },
          { number: '', title: 'Organization Details', description: 'Organization name, logo, and branding information' }
        ]
      },
      {
        id: 'document-control',
        title: 'Document Control',
        subsections: [
          { number: '', title: 'Document Information', description: 'Document metadata including title, ID, version, classification, owner, and status' },
          { number: '', title: 'Version History', description: 'Complete version history with dates, authors, changes made, and status for each version' },
          { number: '', title: 'Distribution List', description: 'List of individuals who receive the document, including their name, role, department, and email' },
          { number: '', title: 'Review & Approval', description: 'Review and approval workflow with role, name, date, and signature/approval for each reviewer' }
        ]
      },
      {
        id: 'table-of-contents',
        title: 'Table of Contents',
        subsections: []
      },
      {
        id: 'introduction',
        title: 'Introduction',
        subsections: [
          { number: '', title: 'Problem Statement', description: 'Describe the specific business problem or challenge that this solution addresses' },
          { number: '', title: 'Solution Overview', description: 'High-level summary of the proposed solution and its approach' },
          { number: '', title: 'Scope', description: 'Define the boundaries and extent of the solution, including what is included and excluded' },
          { number: '', title: 'Master Data Domains In Scope', description: 'Identify which master data domains (e.g., Customer, Product, Account) are included in this solution' },
          { number: '', title: 'Applications In Scope', description: 'List all applications and systems that are part of the solution scope' },
          { number: '', title: 'Countries In Scope', description: 'Specify the geographical scope including countries and regions covered by this solution' }
        ]
      },
      {
        id: 'constraints-assumptions',
        title: 'Design Constraints, Assumptions, Dependencies and Risks',
        subsections: [
          { number: '', title: 'Design Constraints', description: 'Technical, business, regulatory, or organizational limitations that constrain the solution design' },
          { number: '', title: 'Assumptions', description: 'Key assumptions made during the design phase that the solution depends upon' },
          { number: '', title: 'Dependencies', description: 'External dependencies, prerequisites, and systems that must be in place for the solution to succeed' },
          { number: '', title: 'Risks', description: 'Potential risks that could impact the project, their likelihood, and mitigation strategies' },
          { number: '', title: 'Loading', description: 'Expected data volumes, transaction loads, and system capacity requirements' }
        ]
      },
      {
        id: 'business-capabilities',
        title: 'Business Capabilities',
        subsections: [
          { number: '', title: 'Party Management', description: 'Capabilities for managing parties (customers, vendors, partners) including creation, updates, and lifecycle management' },
          { number: '', title: 'Identity Management', description: 'Identity verification, authentication, and authorization capabilities' },
          { number: '', title: 'Product Management', description: 'Product definition, configuration, and management capabilities' },
          { number: '', title: 'Data Quality Management', description: 'Data validation, cleansing, enrichment, and quality monitoring capabilities' },
          { number: '', title: 'Data Synchronization', description: 'Capabilities for synchronizing data across systems, domains, and applications' }
        ]
      },
      {
        id: 'requirements',
        title: 'Requirements',
        subsections: [
          { number: '', title: 'Functional Requirements', description: 'Specific capabilities the system must provide' },
          { number: '', title: 'Non-Functional Requirements', description: 'Performance, security, scalability, and availability requirements' },
          { number: '', title: 'Constraints', description: 'Technical, regulatory, budgetary, or organizational limitations' }
        ]
      },
      {
        id: 'architecture',
        title: 'Solution Architecture',
        subsections: [
          { number: '', title: 'Architecture Overview', description: 'High-level architecture diagram and conceptual design' },
          { number: '', title: 'Component Design', description: 'Detailed breakdown of system components and their responsibilities' },
          { number: '', title: 'Integration Points', description: 'How components interact internally and with external systems (include sequence diagrams)' },
          { number: '', title: 'Data Architecture', description: 'Data models, storage strategy, and data flow patterns' },
          { number: '', title: 'Application Architecture', description: 'Application layers, tiers, and structural organization' }
        ]
      },
      {
        id: 'data-architecture',
        title: 'Data Architecture',
        subsections: [
          { number: '', title: 'Overview', description: 'High-level data architecture strategy and guiding principles' },
          { number: '', title: 'Logical Data Domains', description: 'Logical grouping of data organized by business domain' },
          { number: '', title: 'Core Data Relationships', description: 'Entity relationship diagrams and key data relationships' },
          { number: '', title: 'Data Flow Summary', description: 'Use case specific data flows with detailed sequence diagrams' },
          { number: '', title: 'Data Storage Architecture', description: 'Database design, storage solutions, and persistence strategy' },
          { number: '', title: 'Data Security & Compliance', description: 'Data encryption, masking, access controls, and regulatory compliance' },
          { number: '', title: 'Data Retention Plan', description: 'Data lifecycle management, archival policies, and deletion procedures' }
        ]
      },
      {
        id: 'master-data',
        title: 'Master Data Management',
        subsections: [
          { number: '', title: 'Master Data Entities', description: 'Key master data entities, their definitions, and attributes' },
          { number: '', title: 'Data Governance', description: 'Data ownership, stewardship roles, and governance framework' },
          { number: '', title: 'Data Quality Standards', description: 'Validation rules, quality metrics, and monitoring procedures' },
          { number: '', title: 'Data Lifecycle Management', description: 'Processes for data creation, updates, archival, and deletion' }
        ]
      },
      {
        id: 'security',
        title: 'Security Architecture',
        subsections: [
          { number: '', title: 'Security Layers and Compliance Mapping', description: 'Multi-layered security approach mapped to regulatory requirements' },
          { number: '', title: 'Security Controls Mapping to Use Cases', description: 'Specific security controls applied to each business use case' },
          { number: '', title: 'Compliance and Governance', description: 'Regulatory compliance requirements including PCI-DSS, GDPR, and CBK guidelines' }
        ]
      },
      {
        id: 'infrastructure',
        title: 'Infrastructure Architecture',
        subsections: [
          { number: '', title: 'Infrastructure Components', description: 'Compute resources, storage enhancements, monitoring tools, and security tooling' },
          { number: '', title: 'Compute and Storage Enhancements', description: 'Server specifications, compute resources, and storage solutions' },
          { number: '', title: 'Monitoring, Observability, and Security Tooling', description: 'Monitoring platforms, logging systems, and observability tools' },
          { number: '', title: 'Identity, Access, and Compliance Controls', description: 'IAM solutions, access management, and authentication mechanisms' },
          { number: '', title: 'Deployment Architecture', description: 'Cloud and on-premise infrastructure with partner integrations' },
          { number: '', title: 'Cloud Layer', description: 'Cloud infrastructure, services, and deployment configurations' },
          { number: '', title: 'On-Premise Layer', description: 'On-premise infrastructure and hybrid connectivity approaches' },
          { number: '', title: 'Partner and Third-Party Integrations', description: 'External partner systems and integration architecture patterns' },
          { number: '', title: 'Network Architecture', description: 'Network connectivity, traffic flows, and security segmentation' },
          { number: '', title: 'Connectivity', description: 'Network connectivity approaches including VPN, direct connect, and bandwidth allocation' },
          { number: '', title: 'Traffic Flow Summary', description: 'Network traffic patterns and detailed flow diagrams' },
          { number: '', title: 'Network Security and Segmentation', description: 'Firewalls, DMZ configuration, network zones, and micro-segmentation strategy' }
        ]
      },
      {
        id: 'implementation',
        title: 'Implementation Architecture',
        subsections: [
          { number: '', title: 'Implementation Layers', description: 'Presentation, business logic, and data access layers with interaction patterns' },
          { number: '', title: 'Capability Mapping', description: 'Business capabilities mapped to technical components and services' },
          { number: '', title: 'Summary of Approach', description: 'Overall implementation strategy, methodology, and development approach' },
          { number: '', title: 'Key Considerations', description: 'Critical implementation factors, risks, and decision points' }
        ]
      },
      {
        id: 'traceability',
        title: 'Traceability Matrix',
        subsections: [
          { number: '', title: 'Functional Requirements Traceability', description: 'Complete mapping of requirements to design components, use cases, and test cases' }
        ]
      },
      {
        id: 'resources',
        title: 'Resource Requirements',
        subsections: [
          { number: '', title: 'Human Resources', description: 'Team composition, roles, required skills, FTE allocation, and engagement duration' },
          { number: '', title: 'System Resources', description: 'Hardware, software, infrastructure, and tooling resource requirements' }
        ]
      },
      {
        id: 'deployment',
        title: 'Deployment Strategy',
        subsections: [
          { number: '', title: 'Deployment Approach', description: 'Deployment strategy including phased rollout, big bang, or hybrid approach' },
          { number: '', title: 'Environment Strategy', description: 'Development, testing, staging, and production environment configuration' },
          { number: '', title: 'Migration Plan', description: 'Detailed data and system migration approach with rollback procedures' }
        ]
      },
      {
        id: 'risks',
        title: 'Risks & Mitigations',
        subsections: [
          { number: '', title: 'Risk Assessment', description: 'Comprehensive risk analysis with impact, probability, and mitigation strategies' }
        ]
      },
      {
        id: 'timeline',
        title: 'Timeline & Milestones',
        subsections: [
          { number: '', title: 'Project Timeline', description: 'Detailed project phases, milestones, target dates, dependencies, and current status' }
        ]
      },
      {
        id: 'technology',
        title: 'Technology Stack',
        subsections: [
          { number: '', title: 'Application Layer', description: 'Frontend frameworks, backend platforms, programming languages, and development tools' },
          { number: '', title: 'Database & Storage', description: 'Database management systems, data warehouses, caching solutions, and file storage' },
          { number: '', title: 'Infrastructure', description: 'Cloud providers, server infrastructure, networking components, and containerization' },
          { number: '', title: 'Third-Party Services & APIs', description: 'External integrations, service dependencies, and API specifications' }
        ]
      },
      {
        id: 'operations',
        title: 'Operations & Support',
        subsections: [
          { number: '', title: 'Monitoring & Alerting', description: 'System monitoring tools, alerting mechanisms, and operational dashboards' },
          { number: '', title: 'Logging Strategy', description: 'Application and system logging approach, log aggregation, and retention policies' },
          { number: '', title: 'Backup & Recovery', description: 'Backup procedures, recovery point objectives, recovery time objectives, and disaster recovery plan' },
          { number: '', title: 'Support Model', description: 'Support tiers, escalation procedures, service level agreements, and support processes' },
          { number: '', title: 'Maintenance Windows', description: 'Planned maintenance schedules, change management procedures, and communication protocols' }
        ]
      },
      {
        id: 'testing',
        title: 'Testing Strategy',
        subsections: [
          { number: '', title: 'Test Approach', description: 'Overall testing methodology, philosophy, and quality assurance framework' },
          { number: '', title: 'Test Types', description: 'Unit testing, integration testing, system testing, UAT, performance testing, and security testing' },
          { number: '', title: 'Test Environments', description: 'Test environment configuration, setup procedures, and data management' },
          { number: '', title: 'Test Data Strategy', description: 'Test data creation, management, privacy considerations, and data masking approaches' }
        ]
      },
      {
        id: 'training',
        title: 'Training & Change Management',
        subsections: [
          { number: '', title: 'Training Strategy', description: 'Training approach for different user groups, delivery methods, and schedule' },
          { number: '', title: 'Training Materials', description: 'Documentation, user guides, video tutorials, workshops, and reference materials' },
          { number: '', title: 'Change Management', description: 'Communication plan, stakeholder engagement strategy, and adoption roadmap' },
          { number: '', title: 'Knowledge Transfer', description: 'Transition plan for operations teams, support teams, and knowledge retention' }
        ]
      },
      {
        id: 'costs',
        title: 'Cost & Budget',
        subsections: [
          { number: '', title: 'Implementation Costs', description: 'Development costs, infrastructure investment, licensing fees, and consulting expenses' },
          { number: '', title: 'Operational Costs', description: 'Ongoing hosting costs, maintenance fees, support costs, and subscription expenses' },
          { number: '', title: 'ROI Analysis', description: 'Expected return on investment, payback period, and financial benefits' },
          { number: '', title: 'Cost Optimization', description: 'Strategies for managing and reducing costs throughout the project lifecycle' }
        ]
      },
      {
        id: 'assumptions',
        title: 'Assumptions & Dependencies',
        subsections: [
          { number: '', title: 'Assumptions', description: 'Key assumptions made during solution design and their potential impact' },
          { number: '', title: 'Dependencies', description: 'External dependencies, prerequisites for success, and dependency management' },
          { number: '', title: 'Constraints', description: 'Technical, budgetary, regulatory, and organizational constraints' }
        ]
      },
      {
        id: 'alternatives',
        title: 'Alternative Solutions Considered',
        subsections: [
          { number: '', title: 'Alternative Approaches', description: 'Other solution approaches that were evaluated during the design phase' },
          { number: '', title: 'Comparison Analysis', description: 'Detailed comparison of alternatives including pros, cons, and trade-offs' },
          { number: '', title: 'Decision Rationale', description: 'Justification for the recommended solution based on evaluation criteria' }
        ]
      },
      {
        id: 'appendix',
        title: 'Appendix',
        subsections: [
          { number: '', title: 'Glossary', description: 'Definitions of technical terms and business terminology' },
          { number: '', title: 'References', description: 'Related documents, standards, and external resources' },
          { number: '', title: 'Acronyms', description: 'List of acronyms and abbreviations used throughout the document' },
          { number: '', title: 'Supporting Documentation', description: 'Links to technical specifications, wireframes, user stories, and sequence diagrams' }
        ]
      }
    ]
  },
  {
    id: 'isd-template',
    name: 'Information System Design (ISD)',
    description: 'Detailed information system design document covering system architecture, data flows, and technical specifications',
    type: 'ISD',
    sections: [
      {
        id: 'cover-page',
        title: 'Cover Page',
        subsections: [
          { number: '', title: 'Document Title', description: 'The main title of the Information System Design Document' },
          { number: '', title: 'System Information', description: 'System name, description, and basic details' },
          { number: '', title: 'Version and Date', description: 'Document version number and publication date' }
        ]
      },
      {
        id: 'document-control',
        title: 'Document Control',
        subsections: [
          { number: '', title: 'Document Information', description: 'Document metadata including title, ID, version, classification, owner, and status' },
          { number: '', title: 'Version History', description: 'Complete version history with dates, authors, changes made, and status for each version' },
          { number: '', title: 'Distribution List', description: 'List of individuals who receive the document' },
          { number: '', title: 'Review & Approval', description: 'Review and approval workflow' }
        ]
      },
      {
        id: 'table-of-contents',
        title: 'Table of Contents',
        subsections: []
      },
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        subsections: [
          { number: '', title: 'Overview', description: 'High-level summary of the information system design' },
          { number: '', title: 'Key Objectives', description: 'Primary objectives and goals of the system' },
          { number: '', title: 'Business Value', description: 'Business value and benefits expected from the system' }
        ]
      },
      {
        id: 'system-overview',
        title: 'System Overview',
        subsections: [
          { number: '', title: 'System Purpose', description: 'Purpose and objectives of the information system' },
          { number: '', title: 'System Scope', description: 'Boundaries and extent of the system' },
          { number: '', title: 'System Context', description: 'System context and interaction with other systems' },
          { number: '', title: 'Stakeholders', description: 'Key stakeholders and their roles' }
        ]
      },
      {
        id: 'functional-requirements',
        title: 'Functional Requirements',
        subsections: [
          { number: '', title: 'Business Process Requirements', description: 'Functional requirements related to business processes' },
          { number: '', title: 'Data Management Requirements', description: 'Requirements for data creation, storage, retrieval, and management' },
          { number: '', title: 'User Interface Requirements', description: 'UI/UX requirements and user interaction patterns' },
          { number: '', title: 'Integration Requirements', description: 'Requirements for system integrations and data exchange' },
          { number: '', title: 'Reporting Requirements', description: 'Requirements for reporting and analytics capabilities' }
        ]
      },
      {
        id: 'non-functional-requirements',
        title: 'Non-Functional Requirements',
        subsections: [
          { number: '', title: 'Performance Requirements', description: 'Performance criteria including response times, throughput, and scalability' },
          { number: '', title: 'Security Requirements', description: 'Security requirements including authentication, authorization, and data protection' },
          { number: '', title: 'Reliability Requirements', description: 'Availability, fault tolerance, and disaster recovery requirements' },
          { number: '', title: 'Usability Requirements', description: 'User experience and accessibility requirements' },
          { number: '', title: 'Maintainability Requirements', description: 'Requirements for system maintenance and supportability' }
        ]
      },
      {
        id: 'system-architecture',
        title: 'System Architecture',
        subsections: [
          { number: '', title: 'Architectural Overview', description: 'High-level system architecture and design patterns' },
          { number: '', title: 'System Components', description: 'Major system components and their responsibilities' },
          { number: '', title: 'Component Interactions', description: 'How components interact and communicate' },
          { number: '', title: 'Deployment Architecture', description: 'Deployment topology and infrastructure layout' }
        ]
      },
      {
        id: 'data-design',
        title: 'Data Design',
        subsections: [
          { number: '', title: 'Data Model', description: 'Logical and physical data models' },
          { number: '', title: 'Database Design', description: 'Database schema, tables, relationships, and constraints' },
          { number: '', title: 'Data Flow', description: 'Data flow diagrams and data transformation processes' },
          { number: '', title: 'Data Migration', description: 'Data migration strategy and approach' }
        ]
      },
      {
        id: 'interface-design',
        title: 'Interface Design',
        subsections: [
          { number: '', title: 'User Interface Design', description: 'UI mockups, wireframes, and user interaction flows' },
          { number: '', title: 'API Design', description: 'API specifications, endpoints, and data contracts' },
          { number: '', title: 'Integration Interfaces', description: 'Interfaces for external system integrations' }
        ]
      },
      {
        id: 'security-design',
        title: 'Security Design',
        subsections: [
          { number: '', title: 'Security Architecture', description: 'Security architecture and controls' },
          { number: '', title: 'Authentication & Authorization', description: 'Authentication and authorization mechanisms' },
          { number: '', title: 'Data Protection', description: 'Data encryption, masking, and protection strategies' },
          { number: '', title: 'Audit & Compliance', description: 'Audit logging and compliance requirements' }
        ]
      },
      {
        id: 'testing-strategy',
        title: 'Testing Strategy',
        subsections: [
          { number: '', title: 'Test Approach', description: 'Overall testing methodology and approach' },
          { number: '', title: 'Test Planning', description: 'Test plans, test cases, and test scenarios' },
          { number: '', title: 'Test Environments', description: 'Test environment setup and configuration' }
        ]
      },
      {
        id: 'implementation-plan',
        title: 'Implementation Plan',
        subsections: [
          { number: '', title: 'Implementation Phases', description: 'Phased implementation approach and milestones' },
          { number: '', title: 'Resource Requirements', description: 'Human and technical resources needed' },
          { number: '', title: 'Timeline', description: 'Project timeline and key milestones' },
          { number: '', title: 'Risk Management', description: 'Risk assessment and mitigation strategies' }
        ]
      }
    ]
  },
  {
    id: 'brd-template',
    name: 'Business Requirements Document (BRD)',
    description: 'Business requirements document outlining business needs, objectives, and functional requirements',
    type: 'BRD',
    sections: [
      {
        id: 'cover-page',
        title: 'Cover Page',
        subsections: [
          { number: '', title: 'Document Title', description: 'The main title of the Business Requirements Document' },
          { number: '', title: 'Project Information', description: 'Project name, description, and basic details' },
          { number: '', title: 'Version and Date', description: 'Document version number and publication date' }
        ]
      },
      {
        id: 'document-control',
        title: 'Document Control',
        subsections: [
          { number: '', title: 'Document Information', description: 'Document metadata' },
          { number: '', title: 'Version History', description: 'Version history tracking' },
          { number: '', title: 'Distribution List', description: 'Document distribution list' },
          { number: '', title: 'Review & Approval', description: 'Review and approval workflow' }
        ]
      },
      {
        id: 'table-of-contents',
        title: 'Table of Contents',
        subsections: []
      },
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        subsections: [
          { number: '', title: 'Business Need', description: 'High-level business need driving this initiative' },
          { number: '', title: 'Proposed Solution', description: 'Overview of the proposed solution' },
          { number: '', title: 'Expected Benefits', description: 'Expected business benefits and value' },
          { number: '', title: 'Key Recommendations', description: 'Key recommendations and next steps' }
        ]
      },
      {
        id: 'business-background',
        title: 'Business Background',
        subsections: [
          { number: '', title: 'Business Context', description: 'Business context and background information' },
          { number: '', title: 'Current State', description: 'Current state analysis and pain points' },
          { number: '', title: 'Business Drivers', description: 'Business drivers and motivations for change' },
          { number: '', title: 'Strategic Alignment', description: 'Alignment with business strategy and objectives' }
        ]
      },
      {
        id: 'business-objectives',
        title: 'Business Objectives',
        subsections: [
          { number: '', title: 'Primary Objectives', description: 'Primary business objectives and goals' },
          { number: '', title: 'Success Criteria', description: 'Success criteria and key performance indicators' },
          { number: '', title: 'Business Value', description: 'Expected business value and return on investment' }
        ]
      },
      {
        id: 'stakeholders',
        title: 'Stakeholders',
        subsections: [
          { number: '', title: 'Stakeholder Identification', description: 'Key stakeholders and their roles' },
          { number: '', title: 'Stakeholder Requirements', description: 'Requirements from different stakeholder groups' },
          { number: '', title: 'Stakeholder Communication Plan', description: 'Communication strategy for stakeholders' }
        ]
      },
      {
        id: 'business-processes',
        title: 'Business Processes',
        subsections: [
          { number: '', title: 'Current Process Analysis', description: 'Analysis of current business processes' },
          { number: '', title: 'Process Improvements', description: 'Proposed process improvements and optimizations' },
          { number: '', title: 'Future State Processes', description: 'Desired future state business processes' },
          { number: '', title: 'Process Flow Diagrams', description: 'Business process flow diagrams and workflows' }
        ]
      },
      {
        id: 'functional-requirements',
        title: 'Functional Requirements',
        subsections: [
          { number: '', title: 'Core Functional Requirements', description: 'Core functional capabilities required' },
          { number: '', title: 'Data Requirements', description: 'Data requirements and data management needs' },
          { number: '', title: 'Reporting Requirements', description: 'Reporting and analytics requirements' },
          { number: '', title: 'Integration Requirements', description: 'Integration requirements with other systems' }
        ]
      },
      {
        id: 'non-functional-requirements',
        title: 'Non-Functional Requirements',
        subsections: [
          { number: '', title: 'Performance Requirements', description: 'Performance and scalability requirements' },
          { number: '', title: 'Security Requirements', description: 'Security and compliance requirements' },
          { number: '', title: 'Usability Requirements', description: 'User experience and usability requirements' },
          { number: '', title: 'Availability Requirements', description: 'Availability and reliability requirements' }
        ]
      },
      {
        id: 'constraints',
        title: 'Constraints and Assumptions',
        subsections: [
          { number: '', title: 'Business Constraints', description: 'Business constraints and limitations' },
          { number: '', title: 'Technical Constraints', description: 'Technical constraints and limitations' },
          { number: '', title: 'Regulatory Constraints', description: 'Regulatory and compliance constraints' },
          { number: '', title: 'Assumptions', description: 'Key assumptions made during requirements gathering' }
        ]
      },
      {
        id: 'risks',
        title: 'Risks and Dependencies',
        subsections: [
          { number: '', title: 'Business Risks', description: 'Business risks and their potential impact' },
          { number: '', title: 'Technical Risks', description: 'Technical risks and mitigation strategies' },
          { number: '', title: 'Dependencies', description: 'External dependencies and prerequisites' }
        ]
      },
      {
        id: 'implementation-considerations',
        title: 'Implementation Considerations',
        subsections: [
          { number: '', title: 'Implementation Approach', description: 'High-level implementation approach and methodology' },
          { number: '', title: 'Resource Requirements', description: 'Resource requirements and team structure' },
          { number: '', title: 'Timeline Considerations', description: 'Timeline and milestone considerations' }
        ]
      },
      {
        id: 'success-metrics',
        title: 'Success Metrics',
        subsections: [
          { number: '', title: 'Key Performance Indicators', description: 'KPIs and success metrics' },
          { number: '', title: 'Measurement Approach', description: 'How success will be measured and tracked' }
        ]
      }
    ]
  },
  {
    id: 'fsd-template',
    name: 'Functional Specification Document (FSD)',
    description: 'Detailed functional specification document describing system functionality, user interfaces, and technical specifications',
    type: 'FSD',
    sections: [
      {
        id: 'cover-page',
        title: 'Cover Page',
        subsections: [
          { number: '', title: 'Document Title', description: 'The main title of the Functional Specification Document' },
          { number: '', title: 'System Information', description: 'System name, description, and basic details' },
          { number: '', title: 'Version and Date', description: 'Document version number and publication date' }
        ]
      },
      {
        id: 'document-control',
        title: 'Document Control',
        subsections: [
          { number: '', title: 'Document Information', description: 'Document metadata' },
          { number: '', title: 'Version History', description: 'Version history tracking' },
          { number: '', title: 'Distribution List', description: 'Document distribution list' },
          { number: '', title: 'Review & Approval', description: 'Review and approval workflow' }
        ]
      },
      {
        id: 'table-of-contents',
        title: 'Table of Contents',
        subsections: []
      },
      {
        id: 'introduction',
        title: 'Introduction',
        subsections: [
          { number: '', title: 'Purpose', description: 'Purpose of this functional specification document' },
          { number: '', title: 'Scope', description: 'Scope of the system and functionality covered' },
          { number: '', title: 'Document Overview', description: 'Overview of document structure and contents' },
          { number: '', title: 'Definitions and Acronyms', description: 'Key definitions and acronyms used in the document' }
        ]
      },
      {
        id: 'system-overview',
        title: 'System Overview',
        subsections: [
          { number: '', title: 'System Description', description: 'High-level system description and purpose' },
          { number: '', title: 'System Context', description: 'System context and interaction with other systems' },
          { number: '', title: 'User Roles', description: 'User roles and their responsibilities' }
        ]
      },
      {
        id: 'functional-specifications',
        title: 'Functional Specifications',
        subsections: [
          { number: '', title: 'Functional Overview', description: 'Overview of functional capabilities' },
          { number: '', title: 'Core Functions', description: 'Core functional specifications and capabilities' },
          { number: '', title: 'Data Management Functions', description: 'Data management and processing functions' },
          { number: '', title: 'Reporting Functions', description: 'Reporting and analytics functions' },
          { number: '', title: 'Integration Functions', description: 'Integration and data exchange functions' }
        ]
      },
      {
        id: 'user-interface-specifications',
        title: 'User Interface Specifications',
        subsections: [
          { number: '', title: 'UI Overview', description: 'Overview of user interface design and principles' },
          { number: '', title: 'Screen Specifications', description: 'Detailed screen specifications and layouts' },
          { number: '', title: 'User Interaction Flows', description: 'User interaction flows and navigation patterns' },
          { number: '', title: 'UI Components', description: 'UI components and their specifications' }
        ]
      },
      {
        id: 'data-specifications',
        title: 'Data Specifications',
        subsections: [
          { number: '', title: 'Data Model', description: 'Logical data model and entity relationships' },
          { number: '', title: 'Data Elements', description: 'Detailed data elements and their attributes' },
          { number: '', title: 'Data Validation Rules', description: 'Data validation rules and business rules' },
          { number: '', title: 'Data Flow', description: 'Data flow and transformation specifications' }
        ]
      },
      {
        id: 'business-rules',
        title: 'Business Rules',
        subsections: [
          { number: '', title: 'Business Rule Catalog', description: 'Catalog of business rules and their specifications' },
          { number: '', title: 'Rule Implementation', description: 'How business rules are implemented in the system' },
          { number: '', title: 'Rule Exceptions', description: 'Exception handling and special cases' }
        ]
      },
      {
        id: 'integration-specifications',
        title: 'Integration Specifications',
        subsections: [
          { number: '', title: 'Integration Overview', description: 'Overview of system integrations' },
          { number: '', title: 'API Specifications', description: 'API specifications and endpoints' },
          { number: '', title: 'Data Exchange Formats', description: 'Data exchange formats and protocols' },
          { number: '', title: 'Integration Patterns', description: 'Integration patterns and approaches' }
        ]
      },
      {
        id: 'security-specifications',
        title: 'Security Specifications',
        subsections: [
          { number: '', title: 'Security Requirements', description: 'Security requirements and controls' },
          { number: '', title: 'Access Control', description: 'Access control mechanisms and authorization rules' },
          { number: '', title: 'Data Protection', description: 'Data protection and encryption requirements' }
        ]
      },
      {
        id: 'performance-specifications',
        title: 'Performance Specifications',
        subsections: [
          { number: '', title: 'Performance Requirements', description: 'Performance criteria and requirements' },
          { number: '', title: 'Scalability Requirements', description: 'Scalability and capacity requirements' },
          { number: '', title: 'Response Time Requirements', description: 'Response time and throughput requirements' }
        ]
      },
      {
        id: 'error-handling',
        title: 'Error Handling',
        subsections: [
          { number: '', title: 'Error Handling Strategy', description: 'Overall error handling strategy and approach' },
          { number: '', title: 'Error Messages', description: 'Error message specifications and user feedback' },
          { number: '', title: 'Exception Handling', description: 'Exception handling and recovery procedures' }
        ]
      },
      {
        id: 'testing-requirements',
        title: 'Testing Requirements',
        subsections: [
          { number: '', title: 'Test Scenarios', description: 'Test scenarios and use cases for validation' },
          { number: '', title: 'Acceptance Criteria', description: 'Acceptance criteria for functional requirements' }
        ]
      },
      {
        id: 'appendix',
        title: 'Appendix',
        subsections: [
          { number: '', title: 'Glossary', description: 'Definitions of terms and acronyms' },
          { number: '', title: 'References', description: 'Related documents and resources' }
        ]
      }
    ]
  }
];

