# VoiceCode.ai Cloud & Big Data Engineering Course Architecture

## Status

**Implementation status: complete.** All 40 lessons across 9 modules are implemented in `curriculum/cloud/phase0.ts` through `phase8.ts` and composed in `cloudBigDataCurriculum.ts`. Every lesson's assessment assertions are verified against reference solutions using the application's own test harness (216 assertions, 40 lesson exercises, 40 runnable demos).

Teaching method for every lesson is governed by `EXPLANATION_AND_TEACHING_PLAYBOOK.md`, and the runtime form of that playbook is wired into the tutor's system instruction in `services/geminiService.ts`.

This document completes stages 1-4 of the requested course process:

1. resource audit;
2. knowledge map;
3. curriculum architecture; and
4. dependency validation.

It is an architecture document, not lesson copy. Individual lessons must be written from this design so that each one can use VoiceCode.ai's voice tutor, Monaco editor, console, exercise runner, debugging challenges, and progress tracking.

## Course Decision

The course is **AWS-first, cloud-concepts-first, and multi-cloud-aware**.

- AWS is the practical platform because the existing VoiceCode curriculum, capstone, and code samples already use AWS.
- Azure and Google Cloud teach comparable cloud concepts and data-architecture trade-offs. They are comparison material, not duplicate lab tracks.
- Hadoop, GFS, and MapReduce establish the reasons distributed systems exist. They are not presented as the default way to build a new system.
- Every cloud lab has a no-cost local simulation where possible. Anything requiring an AWS account is labelled **REAL CLOUD LAB** and starts with cost controls and cleanup.

## Stage 1: Resource Audit

### Supplied resources and best use

| Resource | Material extracted | Best course use | Caution |
| --- | --- | --- | --- |
| [Google Cloud Skills Boost path 118](https://www.cloudskillsboost.google/paths/118) | This path currently introduces Generative AI and responsible AI. | Optional AI orientation only. | It is not a Big Data learning path, so it must not be advertised as one. |
| [Google Cloud Big Data overview](https://cloud.google.com/solutions/big-data) | Big-data lifecycle, batch and stream processing, data management, analytics, security, and cloud data services. | Vendor-neutral vocabulary and comparisons. | Product overview, not a progressive lab course. |
| [AWS Cloud Practitioner Learning Plan](https://explore.skillbuilder.aws/learn/public/learning_plan/view/82/cloud-practitioner-learning-plan) | Cloud value, global infrastructure, shared responsibility, core services, security, pricing. | Foundation reference and optional AWS Cloud Quest practice. | Certification material alone does not make an engineer. |
| [AWS Big Data](https://aws.amazon.com/big-data/) | Data lakes, warehouses, ETL, streaming, query engines, and analytics service selection. | Architecture exercises and current-service fact checks. | Service catalogue, not a beginner sequence. |
| [Azure cloud concepts](https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/) | IaaS, PaaS, SaaS, deployment models, shared responsibility, cloud benefits. | Clear explanations for cloud foundations. | Not a practical data-engineering path. |
| [Azure data architecture guide](https://learn.microsoft.com/en-us/azure/architecture/data-guide/) | Data-store selection, OLTP/OLAP, ETL, lakes, warehouses, resiliency, security. | Advanced design trade-offs. | The supplied URL redirects; verify the current destination before publishing links. |
| [Cloud Computing in 6 Minutes](https://www.youtube.com/watch?v=M988_fsOSWo) | Introductory cloud definitions and deployment/service-model framing. | Optional five-minute prework. | Do not make a video summary the course foundation. |
| [AWS Cloud Practitioner Course](https://www.youtube.com/watch?v=SOTamWNgDKc) | Broad AWS vocabulary: infrastructure, services, security, pricing. | Selective reference when a learner wants another explanation. | The course targets retired CLF-C01 certification content; verify current facts against AWS docs. |
| [AWS data engineering project](https://www.youtube.com/watch?v=qWQJqErt0c8) | No reliable metadata or transcript was available during the audit. | Hold for manual review or replacement. | Do not build a lesson from an unverified source. |
| [Azure Data Factory tutorial](https://www.youtube.com/watch?v=3-E3W-i2pL4) | No reliable metadata or transcript was available during the audit. | Hold for manual review or replacement. | Do not build a lesson from an unverified source. |
| [GCP crash course](https://www.youtube.com/watch?v=jpjN-tUqY3Y) | No reliable metadata or transcript was available during the audit. | Hold for manual review or replacement. | Do not build a lesson from an unverified source. |
| [Big Data in 5 Minutes](https://www.youtube.com/watch?v=bAyrObl7TYE) | Introductory 3Vs framing and analytics use cases. | A prompt for the "when does ordinary data become a data-engineering problem?" discussion. | Definitions need practical follow-through. |
| [Hadoop tutorial](https://www.youtube.com/watch?v=1vbXmCrkT3Y) | HDFS, MapReduce, and Hadoop ecosystem concepts. | Historical comparison after distributed-system principles. | Avoid a Hadoop-first practical course. |
| [Above the Clouds](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-28.pdf) | Elasticity, utilization, pay-as-you-go economics, cloud obstacles. | Cloud economics and elasticity reasoning exercise. | Foundational historical paper, not current platform guidance. |
| [Big Data on Cloud Computing review](https://www.researchgate.net/publication/268151525_Big_Data_on_Cloud_Computing_Review_and_Open_Research_Issues) | Big-data/cloud opportunities and high-level challenges. | Supplementary trade-off discussion. | 2019 review; do not use it to choose current services. |
| [Google File System](https://research.google.com/archive/gfs.html) | Large-file workloads, fault tolerance, replication, distributed storage trade-offs. | Explain why partitions, nodes, and recovery exist. | Principle source, not a design template for AWS services. |
| [MapReduce](https://research.google.com/archive/mapreduce.html) | Map, reduce, partitioning, scheduling, retries, parallel data processing. | Bridge a local word-count exercise to distributed batch processing. | Historical model; modern managed processing abstracts much of this work. |

### Duplicate material to merge

- The short Simplilearn cloud and big-data videos overlap with the AWS/Azure fundamentals. Keep them as optional primers, not lessons.
- Cloud Practitioner material repeats cloud basics, security, pricing, and services. Extract the clear explanations, then teach engineering practice with labs.
- GFS, Hadoop, and MapReduce all cover distributed storage and batch computation. Teach the GFS/MapReduce mental models once, then compare Hadoop briefly.
- Berkeley's paper and the 2019 review both discuss elasticity and scale. Use Berkeley for the economic intuition and the review only as supplementary reading.

### Gaps in the current sources and current 11-lesson implementation

The existing curriculum begins with cloud regions, then IAM, then Lambda. That assumes knowledge a beginner does not have. It also omits or under-teaches:

- HTTP, APIs, JSON, command line, Git, SQL, and basic data literacy;
- cloud account safety, MFA, budgets, tagging, regions, cleanup, and shared responsibility;
- compute trade-offs: EC2, containers, serverless, load balancing, and auto scaling;
- object, block, and file storage; encryption and S3 public-access risks;
- relational databases, caches, database selection, and DynamoDB access-pattern design;
- networking concepts required to reason about a production architecture;
- distributed-system mechanics: partitions, replicas, nodes, clusters, retries, idempotency, and backpressure;
- data formats, schema evolution, data quality, small files, and Apache Iceberg/lakehouse concepts;
- orchestration, backfills, failure recovery, data governance, and privacy;
- streaming mechanics: ordering, duplicates, event time, windows, consumer groups, replay, throttling, and dead-letter paths;
- infrastructure as code, observability, incident response, cost analysis, and teardown verification;
- RAG evaluation, document safety, and retrieval failure modes.

### Source-quality rules

1. Current official AWS documentation wins when a video, paper, or course disagrees.
2. Cost, quota, model availability, service limits, and exam objectives are never hard-coded as timeless facts.
3. Video transcripts and papers inform explanations. They are not copied into VoiceCode.ai.
4. Every external lab needs a no-surprise-cost path, an explicit cleanup step, and a local simulation alternative.

## Stage 2: Knowledge Map

```text
Cloud & Big Data Engineering
|
|-- Foundation skills
|   |-- Internet: client/server, HTTP, REST, JSON, APIs
|   |-- Developer tools: terminal, Git, environment variables
|   |-- Data literacy: rows, columns, files, SQL, data quality
|
|-- Cloud foundations
|   |-- On-premises versus cloud
|   |-- IaaS, PaaS, SaaS; public, private, hybrid cloud
|   |-- Regions, Availability Zones, edge locations
|   |-- Elasticity, availability, fault tolerance, shared responsibility
|   |-- Pricing, budgets, tags, cost trade-offs
|
|-- Security and networking
|   |-- Authentication versus authorization; IAM identities, roles, policies
|   |-- Least privilege, MFA, temporary credentials, KMS, secrets
|   |-- VPC, subnets, security groups, public/private boundaries
|   |-- Logging, audit, privacy, classification, governance
|
|-- Application systems
|   |-- Compute: EC2, containers, Lambda; when to choose each
|   |-- Storage: S3, EBS, EFS; objects, blocks, files
|   |-- Databases: RDS, DynamoDB, cache; SQL versus NoSQL
|   |-- APIs: API Gateway, Lambda, DynamoDB, event-driven patterns
|
|-- Distributed and big-data foundations
|   |-- Why single-machine processing fails
|   |-- Nodes, clusters, partitions, replicas, horizontal scaling
|   |-- Batch versus streaming; throughput versus latency
|   |-- GFS, MapReduce, HDFS, Spark, Kafka as mental models
|
|-- Data engineering
|   |-- Ingest, validate, transform, publish, observe
|   |-- CSV, JSON, Parquet, Avro, column versus row storage
|   |-- S3 data lake, zones, partitions, compaction, catalog
|   |-- Glue, Athena, SQL, Redshift, lakehouse/Iceberg
|   |-- Orchestration, retries, idempotency, backfills, data quality
|
|-- Streaming systems
|   |-- Events, producers, consumers, partitions/shards
|   |-- Kinesis, Kafka/MSK concepts, Firehose, stream processing
|   |-- Ordering, duplicates, windows, backpressure, replay, DLQs
|
|-- Operations and architecture
|   |-- CloudWatch logs, metrics, alarms, traces, incident response
|   |-- Load balancers, queues, caches, CDN, multi-AZ design
|   |-- Reliability, security, performance, cost, operational trade-offs
|
|-- AI data systems
    |-- Bedrock and model/API fundamentals
    |-- Embeddings, vector search, chunking, retrieval
    |-- RAG grounding, citations, evaluation, privacy and cost
```

## Stage 3: Optimized Curriculum Architecture

**Format:** 10 weeks, 40 lessons, approximately 40-55 hours. Each lesson is 25-45 minutes and uses the sequence **Why -> What -> Mental Model -> Demo -> Guided Practice -> Break It -> Debug -> Production Insight**.

### Phase 0: Start Safely (4 lessons)

| Lesson | Level | Prerequisites | Practical activity | Skill gained |
| --- | --- | --- | --- | --- |
| 1. Your Learning Lab and Cloud Safety | Beginner | None | Local simulation: configure a fake account budget and teardown checklist. | Cost-aware cloud habits. |
| 2. How the Web Talks: HTTP, APIs, and JSON | Beginner | None | Build and inspect a JSON request/response. | Can explain a client-server API. |
| 3. Terminal, Git, and Environment Variables | Beginner | None | Local simulation: read configuration without exposing a secret. | Can use the minimum engineering workflow. |
| 4. Data Basics: Tables, Files, SQL, and Bad Data | Beginner | None | Query a small learner-events dataset and find malformed rows. | Data literacy and quality mindset. |

### Phase 1: Cloud Foundations (4 lessons)

| Lesson | Level | Prerequisites | Practical activity | Skill gained |
| --- | --- | --- | --- | --- |
| 5. Why Cloud Exists | Beginner | Phase 0 | Compare fixed-server and variable-demand cost scenarios. | Explains cloud value and elasticity. |
| 6. IaaS, PaaS, SaaS, and Shared Responsibility | Beginner | Lesson 5 | Sort responsibilities across a hosted app scenario. | Chooses an appropriate service model. |
| 7. Regions, Availability Zones, and Edge Locations | Beginner | Lesson 5 | Design a resilient India-based deployment. | Reasons about latency and availability. |
| 8. Cloud Cost: Pricing, Tags, Budgets, and Cleanup | Beginner | Lesson 5 | Diagnose a simulated unexpected bill. | Builds cost controls before resources. |

### Phase 2: Security and Network Boundaries (4 lessons)

| Lesson | Level | Prerequisites | Practical activity | Skill gained |
| --- | --- | --- | --- | --- |
| 9. Identity: Authentication vs Authorization | Beginner | Phase 1 | Trace who is allowed to call an API. | Separates identity from permissions. |
| 10. IAM Policies, Roles, and Least Privilege | Beginner | Lesson 9 | Write and repair an S3/Lambda role policy. | Grants narrow service access. |
| 11. Secrets, Encryption, and Sensitive Data | Beginner | Lesson 10 | Remove credentials and PII from a broken app/log. | Protects secrets and data. |
| 12. VPCs, Subnets, and Security Groups | Intermediate | Lessons 7, 10 | Place API and database into a safe network diagram. | Explains public/private access boundaries. |

### Phase 3: Build a Cloud Application (6 lessons)

| Lesson | Level | Prerequisites | Practical activity | Skill gained |
| --- | --- | --- | --- | --- |
| 13. Compute Choices: EC2, Containers, or Lambda? | Beginner | Phase 1 | Choose a compute model for three workloads. | Makes a compute trade-off. |
| 14. S3: Object Storage Without Surprises | Beginner | Lessons 8, 10 | Design a bucket, upload simulation, and fix AccessDenied. | Uses safe object storage concepts. |
| 15. Storage Choices: Object, Block, and File | Beginner | Lesson 14 | Match workload to S3, EBS, or EFS. | Selects storage deliberately. |
| 16. Database Choices: SQL, NoSQL, and Cache | Intermediate | Lessons 4, 13 | Model an e-commerce access pattern. | Chooses data stores by workload. |
| 17. DynamoDB: Keys, Queries, and Hot Partitions | Intermediate | Lesson 16 | Model learning progress and repair a Scan/hot-key design. | Designs access-pattern-first tables. |
| 18. Project 1: Serverless Progress API | Intermediate | Lessons 2, 10, 13, 17 | **REAL CLOUD LAB / Local simulation:** API Gateway -> Lambda -> DynamoDB. | Ships and debugs a small serverless API. |

### Phase 4: Big Data Foundations (4 lessons)

| Lesson | Level | Prerequisites | Practical activity | Skill gained |
| --- | --- | --- | --- | --- |
| 19. When Data Becomes Big | Beginner | Lessons 4, 5 | Scale a local aggregation from 100 to conceptual millions of rows. | Understands volume, velocity, variety, and value. |
| 20. Clusters, Partitions, Replicas, and Failure | Intermediate | Lesson 19 | Simulate a partitioned word count with a failed worker. | Reasons about distributed failure. |
| 21. MapReduce, HDFS, Hadoop, and Spark | Intermediate | Lesson 20 | Map and reduce learner events locally, then map it to managed services. | Understands the lineage of modern processing. |
| 22. Batch versus Streaming | Intermediate | Lesson 19 | Classify workloads and justify latency/cost trade-offs. | Chooses processing mode. |

### Phase 5: Data Lakes and Batch Analytics (6 lessons)

| Lesson | Level | Prerequisites | Practical activity | Skill gained |
| --- | --- | --- | --- | --- |
| 23. CSV, JSON, Parquet, Avro, and Schema | Intermediate | Lessons 4, 19 | Compare equivalent event data and select a format. | Explains row/column trade-offs. |
| 24. S3 Data Lake Design | Intermediate | Lessons 14, 23 | Build raw/clean/curated zones and date partitions. | Designs query-efficient layouts. |
| 25. Glue Catalog and Athena SQL | Intermediate | Lesson 24 | Query partitioned learner events with SQL. | Queries a lake without servers. |
| 26. ETL: Clean, Validate, Transform, Publish | Intermediate | Lessons 23-25 | Transform bad JSON to clean partitioned records. | Builds a testable batch transformation. |
| 27. Warehouses, Lakehouses, Redshift, and Iceberg | Advanced | Lessons 24-26 | Choose an architecture for BI, changing schemas, and concurrent users. | Evaluates lake/warehouse/lakehouse trade-offs. |
| 28. Project 2: Learning-Events Data Lake | Intermediate | Lessons 24-26 | **REAL CLOUD LAB / Local simulation:** S3 -> Glue -> Athena, including query-cost comparison. | Delivers an analyzable data lake. |

### Phase 6: Pipelines and Streaming (5 lessons)

| Lesson | Level | Prerequisites | Practical activity | Skill gained |
| --- | --- | --- | --- | --- |
| 29. Reliable Pipelines: Orchestration, Retries, and Idempotency | Intermediate | Lesson 26 | Repair a duplicate-producing pipeline. | Designs retry-safe processing. |
| 30. Events, Producers, Consumers, and Partitions | Intermediate | Lesson 22 | Simulate producers and consumer groups. | Understands stream topology. |
| 31. Kinesis, Kafka Concepts, and Firehose | Intermediate | Lesson 30 | Select a partition key and tune delivery buffering. | Chooses a managed streaming path. |
| 32. Event Time, Windows, Duplicates, and Backpressure | Advanced | Lesson 31 | Process late and duplicate ride events. | Handles real streaming failure modes. |
| 33. Project 3: Real-Time Learning Analytics | Advanced | Lessons 28-32 | **REAL CLOUD LAB / Local simulation:** events -> stream -> S3 -> analytics. | Designs a reliable streaming pipeline. |

### Phase 7: Production Architecture (4 lessons)

| Lesson | Level | Prerequisites | Practical activity | Skill gained |
| --- | --- | --- | --- | --- |
| 34. Logs, Metrics, Traces, and Alarms | Intermediate | Lessons 18, 29 | Investigate a simulated failing Lambda from structured logs. | Uses observability to debug. |
| 35. Scalable Architecture: Queues, Caches, CDNs, and Load Balancers | Advanced | Lessons 13, 17, 30 | Redesign an API facing 100x traffic. | Explains component-level scaling. |
| 36. Governance, Privacy, Backup, and Disaster Recovery | Advanced | Lessons 11, 24, 34 | Classify data and propose retention/recovery rules. | Designs for responsible data operations. |
| 37. Infrastructure as Code and Production Readiness | Advanced | Lessons 18, 28, 34 | Review a small infrastructure plan and teardown path. | Creates reproducible environments. |

### Phase 8: AI Data Systems and Capstone (3 lessons)

| Lesson | Level | Prerequisites | Practical activity | Skill gained |
| --- | --- | --- | --- | --- |
| 38. Foundation Models and Bedrock | Intermediate | Lessons 10, 18 | Call a model through a safe backend simulation. | Controls model access, latency, and cost. |
| 39. RAG: Retrieval, Grounding, Citations, and Evaluation | Advanced | Lessons 23, 38 | Build a small grounded-answer simulation and diagnose weak retrieval. | Designs a verifiable RAG flow. |
| 40. Final Capstone: VoiceCode Learning Intelligence Platform | Advanced | Lessons 1-39 | Design, implement, test, observe, cost, secure, and explain the full platform. | Can defend a real cloud/data/AI architecture. |

### Capstone architecture

```text
VoiceCode client
  -> API Gateway / authenticated API
  -> Lambda services with least-privilege roles
  -> DynamoDB for operational learner progress
  -> Kinesis / Firehose for learning events
  -> S3 raw, clean, and curated data-lake zones
  -> Glue catalog + ETL + Athena analytics
  -> CloudWatch logs, metrics, alarms, and audit evidence
  -> Bedrock + a vetted retrieval layer for grounded tutor answers
```

The learner must submit an architecture explanation, a threat/cost review, an error investigation, an analytics query, and a cleanup plan. A working service alone is not enough.

## Stage 4: Dependency Validation

The dependency chain is deliberate:

```text
HTTP + JSON + data literacy
  -> cloud value + cost controls
  -> IAM + secrets + networking
  -> compute + storage + database choices
  -> serverless API project
  -> distributed-system principles
  -> formats + data-lake design + Athena/Glue
  -> batch data-lake project
  -> reliability + streaming mechanics
  -> streaming project
  -> observability + scalable architecture + governance + IaC
  -> Bedrock + RAG
  -> final capstone
```

Validation outcomes:

- No learner encounters IAM, Lambda, SQL, S3 partitioning, or RAG before the concepts it depends on.
- S3 appears first as simple storage, then returns as a data lake. IAM returns in every AWS module. SQL returns in analytics. This creates planned repetition rather than duplicate lessons.
- Each project uses only previously taught building blocks.
- Advanced topics are only introduced after a smaller, runnable local model has given the learner intuition.

## What Changes From the Existing Course and Why

| Existing approach | Optimized approach | Reason |
| --- | --- | --- |
| 11 lessons over 6 weeks | 40 short lessons over 10 weeks | A true beginner needs a gradual path, frequent practice, and retention checkpoints. |
| IAM follows regions immediately | HTTP, JSON, terminal, Git, data, and cost foundations come first | Prevents unexplained terminology and unsafe account usage. |
| Lambda is introduced before compute choices | EC2, containers, and serverless are compared first | Learners understand why Lambda is chosen. |
| Data lake arrives before big-data mental models and formats | Distributed systems and formats precede lake design | Partitioning, Parquet, and query costs become intuitive. |
| Kinesis focuses on happy-path partition keys | Streaming includes ordering, duplicates, windows, backpressure, replay, and recovery | Reflects real engineering work. |
| Observability is one analytics lesson | Operations, governance, and IaC are separate production modules | Production capability needs more than dashboards. |
| Bedrock and RAG are a short ending | AI includes grounding, citations, retrieval failure, privacy, evaluation, and cost | A trustworthy tutor requires safeguards. |

## Lesson Production Contract

Every lesson produced from this architecture must contain:

- beginner-friendly spoken opening: problem, analogy, and mental model;
- technical definition after the plain-English explanation;
- one runnable local simulation and, when useful, an optional real-cloud lab;
- a guided task, independent task, and deliberately broken version to debug;
- common mistakes, security implication, cost implication, and production trade-off;
- voice-tutor Socratic questions at recall, apply, and predict levels;
- a short assessment and an explicit connection to the next lesson.

## Refinements (v1.1) — Integrated Into Lesson Production

These four refinements are binding constraints on every lesson written from this architecture.

### R1. Foundation drills to prevent skill atrophy

Phase 0 skills (terminal, Git, environment variables, HTTP/JSON, SQL, data quality) must be reused, not merely revisited.

- From Phase 1 onward, every lesson opens with a **Foundation Drill** as `explanations[0]`: one short callback that reuses a Phase 0 skill inside the new topic.
- Examples: the IAM lesson reads a policy value from an environment variable; the Athena lesson first writes the equivalent `GROUP BY` by hand; the observability lesson inspects a Git diff of a broken handler; the IaC lesson simulates `git commit` of an infrastructure change.
- Each phase must contain at least two lessons that have the learner **type a terminal command or edit a config value**, not only read about it.
- A lesson may not introduce a new tool if the learner has never applied the Phase 0 prerequisite for it.

### R2. Smooth SQL ladder from Lesson 4 to Athena

Basic SQL (`SELECT`, `WHERE`, `LIMIT`) appears in Phase 0. Analytical SQL is not introduced cold in Phase 5. The ladder is explicit:

```text
Lesson 4    SELECT, WHERE, LIMIT, GROUP BY, COUNT vs COUNT(DISTINCT)
Lesson 16   filtering and joining operational rows (SQL thinking for databases)
Lesson 23   data types, schema, and why columnar formats change the query plan
Lesson 25   HAVING, ORDER BY, aggregations over partitions, date functions, CTAS
Lesson 27   window functions, deduplication, upserts, and MERGE-style patterns
Lesson 29   incremental SQL: partitions, backfills, and idempotent overwrite
```

Lesson 25 must open with a **SQL bridge**: the learner writes a simple `GROUP BY`, then extends it step by step into `GROUP BY ... HAVING`, then adds a partition filter, then compares scanned bytes with and without the filter. The ideas `HAVING` vs `WHERE` and `partition pruning` are taught as consequences, not vocabulary.

### R3. RAG must be fed by the Phase 5 and 6 pipelines

The AI lessons reuse the exact data engineering the learner already built.

- Lesson 38 establishes the model call with a small, safe corpus.
- Lesson 39 ingests the **curated zone produced by the Phase 5 ETL project** and the **Phase 6 streaming project output**, not an unrelated dataset.
- The chunking step is presented as the same clean/transform/publish logic from Lesson 26, applied to documents instead of events.
- Embedding ingestion must reuse the idempotency and deduplication reasoning from Lesson 29, so re-running ingestion does not duplicate vectors.
- Retrieval failure is diagnosed with observability from Lesson 34 and evaluated with data-quality thinking from Lesson 4.

### R4. Local simulation fidelity

A local simulation that is more permissive than the cloud teaches bad habits. Simulations must encode the real constraint that will later cause a production failure.

- **DynamoDB simulation:** partition key required and non-empty; case-sensitive keys; item size limit (400 KB); 1 MB per query page with pagination; `Query` cannot run without a partition key; hot partition behaviour when a key has low cardinality; conditional writes for idempotency.
- **S3 simulation:** keys are unique and immutable, a re-upload overwrites unless versioning is on; prefixes are not folders; listing is lexicographic; no partial file writes for large objects.
- **IAM simulation:** explicit Deny always wins over Allow; actions are case-sensitive; `Resource: "*"` is recorded as a warning by the checker.
- **Kinesis simulation:** a partition key maps deterministically to a shard; one slow consumer blocks only its shard; buffer/batch settings change object count.
- **Athena simulation:** cost scales with bytes scanned, so a missing partition filter must visibly increase the simulated cost.
- **Bedrock simulation:** token-based cost and latency; a missing model permission fails before the call.

Where a faithful simulation is not possible in the browser, the lesson must state the constraint explicitly and mark the real behaviour as **REAL CLOUD LAB**.

## Verification References

- [AWS Cloud Practitioner learning](https://aws.amazon.com/training/learn-about/cloud-practitioner/)
- [AWS analytics and data lake services](https://aws.amazon.com/big-data/datalakes-and-analytics/)
- [AWS Free Tier and account controls](https://aws.amazon.com/free/)
- [Google Cloud big data overview](https://cloud.google.com/learn/what-is-big-data)
- [Azure data architecture guide](https://learn.microsoft.com/en-us/azure/architecture/databases/)
- [Google File System paper](https://research.google/pubs/the-google-file-system/)
- [MapReduce paper](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/)
