import { LessonMode } from '../../types';

/**
 * Teaching mode per lesson, derived from LESSON_MODE_MAP.md.
 *
 * - theory:    concept, comparison, policy or architecture judgement.
 *              The lesson workspace hides the editor and the console.
 * - light:     one small idea, 3-8 guided lines. Hints are handy.
 * - hands-on:  real logic worth building, running tests for, and debugging.
 */
export const LESSON_MODES: Record<string, LessonMode> = {
  // Module 1 - Start Safely
  'foundations-cloud-safety': 'theory',
  'foundations-web-http-json': 'light',
  'foundations-tools-git-env': 'light',
  'foundations-data-sql-quality': 'hands-on',

  // Module 2 - Why Cloud Exists
  'cloud-why-exists': 'theory',
  'cloud-service-models': 'theory',
  'cloud-global-infra': 'theory',
  'cloud-cost-controls': 'light',

  // Module 3 - Identity and Network Boundaries
  'security-identity': 'light',
  'security-iam-policies': 'hands-on',
  'security-secrets-encryption': 'light',
  'security-vpc-network': 'light',

  // Module 4 - Build a Cloud Application
  'compute-choices': 'theory',
  'storage-s3': 'light',
  'storage-object-block-file': 'theory',
  'database-choices': 'theory',
  'database-dynamodb': 'light',
  'project-serverless-api': 'hands-on',

  // Module 5 - When Data Becomes Big
  'bigdata-when-data-is-big': 'theory',
  'bigdata-distributed-systems': 'hands-on',
  'bigdata-mapreduce-hadoop-spark': 'hands-on',
  'bigdata-batch-vs-stream': 'theory',

  // Module 6 - Data Lakes and Analytics
  'data-formats-schema': 'light',
  'data-lake-design': 'light',
  'data-glue-athena': 'hands-on',
  'data-etl-pipeline': 'hands-on',
  'data-warehouse-lakehouse': 'theory',
  'project-data-lake': 'hands-on',

  // Module 7 - Reliable Pipelines and Streaming
  'pipeline-reliability': 'hands-on',
  'stream-events-topology': 'light',
  'stream-kinesis-kafka-firehose': 'theory',
  'stream-time-windows-failures': 'hands-on',
  'project-streaming-analytics': 'hands-on',

  // Module 8 - Production Architecture
  'ops-observability': 'light',
  'arch-scalability': 'theory',
  'ops-governance-privacy-dr': 'theory',
  'ops-iac-production': 'light',

  // Module 9 - AI Data Systems and Capstone
  'ai-bedrock': 'light',
  'ai-rag-grounding': 'hands-on',
  'capstone-final': 'hands-on'
};
