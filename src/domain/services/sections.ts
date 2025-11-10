import { Section } from '../entities/Section';

export const SECTIONS: Section[] = [
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
];
