import { Flow } from '../../types';

/**
 * Flow charts for the Guide tab, keyed by lesson id.
 *
 * Only lessons where a real sequence exists get one. If the idea is a
 * comparison or a judgement, a table already does the job, so it is left alone.
 */
export const LESSON_FLOWS: Record<string, Flow[]> = {
  'foundations-web-http-json': [
    {
      title: 'One request, one response',
      direction: 'horizontal',
      steps: [
        { label: 'Client builds a request', detail: 'method, URL, headers, body' },
        { label: 'Travels over the network' },
        { label: 'Server handles it', detail: 'picks a status code' },
        { label: 'Response returns', detail: 'headers and a body' }
      ]
    }
  ],

  'foundations-data-sql-quality': [
    {
      title: 'From raw rows to a number you can trust',
      steps: [
        { label: 'Rows arrive', detail: 'some are duplicates, some are malformed' },
        { label: 'Drop duplicates by id' },
        { label: 'Reject wrong types', detail: 'a string pretending to be a boolean' },
        { label: 'Group by lesson' },
        { label: 'Count people, not rows', detail: 'COUNT(DISTINCT userId)' }
      ]
    }
  ],

  'security-identity': [
    {
      title: 'Two questions, asked in order',
      steps: [
        { label: 'Request arrives with a token' },
        { label: 'Is the token valid and unexpired?', detail: 'authentication: who are you' },
        { label: 'Does this identity hold this permission?', detail: 'authorization: may you do it' },
        { label: '200 OK, or 403 Forbidden' }
      ]
    }
  ],

  'security-iam-policies': [
    {
      title: 'How AWS evaluates one request',
      steps: [
        { label: 'Request: an action on a resource' },
        { label: 'Start from implicit deny', detail: 'nothing is allowed yet' },
        { label: 'Any Allow match?', detail: 'that gate opens' },
        { label: 'Any explicit Deny match?', detail: 'it slams every gate shut' },
        { label: 'Final decision' }
      ]
    }
  ],

  'security-vpc-network': [
    {
      title: 'A request reaching a private database',
      steps: [
        { label: 'Internet' },
        { label: 'Load balancer', detail: 'public subnet' },
        { label: 'Application', detail: 'private subnet' },
        { label: 'Database', detail: 'private subnet, reachable only from the app' }
      ]
    }
  ],

  'project-serverless-api': [
    {
      title: 'Request path for Project 1',
      steps: [
        { label: 'Client HTTPS call' },
        { label: 'API Gateway route' },
        { label: 'Lambda handler', detail: 'validates the input first' },
        { label: 'DynamoDB write', detail: 'using the execution role, never a key' },
        { label: 'Response back to the client' }
      ]
    }
  ],

  'bigdata-distributed-systems': [
    {
      title: 'Split, compute, combine',
      steps: [
        { label: 'One large data set' },
        { label: 'Partition across workers' },
        { label: 'Each worker computes a partial' },
        { label: 'Merge partials into one result', detail: 'safe to repeat, so a retry cannot double-count' },
        { label: 'Re-run one partition if a worker dies' }
      ]
    }
  ],

  'bigdata-mapreduce-hadoop-spark': [
    {
      title: 'MapReduce in four steps',
      steps: [
        { label: 'Input is split per worker' },
        { label: 'Map emits key and value pairs', detail: 'word, 1' },
        { label: 'Shuffle groups values by key' },
        { label: 'Reduce combines each group', detail: 'count every value for that key' }
      ]
    }
  ],

  'data-lake-design': [
    {
      title: 'Three zones of trust',
      steps: [
        { label: 'Raw', detail: 'exactly as received, kept for replay' },
        { label: 'Clean', detail: 'validated, deduplicated, correct types' },
        { label: 'Curated', detail: 'business-ready tables' },
        { label: 'Catalog', detail: 'makes all of it discoverable' }
      ]
    }
  ],

  'data-glue-athena': [
    {
      title: 'How a SQL query reaches your files',
      steps: [
        { label: 'You write SQL' },
        { label: 'Glue Data Catalog supplies schema and partitions' },
        { label: 'Engine reads only matching S3 partitions', detail: 'this is what makes it cheap' },
        { label: 'Results returned, billed by bytes scanned' }
      ]
    }
  ],

  'data-etl-pipeline': [
    {
      title: 'The four ETL steps',
      steps: [
        { label: 'Clean', detail: 'drop malformed rows and duplicates' },
        { label: 'Validate', detail: 'types and ranges must hold' },
        { label: 'Transform', detail: 'reshape it for analytics' },
        { label: 'Publish', detail: 'deterministic partition, overwritten on re-run' }
      ]
    }
  ],

  'project-data-lake': [
    {
      title: 'Project 2 end to end',
      steps: [
        { label: 'Events land in the raw zone' },
        { label: 'Job cleans and validates them' },
        { label: 'Parquet written to clean/, partitioned by date' },
        { label: 'Curated table aggregates completions per lesson per day' },
        { label: 'Athena queries the curated table' },
        { label: 'CloudWatch logs counts in and counts out' }
      ]
    }
  ],

  'stream-events-topology': [
    {
      title: 'Producer to consumer',
      steps: [
        { label: 'Producer writes an event with a key' },
        { label: 'The key decides the partition' },
        { label: 'That partition keeps per-key order' },
        { label: 'A consumer group reads each partition once' },
        { label: 'Replay from an earlier offset after a bug' }
      ]
    }
  ],

  'project-streaming-analytics': [
    {
      title: 'Live path and authoritative path',
      steps: [
        { label: 'Client emits an event', detail: 'with an id and an event time' },
        { label: 'Partition by learner id' },
        { label: 'Consumer deduplicates by id' },
        { label: 'Tumbling window counts by event time' },
        { label: 'Live counter updates, the batch lake stays authoritative' }
      ]
    }
  ],

  'ops-observability': [
    {
      title: 'From symptom to cause',
      steps: [
        { label: 'A metric crosses its threshold' },
        { label: 'Alarm fires with a next step attached' },
        { label: 'Trace shows which service was slow' },
        { label: 'Logs show the actual error' }
      ]
    }
  ],

  'arch-scalability': [
    {
      title: 'Scaling order, cheapest first',
      steps: [
        { label: 'Cache what is asked for repeatedly' },
        { label: 'Queue the burst instead of failing it' },
        { label: 'Add servers' },
        { label: 'Shard the data' },
        { label: 'Multi-region, only if the business needs it' }
      ]
    }
  ],

  'ai-bedrock': [
    {
      title: 'One model call',
      steps: [
        { label: 'System instruction sets the behaviour' },
        { label: 'Messages carry the conversation' },
        { label: 'Model returns text' },
        { label: 'You pay for input and output tokens' }
      ]
    }
  ],

  'ai-rag-grounding': [
    {
      title: 'Retrieval-augmented generation',
      steps: [
        { label: 'Curated documents' },
        { label: 'Chunk into passages' },
        { label: 'Embed each chunk' },
        { label: 'Store the vectors' },
        { label: 'Embed the question and retrieve nearest chunks' },
        { label: 'Model answers from those chunks only, with citations' }
      ]
    }
  ]
};
