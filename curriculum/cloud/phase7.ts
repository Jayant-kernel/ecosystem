import { Module } from '../../types';

/**
 * Phase 7 — Production Architecture (Lessons 34-37).
 */
export const PHASE_7_MODULE: Module = {
  id: 'cloud-phase-7',
  title: 'Module 8: Production Architecture',
  lessons: [
    {
      id: 'ops-observability',
      title: 'Logs, Metrics, Traces and Alarms',
      objectives: [
        'Write and parse structured logs',
        'Count errors from log lines',
        'Design an alarm tied to user experience'
      ],
      prerequisites: ['Project 3: Real-Time Learning Analytics'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Foundation drill. In Lesson 11 you redacted sensitive fields before logging. Structured logging is the reason that is easy: a log is a record, not a sentence.',
          'Why this matters. You cannot debug what you cannot see. When a learner says\u201cit broke\u201d, the only reliable answer comes from logs, metrics and traces you deliberately instrumented beforehand.',
          'The three signals. Logs are discrete events with detail, best stored as JSON. Metrics are numbers over time, cheap and perfect for alerting. Traces follow one request across services, showing where the time went. You need all three for different questions.',
          'Mental model: a hospital. Logs are the patient notes. Metrics are the vitals monitor. Traces are the journey from reception to theatre. The monitor tells you something is wrong; the notes tell you what.',
          'Structured logging. Emit one JSON object per event with a level, a message and identifiers. Never build sentences by concatenating values, and never log secrets or personal data. A structured log can be searched by field; a sentence can only be searched by luck.',
          'Alarms should be tied to user experience, not to vanity numbers. An error rate above one percent for five minutes is meaningful. CPU at seventy percent for five minutes usually is not. An alarm that fires without a decision to make trains people to ignore alarms.',
          'Production insight. Instrument before you need it, alert on symptoms rather than causes, and always include a runbook link in the alarm. An alert with no next step is just noise delivered at 3am.'
        ],
        demos: [
          {
            code: `// Structured logging: one JSON object per event.
function logLine(level, message, meta) {
  const base = { level: level, message: message, ts: '2026-09-18T10:00:00Z' };
  const extra = meta || {};
  return JSON.stringify(Object.assign(base, extra));
}

function parseLogLine(line) {
  try {
    return JSON.parse(line);
  } catch (e) {
    return null;
  }
}

function countErrors(lines) {
  let errors = 0;
  for (const line of lines) {
    const parsed = parseLogLine(line);
    if (parsed && parsed.level === 'error') errors++;
  }
  return errors;
}

const lines = [
  logLine('info', 'progress_saved', { userId: 'u-1042' }),
  logLine('error', 'dynamodb_throttled', { table: 'LearningProgress' }),
  logLine('error', 'lambda_timeout', { function: 'saveProgress' }),
  'this is not json at all'
];

console.log('Parsed: ' + JSON.stringify(parseLogLine(lines[0])));
console.log('Errors: ' + countErrors(lines));
console.log('Unparseable line returns null, not a crash: ' + parseLogLine(lines[3]));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What is the difference between a log, a metric and a trace?'
          },
          {
            type: 'apply',
            prompt: 'Write the fields you would include in a structured log for a failed request, without leaking secrets or personal data.'
          },
          {
            type: 'predict',
            prompt: 'You set an alarm on CPU above seventy percent. Why will the team start ignoring it?'
          }
        ],
        debugging: [
          {
            buggyCode: `// A log line that is a sentence, plus a leak.
const email = 'learner@example.com';
const apiKey = 'sk-live-9f2b7c';
console.log('User ' + email + ' failed with key ' + apiKey);

// Now try to count all failures by function. You cannot.`,
            hints: [
              'Can you filter this log by any field?',
              'Which values should never appear in a log?',
              'What shape of log can be searched and counted?'
            ],
            solution: `const userId = 'u-1042';
console.log(JSON.stringify({
  level: 'error',
  message: 'request_failed',
  userId: userId,
  function: 'saveProgress',
  keyPresent: true
}));
// Searchable by field, count-able, and no personal data or secrets.`
          }
        ],
        exercises: [
          {
            prompt: 'Write parseLogLine(line) that returns the parsed object, or null when the line is not valid JSON. Write countErrors(lines) that counts the lines whose parsed level is exactly "error", safely ignoring lines that do not parse.',
            tests: [
              `parseLogLine('{"level":"error"}').level === 'error'`,
              `parseLogLine('not json') === null`,
              `countErrors(['{"level":"error"}', '{"level":"info"}']) === 1`,
              `countErrors(['{"level":"error"}', '{"level":"error"}']) === 2`,
              `countErrors(['garbage']) === 0`,
              `countErrors([]) === 0`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which signal is best for alerting on a trend?',
              choices: ['Logs', 'Metrics', 'Traces'],
              answer: 'Metrics'
            },
            {
              type: 'mcq',
              prompt: 'A good alarm threshold is tied to:',
              choices: ['CPU usage', 'User experience', 'Disk size'],
              answer: 'User experience'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Logs, metrics, traces',
          'Structured JSON logging',
          'Alarms tied to user experience',
          'Safe log contents'
        ],
        mistakeWatchlist: ['Logging sentences instead of structured records']
      },
      nextLesson: 'arch-scalability'
    },
    {
      id: 'arch-scalability',
      title: 'Scaling: Queues, Caches, CDNs and Load Balancers',
      objectives: [
        'Estimate servers needed for a given load',
        'Explain what a queue protects against',
        'Choose a scaling strategy for a described workload'
      ],
      prerequisites: ['Logs, Metrics, Traces and Alarms'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'Foundation drill. In Lesson 5 you simulated fixed capacity against a demand curve. Now we add the components that let a real system absorb that demand.',
          'Why this matters. Interview questions and production incidents both live here. \u201cWhat happens if traffic grows a hundred times?\u201d is the question that separates someone who has memorised services from someone who can design.',
          'Load balancing spreads requests across several servers so no single one is overwhelmed, and so a failed server can be removed without downtime. The number of servers you need is the peak request rate divided by what one server can handle, rounded up.',
          'Caching stores the result of expensive work so the next request is nearly free. It helps most when the same data is requested repeatedly. The hard part is invalidation: a cache that serves stale data after a change is its own kind of outage.',
          'Queues absorb bursts. Instead of failing when traffic spikes, the system accepts work into a queue and processes it at a sustainable rate. The trade-off is latency: the answer arrives later, but it does arrive. A queue converts an outage into a delay.',
          'CDNs cache content at edge locations close to users, reducing both latency and load on your origin. They are the cheapest large latency win available for assets and responses that are safe to cache.',
          'Production insight. The scaling order that usually costs least is: cache first, then queue, then add servers, then shard the data, and finally consider multi-region. Each step adds complexity, so take them in order and measure before moving on.'
        ],
        demos: [
          {
            code: `// Capacity arithmetic and strategy choice.
function serversNeeded(rps, capacityPerServer) {
  return Math.ceil(rps / capacityPerServer);
}

function requiresQueue(workload) {
  return workload.bursty === true && workload.longProcessing === true;
}

const now = { rps: 200, capacityPerServer: 50 };
const growth = { rps: 20000, capacityPerServer: 50 };

console.log('Servers today:  ' + serversNeeded(now.rps, now.capacityPerServer));
console.log('Servers at 100x: ' + serversNeeded(growth.rps, growth.capacityPerServer));

console.log('Image resize burst needs a queue: ' + requiresQueue({ bursty: true, longProcessing: true }));
console.log('Simple read burst needs a queue:  ' + requiresQueue({ bursty: true, longProcessing: false }));

// Scaling order by cost of complexity:
console.log('1 cache  2 queue  3 more servers  4 shard data  5 multi-region');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What trade-off does a queue make in exchange for reliability?'
          },
          {
            type: 'apply',
            prompt: 'One server handles 50 requests per second. You expect 20,000 at peak. How many servers, and what would you try before adding them?'
          },
          {
            type: 'predict',
            prompt: 'You cache a user\u2019s profile for an hour and then change their name. What does the user see, and how do you fix it?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Traffic doubled and the service returned errors instead of queueing.
const before = { rps: 500, capacity: 500 };
const after = { rps: 1000, capacity: 500 };
console.log('Overload: ' + (after.rps > after.capacity));
console.log('Result: requests failed immediately.');`,
            hints: [
              'What happens when arrival rate exceeds processing rate?',
              'Could the work be deferred instead of rejected?',
              'Which component converts an outage into a delay?'
            ],
            solution: `// Accept work into a queue and process at a sustainable rate.
const after = { rps: 1000, processingCapacity: 500 };

// The queue absorbs the burst; consumers drain it steadily.
const queueDepthPerSecond = after.rps - after.processingCapacity;
console.log('Queue grows by ' + queueDepthPerSecond + ' messages per second');
console.log('Now measure queue age and alert on it, not on raw traffic.');
// Also raise consumer capacity and cache what can be cached.`
          }
        ],
        exercises: [
          {
            prompt: 'Write serversNeeded(rps, capacityPerServer) returning the ceiling of rps divided by capacityPerServer. Write requiresQueue(workload) returning true only when workload.bursty is true and workload.longProcessing is true.',
            tests: [
              `serversNeeded(100, 50) === 2`,
              `serversNeeded(101, 50) === 3`,
              `serversNeeded(50, 50) === 1`,
              `serversNeeded(0, 50) === 0`,
              `requiresQueue({ bursty: true, longProcessing: true }) === true`,
              `requiresQueue({ bursty: true, longProcessing: false }) === false`,
              `requiresQueue({}) === false`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'A queue converts an outage into a:',
              choices: ['Failure', 'Delay', 'Cache hit'],
              answer: 'Delay'
            },
            {
              type: 'mcq',
              prompt: 'The hardest part of caching is:',
              choices: ['Storage cost', 'Invalidation', 'Network speed'],
              answer: 'Invalidation'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Load balancing and capacity arithmetic',
          'Caching and invalidation',
          'Queues absorb bursts',
          'CDNs reduce latency and origin load',
          'Scaling order by complexity'
        ],
        mistakeWatchlist: ['Scaling servers before caching or queueing']
      },
      nextLesson: 'ops-governance-privacy-dr'
    },
    {
      id: 'ops-governance-privacy-dr',
      title: 'Governance, Privacy, Backup and Disaster Recovery',
      objectives: [
        'Classify data and set a retention expectation',
        'Distinguish backup from replication',
        'Choose a recovery strategy from RPO and RTO'
      ],
      prerequisites: ['Scaling: Queues, Caches, CDNs and Load Balancers'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'Foundation drill. In Lesson 11 you redacted sensitive data. Governance is that instinct turned into written policy: what we store, for how long, and who may see it.',
          'Why this matters. Data protection is now a legal requirement in most countries, and it is also a trust requirement. A single careless bucket can end a company\u2019s reputation faster than any performance problem.',
          'Classification. Give every dataset a label such as public, internal, confidential or personal data, and let the label decide encryption, access and retention. Unclassified data is unmanaged data.',
          'Retention. Keeping data forever is not neutral. It is a liability with a storage bill. Define how long each class is kept, delete it automatically, and document why.',
          'Backup is not replication. Replication copies data quickly so a machine failure is invisible. But if someone deletes a table by mistake, that deletion replicates instantly too. A backup is a separate, ideally immutable copy taken earlier, which is what protects against deletion and corruption.',
          'Mental model: seat belts and airbags. Replication is the seat belt for the everyday crash. Backup is the airbag for the one catastrophic event.',
          'Disaster recovery is defined by two numbers. The recovery point objective is how much data you can afford to lose, measured in time. The recovery time objective is how long you can afford to be down. Together they select a strategy, from restoring backups to running a fully active second region.',
          'Production insight. Test restores. An untested backup is a belief, not a capability. Teams that survive real incidents are the ones that practised restoring before they needed to.'
        ],
        demos: [
          {
            code: `// Policy by classification. Values are illustrative; set your own.
function retentionDays(classification) {
  if (classification === 'personal') return 30;
  if (classification === 'confidential') return 365;
  if (classification === 'internal') return 730;
  return 1095;
}

function chooseDrStrategy(need) {
  if (need.rtoMinutes <= 15 && need.rpoMinutes <= 5) return 'multi-region-active-active';
  if (need.rtoMinutes <= 60) return 'warm-standby';
  return 'backup-restore';
}

const datasets = ['public', 'internal', 'confidential', 'personal'];
for (const c of datasets) console.log(c + ' retained ' + retentionDays(c) + ' days');

console.log('Bank: ' + chooseDrStrategy({ rtoMinutes: 5, rpoMinutes: 1 }));
console.log('Internal tool: ' + chooseDrStrategy({ rtoMinutes: 240, rpoMinutes: 1440 }));
console.log('Replication is not a backup. Test restores, not just copies.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What is the difference between a backup and replication?'
          },
          {
            type: 'apply',
            prompt: 'A business can lose at most five minutes of data and be down at most fifteen minutes. Which recovery strategy fits?'
          },
          {
            type: 'predict',
            prompt: 'You replicate your database but never take backups. Someone runs a delete with no where clause. What can you recover?'
          }
        ],
        debugging: [
          {
            buggyCode: `// "We have replication, so we are backed up."
const setup = { replication: 'multi-az', backups: 'none' };
// A developer deletes a table by accident.
console.log('Replication copied the deletion within seconds.');`,
            hints: [
              'What does replication copy?',
              'Does replication protect against a logical mistake?',
              'Which mechanism restores an earlier state?'
            ],
            solution: `const setup = {
  replication: 'multi-az',        // protects against machine failure
  backups: 'daily, immutable, offsite', // protects against deletion and corruption
  restoreTested: true
};
console.log(JSON.stringify(setup));
// Replication handles infrastructure failure.
// Backups handle people. You need both.`
          }
        ],
        exercises: [
          {
            prompt: 'Write retentionDays(classification) returning 30 for "personal", 365 for "confidential", 730 for "internal", and 1095 otherwise. Write chooseDrStrategy(need): "multi-region-active-active" when rtoMinutes is 15 or less and rpoMinutes is 5 or less; otherwise "warm-standby" when rtoMinutes is 60 or less; otherwise "backup-restore".',
            tests: [
              `retentionDays('personal') === 30`,
              `retentionDays('confidential') === 365`,
              `retentionDays('internal') === 730`,
              `retentionDays('public') === 1095`,
              `chooseDrStrategy({ rtoMinutes: 5, rpoMinutes: 1 }) === 'multi-region-active-active'`,
              `chooseDrStrategy({ rtoMinutes: 15, rpoMinutes: 5 }) === 'multi-region-active-active'`,
              `chooseDrStrategy({ rtoMinutes: 60, rpoMinutes: 1440 }) === 'warm-standby'`,
              `chooseDrStrategy({ rtoMinutes: 240, rpoMinutes: 1440 }) === 'backup-restore'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'RPO measures:',
              choices: ['How long you can be down', 'How much data you can lose', 'How many backups you keep'],
              answer: 'How much data you can lose'
            },
            {
              type: 'mcq',
              prompt: 'Replication alone fails to protect against:',
              choices: ['Disk failure', 'Accidental deletion or corruption', 'Zone outage'],
              answer: 'Accidental deletion or corruption'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Data classification and retention',
          'Backup versus replication',
          'RPO and RTO',
          'Test restores, not beliefs'
        ],
        mistakeWatchlist: ['Treating replication as a backup']
      },
      nextLesson: 'ops-iac-production'
    },
    {
      id: 'ops-iac-production',
      title: 'Infrastructure as Code and Production Readiness',
      objectives: [
        'Explain why infrastructure should be versioned as code',
        'Validate an infrastructure template',
        'Define a production readiness checklist'
      ],
      prerequisites: ['Governance, Privacy, Backup and Disaster Recovery'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Foundation drill. In Lesson 3 you made a Git commit. Infrastructure as code is that habit applied to the cloud itself: the servers, buckets and permissions are described in files, reviewed, and committed.',
          'Why this matters. If infrastructure is clicked by hand, it cannot be reviewed, cannot be reproduced, and cannot be rolled back. Two environments drift apart, and the difference is discovered during an incident.',
          'What infrastructure as code means. You write a template that declares the desired resources: this function, this role, this table, this API route. A tool compares the declaration to reality and makes the changes. The same file creates a test environment and a production one.',
          'Mental model: a recipe versus a finished cake. Clicking in the console produces a cake with no recipe, so you cannot bake it again. A template is the recipe, and the environment is whatever you bake from it today.',
          'Why it improves security and cost. Because the template is text, it can be reviewed in a pull request, scanned for open permissions, and shown to an auditor. Because it is versioned, you can see exactly who changed a security rule and when.',
          'Production readiness is a checklist, not a feeling. Does it have least-privilege roles, structured logs, an alarm tied to user experience, a tested restore, a documented teardown, and a cost estimate? If not, it is a prototype wearing a production badge.',
          'Production insight. The strongest signal of a mature team is that any environment can be destroyed and rebuilt from the repository in one command. That property is what makes recovery calm instead of heroic.'
        ],
        demos: [
          {
            code: `// Infrastructure as code is just a declared shape, validated and committed.
function validateTemplate(template) {
  const required = ['service', 'runtime', 'memoryMB'];
  if (!template) return false;
  for (const field of required) {
    if (template[field] === undefined) return false;
  }
  return true;
}

function readinessChecks() {
  return [
    'least-privilege role',
    'structured logs',
    'alarm tied to user experience',
    'tested restore',
    'documented teardown',
    'cost estimate'
  ];
}

const good = { service: 'saveProgress', runtime: 'nodejs20.x', memoryMB: 256 };
const bad = { service: 'saveProgress' };

console.log('Valid template:   ' + validateTemplate(good));
console.log('Invalid template: ' + validateTemplate(bad));
console.log('Readiness: ' + readinessChecks().join(' | '));

// Commit the template, review it in a pull request, and rebuild from it.`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Why is infrastructure as code more secure than clicking in the console?'
          },
          {
            type: 'apply',
            prompt: 'Name four items on your production readiness checklist and why each matters.'
          },
          {
            type: 'predict',
            prompt: 'A team has two environments built by hand over two years. What happens the first time they must reproduce production in another region?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Production was built by hand and nobody knows its true shape.
const environment = {
  builtBy: 'console clicks',
  documented: false,
  reproducible: false,
  securityRules: 'somebody changed them once'
};
console.log('Can we rebuild this after a disaster? Probably not.');`,
            hints: [
              'Can the environment be reviewed or versioned?',
              'Can it be recreated exactly in another region?',
              'What converts the environment into something reviewable and rebuildable?'
            ],
            solution: `const environment = {
  builtBy: 'infrastructure template in Git',
  documented: true,
  reproducible: true,
  securityRulesReviewed: true
};
console.log(JSON.stringify(environment));
// One command destroys and rebuilds it. That is the goal.`
          }
        ],
        exercises: [
          {
            prompt: 'Write validateTemplate(template) returning true only when template exists and has all three fields service, runtime and memoryMB defined. Write readinessChecks() returning an array of at least five strings naming production readiness items.',
            tests: [
              `validateTemplate({ service: 'a', runtime: 'b', memoryMB: 1 }) === true`,
              `validateTemplate({ service: 'a' }) === false`,
              `validateTemplate(null) === false`,
              `validateTemplate({ service: 'a', runtime: 'b', memoryMB: 0 }) === true`,
              `Array.isArray(readinessChecks()) && readinessChecks().length >= 5`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'The main benefit of infrastructure as code is:',
              choices: ['It is faster to type', 'Reproducible, reviewable environments', 'It avoids cloud costs'],
              answer: 'Reproducible, reviewable environments'
            },
            {
              type: 'mcq',
              prompt: 'A production readiness checklist should include:',
              choices: ['A tested restore and least-privilege roles', 'Only a dashboard', 'Only a cost estimate'],
              answer: 'A tested restore and least-privilege roles'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Infrastructure as code as versioned declarations',
          'Reviewable and reproducible environments',
          'Production readiness checklist',
          'Rebuild from the repository'
        ],
        mistakeWatchlist: ['Hand-built, undocumented environments']
      },
      nextLesson: 'ai-bedrock'
    }
  ]
};
