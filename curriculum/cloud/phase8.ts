import { Module } from '../../types';

/**
 * Phase 8 — AI Data Systems and Capstone (Lessons 38-40).
 * Playbook R3: the RAG lesson ingests the curated zone produced by Phase 5 and
 * the streaming output from Phase 6, and reuses Phase 6 dedupe for ingestion.
 */
export const PHASE_8_MODULE: Module = {
  id: 'cloud-phase-8',
  title: 'Module 9: AI Data Systems and Capstone',
  lessons: [
    {
      id: 'ai-bedrock',
      title: 'Foundation models and Amazon Bedrock',
      objectives: [
        'Call a foundation model through a request and response shape',
        'Write a system instruction that constrains behaviour',
        'Estimate cost from input and output tokens'
      ],
      prerequisites: ['Infrastructure as Code and Production Readiness'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'In lesson 18 you validated an HTTP request body before acting on it. Calling a model needs the same discipline, validate input, cap cost, and don\'t trust the shape blindly.',
          'Adding a model to a product is routine now, doing it safely isn\'t. Whether it becomes a helpful feature or an expensive incident comes down to access control, prompt design and token hygiene.',
          'Bedrock lets you use foundation models through one API. You don\'t run the model yourself or manage weights. You send a model id, a system instruction and a list of messages, and you get text back. Simple on the surface, easy to overspend if you\'re not careful.',
          'It\'s a bit like calling a specialist. You can\'t keep them on staff full time, so you ring for a specific question, give them just enough context, and pay for the length of the conversation. Long calls cost more, obviously.',
          'The request itself has a few pieces. A system instruction steers behavior, messages carry the chat with role user or assistant and a list of content parts, and inference settings like max output tokens and temperature control cost and randomness.',
          'You pay for input tokens and output tokens, so a chunky system prompt and a huge context get billed every single call. Keep the model id in config, not baked into client code, so you can swap to a cheaper or newer model without shipping a new build.',
          'Treat the model like an untrusted service. Grant the function permission to invoke only that one model, log metadata not full prompts, put a ceiling on tokens, and don\'t send personal data to a model you haven\'t cleared for that data.'
        ],
        demos: [
          {
            code: `// The request shape for a model call.
function converseBody(question, modelId) {
  return {
    modelId: modelId,
    system: [{ text: 'You are a concise cloud engineering tutor. Answer first, then give one small example.' }],
    messages: [{ role: 'user', content: [{ text: question }] }],
    inferenceConfig: { maxTokens: 400, temperature: 0.3 }
  };
}

const body = converseBody('Why does my Lambda time out?', 'model-from-config');
console.log('Model: ' + body.modelId);
console.log('Messages: ' + body.messages.length);
console.log('Max output tokens: ' + body.inferenceConfig.maxTokens);

// Cost intuition: you pay for input tokens and output tokens.
function tokenCost(inputTokens, outputTokens, inPricePer1k, outPricePer1k) {
  return (inputTokens / 1000) * inPricePer1k + (outputTokens / 1000) * outPricePer1k;
}

console.log('Short call: $' + tokenCost(500, 200, 0.0003, 0.0006).toFixed(6));
console.log('Bloated context: $' + tokenCost(20000, 200, 0.0003, 0.0006).toFixed(6));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What does a system instruction control, and which API operation sends a chat-style request?'
          },
          {
            type: 'apply',
            prompt: 'Write a short system instruction for a tutor that must answer the learner first and then add depth.'
          },
          {
            type: 'predict',
            prompt: 'You set the maximum output tokens very high and send a huge context on every call. What happens to cost and latency?'
          }
        ],
        debugging: [
          {
            buggyCode: `// Works in the playground, fails from the function.
const request = {
  modelId: 'some-model-i-remember',
  messages: []
};
console.log('Model enabled in this region? ' + 'unknown');
console.log('Execution role allowed to invoke it? ' + 'unknown');
console.log('Messages empty? ' + true);`,
            hints: [
              'Is that exact model available in your region, and is it enabled?',
              'Does the function role have permission to invoke that model?',
              'What must a messages array contain?'
            ],
            solution: `// Three fixes, in order.
const request = {
  modelId: process.env.BEDROCK_MODEL_ID, // configured, not remembered
  messages: [
    { role: 'user', content: [{ text: 'Why does my Lambda time out?' }] }
  ]
};
// 1) Enable the exact model and read its real id.
// 2) Grant the role permission to invoke that model.
// 3) Always send at least one user message.`
          }
        ],
        exercises: [
          {
            prompt: 'Write converseBody(question, modelId) returning an object with modelId, a messages array containing one user message whose content is an array with one part having text equal to the question. Also write tokenCost(inputTokens, outputTokens, inPricePer1k, outPricePer1k) as inputTokens divided by 1000 times inPrice, plus outputTokens divided by 1000 times outPrice.',
            tests: [
              `converseBody('hi', 'm').modelId === 'm'`,
              `converseBody('hi', 'm').messages[0].role === 'user'`,
              `converseBody('hi', 'm').messages[0].content[0].text === 'hi'`,
              `tokenCost(1000, 1000, 1, 2) === 3`,
              `tokenCost(0, 0, 1, 1) === 0`,
              `tokenCost(2000, 0, 1, 1) === 2`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Bedrock bills on:',
              choices: ['Servers per hour', 'Input and output tokens', 'Storage per GB'],
              answer: 'Input and output tokens'
            },
            {
              type: 'mcq',
              prompt: 'Where should the model id live?',
              choices: ['Hardcoded in the client', 'In configuration', 'In the stylesheet'],
              answer: 'In configuration'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Model request and response shape',
          'System instruction as behaviour control',
          'Token-based cost',
          'Model id in configuration, least-privilege invoke'
        ],
        mistakeWatchlist: ['Hardcoded model ids', 'Bloated prompts on every call']
      },
      nextLesson: 'ai-rag-grounding'
    },
    {
      id: 'ai-rag-grounding',
      title: 'RAG: retrieval, grounding, citations and evaluation',
      objectives: [
        'Explain retrieval-augmented generation and why it reduces hallucination',
        'Chunk the curated data lake output for embedding',
        'Build a grounded prompt that requires citations',
        'Diagnose weak retrieval'
      ],
      prerequisites: ['Foundation Models and Amazon Bedrock'],
      timeEstimateMin: 40,
      content: {
        explanations: [
          'In lesson 26 you cleaned and published data to the curated zone. That curated output is exactly what retrieval reads from. This lesson just points that pipeline at a new destination.',
          'A model only knows its training data. It doesn\'t know your course notes or yesterday\'s policies, so without retrieval it will sound confident and be wrong. With retrieval it answers from your material and can point to where the claim came from.',
          'The flow is straightforward. Take the curated docs, chop them into passages big enough to be useful but small enough to stay relevant, turn each chunk into an embedding, that numeric vector that captures meaning. Store those vectors, and at query time embed the question, pull the nearest chunks, and drop them into the prompt with an instruction to answer only from them and cite.',
          'Think open-book exam. Model is the student, your curated zone is the textbook, retrieval is the index that finds the right three pages before the student writes. Without the book, they guess from memory, and you can tell.',
          'Chunk size is a trade-off you\'ve seen before in data quality. Too big and the meaning gets diluted and you waste tokens. Too small and you shred ideas into fragments and lose context. Overlapping chunks are a decent middle ground that many teams settle on.',
          'Ingestion has to be idempotent. If you rerun it after a fix and create a second copy of every vector, retrieval returns the same passage twice and biases the answer. Reuse the dedupe and deterministic-overwrite habits from lesson 29, they save you here too.',
          'And evaluate retrieval on its own. Did the right chunk land in the top results? If retrieval is off, no prompt tweak will rescue the answer. Also require citations and treat a missing citation as a failure, not a style nit.'
        ],
        demos: [
          {
            code: `// Chunk the curated documents, then ground the answer in retrieved chunks.
function chunkDocument(text, maxChars) {
  const chunks = [];
  let current = '';
  for (const word of text.split(' ')) {
    if (word === '') continue;
    if (current !== '' && current.length + word.length + 1 > maxChars) {
      chunks.push(current);
      current = word;
    } else {
      current = current === '' ? word : current + ' ' + word;
    }
  }
  if (current !== '') chunks.push(current);
  return chunks;
}

function buildGroundedPrompt(question, chunks) {
  let context = '';
  for (let i = 0; i < chunks.length; i++) {
    context += '[source ' + (i + 1) + '] ' + chunks[i] + '\n';
  }
  return 'Answer using ONLY the sources below and cite each claim as [source n]. ' +
    'If the answer is not present, say so.\n\nSOURCES:\n' + context + '\nQUESTION: ' + question;
}

// In the real pipeline these chunks come from the curated zone in S3.
const doc = 'S3 keys are unique and immutable. Writing to an existing key overwrites the object unless versioning is enabled.';
const chunks = chunkDocument(doc, 80);

console.log('Chunks: ' + chunks.length);
console.log(buildGroundedPrompt('When is an S3 object overwritten?', chunks));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What does retrieval add that a plain model call does not have?'
          },
          {
            type: 'apply',
            prompt: 'Describe the steps from a learner\u2019s question to a citation-backed answer.'
          },
          {
            type: 'predict',
            prompt: 'Ingestion is re-run without deduplication. What happens to retrieval quality, and why?'
          }
        ],
        debugging: [
          {
            buggyCode: `// The tutor invents cloud facts and cites nothing.
function answer(question) {
  return callModel('Answer this question: ' + question);
}
console.log('Answer: ' + answer('What is our retention policy?'));
// The model has never seen the retention policy.`,
            hints: [
              'Does the model have any source material in the prompt?',
              'How do you constrain it to your own corpus?',
              'What must it be asked to include in the answer?'
            ],
            solution: `// Retrieve first, then constrain the answer to the retrieved sources.
function answer(question, chunks) {
  let context = '';
  for (let i = 0; i < chunks.length; i++) {
    context += '[source ' + (i + 1) + '] ' + chunks[i] + '\n';
  }
  const prompt = 'Answer using ONLY the sources below and cite each claim as [source n]. ' +
    'If the answer is not present, say so.\n\nSOURCES:\n' + context + '\nQUESTION: ' + question;
  return callModel(prompt);
}
// Also measure retrieval: did the correct chunk appear at all?`
          }
        ],
        exercises: [
          {
            prompt: 'Write chunkDocument(text, maxChars) splitting on single spaces, skipping empty strings, and starting a new chunk when adding the next word would make the current chunk longer than maxChars. No chunk may exceed maxChars. Write buildGroundedPrompt(question, chunks) returning a string that contains the phrases "ONLY the sources" and "cite each claim", includes every chunk labelled as [source n] starting at 1, and ends with the question.',
            tests: [
              `chunkDocument('a b c', 3).length === 2`,
              `chunkDocument('hello', 100).length === 1`,
              `chunkDocument('', 10).length === 0`,
              `chunkDocument('a b c', 3).every(function (c) { return c.length <= 3; }) === true`,
              `buildGroundedPrompt('Q', ['A']).indexOf('[source 1] A') !== -1`,
              `buildGroundedPrompt('Q', ['A']).indexOf('ONLY the sources') !== -1`,
              `buildGroundedPrompt('Q', ['A']).indexOf('cite each claim') !== -1`,
              `buildGroundedPrompt('What is X?', ['A']).indexOf('What is X?') !== -1`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'An embedding is:',
              choices: ['A compressed file', 'A numeric vector representing meaning', 'A database index'],
              answer: 'A numeric vector representing meaning'
            },
            {
              type: 'mcq',
              prompt: 'If retrieval returns the wrong chunks, the best fix is:',
              choices: ['Raise the temperature', 'Improve chunking and retrieval', 'Ask for longer answers'],
              answer: 'Improve chunking and retrieval'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'RAG pipeline: chunk, embed, retrieve, generate',
          'Chunk size trade-offs',
          'Idempotent embedding ingestion',
          'Evaluate retrieval separately from generation'
        ],
        mistakeWatchlist: ['Answering without retrieved context', 'Re-running ingestion without deduplication']
      },
      nextLesson: 'capstone-final'
    },
    {
      id: 'capstone-final',
      title: 'Final capstone: the learning intelligence platform',
      objectives: [
        'Design an end-to-end platform using every layer of the course',
        'Justify each component with a requirement and a trade-off',
        'Present security, cost, observability and recovery evidence'
      ],
      prerequisites: ['RAG: Retrieval, Grounding, Citations and Evaluation'],
      timeEstimateMin: 60,
      content: {
        explanations: [
          'Every lesson so far gave you a component you can reach for. The capstone is about picking among them and being able to defend the picks, not about using everything.',
          'A system is built by someone who can say why each box exists. The aim isn\'t most services, it\'s meeting the requirement with the least complexity you can get away with.',
          'The shape looks like this. Client calls an authenticated API, serverless functions write learner progress to a key-value table and push events to a stream. A buffered delivery lands raw events in object storage, a batch job cleans them into a partitioned lake, a catalog and query engine make analytics possible, and a model call grounded by retrieval over the curated zone answers questions with citations.',
          'You\'re not done with a diagram. You\'re done when there\'s a working endpoint, structured logs you can actually search, an alarm tied to user experience, a query with a cost comparison, a restore you\'ve rehearsed, and a teardown you\'ve run at least once.',
          'You should be able to explain the trade-offs plainly, why serverless for the API and batch for analytics, why that partition key and that buffer size, why that retention window, why you back up as well as replicate. Each choice has a reason and an alternative you said no to.',
          'Write it down. A one-page note with requirement, choice, trade-off and reason is worth more than a pretty diagram, because it\'s what lets someone else run the system when you\'re not around.'
        ],
        demos: [
          {
            code: `// The capstone architecture, and the discipline that makes it real.
function architecture() {
  return [
    'client -> authenticated API',
    'API -> serverless functions with least-privilege roles',
    'functions -> key-value store for operational progress',
    'functions -> event stream for learning events',
    'stream -> buffered delivery -> object storage raw zone',
    'batch job -> partitioned lake clean zone',
    'catalog + SQL engine -> analytics over the lake',
    'curated zone -> chunked and embedded for retrieval',
    'retrieval + model -> grounded answers with citations',
    'logs, metrics, alarms and tested restores across the stack'
  ];
}

function readiness() {
  return {
    leastPrivilege: true,
    structuredLogs: true,
    userFacingAlarm: true,
    testedRestore: true,
    costComparison: true,
    teardownDocumented: true
  };
}

architecture().forEach(function (step, i) { console.log((i + 1) + '. ' + step); });
console.log('Readiness: ' + JSON.stringify(readiness()));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Name six components of your platform and the requirement each one satisfies.'
          },
          {
            type: 'apply',
            prompt: 'A function cannot write to the lake. Walk through your diagnosis in order.'
          },
          {
            type: 'predict',
            prompt: 'Traffic grows a hundred times overnight. Which component breaks first, and what is your cheapest fix?'
          }
        ],
        debugging: [
          {
            buggyCode: `// The final architecture, as submitted by a team in a hurry.
const submission = {
  deployed: true,
  logs: 'none',
  alarm: 'none',
  restoreTested: false,
  costEstimate: 'none',
  teardown: 'unknown',
  architectureExplanation: 'it works'
};
console.log('Is this production ready?');`,
            hints: [
              'Which readiness items are missing?',
              'Could you recover this system after data loss?',
              'What would you write down so someone else could maintain it?'
            ],
            solution: `const submission = {
  deployed: true,
  logs: 'structured JSON with counts in and out',
  alarm: 'error rate above 1 percent for 5 minutes',
  restoreTested: true,
  costEstimate: 'scanned bytes before and after partitioning',
  teardown: 'documented and executed once',
  architectureExplanation: 'requirement, choice, trade-off, reason'
};
console.log(JSON.stringify(submission));`
          }
        ],
        exercises: [
          {
            prompt: 'Write architecture() returning an array of at least six strings naming components of the platform. Write readiness() returning an object with at least six boolean fields that are all true, covering least privilege, structured logs, an alarm, a tested restore, a cost comparison and a documented teardown.',
            tests: [
              `Array.isArray(architecture()) && architecture().length >= 6`,
              `architecture().some(function (s) { return s.toLowerCase().indexOf('stream') !== -1; })`,
              `architecture().some(function (s) { return s.toLowerCase().indexOf('retriev') !== -1; })`,
              `Object.keys(readiness()).length >= 6`,
              `Object.keys(readiness()).every(function (k) { return readiness()[k] === true; })`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'A capstone is finished when:',
              choices: ['The diagram is complete', 'It is deployed, observed, costed, restorable and explained', 'It uses the most services'],
              answer: 'It is deployed, observed, costed, restorable and explained'
            },
            {
              type: 'mcq',
              prompt: 'The best way to justify an architectural choice is to state:',
              choices: ['That it is popular', 'The requirement, the trade-off and the reason', 'The vendor name'],
              answer: 'The requirement, the trade-off and the reason'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'End-to-end platform design',
          'Justifying choices with requirements and trade-offs',
          'Production evidence over diagrams',
          'Written architecture decisions'
        ],
        mistakeWatchlist: ['Calling a deployed prototype production ready']
      },
      nextLesson: null
    }
  ]
};
