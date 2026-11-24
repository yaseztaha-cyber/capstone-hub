import type { ProjectStage } from '@/lib/types';

export interface TemplateMilestone {
  name: string;
  stage: string;
  officialDeadline: string;
}

export interface TemplateSource {
  title: string;
  authors: string;
  year: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  problemExamples: string[];
  milestones: TemplateMilestone[];
  researchSources: TemplateSource[];
  rubricCriteria: string[];
}

export const templates: ProjectTemplate[] = [
  {
    id: 'robotics-iot',
    name: 'Robotics & IoT',
    description: 'Arduino/Raspberry Pi, sensors, automation',
    icon: '🤖',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    problemExamples: [
      'Automating greenhouse monitoring using IoT sensors to optimize plant growth conditions',
      'Building an autonomous robot for home security patrol using computer vision',
      'Designing a smart waste management system that alerts collectors when bins are full',
    ],
    milestones: [
      { name: 'Research & Literature Review', stage: 'research', officialDeadline: '+1w' },
      { name: 'Problem Definition Complete', stage: 'research', officialDeadline: '+2w' },
      { name: 'System Architecture Design', stage: 'design', officialDeadline: '+3w' },
      { name: 'Component Selection & Procurement', stage: 'design', officialDeadline: '+4w' },
      { name: 'Hardware Assembly Complete', stage: 'prototype', officialDeadline: '+6w' },
      { name: 'Software Development Complete', stage: 'prototype', officialDeadline: '+7w' },
      { name: 'Integration Testing', stage: 'testing', officialDeadline: '+8w' },
      { name: 'Performance Analysis', stage: 'analysis', officialDeadline: '+9w' },
      { name: 'Documentation Complete', stage: 'documentation', officialDeadline: '+10w' },
      { name: 'Final Presentation', stage: 'presentation', officialDeadline: '+11w' },
    ],
    researchSources: [
      { title: 'Arduino Project Handbook', authors: 'Bill Dearborn', year: '2023' },
      { title: 'Internet of Things: A Hands-On Approach', authors: 'Behnaz Souri, Ashok Kumar', year: '2022' },
      { title: 'Raspberry Pi IoT Projects', authors: 'Gavin Me.nanoTime', year: '2023' },
      { title: 'Building Arduino Robots and Devices', authors: 'Sergey Skachkov', year: '2021' },
    ],
    rubricCriteria: [
      'Technical complexity of sensor integration',
      'Code quality and documentation',
      'Hardware design and assembly quality',
      'System reliability and error handling',
      'Innovation in IoT solution approach',
      'Real-world applicability and scalability',
    ],
  },
  {
    id: 'environmental-science',
    name: 'Environmental Science',
    description: 'Water quality, air quality, sustainability',
    icon: '🌿',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    problemExamples: [
      'Measuring and analyzing local water quality to identify contamination sources in the community',
      'Designing a cost-effective air quality monitoring system for school classrooms',
      'Creating a sustainable composting system to reduce school cafeteria food waste by 40%',
    ],
    milestones: [
      { name: 'Environmental Problem Identification', stage: 'research', officialDeadline: '+1w' },
      { name: 'Literature Review & Data Collection Plan', stage: 'research', officialDeadline: '+2w' },
      { name: 'Experimental Design Complete', stage: 'design', officialDeadline: '+3w' },
      { name: 'Field Sampling Setup', stage: 'design', officialDeadline: '+4w' },
      { name: 'Data Collection Complete', stage: 'prototype', officialDeadline: '+6w' },
      { name: 'Lab Analysis Complete', stage: 'prototype', officialDeadline: '+7w' },
      { name: 'Data Analysis & Visualization', stage: 'testing', officialDeadline: '+8w' },
      { name: 'Impact Assessment', stage: 'analysis', officialDeadline: '+9w' },
      { name: 'Report & Portfolio Draft', stage: 'documentation', officialDeadline: '+10w' },
      { name: 'Final Presentation & Poster', stage: 'presentation', officialDeadline: '+11w' },
    ],
    researchSources: [
      { title: 'Environmental Science: A Global Concern', authors: 'William Cunningham', year: '2022' },
      { title: 'Water Quality Monitoring Handbook', authors: 'Sylvia Swietokowski', year: '2021' },
      { title: 'Air Pollution: Its Origin and Control', authors: 'Kenneth Wark', year: '2023' },
    ],
    rubricCriteria: [
      'Scientific rigor of experimental methodology',
      'Quality and accuracy of data collection',
      'Statistical analysis and data visualization',
      'Environmental impact assessment depth',
      'Connection to real-world sustainability goals',
      'Quality of conclusions and recommendations',
    ],
  },
  {
    id: 'software-mobile',
    name: 'Software & Mobile',
    description: 'Web apps, mobile apps, AI/ML',
    icon: '💻',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    problemExamples: [
      'Building a mobile app that connects local volunteers with community service opportunities',
      'Creating an AI-powered study assistant that generates personalized practice quizzes',
      'Developing a web platform for students to collaborate on group projects with real-time editing',
    ],
    milestones: [
      { name: 'User Research & Requirements', stage: 'research', officialDeadline: '+1w' },
      { name: 'Problem Statement & Scope', stage: 'research', officialDeadline: '+2w' },
      { name: 'UI/UX Wireframes Complete', stage: 'design', officialDeadline: '+3w' },
      { name: 'Tech Stack & Architecture Design', stage: 'design', officialDeadline: '+4w' },
      { name: 'Core Features MVP', stage: 'prototype', officialDeadline: '+6w' },
      { name: 'UI Implementation Complete', stage: 'prototype', officialDeadline: '+7w' },
      { name: 'Integration & Unit Testing', stage: 'testing', officialDeadline: '+8w' },
      { name: 'User Acceptance Testing', stage: 'analysis', officialDeadline: '+9w' },
      { name: 'Technical Documentation', stage: 'documentation', officialDeadline: '+10w' },
      { name: 'Demo & Final Presentation', stage: 'presentation', officialDeadline: '+11w' },
    ],
    researchSources: [
      { title: 'Don\'t Make Me Think', authors: 'Steve Krug', year: '2023' },
      { title: 'Clean Code', authors: 'Robert C. Martin', year: '2022' },
      { title: 'The Lean Startup', authors: 'Eric Ries', year: '2021' },
      { title: 'Designing Data-Intensive Applications', authors: 'Martin Kleppmann', year: '2023' },
    ],
    rubricCriteria: [
      'Code quality and software engineering practices',
      'User interface design and usability',
      'Feature completeness relative to scope',
      'Testing coverage and bug management',
      'Technical documentation quality',
      'Scalability and maintainability considerations',
    ],
  },
  {
    id: 'biomedical',
    name: 'Biomedical',
    description: 'Health monitoring, medical devices',
    icon: '🏥',
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    problemExamples: [
      'Designing a low-cost pulse oximeter for community health screening in underserved areas',
      'Building a wearable posture monitor that alerts users to ergonomic risks',
      'Creating a medication reminder system for elderly patients with visual and auditory alerts',
    ],
    milestones: [
      { name: 'Clinical Problem Research', stage: 'research', officialDeadline: '+1w' },
      { name: 'Stakeholder Needs Assessment', stage: 'research', officialDeadline: '+2w' },
      { name: 'Device Design Specification', stage: 'design', officialDeadline: '+3w' },
      { name: 'Safety & Compliance Review', stage: 'design', officialDeadline: '+4w' },
      { name: 'Prototype Construction', stage: 'prototype', officialDeadline: '+6w' },
      { name: 'Calibration & Validation', stage: 'prototype', officialDeadline: '+7w' },
      { name: 'Clinical Testing Protocol', stage: 'testing', officialDeadline: '+8w' },
      { name: 'Results & Comparative Analysis', stage: 'analysis', officialDeadline: '+9w' },
      { name: 'Regulatory Documentation', stage: 'documentation', officialDeadline: '+10w' },
      { name: 'Final Presentation & Demo', stage: 'presentation', officialDeadline: '+11w' },
    ],
    researchSources: [
      { title: 'Biomedical Engineering Fundamentals', authors: 'John Enderle', year: '2023' },
      { title: 'Medical Device Design', authors: 'Bogdan Ionescu', year: '2022' },
      { title: 'Wearable Biosensors', authors: 'Jason Heikenfeld', year: '2021' },
    ],
    rubricCriteria: [
      'Understanding of biomedical principles',
      'Safety and regulatory compliance awareness',
      'Device accuracy and calibration quality',
      'User-centered design approach',
      'Clinical validation methodology',
      'Ethical considerations in health technology',
    ],
  },
  {
    id: 'renewable-energy',
    name: 'Renewable Energy',
    description: 'Solar, wind, energy efficiency',
    icon: '⚡',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    problemExamples: [
      'Designing a portable solar-powered charging station for outdoor emergency communications',
      'Building a small-scale wind turbine for residential battery backup power',
      'Creating an energy efficiency monitoring system for school buildings to reduce power consumption',
    ],
    milestones: [
      { name: 'Energy Problem Research', stage: 'research', officialDeadline: '+1w' },
      { name: 'Feasibility Study & Calculations', stage: 'research', officialDeadline: '+2w' },
      { name: 'Energy System Design', stage: 'design', officialDeadline: '+3w' },
      { name: 'Component Selection & Budget', stage: 'design', officialDeadline: '+4w' },
      { name: 'System Assembly Complete', stage: 'prototype', officialDeadline: '+6w' },
      { name: 'Control System Implementation', stage: 'prototype', officialDeadline: '+7w' },
      { name: 'Performance Testing', stage: 'testing', officialDeadline: '+8w' },
      { name: 'Efficiency Analysis & Optimization', stage: 'analysis', officialDeadline: '+9w' },
      { name: 'Technical & Financial Report', stage: 'documentation', officialDeadline: '+10w' },
      { name: 'Final Presentation', stage: 'presentation', officialDeadline: '+11w' },
    ],
    researchSources: [
      { title: 'Renewable Energy: Power for a Sustainable Future', authors: 'Stephen Peake', year: '2023' },
      { title: 'Solar Energy Engineering', authors: 'Soteris Kalogirou', year: '2022' },
      { title: 'Wind Energy Explained', authors: 'J.F. Manwell', year: '2021' },
      { title: 'Energy Systems Engineering', authors: 'Fiona Browse', year: '2023' },
    ],
    rubricCriteria: [
      'Energy calculations and efficiency analysis',
      'System design and engineering principles',
      'Cost-benefit analysis depth',
      'Environmental impact assessment',
      'Prototype performance vs. design specs',
      'Sustainability and scalability evaluation',
    ],
  },
  {
    id: 'civil-architecture',
    name: 'Civil & Architecture',
    description: 'Structural design, smart buildings',
    icon: '🏗️',
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    problemExamples: [
      'Designing an earthquake-resistant structure using base isolation for a model building',
      'Creating a smart classroom prototype with automated lighting, ventilation, and occupancy sensing',
      'Building a scale model bridge that maximizes load capacity while minimizing material cost',
    ],
    milestones: [
      { name: 'Site & Problem Analysis', stage: 'research', officialDeadline: '+1w' },
      { name: 'Building Codes & Standards Review', stage: 'research', officialDeadline: '+2w' },
      { name: 'Architectural Design Concepts', stage: 'design', officialDeadline: '+3w' },
      { name: 'Structural Engineering Calculations', stage: 'design', officialDeadline: '+4w' },
      { name: 'Physical/Digital Model Construction', stage: 'prototype', officialDeadline: '+6w' },
      { name: 'Smart Systems Integration', stage: 'prototype', officialDeadline: '+7w' },
      { name: 'Load Testing & Simulation', stage: 'testing', officialDeadline: '+8w' },
      { name: 'Structural Analysis Report', stage: 'analysis', officialDeadline: '+9w' },
      { name: 'Technical Drawings & Documentation', stage: 'documentation', officialDeadline: '+10w' },
      { name: 'Final Presentation & Exhibition', stage: 'presentation', officialDeadline: '+11w' },
    ],
    researchSources: [
      { title: 'Structural Analysis', authors: 'Russell Hibbeler', year: '2023' },
      { title: 'Architecture: Form, Space, and Order', authors: 'Francis Ching', year: '2022' },
      { title: 'Smart Buildings: Advanced Technologies', authors: 'Dickson Despommier', year: '2021' },
    ],
    rubricCriteria: [
      'Structural integrity and engineering soundness',
      'Architectural design creativity and functionality',
      'Material efficiency and cost optimization',
      'Building code and safety compliance',
      'Smart system integration quality',
      'Sustainability and environmental design',
    ],
  },
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return templates.find(t => t.id === id);
}
