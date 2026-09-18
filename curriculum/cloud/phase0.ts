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
      title: 'Your Learning Lab and Cloud Safety',
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
          'Why this matters. Cloud computing is pay-as-you-go. You are charged for as long as a resource exists, even if nobody is using it. The most common beginner mistake is not a wrong API call. It is a forgotten database or an idle server that quietly bills you all month. You are about to build real systems, so your first skill is not compute or storage. It is safety.',
          'What a budget is. In AWS you create a Budget with a monthly limit, for example ten dollars. You attach alerts to it. AWS also calculates a forecast: what the month will cost if the current rate continues. Alerts usually fire at a percentage of the limit, such as 85 percent of actual spend, or 100 percent of the forecast.',
          'Mental model. Think of cloud resources like a rented apartment. The rent runs whether or not you are inside. A budget alert is the neighbour who phones to warn you that the bill looks wrong. It does not turn the lights off for you.',
          'The rule almost everyone gets wrong. A budget alert notifies. It does not stop, delete, block, or throttle anything. AWS Budgets sends an email or an event. The only thing that truly stops spend is deleting or stopping the resource itself.',
          'Teardown before teardown. Before you create any lab resource, decide how you will delete it and who will confirm it is gone. A teardown checklist written in advance takes two minutes and prevents the classic surprise bill.',
          'Tags are labels you attach to resources, such as project=voicecode and owner=your-name. They let you find everything you created, and later they let you see which project caused which cost.',
          'Production insight. Real teams control cost with a combination of tagged resources, budget alerts at 85 percent actual and 100 percent forecast, Cost Anomaly Detection, and a culture where every lab defines its delete step up front. Cost is an engineering concern, not an accounting afterthought.'
        ],
        demos: [
          {
            code: `// A monthly budget, like AWS Budgets: a limit plus alerts.
const budget = { name: 'voicecode-lab', limitUSD: 10 };

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
      title: 'How the Web Talks: HTTP, APIs, and JSON',
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
          'Why this matters. Every cloud service you touch is reached over HTTP. When API Gateway triggers Lambda, when the AWS CLI uploads a file, when your React app saves progress, the same four things travel: a method, a URL, headers, and a body.',
          'Client and server. The client asks. The server answers. Your browser is a client. A Lambda function behind an API is a server. That one sentence explains most of cloud architecture.',
          'Mental model: the postal service for data. The URL is the address. The HTTP method is what you want done there. GET reads, POST creates, PUT replaces, DELETE removes. Headers are the envelope with handling instructions such as content-type. The body is the letter. The status code is the reply slip.',
          'Status codes summarise what happened. 2xx means success. 4xx means the request is wrong or not allowed, for example 403 AccessDenied or 404 NotFound. 5xx means the service failed. 429 means you sent too many requests. This decides whether retrying makes sense: retry 5xx and 429 after a delay, never blindly retry a 4xx.',
          'JSON is the common language of these messages. It is text representing objects, arrays, strings, numbers, booleans and null. It looks like JavaScript object syntax but is stricter: keys must be double quoted, and there are no comments and no trailing commas.',
          'Production insight. APIs are contracts. Renaming a field breaks every client, which is why services version their APIs, why 4xx and 5xx are separated, and why disciplined teams add retries with backoff only for the retryable failures.'
        ],
        demos: [
          {
            code: `// A request is just a message: method, URL, headers, body.
const request = {
  method: 'POST',
  url: 'https://api.voicecode.ai/progress',
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
      title: 'Terminal, Git, and Environment Variables',
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
          'Why this matters. Every cloud tool is reached from a terminal. The AWS, Google and Azure command line interfaces are terminal programs. Deployments are tracked with Git. Configuration belongs in environment variables. These three habits separate a hobby project from engineering work.',
          'Terminal mental model. You are giving the computer one short, precise instruction at a time. Nothing happens until you press enter, and every command answers you. The commands you need first are pwd (where am I), ls (what is here), cd (move), mkdir (make a folder), cp (copy) and rm (remove).',
          'Git mental model: save points in a game. A repository is a folder with history. A commit is a labelled save point. A branch is a parallel timeline where you can experiment without breaking the working version. You commit small, working changes, not one giant change at the end.',
          'Environment variables are settings that live outside your source code, so the same code can run locally and in the cloud with different values. Secrets such as API keys, database passwords and tokens belong in environment variables or a managed secret store, never in source files.',
          'The rule that prevents most beginner breaches: if it is in a Git commit, assume it is public forever. Keys pushed to a public repository are scraped automatically within minutes. The correct response is to rotate, meaning invalidate and replace, the key immediately. Deleting the commit is not enough, because the value has already been seen.',
          'Production insight. Healthy teams keep .env out of Git, inject secrets through the deployment pipeline, store them in AWS Secrets Manager or Systems Manager Parameter Store, and scope every key to the smallest action it needs.'
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
      title: 'Data Basics: Tables, Files, SQL, and Bad Data',
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
          'Why this matters. Choosing storage, designing a pipeline, and reading an analytics chart all require describing data. Big data begins with ordinary tables, files, rows and columns. Get these ideas clear now, and every cloud data service later will feel obvious rather than magical.',
          'Structured and semi-structured data. A CSV file is rows and columns. JSON can nest objects inside objects. Parquet, which you will meet in Phase 5, stores the same data by column and compresses it. The format you choose decides which questions are cheap to ask later.',
          'SQL mental model. SQL is how you ask a question of a table, not how you tell the computer to loop. SELECT chooses columns. WHERE filters rows. GROUP BY bundles rows so you can aggregate them. ORDER BY sorts. LIMIT caps the output. You already used this reasoning in JavaScript; SQL is the same logic with a shorter syntax.',
          'Data quality is the hidden skill. Real datasets contain duplicates, missing values, wrong types and inconsistent wording such as "true" as a string instead of a boolean. Every analytics number inherits the quality of the data underneath it. Fixing this is called data cleaning, and it is most of a data engineer\u2019s day.',
          'COUNT(*) counts rows. COUNT(DISTINCT userId) counts unique people. Duplicated events inflate the first number and quietly corrupt every metric built on top of it. Deduplicating on a unique identifier is a core pipeline skill, not an optional tidy-up.',
          'Production insight. The exact cleaning you are about to write by hand is what a Glue or Spark job does at scale in Phase 5, and what a streaming job must handle in Phase 6. You are learning the reasoning in JavaScript first so the distributed tool later feels like the same idea, only bigger.'
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
