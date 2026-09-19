# Lesson Mode Map — Theory vs Coding

**Purpose:** every one of the 40 lessons currently ships with a forced JavaScript exercise, because the lesson contract was uniform. That is wrong pedagogically. Some lessons are pure concept, judgement, or architecture decisions; forcing code into them adds noise. This map classifies every lesson in every module.

**Modes**

| Mode | Meaning | What the learner does |
| --- | --- | --- |
| **THEORY** | Concept, comparison, policy or architecture judgement. Code adds nothing. | Answer reasoning questions, choose a design, justify a trade-off. |
| **LIGHT** | One small idea that becomes clear the moment it is typed. 3–8 lines, heavily guided. | Fill in a short function with hints visible from the start. |
| **HANDS-ON** | Real practice: logic worth building and debugging. | Write, run tests, break it, fix it. |

**Summary:** 13 theory · 14 light · 13 hands-on.

---

## Module 1 — Start Safely

| # | Lesson | Mode | Why | Practice form |
| --- | --- | --- | --- | --- |
| 1 | Your Learning Lab and Cloud Safety | **THEORY** | Cost discipline, budgets and teardown are habits, not code. | Decision drill: given a bill and 4 actions, pick the fix and justify it. |
| 2 | HTTP, APIs and JSON | **LIGHT** | Parsing JSON and reading a status code is a first real code moment. | Keep `parseJsonSafe` — small, satisfying, immediately useful. |
| 3 | Terminal, Git and Environment Variables | **LIGHT** | Reading config from the environment is the core habit. | Keep `getConfig`, plus one command-ordering question. |
| 4 | Data Basics: Tables, Files, SQL, Bad Data | **HANDS-ON** | Filtering, deduplicating and grouping is genuine logic. | Keep `validEvents` + `completionsByLesson`. This is the first real coding win. |

## Module 2 — Why Cloud Exists

| # | Lesson | Mode | Why | Practice form |
| --- | --- | --- | --- | --- |
| 5 | Why Cloud Exists | **THEORY** | Economics and the capacity problem. No code expresses it better than a table. | Keep the demand table; ask which option they would buy and why. |
| 6 | IaaS, PaaS, SaaS and Shared Responsibility | **THEORY** | A responsibility model is a comparison, not an algorithm. | Decision drill: given a live service, who patches the OS and who owns the data? |
| 7 | Regions, Availability Zones and Edge Locations | **THEORY** | Placement is a judgement across latency, law and cost. | Case drill: choose a region and zone count for 3 user bases. |
| 8 | Cloud Cost: Pricing, Tags, Budgets and Cleanup | **LIGHT** | Cost arithmetic is worth doing with your hands once. | Keep `lambdaCost`; it makes performance-equals-cost concrete. |

## Module 3 — Identity and Network Boundaries

| # | Lesson | Mode | Why | Practice form |
| --- | --- | --- | --- | --- |
| 9 | Authentication vs Authorization | **LIGHT** | Two short checks; typing them fixes the distinction. | Keep `isAuthenticated` + `isAuthorized`. Very simple, high value. |
| 10 | IAM Policies, Roles and Least Privilege | **HANDS-ON** | Deny precedence and wildcard matching is real logic worth debugging. | Keep `isAllowed`. Add a broken-policy debug. |
| 11 | Secrets, Encryption and Sensitive Data | **LIGHT** | Redaction is a five-line habit. | Keep `redact`. |
| 12 | VPCs, Subnets and Security Groups | **LIGHT** | An allow-list lookup, short and visual. | Keep `isAllowedBySg`. |

## Module 4 — Build a Cloud Application

| # | Lesson | Mode | Why | Practice form |
| --- | --- | --- | --- | --- |
| 13 | Compute Choices: EC2, Containers or Lambda | **THEORY** | Model selection from requirements. | Decision drill: match 4 workloads to a model and justify each. |
| 14 | S3: Object Storage Without Surprises | **LIGHT** | Key building is simple and makes immutability obvious. | Keep `keyFor`. |
| 15 | Storage Choices: Object, Block and File | **THEORY** | Access-pattern matching is a judgement. | Decision drill: S3 or EBS or EFS for 4 workloads. |
| 16 | Database Choices: SQL, NoSQL and Cache | **THEORY** | Access-pattern reasoning, not code. | Decision drill: pick a store per access pattern. |
| 17 | DynamoDB: Keys, Queries and Hot Partitions | **LIGHT** | Key construction and cardinality counting is short and concrete. | Keep `progressKey` + `partitionCardinality`. |
| 18 | Project 1: The Serverless Progress API | **HANDS-ON** | The first real build: validate input, return correct status codes. | Keep `handler`. This is the module's centrepiece. |

## Module 5 — When Data Becomes Big

| # | Lesson | Mode | Why | Practice form |
| --- | --- | --- | --- | --- |
| 19 | When Data Becomes Big | **THEORY** | The four V words are framing. | Reasoning drill: is 50,000 rows a big-data problem? Justify. |
| 20 | Clusters, Partitions, Replicas and Failure | **HANDS-ON** | Split, compute, combine is a real algorithm with real failure modes. | Keep `partition` + `mergeCounts`. |
| 21 | MapReduce, HDFS, Hadoop and Spark | **HANDS-ON** | Implementing map and reduce is the fastest way to internalise it. | Keep `mapWords` + `reduceCounts`. |
| 22 | Batch versus Streaming | **THEORY** | A selection based on freshness requirement. | Decision drill: batch or stream for 5 scenarios. |

## Module 6 — Data Lakes and Analytics

| # | Lesson | Mode | Why | Practice form |
| --- | --- | --- | --- | --- |
| 23 | CSV, JSON, Parquet, Avro and Schema | **LIGHT** | Scan-byte arithmetic makes columnar storage click. | Keep `estimateScan`. |
| 24 | S3 Data Lake Design | **LIGHT** | Key layout is simple; the zone concept is theory. | Keep `lakeKey`. |
| 25 | Glue Catalog and Athena SQL (the SQL Bridge) | **HANDS-ON** | This is where real SQL practice belongs. | Keep the SQL helpers, and add an actual query rewrite exercise. |
| 26 | ETL: Clean, Validate, Transform, Publish | **HANDS-ON** | Cleaning and idempotent publishing is core pipeline logic. | Keep `cleanRows` + `toAnalyticsRow`. |
| 27 | Warehouses, Lakehouses and Iceberg | **THEORY** | Architecture selection. | Decision drill: warehouse, lake or lakehouse for 3 organisations. |
| 28 | Project 2: The Learning-Events Data Lake | **HANDS-ON** | The module's build. | Keep `lakePipeline` + `scanCost`. |

## Module 7 — Reliable Pipelines and Streaming

| # | Lesson | Mode | Why | Practice form |
| --- | --- | --- | --- | --- |
| 29 | Reliable Pipelines: Retries, Idempotency, Backfills | **HANDS-ON** | Idempotency is the single most important pipeline skill. | Keep `dedupeById`. |
| 30 | Events, Producers, Consumers and Partitions | **LIGHT** | Deterministic routing is short but vital. | Keep `shardFor`. |
| 31 | Kinesis, Kafka Concepts and Firehose | **THEORY** | Service selection. | Decision drill: streams, Firehose or Kafka for 3 teams. |
| 32 | Event Time, Windows, Duplicates and Backpressure | **HANDS-ON** | Windowing is the hardest streaming idea; it needs practice. | Keep `windowEvents`. |
| 33 | Project 3: Real-Time Learning Analytics | **HANDS-ON** | The module's build; combines dedupe, shard and window. | Keep `liveCompletions`. |

## Module 8 — Production Architecture

| # | Lesson | Mode | Why | Practice form |
| --- | --- | --- | --- | --- |
| 34 | Logs, Metrics, Traces and Alarms | **LIGHT** | Parsing a structured log is short and immediately useful. | Keep `parseLogLine` + `countErrors`. |
| 35 | Scaling: Queues, Caches, CDNs and Load Balancers | **THEORY** | Component selection and trade-offs. | Decision drill: fix a 100x traffic spike, in the cheapest order. |
| 36 | Governance, Privacy, Backup and Disaster Recovery | **THEORY** | Policy, classification and RPO/RTO are decisions. | Decision drill: classify 5 datasets, set retention and a DR tier. |
| 37 | Infrastructure as Code and Production Readiness | **LIGHT** | Template shape validation is a small real check. | Keep `validateTemplate`. Note: real IaC is YAML, not JS. |

## Module 9 — AI Data Systems and Capstone

| # | Lesson | Mode | Why | Practice form |
| --- | --- | --- | --- | --- |
| 38 | Foundation Models and Amazon Bedrock | **LIGHT** | Request shaping and token arithmetic, short and concrete. | Keep `converseBody` + `tokenCost`. |
| 39 | RAG: Retrieval, Grounding, Citations, Evaluation | **HANDS-ON** | Chunking and grounded prompt assembly is genuine logic. | Keep `chunkDocument` + `buildGroundedPrompt`. |
| 40 | Final Capstone | **HANDS-ON** | The integration build. | Keep the readiness checklist and the composed pipeline. |

---

## What changed in the product (applied)

1. **`mode` field added** to every lesson (`'theory' | 'light' | 'hands-on'`), defined in `curriculum/cloud/lessonModes.ts` and applied in `cloudBigDataCurriculum.ts`.
2. **Theory lessons no longer show the editor or the console.** `LearningView` renders the tutor panel full width with a "Concept lesson" banner. 13 lessons are affected.
3. **Practice coding counts now match each module.** MCQ stays at 4 everywhere; coding is trimmed where the module has no hands-on lessons.
4. **The Coding tab hides itself** if a module ever has zero coding questions.

### Final practice counts

| Module | MCQ | Coding | Why |
| --- | --- | --- | --- |
| 1 Start Safely | 4 | 3 | Basic, so 3 gentle ones |
| 2 Why Cloud Exists | 4 | 2 | Theory module; only cost arithmetic is codeable |
| 3 Identity and Network | 4 | 4 | IAM is genuinely hands-on |
| 4 Build a Cloud App | 4 | 4 | Project 1 |
| 5 When Data Becomes Big | 4 | 4 | Partitions and MapReduce |
| 6 Data Lakes and Analytics | 4 | 4 | SQL, ETL, Project 2 |
| 7 Reliable Pipelines | 4 | 4 | Idempotency, windows, Project 3 |
| 8 Production Architecture | 4 | 2 | No hands-on lessons in this module |
| 9 AI and Capstone | 4 | 4 | RAG and the capstone |
| **Total** | **36** | **31** | 5 coding questions removed as a poor fit |

## Verification

- Source of truth: the 40 lesson objects in `curriculum/cloud/phase0.ts` … `phase8.ts`.
- Counts derived from the actual lesson data, not from memory: 40 lessons, 9 modules, every lesson classified exactly once.
- After the change: 31 coding questions, 134 assertions, **0 failures**; `npm run build` passes.
