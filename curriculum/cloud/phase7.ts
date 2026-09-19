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
      title: 'Logs, metrics, traces and alarms',
      objectives: [
        'Write and parse structured logs',
        'Count errors from log lines',
        'Design an alarm tied to user experience'
      ],
      prerequisites: ['Project 3: Real-Time Learning Analytics'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'In lesson 11 you redacted sensitive fields before logging. Structured logging is why that was easy, a log is a record, not a sentence you have to parse with regex.',
          'You can\'t debug what you can\'t see. When a learner says it broke, the only honest answer comes from logs and metrics you instrumented before things went sideways.',
          'There are three signals and they answer different questions. Logs are discrete events with detail and work best as JSON. Metrics are numbers over time, cheap and ideal for alerting. Traces follow one request across services and show where time went. You need all three, but for different reasons.',
          'Hospital works as a quick analogy. Logs are patient notes, metrics are the vitals monitor, traces are the journey from reception to theatre. The monitor tells you something\'s off, the notes say what it was.',
          'For logs, emit one JSON object per event with a level, a message and some ids. Don\'t stitch sentences together, and never log secrets or personal data. Structured logs can be filtered by field, sentences can only be searched by luck.',
          'Tie alarms to what users feel. An error rate over one percent for five minutes matters. CPU at seventy percent for five minutes usually doesn\'t. An alarm that fires with no decision attached just trains people to ignore alarms.',
          'Instrument early, alert on symptoms not causes, and always put a runbook link in the alarm. An alert with no next step is just a 3am noise machine.'
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
      title: 'Scaling: queues, caches, CDNs and load balancers',
      objectives: [
        'Estimate servers needed for a given load',
        'Explain what a queue protects against',
        'Choose a scaling strategy for a described workload'
      ],
      prerequisites: ['Logs, Metrics, Traces and Alarms'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'In lesson 5 you ran fixed capacity against a demand curve. Now we add the pieces that let a system actually absorb that curve without falling over.',
          'Whether it\'s an interview or a real incident, the question is the same, what happens if traffic goes 100x? Your answer shows whether you\'ve memorized services or can actually design.',
          'Load balancing spreads requests across a fleet so no box gets crushed, and a failed box can be pulled out with no downtime. How many servers you need is just peak rate divided by what one can handle, rounded up. Simple math, big consequences.',
          'Caching keeps the result of expensive work so the next request is almost free. It shines when the same data gets asked for repeatedly. The tough part is invalidation, a stale cache after a change is its own little outage.',
          'Queues soak up bursts. Instead of failing when traffic spikes, you accept work into a queue and drain it at a sustainable pace. You trade latency for reliability, the answer comes later, but at least it comes. A queue turns an outage into a delay, which users tolerate way better.',
          'CDNs cache content at edge sites near users, trimming latency and shaving load off your origin. For cacheable assets and responses they\'re the cheapest big win you have.',
          'Cheapest order to scale tends to be cache first, then queue, then add servers, then shard data, and only then think about multi-region. Each step adds complexity, so go in order and measure before you move on.'
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
      title: 'Governance, privacy, backup and disaster recovery',
      objectives: [
        'Classify data and set a retention expectation',
        'Distinguish backup from replication',
        'Choose a recovery strategy from RPO and RTO'
      ],
      prerequisites: ['Scaling: Queues, Caches, CDNs and Load Balancers'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'You redacted sensitive data in lesson 11. Governance is that same instinct written down, what do we store, for how long, and who gets to see it.',
          'This stuff is legal now in most places, and it\'s also about trust. A single careless bucket can do more damage to reputation than any perf issue ever will.',
          'Give every dataset a label, public, internal, confidential, personal data, whatever you use. Let that label drive encryption, access and retention. Unclassified data is just unmanaged data in practice.',
          'Keeping data forever isn\'t neutral, it\'s a liability with a storage bill attached. Decide how long each class lives, delete it automatically, and write down why you chose that window.',
          'Replication isn\'t backup. Replication copies data fast so a machine failure is invisible, great. But if someone deletes a table by accident, that delete replicates instantly as well. A backup is a separate, ideally immutable copy from earlier that lets you recover from a human mistake.',
          'Seat belts and airbags help here. Replication is the seat belt for the everyday crash. Backup is the airbag for the catastrophic one.',
          'Disaster recovery is really two numbers. Recovery point objective is how much data you can afford to lose, in time. Recovery time objective is how long you can be down. Those two picks point you at a strategy, from restoring a backup to running a hot second region.',
          'And test your restores. An untested backup is a belief, not a capability. The folks who survive real incidents are the ones who rehearsed restoring before they had to.'
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
      title: 'Infrastructure as code and production readiness',
      objectives: [
        'Explain why infrastructure should be versioned as code',
        'Validate an infrastructure template',
        'Define a production readiness checklist'
      ],
      prerequisites: ['Governance, Privacy, Backup and Disaster Recovery'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'In lesson 3 you made a Git commit. Infrastructure as code is that habit applied to the cloud itself, servers, buckets and permissions described in files, reviewed, and committed.',
          'If you build infra by clicking, you can\'t review it, you can\'t reproduce it, and you can\'t roll it back cleanly. Two environments drift, and you discover the difference during an incident, which is the worst time.',
          'You write a template that declares what you want, this function, this role, this table, this route. A tool compares the declaration with reality and makes it so. The same file can spin up a test env and a prod env, same shape by construction.',
          'It\'s the recipe vs cake thing. Clicking gives you a cake with no recipe, so you can\'t bake it again reliably. A template is the recipe, the environment is what you bake today.',
          'Because it\'s text it can be reviewed in a PR, scanned for open permissions, and shown to auditors. Because it\'s versioned you can see who changed a security rule and when, which is huge for both safety and cost control.',
          'Readiness isn\'t a vibe, it\'s a checklist. Least-privilege roles, structured logs, an alarm tied to user experience, a restore you\'ve actually tested, a documented teardown, and a cost estimate. If those are missing it\'s still a prototype wearing a prod badge.',
          'A good test is whether you can destroy and rebuild any env from the repo in one command. When that\'s true, recovery feels calm rather than heroic, which is exactly what you want.'
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
