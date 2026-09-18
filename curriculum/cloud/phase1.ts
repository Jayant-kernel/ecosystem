import { Module } from '../../types';

/**
 * Phase 1 — Cloud Foundations (Lessons 5-8).
 * Foundation drill convention (playbook R1): every lesson opens by reusing a
 * Phase 0 skill inside the new topic.
 */
export const PHASE_1_MODULE: Module = {
  id: 'cloud-phase-1',
  title: 'Module 2: Why Cloud Exists',
  lessons: [
    {
      id: 'cloud-why-exists',
      title: 'Why Cloud Exists: Renting Instead of Buying',
      objectives: [
        'Explain the capacity problem that cloud computing solves',
        'Describe on-demand, pay-as-you-go and elasticity in plain terms',
        'Quantify the cost of over-provisioning and under-provisioning',
        'Decide when renting beats buying'
      ],
      prerequisites: ['Data Basics: Tables, Files, SQL, and Bad Data'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Foundation drill. In Lesson 3 you read a value from an environment variable. We do that again now, because every cloud workload is sized by a configuration value you can change without editing code.',
          'Why this matters. Imagine your app is popular from 6pm to 9pm and quiet at 4am. If you buy servers for the busy hours, they sit idle and wasted for the rest of the day. If you buy for the average, the evening traffic gets errors. This is the capacity problem, and it has no good answer with hardware you own.',
          'What cloud computing is. Instead of buying machines, you rent them by the second from a provider. You pay for what you use, you can add or remove capacity in minutes, and someone else owns the building, the power and the repairs.',
          'Mental model: the electricity utility. A factory could run its own generator and size it for its busiest day, which wastes fuel the other 364 days. Or it can plug into the grid and pay for the kilowatts it actually draws. Cloud is the grid for computing.',
          'Elasticity is the key property. Capacity follows demand automatically. Over-provisioning wastes money; under-provisioning breaks the product. Elasticity lets you be roughly right and adjust, instead of being exactly wrong forever.',
          'Production insight. Mature teams mix pricing models to match the shape of the demand: pay-as-you-go for spiky work, reserved or savings plans for the steady baseline, and spot capacity for interruptible batch jobs. The engineering skill is knowing which part of your load is steady and which part is spiky.'
        ],
        demos: [
          {
            code: `// Foundation drill: read a setting the way you did in Lesson 3.
const env = { TRAFFIC_MULTIPLIER: '3' };
const multiplier = Number(env.TRAFFIC_MULTIPLIER || '1');

// Requests per hour across one day, in thousands.
const demand = [10, 8, 6, 5, 8, 20, 40, 70, 90, 80, 75, 60];

// Option A: you bought fixed servers sized for a "reasonable" load.
const capacity = 50;

function simulate(demand, capacity) {
  let served = 0;
  let missed = 0;
  let wasted = 0;
  for (const load of demand) {
    served += Math.min(load, capacity);
    missed += Math.max(0, load - capacity);
    wasted += Math.max(0, capacity - load);
  }
  return { served: served, missed: missed, wasted: wasted };
}

const fixed = simulate(demand, capacity);
const elastic = simulate(demand, Infinity);
const peaky = simulate(demand.map(function (d) { return d * multiplier; }), capacity);

console.log('Fixed servers (capacity ' + capacity + '): ' + JSON.stringify(fixed));
console.log('Rented on demand (elastic):        ' + JSON.stringify(elastic));
console.log('Same fixed servers at 3x traffic:  ' + JSON.stringify(peaky));`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What two problems does elasticity solve at the same time?'
          },
          {
            type: 'apply',
            prompt: 'Your traffic is flat and predictable 24 hours a day. Would elasticity help much? Why or why not?'
          },
          {
            type: 'predict',
            prompt: 'A team sizes their servers for the weekly average. What will users see on the busiest evening?'
          }
        ],
        debugging: [
          {
            buggyCode: `// "We sized the servers for our average traffic, so we are fine."
const averageRequestsPerHour = 40;
const provisionedCapacity = 40;

// But the evening peak is 90.
const eveningPeak = 90;
console.log('Capacity headroom: ' + (provisionedCapacity - eveningPeak));
// Console prints: Capacity headroom: -50`,
            hints: [
              'Is traffic constant, or does it have a shape?',
              'What matters more for availability: the average or the peak?',
              'What would elasticity do differently here?'
            ],
            solution: `// Size the baseline for the average, then let elasticity cover the peak.
const averageRequestsPerHour = 40;
const eveningPeak = 90;

const baselineCapacity = averageRequestsPerHour;      // reserved, cheaper
const burstCapacity = eveningPeak - baselineCapacity; // on-demand, elastic

console.log('Steady baseline: ' + baselineCapacity);
console.log('Elastic burst needed at peak: ' + burstCapacity);
// Rule of thumb: reserve for the baseline, scale on demand for the burst.`
          }
        ],
        exercises: [
          {
            prompt: 'Write simulate(demand, capacity) that returns { served, missed, wasted }. served adds the smaller of each load and the capacity. missed adds how much each load exceeded the capacity. wasted adds how much unused capacity remained each hour.',
            tests: [
              `simulate([10, 5], 10).served === 15`,
              `simulate([10, 5], 10).missed === 0`,
              `simulate([20], 10).missed === 10`,
              `simulate([5], 10).wasted === 5`,
              `simulate([], 10).served === 0`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Under-provisioning capacity for the peak causes:',
              choices: ['Wasted money', 'Failed requests', 'Nothing at all'],
              answer: 'Failed requests'
            },
            {
              type: 'mcq',
              prompt: 'Elasticity means capacity:',
              choices: ['Follows demand', 'Is fixed yearly', 'Only grows'],
              answer: 'Follows demand'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'The capacity problem',
          'On-demand, pay-as-you-go, elasticity',
          'Over-provisioning vs under-provisioning',
          'Baseline vs burst pricing'
        ],
        mistakeWatchlist: ['Sizing for the average instead of the peak']
      },
      nextLesson: 'cloud-service-models'
    },
    {
      id: 'cloud-service-models',
      title: 'IaaS, PaaS, SaaS and Shared Responsibility',
      objectives: [
        'Distinguish IaaS, PaaS and SaaS by how much you manage',
        'Apply the shared responsibility model to real services',
        'Identify what you always own, no matter the model'
      ],
      prerequisites: ['Why Cloud Exists: Renting Instead of Buying'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Foundation drill. In Lesson 2 you wrote isRetryable to decide whether calling again makes sense. Now use that instinct to ask a different ownership question: when something breaks, who is responsible for fixing it?',
          'Why this matters. The same app can be built three ways on the same cloud. The choice changes how much you operate, how much you pay, and how much control you have. Choosing wrongly means either doing unnecessary work or losing required control.',
          'Mental model: dinner. IaaS is renting a kitchen and buying your own ingredients. PaaS is a meal-kit delivered with the recipe. SaaS is ordering takeaway. Each step removes work and control at the same time.',
          'What the terms mean. Infrastructure as a Service gives you virtual machines, storage and networks; you patch the operating system and everything above it. Platform as a Service gives you a runtime that runs your code; the provider patches the operating system and runtime. Software as a Service is finished software you log into.',
          'Shared responsibility. This is the part beginners get wrong. The provider is responsible for security OF the cloud: the buildings, hardware, network and the managed service itself. You are responsible for security IN the cloud: your data, your access rules, your configuration. Moving to PaaS or SaaS shrinks your share but never removes it.',
          'Production insight. You always own your data, your identities and your access decisions. A database provider will not decide who may read your customer table. That is why IAM and encryption are your job in every model, including SaaS.'
        ],
        demos: [
          {
            code: `// Who manages what? Three ways to run the same app.
const models = {
  iaas: { os: 'you',      runtime: 'you',      app: 'you',      data: 'you' },
  paas: { os: 'provider', runtime: 'provider', app: 'you',      data: 'you' },
  saas: { os: 'provider', runtime: 'provider', app: 'provider', data: 'you' }
};

function sharedResponsibility(model) {
  return models[model] || { os: 'you', runtime: 'you', app: 'you', data: 'you' };
}

for (const model of ['iaas', 'paas', 'saas']) {
  const r = sharedResponsibility(model);
  console.log(model.toUpperCase() + ' -> OS: ' + r.os + ', app: ' + r.app + ', data: ' + r.data);
}

// Notice what never changes: the data row is "you" in every single model.
console.log('Always yours: data, identities, access rules.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'In PaaS, who patches the operating system, and who owns the data?'
          },
          {
            type: 'apply',
            prompt: 'You move from a virtual machine to a managed platform service. Name two things you stop doing and one thing you still must do.'
          },
          {
            type: 'predict',
            prompt: 'A SaaS provider suffers a breach. Does using SaaS remove your responsibility entirely? Explain using the shared responsibility model.'
          }
        ],
        debugging: [
          {
            buggyCode: `// "We use a managed database, so security is the provider's job."
const assumption = {
  usingManagedService: true,
  weEncryptData: false,
  weSetAccessPolicies: false,
  weBackUpData: false
};
console.log('Is our data automatically protected? Probably.');`,
            hints: [
              'What does shared responsibility say about data and access?',
              'Does the provider know which of your users should read which row?',
              'Which items in that object are still your job?'
            ],
            solution: `// The provider secures the service. You secure YOUR use of it.
const reality = {
  usingManagedService: true,
  providerSecures: ['buildings', 'hardware', 'network', 'the service itself'],
  youStillOwn: ['data classification', 'encryption choices', 'access policies', 'backups']
};
console.log('Provider secures: ' + reality.providerSecures.join(', '));
console.log('You still own: ' + reality.youStillOwn.join(', '));`
          }
        ],
        exercises: [
          {
            prompt: 'Write sharedResponsibility(model) for the models "iaas", "paas" and "saas". Return an object with four fields: os, runtime, app, data. Each value is either "you" or "provider". Data is always "you". Under IaaS everything is yours. Under PaaS the provider owns os and runtime. Under SaaS the provider owns os, runtime and app. Unknown models behave like IaaS.',
            tests: [
              `sharedResponsibility('iaas').os === 'you'`,
              `sharedResponsibility('paas').os === 'provider'`,
              `sharedResponsibility('paas').runtime === 'provider'`,
              `sharedResponsibility('paas').app === 'you'`,
              `sharedResponsibility('saas').app === 'provider'`,
              `sharedResponsibility('saas').data === 'you'`,
              `sharedResponsibility('unknown').os === 'you'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'In the shared responsibility model, who protects your data and access rules?',
              choices: ['The provider only', 'You', 'Nobody, it is automatic'],
              answer: 'You'
            },
            {
              type: 'mcq',
              prompt: 'Which model removes the most operational work?',
              choices: ['IaaS', 'PaaS', 'SaaS'],
              answer: 'SaaS'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'IaaS vs PaaS vs SaaS by managed scope',
          'Security of the cloud vs security in the cloud',
          'You always own data and access'
        ],
        mistakeWatchlist: ['Assuming a managed service removes your security duty']
      },
      nextLesson: 'cloud-global-infra'
    },
    {
      id: 'cloud-global-infra',
      title: 'Regions, Availability Zones and Edge Locations',
      objectives: [
        'Distinguish regions, availability zones and edge locations',
        'Choose a region using latency, cost and compliance',
        'Design a deployment that survives one data centre failure'
      ],
      prerequisites: ['IaaS, PaaS, SaaS and Shared Responsibility'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Foundation drill. In Lesson 3 you read AWS_REGION from an environment variable. That value is not decoration. It decides where your data physically lives, which changes latency, price and what the law allows. Read it again before you continue.',
          'Why this matters. Cloud resources are not in one place. Where you put them decides how fast your app feels, what a single hardware failure does to you, and whether you are allowed to serve a particular customer.',
          'What the terms mean. A region is a geographic area, such as ap-south-1 in Mumbai. Inside a region are availability zones: physically separate data centres with independent power, cooling and networking. Edge locations are hundreds of smaller sites used by content delivery networks to cache content close to users.',
          'Mental model: a city, its districts, and its corner shops. The region is the city. Availability zones are districts that can lose power independently. Edge locations are corner shops that keep a copy of the popular item nearby.',
          'Availability zones exist so a single failure is survivable. If everything runs in one zone and that zone has a power event, your app is offline. Spread across two or more zones and the surviving zone keeps serving.',
          'Production insight. Region choice is a four-way trade-off: latency to users, price, data-residency law, and the availability of the specific services you need. Teams also avoid putting everything in a single region if the business requires regional failover, and they use edge caching to reduce both latency and origin load.'
        ],
        demos: [
          {
            code: `// Foundation drill: the region comes from configuration, not from code.
const env = { AWS_REGION: 'ap-south-1', USERS: 'India' };

function planDeployment(input) {
  const region = input.usersIn === 'India' ? 'ap-south-1' : 'us-east-1';
  const azs = input.mustSurviveOneDataCentreFailure
    ? [region + 'a', region + 'b']
    : [region + 'a'];
  return { region: region, azs: azs, edge: 'CloudFront' };
}

const resilient = planDeployment({ usersIn: env.USERS, mustSurviveOneDataCentreFailure: true });
const cheap = planDeployment({ usersIn: env.USERS, mustSurviveOneDataCentreFailure: false });

console.log('Resilient: ' + JSON.stringify(resilient));
console.log('Single zone: ' + JSON.stringify(cheap));
console.log('Cost goes up with zones; so does survival.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'What is the difference between a region and an availability zone?'
          },
          {
            type: 'apply',
            prompt: 'Your users are in India and the app must survive one data centre failure. Which region and how many zones, and why?'
          },
          {
            type: 'predict',
            prompt: 'You deploy to a single availability zone to save money. What do your users experience during a maintenance event in that zone?'
          }
        ],
        debugging: [
          {
            buggyCode: `// "One availability zone is enough and halves the cost."
const deployment = {
  region: 'eu-west-1',
  availabilityZones: ['eu-west-1a'],
  businessRequirement: 'must survive one data centre failure'
};
console.log('Meets requirement: true');`,
            hints: [
              'How many failure domains does this deployment tolerate?',
              'If the only zone has a power event, what happens?',
              'What is the smallest change that meets the stated requirement?'
            ],
            solution: `const deployment = {
  region: 'eu-west-1',
  // Two or more zones so one data centre failure does not take the app down.
  availabilityZones: ['eu-west-1a', 'eu-west-1b'],
  businessRequirement: 'must survive one data centre failure'
};
console.log('Failure domains tolerated: ' + (deployment.availabilityZones.length - 1));`
          }
        ],
        exercises: [
          {
            prompt: 'Write planDeployment(input) where input has usersIn and mustSurviveOneDataCentreFailure. If usersIn is "India" choose region "ap-south-1", otherwise choose "us-east-1". Return { region, azs } where azs has two zones (region + "a" and region + "b") when survival is required, and one zone otherwise.',
            tests: [
              `planDeployment({ usersIn: 'India', mustSurviveOneDataCentreFailure: true }).region === 'ap-south-1'`,
              `planDeployment({ usersIn: 'India', mustSurviveOneDataCentreFailure: true }).azs.length >= 2`,
              `planDeployment({ usersIn: 'India', mustSurviveOneDataCentreFailure: true }).azs.every(function (a) { return a.startsWith('ap-south-1'); })`,
              `planDeployment({ usersIn: 'India', mustSurviveOneDataCentreFailure: false }).azs.length === 1`,
              `planDeployment({ usersIn: 'Germany', mustSurviveOneDataCentreFailure: false }).region === 'us-east-1'`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which construct gives physical isolation inside a region?',
              choices: ['Edge location', 'Availability zone', 'IAM policy'],
              answer: 'Availability zone'
            },
            {
              type: 'mcq',
              prompt: 'Choosing a region is a trade-off between:',
              choices: ['Only price', 'Latency, price, law and service availability', 'Only latency'],
              answer: 'Latency, price, law and service availability'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'Regions vs availability zones vs edge locations',
          'Surviving a single data centre failure',
          'Latency, cost, compliance and service availability trade-offs'
        ],
        mistakeWatchlist: ['Deploying production to a single availability zone']
      },
      nextLesson: 'cloud-cost-controls'
    },
    {
      id: 'cloud-cost-controls',
      title: 'Cloud Cost: Pricing Models, Tags, Budgets and Cleanup',
      objectives: [
        'Explain on-demand, savings plan, reserved and spot pricing',
        'Use tags to attribute cost to a project',
        'Estimate the cost of a serverless workload',
        'Build a cost control habit set before creating resources'
      ],
      prerequisites: ['Regions, Availability Zones and Edge Locations'],
      timeEstimateMin: 35,
      content: {
        explanations: [
          'Foundation drill. In Lesson 1 you wrote evaluateBudget and learned the hard rule: alerts notify, they never enforce. Now we go one level deeper, into what actually creates the cost.',
          'Why this matters. In the cloud, cost is a design decision. Two architectures that behave identically can differ tenfold in price. If you cannot reason about cost, you will build something that works and cannot ship.',
          'The pricing models. On-demand charges by the second with no commitment. Savings plans and reserved capacity give a large discount in exchange for a one or three year commitment on a steady baseline. Spot pricing is very cheap but the provider may reclaim the capacity with little warning, so only interruptible work belongs there.',
          'Tags are how you find cost. A tag is a key and value attached to a resource, such as project=voicecode and owner=jayant. Without tags, a bill is one large number and nobody knows which team caused it. With tags, cost becomes attributable and therefore manageable.',
          'Mental model for serverless cost: a taxi meter. You are billed per request plus the memory your code used, multiplied by how long it ran. A slow function with generous memory is an expensive function, which is why performance tuning is also cost tuning.',
          'Production insight. The reliable cost control stack is: tag everything, set a budget alert at 85 percent actual and 100 percent forecast, review the largest line items monthly, delete unused resources, and treat every lab as reversible. Cost review is part of engineering review, not an accounting afterthought.'
        ],
        demos: [
          {
            code: `// Serverless pricing intuition, based on the request + GB-second model.
// Prices are illustrative; always check the current published rates.
const PRICE_PER_REQUEST = 0.0000002;
const PRICE_PER_GB_SECOND = 0.0000166667;

function lambdaCost(requests, avgMs, memoryMB) {
  const requestCost = requests * PRICE_PER_REQUEST;
  const gbSeconds = requests * (memoryMB / 1024) * (avgMs / 1000);
  return requestCost + gbSeconds * PRICE_PER_GB_SECOND;
}

const cheap = lambdaCost(1000000, 100, 128);
const slow = lambdaCost(1000000, 800, 128);
const fat = lambdaCost(1000000, 100, 1024);

console.log('1M fast calls, 128MB:  $' + cheap.toFixed(4));
console.log('1M slow calls, 128MB:  $' + slow.toFixed(4));
console.log('1M calls, 1024MB:      $' + fat.toFixed(4));
console.log('Tuning speed and memory is the same as tuning cost.');`,
            explainByLine: true
          }
        ],
        oralQuestions: [
          {
            type: 'recall',
            prompt: 'Which pricing model is cheapest but may be reclaimed by the provider, and what kind of work suits it?'
          },
          {
            type: 'apply',
            prompt: 'Your team shares one account. What tags would you require so you can tell each project apart on the bill?'
          },
          {
            type: 'predict',
            prompt: 'A function works correctly but runs for 800ms using 1GB of memory. What happens to its cost if you halve both?'
          }
        ],
        debugging: [
          {
            buggyCode: `// The monthly bill is far above expectation and nobody can explain it.
const resources = [
  { name: 'api-lambda', tags: {} },
  { name: 'old-test-database', tags: {} },
  { name: 'nat-gateway', tags: {} },
  { name: 'logs-bucket', tags: {} }
];
console.log('Ways to attribute this cost: 0');`,
            hints: [
              'Can you tell which project or owner caused each line item?',
              'Which of these resources might be left over from a finished task?',
              'What simple habit makes the next bill explainable?'
            ],
            solution: `// 1) Tag every resource so cost is attributable.
const resources = [
  { name: 'api-lambda', tags: { project: 'voicecode', owner: 'jayant', env: 'prod' } },
  { name: 'old-test-database', tags: { project: 'voicecode', owner: 'jayant', env: 'test' } },
  { name: 'nat-gateway', tags: { project: 'voicecode', owner: 'jayant', env: 'prod' } },
  { name: 'logs-bucket', tags: { project: 'voicecode', owner: 'jayant', env: 'prod' } }
];
// 2) Budget alert at 85% actual and 100% forecast.
// 3) Teardown checklist per lab: identify leftovers like the test database.
// 4) Review the top line items every month.
console.log('Untagged resources: 0');`
          }
        ],
        exercises: [
          {
            prompt: 'Write lambdaCost(requests, avgMs, memoryMB) using PRICE_PER_REQUEST = 0.0000002 and PRICE_PER_GB_SECOND = 0.0000166667. The request cost is requests times the request price. The compute cost is requests, times memoryMB divided by 1024, times avgMs divided by 1000, times the GB-second price. Return the total.',
            tests: [
              `lambdaCost(0, 100, 128) === 0`,
              `Math.abs(lambdaCost(1, 1000, 1024) - 0.0000168667) < 1e-9`,
              `lambdaCost(1000000, 200, 128) > 0`,
              `lambdaCost(1000, 100, 1024) > lambdaCost(1000, 100, 128)`,
              `lambdaCost(1000, 200, 128) > lambdaCost(1000, 100, 128)`
            ]
          }
        ],
        assessment: {
          questions: [
            {
              type: 'mcq',
              prompt: 'Which pricing model suits a steady, always-on baseline with a multi-year commitment?',
              choices: ['On-demand', 'Reserved or savings plan', 'Spot'],
              answer: 'Reserved or savings plan'
            },
            {
              type: 'mcq',
              prompt: 'Why are tags required for cost control?',
              choices: ['They make resources faster', 'They attribute cost to a project or owner', 'They are mandatory in AWS'],
              answer: 'They attribute cost to a project or owner'
            }
          ],
          passCriteria: { minCorrect: 1 }
        }
      },
      memoryUpdates: {
        conceptsMastered: [
          'On-demand vs savings plan vs reserved vs spot',
          'Tags attribute cost',
          'Serverless cost = requests + GB-seconds',
          'Cost review as engineering review'
        ],
        mistakeWatchlist: ['Untagged resources', 'Leaving lab resources running']
      },
      nextLesson: 'security-identity'
    }
  ]
};
