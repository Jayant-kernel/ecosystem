import { ModulePractice } from '../../types';

/**
 * End-of-module practice: 4 MCQ questions plus 4 coding challenges per module.
 *
 * Every coding question is scoped to its module's lessons only, runs in the
 * in-app console, and is verified against its own solution. Hints are revealed
 * one at a time and drive the animated arrow; the explanation is revealed as an
 * animated step sequence.
 */
export const CLOUD_PRACTICE: Record<string, ModulePractice> = {
  'cloud-phase-0': {
    moduleId: 'cloud-phase-0',
    title: 'Start Safely',
    mcqs: [
      {
        id: 'p0-m1',
        prompt: 'Your monthly budget alert is set to ten dollars. Spending reaches ten dollars. What happens?',
        choices: ['AWS deletes your resources', 'AWS sends a notification only', 'All services stop', 'Nothing is recorded'],
        answer: 'AWS sends a notification only',
        explanation: 'A budget alert notifies. It never stops, deletes or blocks anything. Only deleting or stopping the resource ends the cost.'
      },
      {
        id: 'p0-m2',
        prompt: 'A request fails with status 403. Should the client retry it immediately?',
        choices: ['Yes, 403 is temporary', 'No, 403 means not permitted', 'Yes, after one second', 'Only on weekends'],
        answer: 'No, 403 means not permitted',
        explanation: '4xx means the request is wrong or not allowed. Retrying repeats the same failure. Retry only 5xx and 429.'
      },
      {
        id: 'p0-m3',
        prompt: 'Which value is a present but empty environment variable for getConfig?',
        choices: ['undefined', 'An empty string', 'null', 'It is always missing'],
        answer: 'An empty string',
        explanation: 'An empty string is still a defined value. That is why getConfig checks for undefined rather than falsiness.'
      },
      {
        id: 'p0-m4',
        prompt: 'A lesson completion event is ingested twice. Which SQL aggregate gives the correct number of unique learners?',
        choices: ['COUNT(*)', 'SUM(completed)', 'COUNT(DISTINCT userId)', 'MAX(userId)'],
        answer: 'COUNT(DISTINCT userId)',
        explanation: 'COUNT(*) counts rows, so duplicates inflate it. COUNT(DISTINCT userId) counts people.'
      }
    ],
    coding: [
      {
        id: 'p0-c2',
        title: 'Case-insensitive header lookup',
        difficulty: 'easy',
        prompt: 'HTTP header names are case-insensitive. Write headerValue(headers, name) that returns the value whose key matches name ignoring case, or null when it is absent.',
        starterCode: `// Look up a header regardless of letter case.
function headerValue(headers, name) {
  // your code here
}`,
        tests: [
          `headerValue({ 'Content-Type': 'application/json' }, 'content-type') === 'application/json'`,
          `headerValue({ 'content-type': 'application/json' }, 'CONTENT-TYPE') === 'application/json'`,
          `headerValue({}, 'x') === null`,
          `headerValue({ A: '1' }, 'b') === null`
        ],
        hints: [
          'You cannot match keys directly, because the casing may differ.',
          'Loop over the keys and compare the lowercased key with the lowercased name.',
          'Return null after the loop, so a missing header never throws.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'A request arrives and you ask for "content-type", but the server sent "Content-Type".',
          'Normalise both sides with toLowerCase, then compare.',
          'If the loop finishes without a match, return null instead of undefined so callers can check reliably.'
        ],
        solution: `function headerValue(headers, name) {
  var wanted = name.toLowerCase();
  for (var key in headers) {
    if (key.toLowerCase() === wanted) return headers[key];
  }
  return null;
}`
      },
      {
        id: 'p0-c3',
        title: 'Read a numeric setting safely',
        difficulty: 'medium',
        prompt: 'Write envNumber(env, key, fallback) that returns the numeric value of env[key]. Return fallback when the key is missing, empty, or not a valid number. The string "0" is a valid number.',
        starterCode: `// Configuration should fail safe, not produce NaN.
function envNumber(env, key, fallback) {
  // your code here
}`,
        tests: [
          `envNumber({ PORT: '8080' }, 'PORT', 3000) === 8080`,
          `envNumber({}, 'PORT', 3000) === 3000`,
          `envNumber({ PORT: 'abc' }, 'PORT', 3000) === 3000`,
          `envNumber({ PORT: '0' }, 'PORT', 3000) === 0`
        ],
        hints: [
          'Number("") is 0, which is wrong here, so check for missing or empty first.',
          'Number("abc") is NaN. You can detect that with isNaN.',
          'Remember that "0" must return 0, so do not treat zero as falsy.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Naively doing Number(env[key]) has two traps: an empty string becomes 0, and bad text becomes NaN.',
          'Handle the missing or empty case first and return the fallback.',
          'Then parse, and return the fallback when the result is NaN.',
          'Finally return the parsed number, so "0" correctly becomes 0.'
        ],
        solution: `function envNumber(env, key, fallback) {
  var raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  var parsed = Number(raw);
  if (isNaN(parsed)) return fallback;
  return parsed;
}`
      },
      {
        id: 'p0-c4',
        title: 'Count unique learners',
        difficulty: 'medium',
        prompt: 'Write uniqueCompleters(rows) returning the number of distinct userIds that have at least one completed row. Remove duplicate ids first, ignore null rows and rows with an empty id, and require completed to be a real boolean true.',
        starterCode: `// Deduplicate first, then count distinct people.
function uniqueCompleters(rows) {
  // your code here
}`,
        tests: [
          `uniqueCompleters([{ id: 'e1', userId: 'u1', completed: true }]) === 1`,
          `uniqueCompleters([{ id: 'e1', userId: 'u1', completed: true }, { id: 'e1', userId: 'u1', completed: true }]) === 1`,
          `uniqueCompleters([{ id: 'e1', userId: 'u1', completed: true }, { id: 'e2', userId: 'u2', completed: false }]) === 1`,
          `uniqueCompleters([{ id: 'e1', userId: 'u1', completed: 'true' }]) === 0`,
          `uniqueCompleters([]) === 0`
        ],
        hints: [
          'Two passes: first drop duplicates by id, then collect completed userIds.',
          'Use an object as a set to remember which ids and userIds you have already seen.',
          'completed must equal true exactly. The string "true" is not a boolean.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Duplicates inflate every count, so deduplicate by id before measuring anything.',
          'Then keep only rows where completed is the boolean true.',
          'Collect the userIds in a set so a person who completed several lessons counts once.',
          'Finally return how many distinct ids the set holds.'
        ],
        solution: `function uniqueCompleters(rows) {
  var seenIds = {};
  var users = {};
  var count = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r || typeof r.id !== 'string' || r.id === '') continue;
    if (seenIds[r.id]) continue;
    seenIds[r.id] = true;
    if (r.completed !== true) continue;
    if (!users[r.userId]) {
      users[r.userId] = true;
      count++;
    }
  }
  return count;
}`
      }
    ]
  },

  'cloud-phase-1': {
    moduleId: 'cloud-phase-1',
    title: 'Why Cloud Exists',
    mcqs: [
      {
        id: 'p1-m1',
        prompt: 'You size your servers for average traffic. What do users see at the daily peak?',
        choices: ['Nothing changes', 'Failed or slow requests', 'A cheaper bill', 'Lower latency'],
        answer: 'Failed or slow requests',
        explanation: 'Capacity must cover the peak for requests to succeed. Sizing for the average means the busiest hours fail.'
      },
      {
        id: 'p1-m2',
        prompt: 'In the shared responsibility model, who protects your data and access rules?',
        choices: ['The provider only', 'You', 'It is automatic', 'Nobody'],
        answer: 'You',
        explanation: 'The provider secures the cloud itself. Data, identities and access decisions are always your responsibility, in every service model.'
      },
      {
        id: 'p1-m3',
        prompt: 'Which choice is NOT a good reason to pick a region?',
        choices: ['Latency to users', 'Data residency law', 'Service availability', 'The colour of the console'],
        answer: 'The colour of the console',
        explanation: 'Region choice trades off latency, price, compliance and which services exist there. Appearance is not a factor.'
      },
      {
        id: 'p1-m4',
        prompt: 'Which pricing model is cheapest but can be reclaimed by the provider with little warning?',
        choices: ['On-demand', 'Spot', 'Reserved', 'Savings plan'],
        answer: 'Spot',
        explanation: 'Spot capacity is deeply discounted but interruptible, so it suits batch work that can be restarted, not steady services.'
      }
    ],
    coding: [
      {
        id: 'p1-c2',
        title: 'Measure the shortfall',
        difficulty: 'easy',
        prompt: 'Write shortfall(demand, capacity) returning the total number of requests that could not be served across the whole array.',
        starterCode: `// How much demand was missed at this capacity?
function shortfall(demand, capacity) {
  // your code here
}`,
        tests: [
          `shortfall([10, 5], 10) === 0`,
          `shortfall([20], 10) === 10`,
          `shortfall([20, 30], 10) === 30`,
          `shortfall([], 10) === 0`
        ],
        hints: [
          'For each hour, only the amount above capacity is missed.',
          'Use Math.max(0, load - capacity) so an hour under capacity contributes nothing.',
          'Accumulate the results in a running total.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Under-provisioning does not lose all traffic, only the part above capacity.',
          'So for each hour, take the amount by which the load exceeds capacity, floored at zero.',
          'Sum that across the day to get a single number you can compare against a bigger bill.'
        ],
        solution: `function shortfall(demand, capacity) {
  var missed = 0;
  for (var i = 0; i < demand.length; i++) {
    missed += Math.max(0, demand[i] - capacity);
  }
  return missed;
}`
      },
      {
        id: 'p1-c4',
        title: 'Which serverless setting is cheaper?',
        difficulty: 'medium',
        prompt: 'Write isCheaper(a, b) comparing two workloads (each with requests, avgMs, memoryMB) using the serverless cost model: requests times 0.0000002, plus requests times memoryMB divided by 1024, times avgMs divided by 1000, times 0.0000166667. Return true when a costs less than b.',
        starterCode: `// Cost = requests + GB-seconds.
function isCheaper(a, b) {
  // your code here
}`,
        tests: [
          `isCheaper({ requests: 1000, avgMs: 100, memoryMB: 128 }, { requests: 1000, avgMs: 800, memoryMB: 128 }) === true`,
          `isCheaper({ requests: 1000, avgMs: 800, memoryMB: 128 }, { requests: 1000, avgMs: 100, memoryMB: 128 }) === false`,
          `isCheaper({ requests: 0, avgMs: 100, memoryMB: 128 }, { requests: 0, avgMs: 100, memoryMB: 128 }) === false`
        ],
        hints: [
          'Write a helper that computes the cost of one workload object.',
          'Faster execution reduces the GB-second part, which is the larger term.',
          'Equal costs must return false, because a is not strictly cheaper.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Serverless cost has a per-request part and a compute part.',
          'The compute part is memory in GB multiplied by seconds, so either factor increases cost.',
          'Extract a cost function, then simply compare the two results.',
          'This is why making a function faster is also making it cheaper.'
        ],
        solution: `function costOf(w) {
  var requestPrice = 0.0000002;
  var gbSecondPrice = 0.0000166667;
  var gb = w.requests * (w.memoryMB / 1024) * (w.avgMs / 1000);
  return w.requests * requestPrice + gb * gbSecondPrice;
}
function isCheaper(a, b) {
  return costOf(a) < costOf(b);
}`
      }
    ]
  },

  'cloud-phase-2': {
    moduleId: 'cloud-phase-2',
    title: 'Identity and Network Boundaries',
    mcqs: [
      {
        id: 'p2-m1',
        prompt: 'A user is signed in but is blocked from a resource. Which check failed?',
        choices: ['Authentication', 'Authorization', 'Both', 'Neither'],
        answer: 'Authorization',
        explanation: 'Authentication answered "who". Being signed in but not permitted means the authorization check failed.'
      },
      {
        id: 'p2-m2',
        prompt: 'One policy statement allows s3:GetObject and another denies it. What does IAM do?',
        choices: ['Allows, because Allow was listed', 'Denies, because explicit Deny wins', 'Errors out', 'Picks randomly'],
        answer: 'Denies, because explicit Deny wins',
        explanation: 'An explicit Deny always wins over any Allow, including Allows that use wildcards.'
      },
      {
        id: 'p2-m3',
        prompt: 'Which value must never appear in a log line?',
        choices: ['A correlation id', 'A user id', 'An API secret key', 'A status code'],
        answer: 'An API secret key',
        explanation: 'Identifiers are safe to log. Secrets and personal data are not, because logs are widely readable and long-lived.'
      },
      {
        id: 'p2-m4',
        prompt: 'A security group has no rule for port 22. What happens to SSH traffic?',
        choices: ['It is allowed by default', 'It is denied', 'It is logged and allowed', 'It is queued'],
        answer: 'It is denied',
        explanation: 'Security groups are allow-lists. Anything not explicitly allowed is denied, which is why they fail safe.'
      }
    ],
    coding: [
      {
        id: 'p2-c1',
        title: 'Permission check',
        difficulty: 'easy',
        prompt: 'Write can(user, permission) returning true only when the user exists, has a permissions array, and that array contains the permission.',
        starterCode: `// Authorization: does this identity hold this permission?
function can(user, permission) {
  // your code here
}`,
        tests: [
          `can({ permissions: ['s3:GetObject'] }, 's3:GetObject') === true`,
          `can({ permissions: ['s3:GetObject'] }, 's3:DeleteObject') === false`,
          `can({}, 's3:GetObject') === false`,
          `can(null, 's3:GetObject') === false`
        ],
        hints: [
          'Guard against a missing user or a missing permissions array first.',
          'Array.isArray is safer than checking truthiness.',
          'Then test membership of the permission.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Being authenticated says nothing about being allowed.',
          'So first confirm the user and permissions exist, otherwise return false.',
          'Then check whether the specific permission is present.',
          'A missing array must not throw, which is why the guard comes first.'
        ],
        solution: `function can(user, permission) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.indexOf(permission) !== -1;
}`
      },
      {
        id: 'p2-c2',
        title: 'Wildcard action match',
        difficulty: 'medium',
        prompt: 'Write actionAllowed(policy, action) that returns true when any Allow statement covers the action. Actions may be a string or an array. A pattern of "*" matches anything, and a pattern ending in "*" matches any action with that prefix. Deny statements are ignored for this exercise.',
        starterCode: `// Match an IAM action pattern.
function actionAllowed(policy, action) {
  // your code here
}`,
        tests: [
          `actionAllowed({ Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'] }] }, 's3:GetObject') === true`,
          `actionAllowed({ Statement: [{ Effect: 'Allow', Action: 's3:*' }] }, 's3:GetObject') === true`,
          `actionAllowed({ Statement: [{ Effect: 'Allow', Action: 's3:*' }] }, 'dynamodb:GetItem') === false`,
          `actionAllowed({ Statement: [{ Effect: 'Allow', Action: '*' }] }, 'anything') === true`,
          `actionAllowed({ Statement: [] }, 's3:GetObject') === false`
        ],
        hints: [
          'Normalise each statement\u2019s Action to an array so you handle both shapes.',
          'A pattern ending in "*" is a prefix match. Strip the star and use startsWith.',
          'Only consider statements whose Effect is exactly "Allow".'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Policies mix single strings and arrays, so normalise first.',
          '"*" alone matches everything. Anything else ending in "*" matches by prefix.',
          'Anything else must match exactly.',
          'Scan the Allow statements; if none match, the default answer is denied.'
        ],
        solution: `function asArray(v) { return Array.isArray(v) ? v : [v]; }
function matches(pattern, value) {
  if (pattern === '*') return true;
  if (pattern.slice(-1) === '*') return value.startsWith(pattern.slice(0, -1));
  return pattern === value;
}
function actionAllowed(policy, action) {
  for (var i = 0; i < policy.Statement.length; i++) {
    var s = policy.Statement[i];
    if (s.Effect !== 'Allow') continue;
    var actions = asArray(s.Action);
    for (var j = 0; j < actions.length; j++) {
      if (matches(actions[j], action)) return true;
    }
  }
  return false;
}`
      },
      {
        id: 'p2-c3',
        title: 'Redact before logging',
        difficulty: 'easy',
        prompt: 'Write safeLog(record, sensitive) returning a NEW object where every key listed in sensitive is replaced with "[REDACTED]". All other keys keep their value, and the original object must not change.',
        starterCode: `// Never mutate the record you are logging.
function safeLog(record, sensitive) {
  // your code here
}`,
        tests: [
          `safeLog({ email: 'a@b.com', score: 1 }, ['email']).email === '[REDACTED]'`,
          `safeLog({ email: 'a@b.com', score: 1 }, ['email']).score === 1`,
          `(function () { var o = { email: 'a@b.com' }; safeLog(o, ['email']); return o.email === 'a@b.com'; })() === true`,
          `JSON.stringify(safeLog({ a: 1 }, [])) === JSON.stringify({ a: 1 })`
        ],
        hints: [
          'Build a new empty object rather than editing the input.',
          'Copy every key across, replacing the value when the key is in the sensitive list.',
          'Return the new object. The caller keeps their original.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Logging is where personal data and secrets most often leak.',
          'Copy each key into a fresh object so the original is untouched.',
          'Swap the value for a placeholder when the key is sensitive.',
          'The shape of the record survives, so debugging still works.'
        ],
        solution: `function safeLog(record, sensitive) {
  var copy = {};
  for (var key in record) {
    if (sensitive.indexOf(key) !== -1) copy[key] = '[REDACTED]';
    else copy[key] = record[key];
  }
  return copy;
}`
      },
      {
        id: 'p2-c4',
        title: 'Find exposed data ports',
        difficulty: 'medium',
        prompt: 'Write exposedPorts(rules, dataPorts) returning the list of ports that are BOTH in dataPorts AND open to the source "0.0.0.0/0". Rules are objects with port and source.',
        starterCode: `// Which database ports are wide open?
function exposedPorts(rules, dataPorts) {
  // your code here
}`,
        tests: [
          `exposedPorts([{ port: 5432, source: '0.0.0.0/0' }], [5432]).length === 1`,
          `exposedPorts([{ port: 5432, source: 'sg-api' }], [5432]).length === 0`,
          `exposedPorts([{ port: 443, source: '0.0.0.0/0' }], [5432]).length === 0`,
          `exposedPorts([], [5432]).length === 0`
        ],
        hints: [
          'You are looking for an intersection of two conditions.',
          'Check the rule source for the open value, then check the port against the data ports.',
          'Push the port once, not once per matching rule, if you want no duplicates.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'A private subnet does not cancel an open security group rule.',
          'So look for rules that are open to the world and also on a data port.',
          'Both conditions must be true for the same rule.',
          'This is exactly the check a security reviewer runs on every network change.'
        ],
        solution: `function exposedPorts(rules, dataPorts) {
  var found = {};
  var out = [];
  for (var i = 0; i < rules.length; i++) {
    var r = rules[i];
    if (r.source !== '0.0.0.0/0') continue;
    if (dataPorts.indexOf(r.port) === -1) continue;
    if (found[r.port]) continue;
    found[r.port] = true;
    out.push(r.port);
  }
  return out;
}`
      }
    ]
  },

  'cloud-phase-3': {
    moduleId: 'cloud-phase-3',
    title: 'Build a Cloud Application',
    mcqs: [
      {
        id: 'p3-m1',
        prompt: 'A nightly job runs for four hours. Which compute model fits?',
        choices: ['Lambda', 'A container or virtual machine', 'API Gateway', 'A CDN'],
        answer: 'A container or virtual machine',
        explanation: 'A single Lambda invocation has a maximum duration. Long-running work belongs on a container or an instance.'
      },
      {
        id: 'p3-m2',
        prompt: 'Two events are written to the same S3 key on the same day. What happens?',
        choices: ['Both are stored', 'The second overwrites the first', 'S3 rejects the write', 'S3 appends them'],
        answer: 'The second overwrites the first',
        explanation: 'Object keys are unique and immutable. Writing to an existing key replaces the object unless versioning is enabled.'
      },
      {
        id: 'p3-m3',
        prompt: 'A database needs low-latency disk access on one server. Which storage type?',
        choices: ['S3 object storage', 'EBS block storage', 'CloudFront', 'A queue'],
        answer: 'EBS block storage',
        explanation: 'Databases need a fast filesystem with in-place block access. Object storage cannot serve that access pattern.'
      },
      {
        id: 'p3-m4',
        prompt: 'Every request uses the partition key "global". What is the result?',
        choices: ['Even load across partitions', 'A hot partition and throttling', 'Lower cost', 'Better ordering'],
        answer: 'A hot partition and throttling',
        explanation: 'Low key cardinality concentrates all traffic on one partition, which caps throughput no matter how large the table is.'
      }
    ],
    coding: [
      {
        id: 'p3-c1',
        title: 'Pick a compute model',
        difficulty: 'easy',
        prompt: 'Write computeFor(w) returning "lambda" when w.eventDriven is true and w.longRunning is not true; otherwise "ec2" when w.needsOsControl is true; otherwise "container" when w.portableContainer is true; otherwise "lambda".',
        starterCode: `// Match the workload to the model.
function computeFor(w) {
  // your code here
}`,
        tests: [
          `computeFor({ eventDriven: true, longRunning: false }) === 'lambda'`,
          `computeFor({ eventDriven: true, longRunning: true }) === 'lambda'`,
          `computeFor({ needsOsControl: true }) === 'ec2'`,
          `computeFor({ portableContainer: true }) === 'container'`,
          `computeFor({}) === 'lambda'`
        ],
        hints: [
          'The eventDriven branch also requires that the job is not longRunning.',
          'Check needsOsControl before portableContainer, since EC2 wins over containers here.',
          'Default to "lambda" so an unknown shape still returns something usable.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Each compute model solves a different problem.',
          'Event-driven and short means serverless scales to zero and bills per use.',
          'Needing operating system control means those duties stay with you, so EC2.',
          'Portability across environments points to containers, and anything unknown falls back to serverless.'
        ],
        solution: `function computeFor(w) {
  if (w.eventDriven && !w.longRunning) return 'lambda';
  if (w.needsOsControl) return 'ec2';
  if (w.portableContainer) return 'container';
  return 'lambda';
}`
      },
      {
        id: 'p3-c2',
        title: 'Build a partition-safe S3 key',
        difficulty: 'easy',
        prompt: 'Write objectKey(prefix, year, month, day, id) returning a key of the form prefix/year=YYYY/month=MM/day=DD/<id>.parquet, with month and day zero-padded to two digits.',
        starterCode: `// One event, one unique, partitioned key.
function objectKey(prefix, year, month, day, id) {
  // your code here
}`,
        tests: [
          `objectKey('events', 2026, 9, 18, 'e1') === 'events/year=2026/month=09/day=18/e1.parquet'`,
          `objectKey('clean', 2027, 12, 2, 'x') === 'clean/year=2027/month=12/day=02/x.parquet'`,
          `objectKey('events', 2026, 1, 1, 'a') !== objectKey('events', 2026, 1, 1, 'b')`,
          `objectKey('events', 2026, 1, 1, 'a').indexOf('month=01') !== -1`
        ],
        hints: [
          'String(month) can be one digit, which breaks the layout.',
          'padStart(2, "0") turns 9 into "09".',
          'Join the parts with slashes and put the id at the end with the file extension.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Reusing a static key destroys data, because the write overwrites.',
          'So every object needs a unique key.',
          'Zero-padded date parts keep lexical sorting equal to chronological sorting.',
          'Partitioning by date also lets a query engine read only the folders it needs.'
        ],
        solution: `function objectKey(prefix, year, month, day, id) {
  var m = String(month).padStart(2, '0');
  var d = String(day).padStart(2, '0');
  return prefix + '/year=' + year + '/month=' + m + '/day=' + d + '/' + id + '.parquet';
}`
      },
      {
        id: 'p3-c3',
        title: 'Detect a hot partition',
        difficulty: 'easy',
        prompt: 'Write distinctKeys(keys) returning how many unique values the array holds. Also write isHot(keys, minimum) returning true when the number of distinct values is less than minimum.',
        starterCode: `// Low cardinality means one partition takes all the load.
function distinctKeys(keys) {
  // your code here
}
function isHot(keys, minimum) {
  // your code here
}`,
        tests: [
          `distinctKeys(['a', 'a', 'b']) === 2`,
          `distinctKeys([]) === 0`,
          `distinctKeys(['u1', 'u1', 'u1']) === 1`,
          `isHot(['global', 'global'], 2) === true`,
          `isHot(['u1', 'u2', 'u3'], 2) === false`
        ],
        hints: [
          'Use an object as a set, recording each key the first time you see it.',
          'Count only on the first sighting, not on every occurrence.',
          'isHot simply compares the distinct count against the minimum.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'A partition key with few distinct values sends most traffic to one partition.',
          'That partition becomes the bottleneck, and adding capacity does not help.',
          'So count the distinct values, which is the key cardinality.',
          'Then compare it against the number of partitions you expect to spread across.'
        ],
        solution: `function distinctKeys(keys) {
  var seen = {};
  var count = 0;
  for (var i = 0; i < keys.length; i++) {
    if (!seen[keys[i]]) {
      seen[keys[i]] = true;
      count++;
    }
  }
  return count;
}
function isHot(keys, minimum) {
  return distinctKeys(keys) < minimum;
}`
      },
      {
        id: 'p3-c4',
        title: 'Build an API response',
        difficulty: 'medium',
        prompt: 'Write respond(statusCode, payload) returning an API-style response object with statusCode, a headers object whose "content-type" is application/json, and a body that is the payload converted to a string.',
        starterCode: `// The shape your handler must return.
function respond(statusCode, payload) {
  // your code here
}`,
        tests: [
          `respond(200, { ok: true }).statusCode === 200`,
          `JSON.parse(respond(200, { ok: true }).body).ok === true`,
          `respond(400, {}).headers['content-type'] === 'application/json'`,
          `typeof respond(200, { a: 1 }).body === 'string'`,
          `respond(400, { error: 'bad' }).statusCode === 400`
        ],
        hints: [
          'The body must be a string, not an object.',
          'Use JSON.stringify to convert the payload.',
          'Return a fresh object each call so callers cannot mutate a shared response.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'API Gateway passes your returned object straight to the client.',
          'So the status code and headers must be exactly where the client expects them.',
          'The body has to be a string, which is why JSON.stringify is mandatory.',
          'Validating input and returning 400 for a bad request is what makes this production-shaped rather than a demo.'
        ],
        solution: `function respond(statusCode, payload) {
  return {
    statusCode: statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  };
}`
      }
    ]
  },

  'cloud-phase-4': {
    moduleId: 'cloud-phase-4',
    title: 'When Data Becomes Big',
    mcqs: [
      {
        id: 'p4-m1',
        prompt: 'Your dataset is 50,000 small rows and queries are slow. What should you try first?',
        choices: ['Add a Spark cluster', 'Add an index and fix the query', 'Move to a data lake', 'Shard the database'],
        answer: 'Add an index and fix the query',
        explanation: 'Volume is usually not the problem at that size. Measure and fix the query before paying the cost of distribution.'
      },
      {
        id: 'p4-m2',
        prompt: 'One worker in a distributed job dies. What is the safest recovery?',
        choices: ['Restart everything from zero', 'Re-run only that partition and make the merge idempotent', 'Ignore the missing data', 'Double the remaining work'],
        answer: 'Re-run only that partition and make the merge idempotent',
        explanation: 'Retrying a single partition is cheap, and an idempotent merge means a repeated partial result cannot double-count.'
      },
      {
        id: 'p4-m3',
        prompt: 'In MapReduce, what does reduce do?',
        choices: ['Splits records across workers', 'Combines all values that share a key', 'Sorts the output file', 'Removes duplicates'],
        answer: 'Combines all values that share a key',
        explanation: 'Map emits key-value pairs; reduce aggregates every value belonging to the same key.'
      },
      {
        id: 'p4-m4',
        prompt: 'A dashboard must show learners online right now. Which mode?',
        choices: ['Batch', 'Streaming', 'Neither', 'Both are identical'],
        answer: 'Streaming',
        explanation: 'A freshness requirement measured in seconds rules out batch. Choose the mode from how late the decision may be.'
      }
    ],
    coding: [
      {
        id: 'p4-c1',
        title: 'One linear pass',
        difficulty: 'easy',
        prompt: 'Write sumAll(rows) adding every value in a single pass, returning 0 for an empty array.',
        starterCode: `// Linear work scales; nested comparisons explode.
function sumAll(rows) {
  // your code here
}`,
        tests: [
          `sumAll([1, 2, 3]) === 6`,
          `sumAll([]) === 0`,
          `sumAll([10]) === 10`,
          `sumAll([-5, 5]) === 0`
        ],
        hints: [
          'Keep a running total starting at 0.',
          'Add each element once, in one loop.',
          'Starting at 0 makes the empty array correct automatically.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'A single pass over the data is linear work, and it scales.',
          'Accumulate into a total rather than comparing every pair.',
          'Starting the total at 0 means an empty dataset returns 0 rather than undefined.'
        ],
        solution: `function sumAll(rows) {
  var total = 0;
  for (var i = 0; i < rows.length; i++) total += rows[i];
  return total;
}`
      },
      {
        id: 'p4-c2',
        title: 'Split work across partitions',
        difficulty: 'easy',
        prompt: 'Write spread(records, parts, keyFn) returning an array of parts buckets. A record goes into bucket Math.abs(keyFn(record)) % parts.',
        starterCode: `// Split, compute, combine.
function spread(records, parts, keyFn) {
  // your code here
}`,
        tests: [
          `spread([1, 2, 3, 4], 2, function (x) { return x; }).length === 2`,
          `spread([1, 2, 3, 4], 2, function (x) { return x; })[0].length === 2`,
          `spread([], 3, function (x) { return x; }).length === 3`,
          `spread([1], 1, function (x) { return x; })[0][0] === 1`
        ],
        hints: [
          'Create exactly "parts" empty arrays first, even when there are no records.',
          'Use the modulo of the hashed key to choose the bucket.',
          'Math.abs guards against a negative hash producing a negative index.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Distributed processing is split, compute, then combine.',
          'This function is the split step.',
          'Every partition must exist even if it ends up empty, so the number of workers stays predictable.',
          'A good key spreads records evenly, which is what makes the parallelism real.'
        ],
        solution: `function spread(records, parts, keyFn) {
  var buckets = [];
  for (var i = 0; i < parts; i++) buckets.push([]);
  for (var j = 0; j < records.length; j++) {
    var idx = Math.abs(keyFn(records[j])) % parts;
    buckets[idx].push(records[j]);
  }
  return buckets;
}`
      },
      {
        id: 'p4-c3',
        title: 'Combine partial counts',
        difficulty: 'easy',
        prompt: 'Write combine(parts) summing an array of count objects into one object.',
        starterCode: `// The merge step must be safe to repeat.
function combine(parts) {
  // your code here
}`,
        tests: [
          `combine([{ a: 1 }, { a: 2, b: 1 }]).a === 3`,
          `combine([{ a: 1 }, { a: 2, b: 1 }]).b === 1`,
          `combine([]).a === undefined`,
          `combine([{ x: 5 }]).x === 5`
        ],
        hints: [
          'Start with an empty result object.',
          'For each part, loop over its keys and add to whatever is already there.',
          'Default the current value to 0 before adding, so the first add works.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Each worker returns a partial answer, and the driver merges them.',
          'Accumulate rather than assign, because many parts share the same key.',
          'Defaulting to 0 handles the first time a key is seen.',
          'Keeping this merge idempotent is what makes retrying a failed worker safe.'
        ],
        solution: `function combine(parts) {
  var total = {};
  for (var i = 0; i < parts.length; i++) {
    for (var key in parts[i]) {
      total[key] = (total[key] || 0) + parts[i][key];
    }
  }
  return total;
}`
      },
      {
        id: 'p4-c4',
        title: 'Map then reduce a sentence',
        difficulty: 'medium',
        prompt: 'Write wordCounts(text) that splits on single spaces, ignores empty strings, and returns an object mapping each word to how many times it appears.',
        starterCode: `// The canonical batch job, in miniature.
function wordCounts(text) {
  // your code here
}`,
        tests: [
          `wordCounts('a b a').a === 2`,
          `wordCounts('a b a').b === 1`,
          `JSON.stringify(wordCounts('')) === JSON.stringify({})`,
          `wordCounts('x  y')[0] === undefined`
        ],
        hints: [
          'Splitting on a space can produce empty strings when there are double spaces.',
          'Skip empty words before counting.',
          'Accumulate with (current || 0) + 1 for each occurrence.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Map turns each word into a key-value pair of word and 1.',
          'Reduce groups those pairs by key and sums them.',
          'Both steps are combined in one loop here, but the idea is identical.',
          'This is the same shape as counting completions per lesson across millions of events.'
        ],
        solution: `function wordCounts(text) {
  var counts = {};
  var words = text.split(' ');
  for (var i = 0; i < words.length; i++) {
    if (words[i] === '') continue;
    counts[words[i]] = (counts[words[i]] || 0) + 1;
  }
  return counts;
}`
      }
    ]
  },

  'cloud-phase-5': {
    moduleId: 'cloud-phase-5',
    title: 'Data Lakes and Analytics',
    mcqs: [
      {
        id: 'p5-m1',
        prompt: 'You query three columns from a forty-column table. Which format reads least data?',
        choices: ['CSV', 'JSON', 'Parquet', 'They are equal'],
        answer: 'Parquet',
        explanation: 'Parquet is columnar, so the engine reads only the selected columns. Row formats must read every column of every row.'
      },
      {
        id: 'p5-m2',
        prompt: 'Why keep a raw zone in a data lake?',
        choices: ['It queries faster', 'So pipelines can be re-run after a bug fix', 'It is smaller', 'It encrypts data'],
        answer: 'So pipelines can be re-run after a bug fix',
        explanation: 'If you only keep cleaned data and the cleaning had a bug, you need the original to reprocess. Raw is your replay and audit source.'
      },
      {
        id: 'p5-m3',
        prompt: 'Which clause filters groups rather than individual rows?',
        choices: ['WHERE', 'HAVING', 'LIMIT', 'ORDER BY'],
        answer: 'HAVING',
        explanation: 'WHERE filters rows before grouping. HAVING filters the aggregated groups afterwards.'
      },
      {
        id: 'p5-m4',
        prompt: 'Athena charges for:',
        choices: ['Servers per hour', 'Bytes scanned', 'Tables created', 'Users per month'],
        answer: 'Bytes scanned',
        explanation: 'Cost follows data scanned, which is why partitioning and columnar formats are the core cost strategy.'
      }
    ],
    coding: [
      {
        id: 'p5-c1',
        title: 'Estimate scanned bytes',
        difficulty: 'easy',
        prompt: 'Write bytesScanned(rows, format, selected, total) using 200 bytes per row. For "parquet" return rows times 200 times selected divided by total, rounded up. For any other format return rows times 200.',
        starterCode: `// Why columnar storage is cheaper.
function bytesScanned(rows, format, selected, total) {
  // your code here
}`,
        tests: [
          `bytesScanned(1000, 'csv', 2, 10) === 200000`,
          `bytesScanned(1000, 'parquet', 2, 10) === 40000`,
          `bytesScanned(1000, 'parquet', 10, 10) === 200000`,
          `bytesScanned(0, 'parquet', 2, 10) === 0`
        ],
        hints: [
          'Row-oriented formats cannot avoid reading whole rows.',
          'For columnar, scale by the fraction of columns you selected.',
          'Round up with Math.ceil so a partial block still counts.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'A row-oriented file stores each record together.',
          'So asking for two columns still reads all forty.',
          'A columnar file stores each field together, so only the selected columns are read.',
          'That fraction is exactly why analytics uses Parquet.'
        ],
        solution: `function bytesScanned(rows, format, selected, total) {
  var perRow = 200;
  if (format === 'parquet') {
    return Math.ceil(rows * perRow * (selected / total));
  }
  return rows * perRow;
}`
      },
      {
        id: 'p5-c2',
        title: 'Build a lake key',
        difficulty: 'easy',
        prompt: 'Write lakeKey(zone, year, month, day, id) returning zone/year=YYYY/month=MM/day=DD/<id>.parquet with month and day zero-padded.',
        starterCode: `// One naming convention, applied everywhere.
function lakeKey(zone, year, month, day, id) {
  // your code here
}`,
        tests: [
          `lakeKey('clean', 2026, 9, 18, 'e1') === 'clean/year=2026/month=09/day=18/e1.parquet'`,
          `lakeKey('raw', 2027, 12, 2, 'x') === 'raw/year=2027/month=12/day=02/x.parquet'`,
          `lakeKey('raw', 2026, 1, 1, 'e1') !== lakeKey('clean', 2026, 1, 1, 'e1')`,
          `lakeKey('raw', 2026, 1, 1, 'e1').indexOf('month=01') !== -1`
        ],
        hints: [
          'Month and day arrive as numbers, so pad them to two digits.',
          'padStart(2, "0") is the zero-padding tool you need.',
          'Join the segments with slashes and finish with the id and extension.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'The zone records how much you trust the data: raw, clean, or curated.',
          'The date segments let a query engine skip folders it does not need.',
          'Zero-padding keeps alphabetical order equal to date order.',
          'The id makes each object unique, so nothing is overwritten.'
        ],
        solution: `function lakeKey(zone, year, month, day, id) {
  var m = String(month).padStart(2, '0');
  var d = String(day).padStart(2, '0');
  return zone + '/year=' + year + '/month=' + m + '/day=' + d + '/' + id + '.parquet';
}`
      },
      {
        id: 'p5-c3',
        title: 'Write the partition filter',
        difficulty: 'easy',
        prompt: 'Write partitionFilter(year, month) returning the SQL fragment year = \'YYYY\' AND month = \'MM\', with month zero-padded to two digits.',
        starterCode: `// This filter is what makes an Athena query cheap.
function partitionFilter(year, month) {
  // your code here
}`,
        tests: [
          `partitionFilter(2026, 9) === "year = '2026' AND month = '09'"`,
          `partitionFilter(2027, 12) === "year = '2027' AND month = '12'"`,
          `partitionFilter(2026, 1).indexOf("month = '01'") !== -1`,
          `partitionFilter(2026, 9).indexOf('year') === 0`
        ],
        hints: [
          'This function returns SQL text, so quotes are part of the output.',
          'Pad the month the same way you padded the lake key.',
          'Build the string with single quotes around each literal value.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Athena bills for bytes scanned, not rows returned.',
          'A partition filter tells the engine which folders to read.',
          'Without it, the same query scans the entire lake.',
          'So this tiny string function is the difference between a cheap query and an expensive one.'
        ],
        solution: `function partitionFilter(year, month) {
  var m = String(month).padStart(2, '0');
  return "year = '" + year + "' AND month = '" + m + "'";
}`
      },
      {
        id: 'p5-c4',
        title: 'Quantify the savings',
        difficulty: 'medium',
        prompt: 'Write savingsPercent(fullScanTB, filteredScanTB) returning the percentage of scanned data avoided, as a whole number rounded to the nearest integer. Return 0 when fullScanTB is 0.',
        starterCode: `// Turn a design choice into a number you can defend.
function savingsPercent(fullScanTB, filteredScanTB) {
  // your code here
}`,
        tests: [
          `savingsPercent(2, 0.02) === 99`,
          `savingsPercent(2, 2) === 0`,
          `savingsPercent(0, 0) === 0`,
          `savingsPercent(1, 0.5) === 50`
        ],
        hints: [
          'Savings are the fraction of the full scan you no longer do.',
          'Compute 1 minus filtered divided by full, then multiply by 100.',
          'Guard the divide-by-zero case before computing.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Cost arguments win when they are numbers, not adjectives.',
          'The saving is the proportion of the full scan that partitioning avoids.',
          'Multiply by 100 and round so it reads like a percentage.',
          'Handling the zero case first prevents a division by zero.'
        ],
        solution: `function savingsPercent(fullScanTB, filteredScanTB) {
  if (fullScanTB === 0) return 0;
  return Math.round((1 - filteredScanTB / fullScanTB) * 100);
}`
      }
    ]
  },

  'cloud-phase-6': {
    moduleId: 'cloud-phase-6',
    title: 'Reliable Pipelines and Streaming',
    mcqs: [
      {
        id: 'p6-m1',
        prompt: 'A queue delivers the same message twice. What must the consumer be?',
        choices: ['Faster', 'Idempotent', 'Stateless', 'Encrypted'],
        answer: 'Idempotent',
        explanation: 'At-least-once delivery is the norm. Idempotency means processing a message twice has the same effect as once.'
      },
      {
        id: 'p6-m2',
        prompt: 'Every event uses the partition key "global". What is affected?',
        choices: ['Only storage cost', 'Throughput, because one shard takes all writes', 'Nothing', 'Only encryption'],
        answer: 'Throughput, because one shard takes all writes',
        explanation: 'A constant key has cardinality of one, so every record lands on the same shard and that shard throttles.'
      },
      {
        id: 'p6-m3',
        prompt: 'Which timestamp should a streaming window use?',
        choices: ['Processing time', 'Event time', 'Server boot time', 'None'],
        answer: 'Event time',
        explanation: 'Event time is when the thing actually happened. Windowing on processing time rewrites history when events arrive late.'
      },
      {
        id: 'p6-m4',
        prompt: 'A Firehose buffer is set to 1 MB and 1 second. What is the consequence?',
        choices: ['Cheaper queries', 'Thousands of tiny S3 objects', 'Data loss', 'No consequence'],
        answer: 'Thousands of tiny S3 objects',
        explanation: 'Small buffers flush constantly. Many tiny objects add query overhead and cost, which is the small files problem.'
      }
    ],
    coding: [
      {
        id: 'p6-c1',
        title: 'Deduplicate a delivery batch',
        difficulty: 'easy',
        prompt: 'Write dedupe(events) returning only the first event for each id, in order, skipping events with no usable id.',
        starterCode: `// At-least-once delivery means sometimes twice.
function dedupe(events) {
  // your code here
}`,
        tests: [
          `dedupe([{ id: 'a' }, { id: 'a' }]).length === 1`,
          `dedupe([{ id: 'a' }, { id: 'a' }, { id: 'b' }])[1].id === 'b'`,
          `dedupe([{}, {}]).length === 0`,
          `dedupe([]).length === 0`
        ],
        hints: [
          'Keep a record of ids you have already accepted.',
          'Skip an event when its id is missing, because you cannot deduplicate it.',
          'Push to the output only on the first sighting.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Queues deliver at least once, so duplicates are normal rather than exceptional.',
          'Give every piece of work a stable id and remember which you have processed.',
          'Skipping id-less events is safer than guessing.',
          'This single function is what prevents double-counted revenue.'
        ],
        solution: `function dedupe(events) {
  var seen = {};
  var out = [];
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (!e || !e.id) continue;
    if (seen[e.id]) continue;
    seen[e.id] = true;
    out.push(e);
  }
  return out;
}`
      },
      {
        id: 'p6-c2',
        title: 'Deterministic shard routing',
        difficulty: 'medium',
        prompt: 'Write shardFor(key, shards). Hash by starting at 0 and, for each character, setting hash to (hash * 31 + characterCode) modulo 1000000007. Return the absolute hash modulo shards.',
        starterCode: `// The same key must always reach the same shard.
function shardFor(key, shards) {
  // your code here
}`,
        tests: [
          `shardFor('u1', 4) === shardFor('u1', 4)`,
          `shardFor('u1', 4) >= 0`,
          `shardFor('u1', 4) < 4`,
          `shardFor('anything', 1) === 0`,
          `(function () { var s = {}; for (var i = 0; i < 20; i++) { s[shardFor('user-' + i, 4)] = true; } return Object.keys(s).length >= 2; })() === true`
        ],
        hints: [
          'Walk the characters one at a time, mixing each into the hash.',
          'Take the modulo inside the loop to keep the number small.',
          'The final modulo by shards must produce a value below the shard count.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Events with the same key must land on the same shard, or ordering breaks.',
          'So the routing has to be deterministic, not random.',
          'A rolling hash mixes each character into a running number.',
          'Modulo by the shard count then picks a shard, and a good key spreads users evenly.'
        ],
        solution: `function shardFor(key, shards) {
  var hash = 0;
  for (var i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 1000000007;
  }
  return Math.abs(hash) % shards;
}`
      },
      {
        id: 'p6-c3',
        title: 'Tumbling window start',
        difficulty: 'easy',
        prompt: 'Write windowStart(ts, windowSeconds) returning the start of the tumbling window that contains ts, where both are in seconds.',
        starterCode: `// Tumbling windows are fixed and non-overlapping.
function windowStart(ts, windowSeconds) {
  // your code here
}`,
        tests: [
          `windowStart(0, 60) === 0`,
          `windowStart(10, 60) === 0`,
          `windowStart(70, 60) === 60`,
          `windowStart(120, 60) === 120`,
          `windowStart(59, 60) === 0`
        ],
        hints: [
          'Divide by the window size, round down, then multiply back.',
          'Math.floor performs the round-down for positive values.',
          'Multiplying back gives the aligned window boundary rather than an index.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'A tumbling window is a fixed bucket of time that does not overlap.',
          'To find which bucket a timestamp belongs to, divide by the window size.',
          'Flooring gives the bucket index, and multiplying back gives its start time.',
          'Grouping by that value is what makes late events land in the correct window.'
        ],
        solution: `function windowStart(ts, windowSeconds) {
  return Math.floor(ts / windowSeconds) * windowSeconds;
}`
      },
      {
        id: 'p6-c4',
        title: 'Live completion counter',
        difficulty: 'medium',
        prompt: 'Write liveCompletions(events, windowSeconds) that first removes duplicate ids (keeping the first), groups the rest by the tumbling window of their ts, and returns an object mapping each window start to the number of events in it where completed is true.',
        starterCode: `// Deduplicate, window, then count.
function liveCompletions(events, windowSeconds) {
  // your code here
}`,
        tests: [
          `liveCompletions([{ id: 'a', ts: 5, completed: true }], 60)[0] === 1`,
          `liveCompletions([{ id: 'a', ts: 5, completed: true }, { id: 'a', ts: 5, completed: true }], 60)[0] === 1`,
          `liveCompletions([{ id: 'a', ts: 5, completed: false }], 60)[0] === 0`,
          `liveCompletions([{ id: 'a', ts: 5, completed: true }, { id: 'b', ts: 70, completed: true }], 60)[60] === 1`,
          `liveCompletions([], 60)[0] === undefined`
        ],
        hints: [
          'Reuse the two ideas you already wrote: dedupe first, then window.',
          'Compute the window start for each event and use it as an object key.',
          'Only count events whose completed flag is exactly true.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'A live counter is wrong the moment duplicates or late events are mishandled.',
          'So deduplicate by id before counting anything.',
          'Then window by event time so a late event still lands in the right bucket.',
          'Finally count only completed rows, including zero for a window with none.'
        ],
        solution: `function liveCompletions(events, windowSeconds) {
  var seen = {};
  var windows = {};
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (!e || !e.id) continue;
    if (seen[e.id]) continue;
    seen[e.id] = true;
    var start = Math.floor(e.ts / windowSeconds) * windowSeconds;
    if (windows[start] === undefined) windows[start] = 0;
    if (e.completed === true) windows[start] = windows[start] + 1;
  }
  return windows;
}`
      }
    ]
  },

  'cloud-phase-7': {
    moduleId: 'cloud-phase-7',
    title: 'Production Architecture',
    mcqs: [
      {
        id: 'p7-m1',
        prompt: 'Which signal is best for alerting on a trend?',
        choices: ['Logs', 'Metrics', 'Traces', 'Notes'],
        answer: 'Metrics',
        explanation: 'Metrics are cheap numbers over time, ideal for thresholds and alerts. Logs carry detail, traces follow one request.'
      },
      {
        id: 'p7-m2',
        prompt: 'A service is overloaded by a burst. Which change converts an outage into a delay?',
        choices: ['Add a cache', 'Add a queue', 'Add a CDN', 'Add more indexes'],
        answer: 'Add a queue',
        explanation: 'A queue accepts work faster than it is processed, so requests wait instead of failing. The cost is latency.'
      },
      {
        id: 'p7-m3',
        prompt: 'Replication alone fails to protect against which event?',
        choices: ['Disk failure', 'Accidental deletion of a table', 'Zone outage', 'Instance crash'],
        answer: 'Accidental deletion of a table',
        explanation: 'Replication copies the deletion within seconds. Only a separate, ideally immutable backup restores an earlier state.'
      },
      {
        id: 'p7-m4',
        prompt: 'What is the main benefit of infrastructure as code?',
        choices: ['It types faster', 'Reproducible, reviewable environments', 'It removes cloud cost', 'It replaces monitoring'],
        answer: 'Reproducible, reviewable environments',
        explanation: 'Because the environment is text, it can be reviewed, versioned, scanned for open permissions and rebuilt from the repository.'
      }
    ],
    coding: [
      {
        id: 'p7-c2',
        title: 'Count errors by level',
        difficulty: 'medium',
        prompt: 'Write countErrors(lines) returning how many lines parse as JSON and have a level of exactly "error". Skip anything that does not parse.',
        starterCode: `// How bad is it right now?
function countErrors(lines) {
  // your code here
}`,
        tests: [
          `countErrors(['{"level":"error"}']) === 1`,
          `countErrors(['{"level":"error"}', '{"level":"info"}']) === 1`,
          `countErrors(['{"level":"error"}', '{"level":"error"}']) === 2`,
          `countErrors(['garbage']) === 0`,
          `countErrors([]) === 0`
        ],
        hints: [
          'Parse each line, and ignore it if parsing fails.',
          'Guard the parsed value before reading its level.',
          'Compare against the exact lowercase string "error".'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'This is the number you would wire to an alarm threshold.',
          'Parse each line defensively, because one bad line must not break the count.',
          'Only an exact level match counts.',
          'In production you would alert when this ratio crosses a percentage tied to user experience.'
        ],
        solution: `function countErrors(lines) {
  var count = 0;
  for (var i = 0; i < lines.length; i++) {
    var parsed = null;
    try { parsed = JSON.parse(lines[i]); } catch (e) { parsed = null; }
    if (parsed && parsed.level === 'error') count++;
  }
  return count;
}`
      },
      {
        id: 'p7-c3',
        title: 'Servers for a peak',
        difficulty: 'easy',
        prompt: 'Write serversNeeded(rps, capacityPerServer) returning the ceiling of rps divided by capacityPerServer.',
        starterCode: `// Round up, because a half server does not exist.
function serversNeeded(rps, capacityPerServer) {
  // your code here
}`,
        tests: [
          `serversNeeded(100, 50) === 2`,
          `serversNeeded(101, 50) === 3`,
          `serversNeeded(50, 50) === 1`,
          `serversNeeded(0, 50) === 0`
        ],
        hints: [
          'Simply dividing gives a fraction like 2.02.',
          'Math.ceil rounds up to the next whole server.',
          'Zero traffic needs zero servers, which Math.ceil already gives you.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Capacity planning starts with the peak request rate.',
          'Divide by what one server can handle, then round up.',
          'Rounding up matters because under-capacity means failed requests.',
          'In practice you would try caching and queueing before buying these servers.'
        ],
        solution: `function serversNeeded(rps, capacityPerServer) {
  return Math.ceil(rps / capacityPerServer);
}`
      },
    ]
  },

  'cloud-phase-8': {
    moduleId: 'cloud-phase-8',
    title: 'AI Data Systems and Capstone',
    mcqs: [
      {
        id: 'p8-m1',
        prompt: 'A model answers confidently but invents a fact about your own documents. What is missing?',
        choices: ['More temperature', 'Retrieval of your own content', 'A bigger model', 'More output tokens'],
        answer: 'Retrieval of your own content',
        explanation: 'A model only knows what it was trained on. Retrieval grounds the answer in your corpus and lets it cite sources.'
      },
      {
        id: 'p8-m2',
        prompt: 'What is an embedding?',
        choices: ['A compressed file', 'A numeric vector representing meaning', 'A database index', 'A prompt template'],
        answer: 'A numeric vector representing meaning',
        explanation: 'Embeddings place similar meanings close together, which is what enables search by meaning rather than by keyword.'
      },
      {
        id: 'p8-m3',
        prompt: 'Ingestion is re-run without deduplication. What breaks?',
        choices: ['Nothing', 'Retrieval returns the same passage twice and skews answers', 'Storage cost falls', 'The model retrains'],
        answer: 'Retrieval returns the same passage twice and skews answers',
        explanation: 'Duplicate vectors crowd the top results with the same content, so the model sees a distorted view of the sources.'
      },
      {
        id: 'p8-m4',
        prompt: 'A capstone is finished when it is:',
        choices: ['Drawn as a diagram', 'Deployed, observed, costed, restorable and explained', 'Using the most services', 'Working once on your machine'],
        answer: 'Deployed, observed, costed, restorable and explained',
        explanation: 'Evidence is the deliverable: a working endpoint, logs, an alarm, a cost comparison, a tested restore and a written decision.'
      }
    ],
    coding: [
      {
        id: 'p8-c1',
        title: 'Shape a model request',
        difficulty: 'easy',
        prompt: 'Write modelRequest(question, modelId) returning an object with modelId and a messages array containing one user message whose content is an array with one part whose text is the question.',
        starterCode: `// The request shape a model call expects.
function modelRequest(question, modelId) {
  // your code here
}`,
        tests: [
          `modelRequest('hi', 'm').modelId === 'm'`,
          `modelRequest('hi', 'm').messages[0].role === 'user'`,
          `modelRequest('hi', 'm').messages[0].content[0].text === 'hi'`,
          `modelRequest('hi', 'm').messages.length === 1`
        ],
        hints: [
          'The messages array always has at least one entry for a fresh call.',
          'Each message has a role and a content array.',
          'Each content part is an object with a text field.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'A model call is a structured request, not a sentence.',
          'The model id selects which foundation model answers.',
          'Messages carry the conversation, each with a role.',
          'Content is a list of parts, which is what allows text and other inputs to mix.'
        ],
        solution: `function modelRequest(question, modelId) {
  return {
    modelId: modelId,
    messages: [
      { role: 'user', content: [{ text: question }] }
    ]
  };
}`
      },
      {
        id: 'p8-c2',
        title: 'Token cost',
        difficulty: 'easy',
        prompt: 'Write tokenCost(inputTokens, outputTokens, inPricePer1k, outPricePer1k) as inputTokens divided by 1000 times the input price, plus outputTokens divided by 1000 times the output price.',
        starterCode: `// You pay for tokens in and tokens out.
function tokenCost(inputTokens, outputTokens, inPricePer1k, outPricePer1k) {
  // your code here
}`,
        tests: [
          `tokenCost(1000, 1000, 1, 2) === 3`,
          `tokenCost(0, 0, 1, 1) === 0`,
          `tokenCost(2000, 0, 1, 1) === 2`,
          `tokenCost(0, 2000, 1, 2) === 4`
        ],
        hints: [
          'Prices are per thousand tokens, so divide the token count by 1000.',
          'Compute the input and output costs separately.',
          'Add the two parts together for the total.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Model cost scales with how much text goes in and comes out.',
          'Prices are quoted per thousand tokens, hence the division.',
          'Input and output are usually priced differently.',
          'That is why a bloated prompt and an untrimmed context are paid for on every single call.'
        ],
        solution: `function tokenCost(inputTokens, outputTokens, inPricePer1k, outPricePer1k) {
  return (inputTokens / 1000) * inPricePer1k + (outputTokens / 1000) * outPricePer1k;
}`
      },
      {
        id: 'p8-c3',
        title: 'Chunk a document',
        difficulty: 'medium',
        prompt: 'Write chunkText(text, maxChars) splitting on single spaces, skipping empty strings, and starting a new chunk when adding the next word would make the current chunk longer than maxChars. No chunk may exceed maxChars.',
        starterCode: `// Chunks must be small enough to be relevant, large enough to be useful.
function chunkText(text, maxChars) {
  // your code here
}`,
        tests: [
          `chunkText('a b c', 3).length === 2`,
          `chunkText('hello', 100).length === 1`,
          `chunkText('', 10).length === 0`,
          `chunkText('a b c', 3).every(function (c) { return c.length <= 3; }) === true`,
          `chunkText('a b c', 3)[0] === 'a b'`
        ],
        hints: [
          'Track the chunk you are currently building as a string.',
          'Before appending a word, check whether it would overflow maxChars.',
          'Only start a new chunk if the current one is not empty, so a single oversized word still gets emitted.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'Retrieval quality depends on chunk size.',
          'Chunks that are too large dilute the meaning and waste tokens.',
          'Chunks that are too small fragment a single idea.',
          'So pack words until the next one would overflow, then start a fresh chunk.'
        ],
        solution: `function chunkText(text, maxChars) {
  var chunks = [];
  var current = '';
  var words = text.split(' ');
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (w === '') continue;
    if (current !== '' && current.length + w.length + 1 > maxChars) {
      chunks.push(current);
      current = w;
    } else {
      current = current === '' ? w : current + ' ' + w;
    }
  }
  if (current !== '') chunks.push(current);
  return chunks;
}`
      },
      {
        id: 'p8-c4',
        title: 'Build a grounded prompt',
        difficulty: 'medium',
        prompt: 'Write groundedPrompt(question, chunks) returning a string that instructs the model to answer using ONLY the sources and to cite each claim, lists every chunk as [source n] starting at 1, and includes the question.',
        starterCode: `// Ground the answer in retrieved sources.
function groundedPrompt(question, chunks) {
  // your code here
}`,
        tests: [
          `groundedPrompt('Q', ['A']).indexOf('[source 1] A') !== -1`,
          `groundedPrompt('Q', ['A']).indexOf('ONLY') !== -1`,
          `groundedPrompt('Q', ['A']).indexOf('cite') !== -1`,
          `groundedPrompt('What is X?', ['A']).indexOf('What is X?') !== -1`,
          `groundedPrompt('Q', ['A', 'B']).indexOf('[source 2] B') !== -1`
        ],
        hints: [
          'Number the sources starting at 1, which is the index plus one.',
          'The instruction must forbid answering from memory.',
          'Include the question at the end so the model knows what to answer.'
        ],
        target: { label: 'your code here', line: 3 },
        explanation: [
          'A plain model call answers from memory, which is where confident invention comes from.',
          'Retrieval supplies the sources, but the prompt must constrain the model to them.',
          'Numbering the sources is what makes citations possible.',
          'If the answer is not present, the model should say so rather than guess.'
        ],
        solution: `function groundedPrompt(question, chunks) {
  var context = '';
  for (var i = 0; i < chunks.length; i++) {
    context += '[source ' + (i + 1) + '] ' + chunks[i] + '\\n';
  }
  return 'Answer using ONLY the sources below and cite each claim as [source n]. ' +
    'If the answer is not present, say so.\\n\\nSOURCES:\\n' + context +
    '\\nQUESTION: ' + question;
}`
      }
    ]
  }
};
