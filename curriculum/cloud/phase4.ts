import { Module } from '../../types';

/**
 * Phase 4 — Big Data Foundations (Lessons 19-22).
 * Builds the why of distributed processing before any managed service appears.
 */
export const PHASE_4_MODULE: Module = {
  id: 'cloud-phase-4',
  title: 'Module 5: When Data Becomes Big',
  lessons: [
    {
      id: 'bigdata-when-data-is-big',
      title: 'When Data Becomes Big',
      objectives: [
        'Explain volume, velocity, variety and value in practical terms',
        'Estimate why a single machine stops coping',
        'Recognise when a problem is actually small'
      ],
      prerequisites: ['Project 1: The Serverless Progress API'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Foundation drill. In Lesson 4 you cleaned and grouped a handful of rows. Now we scale that same idea until one machine cannot hold it.',
          'Why this matters. Big data is not a badge of honour. Most datasets are small and are cheaper to process on one machine. Knowing where the boundary lies stops you from building distributed infrastructure you do not need.',
          'The four V words. Volume is how much data. Velocity is how fast it arrives. Variety is how many different shapes it has. Value is whether anyone will act on the result. The last one is the only one that justifies the other three.',
          'Mental model: water. A glass is fine on a desk. A bathtub needs plumbing. A river needs a treatment plant. The engineering problem changes with the volume and the rate, not with the label on the bottle.',
          'Why one machine stops coping. Memory is finite, so the data may not fit. Disk reads are slow, so scanning a huge file takes time. And a single machine cannot be in two places, so there is a hard ceiling on throughput no matter how much you optimise.',
          'Production insight. Before reaching for a cluster, ask three questions. Does it fit on one machine, does it fit in memory, and how fast does the answer need to be? In many companies the correct answer is a single well-indexed database plus one good query. Distributed systems are a cost, not a default.'
        ],
        demos: [
          {
            code: `// Scaling intuition, without running anything expensive.
function naivePairCount(n) {
  // Every item compared with every other item.
  return (n * (n - 1)) / 2;
}

function singlePassSum(rows) {
  let total = 0;
  for (const value of rows) total += value;
  return total;
}

console.log('Pairs for 100 rows:        ' + naivePairCount(100));
console.log('Pairs for 1,000,000 rows:  ' + naivePairCount(1000000));

// A single pass stays linear: good.
console.log('Single pass over 5 rows:   ' + singlePassSum([1, 2, 3, 4, 5]));

// The lesson: one linear pass scales; nested comparisons explode.
console.log('Ratio of work at 1M vs 100: ' + (naivePairCount(1000000) / naivePairCount(100)));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What do the four V words mean?'
          },
          {
            type: 'apply',
            prompt: 'A startup has two million rows of sales data and one analyst. Do they need a distributed cluster? Justify it.'
          },
          {
            type: 'predict',
            prompt: 'A query joins a table to itself on every row. What happens to its runtime as the table grows ten times?'
          }
        ],
        debugging: [
          {
            buggyCode: `// "We have 50,000 rows, so we need a distributed big data platform."
const rows = 50000;
const plan = { useSparkCluster: true, reason: 'it is big data' };
console.log('Rows that fit comfortably on one machine: ' + rows);`,
            hints: [
              'Roughly how much memory does 50,000 small rows need?',
              'Is the volume the real problem, or the shape of the queries?',
              'What would you try before adding a cluster?'
            ],
            solution: `const rows = 50000;

// 50,000 small rows is a spreadsheets-sized problem.
// Fix the query, add an index, measure, and only then scale out.
const plan = {
  useSparkCluster: false,
  firstSteps: ['add an index', 'rewrite the query', 'measure', 're-measure']
};
console.log(JSON.stringify(plan));`
          }
        ],
        exercises: [
          {
            prompt: 'Write naivePairCount(n) returning the number of unordered pairs, which is n times (n - 1) divided by 2. Also write singlePassSum(rows) returning the sum of all values in one pass.',
            tests: [
              `naivePairCount(100) === 4950`,
              `naivePairCount(1) === 0`,
              `naivePairCount(0) === 0`,
              `singlePassSum([1, 2, 3]) === 6`,
              `singlePassSum([]) === 0`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which question should you ask before adopting a distributed system?',
              choices: ['Does it fit on one machine', 'Is it fashionable', 'How many nodes can we run'],
              answer: 'Does it fit on one machine'
            },
            {
              type: 'mcq',
              prompt: 'The "Value" of the four Vs asks:',
              choices: ['How fast data arrives', 'Whether anyone will act on the result', 'How many formats exist'],
              answer: 'Whether anyone will act on the result'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Volume, velocity, variety, value',
          'Why single machines hit a ceiling',
          'Distributed systems are a cost, not a default'
        ],
        mistakeWatchlist: ['Reaching for a cluster before measuring']
      },
      nextLesson: 'bigdata-distributed-systems'
    },
    {
      id: 'bigdata-distributed-systems',
      title: 'Clusters, Partitions, Replicas and Failure',
      objectives: [
        'Split work across partitions for parallel processing',
        'Explain replication and why it exists',
        'Recover from a failed worker without losing the result'
      ],
      prerequisites: ['When Data Becomes Big'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'Foundation drill. In Lesson 5 you computed served, missed and wasted per hour. Now do the same aggregation in parallel across workers, which is the entire idea behind distributed processing.',
          'Why this matters. One big machine has a ceiling. Many ordinary machines, coordinating correctly, do not. That sentence is the whole reason clusters exist, and the coordination is where all the difficulty lives.',
          'Partitioning. You split the data into parts and give each part to a worker. Each worker computes a partial answer. Then you combine the partial answers into the final result. Split, compute, combine.',
          'Replication. You keep more than one copy of each partition, usually on different machines in different zones. If a worker dies, its replica takes over. This is why distributed storage can promise durability that a single disk cannot.',
          'Mental model: a group exam. One long paper is split into sections. Each student answers one section. Then the answers are stapled together. If a student faints, a second student who has the same section can continue.',
          'Production insight. Failure is normal at scale, not exceptional. Design for it: assume a worker will die, make each step retryable, and make merging idempotent so a retried partial result does not double-count. Partitioning also decides fairness. If your partition key is skewed, one worker does all the work while the rest wait, and no amount of extra machines helps.'
        ],
        demos: [
          {
            code: `// Split, compute, combine.
function partition(records, parts, keyFn) {
  const buckets = [];
  for (let i = 0; i < parts; i++) buckets.push([]);
  for (const record of records) {
    const index = Math.abs(keyFn(record)) % parts;
    buckets[index].push(record);
  }
  return buckets;
}

function mergeCounts(parts) {
  const total = {};
  for (const part of parts) {
    for (const key in part) {
      total[key] = (total[key] || 0) + part[key];
    }
  }
  return total;
}

const events = ['a', 'b', 'a', 'c', 'b', 'a'];
const buckets = partition(events, 2, function (value) { return value.charCodeAt(0); });

function count(bucket) {
  const out = {};
  for (const value of bucket) out[value] = (out[value] || 0) + 1;
  return out;
}

const partials = buckets.map(count);
console.log('Partials: ' + JSON.stringify(partials));
console.log('Merged:   ' + JSON.stringify(mergeCounts(partials)));

// If a worker dies, re-run only its bucket. Merging again must give the same answer.
console.log('Re-merge is safe: ' + JSON.stringify(mergeCounts(partials)));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What are the three stages of distributed processing?'
          },
          {
            type: 'apply',
            prompt: 'One worker dies before returning its partial result. What are your options, and which is safest?'
          },
          {
            type: 'predict',
            prompt: 'Your partition key sends 95 percent of records to one worker. What happens to the total runtime, and does adding workers help?'
          }
        ],
        debugging: [
          {
            buggyCode: `// A retried job double-counts.
const partials = [{ a: 1 }, { a: 1 }];
const merged = {};
for (const part of partials) {
  for (const key in part) merged[key] = (merged[key] || 0) + part[key];
}
// The job was retried and the same partial was merged twice:
console.log(JSON.stringify(merged)); // { a: 2 } but the truth is { a: 1 }`,
            hints: [
              'Why was the same partial merged twice?',
              'What identifies a partial result uniquely?',
              'How would you make the merge safe to retry?'
            ],
            solution: `// Give every partial result a unique id and merge by id.
const processed = {};
function mergeOnce(partials) {
  const merged = {};
  for (const part of partials) {
    if (processed[part.id]) continue; // already merged, skip
    processed[part.id] = true;
    for (const key in part.counts) {
      merged[key] = (merged[key] || 0) + part.counts[key];
    }
  }
  return merged;
}
console.log(JSON.stringify(mergeOnce([{ id: 'p1', counts: { a: 1 } }, { id: 'p1', counts: { a: 1 } }])));`
          }
        ],
        exercises: [
          {
            prompt: 'Write partition(records, parts, keyFn) returning an array of "parts" arrays. Each record goes into bucket Math.abs(keyFn(record)) % parts. Also write mergeCounts(parts) that sums an array of count objects into one object.',
            tests: [
              `partition([1, 2, 3, 4], 2, function (x) { return x; }).length === 2`,
              `partition([1, 2, 3, 4], 2, function (x) { return x; })[0].length === 2`,
              `partition([], 3, function (x) { return x; }).length === 3`,
              `mergeCounts([{ a: 1 }, { a: 2, b: 1 }]).a === 3`,
              `mergeCounts([{ a: 1 }, { a: 2, b: 1 }]).b === 1`,
              `mergeCounts([]).a === undefined`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Why is data replicated across machines?',
              choices: ['To use spare disk', 'So a failed worker does not lose the data', 'To make queries slower'],
              answer: 'So a failed worker does not lose the data'
            },
            {
              type: 'mcq',
              prompt: 'A skewed partition key causes:',
              choices: ['Even load', 'One worker doing most of the work', 'Lower storage cost'],
              answer: 'One worker doing most of the work'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Split, compute, combine',
          'Partitioning and replication',
          'Retry-safe merging',
          'Skew destroys parallelism'
        ],
        mistakeWatchlist: ['Double-counting a retried partial result', 'Skewed partition keys']
      },
      nextLesson: 'bigdata-mapreduce-hadoop-spark'
    },
    {
      id: 'bigdata-mapreduce-hadoop-spark',
      title: 'MapReduce, HDFS, Hadoop and Spark',
      objectives: [
        'Implement map and reduce over a dataset',
        'Explain what HDFS and Hadoop solved in their era',
        'Explain why modern teams often use managed services instead',
        'Describe what Spark adds beyond MapReduce'
      ],
      prerequisites: ['Clusters, Partitions, Replicas and Failure'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'Foundation drill. In Lesson 6 you compared who owns the operating system across IaaS and PaaS. That same question decides whether you run Hadoop yourself or use a managed service.',
          'Why this matters. These names still appear in job descriptions and interviews. Understanding the ideas behind them is what lets you reason about Spark, Athena and Glue later, instead of memorising product names.',
          'MapReduce in one sentence. Map turns each record into key-value pairs; reduce combines all the values for each key into a result. Word count is the canonical example: map each word to the pair (word, 1), then reduce by summing.',
          'HDFS and Hadoop. The Google File System paper showed how to store huge files across many ordinary machines with replication and automatic recovery. HDFS is the open-source version. Hadoop combined HDFS with MapReduce so that the computation ran on the same machines that stored the data, avoiding a network bottleneck for every read.',
          'Mental model: cooking in a huge kitchen. Cut the vegetables in parallel (map), then combine everything per recipe (reduce). Keep the ingredients next to the cooks so nobody walks across the room for every step (data locality).',
          'Where Spark fits. MapReduce writes intermediate results to disk between every stage, which is slow for multi-step work. Spark keeps intermediate data in memory and exposes a richer set of operations, so iterative and multi-stage jobs finish far faster. The ideas are the same; the execution is smarter.',
          'Production insight. Running your own Hadoop cluster means owning dozens of machines, upgrades and failure recovery. Most teams now use managed services that bring the same ideas, or they use a managed query engine over object storage for batch analytics. Learn the concepts, and rent the cluster.'
        ],
        demos: [
          {
            code: `// Word count: the canonical map then reduce.
function mapWords(text) {
  const pairs = [];
  for (const word of text.split(' ')) {
    if (word !== '') pairs.push({ word: word, count: 1 });
  }
  return pairs;
}

function reduceCounts(pairs) {
  const totals = {};
  for (const pair of pairs) {
    totals[pair.word] = (totals[pair.word] || 0) + pair.count;
  }
  return totals;
}

const text = 'the cloud is the cloud';
const pairs = mapWords(text);
const result = reduceCounts(pairs);

console.log('Map output: ' + JSON.stringify(pairs));
console.log('Reduce result: ' + JSON.stringify(result));
console.log('In MapReduce this reduce step runs in parallel per word.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'In MapReduce, what does map produce and what does reduce do with it?'
          },
          {
            type: 'apply',
            prompt: 'Describe how you would count the most common lesson ID in a billion events using map and reduce.'
          },
          {
            type: 'predict',
            prompt: 'A job has ten sequential MapReduce stages. What does writing to disk between each stage do to its runtime, and how does Spark change that?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Counting words but the totals are wrong for repeated words.
function reduceCounts(pairs) {
  const totals = {};
  for (const pair of pairs) {
    totals[pair.word] = pair.count; // overwrites instead of accumulating
  }
  return totals;
}
console.log(JSON.stringify(reduceCounts([{ word: 'a', count: 1 }, { word: 'a', count: 1 }])));
// Prints { a: 1 } but should print { a: 2 }`,
            hints: [
              'What does reduce do to many values that share a key?',
              'Is assignment the same as accumulation?',
              'Which line should add to the existing value?'
            ],
            solution: `function reduceCounts(pairs) {
  const totals = {};
  for (const pair of pairs) {
    // Accumulate: many records share the same key.
    totals[pair.word] = (totals[pair.word] || 0) + pair.count;
  }
  return totals;
}
console.log(JSON.stringify(reduceCounts([{ word: 'a', count: 1 }, { word: 'a', count: 1 }])));`
          }
        ],
        exercises: [
          {
            prompt: 'Write mapWords(text) splitting on single spaces and returning an array of { word, count } objects with count always 1, skipping empty strings. Write reduceCounts(pairs) returning an object mapping each word to the sum of its counts.',
            tests: [
              `mapWords('a b').length === 2`,
              `mapWords('').length === 0`,
              `mapWords('a b a')[2].word === 'a'`,
              `reduceCounts(mapWords('a b a')).a === 2`,
              `reduceCounts(mapWords('a b a')).b === 1`,
              `reduceCounts([]).a === undefined`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'What did HDFS provide?',
              choices: ['A managed SQL service', 'Replicated storage across many machines', 'A message queue'],
              answer: 'Replicated storage across many machines'
            },
            {
              type: 'mcq',
              prompt: 'Spark mainly improves on MapReduce by:',
              choices: ['Using less code', 'Keeping intermediate data in memory', 'Avoiding parallelism'],
              answer: 'Keeping intermediate data in memory'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Map and reduce',
          'HDFS replication and data locality',
          'Why Spark is faster than disk-based MapReduce',
          'Managed services over self-run clusters'
        ],
        mistakeWatchlist: ['Overwriting instead of accumulating in reduce']
      },
      nextLesson: 'bigdata-batch-vs-stream'
    },
    {
      id: 'bigdata-batch-vs-stream',
      title: 'Batch versus Streaming',
      objectives: [
        'Distinguish batch and stream processing',
        'Choose a mode from a freshness requirement',
        'State the complexity cost of streaming'
      ],
      prerequisites: ['MapReduce, HDFS, Hadoop and Spark'],
      timeEstimateMin: 25,
      content: {
        explanations: [
          'Foundation drill. In Lesson 12 you wrote an allow-list that answers in real time, while Lesson 14 wrote files that are read later. Speed of response is a design choice you have already been making.',
          'Why this matters. Choosing the wrong processing mode is one of the most expensive mistakes in data engineering. Batch is simple and cheap. Streaming is powerful and much harder to get correct.',
          'Batch processing collects data over a period, then processes it as a job. It is simple, cheap and easy to re-run if something breaks. Its downside is delay: the answer is only as fresh as the last run.',
          'Stream processing handles each event as it arrives. It gives answers in seconds and can react immediately, but it must cope with events arriving out of order, arriving twice, and arriving late.',
          'Mental model: laundry. Batch is a weekly wash: efficient and easy to schedule. Streaming is washing each item the moment it is dirty: immediate, but you need a much more careful process.',
          'Production insight. The right question is not "can we stream?" but "how many seconds late can this decision be?" A nightly revenue report, a fraud alert, and a learner progress counter have completely different answers, and often the same company uses batch for one and streaming for another.'
        ],
        demos: [
          {
            code: `// Choose the mode from the freshness requirement.
function chooseProcessing(need) {
  if (need.freshnessSeconds <= 60) return 'stream';
  return 'batch';
}

const needs = [
  { name: 'monthly finance report',        freshnessSeconds: 86400 },
  { name: 'fraud detection on payment',    freshnessSeconds: 2 },
  { name: 'learners online right now',     freshnessSeconds: 30 },
  { name: 'weekly model retraining',       freshnessSeconds: 604800 }
];

for (const n of needs) {
  console.log(n.name + ' -> ' + chooseProcessing(n));
}

console.log('Fresher costs more: more services, more failure modes, more tests.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What is the main advantage of batch processing?'
          },
          {
            type: 'apply',
            prompt: 'A dashboard must show the number of learners online right now. Batch or streaming? Why?'
          },
          {
            type: 'predict',
            prompt: 'A team streams everything, including the monthly report, to be modern. What unnecessary problems have they created?'
          }
        ],
        debugging: [
          {
            buggyCode: `// A batch job runs hourly but the product promises live alerts.
const promise = 'alert within 5 seconds';
const implementation = { mode: 'batch', runsEvery: '1 hour' };
console.log('Alert delivered up to ' + 3600 + ' seconds late.');`,
            hints: [
              'What did the product promise, and what did the design deliver?',
              'How fresh must the decision be for the promise to hold?',
              'Which mode meets a five second requirement?'
            ],
            solution: `const promise = 'alert within 5 seconds';
const need = { freshnessSeconds: 5 };

// Batch cannot meet a 5 second promise. Use streaming for the alert path.
const alertMode = need.freshnessSeconds <= 60 ? 'stream' : 'batch';
console.log('Alert path must be: ' + alertMode);

// Keep batch for the historical report, where delay is acceptable.`
          }
        ],
        exercises: [
          {
            prompt: 'Write chooseProcessing(need). Return "stream" when need.freshnessSeconds is 60 or less, and "batch" otherwise.',
            tests: [
              `chooseProcessing({ freshnessSeconds: 2 }) === 'stream'`,
              `chooseProcessing({ freshnessSeconds: 60 }) === 'stream'`,
              `chooseProcessing({ freshnessSeconds: 61 }) === 'batch'`,
              `chooseProcessing({ freshnessSeconds: 86400 }) === 'batch'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Streaming is harder than batch mainly because of:',
              choices: ['The cost of storage', 'Out-of-order, duplicate and late events', 'The need for SQL'],
              answer: 'Out-of-order, duplicate and late events'
            },
            {
              type: 'mcq',
              prompt: 'The right question to choose a mode is:',
              choices: ['Which is more modern', 'How late can the decision be', 'Which uses less code'],
              answer: 'How late can the decision be'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Batch vs streaming trade-offs',
          'Freshness requirement drives the choice',
          'Streaming complexity: late, duplicate, out-of-order'
        ],
        mistakeWatchlist: ['Streaming everything to look modern']
      },
      nextLesson: 'data-formats-schema'
    }
  ]
};
