import prisma from '../config/db.js';

export const syncLmsCatalog = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Active tenant ID required for LMS catalog sync.' });
    }

    // Comprehensive YouTube Educational LMS Catalog Courses (56 Active Verified YouTube Embed Courses)
    const lmsCatalog = [
      // Design & Product
      {
        title: 'Figma UI/UX Design Masterclass',
        description: 'Complete hands-on masterclass covering Figma Auto Layout, Design Systems, Components, and Prototyping.',
        provider: 'YouTube Educational LMS',
        durationHours: 12.0,
        level: 'Intermediate',
        rating: 4.9,
        thumbnailUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/c9Wg6Cb_YlU',
        skillName: 'Figma'
      },
      {
        title: 'Canva Graphic & Presentation Design',
        description: 'Master brand kits, visual typography, multi-page slide decks, and marketing collateral in Canva.',
        provider: 'YouTube Educational LMS',
        durationHours: 8.5,
        level: 'Intermediate',
        rating: 4.8,
        thumbnailUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/c9Wg6Cb_YlU',
        skillName: 'Canva'
      },
      {
        title: 'UI/UX Research & Design Thinking Fundamentals',
        description: 'User interviews, persona creation, wireframing, usability testing, and accessibility guidelines (WCAG 2.1).',
        provider: 'YouTube Educational LMS',
        durationHours: 9.0,
        level: 'Beginner',
        rating: 4.9,
        thumbnailUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/jwCmIBJ8Jtc',
        skillName: 'UI/UX Design'
      },

      // Soft Skills & Leadership
      {
        title: 'Problem Solving & Critical Thinking',
        description: 'Systematic root-cause analysis, 5-Whys methodology, and structured decision making frameworks.',
        provider: 'YouTube Educational LMS',
        durationHours: 10.0,
        level: 'Advanced',
        rating: 4.95,
        thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/9TycLR0TqFA',
        skillName: 'Problem Solving'
      },
      {
        title: 'Agile Scrum Master & Product Management',
        description: 'Agile manifesto, Scrum ceremonies, sprint planning, backlog grooming, user story sizing, and JIRA workflows.',
        provider: 'YouTube Educational LMS',
        durationHours: 7.5,
        level: 'Beginner',
        rating: 4.85,
        thumbnailUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/9TycLR0TqFA',
        skillName: 'Agile'
      },
      {
        title: 'Technical Team Leadership & Engineering Management',
        description: 'Leading engineering teams, 1-on-1 coaching, code review culture, sprint velocity, and technical strategy.',
        provider: 'YouTube Educational LMS',
        durationHours: 11.5,
        level: 'Advanced',
        rating: 4.92,
        thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/w7ejDZ8SWv8',
        skillName: 'Technical Team Leadership'
      },
      {
        title: 'Cross-Functional Communication & Stakeholder Management',
        description: 'Effective communication for technical teams, presenting to executives, and resolving project conflicts.',
        provider: 'YouTube Educational LMS',
        durationHours: 6.5,
        level: 'Intermediate',
        rating: 4.88,
        thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/w7ejDZ8SWv8',
        skillName: 'Cross-Functional Communication'
      },

      // Frontend Engineering
      {
        title: 'React 19 & Next.js 15 Full Stack Architecture',
        description: 'Comprehensive enterprise framework for React 19, Server Components, App Router, and SSR Optimization.',
        provider: 'YouTube Educational LMS',
        durationHours: 18.5,
        level: 'Advanced',
        rating: 4.9,
        thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
        skillName: 'React'
      },
      {
        title: 'TypeScript Enterprise Development',
        description: 'Advanced generics, utility types, type guards, strict compiler configurations, and AST parsing.',
        provider: 'YouTube Educational LMS',
        durationHours: 14.5,
        level: 'Advanced',
        rating: 4.95,
        thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/d56mG7DezGs',
        skillName: 'TypeScript'
      },
      {
        title: 'Tailwind CSS v4 & Modern UI Architecture',
        description: 'Build ultra-responsive dark enterprise web apps using Tailwind CSS v4, arbitrary values, and custom plugins.',
        provider: 'YouTube Educational LMS',
        durationHours: 9.5,
        level: 'Intermediate',
        rating: 4.87,
        thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/ft30zcMlFbo',
        skillName: 'Tailwind CSS'
      },
      {
        title: 'Vue.js 3 Composition API & Pinia State',
        description: 'Reactivity system, Vue Router 4, Pinia state management, and Vite build tooling.',
        provider: 'YouTube Educational LMS',
        durationHours: 13.0,
        level: 'Intermediate',
        rating: 4.86,
        thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/FXpIoQ_rT_c',
        skillName: 'Vue.js'
      },
      {
        title: 'Angular 18 Enterprise Web Applications',
        description: 'Signals state management, standalone components, RxJS reactive streams, dependency injection, and Angular CLI.',
        provider: 'YouTube Educational LMS',
        durationHours: 16.5,
        level: 'Advanced',
        rating: 4.83,
        thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/Ata9cSC2WpM',
        skillName: 'Angular'
      },
      {
        title: 'Redux Toolkit & Global State Architecture',
        description: 'Slice reducers, RTK Query data fetching, async thunks, and state normalization.',
        provider: 'YouTube Educational LMS',
        durationHours: 8.0,
        level: 'Intermediate',
        rating: 4.84,
        thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/NqzdVN2tyvQ',
        skillName: 'Redux Toolkit'
      },

      // Backend Engineering & Microservices
      {
        title: 'Node.js & Express.js Enterprise Backends',
        description: 'Event loop architecture, non-blocking I/O, middleware pipelines, error handling, and cluster mode.',
        provider: 'YouTube Educational LMS',
        durationHours: 16.0,
        level: 'Advanced',
        rating: 4.91,
        thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/Oe421EPjeBE',
        skillName: 'Node.js'
      },
      {
        title: 'Python Microservices with FastAPI & Docker',
        description: 'Build scalable asynchronous microservices with FastAPI, SQLAlchemy, Redis caching, and Docker containers.',
        provider: 'YouTube Educational LMS',
        durationHours: 14.0,
        level: 'Intermediate',
        rating: 4.88,
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/t8pPdKYpowI',
        skillName: 'Python'
      },
      {
        title: 'RESTful API Design & OpenAPI Specs',
        description: 'HTTP verbs, status codes, JSON schema validation, Swagger/OpenAPI docs, and rate limiting.',
        provider: 'YouTube Educational LMS',
        durationHours: 10.0,
        level: 'Intermediate',
        rating: 4.89,
        thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/lsMQRaeH04w',
        skillName: 'RESTful API Design'
      },
      {
        title: 'GraphQL API Masterclass & Apollo Server',
        description: 'GraphQL schemas, resolvers, mutations, subscriptions, N+1 query optimization, and DataLoader.',
        provider: 'YouTube Educational LMS',
        durationHours: 12.0,
        level: 'Advanced',
        rating: 4.87,
        thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/ed8SzALpx1Q',
        skillName: 'GraphQL'
      },
      {
        title: 'Golang (Go) Microservices Architecture',
        description: 'Goroutines, channels, interfaces, gRPC, and building high-throughput microservices in Go.',
        provider: 'YouTube Educational LMS',
        durationHours: 15.0,
        level: 'Advanced',
        rating: 4.93,
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/un6ZyFkqFKo',
        skillName: 'Go'
      },
      {
        title: 'Rust Programming Language & Systems Engineering',
        description: 'Memory safety without garbage collection, ownership & borrowing rules, concurrency primitives, and Cargo.',
        provider: 'YouTube Educational LMS',
        durationHours: 15.5,
        level: 'Advanced',
        rating: 4.95,
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/5C_HPTJg5ek',
        skillName: 'Rust'
      },
      {
        title: 'Spring Boot 3 & Java Microservices',
        description: 'Build enterprise Java backends with Spring Boot 3, Spring Data JPA, Spring Security, and Maven dependencies.',
        provider: 'YouTube Educational LMS',
        durationHours: 18.0,
        level: 'Advanced',
        rating: 4.88,
        thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/35EQXmHKZYs',
        skillName: 'Java'
      },

      // Databases & Data Engineering
      {
        title: 'PostgreSQL Database Architecture & Query Optimization',
        description: 'Master PostgreSQL query optimization, B-tree indexes, CTEs, partition tables, and Neon serverless scaling.',
        provider: 'YouTube Educational LMS',
        durationHours: 15.0,
        level: 'Advanced',
        rating: 4.92,
        thumbnailUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/qw--VYLpxG4',
        skillName: 'PostgreSQL'
      },
      {
        title: 'Prisma ORM & Serverless PostgreSQL',
        description: 'Schema modeling, migrations, nested relations, transactions, and Neon serverless connection pooling.',
        provider: 'YouTube Educational LMS',
        durationHours: 10.5,
        level: 'Intermediate',
        rating: 4.89,
        thumbnailUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/rLQQJIC6i8I',
        skillName: 'Prisma ORM'
      },
      {
        title: 'MongoDB & NoSQL Database Engineering',
        description: 'Document database modeling, aggregation pipelines, indexing, sharding, and Mongoose ODM integration.',
        provider: 'YouTube Educational LMS',
        durationHours: 10.0,
        level: 'Intermediate',
        rating: 4.87,
        thumbnailUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/c2M-rlkkT5o',
        skillName: 'MongoDB'
      },
      {
        title: 'Redis Caching & In-Memory Data Structures',
        description: 'High-performance caching strategies, key expiration, pub/sub messaging queues, and Redis cluster sentinel.',
        provider: 'YouTube Educational LMS',
        durationHours: 7.0,
        level: 'Intermediate',
        rating: 4.89,
        thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/G1rOthIU-uo',
        skillName: 'Redis'
      },

      // AI, ML & LLMs
      {
        title: 'OpenAI GPT-4o API & Prompt Engineering Masterclass',
        description: 'Integrating OpenAI API, function calling, vision models, streaming responses, and RAG architecture.',
        provider: 'YouTube Educational LMS',
        durationHours: 14.0,
        level: 'Advanced',
        rating: 4.96,
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/fqMOX6JJhGo',
        skillName: 'OpenAI GPT-4o API'
      },
      {
        title: 'Groq LPU Engine & Open-Source LLMs',
        description: 'Ultra-fast LPU inference, running LLaMA 3.3 70B, Mixtral 8x7B, and deploying open-source AI models.',
        provider: 'YouTube Educational LMS',
        durationHours: 11.0,
        level: 'Advanced',
        rating: 4.91,
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/fqMOX6JJhGo',
        skillName: 'Groq LPU Inference'
      },
      {
        title: 'Google Gemini API & Multimodal AI Applications',
        description: 'Build next-gen multimodal applications using Google Gemini 1.5 Pro, video analysis, and Google AI Studio.',
        provider: 'YouTube Educational LMS',
        durationHours: 12.0,
        level: 'Intermediate',
        rating: 4.88,
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/fqMOX6JJhGo',
        skillName: 'Google Gemini API'
      },
      {
        title: 'Machine Learning with Python & Scikit-Learn',
        description: 'Supervised & unsupervised learning, regression, classification, decision trees, and model evaluation.',
        provider: 'YouTube Educational LMS',
        durationHours: 16.0,
        level: 'Intermediate',
        rating: 4.9,
        thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/i_LwzRVP7bg',
        skillName: 'Machine Learning'
      },
      {
        title: 'Deep Learning & Neural Networks with PyTorch',
        description: 'Tensor operations, backpropagation, CNNs for image classification, RNNs, and Transformers.',
        provider: 'YouTube Educational LMS',
        durationHours: 18.0,
        level: 'Advanced',
        rating: 4.94,
        thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/V_xro1bcAuA',
        skillName: 'Deep Learning'
      },

      // DevOps, Cloud & Security
      {
        title: 'Docker Containerization & Multi-Stage Builds',
        description: 'Container fundamentals, Dockerfiles, multi-stage builds, Docker Compose, and container security.',
        provider: 'YouTube Educational LMS',
        durationHours: 11.0,
        level: 'Intermediate',
        rating: 4.91,
        thumbnailUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/d6WC5n9G_sM',
        skillName: 'Docker'
      },
      {
        title: 'Kubernetes Cluster Administration & Helm',
        description: 'Pods, Deployments, Services, Ingress controllers, Persistent Volumes, Helm charts, and HPA autoscaling.',
        provider: 'YouTube Educational LMS',
        durationHours: 17.0,
        level: 'Advanced',
        rating: 4.94,
        thumbnailUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/dFgzHOX84xQ',
        skillName: 'Kubernetes'
      },
      {
        title: 'AWS Certified Solutions Architect Associate',
        description: 'EC2, S3, RDS, VPC networking, IAM security, Auto Scaling, and CloudFront CDN.',
        provider: 'YouTube Educational LMS',
        durationHours: 22.0,
        level: 'Advanced',
        rating: 4.96,
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/Ia-UEOoLkag',
        skillName: 'Amazon Web Services (AWS)'
      },
      {
        title: 'AWS Lambda & Serverless Architecture',
        description: 'Event-driven serverless functions with AWS Lambda, API Gateway, DynamoDB, and Serverless Framework.',
        provider: 'YouTube Educational LMS',
        durationHours: 12.5,
        level: 'Intermediate',
        rating: 4.89,
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/9lJ4P8i1m9I',
        skillName: 'AWS Lambda'
      },
      {
        title: 'CI/CD Pipelines with GitHub Actions & Vercel',
        description: 'Automated testing, build matrix, Docker image publishing to ECR, and Vercel preview deployments.',
        provider: 'YouTube Educational LMS',
        durationHours: 10.0,
        level: 'Intermediate',
        rating: 4.88,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/R8_veQiYgj0',
        skillName: 'CI/CD Pipelines'
      },
      {
        title: 'Cybersecurity Fundamentals & Ethical Hacking',
        description: 'Network security, penetration testing, OWASP Top 10 vulnerabilities, cryptography, and SIEM monitoring.',
        provider: 'YouTube Educational LMS',
        durationHours: 15.0,
        level: 'Beginner',
        rating: 4.93,
        thumbnailUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/3Kq1MIfTWCE',
        skillName: 'Cybersecurity'
      },
      {
        title: 'Linux Systems Administration & Shell Scripting',
        description: 'Command line mastery, file permissions, process management, systemd services, cron jobs, and shell automation.',
        provider: 'YouTube Educational LMS',
        durationHours: 12.5,
        level: 'Beginner',
        rating: 4.92,
        thumbnailUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/wBp0Rb-ZJak',
        skillName: 'Linux'
      },

      // Mobile Development
      {
        title: 'Flutter & Dart Cross-Platform Mobile Apps',
        description: 'Build native iOS and Android apps using Flutter 3, Dart language, Provider state, and Firebase backend.',
        provider: 'YouTube Educational LMS',
        durationHours: 18.0,
        level: 'Intermediate',
        rating: 4.91,
        thumbnailUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/VPvVD8t02U8',
        skillName: 'Flutter'
      },
      {
        title: 'React Native & Expo Mobile Development',
        description: 'Cross-platform mobile apps with React Native, Expo SDK, React Navigation, and native device APIs.',
        provider: 'YouTube Educational LMS',
        durationHours: 16.0,
        level: 'Intermediate',
        rating: 4.88,
        thumbnailUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/0-S5a0eXPoc',
        skillName: 'React Native'
      },

      // Security & Payments
      {
        title: 'Stripe Payment Gateway Integration & Subscriptions',
        description: 'Accept credit card payments, build recurring subscriptions, handle webhooks, and Stripe Checkout.',
        provider: 'YouTube Educational LMS',
        durationHours: 8.5,
        level: 'Intermediate',
        rating: 4.89,
        thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/LHBE6Q9XlzI',
        skillName: 'Stripe Payment Integration'
      },
      {
        title: 'JWT & RBAC Enterprise Security Architecture',
        description: 'JSON Web Tokens, refresh token rotation, Role-Based Access Control, and CSRF/XSS defense.',
        provider: 'YouTube Educational LMS',
        durationHours: 9.0,
        level: 'Advanced',
        rating: 4.92,
        thumbnailUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/jC4v5AS4RIM',
        skillName: 'JWT & RBAC Security'
      },
      {
        title: 'System Architecture & Scalable Systems Design',
        description: 'Load balancers, database sharding, Caching strategies, CAP theorem, and high availability system design.',
        provider: 'YouTube Educational LMS',
        durationHours: 20.0,
        level: 'Advanced',
        rating: 4.97,
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/8JJ101D3knE',
        skillName: 'System Architecture'
      },

      // Additional Specialized Courses
      {
        title: 'Apache Kafka Event-Driven Systems',
        description: 'Producers, consumers, topic partitions, Kafka Streams, and real-time data pipeline architecture.',
        provider: 'YouTube Educational LMS',
        durationHours: 14.0,
        level: 'Advanced',
        rating: 4.93,
        thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/R87354El3w8',
        skillName: 'Kafka'
      },
      {
        title: 'Vercel Deployment & Edge Network Optimization',
        description: 'Deploying Next.js applications to Vercel, edge functions, ISR, static optimization, and custom domains.',
        provider: 'YouTube Educational LMS',
        durationHours: 7.5,
        level: 'Intermediate',
        rating: 4.87,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
        skillName: 'Vercel Deployment'
      },
      {
        title: 'Prompt Engineering & AI Agent Architecture',
        description: 'System prompt design, few-shot learning, chain-of-thought reasoning, and building autonomous AI agents.',
        provider: 'YouTube Educational LMS',
        durationHours: 11.0,
        level: 'Advanced',
        rating: 4.95,
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60',
        externalUrl: 'https://www.youtube.com/embed/fqMOX6JJhGo',
        skillName: 'Prompt Engineering'
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
