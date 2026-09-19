import { Module } from '../../types';

/**
 * Phase 2 — Security and Network Boundaries (Lessons 9-12).
 * Simulation fidelity (playbook R4): the IAM simulator honours explicit-Deny
 * precedence and wildcard matching, exactly like real IAM evaluation.
 */
export const PHASE_2_MODULE: Module = {
  id: 'cloud-phase-2',
  title: 'Module 3: Identity and Network Boundaries',
  lessons: [
    {
      id: 'security-identity',
      title: 'Identity: authentication vs authorization',
      objectives: [
        'Distinguish authentication from authorization',
        'Check whether a session token is still valid',
        'Check whether an identity holds a permission',
        'Explain why the two are never the same question'
      ],
      prerequisites: ['Cloud Cost: Pricing Models, Tags, Budgets and Cleanup'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Remember lesson 2 where you parsed a JSON response and checked the status before trusting it? A login token is the same idea, it\'s a little JSON blob you have to validate before you trust it.',
          'Nearly every security bug boils down to two questions asked in the wrong order. Who are you? That\'s authentication. What are you allowed to do? That\'s authorization. Mix them up and the wrong person ends up deleting the right data.',
          'Authentication is about identity, are you who you say you are? A signed token, a password plus second factor, or a short-lived credential from a role all do this. Notice that word short-lived, it\'s intentional. Temporary identity is just safer than a password that lives forever.',
          'Authorization is permission. Once you know who someone is, you decide if they can do this action on this resource. Being signed in says nothing about being allowed. Every logged in user can read their own progress, none can read yours.',
          'One way to keep it straight is a hotel. Authentication is showing your passport at the desk and getting a key card. Authorization is which doors that card actually opens. A valid card isn\'t automatically a master key.',
          'Don\'t build a system that checks is logged in and then trusts the request. Check who they are, then check if that identity can do this specific thing to this specific resource. Log both answers too, an access-denied event is one of the most useful signals you\'ll have.'
        ],
        demos: [
          {
            code: `// Foundation drill: a token is JSON you must validate.
const token = { userId: 'u-1042', expiresAt: 1700000000000 };
const nowMs = 1699999000000;

function isAuthenticated(token, nowMs) {
  if (!token) return false;
  if (!token.expiresAt) return false;
  return token.expiresAt > nowMs;
}

function isAuthorized(user, permission) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.indexOf(permission) !== -1;
}

console.log('Authenticated? ' + isAuthenticated(token, nowMs));
console.log('Expired token? ' + isAuthenticated(token, nowMs + 2000000));

const user = { id: 'u-1042', permissions: ['s3:GetObject'] };
console.log('May read?    ' + isAuthorized(user, 's3:GetObject'));
console.log('May delete?  ' + isAuthorized(user, 's3:DeleteObject'));
console.log('Authenticated but not authorized is the normal, healthy case.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Which question is authentication and which is authorization?'
          },
          {
            type: 'apply',
            prompt: 'A user is signed in but cannot read a bucket. Which of the two checks failed, and where would you look?'
          },
          {
            type: 'predict',
            prompt: 'You change your system to only ask "is the user logged in?" before deleting records. What is the first abuse that becomes possible?'
          }
        ],
        debugging: [
          {
            buggyCode: `// The delete route only checks that a user is logged in.
function deleteRecord(request) {
  if (request.token) {
    return { status: 200, body: 'deleted' }; // any logged-in user can delete!
  }
  return { status: 401, body: 'not authenticated' };
}
console.log(JSON.stringify(deleteRecord({ token: { userId: 'u-2' }, recordOwnerId: 'u-1' })));`,
            hints: [
              'Which of the two questions is missing here?',
              'Who owns the record, and who is asking?',
              'What should the function check before deleting?'
            ],
            solution: `function deleteRecord(request) {
  if (!request.token) {
    return { status: 401, body: 'not authenticated' };
  }
  // Authorization: identity alone is not permission.
  const isOwner = request.token.userId === request.recordOwnerId;
  const isAdmin = request.token.roles && request.token.roles.indexOf('admin') !== -1;
  if (!isOwner && !isAdmin) {
    return { status: 403, body: 'not authorized' };
  }
  return { status: 200, body: 'deleted' };
}
console.log(JSON.stringify(deleteRecord({ token: { userId: 'u-2' }, recordOwnerId: 'u-1' })));`
          }
        ],
        exercises: [
          {
            prompt: 'Write two functions. isAuthenticated(token, nowMs) returns true only when the token exists, has an expiresAt value, and expiresAt is greater than nowMs. isAuthorized(user, permission) returns true only when the user exists, has a permissions array, and that array contains the permission.',
            tests: [
              `isAuthenticated({ expiresAt: 100 }, 50) === true`,
              `isAuthenticated({ expiresAt: 50 }, 100) === false`,
              `isAuthenticated(null, 100) === false`,
              `isAuthenticated({}, 100) === false`,
              `isAuthorized({ permissions: ['s3:GetObject'] }, 's3:GetObject') === true`,
              `isAuthorized({ permissions: ['s3:GetObject'] }, 's3:DeleteObject') === false`,
              `isAuthorized(null, 's3:GetObject') === false`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'A signed-in user is blocked from a resource. Which check failed?',
              choices: ['Authentication', 'Authorization', 'Neither'],
              answer: 'Authorization'
            },
            {
              type: 'mcq',
              prompt: 'Which identity is safest for a service?',
              choices: ['A long-lived access key', 'A short-lived temporary credential', 'A shared team password'],
              answer: 'A short-lived temporary credential'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Authentication answers who',
          'Authorization answers what you may do',
          'Validating token expiry',
          'Authenticated does not mean authorized'
        ],
        mistakeWatchlist: ['Trusting a request because the user is logged in']
      },
      nextLesson: 'security-iam-policies'
    },
    {
      id: 'security-iam-policies',
      title: 'IAM policies, roles and least privilege',
      objectives: [
        'Read an IAM policy statement and identify Effect, Action and Resource',
        'Apply explicit-Deny precedence and wildcard matching',
        'Choose a role over a key for a service',
        'Write a least-privilege policy for one task'
      ],
      prerequisites: ['Identity: Authentication vs Authorization'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'In lesson 3 you read a role or table name from an environment variable instead of hardcoding it. Now we write the policy that decides if that value can even be used.',
          'IAM is the most important security control in AWS. It decides who can call which API on which resource. Most incidents aren\'t clever hacks, they\'re permissions left too broad so one small mistake turns into a big one.',
          'A policy is just a JSON document with statements. Each statement has an Effect, Allow or Deny, an Action like s3:GetObject, and a Resource like an ARN. It can also carry a Condition for extra checks.',
          'Think of a row of explicit gates. Everything is refused by default. An Allow opens one gate. A Deny slams it shut and nothing can reopen it. That last bit catches beginners, an explicit Deny always beats an Allow, even one with a wildcard.',
          'Least privilege means giving the smallest set of actions on the smallest set of resources that still gets the job done. Instead of Action star and Resource star, name the three actions on the one table you need. It\'s not paperwork, it limits how far a bug or a stolen credential can reach.',
          'For services, use roles not keys. A Lambda or an EC2 instance assumes a role and gets temporary credentials that rotate on their own. If a person really needs a key, turn on MFA and rotate it regularly.'
        ],
        demos: [
          {
            code: `// Evaluate a policy the way IAM actually does: Deny wins.
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

function matches(pattern, value) {
  if (pattern === '*') return true;
  if (pattern.slice(-1) === '*') return value.startsWith(pattern.slice(0, -1));
  return pattern === value;
}

function isAllowed(policy, action, resource) {
  let allowed = false;
  for (const statement of policy.Statement) {
    const actionMatch = toArray(statement.Action).some(function (p) { return matches(p, action); });
    const resourceMatch = toArray(statement.Resource).some(function (p) { return matches(p, resource); });
    if (!actionMatch || !resourceMatch) continue;
    if (statement.Effect === 'Deny') return false; // explicit deny always wins
    if (statement.Effect === 'Allow') allowed = true;
  }
  return allowed;
}

const policy = {
  Version: '2012-10-17',
  Statement: [
    { Effect: 'Allow', Action: ['s3:GetObject', 's3:PutObject'], Resource: 'arn:aws:s3:::ecosystem-corpus/*' },
    { Effect: 'Deny',  Action: 's3:DeleteObject',              Resource: '*' }
  ]
};

console.log('Read?   ' + isAllowed(policy, 's3:GetObject', 'arn:aws:s3:::ecosystem-corpus/welcome.md'));
console.log('Write?  ' + isAllowed(policy, 's3:PutObject', 'arn:aws:s3:::ecosystem-corpus/a.md'));
console.log('Delete? ' + isAllowed(policy, 's3:DeleteObject', 'arn:aws:s3:::ecosystem-corpus/a.md'));
console.log('Other?  ' + isAllowed(policy, 's3:GetObject', 'arn:aws:s3:::someone-else/x'));
console.log('Default is deny. Deny beats Allow, always.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What three fields does a basic IAM statement contain, and what is the default decision?'
          },
          {
            type: 'apply',
            prompt: 'A Lambda only reads one bucket. Write the Action and Resource values you would allow.'
          },
          {
            type: 'predict',
            prompt: 'A policy allows s3:asterisk on all resources and also denies s3:DeleteObject. Can the function delete an object? Explain.'
          }
        ],
        debugging: [
          {
            buggyCode: `// Intended: let this function write to ONE table. What it actually grants:
const policy = {
  Version: '2012-10-17',
  Statement: [
    { Effect: 'Allow', Action: 'dynamodb:*', Resource: '*' }
  ]
};
console.log('Actions granted: every DynamoDB action, on every table.');`,
            hints: [
              'What does dynamodb:asterisk cover?',
              'What does Resource asterisk cover?',
              'How would you scope this to one table and three actions?'
            ],
            solution: `const policy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
      Resource: 'arn:aws:dynamodb:ap-south-1:123456789012:table/LearningProgress'
    }
  ]
};
// Least privilege: three actions, one table, no wildcards.`
          }
        ],
        exercises: [
          {
            prompt: 'Write isAllowed(policy, action, resource). Walk the statements in order. A statement applies when any of its Actions matches the action AND any of its Resources matches the resource. Action, Resource and Effect: an Effect of Deny that applies returns false immediately. An Effect of Allow that applies sets the result to true but does not stop evaluation. Wildcards: "*" matches anything, and a pattern ending in "*" matches any value with that prefix. Return true only if some Allow applied and no Deny did.',
            tests: [
              `isAllowed({ Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'], Resource: 'arn:aws:s3:::b/*' }] }, 's3:GetObject', 'arn:aws:s3:::b/x') === true`,
              `isAllowed({ Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'], Resource: 'arn:aws:s3:::b/*' }] }, 's3:PutObject', 'arn:aws:s3:::b/x') === false`,
              `isAllowed({ Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'], Resource: 'arn:aws:s3:::b/*' }] }, 's3:GetObject', 'arn:aws:s3:::other/x') === false`,
              `isAllowed({ Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: '*' }, { Effect: 'Deny', Action: 's3:DeleteObject', Resource: '*' }] }, 's3:GetObject', 'anything') === true`,
              `isAllowed({ Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: '*' }, { Effect: 'Deny', Action: 's3:DeleteObject', Resource: '*' }] }, 's3:DeleteObject', 'anything') === false`,
              `isAllowed({ Statement: [] }, 's3:GetObject', 'arn:aws:s3:::b/x') === false`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'A policy allows an action and another statement denies it. What happens?',
              choices: ['The Allow wins', 'The Deny wins', 'The request errors out'],
              answer: 'The Deny wins'
            },
            {
              type: 'mcq',
              prompt: 'Which identity should a Lambda function use?',
              choices: ['An IAM user with access keys', 'An IAM role', 'The root account'],
              answer: 'An IAM role'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Policy statements: Effect, Action, Resource',
          'Explicit Deny precedence',
          'Wildcard matching',
          'Least privilege and roles over keys'
        ],
        mistakeWatchlist: ['Wildcard actions on wildcard resources']
      },
      nextLesson: 'security-secrets-encryption'
    },
    {
      id: 'security-secrets-encryption',
      title: 'Secrets, encryption and sensitive data',
      objectives: [
        'Distinguish encryption at rest from encryption in transit',
        'Redact sensitive fields before writing a log',
        'Explain why secrets belong in a secret store',
        'Respond correctly to a leaked credential'
      ],
      prerequisites: ['IAM Policies, Roles and Least Privilege'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'You learned in lesson 3 to keep config out of source. Secrets are the strict version of that, they shouldn\'t show up in source, logs or a client bundle. Ever.',
          'Leaks are rarely dramatic. Usually it\'s a log with an email, an error that includes a token, or a bucket left open. Not exotic attacks, just ordinary carelessness at scale.',
          'Encryption has two halves and you need both. At rest means the bytes on disk are unreadable without the key, so a stolen disk or snapshot is useless. In transit means the connection itself is encrypted, so no one on the network can read the request. Most platforms give you both by default now, you just shouldn\'t turn them off.',
          'For logging, picture a photocopier with a black marker. Before a document leaves the room you black out every sensitive field. You keep the shape of the record so it\'s still useful for debugging, but the values are gone.',
          'Passwords and keys should live in a secret store and get fetched at runtime by whatever identity is allowed to read them. That way they\'re never in your repo or container image, and you can rotate them without a code change.',
          'Get in the habit of classifying data before you store it, encrypting everything, logging ids instead of values, and scoping access so only the service that needs a secret can read it. And if a key does leak, rotate it immediately. Deleting the commit doesn\'t un-leak it.'
        ],
        demos: [
          {
            code: `// Redact before logging: keep the shape, remove the value.
function redact(record, fields) {
  const copy = {};
  for (const key in record) {
    if (fields.indexOf(key) !== -1) {
      copy[key] = '[REDACTED]';
    } else {
      copy[key] = record[key];
    }
  }
  return copy;
}

const event = {
  userId: 'u-1042',
  email: 'learner@example.com',
  cardNumber: '4111111111111111',
  lessonId: 'security-identity',
  percent: 80
};

const safe = redact(event, ['email', 'cardNumber']);
console.log('Safe to log: ' + JSON.stringify(safe));
console.log('Original untouched: ' + (event.email === 'learner@example.com'));

// What still must never be logged even after redaction: secrets.
const forbidden = ['password', 'apiKey', 'secretAccessKey', 'authorization'];
console.log('Always excluded from logs: ' + forbidden.join(', '));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What is the difference between encryption at rest and encryption in transit?'
          },
          {
            type: 'apply',
            prompt: 'A support engineer needs to debug a failed payment. Which fields would you redact before the log is written?'
          },
          {
            type: 'predict',
            prompt: 'A secret key is committed and pushed to a public repository once, then deleted. Is the key safe now? What must happen first?'
          }
        ],
        debugging: [
          {
            buggyCode: `// A log line that looks helpful and is a serious incident.
function logPayment(user, card, apiKey) {
  console.log('user ' + user.email + ' paid with card ' + card.number + ' using key ' + apiKey);
}
logPayment(
  { email: 'learner@example.com' },
  { number: '4111111111111111' },
  'sk-live-9f2b7c'
);`,
            hints: [
              'Which of those three values is personal data, and which is a secret?',
              'What can still be logged to make debugging possible?',
              'What must happen to the leaked key?'
            ],
            solution: `function logPayment(user, card, apiKey) {
  // Log identifiers and outcomes, never personal data or secrets.
  console.log(JSON.stringify({
    level: 'info',
    message: 'payment_succeeded',
    userId: user.id,
    cardLast4: card.last4,
    keyPresent: Boolean(apiKey)
  }));
}
logPayment(
  { id: 'u-1042' },
  { last4: '1111' },
  'sk-live-9f2b7c'
);
// If that key was ever written to logs or a repo, rotate it now.`
          }
        ],
        exercises: [
          {
            prompt: 'Write redact(record, fields) that returns a new object containing every key of record. Any key listed in fields has its value replaced with the string "[REDACTED]". The original record must not be modified.',
            tests: [
              `redact({ email: 'a@b.com', score: 1 }, ['email']).email === '[REDACTED]'`,
              `redact({ email: 'a@b.com', score: 1 }, ['email']).score === 1`,
              `redact({ email: 'a@b.com' }, ['email']).email !== 'a@b.com'`,
              `(function () { var o = { email: 'a@b.com' }; redact(o, ['email']); return o.email === 'a@b.com'; })() === true`,
              `JSON.stringify(redact({ a: 1 }, [])) === JSON.stringify({ a: 1 })`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Encryption in transit protects data:',
              choices: ['While stored on disk', 'While moving over the network', 'Only in backups'],
              answer: 'While moving over the network'
            },
            {
              type: 'mcq',
              prompt: 'A live key was pushed to a public repository. The first correct action is:',
              choices: ['Delete the commit', 'Rotate the key', 'Make the repository private'],
              answer: 'Rotate the key'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Encryption at rest vs in transit',
          'Redaction keeps shape, removes value',
          'Secrets in a secret store, fetched at runtime',
          'Rotate a leaked credential'
        ],
        mistakeWatchlist: ['Logging personal data or secrets', 'Deleting a commit instead of rotating']
      },
      nextLesson: 'security-vpc-network'
    },
    {
      id: 'security-vpc-network',
      title: 'VPCs, subnets and security groups',
      objectives: [
        'Explain public and private subnets in plain terms',
        'Read a security group rule set and decide if traffic is allowed',
        'Place an API and a database in a safe network layout',
        'State why deny-all is the correct default'
      ],
      prerequisites: ['Secrets, Encryption and Sensitive Data'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'In lesson 2 a request carried a port and a source address. Networking rules are that same idea enforced, which port, from where, to what.',
          'A database reachable from the internet is a countdown. Most cloud breaches start with something that should have been private but was left exposed. Network layout is how you make that exposure impossible, not just unlikely.',
          'A virtual private cloud is your own isolated network inside the provider. You split it into subnets. A public subnet can reach the internet and be reached from it. A private subnet can\'t be reached from the internet but can still reach out through a controlled gateway.',
          'Think office building. Public subnet is the lobby anyone can walk into. Private subnet is the secure floor that only staff with a badge can reach. A security group is the badge reader on each door, and you need it to be explicit.',
          'Security groups are allow-lists and they\'re stateful. You write rules like allow port 443 from anywhere or allow port 5432 only from the API security group. Anything you don\'t explicitly allow gets denied, and you can\'t even write a deny rule. That default is on purpose, it fails safe.',
          'The layout you want is pretty standard. Load balancer in public subnets, app in private subnets, database in private subnets reachable only from the app\'s security group, and no direct internet path to data at all. Then keep auditing those rules, an old wide-open rule you forgot about is the same as a hole.'
        ],
        demos: [
          {
            code: `// Security groups are allow-lists. No matching rule means denied.
function isAllowedBySg(rules, port, source) {
  for (const rule of rules) {
    if (rule.port !== port) continue;
    if (rule.source === source) return true;
    if (rule.source === '0.0.0.0/0') return true; // open to the world
  }
  return false;
}

const apiSg = [
  { port: 443, source: '0.0.0.0/0' },       // public HTTPS
  { port: 22,  source: '10.0.0.0/16' }      // SSH from inside the VPC only
];

const dbSg = [
  { port: 5432, source: 'sg-api' }          // database only from the API
];

console.log('Internet to API 443? ' + isAllowedBySg(apiSg, 443, '203.0.113.9'));
console.log('Internet to API 22?  ' + isAllowedBySg(apiSg, 22, '203.0.113.9'));
console.log('API to DB 5432?      ' + isAllowedBySg(dbSg, 5432, 'sg-api'));
console.log('Internet to DB 5432? ' + isAllowedBySg(dbSg, 5432, '203.0.113.9'));
console.log('Everything else: denied, because no rule matched.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What happens to traffic that no security group rule explicitly allows?'
          },
          {
            type: 'apply',
            prompt: 'You have a web API and a database. Which goes in a public subnet, and how does the database receive traffic?'
          },
          {
            type: 'predict',
            prompt: 'A rule allows port 5432 from 0.0.0.0/0 on the database security group. What is the practical consequence?'
          }
        ],
        debugging: [
          {
            buggyCode: `// "The database is in a private subnet, so it is safe."
const dbSecurityGroup = [
  { port: 5432, source: '0.0.0.0/0', note: 'added during debugging' }
];
console.log('Private subnet: true');
console.log('Reachable from anywhere on 5432: ' + true);`,
            hints: [
              'Does a private subnet override a security group rule?',
              'Where did that open rule come from, and was it removed?',
              'What source should be allowed on the database port?'
            ],
            solution: `// A private subnet does not cancel an open security group rule.
const dbSecurityGroup = [
  { port: 5432, source: 'sg-api', note: 'only the application may connect' }
];

// Checks worth running on every review:
// 1) Does any rule use 0.0.0.0/0 on a data port?
// 2) Is every rule still needed?
// 3) Does the database subnet have a route to the internet at all?
console.log('Open data ports: ' + dbSecurityGroup.filter(function (r) { return r.source === '0.0.0.0/0'; }).length);`
          }
        ],
        exercises: [
          {
            prompt: 'Write isAllowedBySg(rules, port, source). Each rule has a port and a source. The traffic is allowed when a rule has the same port and either the same source or the source "0.0.0.0/0". With no matching rule, return false.',
            tests: [
              `isAllowedBySg([{ port: 443, source: '0.0.0.0/0' }], 443, '1.2.3.4') === true`,
              `isAllowedBySg([{ port: 443, source: '0.0.0.0/0' }], 22, '1.2.3.4') === false`,
              `isAllowedBySg([], 443, '1.2.3.4') === false`,
              `isAllowedBySg([{ port: 5432, source: 'sg-api' }], 5432, 'sg-api') === true`,
              `isAllowedBySg([{ port: 5432, source: 'sg-api' }], 5432, '1.2.3.4') === false`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Security groups are best described as:',
              choices: ['Stateful allow-lists', 'Stateless deny-lists', 'A firewall with only deny rules'],
              answer: 'Stateful allow-lists'
            },
            {
              type: 'mcq',
              prompt: 'Which component should sit in a public subnet?',
              choices: ['The database', 'The load balancer', 'The backups'],
              answer: 'The load balancer'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'VPC, public and private subnets',
          'Security groups as allow-lists',
          'Fail-safe default deny',
          'Public entry, private data'
        ],
        mistakeWatchlist: ['Open 0.0.0.0/0 rules on data ports', 'Assuming a private subnet cancels an open rule']
      },
      nextLesson: 'compute-choices'
    }
  ]
};
