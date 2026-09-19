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
      title: 'Compute choices: EC2, containers or Lambda?',
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
          'In lesson 8 you met the taxi-meter pricing for serverless. Now the question is which vehicle to hire, the owned car, the shipping container, or the taxi?',
          'You can run the exact same code three ways in the cloud, and the wrong pick means you\'re paying for idle boxes or banging into limits you didn\'t need to hit.',
          'EC2 is a virtual machine you fully control, you pick the OS and you patch it. Containers bundle your app with its dependencies so it runs almost anywhere. Lambda just runs one function when an event shows up, no server to manage.',
          'If transport helps, EC2 is a car you own and maintain. Containers are shipping containers that fit on lots of trucks. Lambda is a taxi you call when you need it and pay per trip. Different convenience, different control.',
          'That control vs convenience slides as you move from EC2 to containers to Lambda. Lambda scales to zero so you pay nothing idle, but it has a max run time, it cold starts the first time after idle, and it has concurrency limits. Long jobs or stateful services belong on EC2 or containers.',
          'Most real systems use all three. Serverless for spiky, event-driven bits, containers for steady APIs, virtual machines for legacy or super specialized needs. It\'s usually per-component, not per-company.'
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
      title: 'S3: object storage without surprises',
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
          'In lesson 10 you checked if a policy allowed an action on a resource. An S3 object is that resource, so access control and key design go together.',
          'Most cloud data lives in S3, logs, backups, datasets, model files, static sites. Get the key layout right and everything after it gets cheaper and quicker.',
          'S3 stores objects in buckets. An object has a key, its full name, and bytes. Slashes in the key make prefixes that look like folders but there are no real folders underneath. And listing is lexicographic, so date-leading keys sort in a useful way.',
          'Think of a coat check. Bucket is the cloakroom, key is your ticket number, object is your coat. Two people with the same ticket number don\'t get two coats, the second one replaces the first. There\'s no merging.',
          'Keys are unique and immutable. Writing to a key that already exists overwrites it unless versioning is on. That\'s the classic gotcha where 5,000 events a day all write to events/latest.json and you keep only the last one.',
          'A solid setup partitions by date, something like events/year=2026/month=09/day=18/id.json, so analytics can read just the slice it needs. Then you add lifecycle rules to shift cold data to cheaper storage automatically, otherwise a growing lake turns into a growing bill.'
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
      title: 'Storage choices: object, block and file',
      objectives: [
        'Distinguish object, block and file storage',
        'Match a workload to S3, EBS or EFS',
        'Explain why a database should not run on object storage'
      ],
      prerequisites: ['S3: Object Storage Without Surprises'],
      timeEstimateMin: 25,
      content: {
        explanations: [
          'Lesson 4 framed data as tables and files. Which storage type you pick decides which of those shapes the system can actually serve well.',
          'It\'s tempting to use S3 for everything because it\'s cheap and durable, but a database can\'t really run on object storage, and a block device can\'t be safely shared by ten servers as a folder. The wrong match looks like a perf bug when it\'s really a category error.',
          'Object storage like S3 holds whole files addressed by key over HTTP, basically unlimited and very durable. Block storage like EBS is a virtual disk attached to one machine, low latency with a real filesystem. File storage like EFS is a shared network filesystem lots of machines can mount at once.',
          'Warehouse, desk drawer, filing cabinet, if that helps. Warehouse is the object store, you fetch whole boxes. Desk drawer is block, fast and private to one person. Filing cabinet is file, shared and everyone uses the same index.',
          'A couple rules that matter a lot. Object storage isn\'t a filesystem, you can\'t do partial in-place edits of huge files. Block volumes attach to one instance at a time. And when you need shared, multi-instance file access, that\'s exactly what file storage is for.',
          'You\'ll often see all three at once. EBS for the OS and database, EFS for a shared app directory across the cluster, S3 for backups, logs and datasets. Match storage to the access pattern, not to what\'s trendy.'
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
      title: 'Database choices: SQL, NoSQL and cache',
      objectives: [
        'Distinguish relational, key-value and cache stores by access pattern',
        'Explain why access pattern comes before technology',
        'Choose a store for a described workload'
      ],
      prerequisites: ['Storage Choices: Object, Block and File'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'In lesson 4 you grouped rows with GROUP BY. Relational databases exist to make those questions fast and safe, and the shape of your questions should decide which database you pick.',
          'Database debates usually sound religious. You can cut through it by asking one thing, what access pattern do you actually need at what scale? Answer that, the tech follows.',
          'Relational stores keep data in tables with relationships, they\'re great for joins and multi-row transactions. Key-value and document stores fetch by key with predictable performance even at huge scale. Caches sit in memory and give you microsecond reads for hot data.',
          'Library, coat check, sticky note, if you want an image. Relational is the library that supports rich searches across related stuff. Key-value is the coat check, unbeatable when you know the ticket number. Cache is the sticky note with the few things you touch constantly.',
          'There\'s a trade-off between flexibility and scale. Relational lets you ask ad hoc questions and gives strong consistency, but it\'s harder to spread across machines. Key-value scales almost linearly, yet it only answers the questions you designed the keys for.',
          'Most real products run a few of them together, polyglot persistence. A relational DB for accounts and billing, a key-value store for high-volume app state, and a cache in front. Pick per access pattern and expect more than one answer.'
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
      title: 'DynamoDB: keys, queries and hot partitions',
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
          'You matched workloads to compute in lesson 13. Now you match queries to keys. Same mindset, just applied to data.',
          'DynamoDB is lovely when your keys line up with your questions, it stays fast at crazy scale. Get the keys wrong and you\'ll hit throttling. It\'s that binary.',
          'Every item needs a partition key. A sort key is optional and lets you keep many related items under one partition and query a range inside it. You design the table from the questions you\'ll actually ask, not from a textbook ER diagram.',
          'Picture pigeonholes. The partition key picks the hole, the sort key orders what\'s inside. If everyone\'s mail goes into one hole, that hole becomes a queue and you get throttled. That\'s a hot partition.',
          'Query reads one partition using the key, it\'s fast and cheap. Scan reads the whole table, slow and expensive and it gets worse every day. A key-value store simply can\'t answer a question you didn\'t design a key or index for, don\'t fight it.',
          'A few things you\'ll bump into in practice. Keys are case-sensitive, so USER#42 and user#42 are different partitions, oops. Queries come back one page at a time and you have to page. And if you retry writes, use a conditional expression so you don\'t apply the same one twice. Idempotency starts here.'
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
      title: 'Project 1: the serverless progress API',
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
          'You redacted sensitive fields before logging in lesson 11. A production API does essentially that on every request before it stores anything.',
          'This project is the standard serverless brick that thousands of products use. It\'s also your first real cloud lab, so you\'ll meet the classic failure modes live, missing permissions, timeouts, malformed bodies.',
          'The path goes like this. Client hits an HTTPS endpoint on API Gateway, Gateway maps method and path to a Lambda, Lambda runs your handler, talks to DynamoDB with its execution role, and returns a response. The client never touches the database directly.',
          'The handler itself gets an event and a context. Whatever object you return becomes the HTTP response, so for an HTTP API you return statusCode, headers and a body that has to be a string. That\'s why you JSON.stringify the body.',
          'Imagine a drive-through. API Gateway is the window, the handler is the person working it, the execution role is their badge, DynamoDB is the storeroom out back. The customer never walks into the storeroom.',
          'Two quirks to know. The first call after idle has to spin up the runtime, that\'s the cold start and it adds latency. Create clients outside the handler so they get reused. And remember the max run time, the concurrency limit, and that the execution role decides exactly what you can touch.',
          'If you can validate input and return 400 for bad requests instead of 500, use a conditional write so retries don\'t double apply, and log identifiers not secrets, this little API is already shaped like a production one. Which is the point.'
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
const bucket = 'ecosystem-corpus';
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
