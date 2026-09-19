import { Module } from '../../types';

/**
 * Phase 0 — Start Safely.
 *
 * Four beginner lessons that install the prerequisites the rest of the
 * Cloud & Big Data course assumes: cost safety, HTTP/JSON, the engineering
 * workflow (terminal, Git, environment variables), and data literacy.
 *
 * Every code sample runs in the in-app console. No AWS account is required.
 */
export const PHASE_0_MODULE: Module = {
  id: 'cloud-phase-0',
  title: 'Module 1: Start Safely',
  lessons: [
    {
      id: 'foundations-cloud-safety',
      title: 'Your learning lab and cloud safety',
      objectives: [
        'Explain why cloud is pay-as-you-go and why idle resources still cost money',
        'Describe what a budget alert does, and what it definitely does not do',
        'Write a teardown checklist before creating a lab resource',
        'Tag resources so cost can be attributed to a project'
      ],
      prerequisites: [],
      timeEstimateMin: 25,
      content: {
        explanations: [
          'You\'re paying for cloud resources the whole time they exist, even if no one\'s using them. That idle database or forgotten server will quietly bill you all month. It\'s the most common beginner surprise, much more common than a bad API call. So before compute or storage, you\'ve got to nail safety.',
          'In AWS you create a Budget with a monthly limit, say ten dollars, and attach alerts to it. AWS also works out a forecast, that\'s what the month will cost if you keep spending at this rate. Usually you\'ll get pinged at about 85 percent of actual spend, or 100 percent of the forecast.',
          'Think of a rented apartment. You pay rent whether you\'re home or not. A budget alert is just the neighbour ringing to say your bill looks high. It can warn you, that\'s all it does.',
          'Here\'s the bit people get wrong the most. A budget alert just tells you. You still have to delete or stop the resource yourself if you want the charges to stop. It\'ll send an email or an event, but it won\'t block or throttle anything on its own.',
          'So write your teardown checklist before you even create the lab stuff. Decide what you\'ll delete and how you\'ll confirm it\'s gone. Takes a couple minutes and saves you that nasty surprise bill later.',
          'Tags are little labels you stick on resources, like project=ecosystem and owner=your-name. They help you find everything you made, and later they show which project caused which cost.',
          'Folks who keep costs under control usually do a few things together. They tag everything, set alerts at 85 percent actual and 100 percent forecast, turn on anomaly detection, and make the delete step part of every lab from the start. Cost ends up being an engineering habit, not something finance tidies up later.'
        ],
        demos: [
          {
            code: `// A monthly budget, like AWS Budgets: a limit plus alerts.
const budget = { name: 'ecosystem-lab', limitUSD: 10 };

// Cost from resources that stayed alive across the week.
const dailyCosts = [0, 0.12, 0.12, 0.12, 3.4, 0.5, 0.5];
const actual = dailyCosts.reduce(function (total, cost) { return total + cost; }, 0);
const forecast = actual * 3; // naive month-end projection

function evaluateBudget(actualPercent, forecastPercent) {
  if (actualPercent >= 100) return { state: 'OVER', notify: true };
  if (forecastPercent >= 100) return { state: 'FORECAST_OVER', notify: true };
  if (actualPercent >= 85) return { state: 'WARNING', notify: true };
  return { state: 'OK', notify: false };
}

const actualPercent = (actual / budget.limitUSD) * 100;
const forecastPercent = (forecast / budget.limitUSD) * 100;
const status = evaluateBudget(actualPercent, forecastPercent);

console.log('Spent ' + actual.toFixed(2) + ' of ' + budget.limitUSD + ' USD');
console.log('Actual percent: ' + actualPercent.toFixed(0));
console.log('Alarm: ' + (status.notify ? status.state : 'no alarm'));
console.log('Reminder: the alarm only notifies. You must delete the resources.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What does an AWS budget alert actually do when spending crosses its threshold?'
          },
          {
            type: 'apply',
            prompt: 'Your team is starting a two hour lab. Name the three checks you would put on a teardown list.'
          },
          {
            type: 'predict',
            prompt: 'You set a ten dollar budget and expect AWS to shut everything off at ten dollars. What will really happen?'
          }
        ],
        debugging: [
          {
            buggyCode: `// "I made a 10 dollar budget, so AWS will shut
// my resources down when I hit 10 dollars."
const budgetUSD = 10;
const spentUSD = 47;

console.log(
  spentUSD > budgetUSD
    ? 'AWS will stop my resources'
    : 'everything is fine'
);
// Console prints: AWS will stop my resources`,
            hints: [
              'What does an AWS Budget actually do when it is exceeded?',
              'Does a budget notify, or does a budget enforce?',
              'If the budget does not enforce, what is the only thing that truly stops the bill?'
            ],
            solution: `// A budget ALERTS. It never stops resources.
// Only deleting or stopping the resource stops the cost.
const budgetUSD = 10;
const spentUSD = 47;
const canEnforce = false; // budgets cannot stop anything

console.log('Budget exceeded: ' + (spentUSD > budgetUSD));
console.log('Verdict: ' + (canEnforce ? 'resources stopped' : 'alert only - delete the resources yourself'));
console.log('Action: remove the lab resource, then confirm it is gone.');
// Prevention: budget at 10 USD, alert at 85% actual AND 100% forecast,
// tag every resource, and keep a teardown checklist per lab.`
          }
        ],
        exercises: [
          {
            prompt: 'Write a function evaluateBudget(actualPercent, forecastPercent) that returns { state, notify }. Rules: 100 or more actual is "OVER"; otherwise 100 or more forecast is "FORECAST_OVER"; otherwise 85 or more actual is "WARNING"; otherwise state "OK". notify is true for every state except "OK".',
            tests: [
              `evaluateBudget(10, 20).notify === false`,
              `evaluateBudget(10, 20).state === 'OK'`,
              `evaluateBudget(47, 143).state === 'FORECAST_OVER'`,
              `evaluateBudget(100, 100).state === 'OVER'`,
              `evaluateBudget(90, 90).state === 'WARNING'`,
              `evaluateBudget(90, 90).notify === true`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'When spending passes an AWS budget threshold, the budget will:',
              choices: ['Stop the resources', 'Notify only', 'Delete the data'],
              answer: 'Notify only'
            },
            {
              type: 'mcq',
              prompt: 'When should the teardown checklist for a lab be written?',
              choices: ['Before creating the resources', 'After the bill arrives', 'Only for large labs'],
              answer: 'Before creating the resources'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Cloud is pay-as-you-go; idle resources still cost money',
          'Budget alerts notify, they do not enforce',
          'Teardown checklist before the lab',
          'Tags attribute cost to a project'
        ],
        mistakeWatchlist: ['Expecting a budget to stop resources']
      },
      nextLesson: 'foundations-web-http-json'
    },
    {
      id: 'foundations-web-http-json',
      title: 'How the web talks: HTTP, APIs and JSON',
      objectives: [
        'Explain the client and server roles in a request',
        'Read an HTTP request and response: method, URL, headers, body, status',
        'Decide whether a failure is retryable from its status code',
        'Parse and produce JSON safely'
      ],
      prerequisites: ['Your Learning Lab and Cloud Safety'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Pretty much everything in cloud goes over HTTP. When API Gateway triggers Lambda or your React app saves progress, it\'s the same four pieces traveling: method, URL, headers and body. Get this and you\'ve got the backbone for the rest of the course.',
          'The client asks, the server answers. Your browser is a client. A Lambda behind an API is a server. That simple split explains a huge chunk of cloud architecture, and you\'ll see it again and again.',
          'Think of it like post. The URL is the address, the HTTP method says what you want done there. GET reads, POST creates, PUT replaces, DELETE removes. Headers are the envelope with handling notes like content-type. The body is the letter inside. The status code is the reply slip you get back.',
          'Those status codes tell you what happened. 2xx means it worked. 4xx means the request was wrong or you\'re not allowed, like 403 AccessDenied or 404 NotFound. 5xx means the service messed up. 429 means you asked too fast. That distinction decides retries. You can retry 5xx and 429 after a pause, but retrying a 4xx over and over won\'t help.',
          'JSON is the language those messages usually speak. It\'s just text for objects, arrays, strings, numbers, booleans and null. Looks like JavaScript but it\'s stricter, keys have to be double quoted, no comments, no trailing commas.',
          'APIs are contracts. If you rename a field you break every client, which is why services version their APIs and why 4xx and 5xx are kept separate. Teams that handle this well only retry the failures that might actually succeed next time, with a little backoff built in.'
        ],
        demos: [
          {
            code: `// A request is just a message: method, URL, headers, body.
const request = {
  method: 'POST',
  url: 'https://api.ecosystem.ai/progress',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ userId: 'u-1042', percent: 60 })
};

// A response is a status code, headers, and a body.
const response = {
  status: 200,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ saved: true, percent: 60 })
};

function isRetryable(status) {
  // 5xx: the service failed. 429: too many requests. Both may succeed later.
  // 4xx: the request is wrong or not allowed. Retrying will not fix it.
  return status >= 500 || status === 429;
}

const parsed = JSON.parse(response.body);
console.log('saved = ' + parsed.saved + ', percent = ' + parsed.percent);
console.log('Retry 500? ' + isRetryable(500));
console.log('Retry 429? ' + isRetryable(429));
console.log('Retry 403? ' + isRetryable(403));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Which HTTP method would you use to create a new record, and which to read one?'
          },
          {
            type: 'apply',
            prompt: 'A request fails with 403. Would you retry it immediately? Explain using the status code.'
          },
          {
            type: 'predict',
            prompt: 'Your service returns 500 for one in five requests. Should the client retry? What could go wrong if it retries carelessly?'
          }
        ],
        debugging: [
          {
            buggyCode: `// The API returned an error, but we saved it as if it worked.
const res = {
  status: 403,
  body: JSON.stringify({ message: 'AccessDenied' })
};

const data = JSON.parse(res.body);
console.log('Saved progress for ' + data.userId);
// Console prints: Saved progress for undefined`,
            hints: [
              'What status code came back, and did we check it?',
              'What fields does the error body actually contain?',
              'Is a 403 a missing record, or a permission problem?'
            ],
            solution: `const res = {
  status: 403,
  body: JSON.stringify({ message: 'AccessDenied' })
};

// Check the status BEFORE trusting the body.
if (res.status >= 200 && res.status < 300) {
  const data = JSON.parse(res.body);
  console.log('Saved progress for ' + data.userId);
} else {
  const error = JSON.parse(res.body);
  // 403 is a permission problem, not a missing record.
  console.log('Request failed (' + res.status + '): ' + error.message);
}`
          }
        ],
        exercises: [
          {
            prompt: 'Write parseJsonSafe(text, fallback) that returns the parsed value when text is valid JSON, and returns fallback when it is not. It must never throw.',
            tests: [
              `parseJsonSafe('{"a":1}', {}).a === 1`,
              `parseJsonSafe('not json', { ok: false }).ok === false`,
              `parseJsonSafe('', null) === null`,
              `parseJsonSafe('[]', null).length === 0`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which failure should a client retry after a delay?',
              choices: ['403 AccessDenied', '404 NotFound', '503 ServiceUnavailable'],
              answer: '503 ServiceUnavailable'
            },
            {
              type: 'mcq',
              prompt: 'In JSON, object keys must be:',
              choices: ['Unquoted', 'Double quoted', 'Single quoted'],
              answer: 'Double quoted'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Client asks, server answers',
          'Request = method, URL, headers, body',
          '4xx is not retryable, 5xx and 429 are',
          'Safe JSON parsing with a fallback'
        ],
        mistakeWatchlist: ['Trusting a response before checking its status code', 'Assuming JSON.parse cannot throw']
      },
      nextLesson: 'foundations-tools-git-env'
    },
    {
      id: 'foundations-tools-git-env',
      title: 'Terminal, Git and environment variables',
      objectives: [
        'Describe how a terminal session works and name the core navigation commands',
        'Explain repositories, commits and branches as save points',
        'Read configuration from environment variables instead of hardcoding it',
        'Respond correctly when a secret has been committed'
      ],
      prerequisites: ['How the Web Talks: HTTP, APIs, and JSON'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'You\'ll reach every cloud tool from a terminal. The AWS, Google and Azure CLIs are all terminal programs, deployments are tracked in Git, and config lives in environment variables. These three habits are what separate a hobby project from something you can actually maintain.',
          'A terminal is just you giving the computer one short, precise instruction at a time. Nothing happens until you hit enter, then it answers you. The first commands you\'ll lean on are pwd to see where you are, ls to see what\'s here, cd to move, mkdir to make a folder, cp to copy and rm to remove. That\'s enough to get around.',
          'Git is like save points in a game. A repository is a folder with history, a commit is a labelled save point, a branch is a parallel timeline where you can mess around without breaking the main version. You want small, working commits, not one giant dump at the end.',
          'Environment variables let the same code run locally and in the cloud with different values, because the settings live outside the code. Anything secret, API keys or database passwords and tokens, belongs there or in a managed secret store. Never in a source file.',
          'If a secret ends up in a Git commit, assume it\'s public forever. Keys pushed to a public repo get scraped within minutes, bots watch for them. The only fix is to rotate it right away, invalidate it and replace it. Deleting the commit isn\'t enough, someone already saw it.',
          'A tidy setup keeps .env out of Git, injects secrets through the deploy pipeline, and stores them in something like AWS Secrets Manager or Parameter Store. And each key only gets the smallest permission it actually needs.'
        ],
        demos: [
          {
            code: `// You talk to a computer one command at a time in a terminal.
const shellHistory = [
  'pwd',
  'ls -la',
  'mkdir data-lake',
  'cd data-lake',
  'git init',
  'git add .',
  'git commit -m "add lake layout"'
];

for (let i = 0; i < shellHistory.length; i++) {
  console.log('$ ' + shellHistory[i]);
}

// Configuration lives outside your code, so values change per environment.
const env = { AWS_REGION: 'ap-south-1' };

function getConfig(env, key, fallback) {
  return env[key] !== undefined ? env[key] : fallback;
}

console.log('region = ' + getConfig(env, 'AWS_REGION', 'us-east-1'));
console.log('table = ' + getConfig(env, 'PROGRESS_TABLE', 'unset'));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What does a Git commit represent, and why commit in small steps?'
          },
          {
            type: 'apply',
            prompt: 'A Lambda needs a table name and a bucket name that change between test and production. Where should those values live?'
          },
          {
            type: 'predict',
            prompt: 'You commit an AWS secret key and push it to a public repository. What happens next, and what is the first thing you do?'
          }
        ],
        debugging: [
          {
            buggyCode: `// config.js — committed to a public GitHub repository
const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

export function getClient() {
  return { key: AWS_ACCESS_KEY_ID, secret: AWS_SECRET_ACCESS_KEY };
}`,
            hints: [
              'Who can read a public repository?',
              'Where should credentials live instead of source code?',
              'If the key is already pushed, is deleting the commit enough?'
            ],
            solution: `// 1) Rotate the exposed key in AWS right now. Assume it is compromised.
// 2) Read configuration at runtime, from the environment.
export function getClient(env) {
  const key = env.AWS_ACCESS_KEY_ID;
  const secret = env.AWS_SECRET_ACCESS_KEY;
  if (!key || !secret) {
    throw new Error('AWS credentials missing from the environment');
  }
  // In Lambda you would not use keys at all. The execution role supplies
  // short-lived credentials automatically.
  return { key, secret };
}
// 3) Add .env to .gitignore.
// 4) Store secrets in AWS Secrets Manager or SSM Parameter Store.`
          }
        ],
        exercises: [
          {
            prompt: 'Write getConfig(env, key, fallback) that returns the value stored in env for that key, or fallback when the key is not present in env. Note that an empty string is still a present value.',
            tests: [
              `getConfig({ A: '1' }, 'A', 'x') === '1'`,
              `getConfig({}, 'A', 'x') === 'x'`,
              `getConfig({ A: '' }, 'A', 'x') === ''`,
              `getConfig({ AWS_REGION: 'ap-south-1' }, 'AWS_REGION', 'us-east-1') === 'ap-south-1'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Where should a database password live?',
              choices: ['In the source file', 'In an environment variable or secret store', 'In the React bundle'],
              answer: 'In an environment variable or secret store'
            },
            {
              type: 'mcq',
              prompt: 'You pushed a live key to a public repo. The first correct action is:',
              choices: ['Delete the commit', 'Rotate the key', 'Make the repo private'],
              answer: 'Rotate the key'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Terminal navigation commands',
          'Git commits and branches as save points',
          'Configuration in environment variables, not source',
          'Rotate a leaked credential'
        ],
        mistakeWatchlist: ['Hardcoding secrets', 'Deleting a commit instead of rotating a leaked key']
      },
      nextLesson: 'foundations-data-sql-quality'
    },
    {
      id: 'foundations-data-sql-quality',
      title: 'Data basics: tables, files, SQL and bad data',
      objectives: [
        'Describe data as rows and columns, and distinguish structured from semi-structured data',
        'Ask questions of a table using SELECT, WHERE, GROUP BY and LIMIT',
        'Detect duplicates, missing values and wrong types before they corrupt metrics',
        'Explain why COUNT(*) and COUNT(DISTINCT ...) are not the same number'
      ],
      prerequisites: ['Terminal, Git, and Environment Variables'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'Picking storage, building a pipeline, even reading a chart, all comes down to describing data properly. Big data starts with plain tables, rows and columns. Nail these now and every cloud data service later will click into place.',
          'A CSV is rows and columns. JSON can nest objects inside objects. Parquet, which you\'ll meet in phase 5, stores the same stuff by column and compresses it really well. Which format you pick decides which questions are cheap to ask later.',
          'SQL is how you ask a question of a table, not how you tell the computer to loop. SELECT picks columns, WHERE filters rows, GROUP BY bundles rows so you can aggregate, ORDER BY sorts, LIMIT caps the output. If you\'ve filtered arrays in JavaScript, you already know the logic, SQL just shortens the syntax.',
          'Most datasets are a bit messy in practice, duplicates, missing values, wrong types, even the word true as a string instead of a boolean. Every chart inherits whatever quality sits underneath, so cleaning is a huge part of the job.',
          'COUNT(*) counts rows. COUNT(DISTINCT userId) counts unique people. If events get duplicated, the first number inflates quietly and messes up everything built on top. Deduping on a unique id isn\'t tidying up, it\'s core pipeline work.',
          'The cleaning you\'re about to do by hand in JavaScript is exactly what a Glue or Spark job does at scale later. A streaming job in phase 6 has to handle the same quirks too. Learn the reasoning now and the distributed tool just feels like the same idea, bigger.'
        ],
        demos: [
          {
            code: `// A table is rows with named columns.
const events = [
  { id: 'e1', userId: 'u1', lessonId: 'l1', completed: true,  seconds: 300 },
  { id: 'e2', userId: 'u1', lessonId: 'l2', completed: true,  seconds: 420 },
  { id: 'e3', userId: 'u2', lessonId: 'l1', completed: true,  seconds: 180 },
  { id: 'e4', userId: 'u2', lessonId: 'l2', completed: false, seconds: null },
  { id: 'e1', userId: 'u1', lessonId: 'l1', completed: true,  seconds: 300 }
];

// Data cleaning: keep one well-formed row per id.
function validEvents(rows) {
  const seen = new Set();
  const valid = [];
  for (const r of rows) {
    if (!r || typeof r.id !== 'string' || r.id === '') continue;
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    if (typeof r.userId !== 'string' || typeof r.lessonId !== 'string') continue;
    if (typeof r.completed !== 'boolean') continue;
    if (r.seconds !== null && typeof r.seconds !== 'number') continue;
    valid.push(r);
  }
  return valid;
}

// GROUP BY lessonId, counting only completed rows.
function completionsByLesson(rows) {
  const counts = {};
  for (const r of validEvents(rows)) {
    if (!r.completed) continue;
    counts[r.lessonId] = (counts[r.lessonId] || 0) + 1;
  }
  return counts;
}

console.log('Rows in: ' + events.length);
console.log('Rows after cleaning: ' + validEvents(events).length);
console.log('Completions: ' + JSON.stringify(completionsByLesson(events)));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What does GROUP BY do to rows before an aggregate such as COUNT is applied?'
          },
          {
            type: 'apply',
            prompt: 'You need the number of unique learners who completed a lesson, not the number of completion events. Which aggregate do you use?'
          },
          {
            type: 'predict',
            prompt: 'A duplicate event is ingested twice. Which numbers in a dashboard go wrong, and in which direction?'
          }
        ],
        debugging: [
          {
            buggyCode: `-- The completion count looks too high.
SELECT lessonId, COUNT(*) AS completions
FROM learner_events
WHERE completed = 'yes'
GROUP BY lessonId;

-- completed is a boolean column.
-- The table has duplicate rows from a retried pipeline.`,
            hints: [
              'What type is the completed column, and does the string "yes" ever equal true?',
              'How do duplicate rows affect COUNT(*)?',
              'If you want distinct learners, which aggregate do you need?'
            ],
            solution: `-- Fix the type comparison, remove duplicates, and count people, not rows.
SELECT lessonId, COUNT(DISTINCT userId) AS unique_learners
FROM (
  SELECT DISTINCT * FROM learner_events
) AS deduped
WHERE completed = true
GROUP BY lessonId
ORDER BY unique_learners DESC;`
          }
        ],
        exercises: [
          {
            prompt: 'Implement validEvents(rows) to drop null rows, rows with a missing or empty id, duplicate ids, rows where completed is not a real boolean, and rows where seconds is neither null nor a number. Then implement completionsByLesson(rows) returning an object mapping lessonId to the count of completed valid rows.',
            tests: [
              `validEvents([{ id: 'e1', userId: 'u1', lessonId: 'l1', completed: true, seconds: 1 }, { id: 'e1', userId: 'u1', lessonId: 'l1', completed: true, seconds: 1 }]).length === 1`,
              `validEvents([{ id: 'e2', userId: 'u1', lessonId: 'l1', completed: 'true', seconds: 1 }]).length === 0`,
              `validEvents([{ id: '', userId: 'u1', lessonId: 'l1', completed: true, seconds: 1 }]).length === 0`,
              `validEvents([{ id: 'e3', userId: 'u1', lessonId: 'l1', completed: true, seconds: 'fast' }]).length === 0`,
              `validEvents([{ id: 'e4', userId: 'u1', lessonId: 'l1', completed: false, seconds: null }]).length === 1`,
              `completionsByLesson([{ id: 'e5', userId: 'u1', lessonId: 'l1', completed: true, seconds: 1 }]).l1 === 1`,
              `completionsByLesson([{ id: 'e6', userId: 'u1', lessonId: 'l1', completed: false, seconds: null }]).l1 === undefined`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which clause bundles rows before an aggregate is computed?',
              choices: ['WHERE', 'GROUP BY', 'ORDER BY'],
              answer: 'GROUP BY'
            },
            {
              type: 'mcq',
              prompt: 'COUNT(DISTINCT userId) returns:',
              choices: ['Every row', 'The number of unique users', 'Only null values'],
              answer: 'The number of unique users'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Rows, columns, tables and formats',
          'SELECT, WHERE, GROUP BY, ORDER BY, LIMIT',
          'Duplicates, missing values and wrong types corrupt metrics',
          'COUNT(*) versus COUNT(DISTINCT ...)'
        ],
        mistakeWatchlist: ['Comparing a boolean column to a string', 'Counting rows when the question asks for unique users']
      },
      nextLesson: 'cloud-why-exists'
    }
  ]
};
