import { Course, Module } from './types';
import { CLOUD_PRACTICE } from './curriculum/cloud/practice';
import { LESSON_MODES } from './curriculum/cloud/lessonModes';
import { LESSON_FLOWS } from './curriculum/cloud/flows';
import { PHASE_0_MODULE } from './curriculum/cloud/phase0';
import { PHASE_1_MODULE } from './curriculum/cloud/phase1';
import { PHASE_2_MODULE } from './curriculum/cloud/phase2';
import { PHASE_3_MODULE } from './curriculum/cloud/phase3';
import { PHASE_4_MODULE } from './curriculum/cloud/phase4';
import { PHASE_5_MODULE } from './curriculum/cloud/phase5';
import { PHASE_6_MODULE } from './curriculum/cloud/phase6';
import { PHASE_7_MODULE } from './curriculum/cloud/phase7';
import { PHASE_8_MODULE } from './curriculum/cloud/phase8';

/**
 * The Cloud & Big Data Engineering course.
 *
 * Structure and sequencing come from CLOUD_BIG_DATA_COURSE_ARCHITECTURE.md.
 * Teaching method comes from EXPLANATION_AND_TEACHING_PLAYBOOK.md.
 *
 * 10 phases, 40 lessons, beginner to advanced, AWS-first and multi-cloud aware.
 */
export const CLOUD_BIG_DATA_COURSE: Course = {
  id: 'cloud-big-data-engineering',
  title: 'Cloud & Big Data Engineering',
  description:
    'Go from absolute beginner to a working cloud and data engineer. Start with cloud safety, HTTP and data literacy, then build serverless APIs, data lakes and streaming pipelines on AWS. Finish by grounding an AI tutor in your own data with Bedrock and retrieval-augmented generation.',
  level: 'Beginner to Advanced',
  totalDuration: '10 Weeks (40 Lessons)',
  outcomes: [
    'Explain cloud computing, regions, availability zones and the shared responsibility model',
    'Apply least-privilege IAM, encryption and network boundaries to real systems',
    'Choose compute, storage and database services from access patterns and trade-offs',
    'Build and debug a serverless API with API Gateway, Lambda and DynamoDB',
    'Design a partitioned S3 data lake and query it with Glue and Athena',
    'Process high-volume events with Kinesis and Firehose, handling duplicates and late data',
    'Operate systems with structured logs, user-facing alarms, backups and tested restores',
    'Ground an AI tutor on your own data with embeddings, retrieval and citations',
    'Estimate cost before building, and explain every architectural decision you make'
  ],
  prerequisites: [
    'No prior cloud or data engineering experience required',
    'Basic JavaScript syntax helps but is taught from scratch where needed',
    'A computer with internet access and a browser'
  ],
  modules: [
    PHASE_0_MODULE,
    PHASE_1_MODULE,
    PHASE_2_MODULE,
    PHASE_3_MODULE,
    PHASE_4_MODULE,
    PHASE_5_MODULE,
    PHASE_6_MODULE,
    PHASE_7_MODULE,
    PHASE_8_MODULE
  ].map((module: Module): Module => ({
    ...module,
    lessons: module.lessons.map((lesson) => ({
      ...lesson,
      mode: LESSON_MODES[lesson.id] ?? 'light',
      content: { ...lesson.content, flows: LESSON_FLOWS[lesson.id] }
    })),
    practice: CLOUD_PRACTICE[module.id]
  }))
};
