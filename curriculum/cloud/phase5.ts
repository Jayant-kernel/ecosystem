import { Module } from '../../types';

/**
 * Phase 5 — Data Lakes and Batch Analytics (Lessons 23-28).
 * Playbook R2: Lesson 25 opens with an explicit SQL bridge from Lesson 4.
 */
export const PHASE_5_MODULE: Module = {
  id: 'cloud-phase-5',
  title: 'Module 6: Data Lakes and Analytics',
  lessons: [
    {
      id: 'data-formats-schema',
      title: 'CSV, JSON, Parquet, Avro and schema',
      objectives: [
        'Explain row-oriented versus columnar storage',
        'Estimate query cost from the format and the columns selected',
        'Explain why schema matters for analytics'
      ],
      prerequisites: ['Batch versus Streaming'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Back in lesson 4 you described tables and rows. The file format is just the physical shape of those rows on disk, and it decides what a query engine has to read.',
          'Same dataset as CSV can cost ten times more to query than Parquet. Format isn\'t a footnote, it\'s a pricing decision, so it\'s worth understanding properly.',
          'CSV is text rows separated by commas, readable but no types and no nesting. JSON is text with names and nesting, flexible but repetitive and chunky. Parquet is a binary columnar format that stores values by column and compresses them hard. Avro is row-oriented and built for streaming records where the schema needs to evolve.',
          'A quick picture, row-oriented files store one complete record at a time, like an index card. Columnar files store all values of one field together, like peeling a column out of a spreadsheet. Analytics usually reads a few columns across millions of rows, so columnar wins by a huge margin.',
          'Schema is your contract, it names fields and pins down types. Without it a missing column in a CSV just gives you wrong numbers and no warning. With a schema the engine refuses to guess, that\'s why catalogs exist, you\'ll see those in a couple lessons.',
          'A common pattern these days is land raw data exactly as it arrived, then convert to Parquet partitioned by date for analytics. You keep the raw zone for replay and audit, and you query the compact copy because it\'s faster and cheaper.'
        ],
        demos: [
          {
            code: `// Why columnar formats are cheaper for analytics.
function estimateScan(rows, format, columnsSelected, totalColumns) {
  const bytesPerRow = 200;
  if (format === 'parquet') {
    // Columnar reads only the columns you asked for.
    return Math.ceil(rows * bytesPerRow * (columnsSelected / totalColumns));
  }
  // CSV and JSON are row-oriented: the whole row must be read.
  return rows * bytesPerRow;
}

const rows = 1000000;
console.log('CSV, 2 of 10 columns:     ' + estimateScan(rows, 'csv', 2, 10) + ' bytes');
console.log('JSON, 2 of 10 columns:    ' + estimateScan(rows, 'json', 2, 10) + ' bytes');
console.log('Parquet, 2 of 10 columns: ' + estimateScan(rows, 'parquet', 2, 10) + ' bytes');
console.log('Columnar storage is why "SELECT two columns" gets cheap.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What is the difference between row-oriented and columnar storage?'
          },
          {
            type: 'apply',
            prompt: 'An analyst queries three columns from a table with forty. Which format do you choose and why?'
          },
          {
            type: 'predict',
            prompt: 'A CSV has a missing column for one day of data. What does the analytics engine do, and how does a schema change that?'
          }
        ],
        debugging: [
          {
            buggyCode: `// A CSV arrived with a shifted column, silently corrupting the report.
const csvRow = 'u-1042,aws-lambda-201,60'; // expected: id,userId,lessonId,percent
console.log('Parsed as percent = ' + csvRow.split(',')[2]); // actually lessonId!
console.log('No error was raised.');`,
            hints: [
              'What does the parser assume about column positions?',
              'Why did nothing warn you?',
              'What enforces field names and types?'
            ],
            solution: `// Text formats without a schema fail silently. Give the data a schema.
const csvRow = 'u-1042,aws-lambda-201,60';
const columns = ['id', 'userId', 'lessonId', 'percent'];
const values = csvRow.split(',');

if (values.length !== columns.length) {
  throw new Error('Column count mismatch: expected ' + columns.length + ', got ' + values.length);
}
// Now the mismatch is an error instead of a wrong number.
console.log('Columns and values line up.');`
          }
        ],
        exercises: [
          {
            prompt: 'Write estimateScan(rows, format, columnsSelected, totalColumns) using bytesPerRow 200. For "parquet" return rows times bytesPerRow times columnsSelected divided by totalColumns, rounded up. For any other format return rows times bytesPerRow.',
            tests: [
              `estimateScan(1000, 'csv', 2, 10) === 200000`,
              `estimateScan(1000, 'json', 2, 10) === 200000`,
              `estimateScan(1000, 'parquet', 2, 10) === 40000`,
              `estimateScan(1000, 'parquet', 10, 10) === 200000`,
              `estimateScan(1000, 'parquet', 2, 10) < estimateScan(1000, 'csv', 2, 10)`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Analytics queries get cheaper with Parquet because:',
              choices: ['It is text', 'It reads only the columns selected', 'It has no schema'],
              answer: 'It reads only the columns selected'
            },
            {
              type: 'mcq',
              prompt: 'What does a schema provide?',
              choices: ['Compression', 'Field names and types as a contract', 'Faster networking'],
              answer: 'Field names and types as a contract'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'CSV, JSON, Parquet, Avro characteristics',
          'Row vs columnar storage',
          'Schema prevents silent corruption',
          'Land raw, convert to Parquet for analytics'
        ],
        mistakeWatchlist: ['Analysing schemaless text and trusting the result']
      },
      nextLesson: 'data-lake-design'
    },
    {
      id: 'data-lake-design',
      title: 'S3 data lake design',
      objectives: [
        'Design raw, clean and curated zones',
        'Explain why the same data is stored more than once',
        'Build a partitioned key layout for query efficiency'
      ],
      prerequisites: ['CSV, JSON, Parquet, Avro and Schema'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'In lesson 14 you built a partitioned key. A data lake is that same habit applied across an entire org, not just one feature.',
          'Without organization a lake turns into a swamp pretty fast. Nobody knows what\'s current, what\'s clean, or who owns it. The zones pattern is the simplest fix that actually works.',
          'Raw holds data exactly as it arrived, untouched, for replay and audit. Clean holds validated, deduped, correctly typed data. Curated is the business-ready table that analysts can query without chasing anyone for help.',
          'You keep the raw copy because pipelines have bugs. If you only store the cleaned output and later find a bug in the cleaning, you\'d have to ask the source for the data again and it might be gone. Raw makes reprocessing possible.',
          'Kitchen might help, deliveries hit the loading bay, that\'s raw. Ingredients get washed and chopped, that\'s clean. Finished plates go to the pass, that\'s curated. You don\'t wash veg straight onto a customer\'s plate.',
          'A few extras make a lake hold up. Add a catalog so tables are findable, a lifecycle rule so old data slips to cheaper storage, and a naming convention that\'s actually written down. That naming doc matters more than people expect, it\'s what keeps the swamp away.'
        ],
        demos: [
          {
            code: `// One naming convention, applied everywhere.
function lakeKey(zone, date, id) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return zone + '/year=' + y + '/month=' + m + '/day=' + d + '/' + id + '.parquet';
}

const ts = new Date('2026-09-18T10:15:00Z');
console.log(lakeKey('raw', ts, 'batch-001'));
console.log(lakeKey('clean', ts, 'batch-001'));
console.log(lakeKey('curated', ts, 'lesson_completions'));

 // Same event, three stages of trust.
console.log('raw = as received | clean = validated | curated = business ready');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Why keep a raw zone instead of only the cleaned data?'
          },
          {
            type: 'apply',
            prompt: 'Design the key layout for events landing in the clean zone that must be filterable by date.'
          },
          {
            type: 'predict',
            prompt: 'A team uploads everything into one prefix with no date and no zones. What breaks first as the data grows?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Everything in one prefix, no zones, no dates.
const key = 'all-data/export.csv';
// New data is appended daily, sometimes overwriting, sometimes not.
console.log('Key: ' + key);
console.log('Can we tell raw from clean? Can we filter by date? Is this reproducible?');`,
            hints: [
              'Can a query engine skip any files with this layout?',
              'Can you tell which copy is trustworthy?',
              'What naming convention would fix both problems?'
            ],
            solution: `const date = new Date('2026-09-18T00:00:00Z');
function lakeKey(zone, date, id) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return zone + '/year=' + y + '/month=' + m + '/day=' + d + '/' + id + '.parquet';
}
console.log(lakeKey('raw', date, 'daily-export'));
console.log(lakeKey('clean', date, 'daily-export'));
// Zones give trust; date partitions give skipping.`
          }
        ],
        exercises: [
          {
            prompt: 'Write lakeKey(zone, date, id) returning a key of the form zone/year=YYYY/month=MM/day=DD/<id>.parquet, using UTC and zero-padding month and day to two digits.',
            tests: [
              `lakeKey('raw', new Date('2026-09-18T10:00:00Z'), 'e1') === 'raw/year=2026/month=09/day=18/e1.parquet'`,
              `lakeKey('curated', new Date('2027-01-02T00:00:00Z'), 'x') === 'curated/year=2027/month=01/day=02/x.parquet'`,
              `lakeKey('raw', new Date('2026-09-18T10:00:00Z'), 'e1') !== lakeKey('clean', new Date('2026-09-18T00:00:00Z'), 'e1')`,
              `lakeKey('raw', new Date('2026-12-31T00:00:00Z'), 'e1').indexOf('month=12') !== -1`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Why keep the raw zone?',
              choices: ['It is smaller', 'So pipelines can be re-run after a bug fix', 'It queries faster'],
              answer: 'So pipelines can be re-run after a bug fix'
            },
            {
              type: 'mcq',
              prompt: 'Date partitioning in keys mainly helps by:',
              choices: ['Compressing files', 'Letting queries skip unrelated files', 'Encrypting data'],
              answer: 'Letting queries skip unrelated files'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Raw, clean and curated zones',
          'Raw enables replay and audit',
          'Partitioned naming conventions',
          'Lakes become swamps without standards'
        ],
        mistakeWatchlist: ['Storing only cleaned data', 'One undated prefix for everything']
      },
      nextLesson: 'data-glue-athena'
    },
    {
      id: 'data-glue-athena',
      title: 'Glue catalog and Athena SQL (the SQL bridge)',
      objectives: [
        'Bridge basic SQL to analytical SQL step by step',
        'Use GROUP BY, HAVING and partition filters together',
        'Estimate query cost from bytes scanned',
        'Explain what a catalog does'
      ],
      prerequisites: ['S3 Data Lake Design'],
      timeEstimateMin: 40,
      content: {
        explanations: [
          'In lesson 4 you wrote SELECT, WHERE and GROUP BY over a tiny array. This is that same ladder, just with more rungs until it reaches analytical SQL. Nothing magical, just incremental.',
          'First rung, filter some rows. SELECT lessonId, completed FROM learner_events WHERE completed = true. You\'ve done this already.',
          'Next, aggregate. Add GROUP BY lessonId and COUNT. Now each output row is a group, not a record. WHERE still filters records before they get grouped.',
          'Then filter the groups. HAVING COUNT(*) >= 5 filters after grouping, and this is where people trip. WHERE limits rows, HAVING limits groups. Different moments, different purposes.',
          'Now prune files. Add filters on the partition columns, year = and month =. The engine only reads the matching folders, so you scan a fraction of the data and pay a fraction of the price.',
          'The catalog is basically a table of tables. It stores the schema and the partition layout so the engine knows where data lives and what types each column has. A crawler can walk your files and fill that in automatically.',
          'Athena bills by data scanned, so partitioning plus Parquet is the whole cost story. Scanning one day instead of two years can be hundreds of times cheaper for the same answer, that\'s why those earlier design choices matter.'
        ],
        demos: [
          {
            code: `// The SQL bridge, built one rung at a time.
const rung1 = 'SELECT lessonId, completed FROM learner_events WHERE completed = true';
const rung2 = 'SELECT lessonId, COUNT(*) AS completions FROM learner_events WHERE completed = true GROUP BY lessonId';
const rung3 = rung2 + ' HAVING COUNT(*) >= 5';
const rung4 = rung3 + " AND year = '2026' AND month = '09'";

console.log('1 filter:    ' + rung1);
console.log('2 aggregate: ' + rung2);
console.log('3 groups:    ' + rung3);
console.log('4 partition: ' + rung4);

// Cost follows bytes scanned, not rows returned.
function athenaCost(scannedTB) {
  const pricePerTB = 5; // illustrative; check current pricing
  return scannedTB * pricePerTB;
}

console.log('Full lake scan (2 TB):  $' + athenaCost(2).toFixed(2));
console.log('One month (0.05 TB):    $' + athenaCost(0.05).toFixed(2));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What is the difference between WHERE and HAVING?'
          },
          {
            type: 'apply',
            prompt: 'Write the partition filter that limits a query to September 2026.'
          },
          {
            type: 'predict',
            prompt: 'You converted CSV to Parquet and added a date filter. What happens to the cost of the same query, and why?'
          }
        ],
        debugging: [
          {
            buggyCode: `-- Returns zero rows although the lake clearly has data.
SELECT * FROM learner_events
WHERE date = '2026-09-18';

-- The crawled partition columns are year, month and day.`,
            hints: [
              'Which columns actually exist in the catalog?',
              'Is there a column called date?',
              'Rewrite the filter using the real partition columns.'
            ],
            solution: `-- Use the partition columns that exist in the catalog.
SELECT * FROM learner_events
WHERE year = '2026'
  AND month = '09'
  AND day = '18';`
          }
        ],
        exercises: [
          {
            prompt: 'Write four SQL helpers. partitionFilter(year, month) returns year = then the year quoted, AND month = then the month quoted and zero-padded to two digits. havingClause(min) returns HAVING COUNT(*) >= min. athenaCost(scannedTB) returns scannedTB times 5. groupByLesson() returns the exact string GROUP BY lessonId.',
            tests: [
              `partitionFilter(2026, 9) === "year = '2026' AND month = '09'"`,
              `partitionFilter(2027, 12) === "year = '2027' AND month = '12'"`,
              `havingClause(5) === 'HAVING COUNT(*) >= 5'`,
              `athenaCost(0.5) === 2.5`,
              `athenaCost(0) === 0`,
              `groupByLesson() === 'GROUP BY lessonId'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which clause filters groups rather than rows?',
              choices: ['WHERE', 'HAVING', 'LIMIT'],
              answer: 'HAVING'
            },
            {
              type: 'mcq',
              prompt: 'Athena bills for:',
              choices: ['Servers per hour', 'Data scanned', 'Tables created'],
              answer: 'Data scanned'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'SQL ladder: filter, aggregate, groups, partition prune',
          'WHERE filters rows, HAVING filters groups',
          'Catalogs hold schema and partition metadata',
          'Cost follows bytes scanned'
        ],
        mistakeWatchlist: ['Filtering on a non-existent date column', 'Confusing WHERE with HAVING']
      },
      nextLesson: 'data-etl-pipeline'
    },
    {
      id: 'data-etl-pipeline',
      title: 'ETL: clean, validate, transform, publish',
      objectives: [
        'Separate cleaning, validation and transformation into steps',
        'Produce an analytics-ready record from a raw record',
        'Explain idempotent publishing'
      ],
      prerequisites: ['Glue Catalog and Athena SQL (the SQL Bridge)'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'You already dropped bad rows in lesson 4. That was the cleaning step, just without the label. Now we split the work so each piece can be tested on its own.',
          'A pipeline runs unattended at 2am, so keeping steps tangled is risky. One bad record can silently mess up a whole day\'s analytics before anyone notices.',
          'There are four moves. Clean throws out malformed or duplicate records. Validate checks types and ranges on what\'s left. Transform reshapes it into the form analytics wants. Publish writes it to the clean or curated zone in a queryable format.',
          'An airport isn\'t a bad image. Check-in turns away people who shouldn\'t travel, that\'s clean. Security checks them, that\'s validate. The gate groups them by flight, that\'s transform. The plane takes them where they belong, that\'s publish.',
          'Publishing has to be idempotent. Pipelines fail and get retried, and if publish just appends, a rerun double counts every row. Write to a deterministic partition and overwrite it instead, then running twice looks the same as running once.',
          'Three small habits make pipelines reliable. Validate before you publish so bad data fails loudly, publish to immutable partitioned outputs so reruns stay safe, and log counts in versus counts out so a sudden 90 percent drop jumps out straight away.'
        ],
        demos: [
          {
            code: `// Clean -> validate -> transform -> publish.
function cleanRows(rows) {
  const seen = {};
  const out = [];
  for (const r of rows) {
    if (!r || typeof r.id !== 'string' || r.id === '') continue;
    if (seen[r.id]) continue;
    seen[r.id] = true;
    out.push(r);
  }
  return out;
}

function validate(row) {
  if (typeof row.userId !== 'string' || row.userId === '') return false;
  if (typeof row.lessonId !== 'string' || row.lessonId === '') return false;
  if (typeof row.completed !== 'boolean') return false;
  if (row.seconds !== null && typeof row.seconds !== 'number') return false;
  return true;
}

function toAnalyticsRow(row) {
  return {
    userId: row.userId,
    lessonId: row.lessonId,
    completed: row.completed,
    seconds: row.seconds === null ? 0 : row.seconds
  };
}

const raw = [
  { id: 'e1', userId: 'u1', lessonId: 'l1', completed: true, seconds: 300 },
  { id: 'e1', userId: 'u1', lessonId: 'l1', completed: true, seconds: 300 },
  { id: 'e2', userId: 'u2', lessonId: 'l2', completed: false, seconds: null }
];

const clean = cleanRows(raw);
const valid = clean.filter(validate);
const published = valid.map(toAnalyticsRow);

console.log('Rows in: ' + raw.length + ' | after clean: ' + clean.length + ' | published: ' + published.length);
console.log('Published: ' + JSON.stringify(published));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What are the four ETL steps, and what does each remove or add?'
          },
          {
            type: 'apply',
            prompt: 'A published row has seconds null. What should the transform step do, and why?'
          },
          {
            type: 'predict',
            prompt: 'A pipeline appends to its output and is retried after a failure. What does the analytics report show?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Re-running the job doubles every number.
const published = [];
function publish(rows) {
  for (const row of rows) published.push(row); // append, never replace
}
publish([{ id: 'e1' }]);
publish([{ id: 'e1' }]); // the same job ran twice
console.log('Rows published: ' + published.length); // 2, but truth is 1`,
            hints: [
              'What should happen when the same job runs twice?',
              'Is appending the same as overwriting a partition?',
              'How do you make the output deterministic?'
            ],
            solution: `// Publish to a deterministic partition and OVERWRITE it.
const store = {};
function publish(partition, rows) {
  store[partition] = rows; // replace, do not append
}
publish('year=2026/month=09/day=18', [{ id: 'e1' }]);
publish('year=2026/month=09/day=18', [{ id: 'e1' }]);
console.log('Rows after two runs: ' + store['year=2026/month=09/day=18'].length);`
          }
        ],
        exercises: [
          {
            prompt: 'Write cleanRows(rows) that drops null rows, drops rows whose id is missing or empty, and keeps only the first row for each id. Write toAnalyticsRow(row) returning { userId, lessonId, completed, seconds } where seconds is 0 when the original seconds is null.',
            tests: [
              `cleanRows([{ id: 'e1' }, { id: 'e1' }]).length === 1`,
              `cleanRows([{ id: '' }]).length === 0`,
              `cleanRows([null, { id: 'e9' }]).length === 1`,
              `toAnalyticsRow({ userId: 'u1', lessonId: 'l1', completed: true, seconds: null }).seconds === 0`,
              `toAnalyticsRow({ userId: 'u1', lessonId: 'l1', completed: true, seconds: 42 }).seconds === 42`,
              `toAnalyticsRow({ userId: 'u1', lessonId: 'l1', completed: true, seconds: null }).completed === true`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Why must publishing be idempotent?',
              choices: ['To save storage', 'Because pipelines are re-run after failures', 'To make queries faster'],
              answer: 'Because pipelines are re-run after failures'
            },
            {
              type: 'mcq',
              prompt: 'What should a pipeline log to catch silent data loss?',
              choices: ['Only errors', 'Counts in and counts out', 'The full dataset'],
              answer: 'Counts in and counts out'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Clean, validate, transform, publish',
          'Idempotent publishing by deterministic partition',
          'Log counts in and counts out',
          'Fail loudly on bad data'
        ],
        mistakeWatchlist: ['Appending instead of overwriting on re-run']
      },
      nextLesson: 'data-warehouse-lakehouse'
    },
    {
      id: 'data-warehouse-lakehouse',
      title: 'Warehouses, lakehouses and Iceberg',
      objectives: [
        'Distinguish a data warehouse from a data lake',
        'Explain what a lakehouse adds',
        'Choose an analytics store from requirements'
      ],
      prerequisites: ['ETL: Clean, Validate, Transform, Publish'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'In lesson 16 you picked a database by its access pattern. A warehouse is the same call, just for a different workload, big aggregations and lots of analysts at once.',
          'People like to argue lake vs warehouse as if one has to win. They solve different problems, and the newer lakehouse idea deliberately blurs the line.',
          'A warehouse keeps structured, modeled data tuned for fast SQL over large aggregations and high concurrency, that\'s where dashboards and BI live. It\'s more expensive and it expects data that\'s already been cleaned.',
          'A lake keeps everything in open formats on object storage, cheap and flexible. It\'s great for raw data and ML and replay, but for a long time it didn\'t have transactions, so concurrent updates and schema changes were a headache.',
          'A lakehouse puts a table layer, like Apache Iceberg, on top of the lake. You get transactions, schema evolution and time travel over files in object storage, so you get warehouse-like reliability without copying everything into a separate system.',
          'Warehouse, storage yard, yard with proper shelving, if you want it visual. The warehouse is tidy and fast to pick from. The yard holds anything cheaply. Add shelving with labels and inventory tracking and the yard starts to feel almost like the warehouse.',
          'Pick by need. Heavy concurrent BI and dashboards lean warehouse. Raw storage with ML and replay leans lake. Evolving schemas with open formats but you still want transactions leans lakehouse. Lots of shops run more than one on purpose, and that\'s fine.'
        ],
        demos: [
          {
            code: `// Choose by requirement, not by fashion.
function chooseStore(need) {
  if (need.schemaEvolutionAndOpenFormats) return 'lakehouse';
  if (need.highConcurrencyBiDashboards) return 'redshift';
  return 'athena';
}

const needs = [
  { name: '500 analysts on shared dashboards', highConcurrencyBiDashboards: true },
  { name: 'schemas change weekly, data must stay open', schemaEvolutionAndOpenFormats: true },
  { name: 'occasional SQL over a large S3 lake' }
];

for (const n of needs) {
  console.log(n.name + ' -> ' + chooseStore(n));
}`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What problem did the lakehouse pattern set out to solve?'
          },
          {
            type: 'apply',
            prompt: 'Your dashboards serve five hundred concurrent users with complex joins. Which store, and why not query the lake directly?'
          },
          {
            type: 'predict',
            prompt: 'You keep schemas changing weekly but stay on plain files with no table layer. What operational problems appear?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Analysts query raw JSON files directly with no table layer.
const problems = [
  'no transactions when files change mid-query',
  'no schema evolution',
  'no reliable history'
];
console.log(problems.join(' | '));`,
            hints: [
              'What happens if a file is replaced while a query reads it?',
              'Can the format absorb a new column without breaking readers?',
              'Which layer adds transactions and schema evolution to lake files?'
            ],
            solution: `// Add a table layer over the lake files.
const solution = {
  layer: 'Iceberg table format',
  gains: ['transactions', 'schema evolution', 'time travel', 'reliable concurrent reads']
};
console.log(JSON.stringify(solution));
// Or move curated data into a warehouse if the workload is BI heavy.`
          }
        ],
        exercises: [
          {
            prompt: 'Write chooseStore(need). If schemaEvolutionAndOpenFormats is true return "lakehouse". Otherwise if highConcurrencyBiDashboards is true return "redshift". Otherwise return "athena".',
            tests: [
              `chooseStore({ schemaEvolutionAndOpenFormats: true }) === 'lakehouse'`,
              `chooseStore({ schemaEvolutionAndOpenFormats: true, highConcurrencyBiDashboards: true }) === 'lakehouse'`,
              `chooseStore({ highConcurrencyBiDashboards: true }) === 'redshift'`,
              `chooseStore({}) === 'athena'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'A lakehouse adds which capability to lake files?',
              choices: ['Cheaper storage', 'Transactions and schema evolution', 'Faster networking'],
              answer: 'Transactions and schema evolution'
            },
            {
              type: 'mcq',
              prompt: 'A warehouse is strongest for:',
              choices: ['Raw unstructured files', 'Large concurrent BI and aggregations', 'Storing backups'],
              answer: 'Large concurrent BI and aggregations'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Warehouse vs lake vs lakehouse',
          'Iceberg brings transactions and schema evolution',
          'Choose by requirement, not fashion'
        ],
        mistakeWatchlist: ['Querying bare lake files with no table layer']
      },
      nextLesson: 'project-data-lake'
    },
    {
      id: 'project-data-lake',
      title: 'Project 2: the learning-events data lake',
      objectives: [
        'Assemble raw, clean and curated zones end to end',
        'Catalog and query the lake with SQL',
        'Compare query cost with and without partitioning'
      ],
      prerequisites: ['Warehouses, Lakehouses and Iceberg'],
      timeEstimateMin: 50,
      content: {
        explanations: [
          'Lesson 8 had you price two capacity plans. Now let\'s price two query plans instead, same instinct, different layer.',
          'This is one of the most common data engineering tasks out there. If you can build this pipeline and say why each piece exists, you can talk about almost any analytics stack without bluffing.',
          'Events land in raw exactly as received. A job cleans and validates them into clean as Parquet partitioned by date. A curated table rolls up completions per lesson per day. A crawler registers everything in the catalog, and Athena queries it with SQL. Pretty linear when you see it end to end.',
          'The cost angle is striking. Scanning two years of unpartitioned CSV might read terabytes, while one month of partitioned Parquet reads a tiny sliver. Multiply that scanned size by the price per terabyte and you have the business case for the whole design.',
          'And the failure story is calmer too. If the job dies halfway, the deterministic partition lets you just run it again. Bad rows get dropped during cleaning and they show up in your counts, so you can see the drop without losing the rest.',
          'A lake project isn\'t really done until you have a documented key layout, a catalog entry, a before and after cost comparison, and a rerun procedure you\'ve actually tried. The cost comparison convinces people it was worth it, the rerun is what saves you at 3am.'
        ],
        demos: [
          {
            code: `// The full path, in the order the data takes it.
const pipeline = [
  'events arrive in the raw zone',
  'job cleans and validates them',
  'job writes Parquet to clean/year=../month=../day=../',
  'curated job aggregates completions per lesson per day',
  'crawler registers the schema in the Glue catalog',
  'Athena queries the curated table with SQL',
  'CloudWatch logs counts in and counts out',
  'lifecycle rules move old partitions to cheaper storage'
];

pipeline.forEach(function (step, i) { console.log((i + 1) + '. ' + step); });

// The business case: cost follows bytes scanned.
function scanCost(tb) { return tb * 5; }
console.log('Unpartitioned full scan (2 TB):   $' + scanCost(2).toFixed(2));
console.log('One partitioned month (0.02 TB):  $' + scanCost(0.02).toFixed(2));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Name the four zones or stages in your lake pipeline and what each produces.'
          },
          {
            type: 'apply',
            prompt: 'Your job fails at 3am after writing half a day of data. What do you do, and why is that safe?'
          },
          {
            type: 'predict',
            prompt: 'You remove the date partition and query two years of CSV. What happens to cost and runtime?'
          }
        ],
        debugging: [
          {
            buggyCode: `// The curated table has half the rows it should.
const logs = { rowsIn: 100000, rowsOut: 48000 };
console.log('Rows in: ' + logs.rowsIn + ', rows out: ' + logs.rowsOut);
console.log('No warning was logged.');`,
            hints: [
              'Which step drops rows, and how would you find it?',
              'What should be logged at every stage boundary?',
              'Is a 52 percent drop expected, or a bug?'
            ],
            solution: `// Log counts at every stage so silent loss becomes visible.
const stages = [
  { name: 'raw',            rows: 100000 },
  { name: 'after clean',    rows: 99000 },
  { name: 'after validate', rows: 98500 },
  { name: 'published',      rows: 98500 }
];
stages.forEach(function (s) { console.log(s.name + ': ' + s.rows); });
// A drop from 99000 to 48000 would now be obvious in one step.`
          }
        ],
        exercises: [
          {
            prompt: 'Write lakePipeline() returning an array of at least five strings naming the stages of the data lake pipeline. Also write scanCost(tb) returning tb times 5.',
            tests: [
              `Array.isArray(lakePipeline()) && lakePipeline().length >= 5`,
              `lakePipeline().some(function (s) { return s.toLowerCase().indexOf('raw') !== -1; })`,
              `scanCost(2) === 10`,
              `scanCost(0.02) === 0.1`,
              `scanCost(0) === 0`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'The main cost lever for Athena is:',
              choices: ['Number of tables', 'Bytes scanned', 'Number of users'],
              answer: 'Bytes scanned'
            },
            {
              type: 'mcq',
              prompt: 'Why is a failed job safe to re-run?',
              choices: ['It only reads', 'It writes to deterministic partitions that are overwritten', 'It ignores errors'],
              answer: 'It writes to deterministic partitions that are overwritten'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'End-to-end lake pipeline',
          'Catalog plus SQL over the lake',
          'Partitioning as the cost strategy',
          'Counts logged at every stage'
        ],
        mistakeWatchlist: ['Silent row loss between stages']
      },
      nextLesson: 'pipeline-reliability'
    }
  ]
};
