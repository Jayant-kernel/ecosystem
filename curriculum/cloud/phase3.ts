import { Module } from '../../types';

/**
 * Phase 3 — Build a Cloud Application (Lessons 13-18).
 * Project 1 is the first REAL CLOUD LAB, with a full local simulation.
 */
export const PHASE_3_MODULE: Module = {
  id: 'cloud-phase-3',
  title: 'Module 4: Build a Cloud Application',
  lessons: [
    {
      id: 'compute-choices',
      title: 'Compute Choices: EC2, Containers or Lambda?',
      objectives: [
        'Describe the three main compute models in plain terms',
        'Match a workload to the right compute model',
        'Explain cold start, timeout and concurrency limits',
        'State the trade-off between control and operational work'
      ],
      prerequisites: ['VPCs, Subnets and Security Groups'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Foundation drill. In Lesson 8 you met the taxi-meter model of serverless cost. Now decide whether the taxi, the lease, or the bus is right for the job.',
          'Why this matters. You can run the same code three ways in the cloud. The wrong choice means either paying for idle machines or fighting limits you did not need.',
          'The three models. EC2 is a virtual machine you fully control: you choose the operating system and patch it. Containers package your app with its dependencies and run almost anywhere. Lambda runs a single function in response to an event, with no server to manage at all.',
          'Mental model: transport. EC2 is a car you own and maintain. Containers are a shipping container that fits on many trucks. Lambda is a taxi: you do not own it, you call it when needed, and you pay for the trip.',
          'The trade-offs. Control decreases and convenience increases as you move from EC2 to containers to Lambda. Lambda scales to zero, so you pay nothing when idle, but it has a maximum run time, a cold start on first use, and a concurrency limit. A long-running job or a stateful service belongs on EC2 or containers.',
          'Production insight. Real systems mix all three. Serverless for spiky event-driven work, containers for steady APIs, and virtual machines for legacy or very specialised workloads. Choosing per component, rather than per company, is what mature teams do.'
        ],
        demos: [
          {
            code: `// Match the workload to the model. There is no single best answer.
function chooseCompute(workload) {
  if (workload.eventDriven && !workload.longRunning) return 'lambda';
  if (workload.needsOsControl) return 'ec2';
  if (workload.portableContainer) return 'container';
  return 'lambda';
}

const workloads = [
  { name: 'resize an image when uploaded', eventDriven: true,  longRunning: false },
  { name: 'legacy licensing server',       needsOsControl: true },
  { name: 'steady API, same runtime everywhere', portableContainer: true },
  { name: 'nightly 4-hour batch job',      eventDriven: true,  longRunning: true }
];

for (const w of workloads) {
  console.log(w.name + ' -> ' + chooseCompute(w));
}`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Which compute model scales to zero and bills only while running?'
          },
          {
            type: 'apply',
            prompt: 'You need to run the same service on AWS and on a colleague\u2019s laptop. Which model fits best and why?'
          },
          {
            type: 'predict',
            prompt: 'A four-hour report runs on Lambda and fails every night. What limit have you hit, and what would you move it to?'
          }
        ],
        debugging: [
          {
            buggyCode: `// A nightly report that takes 4 hours runs on Lambda.
const job = { type: 'nightly-report', durationMinutes: 240, model: 'lambda' };
console.log('Will it finish? ' + (job.durationMinutes < 15));`,
            hints: [
              'What is the maximum run time of a single Lambda invocation?',
              'Is this workload event-driven and short, or long and scheduled?',
              'Which compute model has no such time limit?'
            ],
            solution: `// Lambda has a maximum invocation duration, so a 4 hour job does not fit.
const job = { type: 'nightly-report', durationMinutes: 240 };

// Options:
// 1) Move it to containers or EC2.
// 2) Keep Lambda as the trigger and run the work on a long-running service.
// 3) Split it into many small chunks, each under the Lambda limit.
const model = job.durationMinutes > 15 ? 'container-or-ec2' : 'lambda';
console.log('Chosen model: ' + model);`
          }
        ],
        exercises: [
          {
            prompt: 'Write chooseCompute(workload). If the workload is eventDriven and not longRunning, return "lambda". Otherwise if it needsOsControl, return "ec2". Otherwise if it is portableContainer, return "container". Otherwise return "lambda".',
            tests: [
              `chooseCompute({ eventDriven: true, longRunning: false }) === 'lambda'`,
              `chooseCompute({ eventDriven: true, longRunning: true }) === 'lambda'`,
              `chooseCompute({ needsOsControl: true }) === 'ec2'`,
              `chooseCompute({ portableContainer: true }) === 'container'`,
              `chooseCompute({}) === 'lambda'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which model gives you an operating system you must patch yourself?',
              choices: ['Lambda', 'EC2', 'Managed containers'],
              answer: 'EC2'
            },
            {
              type: 'mcq',
              prompt: 'Lambda cannot run a job that needs:',
              choices: ['A network call', 'More time than its maximum invocation limit', 'To read a file'],
              answer: 'More time than its maximum invocation limit'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'EC2 vs containers vs Lambda trade-offs',
          'Scale to zero and cold starts',
          'Lambda time and concurrency limits',
          'Choosing per component'
        ],
        mistakeWatchlist: ['Putting long-running work on Lambda']
      },
      nextLesson: 'storage-s3'
    },
    {
      id: 'storage-s3',
      title: 'S3: Object Storage Without Surprises',
      objectives: [
        'Explain buckets, objects, keys and prefixes',
        'Design a date-partitioned key layout',
        'Explain why object keys are immutable and unique',
        'Apply a lifecycle rule to control storage cost'
      ],
      prerequisites: ['Compute Choices: EC2, Containers or Lambda?'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Foundation drill. In Lesson 10 you checked whether a policy allowed an action on a resource. An S3 object is that resource. Access control and key design are two halves of the same job.',
          'Why this matters. S3 is where most cloud data actually lives: logs, backups, datasets, model files, static websites. Getting the key layout right makes everything later cheaper and faster.',
          'What S3 is. Simple Storage Service stores objects in buckets. An object has a key, which is its full name, and bytes. Slashes in a key create prefixes that look like folders, but there are no real folders. Listing is lexicographic, which is why date-leading keys sort usefully.',
          'Mental model: a coat check. The bucket is the cloakroom, the key is your ticket number, and the object is your coat. If two people use the same ticket number, the second coat replaces the first. There is no merging.',
          'Keys are unique and immutable. Writing to an existing key overwrites the object unless versioning is switched on. This is the source of the classic bug where 5000 events per day all write to events/latest.json and 4999 are destroyed.',
          'Production insight. Design a partitioned layout such as events/year=2026/month=09/day=18/id.json so that analytics engines can read only the files they need. Then add lifecycle rules to move cold data to cheaper storage classes automatically, because a growing lake is a growing bill.'
        ],
        demos: [
          {
            code: `// Every event gets its own immutable key, partitioned by date.
function keyFor(event) {
  const d = event.ts;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return 'events/year=' + y + '/month=' + m + '/day=' + day + '/' + event.id + '.json';
}

const a = { id: 'e1', ts: new Date('2026-09-18T10:00:00Z') };
const b = { id: 'e2', ts: new Date('2026-09-18T23:59:00Z') };

console.log(keyFor(a));
console.log(keyFor(b));

// The anti-pattern that destroys data:
console.log('Dangerous: events/latest.json  (every write overwrites the last)');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What is an S3 key, and what happens when you write to a key that already exists?'
          },
          {
            type: 'apply',
            prompt: 'Design a key layout for daily events that an analytics query can filter by date.'
          },
          {
            type: 'predict',
            prompt: 'Every event is written to events/latest.json. After one day of traffic, how many events remain, and what does that do to your analytics?'
          }
        ],
        debugging: [
          {
            buggyCode: `// The dashboard shows only one event per day.
const key = 'events/latest.json';
// 5,000 learners send events every day.
console.log('Objects after one day: ' + 1);
console.log('Events lost: ' + 4999);`,
            hints: [
              'Are object keys unique, or shared?',
              'What happens to the previous object when the key is reused?',
              'What should the key include to make each write new?'
            ],
            solution: `const eventId = 'e-88f3';
const ts = new Date('2026-09-18T10:15:00Z');
const key = 'events/year=2026/month=09/day=18/' + eventId + '.json';
// One object per event, partitioned by date.
// Objects are unique and immutable: never reuse a key for new data.`
          }
        ],
        exercises: [
          {
            prompt: 'Write keyFor(event) where event has an id and a ts Date. Return a key of the form events/year=YYYY/month=MM/day=DD/<id>.json. Use UTC values, and zero-pad the month and day to two digits.',
            tests: [
              `keyFor({ id: 'e1', ts: new Date('2026-09-18T10:00:00Z') }) === 'events/year=2026/month=09/day=18/e1.json'`,
              `keyFor({ id: 'e2', ts: new Date('2027-01-02T00:00:00Z') }) === 'events/year=2027/month=01/day=02/e2.json'`,
              `keyFor({ id: 'a', ts: new Date('2026-01-01T00:00:00Z') }) !== keyFor({ id: 'b', ts: new Date('2026-01-01T00:00:00Z') })`,
              `keyFor({ id: 'a', ts: new Date('2026-05-05T00:00:00Z') }).indexOf('month=05') !== -1`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Writing to an existing S3 key without versioning:',
              choices: ['Creates a second object', 'Overwrites the object', 'Fails with an error'],
              answer: 'Overwrites the object'
            },
            {
              type: 'mcq',
              prompt: 'Why partition keys by date?',
              choices: ['It looks tidy', 'Queries can skip unrelated files', 'It compresses data'],
              answer: 'Queries can skip unrelated files'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Buckets, objects, keys and prefixes',
          'Keys are unique and immutable',
          'Date-partitioned layouts',
          'Lifecycle rules control cost'
        ],
        mistakeWatchlist: ['Reusing a static key and overwriting data']
      },
      nextLesson: 'storage-object-block-file'
    },
    {
      id: 'storage-object-block-file',
      title: 'Storage Choices: Object, Block and File',
      objectives: [
        'Distinguish object, block and file storage',
        'Match a workload to S3, EBS or EFS',
        'Explain why a database should not run on object storage'
      ],
      prerequisites: ['S3: Object Storage Without Surprises'],
      timeEstimateMin: 25,
      content: {
        explanations: [
          'Foundation drill. In Lesson 4 you described data as tables and files. The storage type you choose decides which of those shapes the system can serve efficiently.',
          'Why this matters. People reach for S3 for everything because it is cheap and durable. But a database cannot run on object storage, and a shared folder across ten servers cannot run on a block device. Choosing wrongly creates problems that look like performance bugs.',
          'The three types. Object storage (S3) stores whole files addressed by key over HTTP, effectively unlimited and very durable. Block storage (EBS) is a virtual disk attached to one machine, with low latency and a filesystem. File storage (EFS) is a shared network filesystem that many machines can mount at once.',
          'Mental model: a warehouse, a desk drawer, and a shared filing cabinet. The warehouse (object) is vast and you fetch whole boxes. The desk drawer (block) is fast and only yours. The filing cabinet (file) is shared and everyone follows the same index.',
          'The rules that matter. Object storage is not a filesystem, so it does not support partial in-place edits of large files. Block storage attaches to one instance at a time. Shared, multi-instance file access is what file storage is for.',
          'Production insight. A common pattern is all three at once: EBS for the operating system and database, EFS for a shared application directory across a cluster, and S3 for backups, logs and datasets. Match the storage to the access pattern, not to fashion.'
        ],
        demos: [
          {
            code: `// Match storage to the access pattern.
function chooseStorage(workload) {
  if (workload.sharedAcrossManyInstances) return 'efs';
  if (workload.needsLowLatencyBlockForOneInstance) return 'ebs';
  return 's3';
}

const workloads = [
  { name: 'backups and archived logs',            durableObjectStore: true },
  { name: 'database data directory',              needsLowLatencyBlockForOneInstance: true },
  { name: 'shared uploads folder for a cluster',  sharedAcrossManyInstances: true }
];

for (const w of workloads) {
  console.log(w.name + ' -> ' + chooseStorage(w));
}`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Which storage type can many machines mount at the same time?'
          },
          {
            type: 'apply',
            prompt: 'A database needs very low latency disk access on one server. Which storage type, and why not object storage?'
          },
          {
            type: 'predict',
            prompt: 'You store a database data directory on S3 and mount it. What kind of failures will appear?'
          }
        ],
        debugging: [
          {
            buggyCode: `// A team stores their database files on object storage.
const plan = {
  databaseEngine: 'postgres',
  storage: 's3-object-storage',
  reason: 'it is cheap and durable'
};
console.log('This will work smoothly: probably?');`,
            hints: [
              'Does a database need random access to small blocks of its files?',
              'Can object storage edit part of a file in place?',
              'Which storage type gives a low-latency filesystem?'
            ],
            solution: `// Databases need low-latency, in-place block access.
const plan = {
  databaseEngine: 'postgres',
  storage: 'ebs-block-storage',   // fast, filesystem, attached to one instance
  backups: 's3-object-storage'    // object storage is the right home for backups
};
console.log('Primary data on block storage, backups on object storage.');`
          }
        ],
        exercises: [
          {
            prompt: 'Write chooseStorage(workload). If sharedAcrossManyInstances is true return "efs". Otherwise if needsLowLatencyBlockForOneInstance is true return "ebs". Otherwise return "s3".',
            tests: [
              `chooseStorage({ sharedAcrossManyInstances: true }) === 'efs'`,
              `chooseStorage({ needsLowLatencyBlockForOneInstance: true }) === 'ebs'`,
              `chooseStorage({ durableObjectStore: true }) === 's3'`,
              `chooseStorage({}) === 's3'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which storage type is a low-latency disk attached to one instance?',
              choices: ['S3', 'EBS', 'EFS'],
              answer: 'EBS'
            },
            {
              type: 'mcq',
              prompt: 'Where should database backups go?',
              choices: ['The same EBS volume', 'Object storage such as S3', 'The application container'],
              answer: 'Object storage such as S3'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Object vs block vs file storage',
          'Access pattern drives storage choice',
          'Block storage attaches to one instance',
          'Backups belong in object storage'
        ],
        mistakeWatchlist: ['Running a database on object storage']
      },
      nextLesson: 'database-choices'
    },
    {
      id: 'database-choices',
      title: 'Database Choices: SQL, NoSQL and Cache',
      objectives: [
        'Distinguish relational, key-value and cache stores by access pattern',
        'Explain why access pattern comes before technology',
        'Choose a store for a described workload'
      ],
      prerequisites: ['Storage Choices: Object, Block and File'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Foundation drill. In Lesson 4 you wrote GROUP BY over rows. Relational databases exist to make those questions fast and safe, which is exactly why the shape of your questions decides the database you pick.',
          'Why this matters. Database arguments are usually religious rather than technical. You can settle them by asking one question: what access pattern do I actually need, at what scale?',
          'The families. Relational databases organise data in tables with relationships, supporting joins and multi-row transactions. Key-value and document stores retrieve items by key with predictable performance at very large scale. Caches hold hot data in memory for microsecond reads.',
          'Mental model: a library, a coat check, and a sticky note. The library (relational) supports rich search across related material. The coat check (key-value) is unbeatable when you know the ticket number. The sticky note (cache) holds the few things you need constantly.',
          'The trade-off is flexibility versus scale. Relational gives you ad hoc queries and strong consistency but gets harder to scale horizontally. Key-value scales almost linearly but only answers the questions you designed the keys for.',
          'Production insight. Most real products use several stores at once, which is called polyglot persistence: a relational database for accounts and billing, a key-value store for high-volume application state, and a cache in front of both. Choose per access pattern, and expect to use more than one.'
        ],
        demos: [
          {
            code: `// Access pattern first, technology second.
function chooseDatabase(need) {
  if (need.microsecondCacheOrSession) return 'redis';
  if (need.relationalJoinsAndTransactions) return 'rds';
  if (need.knownAccessPatternAtScale) return 'dynamodb';
  return 'rds';
}

const needs = [
  { name: 'user sessions and hot counters', microsecondCacheOrSession: true },
  { name: 'billing with joins and transactions', relationalJoinsAndTransactions: true },
  { name: 'lesson progress by user at millions of rows', knownAccessPatternAtScale: true }
];

for (const n of needs) {
  console.log(n.name + ' -> ' + chooseDatabase(n));
}`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Which database family is unbeatable when you always know the key?'
          },
          {
            type: 'apply',
            prompt: 'You need ad hoc reporting across related tables with transactions. Which store and why?'
          },
          {
            type: 'predict',
            prompt: 'You choose a key-value store and then need to answer unplanned questions across fields. What happens?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Chosen a key-value store, then queried it like SQL.
const query = 'SELECT * FROM progress WHERE percent > 50 ORDER BY updatedAt';
console.log('Running: ' + query);
console.log('Key-value stores cannot answer this without a designed index.');`,
            hints: [
              'Does your access pattern come from the keys you designed?',
              'Is "percent greater than 50" one of those designed patterns?',
              'What would you add to serve this query efficiently?'
            ],
            solution: `// Either design for the query or send it to the right store.
// Option A: add a global secondary index on percent and updatedAt.
// Option B: move analytics to a warehouse or a data lake.
const plan = {
  operationalReads: 'dynamodb by USER#<id>',
  analyticsQueries: 'athena over the S3 data lake'
};
console.log(JSON.stringify(plan));`
          }
        ],
        exercises: [
          {
            prompt: 'Write chooseDatabase(need). If microsecondCacheOrSession is true return "redis". Otherwise if relationalJoinsAndTransactions is true return "rds". Otherwise if knownAccessPatternAtScale is true return "dynamodb". Otherwise return "rds".',
            tests: [
              `chooseDatabase({ microsecondCacheOrSession: true }) === 'redis'`,
              `chooseDatabase({ relationalJoinsAndTransactions: true }) === 'rds'`,
              `chooseDatabase({ knownAccessPatternAtScale: true }) === 'dynamodb'`,
              `chooseDatabase({}) === 'rds'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'The first question when choosing a database is:',
              choices: ['Which is most modern', 'What access pattern do I need', 'What do other teams use'],
              answer: 'What access pattern do I need'
            },
            {
              type: 'mcq',
              prompt: 'Using several database types in one product is called:',
              choices: ['Polyglot persistence', 'Normalisation', 'Sharding'],
              answer: 'Polyglot persistence'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Relational vs key-value vs cache',
          'Access pattern before technology',
          'Flexibility vs horizontal scale',
          'Polyglot persistence'
        ],
        mistakeWatchlist: ['Choosing a store then discovering unplanned queries']
      },
      nextLesson: 'database-dynamodb'
    },
    {
      id: 'database-dynamodb',
      title: 'DynamoDB: Keys, Queries and Hot Partitions',
      objectives: [
        'Model a table from an access pattern using partition and sort keys',
        'Explain why Scan is expensive and Query is preferred',
        'Recognise a hot partition from low key cardinality',
        'Explain case sensitivity and query paging'
      ],
      prerequisites: ['Database Choices: SQL, NoSQL and Cache'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'Foundation drill. In Lesson 13 you matched a workload to compute. Now match a query to a key. Both are access-pattern decisions.',
          'Why this matters. DynamoDB gives predictable performance at enormous scale, but only if your keys match your questions. Design badly and you get throttling under load; design well and it stays fast no matter how large the table grows.',
          'The model. Every item needs a partition key. A sort key is optional and lets you store many related items under one partition and query a range within it. You design the table from the questions you will ask, not from a normalised diagram.',
          'Mental model: a set of pigeonholes. The partition key chooses the hole; the sort key orders what is inside. If everyone\u2019s mail goes into one hole, that hole becomes a queue and the post office throttles you. That is a hot partition.',
          'Query versus Scan. Query reads one partition using the key, which is fast and cheap. Scan reads the entire table, which is slow and expensive and gets worse every day. A key-value store cannot answer a question you did not design a key or index for.',
          'Production insight. DynamoDB keys are case-sensitive, so USER#42 and user#42 are different partitions. Queries return at most a page of results at a time and must be paged. And when you retry a write, use a conditional expression so you do not double-apply it. Idempotency starts here.'
        ],
        demos: [
          {
            code: `// Access pattern: "all lessons for one user".
function progressKey(userId, lessonId) {
  return { pk: 'USER#' + userId, sk: 'LESSON#' + lessonId };
}

// Low cardinality means every request hits the same partition.
function partitionCardinality(partitionKeys) {
  const seen = {};
  let count = 0;
  for (const key of partitionKeys) {
    if (!seen[key]) {
      seen[key] = true;
      count++;
    }
  }
  return count;
}

console.log(JSON.stringify(progressKey('u-1042', 'database-dynamodb')));

const good = ['u1', 'u2', 'u3', 'u4', 'u5'];
const bad = ['global', 'global', 'global', 'global', 'global'];
console.log('Distinct partitions (good): ' + partitionCardinality(good));
console.log('Distinct partitions (bad):  ' + partitionCardinality(bad));
console.log('One partition for all traffic means throttling.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Which operation reads one partition, and which reads the whole table?'
          },
          {
            type: 'apply',
            prompt: 'The question is "all progress for one user". What partition key and sort key would you choose?'
          },
          {
            type: 'predict',
            prompt: 'Every request uses the partition key "global". Describe what happens to latency as traffic grows.'
          }
        ],
        debugging: [
          {
            buggyCode: `// The query returns nothing although the item exists.
const query = { KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': 'USER#42' } };
const stored = { pk: 'user#42', sk: 'LESSON#1' };
console.log('Match found: ' + (stored.pk === query.ExpressionAttributeValues[':pk']));`,
            hints: [
              'Are DynamoDB keys case-sensitive?',
              'Compare the stored partition key with the queried value carefully.',
              'Should you fix the write or the query?'
            ],
            solution: `// Keys are case-sensitive, so the two values are different partitions.
// Pick ONE convention and use it for every write and read.
const pk = 'USER#' + '42';
const stored = { pk: pk, sk: 'LESSON#' + '1' };
const query = { KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': pk } };
console.log('Match found: ' + (stored.pk === query.ExpressionAttributeValues[':pk']));`
          }
        ],
        exercises: [
          {
            prompt: 'Write progressKey(userId, lessonId) returning { pk, sk } where pk is "USER#" plus userId and sk is "LESSON#" plus lessonId. Also write partitionCardinality(partitionKeys) returning the number of distinct values in the array.',
            tests: [
              `progressKey('42', 'l1').pk === 'USER#42'`,
              `progressKey('42', 'l1').sk === 'LESSON#l1'`,
              `progressKey('42', 'l2').pk === progressKey('42', 'l9').pk`,
              `partitionCardinality(['a', 'a', 'b']) === 2`,
              `partitionCardinality([]) === 0`,
              `partitionCardinality(['u1', 'u1', 'u1']) === 1`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which operation should you prefer when you know the partition key?',
              choices: ['Scan', 'Query', 'PutItem'],
              answer: 'Query'
            },
            {
              type: 'mcq',
              prompt: 'A partition key with very few distinct values causes:',
              choices: ['Even load', 'A hot partition', 'Better compression'],
              answer: 'A hot partition'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Partition and sort key design',
          'Query vs Scan',
          'Hot partitions from low cardinality',
          'Case sensitivity and paging'
        ],
        mistakeWatchlist: ['Using Scan in production', 'Case-mismatched keys']
      },
      nextLesson: 'project-serverless-api'
    },
    {
      id: 'project-serverless-api',
      title: 'Project 1: The Serverless Progress API',
      objectives: [
        'Explain the Lambda handler model and the response shape',
        'Handle malformed input and return correct status codes',
        'Describe cold starts, timeouts and the execution role',
        'Assemble API Gateway, Lambda and DynamoDB into one design'
      ],
      prerequisites: ['DynamoDB: Keys, Queries and Hot Partitions'],
      timeEstimateMin: 45,
      content: {
        explanations: [
          'Foundation drill. In Lesson 11 you redacted sensitive fields before logging. A production API does the same thing on every request, before anything is stored.',
          'Why this matters. This project is the standard serverless building block used by thousands of real products. It is also your first REAL CLOUD LAB, so you will meet the failure modes live: a missing permission, a timeout, a malformed body.',
          'The request path. The client calls an HTTPS endpoint on API Gateway. API Gateway maps the method and path to a Lambda function. Lambda runs your handler, reads or writes DynamoDB using its execution role, and returns a response object. The client never touches the database directly.',
          'The handler. A Lambda handler receives an event and a context. Whatever object you return becomes the response. For an HTTP API you return statusCode, headers and a body that must be a string, which is why you call JSON.stringify on it.',
          'Mental model: a drive-through window. API Gateway is the window, the handler is the person working it, the execution role is their badge, and DynamoDB is the storeroom. The customer never walks into the storeroom.',
          'Cold starts and limits. On the first invocation after idle time the runtime must initialise, which adds latency. Create clients outside the handler so they are reused between invocations. Remember the maximum run time, the concurrency limit, and that the execution role decides exactly what the function may touch.',
          'Production insight. Validate input and return 400 for a bad request, never a 500. Use a conditional write so a retried request does not double-apply. Log identifiers and outcomes, never tokens or personal data. If you can do all four, this small API is genuinely production-shaped.'
        ],
        demos: [
          {
            code: `// The handler contract: event in, response object out.
function handler(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'invalid json' })
    };
  }

  if (typeof body.percent !== 'number') {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'percent must be a number' })
    };
  }

  // In the real lab this is a DynamoDB PutItem using the execution role.
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ saved: true, percent: body.percent })
  };
}

console.log(handler({ body: '{"percent":60}' }).statusCode);
console.log(handler({ body: 'oops' }).statusCode);
console.log(handler({ body: '{"percent":"sixty"}' }).statusCode);`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What two arguments does a Lambda handler receive, and what does the API return become?'
          },
          {
            type: 'apply',
            prompt: 'Write the response your handler should return when the client sends invalid JSON.'
          },
          {
            type: 'predict',
            prompt: 'Your handler works locally and returns a 502 from API Gateway. Name two likely causes.'
          }
        ],
        debugging: [
          {
            buggyCode: `// Works on a laptop, fails in Lambda.
const client = new Object({
  credentials: { accessKeyId: 'AKIA...', secretAccessKey: 'hardcoded-secret' }
});
const bucket = 'voicecode-corpus';
console.log('Using hardcoded credentials and a hardcoded name.');`,
            hints: [
              'Where should credentials come from in Lambda?',
              'Where should environment-specific names live?',
              'What is the equivalent of getConfig here?'
            ],
            solution: `// In Lambda the execution role supplies temporary credentials automatically.
const bucket = process.env.CORPUS_BUCKET; // configured per environment

// Never embed keys. Never hardcode environment names.
// If a key was ever committed, rotate it before you continue.
console.log('Bucket from configuration: ' + bucket);`
          }
        ],
        exercises: [
          {
            prompt: 'Write handler(event) for an HTTP API. Parse event.body as JSON. If parsing fails, return statusCode 400 with a JSON body containing an error field. If the parsed percent is not a number, return statusCode 400. Otherwise return statusCode 200 with a JSON body containing saved true and the percent. Every response includes a content-type header of application/json and the body must be a string.',
            tests: [
              `handler({ body: '{"percent":50}' }).statusCode === 200`,
              `JSON.parse(handler({ body: '{"percent":50}' }).body).percent === 50`,
              `handler({ body: '{"percent":50}' }).headers['content-type'] === 'application/json'`,
              `handler({ body: 'not json' }).statusCode === 400`,
              `handler({ body: '{"percent":"x"}' }).statusCode === 400`,
              `handler({}).statusCode === 400`,
              `typeof handler({ body: '{"percent":1}' }).body === 'string'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'How does a Lambda function get AWS permissions?',
              choices: ['From the execution role', 'From hardcoded keys', 'From the browser'],
              answer: 'From the execution role'
            },
            {
              type: 'mcq',
              prompt: 'A client sends malformed JSON. The handler should return:',
              choices: ['500', '400', '200'],
              answer: '400'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'API Gateway to Lambda to DynamoDB path',
          'Handler event and response contract',
          'Input validation and 400 vs 500',
          'Execution roles and client reuse'
        ],
        mistakeWatchlist: ['Hardcoded credentials', 'Returning 500 for bad input']
      },
      nextLesson: 'bigdata-when-data-is-big'
    }
  ]
};
