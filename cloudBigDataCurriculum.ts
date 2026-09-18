import { Course } from './types';

export const CLOUD_BIG_DATA_COURSE: Course = {
  id: 'cloud-big-data-engineering',
  title: 'Cloud & Big Data Engineering',
  description:
    'Go from cloud fundamentals to a deployed, data-driven AI system on AWS. Learn IAM, Lambda, DynamoDB, S3, Glue, Athena, Kinesis and Bedrock by building a real serverless learning-analytics pipeline.',
  level: 'Beginner to Advanced',
  totalDuration: '6 Weeks (Estimated)',
  outcomes: [
    'Explain AWS global infrastructure, regions and availability zones',
    'Apply least-privilege IAM policies to users, roles and services',
    'Build and deploy serverless APIs with Lambda, API Gateway and DynamoDB',
    'Design S3 data lakes and query them with Glue and Athena',
    'Stream and process high-volume events with Kinesis and Firehose',
    'Ground an AI tutor on your own documents using Bedrock and vector search'
  ],
  prerequisites: [
    'Basic JavaScript or Python syntax (variables, functions, loops)',
    'Comfort using a terminal and a code editor',
    'No prior AWS or cloud experience required'
  ],
  modules: [
    {
      id: 'cloud-module-1',
      title: 'Module 1: Cloud Foundations',
      lessons: [
        {
          id: 'aws-cloud-101',
          title: 'Cloud Computing & AWS Global Infrastructure',
          objectives: [
            'Define cloud computing in terms of on-demand, pay-as-you-go resources',
            'Distinguish regions, availability zones and edge locations',
            'Reason about latency, cost and resilience when choosing a region'
          ],
          prerequisites: [],
          timeEstimateMin: 25,
          content: {
            explanations: [
              'Cloud computing means renting computing resources on demand instead of buying servers. You pay only for what you use, and you can scale up or down in minutes.',
              'A Region is a physical cluster of data centres (for example us-east-1 in Virginia). Inside a Region there are multiple Availability Zones, which are isolated data centres with independent power and networking.',
              'Availability Zones let you survive a failure: if you spread your app across two AZs, one data centre going down does not take your app with it.',
              'Choosing a Region is a trade-off between latency (closer is faster), cost (prices differ per Region) and compliance (some data must stay in a country).',
              'Edge locations are the hundreds of worldwide points of presence used by CloudFront to cache content near users.'
            ],
            demos: [
              {
                code: "// Reasoning about placement before you build anything.\nconst workload = {\n  users: 'India',\n  latencyBudgetMs: 200,\n  dataResidency: 'India is acceptable',\n  mustSurviveOneDataCentreFailure: true\n};\n\n// Decision: pick a Region near the users, then deploy across >= 2 AZs.\nconst plan = {\n  region: 'ap-south-1',        // Mumbai: low latency for Indian users\n  availabilityZones: ['ap-south-1a', 'ap-south-1b'],\n  edgeCaching: 'CloudFront'\n};\n\nconsole.log(`Deploying to ${plan.region} across ${plan.availabilityZones.length} AZs`);",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'What is the difference between a Region and an Availability Zone?'
              },
              {
                type: 'apply',
                prompt: 'Your users are all in India and the app must survive one data centre failure. Which Region and how many AZs would you choose, and why?'
              },
              {
                type: 'predict',
                prompt: 'You pick us-east-1 for users in Chennai. What user-facing problem do you expect?'
              }
            ],
            debugging: [
              {
                buggyCode: "// A team deployed their app to ONE availability zone\nto save cost.\n// Every night around 2am a small percentage of users\nget errors.\n\nconst deployment = {\n  region: 'eu-west-1',\n  availabilityZones: ['eu-west-1a'],\n  users: 'London'\n};",
                hints: [
                  'How many failure domains does the app tolerate?',
                  'What happens when the single AZ has a maintenance event or hardware failure?',
                  'Does adding a second AZ change the design much?'
                ],
                solution: "const deployment = {\n  region: 'eu-west-1',\n  // Spread across multiple AZs so one data centre failure\n  // does not take the whole application offline.\n  availabilityZones: ['eu-west-1a', 'eu-west-1b'],\n  users: 'London'\n};"
              }
            ],
            exercises: [
              {
                prompt: 'Create an object called `placement` with a string field `region` and an array field `azs` containing at least two availability zones. Return true from the expression when both are present.',
                tests: [
                  "placement && typeof placement.region === 'string'",
                  "Array.isArray(placement.azs) && placement.azs.length >= 2",
                  "placement.azs.every(az => az.startsWith(placement.region))"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'output',
                  prompt: 'What does the following log?',
                  choices: ['2', 'ap-south-1', 'true'],
                  answer: '2'
                },
                {
                  type: 'mcq',
                  prompt: 'Which AWS construct gives physical isolation inside a Region?',
                  choices: ['Edge location', 'Availability Zone', 'IAM policy'],
                  answer: 'Availability Zone'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['Regions vs Availability Zones', 'Latency/cost/compliance trade-offs', 'Edge locations'],
            mistakeWatchlist: []
          },
          nextLesson: 'aws-iam-102'
        },
        {
          id: 'aws-iam-102',
          title: 'IAM: Identity, Policies & Least Privilege',
          objectives: [
            'Distinguish users, groups, roles and policies',
            'Read a JSON policy and identify Effect, Action, Resource and Condition',
            'Apply the principle of least privilege to a real service'
          ],
          prerequisites: ['Cloud Computing & AWS Global Infrastructure'],
          timeEstimateMin: 30,
          content: {
            explanations: [
              'IAM is AWS Identity and Access Management. It decides who can do what, on which resource, under which conditions.',
              'A user is a long-lived identity for a person or tool. A role is a temporary identity that something assumes (a Lambda function, an EC2 instance, a browser session).',
              'A policy is a JSON document. It has Effect (Allow/Deny), Action (the API calls), Resource (the ARN it applies to) and optional Condition.',
              'Least privilege means granting only the actions needed and listing specific resources instead of "*". This is the single most important security habit in AWS.',
              'Never put access keys in frontend code. A React app should call your API, and the backend should use a role — not embedded credentials.'
            ],
            demos: [
              {
                code: "// A least-privilege policy: read ONE bucket, nothing else.\nconst readCourseBucket = {\n  Version: '2012-10-17',\n  Statement: [\n    {\n      Effect: 'Allow',\n      Action: ['s3:GetObject', 's3:ListBucket'],\n      Resource: [\n        'arn:aws:s3:::ecosystem-learning-corpus',\n        'arn:aws:s3:::ecosystem-learning-corpus/*'\n      ]\n    }\n  ]\n};\n\n// The anti-pattern we avoid:\nconst overBroad = {\n  Effect: 'Allow',\n  Action: '*',\n  Resource: '*'\n};\n\nconsole.log('Granted actions:', readCourseBucket.Statement[0].Action.join(', '));",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'What four fields does an IAM policy statement normally contain?'
              },
              {
                type: 'apply',
                prompt: 'Your Lambda only needs to read one S3 bucket. Write the Action and Resource values you would put in the policy.'
              },
              {
                type: 'predict',
                prompt: 'You give a browser app an IAM user access key so it can call S3 directly. What could go wrong?'
              }
            ],
            debugging: [
              {
                buggyCode: "// This policy was meant to let a Lambda write to one table.\nconst policy = {\n  Version: '2012-10-17',\n  Statement: [\n    {\n      Effect: 'Allow',\n      Action: 'dynamodb:*',\n      Resource: '*'\n    }\n  ]\n};",
                hints: [
                  'Which actions does dynamodb:* cover?',
                  'Which resources does * cover?',
                  'How would you scope this to one table?'
                ],
                solution: "const policy = {\n  Version: '2012-10-17',\n  Statement: [\n    {\n      Effect: 'Allow',\n      Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:GetItem'],\n      Resource: 'arn:aws:dynamodb:ap-south-1:123456789012:table/LearningProgress'\n    }\n  ]\n};"
              }
            ],
            exercises: [
              {
                prompt: 'Build a `statement` object with Effect "Allow", an Action array containing "s3:GetObject", and a Resource that ends with "/*".',
                tests: [
                  "statement.Effect === 'Allow'",
                  "Array.isArray(statement.Action) && statement.Action.includes('s3:GetObject')",
                  "typeof statement.Resource === 'string' && statement.Resource.endsWith('/*')"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'Which identity is best for a Lambda function?',
                  choices: ['An IAM user with access keys', 'An IAM role', 'A root account'],
                  answer: 'An IAM role'
                },
                {
                  type: 'mcq',
                  prompt: 'Which policy follows least privilege?',
                  choices: ['Action: "*", Resource: "*"', 'Action: ["s3:GetObject"], Resource: "arn:aws:s3:::bucket/*"', 'Action: "dynamodb:*", Resource: "*"'],
                  answer: 'Action: ["s3:GetObject"], Resource: "arn:aws:s3:::bucket/*"'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['IAM users vs roles', 'Policy structure', 'Least privilege'],
            mistakeWatchlist: ['Using wildcard resources']
          },
          nextLesson: 'aws-lambda-201'
        }
      ]
    },
    {
      id: 'cloud-module-2',
      title: 'Module 2: Serverless Engineering',
      lessons: [
        {
          id: 'aws-lambda-201',
          title: 'AWS Lambda Fundamentals',
          objectives: [
            'Explain the Lambda execution model and the handler signature',
            'Understand cold starts, timeouts and memory-based pricing',
            'Package and configure environment variables safely'
          ],
          prerequisites: ['IAM: Identity, Policies & Least Privilege'],
          timeEstimateMin: 35,
          content: {
            explanations: [
              'Lambda runs your function in response to an event. There is no server to manage and nothing to pay for while it is idle.',
              'The handler receives an `event` (the input) and a `context` (runtime metadata). Whatever it returns becomes the response.',
              'Cold start: the first invocation after a period of inactivity must initialise the runtime. Keep dependencies small and reuse clients outside the handler to reduce it.',
              'You are billed by number of requests and by GB-seconds (memory x time). More memory also means more CPU, so a bigger memory setting can sometimes be cheaper overall.',
              'The execution role decides what the function can touch. That is exactly the least-privilege policy from the previous lesson.'
            ],
            demos: [
              {
                code: "// handler.mjs — a minimal Lambda handler\nimport { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';\n\n// Create the client OUTSIDE the handler so it is reused\n// across warm invocations (fewer cold starts).\nconst s3 = new S3Client({});\n\nconst BUCKET = process.env.CORPUS_BUCKET;\n\nexport const handler = async (event) => {\n  const key = event?.queryStringParameters?.key ?? 'welcome.md';\n\n  const result = await s3.send(\n    new GetObjectCommand({ Bucket: BUCKET, Key: key })\n  );\n\n  return {\n    statusCode: 200,\n    headers: { 'content-type': 'text/markdown' },\n    body: await result.Body.transformToString()\n  };\n};",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'What are the two arguments a Lambda handler receives?'
              },
              {
                type: 'apply',
                prompt: 'Why should the S3 client be created outside the handler function?'
              },
              {
                type: 'predict',
                prompt: 'A function with 128 MB times out under load. What are three things you would check or change?'
              }
            ],
            debugging: [
              {
                buggyCode: "// This handler works locally but returns 500 on AWS.\nexport const handler = async (event) => {\n  const bucket = 'my-corpus'; // hardcoded\n  const client = new S3Client({\n    credentials: {\n      accessKeyId: 'AKIA...',\n      secretAccessKey: 'hardcoded-secret'\n    }\n  });\n\n  // ...\n};",
                hints: [
                  'Where should secrets live?',
                  'What does Lambda already provide for credentials?',
                  'What should the bucket name be replaced with?'
                ],
                solution: "const client = new S3Client({}); // uses the Lambda execution role\nconst bucket = process.env.CORPUS_BUCKET; // configured per environment"
              }
            ],
            exercises: [
              {
                prompt: 'Write a function `ok(body)` that returns a Lambda-style response with statusCode 200, a content-type header of application/json, and the given body stringified.',
                tests: [
                  "ok('x').statusCode === 200",
                  "ok('x').headers['content-type'] === 'application/json'",
                  "ok('x').body === JSON.stringify('x')"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'What is a cold start?',
                  choices: ['A crash on first request', 'Runtime initialisation after inactivity', 'A timeout'],
                  answer: 'Runtime initialisation after inactivity'
                },
                {
                  type: 'mcq',
                  prompt: 'How does Lambda get AWS credentials?',
                  choices: ['From the execution role', 'From hardcoded keys', 'From the browser'],
                  answer: 'From the execution role'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['Lambda handler model', 'Cold starts', 'Reusing clients', 'Execution roles'],
            mistakeWatchlist: ['Hardcoding credentials']
          },
          nextLesson: 'aws-api-dynamodb-202'
        },
        {
          id: 'aws-api-dynamodb-202',
          title: 'API Gateway & DynamoDB',
          objectives: [
            'Expose a Lambda function through API Gateway with routes',
            'Model data for DynamoDB with partition and sort keys',
            'Read and write items with the AWS SDK'
          ],
          prerequisites: ['AWS Lambda Fundamentals'],
          timeEstimateMin: 40,
          content: {
            explanations: [
              'API Gateway is the front door. It maps HTTP methods and paths (routes) to your Lambda function and handles throttling, CORS and authorisation.',
              'DynamoDB is a serverless key-value and document database. You design from your access pattern, not from normalised tables.',
              'Every item needs a partition key. An optional sort key lets you store many related items under one partition and query them with a range.',
              'Use `GetItem` for one exact item and `Query` for a partition. Avoid `Scan` in production: it reads the whole table.',
              'The frontend should only ever call API Gateway. Database access happens inside Lambda with its role.'
            ],
            demos: [
              {
                code: "// Save and read a learner's progress.\nimport { DynamoDBClient } from '@aws-sdk/client-dynamodb';\nimport { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';\n\nconst ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));\nconst TABLE = process.env.PROGRESS_TABLE;\n\n// Access pattern: \"all lessons for one user\"\n// PK = USER#<uid>   SK = LESSON#<lessonId>\nexport async function saveProgress(userId, lessonId, percent) {\n  await ddb.send(new PutCommand({\n    TableName: TABLE,\n    Item: {\n      pk: `USER#${userId}`,\n      sk: `LESSON#${lessonId}`,\n      percent,\n      updatedAt: new Date().toISOString()\n    }\n  }));\n}\n\nexport async function listProgress(userId) {\n  const { Items } = await ddb.send(new QueryCommand({\n    TableName: TABLE,\n    KeyConditionExpression: 'pk = :pk',\n    ExpressionAttributeValues: { ':pk': `USER#${userId}` }\n  }));\n  return Items ?? [];\n}",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'Which two key types can a DynamoDB table have?'
              },
              {
                type: 'apply',
                prompt: 'Your app needs "all progress for one user". What would you choose as partition key and sort key?'
              },
              {
                type: 'predict',
                prompt: 'Why is a full-table Scan a problem as your learner data grows?'
              }
            ],
            debugging: [
              {
                buggyCode: "// The query never returns items, even though data exists.\nconst params = {\n  TableName: TABLE,\n  KeyConditionExpression: 'pk = :pk',\n  ExpressionAttributeValues: {\n    ':pk': 'USER#42'\n  }\n};\n// Stored item was:\n// { pk: 'user#42', sk: 'LESSON#1' }",
                hints: [
                  'DynamoDB keys are case-sensitive.',
                  'Compare the stored pk with the queried value.',
                  'Fix the casing so they match.'
                ],
                solution: "// Stored: { pk: 'user#42' }\n// Query must use the SAME value:\nExpressionAttributeValues: { ':pk': 'user#42' }"
              }
            ],
            exercises: [
              {
                prompt: 'Write `item(userId, lessonId)` returning a DynamoDB item with pk, sk and percent fields. pk must start with "USER#", sk with "LESSON#", percent must be 0.',
                tests: [
                  "item('1','a').pk === 'USER#1'",
                  "item('1','a').sk === 'LESSON#a'",
                  "item('1','a').percent === 0"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'Which operation should you prefer for a known partition?',
                  choices: ['Scan', 'Query', 'PutItem'],
                  answer: 'Query'
                },
                {
                  type: 'mcq',
                  prompt: 'Who should call DynamoDB directly?',
                  choices: ['The React frontend', 'The Lambda execution role', 'The user browser'],
                  answer: 'The Lambda execution role'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['API Gateway routing', 'DynamoDB key design', 'Query vs Scan'],
            mistakeWatchlist: ['Using Scan by default', 'Case-mismatched keys']
          },
          nextLesson: 'aws-s3-datalake-301'
        }
      ]
    },
    {
      id: 'cloud-module-3',
      title: 'Module 3: Data Engineering on AWS',
      lessons: [
        {
          id: 'aws-s3-datalake-301',
          title: 'S3 & Data Lakes',
          objectives: [
            'Explain buckets, keys, prefixes and storage classes',
            'Design a partitioned prefix layout for a data lake',
            'Apply lifecycle policies to control cost'
          ],
          prerequisites: ['API Gateway & DynamoDB'],
          timeEstimateMin: 30,
          content: {
            explanations: [
              'S3 stores objects in buckets. An object is identified by its key, and slashes in a key create a prefix that looks like a folder.',
              'A data lake is simply a large amount of raw and processed data stored in object storage, in open formats, ready to be queried later.',
              'Partitioning by date (for example year=2026/month=09/day=18/) lets query engines read only the files they need instead of scanning everything.',
              'Storage classes trade retrieval speed for price: Standard for hot data, Infrequent Access for occasional reads, Glacier for archives.',
              'Lifecycle rules move objects between classes automatically, which is how you keep a growing lake affordable.'
            ],
            demos: [
              {
                code: "// A partitioned prefix layout for learner events.\nconst event = {\n  userId: 'u-1042',\n  lessonId: 'aws-lambda-201',\n  eventType: 'lesson_completed',\n  timestamp: new Date('2026-09-18T10:15:00Z')\n};\n\nfunction keyFor(e) {\n  const d = e.timestamp;\n  const y = d.getUTCFullYear();\n  const m = String(d.getUTCMonth() + 1).padStart(2, '0');\n  const day = String(d.getUTCDate()).padStart(2, '0');\n  return `events/year=${y}/month=${m}/day=${day}/${e.userId}-${e.eventType}.json`;\n}\n\nconsole.log(keyFor(event));\n// events/year=2026/month=09/day=18/u-1042-lesson_completed.json",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'What is an S3 prefix, and why does it matter for query cost?'
              },
              {
                type: 'apply',
                prompt: 'Design a prefix layout for daily learner events that a query engine can filter by date.'
              },
              {
                type: 'predict',
                prompt: 'All your files live directly under the bucket root with no prefixes. What happens to Athena query cost?'
              }
            ],
            debugging: [
              {
                buggyCode: "// Every event overwrites the previous one.\nconst s3Key = `events/latest.json`;\n\n// 5,000 learners send events every day.",
                hints: [
                  'How many objects exist after a day?',
                  'What other events does each write destroy?',
                  'How would partitioning prevent the overwrite?'
                ],
                solution: "// Give every event its own immutable key, partitioned by date.\nconst s3Key = `events/year=2026/month=09/day=18/${userId}-${eventId}.json`;"
              }
            ],
            exercises: [
              {
                prompt: 'Write `prefix(date)` returning an S3 prefix partitioned by year and month, e.g. "events/year=2026/month=09/". Use UTC.',
                tests: [
                  "prefix(new Date('2026-09-18T00:00:00Z')) === 'events/year=2026/month=09/'",
                  "prefix(new Date('2027-01-02T00:00:00Z')) === 'events/year=2027/month=01/'"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'Why partition a data lake by date?',
                  choices: ['It looks tidy', 'Queries can skip unrelated files', 'It compresses data'],
                  answer: 'Queries can skip unrelated files'
                },
                {
                  type: 'mcq',
                  prompt: 'Which storage class suits data read a few times a year?',
                  choices: ['S3 Standard', 'S3 Infrequent Access', 'S3 Glacier'],
                  answer: 'S3 Infrequent Access'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['S3 keys and prefixes', 'Data lake partitioning', 'Storage classes'],
            mistakeWatchlist: ['Overwriting objects with a static key']
          },
          nextLesson: 'aws-glue-athena-302'
        },
        {
          id: 'aws-glue-athena-302',
          title: 'ETL with Glue & Querying with Athena',
          objectives: [
            'Describe the roles of the Glue Data Catalog, crawlers and jobs',
            'Query S3 data with Athena using standard SQL',
            'Estimate cost from data scanned'
          ],
          prerequisites: ['S3 & Data Lakes'],
          timeEstimateMin: 35,
          content: {
            explanations: [
              'Glue is the ETL service. A crawler inspects data in S3 and registers its schema in the Glue Data Catalog as a table.',
              'Athena is serverless SQL over S3. It uses the Data Catalog to know the schema, then reads the files directly. There is no database server.',
              'Athena bills by data scanned, so partitioning and columnar formats such as Parquet reduce cost dramatically.',
              'A Glue job transforms raw data (JSON, CSV) into clean Parquet, which is smaller and much faster to query.',
              'This is the heart of big data engineering: raw zone, clean zone, then SQL for analytics.'
            ],
            demos: [
              {
                code: "// Query: completion count per lesson for a given month.\nconst athenaSQL = `\n  SELECT lessonId, COUNT(*) AS completions\n  FROM   learner_events\n  WHERE  year = '2026' AND month = '09'\n  GROUP  BY lessonId\n  ORDER  BY completions DESC\n  LIMIT  10\n`;\n\n// Cost intuition: Athena charges per TB scanned.\nconst scannedTB = 0.4;          // only the September partition\nconst pricePerTB = 5.0;         // us-east-1 list price\nconsole.log(`Estimated scan cost: $${(scannedTB * pricePerTB).toFixed(2)}`);",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'What does a Glue crawler produce?'
              },
              {
                type: 'apply',
                prompt: 'Write the WHERE clause that limits an Athena query to September 2026 using partition columns.'
              },
              {
                type: 'predict',
                prompt: 'You convert raw JSON to Parquet. What happens to Athena cost and speed?'
              }
            ],
            debugging: [
              {
                buggyCode: "// Athena query returns zero rows although S3 has data.\nconst sql = `\n  SELECT * FROM learner_events\n  WHERE date = '2026-09-18'\n`;\n// The crawled partition columns are: year, month, day",
                hints: [
                  'Which columns actually exist in the catalog?',
                  'Hive-style partitioning stores date parts separately.',
                  'Rewrite the filter using the real partition columns.'
                ],
                solution: "const sql = `\n  SELECT * FROM learner_events\n  WHERE year = '2026' AND month = '09' AND day = '18'\n`;"
              }
            ],
            exercises: [
              {
                prompt: 'Write `monthFilter(year, month)` that returns a SQL WHERE fragment filtering the year and month partition columns, single-quoted, joined by " AND ".',
                tests: [
                  "monthFilter(2026, 9) === \"year = '2026' AND month = '9'\"",
                  "monthFilter(2027, 12).includes(\"year = '2027'\")"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'What does Athena charge for?',
                  choices: ['Servers per hour', 'Data scanned', 'Number of tables'],
                  answer: 'Data scanned'
                },
                {
                  type: 'mcq',
                  prompt: 'Which format is cheapest to query at scale?',
                  choices: ['CSV', 'JSON', 'Parquet'],
                  answer: 'Parquet'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['Glue crawlers and catalog', 'Athena SQL on S3', 'Columnar formats'],
            mistakeWatchlist: ['Filtering on non-partition columns']
          },
          nextLesson: 'aws-kinesis-firehose-401'
        }
      ]
    },
    {
      id: 'cloud-module-4',
      title: 'Module 4: Streaming Big Data',
      lessons: [
        {
          id: 'aws-kinesis-firehose-401',
          title: 'Streaming with Kinesis & Firehose',
          objectives: [
            'Explain the difference between streams and delivery streams',
            'Choose a partition key that spreads load evenly',
            'Land streaming data into S3 for later analytics'
          ],
          prerequisites: ['ETL with Glue & Querying with Athena'],
          timeEstimateMin: 30,
          content: {
            explanations: [
              'Kinesis Data Streams ingests events in real time and lets several consumers read them. You control retention and consumers.',
              'Kinesis Data Firehose is a managed delivery stream: it buffers, optionally transforms, and writes to S3, Redshift or OpenSearch with no code to maintain.',
              'A partition key decides which shard an event lands on. A poor key (like a constant) creates a hot shard and throttling.',
              'Buffering is a trade-off: longer buffers mean fewer, larger S3 files, which are cheaper to query but arrive later.',
              'Streaming plus a data lake is the standard pipeline for high-volume learner or application telemetry.'
            ],
            demos: [
              {
                code: "// Pick a partition key that spreads writes.\nfunction partitionKey(event) {\n  // Good: many distinct users -> even spread across shards\n  return event.userId;\n  // Bad: 'global' would push every event to one shard\n}\n\n// Firehose config intuition\nconst firehose = {\n  deliveryStream: 'learner-events-to-s3',\n  source: 'KinesisStream',\n  destination: 's3://ecosystem-data-lake/events/',\n  bufferSizeMB: 5,\n  bufferIntervalSec: 60,\n  transform: 'JSON -> Parquet'\n};\n\nconsole.log(`Buffering ${firehose.bufferSizeMB}MB / ${firehose.bufferIntervalSec}s before flush`);",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'What is the difference between Kinesis Data Streams and Firehose?'
              },
              {
                type: 'apply',
                prompt: 'Which field would you use as a partition key for learner events, and why?'
              },
              {
                type: 'predict',
                prompt: 'You set the partition key to the constant "all". What happens to throughput?'
              }
            ],
            debugging: [
              {
                buggyCode: "// Firehose writes thousands of tiny 2 KB objects\nto S3 every second.\nconst config = {\n  bufferSizeMB: 1,\n  bufferIntervalSec: 1\n};",
                hints: [
                  'How many objects per day at this rate?',
                  'What does the "small files problem" do to Athena?',
                  'Increase the buffer to batch more data per object.'
                ],
                solution: "const config = {\n  bufferSizeMB: 5,      // larger objects\n  bufferIntervalSec: 60  // fewer, bigger files\n};"
              }
            ],
            exercises: [
              {
                prompt: 'Write `pk(event)` returning a well-distributed partition key string for a learner event.',
                tests: [
                  "typeof pk({ userId: 'u1' }) === 'string'",
                  "pk({ userId: 'u1' }) !== pk({ userId: 'u2' })"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'Which service delivers streams to S3 without custom code?',
                  choices: ['Kinesis Data Streams', 'Kinesis Firehose', 'Athena'],
                  answer: 'Kinesis Firehose'
                },
                {
                  type: 'mcq',
                  prompt: 'A constant partition key causes:',
                  choices: ['Even spread', 'A hot shard', 'Lower storage cost'],
                  answer: 'A hot shard'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['Streams vs Firehose', 'Partition keys', 'Buffering trade-offs'],
            mistakeWatchlist: ['Constant partition keys', 'Tiny S3 objects']
          },
          nextLesson: 'aws-analytics-observability-402'
        },
        {
          id: 'aws-analytics-observability-402',
          title: 'Analytics Dashboards & Observability',
          objectives: [
            'Expose analytics through an API your app can read',
            'Instrument services with CloudWatch metrics and logs',
            'Set an alarm that actually signals a problem'
          ],
          prerequisites: ['Streaming with Kinesis & Firehose'],
          timeEstimateMin: 30,
          content: {
            explanations: [
              'Analytics only matter when they reach a decision. Usually that means an API endpoint that the dashboard calls and a small cached table instead of live scans.',
              'CloudWatch collects logs, metrics and traces. Structured JSON logs are searchable; plain strings are not.',
              'A useful alarm has a threshold tied to user experience, for example Lambda error rate above 1% for 5 minutes.',
              'Dashboards and alarms are part of the architecture, not an afterthought. They are also your evidence when demonstrating the system.',
              'Never log secrets, tokens or personal data. Log identifiers and outcomes instead.'
            ],
            demos: [
              {
                code: "// Structured logging in Lambda.\nfunction logEvent(level, message, meta = {}) {\n  console.log(JSON.stringify({\n    level,\n    message,\n    ...meta,\n    ts: new Date().toISOString()\n  }));\n}\n\nlogEvent('info', 'progress_saved', { userId: 'u-1042', lessonId: 'aws-lambda-201' });\n// {\"level\":\"info\",\"message\":\"progress_saved\",\"userId\":\"u-1042\",...}\n\n// A user-facing alarm definition\nconst alarm = {\n  name: 'TutorApiHighErrors',\n  metric: 'Errors',\n  threshold: 1,          // percent\n  evaluationPeriods: 5,\n  action: 'notify team'\n};",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'What are the three main things CloudWatch stores?'
              },
              {
                type: 'apply',
                prompt: 'Write a structured log line for a failed tutor request without leaking the prompt text or credentials.'
              },
              {
                type: 'predict',
                prompt: 'Your dashboard queries Athena live on every page load. What problems appear as usage grows?'
              }
            ],
            debugging: [
              {
                buggyCode: "// Logging inside a payment-adjacent service\nconsole.log(\n  `user ${email} paid with card ${cardNumber} using key ${apiKey}`\n);",
                hints: [
                  'Which of those fields is personal or secret?',
                  'What is safe to log for debugging?',
                  'Replace identifiers instead of values.'
                ],
                solution: "console.log(JSON.stringify({\n  level: 'info',\n  message: 'payment_succeeded',\n  userId: 'u-1042',\n  paymentId: 'pay_8837'\n}));"
              }
            ],
            exercises: [
              {
                prompt: 'Write `logLine(level, message)` returning a JSON string containing level, message and a ts field.',
                tests: [
                  "JSON.parse(logLine('info','x')).level === 'info'",
                  "JSON.parse(logLine('info','x')).message === 'x'",
                  "typeof JSON.parse(logLine('info','x')).ts === 'string'"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'Which log format is easiest to search and alert on?',
                  choices: ['Free text', 'Structured JSON', 'CSV'],
                  answer: 'Structured JSON'
                },
                {
                  type: 'mcq',
                  prompt: 'What must never appear in logs?',
                  choices: ['User IDs', 'Secrets and card numbers', 'Status codes'],
                  answer: 'Secrets and card numbers'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['Structured logging', 'CloudWatch metrics and alarms', 'Serving analytics via API'],
            mistakeWatchlist: ['Logging secrets or personal data']
          },
          nextLesson: 'aws-bedrock-501'
        }
      ]
    },
    {
      id: 'cloud-module-5',
      title: 'Module 5: AI Data Systems',
      lessons: [
        {
          id: 'aws-bedrock-501',
          title: 'Amazon Bedrock: Managed Foundation Models',
          objectives: [
            'Call a foundation model through the Bedrock runtime API',
            'Structure prompts for a tutoring use case',
            'Control cost and latency with model and token choices'
          ],
          prerequisites: ['Analytics Dashboards & Observability'],
          timeEstimateMin: 35,
          content: {
            explanations: [
              'Amazon Bedrock gives you foundation models through one API, with no servers to run and no model weights to manage.',
              'You call Converse (or InvokeModel) with a model id, a system instruction and a list of messages. The response contains the model output.',
              'A system instruction sets behaviour, for example "you are a patient cloud tutor, answer the learner first, then offer depth".',
              'Cost scales with tokens in and tokens out. Short system prompts and trimmed context keep both latency and cost down.',
              'Keep the model id in configuration, not hardcoded, so you can switch to a cheaper or newer model without a redeploy of the frontend.'
            ],
            demos: [
              {
                code: "// Ask Bedrock from inside Lambda.\nimport { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';\n\nconst bedrock = new BedrockRuntimeClient({});\nconst MODEL_ID = process.env.BEDROCK_MODEL_ID;\n\nconst SYSTEM = 'You are a concise cloud engineering tutor. ' +\n  'Answer the learner question first, then give one small AWS example.';\n\nexport async function askTutor(question) {\n  const res = await bedrock.send(new ConverseCommand({\n    modelId: MODEL_ID,\n    system: [{ text: SYSTEM }],\n    messages: [\n      { role: 'user', content: [{ text: question }] }\n    ],\n    inferenceConfig: { maxTokens: 400, temperature: 0.3 }\n  }));\n\n  return res.output.message.content[0].text;\n}",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'Which API operation sends a chat-style request to a Bedrock model?'
              },
              {
                type: 'apply',
                prompt: 'Write a short system instruction for a tutor that must answer the learner before expanding.'
              },
              {
                type: 'predict',
                prompt: 'You set maxTokens very high and temperature to 1.5. What do you expect in cost and reliability?'
              }
            ],
            debugging: [
              {
                buggyCode: "// Works in the Bedrock playground, fails from Lambda.\nconst bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });\nawait bedrock.send(new ConverseCommand({\n  modelId: 'some-model-i-remember',\n  messages: []\n}));",
                hints: [
                  'Is that exact model id valid in your Region?',
                  'Does the Lambda role have bedrock:InvokeModel?',
                  'Are messages empty?'
                ],
                solution: "// 1) Enable the exact model in Bedrock and read its model id\n// 2) Grant the role bedrock:InvokeModel on that model\nconst modelId = process.env.BEDROCK_MODEL_ID;\nmessages: [{ role: 'user', content: [{ text: question }] }]"
              }
            ],
            exercises: [
              {
                prompt: 'Write `converseBody(question, modelId)` returning an object with modelId and a messages array containing one user message with the question text.',
                tests: [
                  "converseBody('hi','m').modelId === 'm'",
                  "converseBody('hi','m').messages[0].role === 'user'",
                  "converseBody('hi','m').messages[0].content[0].text === 'hi'"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'What does Bedrock bill on?',
                  choices: ['Servers per hour', 'Tokens in and out', 'Storage per GB'],
                  answer: 'Tokens in and out'
                },
                {
                  type: 'mcq',
                  prompt: 'Where should the model id live?',
                  choices: ['Hardcoded in React', 'In configuration/env', 'In the CSS'],
                  answer: 'In configuration/env'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['Bedrock Converse API', 'System instructions', 'Token-based cost control'],
            mistakeWatchlist: ['Hardcoded model ids', 'Over-long prompts']
          },
          nextLesson: 'aws-rag-502'
        },
        {
          id: 'aws-rag-502',
          title: 'RAG, Embeddings & Vector Search',
          objectives: [
            'Explain retrieval-augmented generation and why it reduces hallucination',
            'Describe embeddings and semantic similarity',
            'Design a citation-backed answer flow'
          ],
          prerequisites: ['Amazon Bedrock: Managed Foundation Models'],
          timeEstimateMin: 40,
          content: {
            explanations: [
              'A foundation model only knows what it was trained on. RAG fixes this by retrieving relevant passages from your own corpus and putting them in the prompt.',
              'An embedding model turns text into a vector. Similar meanings produce vectors that are close together, which enables search by meaning rather than keywords.',
              'The pipeline is: chunk documents, embed them, store vectors, embed the question, retrieve the nearest chunks, then ask the model to answer using only those chunks.',
              'Citations matter. Ask the model to reference the source of each claim so the learner can verify it.',
              "This is the pattern behind a trustworthy tutor: answers grounded in official documentation, not in the model's memory."
            ],
            demos: [
              {
                code: "// Retrieval-augmented answer flow (pseudo-code).\nasync function groundedAnswer(question) {\n  // 1. Turn the question into a vector\n  const qVector = await embed(question);\n\n  // 2. Find the closest chunks in the vector store\n  const chunks = await vectorStore.search(qVector, { topK: 4 });\n\n  // 3. Build a grounded prompt with citations\n  const context = chunks\n    .map((c, i) => `[source ${i + 1}] ${c.text}`)\n    .join('\\n---\\n');\n\n  const prompt =\n    `Answer using ONLY the sources below. ` +\n    `Cite each claim as [source n]. If the answer is absent, say so.\\n\\n` +\n    `SOURCES:\\n${context}\\n\\nQUESTION: ${question}`;\n\n  return askTutor(prompt);\n}",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'What does RAG add to a plain language-model call?'
              },
              {
                type: 'apply',
                prompt: 'Describe the five steps from a user question to a citation-backed answer.'
              },
              {
                type: 'predict',
                prompt: 'You forget to chunk documents and embed whole books. What goes wrong with retrieval and cost?'
              }
            ],
            debugging: [
              {
                buggyCode: "// The tutor invents AWS facts and cites nothing.\nconst prompt = `Answer this question: ${question}`;\nconst answer = await askTutor(prompt);",
                hints: [
                  'Does the model have any source material?',
                  'How do you constrain it to your corpus?',
                  'Add retrieved context and a citation instruction.'
                ],
                solution: "const prompt =\n  `Answer using ONLY the sources below and cite them as [source n].\\n\\n` +\n  `SOURCES:\\n${contextFromVectorStore}\\n\\nQUESTION: ${question}`;"
              }
            ],
            exercises: [
              {
                prompt: 'Write `citation(index, snippet)` returning a short source label string that includes the 1-based index and the snippet.',
                tests: [
                  "citation(1,'Lambda docs').includes('1')",
                  "citation(1,'Lambda docs').includes('Lambda docs')"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'What is an embedding?',
                  choices: ['A compressed file', 'A numeric vector representing meaning', 'A database index'],
                  answer: 'A numeric vector representing meaning'
                },
                {
                  type: 'mcq',
                  prompt: 'Why request citations?',
                  choices: ['Longer answers', 'Verifiable, grounded answers', 'Lower cost'],
                  answer: 'Verifiable, grounded answers'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['RAG pipeline', 'Embeddings and vector search', 'Citation-grounded answers'],
            mistakeWatchlist: ['Answering without retrieved context']
          },
          nextLesson: 'aws-capstone-601'
        }
      ]
    },
    {
      id: 'cloud-module-6',
      title: 'Module 6: Capstone',
      lessons: [
        {
          id: 'aws-capstone-601',
          title: 'Capstone: Ship a Serverless Learning Analytics Pipeline',
          objectives: [
            'Combine IAM, Lambda, API Gateway, DynamoDB, S3, Firehose, Glue/Athena and Bedrock',
            'Deploy the stack with infrastructure as code',
            'Prove the system with logs, a URL and a recorded demo'
          ],
          prerequisites: ['RAG, Embeddings & Vector Search'],
          timeEstimateMin: 60,
          content: {
            explanations: [
              'The capstone ties every module together into one deployable system: events flow from the app, land in S3, are queryable in Athena, and the tutor answers questions grounded in that data.',
              'Define the whole stack in a SAM template so the environment is reproducible. Infrastructure as code is part of the engineering, not an extra.',
              'Order of work matters: get a deployed URL first, then one working feature end to end, then add data and intelligence.',
              'Evidence is the deliverable: a live URL, CloudWatch logs, an Athena result, and a short recorded walkthrough that shows where AWS fits.',
              'Document what you learned. The learning is scored, and a clear write-up is also what lets someone else run your stack.'
            ],
            demos: [
              {
                code: "// End-to-end flow the capstone must demonstrate.\nconst pipeline = [\n  'React app calls API Gateway',\n  'Lambda writes progress to DynamoDB',\n  'Lambda emits event to Kinesis Firehose',\n  'Firehose buffers into S3 (Parquet)',\n  'Glue catalog + Athena query the lake',\n  'Bedrock answers using retrieved chunks',\n  'CloudWatch shows logs and alarms'\n];\n\npipeline.forEach((step, i) => console.log(`${i + 1}. ${step}`));",
                explainByLine: true
              }
            ],
            oralQuestions: [
              {
                type: 'recall',
                prompt: 'List five AWS services in your pipeline and what each one does.'
              },
              {
                type: 'apply',
                prompt: 'Your Lambda cannot write to S3. What is the first thing you check, and why?'
              },
              {
                type: 'predict',
                prompt: 'You deploy everything at once and nothing works. What smaller first milestone would have de-risked this?'
              }
            ],
            debugging: [
              {
                buggyCode: "// The frontend calls AWS directly with embedded keys.\nconst s3 = new AWS.S3({\n  accessKeyId: import.meta.env.VITE_AWS_KEY,\n  secretAccessKey: import.meta.env.VITE_AWS_SECRET\n});\nawait s3.putObject({ Bucket: 'data-lake', Key: 'events/1.json' });",
                hints: [
                  'Where are those keys visible?',
                  'What is the correct request path?',
                  'Route through API Gateway and use a Lambda role.'
                ],
                solution: "// Browser -> API Gateway -> Lambda (with an execution role) -> S3\nawait fetch(`${API_BASE}/events`, {\n  method: 'POST',\n  headers: { 'content-type': 'application/json' },\n  body: JSON.stringify(event)\n});"
              }
            ],
            exercises: [
              {
                prompt: 'Write `checklist()` returning an array of at least four strings naming AWS services used in the capstone.',
                tests: [
                  "Array.isArray(checklist()) && checklist().length >= 4",
                  "checklist().some(s => s.toLowerCase().includes('lambda'))"
                ]
              }
            ],
            assessment: {
              questions: [
                {
                  type: 'mcq',
                  prompt: 'What is the first milestone when shipping the capstone?',
                  choices: ['A perfect data model', 'A deployed URL with one working feature', 'Full analytics'],
                  answer: 'A deployed URL with one working feature'
                },
                {
                  type: 'mcq',
                  prompt: 'Where should AWS credentials live in the final architecture?',
                  choices: ['In the React bundle', 'Only in IAM roles', 'In the browser localStorage'],
                  answer: 'Only in IAM roles'
                }
              ],
              passCriteria: { minCorrect: 1 }
            }
          },
          memoryUpdates: {
            conceptsMastered: ['End-to-end serverless architecture', 'Infrastructure as code', 'Evidence-driven delivery'],
            mistakeWatchlist: ['Exposing credentials to the client', 'Big-bang deployment']
          },
          nextLesson: null
        }
      ]
    }
  ]
};
