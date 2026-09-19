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
      title: 'When data becomes big',
      objectives: [
        'Explain volume, velocity, variety and value in practical terms',
        'Estimate why a single machine stops coping',
        'Recognise when a problem is actually small'
      ],
      prerequisites: ['Project 1: The Serverless Progress API'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'In lesson 4 you cleaned and grouped a handful of rows. Now stretch that same idea until one machine can\'t really hold it anymore.',
          'Big data isn\'t a trophy. Most datasets are small and cheaper on one machine, knowing where that boundary is stops you building distributed plumbing you don\'t need.',
          'Volume is how much there is. Velocity is how fast it shows up. Variety is how many different shapes it comes in. Value is whether anyone will actually do anything with the answer. Honestly that last one justifies the other three, without it the rest is just expensive trivia.',
          'Think water. A glass sits fine on a desk, a bathtub needs plumbing, a river needs a treatment plant. The engineering shifts with amount and rate, not with what you call the bottle.',
          'A single machine hits limits pretty quickly. Memory is finite so the data might not fit, disk scans get slow as files swell, and one box can only do so much at once. No amount of tuning removes that ceiling.',
          'Before you reach for a cluster, just ask whether it fits on one machine, whether it fits in memory, and how fast you actually need the answer. In a lot of companies a single decent database and a well written query is enough. Distributed systems are a cost you take on, not a default.'
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
      title: 'Clusters, partitions, replicas and failure',
      objectives: [
        'Split work across partitions for parallel processing',
        'Explain replication and why it exists',
        'Recover from a failed worker without losing the result'
      ],
      prerequisites: ['When Data Becomes Big'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'In lesson 5 you worked out served, missed and wasted per hour. Now we do that same aggregation but split across workers. That\'s basically all distributed processing is.',
          'One big machine has a ceiling. Lots of ordinary machines working together, if they coordinate, don\'t. That one sentence is why clusters exist, and the coordination is where the hard stuff lives.',
          'You split the data into parts and hand each part to a worker. Each worker produces a partial answer, then you combine those partials into the final result. Split, compute, combine, that\'s the loop.',
          'You also keep more than one copy of each partition, usually on different machines in different zones. If a worker dies, its replica picks up. That\'s how distributed storage can promise durability a single disk can\'t.',
          'It\'s a bit like a group exam. One long paper gets split into sections, each student does one section, then you staple the answers together. If one student faints, another with the same section keeps going.',
          'At real scale you should assume a worker will die somewhere. Make each step retryable and make the merge idempotent so a retried partial doesn\'t double count. Also watch your partition key, if it\'s skewed one worker does all the work while the rest wait, and adding machines does nothing.'
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
          'Lesson 6 asked who owns the OS across IaaS and PaaS. Same lens here, do you run Hadoop yourself or let a managed service do it?',
          'These names still pop up in job ads and interviews, so understanding the ideas matters more than memorizing product pages. Once you get the concepts, Spark and Athena and Glue feel like variations rather than new worlds.',
          'MapReduce is simple to state. Map turns each record into key-value pairs, reduce combines all values for each key. Word count is the classic, map each word to (word, 1), then reduce by summing.',
          'The Google File System paper showed how to store huge files across lots of ordinary machines with replication and auto recovery. HDFS is the open source version. Hadoop paired HDFS with MapReduce so computation ran on the same machines that held the data, which avoided pulling everything over the network for every read.',
          'Think of a big kitchen. Chop veggies in parallel, that\'s map. Combine per recipe, that\'s reduce. Keep ingredients next to the cooks so no one walks across the room for every step, that\'s locality.',
          'Spark builds on the same ideas but keeps intermediate data in memory instead of writing to disk between every stage. For multi-step or iterative jobs that\'s way faster. And most teams today just rent the cluster, running your own Hadoop means owning upgrades and failure recovery yourself, which is a full time job.'
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
      title: 'Batch versus streaming',
      objectives: [
        'Distinguish batch and stream processing',
        'Choose a mode from a freshness requirement',
        'State the complexity cost of streaming'
      ],
      prerequisites: ['MapReduce, HDFS, Hadoop and Spark'],
      timeEstimateMin: 25,
      content: {
        explanations: [
          'Lesson 12 had an allow-list that answers right now, lesson 14 wrote files you read later. That immediacy vs later thing is a design call you\'ve already been making without naming it.',
          'Picking the wrong mode is expensive. Batch is simple and cheap and easy to rerun. Streaming gets you answers in seconds, but it has to deal with events that arrive late, twice, or out of order. That robustness costs real effort.',
          'Batch waits and collects data for a while, then runs a job. If something breaks you just rerun it. The catch is the answer is only as fresh as the last run, sometimes that\'s fine, sometimes it\'s not.',
          'Streaming handles each event as it lands and can react immediately. Great for live features, but you\'re signing up for ordering quirks and duplicate handling from day one.',
          'Laundry is the usual analogy. Batch is the weekly wash, efficient and easy to schedule. Streaming is washing each item the second it gets dirty, super responsive but you need a tight process or it\'s chaos.',
          'So don\'t ask can we stream, ask how many seconds late can this decision be. A monthly finance rollup, a fraud alert, and a learners online counter each have a totally different answer, and often the same company does batch for one and streaming for another.'
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
