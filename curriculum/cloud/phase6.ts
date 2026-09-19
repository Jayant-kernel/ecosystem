import { Module } from '../../types';

/**
 * Phase 6 — Pipelines and Streaming (Lessons 29-33).
 * Playbook R4: the Kinesis simulator maps a partition key deterministically to
 * a shard, so a bad key visibly concentrates load.
 */
export const PHASE_6_MODULE: Module = {
  id: 'cloud-phase-6',
  title: 'Module 7: Reliable Pipelines and Streaming',
  lessons: [
    {
      id: 'pipeline-reliability',
      title: 'Reliable pipelines: retries, idempotency and backfills',
      objectives: [
        'Explain why at-least-once delivery causes duplicates',
        'Make a processing step idempotent',
        'Plan a safe backfill'
      ],
      prerequisites: ['Project 2: The Learning-Events Data Lake'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'In lesson 26 you published to a deterministic partition so reruns were safe. That property has a name, idempotency, and it\'s the most important habit for reliable pipelines.',
          'Distributed systems usually promise at-least-once delivery, which practically means sometimes twice. If your pipeline isn\'t idempotent, retries don\'t just add a little noise, they produce confident, wrong numbers no one notices.',
          'Getting true exactly-once end to end is really hard and expensive. The practical approach is at-least-once delivery with an idempotent consumer, which gives you exactly-once effects without the heroic guarantees.',
          'Picture a hotel key card. Swiping the same card twice doesn\'t book the room twice. The card is the idempotency key, the operation is safe to repeat, that\'s the goal.',
          'You get there by giving each chunk of work a stable unique id, recording which ids you\'ve already handled, and skipping repeats. Or you write to a deterministic destination so the second write just overwrites the first with the same value, same outcome.',
          'Backfills are the same idea for history. When you fix a bug or change a schema you reprocess old partitions. If those writes are partitioned and idempotent you can run them chunk by chunk and stop anytime without corrupting results.',
          'It helps to log counts in and counts out at every stage and alert when they diverge. When something goes wrong the first question is always how many rows did we lose and for which partition, not did an error happen somewhere.'
        ],
        demos: [
          {
            code: `// At-least-once delivery plus an idempotent consumer.
const deliveries = [
  { id: 'e1', value: 10 },
  { id: 'e2', value: 20 },
  { id: 'e1', value: 10 }, // retried by the queue
  { id: 'e3', value: 30 }
];

function dedupeById(events) {
  const seen = {};
  const out = [];
  for (const event of events) {
    if (seen[event.id]) continue;
    seen[event.id] = true;
    out.push(event);
  }
  return out;
}

let total = 0;
for (const event of dedupeById(deliveries)) total += event.value;

console.log('Deliveries received: ' + deliveries.length);
console.log('Unique events:       ' + dedupeById(deliveries).length);
console.log('Correct total:       ' + total);
console.log('Naive total would be: ' + deliveries.reduce(function (a, e) { return a + e.value; }, 0));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Why does at-least-once delivery produce duplicates?'
          },
          {
            type: 'apply',
            prompt: 'Describe two different ways to make a write step idempotent.'
          },
          {
            type: 'predict',
            prompt: 'A consumer is not idempotent and the queue retries after a timeout. What does the final number look like, and would anyone notice?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Revenue is 8 percent higher than the source system.
let total = 0;
const deliveries = [{ id: 't1', amount: 100 }, { id: 't1', amount: 100 }];
for (const d of deliveries) total += d.amount;
console.log('Reported total: ' + total); // 200, source says 100`,
            hints: [
              'How many times was transaction t1 delivered?',
              'Is adding amounts idempotent?',
              'What should the consumer track to skip repeats?'
            ],
            solution: `// Track processed ids so a retry cannot double-apply.
const processed = {};
let total = 0;
const deliveries = [{ id: 't1', amount: 100 }, { id: 't1', amount: 100 }];

for (const d of deliveries) {
  if (processed[d.id]) continue;
  processed[d.id] = true;
  total += d.amount;
}
console.log('Reported total: ' + total); // 100`
          }
        ],
        exercises: [
          {
            prompt: 'Write dedupeById(events) that returns only the first event for each id, preserving order. Events without a usable id should be skipped entirely.',
            tests: [
              `dedupeById([{ id: 'a' }, { id: 'a' }]).length === 1`,
              `dedupeById([{ id: 'a' }, { id: 'b' }]).length === 2`,
              `dedupeById([{ id: 'a' }, { id: 'a' }, { id: 'b' }])[1].id === 'b'`,
              `dedupeById([{}, {}]).length === 0`,
              `dedupeById([]).length === 0`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'The practical way to get exactly-once effects is:',
              choices: ['Exactly-once delivery', 'At-least-once delivery plus an idempotent consumer', 'Never retry'],
              answer: 'At-least-once delivery plus an idempotent consumer'
            },
            {
              type: 'mcq',
              prompt: 'An idempotent step is one where:',
              choices: ['Running it twice gives the same result as once', 'It never fails', 'It is fast'],
              answer: 'Running it twice gives the same result as once'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'At-least-once delivery causes duplicates',
          'Idempotency via processed ids or deterministic writes',
          'Safe partitioned backfills',
          'Counts in and counts out'
        ],
        mistakeWatchlist: ['Non-idempotent consumers double-counting on retry']
      },
      nextLesson: 'stream-events-topology'
    },
    {
      id: 'stream-events-topology',
      title: 'Events, producers, consumers and partitions',
      objectives: [
        'Describe producers, topics, partitions and consumers',
        'Map a partition key deterministically to a shard',
        'Explain consumer groups and replay'
      ],
      prerequisites: ['Reliable Pipelines: Retries, Idempotency and Backfills'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'In lesson 20 you split records across workers. A streaming partition is the same idea, just stretched over an endless, never-ending flow of records.',
          'Live features, counters, alerts, feeds, presence, they all sit on streaming. Once you grasp the topology you can reason about ordering and load instead of guessing.',
          'Producers write events to a topic or stream. The stream is chopped into partitions or shards for parallelism. Consumers read from partitions, and a consumer group splits those partitions among its members so each partition is read by exactly one member in the group.',
          'Supermarket checkouts work as a mental shortcut. Producers are shoppers with baskets, partitions are lanes, consumers are cashiers. Adding cashiers only helps if shoppers spread out. If everyone queues at lane one, the extra staff just stand around.',
          'The partition key decides the lane. All events with the same key land on the same partition, which keeps their order relative to each other. So ordering is per key, not across the whole stream.',
          'Because a stream keeps events for a while, a consumer can rewind and reprocess. That\'s how you recover from a bug, fix the consumer and replay from an earlier offset. It\'s only safe if that consumer is idempotent though, which is why the previous lesson came first.',
          'Picking a good partition key is a trade-off. You want high cardinality and even distribution. Too coarse and you get hot shards and too much forced ordering. Too fine and you lose useful ordering and add overhead. Balance is the trick.'
        ],
        demos: [
          {
            code: `// A partition key maps deterministically to a shard.
function shardFor(key, shardCount) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 1000000007;
  }
  return Math.abs(hash) % shardCount;
}

const keys = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'];
const shardCount = 4;
const load = [0, 0, 0, 0];

for (const key of keys) {
  const shard = shardFor(key, shardCount);
  load[shard]++;
}

console.log('Shard assignment: ' + keys.map(function (k) { return k + '->' + shardFor(k, shardCount); }).join(', '));
console.log('Load per shard: ' + JSON.stringify(load));

console.log('Same key always same shard: ' + (shardFor('u1', shardCount) === shardFor('u1', shardCount)));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Within a consumer group, how many consumers read a given partition?'
          },
          {
            type: 'apply',
            prompt: 'You need events for one user to stay in order. What property must the partition key have?'
          },
          {
            type: 'predict',
            prompt: 'Every event uses the constant key "global". What happens to ordering and to throughput?'
          }
        ],
        debugging: [
          {
            buggyCode: `// All traffic uses one key, so one shard does all the work.
const events = [
  { id: 'e1', key: 'global' },
  { id: 'e2', key: 'global' },
  { id: 'e3', key: 'global' }
];
function shardFor(key, n) { return 0; } // with a constant key, everything lands here
console.log('Shards in use: ' + 1);`,
            hints: [
              'What does the partition key decide?',
              'How many distinct keys are there in this stream?',
              'What key would spread the load while preserving useful order?'
            ],
            solution: `// Use a high-cardinality key such as the userId.
const events = [
  { id: 'e1', key: 'u1' },
  { id: 'e2', key: 'u2' },
  { id: 'e3', key: 'u3' }
];
function shardFor(key, shardCount) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 1000000007;
  return Math.abs(hash) % shardCount;
}
const shards = {};
for (const e of events) {
  const s = shardFor(e.key, 4);
  shards[s] = true;
}
console.log('Shards in use: ' + Object.keys(shards).length);`
          }
        ],
        exercises: [
          {
            prompt: 'Write shardFor(key, shardCount). Compute a hash by starting at 0 and, for each character, setting hash to (hash * 31 + characterCode) modulo 1000000007. Return the absolute value of the hash modulo shardCount, which must always be between 0 and shardCount - 1.',
            tests: [
              `shardFor('u1', 4) === shardFor('u1', 4)`,
              `shardFor('u1', 4) >= 0`,
              `shardFor('u1', 4) < 4`,
              `shardFor('anything', 1) === 0`,
              `(function () { var seen = {}; for (var i = 0; i < 20; i++) { seen[shardFor('user-' + i, 4)] = true; } return Object.keys(seen).length >= 2; })() === true`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Ordering is guaranteed:',
              choices: ['Across the whole stream', 'Per partition key', 'Never'],
              answer: 'Per partition key'
            },
            {
              type: 'mcq',
              prompt: 'Replaying a stream safely requires:',
              choices: ['More shards', 'An idempotent consumer', 'A bigger buffer'],
              answer: 'An idempotent consumer'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Producers, partitions, consumers, consumer groups',
          'Partition key decides the shard and the ordering',
          'Replay requires idempotency',
          'Key cardinality balances order and load'
        ],
        mistakeWatchlist: ['Constant partition keys', 'Assuming global ordering']
      },
      nextLesson: 'stream-kinesis-kafka-firehose'
    },
    {
      id: 'stream-kinesis-kafka-firehose',
      title: 'Kinesis, Kafka concepts and Firehose',
      objectives: [
        'Distinguish a data stream from a delivery stream',
        'Choose a managed streaming service from requirements',
        'Tune buffering to avoid tiny files'
      ],
      prerequisites: ['Events, Producers, Consumers and Partitions'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'In lesson 14 you saw that object keys are written whole. A buffered stream that lands on object storage has to gather enough data per file, otherwise you get the small files problem.',
          'These three services cover most streaming needs, and picking the wrong one means paying for power you don\'t use or missing a feature in prod and scrambling.',
          'Kinesis Data Streams is for ingestion where you write your own consumers. You control retention and you can rewind pretty freely, it\'s the flexible one.',
          'Kinesis Data Firehose is a delivery stream. It buffers and optionally transforms records then writes them to S3 or Redshift or a search service, with no consumer code to maintain. It\'s the quickest route from stream to lake.',
          'Kafka, and its managed cousin MSK, is the ecosystem standard for high-throughput streaming with long retention and rich tooling. If your team already speaks Kafka it\'s often the obvious pick.',
          'A loose picture, stream is the river you can paddle back up. Firehose is the conveyor belt that packages what passes by and delivers it. Kafka is the rail network with timetables and lots of stations. Different trade-offs, same events underneath.',
          'The classic Firehose mistake is a tiny buffer, you end up with thousands of tiny objects per hour. Queries hate that, each object adds overhead. Bigger buffers mean fewer, larger files and cheaper analytics, you just trade a bit of freshness for it.'
        ],
        demos: [
          {
            code: `// Choose a streaming service from requirements.
function chooseDelivery(need) {
  if (need.needCustomConsumersAndReplay) return 'kinesis-data-streams';
  if (need.kafkaCompatibility) return 'msk';
  return 'firehose';
}

const needs = [
  { name: 'custom fraud consumers that replay', needCustomConsumersAndReplay: true },
  { name: 'team already runs Kafka', kafkaCompatibility: true },
  { name: 'simply land events in S3', needManagedDeliveryToS3: true }
];

for (const n of needs) console.log(n.name + ' -> ' + chooseDelivery(n));

// Buffer tuning: small buffers make many small objects.
function objectsPerDay(bufferMB, bufferSeconds, eventsPerSecond, bytesPerEvent) {
  const bytesPerSecond = eventsPerSecond * bytesPerEvent;
  const bySize = bytesPerSecond / (bufferMB * 1024 * 1024);
  const byTime = 1 / bufferSeconds;
  const flushesPerSecond = Math.max(bySize, byTime);
  return Math.round(flushesPerSecond * 86400);
}

console.log('Tiny buffer objects/day:  ' + objectsPerDay(1, 1, 1000, 500));
console.log('Tuned buffer objects/day: ' + objectsPerDay(64, 300, 1000, 500));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Which service delivers records to S3 with no consumer code?'
          },
          {
            type: 'apply',
            prompt: 'You need custom consumers that can replay the last 24 hours. Which service, and why not Firehose?'
          },
          {
            type: 'predict',
            prompt: 'A Firehose buffer is set to 1 MB and 1 second. What does the resulting S3 layout look like, and what does it do to Athena cost?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Firehose writes thousands of tiny objects every second.
const config = { bufferSizeMB: 1, bufferIntervalSec: 1 };
console.log('Config: ' + JSON.stringify(config));
console.log('Athena will read every one of these objects. That is expensive.');`,
            hints: [
              'How many objects per day at this setting?',
              'What does each object cost in query overhead?',
              'Which knob increases the size of each file?'
            ],
            solution: `// Bigger buffer: fewer, larger objects, cheaper queries.
const config = {
  bufferSizeMB: 64,      // accumulate more before writing
  bufferIntervalSec: 300 // or flush every 5 minutes
};
console.log('Tuned: ' + JSON.stringify(config));
// Trade-off: slightly less fresh data in exchange for far cheaper analytics.`
          }
        ],
        exercises: [
          {
            prompt: 'Write chooseDelivery(need). If needCustomConsumersAndReplay is true return "kinesis-data-streams". Otherwise if kafkaCompatibility is true return "msk". Otherwise return "firehose".',
            tests: [
              `chooseDelivery({ needCustomConsumersAndReplay: true }) === 'kinesis-data-streams'`,
              `chooseDelivery({ kafkaCompatibility: true }) === 'msk'`,
              `chooseDelivery({}) === 'firehose'`,
              `chooseDelivery({ needManagedDeliveryToS3: true }) === 'firehose'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which service is a managed delivery stream to S3?',
              choices: ['Kinesis Data Streams', 'Firehose', 'Athena'],
              answer: 'Firehose'
            },
            {
              type: 'mcq',
              prompt: 'A very small Firehose buffer mainly causes:',
              choices: ['Lower cost', 'Many tiny S3 objects', 'Data loss'],
              answer: 'Many tiny S3 objects'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Streams vs delivery streams vs Kafka',
          'Choosing a managed streaming service',
          'Small files problem and buffer tuning',
          'Freshness versus query cost'
        ],
        mistakeWatchlist: ['Tiny buffers creating thousands of small objects']
      },
      nextLesson: 'stream-time-windows-failures'
    },
    {
      id: 'stream-time-windows-failures',
      title: 'Event time, windows, duplicates and backpressure',
      objectives: [
        'Group events into time windows',
        'Handle late-arriving events',
        'Recognise backpressure and throttling'
      ],
      prerequisites: ['Kinesis, Kafka Concepts and Firehose'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'In lesson 29 you deduped by id. With streaming, duplicates are the same headache, just constant, in a system that never sleeps.',
          'These are the four things that actually break streaming projects. The happy path is straightforward, the 3am incident is always a late event, a duplicate, or a shard that stops taking writes.',
          'Event time is when the thing happened on the device, processing time is when your system saw it. A phone offline yesterday uploads today, if you group by processing time history keeps rewriting itself. Group by event time and you get correct windows with a predictable delay.',
          'A tumbling window is a fixed, non-overlapping bucket like each minute. You get the start with integer division, and anything that arrives after the window closed has to be handled on purpose. You might drop it, emit a correction, or wait a grace period, just decide it.',
          'Duplicates come from at-least-once delivery, so you fix them the way you did before, a stable event id and an idempotent consumer, but now applied inside each window.',
          'Backpressure is when the consumer can\'t keep up and lag grows. On the write side a hot shard throttles. Fix it by adding shard capacity, making the consumer faster, or shedding load deliberately instead of hoping it passes.',
          'Publish a lag metric and alert on it, it\'s the single most honest streaming health signal. It tells you how far your answer is from reality, and a pipeline whose lag keeps rising will be wrong by morning, guaranteed.'
        ],
        demos: [
          {
            code: `// Tumbling windows by event time.
function windowEvents(events, windowSeconds) {
  const windows = {};
  for (const event of events) {
    const start = Math.floor(event.ts / windowSeconds) * windowSeconds;
    if (!windows[start]) windows[start] = [];
    windows[start].push(event);
  }
  return windows;
}

const events = [
  { id: 'e1', ts: 10, userId: 'u1' },
  { id: 'e2', ts: 25, userId: 'u2' },
  { id: 'e3', ts: 70, userId: 'u1' },
  { id: 'e4', ts: 15, userId: 'u1' } // arrives late, but belongs to window 0
];

const windows = windowEvents(events, 60);
console.log('Window starts: ' + Object.keys(windows).join(', '));
console.log('Window 0 events: ' + windows[0].length);
console.log('Window 60 events: ' + windows[60].length);

console.log('Late events still land in their event-time window.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What is the difference between event time and processing time?'
          },
          {
            type: 'apply',
            prompt: 'A user\u2019s phone was offline and uploads yesterday\u2019s events now. Which time should the window use, and why?'
          },
          {
            type: 'predict',
            prompt: 'Consumer lag grows steadily for six hours. What is happening, and what will the dashboard show?'
          }
        ],
        debugging: [
          {
            buggyCode: `// A minute-by-minute count uses processing time.
const event = { id: 'e9', eventTime: 10, processingTime: 7200 };
// Grouped by processing time, this event lands in the wrong minute forever.
console.log('Grouped by: processingTime');`,
            hints: [
              'Which timestamp reflects when the thing happened?',
              'Does grouping by arrival time rewrite history?',
              'Which field should the window function use?'
            ],
            solution: `// Always window by event time.
const event = { id: 'e9', eventTime: 10, processingTime: 7200 };
function windowStart(ts, windowSeconds) {
  return Math.floor(ts / windowSeconds) * windowSeconds;
}
console.log('Correct window: ' + windowStart(event.eventTime, 60));
// Then decide how to treat events that arrive after the window closed:
// drop them, emit a correction, or wait for a grace period.`
          }
        ],
        exercises: [
          {
            prompt: 'Write windowEvents(events, windowSeconds) returning an object whose keys are window start times and whose values are arrays of events. Each event has a ts in seconds. The window start is the event ts divided by windowSeconds, rounded down, then multiplied by windowSeconds.',
            tests: [
              `windowEvents([{ ts: 0, id: 'a' }], 60)[0].length === 1`,
              `windowEvents([{ ts: 10, id: 'a' }, { ts: 20, id: 'b' }], 60)[0].length === 2`,
              `windowEvents([{ ts: 70, id: 'c' }], 60)[60].length === 1`,
              `windowEvents([{ ts: 5, id: 'late' }], 60)[0].length === 1`,
              `windowEvents([], 60)[0] === undefined`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Correct streaming windows should be based on:',
              choices: ['Processing time', 'Event time', 'Server clock only'],
              answer: 'Event time'
            },
            {
              type: 'mcq',
              prompt: 'Rising consumer lag means:',
              choices: ['The answer is drifting further from reality', 'Nothing important', 'Storage is full'],
              answer: 'The answer is drifting further from reality'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Event time vs processing time',
          'Tumbling windows and late events',
          'Duplicates in streaming',
          'Backpressure and lag as the key health signal'
        ],
        mistakeWatchlist: ['Window by processing time', 'Ignoring consumer lag']
      },
      nextLesson: 'project-streaming-analytics'
    },
    {
      id: 'project-streaming-analytics',
      title: 'Project 3: real-time learning analytics',
      objectives: [
        'Compose partitioning, windowing and deduplication',
        'Produce a live metric from a raw event stream',
        'State the failure modes your design tolerates'
      ],
      prerequisites: ['Event Time, Windows, Duplicates and Backpressure'],
      timeEstimateMin: 50,
      content: {
        explanations: [
          'In lesson 24 you laid out a batch lake. Now the same data arrives continuously and the answer has to stay fresh, that changes the tactics.',
          'This is the machinery behind features you actually notice, learners online now, live progress bars, instant alerts. It\'s where every streaming gotcha shows up at once.',
          'Events come from the client with an event time and a unique id. The partition key is the learner id, so each learner\'s events stay ordered. The consumer dedupes by id, buckets by a tumbling window on event time, and writes both a live counter and an immutable copy to the lake.',
          'You end up with two paths on purpose. The live path answers what\'s happening now, it can be approximate and recomputed. The batch path lands every event in the lake for exact historical reporting. Running both is normal, not wasteful.',
          'For failures, duplicates get handled by dedupe, out-of-order by event-time windowing, a crashed consumer by replay from a checkpoint plus idempotent writes, and hot shards by a high-cardinality partition key. Each risk has a concrete mitigation.',
          'Write down what your pipeline tolerates and what it doesn\'t. Dropping late events after a grace period is fine if everyone knows the period. If finance thinks the numbers are complete and they\'re not, that\'s a serious bug, so be explicit.'
        ],
        demos: [
          {
            code: `// The complete streaming path, composed from the earlier pieces.
function shardFor(key, shardCount) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 1000000007;
  return Math.abs(hash) % shardCount;
}

function dedupeById(events) {
  const seen = {};
  const out = [];
  for (const e of events) {
    if (seen[e.id]) continue;
    seen[e.id] = true;
    out.push(e);
  }
  return out;
}

function windowEvents(events, windowSeconds) {
  const windows = {};
  for (const e of events) {
    const start = Math.floor(e.ts / windowSeconds) * windowSeconds;
    if (!windows[start]) windows[start] = [];
    windows[start].push(e);
  }
  return windows;
}

function liveCompletions(events, windowSeconds) {
  const clean = dedupeById(events);
  const windows = windowEvents(clean, windowSeconds);
  const counts = {};
  for (const start in windows) {
    counts[start] = windows[start].filter(function (e) { return e.completed; }).length;
  }
  return counts;
}

const stream = [
  { id: 'e1', ts: 10, userId: 'u1', completed: true },
  { id: 'e2', ts: 20, userId: 'u2', completed: true },
  { id: 'e1', ts: 10, userId: 'u1', completed: true }, // duplicate
  { id: 'e3', ts: 75, userId: 'u1', completed: false }
];

console.log('Shard for u1 (of 4): ' + shardFor('u1', 4));
console.log('Live completions by window: ' + JSON.stringify(liveCompletions(stream, 60)));
console.log('Duplicates removed, late events kept in their own window.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Why run a live path and a batch path at the same time?'
          },
          {
            type: 'apply',
            prompt: 'A consumer crashes for ten minutes. Describe exactly how the system recovers without double-counting.'
          },
          {
            type: 'predict',
            prompt: 'The partition key is changed from the learner id to the constant "all". What breaks, and what still works?'
          }
        ],
        debugging: [
          {
            buggyCode: `// The live counter is higher than the batch total for the same hour.
const live = 1050;
const batch = 1000;
console.log('Live: ' + live + ' | Batch: ' + batch + ' | Difference: ' + (live - batch));`,
            hints: [
              'Which path deduplicates, and which one does not?',
              'Are retried deliveries being counted twice in the live path?',
              'What should the live consumer do before counting?'
            ],
            solution: `// The live consumer must deduplicate before counting.
function dedupeById(events) {
  const seen = {};
  const out = [];
  for (const e of events) {
    if (seen[e.id]) continue;
    seen[e.id] = true;
    out.push(e);
  }
  return out;
}
// Also document the truth: the live path is approximate and may be
// recomputed; the batch path over the lake is the authoritative total.`
          }
        ],
        exercises: [
          {
            prompt: 'Write liveCompletions(events, windowSeconds). Remove duplicate ids keeping the first one. Group the remaining events into tumbling windows using their ts. For each window return the count of events where completed is true, keyed by the window start time.',
            tests: [
              `liveCompletions([{ id: 'a', ts: 5, completed: true }], 60)[0] === 1`,
              `liveCompletions([{ id: 'a', ts: 5, completed: true }, { id: 'a', ts: 5, completed: true }], 60)[0] === 1`,
              `liveCompletions([{ id: 'a', ts: 5, completed: false }], 60)[0] === 0`,
              `liveCompletions([{ id: 'a', ts: 5, completed: true }, { id: 'b', ts: 70, completed: true }], 60)[60] === 1`,
              `liveCompletions([], 60)[0] === undefined`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'A late event is handled correctly by:',
              choices: ['Dropping it always', 'Windowing on event time', 'Ignoring windows'],
              answer: 'Windowing on event time'
            },
            {
              type: 'mcq',
              prompt: 'The authoritative total should come from:',
              choices: ['The approximate live counter', 'The batch path over the lake', 'The client'],
              answer: 'The batch path over the lake'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Composing sharding, dedupe and windowing',
          'Live path vs authoritative batch path',
          'Replay plus idempotency for recovery',
          'Documenting tolerated failure modes'
        ],
        mistakeWatchlist: ['Live counter without deduplication']
      },
      nextLesson: 'ops-observability'
    }
  ]
};
