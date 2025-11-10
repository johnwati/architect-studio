
export interface ADRTemplate {
  id: string;
  title: string;
  category: string;
  context: string;
  decision: string;
  consequences: string;
}

export const ADR_TEMPLATES: ADRTemplate[] = [
  {
    id: 'microservices-vs-monolith',
    title: 'Adopt Microservices Architecture',
    category: 'Architecture',
    context: `We need to decide on the architectural pattern for our new application. The system needs to handle multiple business domains (payments, customer management, notifications) and must scale independently. We have a team of 20+ developers who need to work in parallel.

Current challenges:
- Single deployment unit blocks independent releases
- Tight coupling between features
- Difficult to scale individual components
- Technology stack locked to one choice`,
    decision: `We will adopt a microservices architecture with the following characteristics:
- Each service owns its data and business logic
- Services communicate via REST APIs and message queues
- Independent deployment and scaling
- Service mesh for cross-cutting concerns
- API Gateway for external access
- Container orchestration using Kubernetes`,
    consequences: `Positive:
- Independent deployment and scaling of services
- Technology diversity (each service can use different tech stack)
- Better team autonomy and parallel development
- Fault isolation (failure in one service doesn't bring down entire system)
- Easier to understand and maintain individual services

Negative:
- Increased operational complexity
- Network latency and potential failures
- Data consistency challenges (distributed transactions)
- More complex testing and debugging
- Higher infrastructure costs
- Need for service discovery and monitoring tools`
  },
  {
    id: 'sql-vs-nosql',
    title: 'Use SQL Database for Primary Data Storage',
    category: 'Database',
    context: `We need to choose a database solution for our core banking application. The system requires:
- Strong ACID compliance for financial transactions
- Complex queries and joins across multiple tables
- Relational data with foreign keys
- Transaction integrity
- Audit trails and compliance requirements
- Team familiarity with SQL`,
    decision: `We will use PostgreSQL as our primary database for core transactional data.

Rationale:
- ACID compliance for financial transactions
- Strong consistency guarantees
- Rich query capabilities with SQL
- Mature ecosystem and tooling
- Excellent support for relational data
- Proven reliability for financial systems
- JSON support for flexible schema when needed`,
    consequences: `Positive:
- Strong data consistency and integrity
- Familiar SQL interface for developers
- Mature tooling and ecosystem
- Excellent for complex queries and reporting
- ACID transactions ensure data correctness
- Wide community support and documentation

Negative:
- Vertical scaling limitations (though horizontal read replicas help)
- Schema changes require migrations
- Can be slower for very high write loads
- Less flexible than NoSQL for schema evolution`
  },
  {
    id: 'api-rest-vs-graphql',
    title: 'Use REST API for External Integration',
    category: 'API Design',
    context: `We need to expose APIs for third-party integrations and mobile applications. Requirements include:
- Simple integration for partners
- Standard HTTP methods and status codes
- Caching support
- Wide industry adoption
- Easy documentation and testing
- Support for various client types (web, mobile, third-party)`,
    decision: `We will expose RESTful APIs following OpenAPI 3.0 specification.

Standards:
- Use standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
- RESTful resource naming conventions
- JSON for request/response payloads
- Proper HTTP status codes
- API versioning in URL path (/api/v1/)
- Rate limiting and authentication
- Comprehensive OpenAPI documentation`,
    consequences: `Positive:
- Industry standard, easy for partners to integrate
- Caching support via HTTP headers
- Simple and predictable
- Excellent tooling and documentation
- Works well with HTTP proxies and CDNs
- Easy to test with standard HTTP tools

Negative:
- Over-fetching or under-fetching data
- Multiple round trips for complex data
- Versioning can be challenging
- Less flexible than GraphQL for client-specific queries`
  },
  {
    id: 'containerization',
    title: 'Use Docker Containers for Application Deployment',
    category: 'Deployment',
    context: `We need a consistent deployment strategy across development, staging, and production environments. Current challenges:
- Environment inconsistencies causing "works on my machine" issues
- Difficult to replicate production environment locally
- Manual deployment processes
- Dependency conflicts between applications
- Scaling and resource management`,
    decision: `We will containerize all applications using Docker and deploy using Kubernetes.

Strategy:
- Docker containers for all application services
- Multi-stage builds for optimized images
- Container orchestration with Kubernetes
- Helm charts for deployment configuration
- CI/CD pipeline for automated builds and deployments
- Container registry for image storage`,
    consequences: `Positive:
- Consistent environments across all stages
- Easy local development setup
- Scalable and portable deployments
- Efficient resource utilization
- Isolation between applications
- Easy rollback capabilities
- Standardized deployment process

Negative:
- Learning curve for Docker and Kubernetes
- Additional infrastructure complexity
- Container orchestration overhead
- Need for monitoring and logging solutions
- Image security scanning required`
  },
  {
    id: 'authentication-oauth',
    title: 'Implement OAuth 2.0 for Authentication',
    category: 'Security',
    context: `We need a secure authentication and authorization system for our application. Requirements:
- Support for multiple client types (web, mobile, third-party)
- Single Sign-On (SSO) capability
- Token-based authentication
- Industry-standard security practices
- Integration with identity providers
- Support for different user roles and permissions`,
    decision: `We will implement OAuth 2.0 with OpenID Connect for authentication and authorization.

Implementation:
- Authorization Server for token issuance
- Resource Server for API protection
- Support for multiple grant types (Authorization Code, Client Credentials, Refresh Token)
- JWT tokens for stateless authentication
- Integration with identity providers (Azure AD, Okta)
- Role-based access control (RBAC)
- Token refresh mechanism`,
    consequences: `Positive:
- Industry-standard and widely supported
- Secure token-based authentication
- Supports multiple client types
- Enables SSO across applications
- Stateless authentication (scalable)
- Fine-grained authorization control

Negative:
- Complex implementation and configuration
- Token management overhead
- Requires understanding of OAuth flows
- Potential security vulnerabilities if misconfigured
- Token expiration and refresh complexity`
  },
  {
    id: 'message-queue',
    title: 'Use Message Queue for Asynchronous Processing',
    category: 'Communication',
    context: `We need to handle asynchronous operations and decouple services. Current challenges:
- Synchronous calls causing timeouts
- Tight coupling between services
- Need for reliable message delivery
- Event-driven architecture requirements
- Background job processing
- Integration with external systems`,
    decision: `We will use Apache Kafka for event streaming and message queuing.

Setup:
- Kafka clusters for high availability
- Topic-based messaging for different event types
- Consumer groups for parallel processing
- Message retention for replay capability
- Schema registry for message validation
- Dead letter queues for failed messages`,
    consequences: `Positive:
- Decoupled services and asynchronous processing
- High throughput and scalability
- Event replay capability
- Ordering guarantees within partitions
- Durable message storage
- Supports event sourcing patterns

Negative:
- Operational complexity
- Learning curve for Kafka
- Requires Zookeeper (or KRaft)
- Message ordering complexity across partitions
- Potential for message duplication
- Resource intensive`
  },
  {
    id: 'caching-strategy',
    title: 'Implement Multi-Layer Caching Strategy',
    category: 'Performance',
    context: `Our application experiences high read traffic and database load. We need to improve response times and reduce database pressure. Requirements:
- Fast response times for frequently accessed data
- Reduce database query load
- Support for high traffic volumes
- Cache invalidation strategies
- Support for distributed systems`,
    decision: `We will implement a multi-layer caching strategy using Redis and in-memory caches.

Layers:
1. Application-level cache (in-memory) for frequently accessed, small data
2. Distributed cache (Redis) for shared data across instances
3. CDN caching for static assets
4. Database query result caching
5. Cache-aside pattern for data loading
6. TTL-based expiration with manual invalidation`,
    consequences: `Positive:
- Significantly reduced response times
- Lower database load
- Better scalability
- Improved user experience
- Cost reduction (fewer database resources)

Negative:
- Cache invalidation complexity
- Potential stale data issues
- Additional infrastructure to maintain
- Memory costs
- Cache consistency challenges in distributed systems`
  },
  {
    id: 'monitoring-observability',
    title: 'Implement Comprehensive Observability Stack',
    category: 'Operations',
    context: `We need visibility into our distributed system for debugging, performance optimization, and reliability. Challenges:
- Difficult to trace requests across services
- Limited visibility into system health
- Slow incident response
- Performance bottlenecks hard to identify
- Limited business metrics visibility`,
    decision: `We will implement a comprehensive observability stack using:
- Prometheus for metrics collection
- Grafana for visualization and dashboards
- ELK Stack (Elasticsearch, Logstash, Kibana) for log aggregation
- Jaeger for distributed tracing
- AlertManager for alerting
- Custom business metrics dashboards`,
    consequences: `Positive:
- Full visibility into system behavior
- Faster debugging and issue resolution
- Proactive problem detection via alerts
- Performance optimization insights
- Business metrics tracking
- Better incident response

Negative:
- High data volume and storage costs
- Operational overhead to maintain
- Learning curve for tooling
- Potential performance impact from instrumentation
- Complex query languages to learn`
  },
  {
    id: 'ci-cd-pipeline',
    title: 'Implement CI/CD Pipeline with Automated Testing',
    category: 'DevOps',
    context: `We need to improve our software delivery process. Current issues:
- Manual deployment processes prone to errors
- Long release cycles
- Difficult to rollback changes
- Limited automated testing
- Inconsistent deployment processes
- Need for faster feedback loops`,
    decision: `We will implement a CI/CD pipeline using GitHub Actions with the following stages:

Pipeline:
1. Code quality checks (linting, formatting)
2. Unit tests execution
3. Integration tests
4. Security scanning (SAST, dependency scanning)
5. Build Docker images
6. Deploy to staging environment
7. Run E2E tests
8. Manual approval for production
9. Deploy to production with blue-green deployment
10. Automated rollback on health check failures`,
    consequences: `Positive:
- Faster and reliable deployments
- Automated testing reduces bugs
- Consistent deployment process
- Quick rollback capabilities
- Better code quality through automated checks
- Faster feedback for developers

Negative:
- Initial setup complexity
- Maintenance of pipeline scripts
- Test execution time can slow down feedback
- Requires discipline in test writing
- Infrastructure costs for CI/CD runners`
  },
  {
    id: 'api-gateway',
    title: 'Implement API Gateway Pattern',
    category: 'Architecture',
    context: `We have multiple microservices that need to be exposed to clients. Challenges:
- Multiple entry points for clients
- Different authentication/authorization per service
- Rate limiting and throttling needs
- Request/response transformation
- Protocol translation
- Service discovery complexity`,
    decision: `We will implement an API Gateway using Kong/NGINX as a single entry point.

Responsibilities:
- Single entry point for all client requests
- Authentication and authorization
- Rate limiting and throttling
- Request routing and load balancing
- Request/response transformation
- API versioning
- Request logging and monitoring
- Circuit breaker pattern`,
    consequences: `Positive:
- Single entry point simplifies client integration
- Centralized cross-cutting concerns
- Better security control
- Protocol translation (HTTP to gRPC)
- Request aggregation reduces round trips
- Centralized monitoring and logging

Negative:
- Single point of failure (mitigated with high availability)
- Additional network hop (latency)
- Operational complexity
- Potential bottleneck
- Gateway can become a monolith itself if not managed carefully`
  },
  {
    id: 'database-sharding',
    title: 'Implement Database Sharding for Scalability',
    category: 'Database',
    context: `Our database is approaching capacity limits and query performance is degrading. We need to scale horizontally. Constraints:
- Single database can't handle the load
- Read replicas help but writes are bottleneck
- Need to distribute data across multiple databases
- Maintain data locality
- Support for complex queries`,
    decision: `We will implement horizontal database sharding using a shard key strategy.

Strategy:
- Shard by customer ID (hash-based sharding)
- Each shard contains complete customer data
- Shard proxy/router for query routing
- Cross-shard queries handled by application layer
- Read replicas per shard for read scaling
- Automated shard rebalancing when needed`,
    consequences: `Positive:
- Horizontal scalability for writes
- Improved query performance
- Better resource utilization
- Fault isolation per shard
- Can scale independently

Negative:
- Complex query routing
- Cross-shard queries are expensive
- Data rebalancing complexity
- Operational complexity
- Application logic changes required
- Potential data distribution skew`
  },
  {
    id: 'event-sourcing',
    title: 'Adopt Event Sourcing for Critical Domains',
    category: 'Architecture',
    context: `We need complete audit trails and ability to replay events for financial transactions. Requirements:
- Immutable audit log
- Event replay capability
- Temporal queries (state at any point in time)
- Compliance and regulatory requirements
- Complex business logic with multiple state changes`,
    decision: `We will implement Event Sourcing for the payment and transaction domains.

Implementation:
- Store all domain events as the source of truth
- Rebuild state by replaying events
- Separate read models (CQRS) for queries
- Event store for persistence
- Event versioning for schema evolution
- Snapshot support for performance`,
    consequences: `Positive:
- Complete audit trail
- Event replay and debugging capability
- Temporal queries (state at any time)
- Natural fit for financial systems
- Decoupled read/write models
- Better compliance support

Negative:
- Complex implementation
- Event schema evolution challenges
- Performance considerations (event replay)
- Learning curve for team
- Additional storage requirements
- Eventual consistency complexity`
  },
  {
    id: 'cdn-strategy',
    title: 'Use CDN for Static Asset Delivery',
    category: 'Performance',
    context: `Our application serves static assets (images, CSS, JS) to users globally. Issues:
- Slow load times for users far from origin
- High bandwidth costs
- Origin server overload
- Poor user experience in some regions`,
    decision: `We will use CloudFront (AWS) / Cloudflare CDN for static asset delivery.

Configuration:
- Cache static assets with long TTLs
- Versioned asset URLs for cache busting
- HTTPS for all assets
- Geographic distribution
- Edge locations for low latency
- Origin failover for reliability`,
    consequences: `Positive:
- Faster load times globally
- Reduced origin server load
- Lower bandwidth costs
- Better user experience
- DDoS protection
- SSL/TLS termination at edge

Negative:
- CDN costs
- Cache invalidation complexity
- Potential stale content issues
- Additional configuration overhead`
  },
  {
    id: 'database-backup',
    title: 'Implement Automated Database Backup Strategy',
    category: 'Operations',
    context: `We need a robust backup and disaster recovery strategy for our critical financial data. Requirements:
- Point-in-time recovery capability
- Automated backups
- Off-site backup storage
- Fast recovery time objectives (RTO)
- Compliance requirements
- Regular testing of restore procedures`,
    decision: `We will implement a comprehensive backup strategy with:
- Daily full backups
- Continuous transaction log backups
- Backup retention: 30 days daily, 12 months monthly
- Off-site backup storage (different region)
- Automated backup verification
- Monthly restore testing
- Encrypted backups`,
    consequences: `Positive:
- Data protection and compliance
- Fast recovery from disasters
- Point-in-time recovery capability
- Peace of mind
- Regulatory compliance

Negative:
- Storage costs
- Backup window considerations
- Restore testing overhead
- Management complexity`
  }
];

export const ADR_TEMPLATE_CATEGORIES = [
  'All',
  'Architecture',
  'Database',
  'API Design',
  'Deployment',
  'Security',
  'Communication',
  'Performance',
  'Operations',
  'DevOps'
];

export function getTemplatesByCategory(category: string): ADRTemplate[] {
  if (category === 'All') {
    return ADR_TEMPLATES;
  }
  return ADR_TEMPLATES.filter(template => template.category === category);
}

export function getTemplateById(id: string): ADRTemplate | undefined {
  return ADR_TEMPLATES.find(template => template.id === id);
}

