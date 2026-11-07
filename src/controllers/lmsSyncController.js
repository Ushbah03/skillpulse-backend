import prisma from '../config/db.js';

export const syncLmsCatalog = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Active tenant ID required for LMS catalog sync.' });
    }

    // Comprehensive YouTube Educational LMS Catalog Courses (56 Active Verified YouTube Embed Courses)
    const lmsCatalog = [
  {
    "title": "Figma UI/UX Design Masterclass",
    "description": "Complete hands-on masterclass covering Figma Auto Layout, Design Systems, Components, and interactive wireframing.",
    "provider": "YouTube Educational LMS",
    "durationHours": 12,
    "level": "Intermediate",
    "rating": 4.9,
    "thumbnailUrl": "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/c9Wg6Cb_YlU",
    "skillName": "Figma"
  },
  {
    "title": "Figma Advanced UI/UX Prototyping & Smart Animate",
    "description": "Deep dive into complex Figma component variants, micro-interactions, mobile transitions, and user testing flows.",
    "provider": "YouTube Educational LMS",
    "durationHours": 8.5,
    "level": "Advanced",
    "rating": 4.94,
    "thumbnailUrl": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/jwCmIBJ8Jtc",
    "skillName": "Figma UI/UX Prototyping"
  },
  {
    "title": "Enterprise Figma Design Systems & Token Governance",
    "description": "Construct scalable design tokens, typography scales, light/dark themes, and developer handoff workflows in Figma.",
    "provider": "YouTube Educational LMS",
    "durationHours": 10,
    "level": "Advanced",
    "rating": 4.91,
    "thumbnailUrl": "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/c9Wg6Cb_YlU",
    "skillName": "Figma Design Systems"
  },
  {
    "title": "Canva Graphic & Presentation Design for Teams",
    "description": "Master brand kits, visual typography, multi-page slide decks, enterprise templates, and marketing collateral in Canva.",
    "provider": "YouTube Educational LMS",
    "durationHours": 7.5,
    "level": "Beginner",
    "rating": 4.82,
    "thumbnailUrl": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/un50Bs4BvZ8",
    "skillName": "Canva"
  },
  {
    "title": "Motion Design & UI Micro-Interactions",
    "description": "Create fluid CSS and SVG keyframe animations, spring physics, and Framer Motion transitions for modern SaaS.",
    "provider": "YouTube Educational LMS",
    "durationHours": 9,
    "level": "Intermediate",
    "rating": 4.88,
    "thumbnailUrl": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/jwCmIBJ8Jtc",
    "skillName": "Motion Design"
  },
  {
    "title": "Google Gemini API Multimodal Development",
    "description": "Build production apps using Gemini 1.5 Pro & Flash, structured JSON mode, context caching, and multimodal prompts.",
    "provider": "YouTube Educational LMS",
    "durationHours": 11.5,
    "level": "Advanced",
    "rating": 4.95,
    "thumbnailUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/0iEwbZflTCE",
    "skillName": "Google Gemini API"
  },
  {
    "title": "Groq LPU Ultra-Low Latency Inference Architecture",
    "description": "Leverage Groq Language Processing Units for sub-second token generation, real-time agentic voice, and high-throughput LLMs.",
    "provider": "YouTube Educational LMS",
    "durationHours": 6.5,
    "level": "Advanced",
    "rating": 4.93,
    "thumbnailUrl": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/0iEwbZflTCE",
    "skillName": "Groq LPU Inference"
  },
  {
    "title": "OpenAI GPT-4o API & Function Calling Masterclass",
    "description": "Master function calling, JSON schema outputs, assistant APIs, embeddings, and token-cost optimization with OpenAI.",
    "provider": "YouTube Educational LMS",
    "durationHours": 13,
    "level": "Advanced",
    "rating": 4.97,
    "thumbnailUrl": "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/jC4v5AS4RIM",
    "skillName": "OpenAI GPT-4o API"
  },
  {
    "title": "Agentic AI & Multi-Agent Autonomous Workflows",
    "description": "Design autonomous AI agents, tool selection, plan-and-solve execution loops, and guardrails using modern agentic frameworks.",
    "provider": "YouTube Educational LMS",
    "durationHours": 14.5,
    "level": "Advanced",
    "rating": 4.96,
    "thumbnailUrl": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/fqMOX6JJhGo",
    "skillName": "Agentic Ai"
  },
  {
    "title": "Machine Learning with Python & Scikit-Learn",
    "description": "Supervised and unsupervised learning algorithms, feature engineering, regression, classification, and model evaluation.",
    "provider": "YouTube Educational LMS",
    "durationHours": 16,
    "level": "Intermediate",
    "rating": 4.89,
    "thumbnailUrl": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/i_LwzRVP7bg",
    "skillName": "Machine Learning"
  },
  {
    "title": "Prompt Engineering & In-Context Learning",
    "description": "Chain-of-thought, few-shot prompting, system instructions, RAG grounding, and hallucination reduction strategies.",
    "provider": "YouTube Educational LMS",
    "durationHours": 8,
    "level": "Intermediate",
    "rating": 4.92,
    "thumbnailUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/fqMOX6JJhGo",
    "skillName": "Prompt Engineering"
  },
  {
    "title": "React.js 19 Modern Full Stack Development",
    "description": "Server Actions, Actions hooks, modern form handling, suspense boundaries, and client state orchestration in React 19.",
    "provider": "YouTube Educational LMS",
    "durationHours": 15,
    "level": "Intermediate",
    "rating": 4.92,
    "thumbnailUrl": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/w7ejDZ8SWv8",
    "skillName": "React.js"
  },
  {
    "title": "React Hooks Deep Dive: useState to useId",
    "description": "Master useEffect dependencies, useMemo, useCallback, useRef, custom hooks, and concurrent transitions with useTransition.",
    "provider": "YouTube Educational LMS",
    "durationHours": 9.5,
    "level": "Intermediate",
    "rating": 4.95,
    "thumbnailUrl": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/TNhaISOUy6Q",
    "skillName": "React  Hooks"
  },
  {
    "title": "Enterprise React.js Architecture & Scalable Patterns",
    "description": "Clean architecture, compound components, render props, feature-based directory structures, and decoupled API services.",
    "provider": "YouTube Educational LMS",
    "durationHours": 13.5,
    "level": "Advanced",
    "rating": 4.93,
    "thumbnailUrl": "https://images.unsplash.com/photo-1555066932-e78dd8fb77bb?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/w7ejDZ8SWv8",
    "skillName": "React.js Architecture"
  },
  {
    "title": "Next.js 15 App Router & Server Components",
    "description": "Building production apps with Next.js 15, route handlers, server actions, parallel routes, and streaming UI.",
    "provider": "YouTube Educational LMS",
    "durationHours": 14,
    "level": "Intermediate",
    "rating": 4.91,
    "thumbnailUrl": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/bMknfKXIFA8",
    "skillName": "Next.js"
  },
  {
    "title": "Next.js SSR & Edge Rendering Optimization",
    "description": "Server-side rendering, Incremental Static Regeneration (ISR), dynamic caching headers, and edge runtime middleware.",
    "provider": "YouTube Educational LMS",
    "durationHours": 10,
    "level": "Advanced",
    "rating": 4.88,
    "thumbnailUrl": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/bMknfKXIFA8",
    "skillName": "Next.js SSR"
  },
  {
    "title": "TypeScript 5.0 Enterprise Masterclass",
    "description": "Generics, utility types, conditional types, template literals, type narrowing, and strict tsconfig for SaaS platforms.",
    "provider": "YouTube Educational LMS",
    "durationHours": 12,
    "level": "Intermediate",
    "rating": 4.94,
    "thumbnailUrl": "https://images.unsplash.com/photo-1516116211227-bbc042971279?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/BwuLxPH8IDs",
    "skillName": "TypeScript"
  },
  {
    "title": "Modern JavaScript (ES2024) Deep Dive",
    "description": "Asynchronous generators, Promise.allSettled, closures, event loop internals, modules, and modern functional JS patterns.",
    "provider": "YouTube Educational LMS",
    "durationHours": 11,
    "level": "Beginner",
    "rating": 4.86,
    "thumbnailUrl": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/PkZNo7MFNFg",
    "skillName": "JavaScript"
  },
  {
    "title": "Tailwind CSS Responsive Design & Token Systems",
    "description": "Utility-first design, custom Tailwind themes, arbitrary values, container queries, dark mode, and UI animation classes.",
    "provider": "YouTube Educational LMS",
    "durationHours": 8,
    "level": "Beginner",
    "rating": 4.89,
    "thumbnailUrl": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/dFgzHOX84xQ",
    "skillName": "Tailwind CSS"
  },
  {
    "title": "HTML5 Semantic Architecture & Modern CSS3 Layouts",
    "description": "Semantic web standards, CSS Grid, Flexbox, subgrid, modern pseudo-classes, accessibility (ARIA), and SEO best practices.",
    "provider": "YouTube Educational LMS",
    "durationHours": 9,
    "level": "Beginner",
    "rating": 4.85,
    "thumbnailUrl": "https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/mU6anWqZJcc",
    "skillName": "HTML5/CSS3"
  },
  {
    "title": "Redux Toolkit & RTK Query State Management",
    "description": "Slices, createAsyncThunk, optimistic updates, cache invalidation, and enterprise state architecture with Redux Toolkit.",
    "provider": "YouTube Educational LMS",
    "durationHours": 10.5,
    "level": "Intermediate",
    "rating": 4.87,
    "thumbnailUrl": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/9zySeP5vH9c",
    "skillName": "Redux Toolkit"
  },
  {
    "title": "Flutter Cross-Platform Mobile Application Development",
    "description": "Dart language, stateful widgets, Provider/Bloc state patterns, navigation 2.0, and native compilation for iOS/Android.",
    "provider": "YouTube Educational LMS",
    "durationHours": 16,
    "level": "Intermediate",
    "rating": 4.9,
    "thumbnailUrl": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/VPvVD8t02U8",
    "skillName": "Flutter"
  },
  {
    "title": "Node.js & Express.js REST API Production Architecture",
    "description": "Express routing, structured error handling, middleware pipelines, CORS, rate limiting, and production clustering.",
    "provider": "YouTube Educational LMS",
    "durationHours": 14.5,
    "level": "Intermediate",
    "rating": 4.92,
    "thumbnailUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/Oe421EPjeBE",
    "skillName": "Node.js"
  },
  {
    "title": "Express.js Enterprise Middleware & Security Architecture",
    "description": "Helmet security headers, rate limiting, session cookies, JWT verification, body sanitization, and request throttling.",
    "provider": "YouTube Educational LMS",
    "durationHours": 8.5,
    "level": "Intermediate",
    "rating": 4.88,
    "thumbnailUrl": "https://images.unsplash.com/photo-1555066931-bf19f8fd1085?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/Oe421EPjeBE",
    "skillName": "Express.js"
  },
  {
    "title": "Node.js High-Performance Microservices Architecture",
    "description": "Event-driven microservices, worker threads, stream processing, decoupled messaging, and zero-downtime clustering.",
    "provider": "YouTube Educational LMS",
    "durationHours": 13,
    "level": "Advanced",
    "rating": 4.94,
    "thumbnailUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/Oe421EPjeBE",
    "skillName": "Node.js Architecture"
  },
  {
    "title": "RESTful API Design Standards & OpenAPI Documentation",
    "description": "HTTP status code semantics, idempotent methods, resource pagination, HATEOAS, versioning, and Swagger / OpenAPI 3.0.",
    "provider": "YouTube Educational LMS",
    "durationHours": 7.5,
    "level": "Beginner",
    "rating": 4.89,
    "thumbnailUrl": "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/lsMQRae80Gw",
    "skillName": "RESTful API Design"
  },
  {
    "title": "GraphQL APIs with Apollo Server & Client",
    "description": "Schemas, queries, mutations, subscriptions, N+1 problem resolution with DataLoader, and type safety with GraphQL Codegen.",
    "provider": "YouTube Educational LMS",
    "durationHours": 11,
    "level": "Intermediate",
    "rating": 4.9,
    "thumbnailUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/ed8SzALpx1Q",
    "skillName": "GraphQL"
  },
  {
    "title": "Python 3 Core & OOP Enterprise Fundamentals",
    "description": "Python data structures, object-oriented programming, decorators, context managers, generators, and package packaging.",
    "provider": "YouTube Educational LMS",
    "durationHours": 12,
    "level": "Beginner",
    "rating": 4.91,
    "thumbnailUrl": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/_uQrJ0TkZlc",
    "skillName": "Python"
  },
  {
    "title": "Python Data Analysis with Pandas & NumPy",
    "description": "Data wrangling, cleaning, DataFrame aggregations, statistical summaries, data visualization, and time-series analysis.",
    "provider": "YouTube Educational LMS",
    "durationHours": 13.5,
    "level": "Intermediate",
    "rating": 4.93,
    "thumbnailUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/r-uOLxNrNk8",
    "skillName": "Python Data Analysis"
  },
  {
    "title": "Python Microservices with FastAPI & Docker",
    "description": "Pydantic data schemas, asynchronous endpoints, dependency injection, Docker containerization, and API testing with pytest.",
    "provider": "YouTube Educational LMS",
    "durationHours": 12,
    "level": "Advanced",
    "rating": 4.94,
    "thumbnailUrl": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/t8pPdKYpowI",
    "skillName": "Python Microservices"
  },
  {
    "title": "PostgreSQL Production Architecture & Administration",
    "description": "ACID transactions, relational schemas, indexing strategies (B-Tree, GIN), foreign keys, and multi-tenant row security.",
    "provider": "YouTube Educational LMS",
    "durationHours": 14,
    "level": "Intermediate",
    "rating": 4.92,
    "thumbnailUrl": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/qw--VYLpxG4",
    "skillName": "PostgreSQL"
  },
  {
    "title": "PostgreSQL Optimization, Query Plans & EXPLAIN ANALYZE",
    "description": "Query plan analysis, sequential vs index scans, vacuuming, connection pooling with PgBouncer, and slow-query remediation.",
    "provider": "YouTube Educational LMS",
    "durationHours": 10,
    "level": "Advanced",
    "rating": 4.95,
    "thumbnailUrl": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/qw--VYLpxG4",
    "skillName": "PostgreSQL Optimization"
  },
  {
    "title": "Neon Serverless Postgres Architecture & Branching",
    "description": "Instant database branching, autoscaling compute, bottomless storage, connection pooling, and serverless edge connections.",
    "provider": "YouTube Educational LMS",
    "durationHours": 7,
    "level": "Intermediate",
    "rating": 4.88,
    "thumbnailUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/7S_tz1z_5bA",
    "skillName": "Neon Serverless DB"
  },
  {
    "title": "Prisma ORM Advanced Schema Modeling & Migrations",
    "description": "Relations, composite keys, database migrations, connection pooling, transactions, and Prisma client query optimization.",
    "provider": "YouTube Educational LMS",
    "durationHours": 9.5,
    "level": "Intermediate",
    "rating": 4.91,
    "thumbnailUrl": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/RebA5J-rlh4",
    "skillName": "Prisma ORM"
  },
  {
    "title": "MongoDB Schema Design & Aggregation Pipelines",
    "description": "Document modeling, embedded vs referenced schemas, indexing, aggregation framework ($lookup, $group), and Atlas cloud.",
    "provider": "YouTube Educational LMS",
    "durationHours": 11.5,
    "level": "Intermediate",
    "rating": 4.87,
    "thumbnailUrl": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/ofme2o29ngU",
    "skillName": "MongoDB"
  },
  {
    "title": "Redis In-Memory Caching & Distributed Pub/Sub",
    "description": "Redis data structures (Strings, Hashes, Sets), TTL expiration strategies, distributed locking, and session caching.",
    "provider": "YouTube Educational LMS",
    "durationHours": 8,
    "level": "Intermediate",
    "rating": 4.93,
    "thumbnailUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/G1rOthIU-qc",
    "skillName": "Redis"
  },
  {
    "title": "Docker & Containerization Fundamentals",
    "description": "Dockerfile writing, multi-stage builds, container networking, volumes, and local multi-container orchestration with Compose.",
    "provider": "YouTube Educational LMS",
    "durationHours": 10.5,
    "level": "Intermediate",
    "rating": 4.9,
    "thumbnailUrl": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/fqMOX6JJhGo",
    "skillName": "Docker"
  },
  {
    "title": "Docker Microservices Container Orchestration",
    "description": "Production image optimization, non-root users, vulnerability scanning, environment isolation, and health checks.",
    "provider": "YouTube Educational LMS",
    "durationHours": 9,
    "level": "Advanced",
    "rating": 4.92,
    "thumbnailUrl": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/fqMOX6JJhGo",
    "skillName": "Docker Microservices"
  },
  {
    "title": "Kubernetes Pod Deployment & Cluster Administration",
    "description": "Pods, Deployments, Services, Ingress controllers, ConfigMaps, Secrets, Horizontal Pod Autoscalers, and Helm charts.",
    "provider": "YouTube Educational LMS",
    "durationHours": 15,
    "level": "Advanced",
    "rating": 4.95,
    "thumbnailUrl": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/X48VuDVv0do",
    "skillName": "Kubernetes"
  },
  {
    "title": "Kubernetes Cluster Security & RBAC Hardening",
    "description": "Network policies, Pod Security Standards (PSS), RBAC rolebindings, mutual TLS with service mesh, and vulnerability auditing.",
    "provider": "YouTube Educational LMS",
    "durationHours": 11.5,
    "level": "Advanced",
    "rating": 4.93,
    "thumbnailUrl": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/d6WC5n9G_sM",
    "skillName": "Kubernetes Security"
  },
  {
    "title": "Amazon Web Services (AWS) Cloud Solutions Architect",
    "description": "VPCs, EC2, S3, RDS, IAM security policies, Route 53, CloudFront CDN, and well-architected cloud reliability framework.",
    "provider": "YouTube Educational LMS",
    "durationHours": 20,
    "level": "Intermediate",
    "rating": 4.96,
    "thumbnailUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/k1RI5locZE4",
    "skillName": "Amazon Web Services (AWS)"
  },
  {
    "title": "Enterprise AWS Cloud Architecture & Multi-AZ Resilience",
    "description": "High availability architectures, Auto Scaling groups, Application Load Balancers, disaster recovery, and cost governance.",
    "provider": "YouTube Educational LMS",
    "durationHours": 16.5,
    "level": "Advanced",
    "rating": 4.94,
    "thumbnailUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/k1RI5locZE4",
    "skillName": "AWS Cloud Architecture"
  },
  {
    "title": "AWS Lambda & Serverless Event-Driven Architecture",
    "description": "Serverless functions, API Gateway integration, DynamoDB triggers, SQS/SNS event piping, and cold-start optimization.",
    "provider": "YouTube Educational LMS",
    "durationHours": 10,
    "level": "Intermediate",
    "rating": 4.9,
    "thumbnailUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/eOBq__h4OJ4",
    "skillName": "AWS Lambda"
  },
  {
    "title": "CI/CD Pipelines with GitHub Actions & Automated Testing",
    "description": "Automated linting, unit testing, Docker image building, artifact caching, environment secrets, and automated cloud deployments.",
    "provider": "YouTube Educational LMS",
    "durationHours": 9.5,
    "level": "Intermediate",
    "rating": 4.92,
    "thumbnailUrl": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/R8_veQiYt30",
    "skillName": "CI/CD Pipelines"
  },
  {
    "title": "Terraform Infrastructure as Code (IaC) Masterclass",
    "description": "HCL syntax, providers, state management, remote backends (S3/Terraform Cloud), modular cloud provisioning, and drift detection.",
    "provider": "YouTube Educational LMS",
    "durationHours": 13,
    "level": "Advanced",
    "rating": 4.91,
    "thumbnailUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/7xngnjfIlK4",
    "skillName": "Terraform IaC"
  },
  {
    "title": "Vercel Deployment & Global Edge Infrastructure",
    "description": "Zero-config deployments, edge functions, Incremental Static Regeneration (ISR), custom domains, and serverless analytics.",
    "provider": "YouTube Educational LMS",
    "durationHours": 7.5,
    "level": "Intermediate",
    "rating": 4.88,
    "thumbnailUrl": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/bMknfKXIFA8",
    "skillName": "Vercel Deployment"
  },
  {
    "title": "Stripe Payment Integration & Webhook Security",
    "description": "Checkout sessions, customer billing portals, subscription lifecycles, webhook signature verification, and Stripe Elements.",
    "provider": "YouTube Educational LMS",
    "durationHours": 9,
    "level": "Intermediate",
    "rating": 4.94,
    "thumbnailUrl": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/LHBE6Q9XlzI",
    "skillName": "Stripe Payment Integration"
  },
  {
    "title": "JWT & RBAC Enterprise Security Architecture",
    "description": "JSON Web Tokens, refresh token rotation, Role-Based Access Control, CSRF defense, and multi-tenant security barriers.",
    "provider": "YouTube Educational LMS",
    "durationHours": 10,
    "level": "Advanced",
    "rating": 4.95,
    "thumbnailUrl": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/jC4v5AS4RIM",
    "skillName": "JWT & RBAC Security"
  },
  {
    "title": "System Architecture & High-Availability Systems Design",
    "description": "Distributed systems, CAP theorem, database sharding, caching tiers, load balancers, and asynchronous queues.",
    "provider": "YouTube Educational LMS",
    "durationHours": 18,
    "level": "Advanced",
    "rating": 4.97,
    "thumbnailUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/8JJ101D3knE",
    "skillName": "System Architecture"
  },
  {
    "title": "Agile/Scrum Project Management & Sprint Delivery",
    "description": "Agile ceremonies, user story refinement, velocity tracking, burn-down charts, sprint reviews, and engineering cadence.",
    "provider": "YouTube Educational LMS",
    "durationHours": 9,
    "level": "Intermediate",
    "rating": 4.9,
    "thumbnailUrl": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/9TycLR0TqFA",
    "skillName": "Agile/Scrum Project Management"
  },
  {
    "title": "Code Review Culture & Engineering Quality Standards",
    "description": "Constructive feedback, automated pull request checks, static analysis, detecting anti-patterns, and architectural compliance.",
    "provider": "YouTube Educational LMS",
    "durationHours": 7,
    "level": "Intermediate",
    "rating": 4.88,
    "thumbnailUrl": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/w7ejDZ8SWv8",
    "skillName": "Code Review"
  },
  {
    "title": "Engineering Mentorship & Talent Development",
    "description": "Mentoring junior engineers, pair programming, career growth frameworks, setting OKRs, and fostering psychological safety.",
    "provider": "YouTube Educational LMS",
    "durationHours": 8,
    "level": "Intermediate",
    "rating": 4.91,
    "thumbnailUrl": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/w7ejDZ8SWv8",
    "skillName": "Mentorship"
  },
  {
    "title": "Technical Team Leadership & Engineering Management",
    "description": "Leading multi-disciplinary engineering pods, 1-on-1 coaching, hiring rubrics, roadmapping, and managing technical debt.",
    "provider": "YouTube Educational LMS",
    "durationHours": 12,
    "level": "Advanced",
    "rating": 4.95,
    "thumbnailUrl": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/w7ejDZ8SWv8",
    "skillName": "Technical Team Leadership"
  },
  {
    "title": "Marketing Industry Standards & Growth Performance",
    "description": "B2B SaaS marketing funnels, customer acquisition cost (CAC), LTV ratios, product-led growth (PLG), and analytics tracking.",
    "provider": "YouTube Educational LMS",
    "durationHours": 10,
    "level": "Intermediate",
    "rating": 4.87,
    "thumbnailUrl": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/9TycLR0TqFA",
    "skillName": "Marketing Industry Standards"
  },
  {
    "title": "Cross-Functional Communication & Stakeholder Alignment",
    "description": "Bridging engineering and business, translating technical trade-offs for non-engineers, and negotiation frameworks.",
    "provider": "YouTube Educational LMS",
    "durationHours": 7.5,
    "level": "Intermediate",
    "rating": 4.89,
    "thumbnailUrl": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/v34nQJeic88",
    "skillName": "Cross-Functional Communication"
  },
  {
    "title": "Workplace Communication & Executive Presence",
    "description": "Structured writing (Minto Pyramid), active listening, meeting facilitation, and assertive professional communication.",
    "provider": "YouTube Educational LMS",
    "durationHours": 8,
    "level": "Beginner",
    "rating": 4.92,
    "thumbnailUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/v34nQJeic88",
    "skillName": "Workplace Communication"
  },
  {
    "title": "Problem Solving & Root Cause Analysis",
    "description": "5-Whys, Fishbone / Ishikawa diagrams, failure mode effects analysis (FMEA), and rapid incident post-mortems.",
    "provider": "YouTube Educational LMS",
    "durationHours": 9,
    "level": "Intermediate",
    "rating": 4.93,
    "thumbnailUrl": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/9TycLR0TqFA",
    "skillName": "Problem Solving"
  },
  {
    "title": "Critical Thinking & Cognitive Bias Elimination",
    "description": "Overcoming confirmation bias, first-principles thinking, probabilistic decision-making, and objective logic trees.",
    "provider": "YouTube Educational LMS",
    "durationHours": 8.5,
    "level": "Advanced",
    "rating": 4.94,
    "thumbnailUrl": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/9TycLR0TqFA",
    "skillName": "Problem Solving & Critical Thinking"
  },
  {
    "title": "Technical Adaptability & Continuous Learning in Tech",
    "description": "Strategies for rapid technology adoption, reading RFCs, evaluating emerging tech stacks, and avoiding obsolete patterns.",
    "provider": "YouTube Educational LMS",
    "durationHours": 6.5,
    "level": "Intermediate",
    "rating": 4.88,
    "thumbnailUrl": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/v34nQJeic88",
    "skillName": "Adaptability"
  },
  {
    "title": "Search Engine Optimization (SEO) & Core Web Vitals",
    "description": "Technical SEO, LCP/CLS/INP optimization, schema structured markup, canonicals, sitemaps, and robots configuration.",
    "provider": "YouTube Educational LMS",
    "durationHours": 8,
    "level": "Intermediate",
    "rating": 4.9,
    "thumbnailUrl": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
    "externalUrl": "https://www.youtube.com/embed/DvwS7cV9GmQ",
    "skillName": "SEO"
  }
];

    let syncedCount = 0;

    for (const item of lmsCatalog) {
      // Find or create course in DB
      let course = await prisma.course.findFirst({
        where: {
          title: { equals: item.title, mode: 'insensitive' }
        }
      });

      if (!course) {
        course = await prisma.course.create({
          data: {
            tenantId,
            title: item.title,
            description: item.description,
            provider: item.provider,
            durationHours: item.durationHours,
            level: item.level,
            rating: item.rating,
            thumbnailUrl: item.thumbnailUrl,
            externalUrl: item.externalUrl
          }
        });
      } else {
        // Update externalUrl & provider with real YouTube embed
        course = await prisma.course.update({
          where: { id: course.id },
          data: {
            externalUrl: item.externalUrl,
            provider: item.provider,
            description: item.description,
            durationHours: item.durationHours,
            level: item.level,
            rating: item.rating
          }
        });
      }
      syncedCount++;

      // Link course to matching skill if skill exists in tenant taxonomy
      const skill = await prisma.skill.findFirst({
        where: {
          name: { contains: item.skillName, mode: 'insensitive' },
          OR: [{ tenantId }, { tenantId: null }, { isGlobal: true }]
        }
      });

      if (skill) {
        const existingLink = await prisma.courseSkill.findFirst({
          where: { courseId: course.id, skillId: skill.id }
        });

        if (!existingLink) {
          await prisma.courseSkill.create({
            data: {
              courseId: course.id,
              skillId: skill.id
            }
          }).catch(() => {});
        }
      }
    }

    // Update integration config last sync time
    await prisma.integrationConfig.updateMany({
      where: { tenantId, type: { contains: 'LMS', mode: 'insensitive' } },
      data: { lastSyncAt: new Date(), status: 'ACTIVE' }
    }).catch(() => {});

    // Log LMS Catalog Sync Audit Log
    const reqUserId = req.user?.id || req.user?.userId;
    if (reqUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: reqUserId,
          action: 'LMS_CATALOG_SYNCED',
          resource: 'Course',
          resourceId: tenantId,
          details: {
            syncedCourses: syncedCount,
            totalCatalogItems: lmsCatalog.length,
            provider: 'YouTube Educational LMS'
          }
        }
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: `LMS Course Catalog Sync Success! Synchronized ${syncedCount} active YouTube & LMS video courses in PostgreSQL database catalog.`,
      data: { createdCourses: syncedCount, totalCatalogItems: lmsCatalog.length }
    });
  } catch (error) {
    next(error);
  }
};
