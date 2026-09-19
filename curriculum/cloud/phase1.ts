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
      title: 'Why cloud exists: renting instead of buying',
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
          'Quick recap. In lesson 3 you pulled a value from an environment variable. We\'re doing that again here, because every cloud workload is really sized by some config value you can tweak without touching code.',
          'Picture your app busy from 6pm to 9pm and dead quiet at 4am. Buy servers for the evening peak and they\'ll sit idle most of the day. Buy for the average and users get errors when it matters. That\'s the capacity problem, and with hardware you own there isn\'t a clean answer.',
          'Cloud just lets you rent machines by the second instead of buying them. You pay for what you actually use, you can add or drop capacity in minutes, and someone else handles the building, power and repairs.',
          'It\'s a lot like electricity. A factory could run its own generator sized for its busiest day and waste fuel the rest of the year. Or it plugs into the grid and pays for the kilowatts it actually draws. Cloud is the grid for computing. Pretty boring analogy, but it sticks.',
          'Elasticity is the clever bit. Capacity follows demand instead of sitting fixed. Over-provisioning burns money, under-provisioning breaks things. With elasticity you can be roughly right and nudge it, instead of being exactly wrong forever.',
          'You\'ll often see teams mix payment styles to fit the demand shape. Spiky, unpredictable work stays pay-as-you-go. The steady baseline goes on reserved or savings plans for the discount. Interruptible batch jobs jump on spot capacity. The knack is figuring out what\'s steady and what\'s spiky in your workload.'
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
      title: 'IaaS, PaaS, SaaS and shared responsibility',
      objectives: [
        'Distinguish IaaS, PaaS and SaaS by how much you manage',
        'Apply the shared responsibility model to real services',
        'Identify what you always own, no matter the model'
      ],
      prerequisites: ['Why Cloud Exists: Renting Instead of Buying'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'You already wrote isRetryable in lesson 2, that call-again judgment. Now we use a similar instinct but for ownership, when something breaks, who fixes it?',
          'The same app can be built three ways on the same cloud, and the choice changes how much you operate, how much you pay, and how much control you keep. Pick the wrong level and you\'ll either do pointless ops work or lose control you actually needed.',
          'A handy way to picture it is dinner. IaaS is renting a kitchen and buying ingredients yourself. PaaS is a meal kit where the recipe is done and ingredients are portioned. SaaS is just ordering takeaway. Each step removes work and you trade away control at the same time.',
          'More concretely, Infrastructure as a Service gives you virtual machines, networks and storage. You patch the OS and everything above. Platform as a Service gives you a runtime that runs your code, the provider patches the OS and runtime for you. Software as a Service is just finished software you log into.',
          'Here\'s where people slip up. The provider handles security of the cloud, the buildings, hardware, network and the managed service itself. You handle security in the cloud, your data, your access rules, your config. Moving to PaaS or SaaS shrinks your side, never wipes it out.',
          'No matter the model, three things stay yours. Your data, your identities and your access decisions. A database provider won\'t decide who gets to read your customer table. That\'s why IAM and encryption are always on you.'
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
      title: 'Regions, availability zones and edge locations',
      objectives: [
        'Distinguish regions, availability zones and edge locations',
        'Choose a region using latency, cost and compliance',
        'Design a deployment that survives one data centre failure'
      ],
      prerequisites: ['IaaS, PaaS, SaaS and Shared Responsibility'],
      timeEstimateMin: 30,
      content: {
        explanations: [
          'Remember AWS_REGION from lesson 3? That variable isn\'t decoration, it decides where your data physically lives. That changes how fast things feel, what they cost, and what you\'re legally allowed to do, so read it again before you move on.',
          'Cloud resources aren\'t all in one place. Where you put them decides how snappy your app feels, what a single hardware failure does, and whether you can even serve a given customer under local law.',
          'A region is a geographic area, like ap-south-1 in Mumbai. Inside each region you\'ve got availability zones, separate data centres with their own power, cooling and networking. Edge locations are different, they\'re hundreds of small sites that content delivery networks use to cache stuff close to users.',
          'If it helps, think city analogy. Region is the city, availability zones are districts that can lose power independently, edge locations are corner shops that keep the popular items nearby. The shop helps with speed, the districts help with survival.',
          'That split exists so one failure doesn\'t take you down. Run everything in a single zone and a power event there means you\'re offline. Spread across two or more and the survivor keeps serving. It\'s a pretty straightforward trade, a bit more cost for actual fault tolerance.',
          'Picking a region is a balancing act. You\'re weighing latency to your users, price in that region, data residency rules, and whether the services you need are even available there. You might also keep edge caching in the mix to cut both latency and load on the origin, and avoid piling everything into one region if the business needs a fallback.'
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
      title: 'Cloud cost: pricing models, tags, budgets and cleanup',
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
          'You already built evaluateBudget in lesson 1 and saw alerts just notify. Now we dig into what actually creates the cost in the first place.',
          'In the cloud, cost is a design choice. Two architectures that behave the same can differ tenfold in price. If you can\'t reason about cost, you might ship something that works perfectly and still can\'t make sense financially.',
          'There are four main ways you pay. On-demand bills by the second with no commitment. Savings plans and reserved capacity give you a big discount for a one or three year promise on the steady part. Spot is super cheap but the provider can take it back with short notice, so only put interruptible work there.',
          'Tags are how you figure out where the money went. They\'re just a key and value on a resource, like project=ecosystem and owner=jayant. Without them the bill is one big number and no one knows which team caused it. With them, cost becomes attributable and therefore manageable.',
          'Serverless cost feels like a taxi meter. You pay per request plus memory multiplied by how long it ran. A slow function with generous memory is an expensive function. That\'s why tuning performance is also tuning cost, they\'re the same lever.',
          'A solid routine looks like this: tag everything, set that 85 percent actual and 100 percent forecast alert, eyeball the biggest line items each month, delete what you\'re not using, and treat every lab as reversible. It\'s an engineering review thing, not an accounting afterthought.'
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
  { name: 'api-lambda', tags: { project: 'ecosystem', owner: 'jayant', env: 'prod' } },
  { name: 'old-test-database', tags: { project: 'ecosystem', owner: 'jayant', env: 'test' } },
  { name: 'nat-gateway', tags: { project: 'ecosystem', owner: 'jayant', env: 'prod' } },
  { name: 'logs-bucket', tags: { project: 'ecosystem', owner: 'jayant', env: 'prod' } }
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
