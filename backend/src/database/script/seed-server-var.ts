import { ServerTypes } from '../types';

export type SeedServer = {
  name: string;
  slug: string;
  type: (typeof ServerTypes)[number];
  icon?: string;
  degreeSlug?: string;
  moduleTitle?: string;
};

export const DEFAULT_DEGREE_SLUG = 'bsc-hons-computer-science';

export const seedServers: SeedServer[] = [
  {
    name: 'Accenture School of Tech: Building Skills in Tech Transformation',
    slug: 'accenture-school-of-tech-building-skills-in-tech-transformation',
    type: 'unimodules',
  },
  {
    name: 'Advanced Databases',
    slug: 'advanced-databases',
    type: 'unimodules',
  },
  {
    name: 'Advanced Games Technology',
    slug: 'advanced-games-technology',
    type: 'unimodules',
  },
  {
    name: 'Advanced Programming \u2013 Concurrency',
    slug: 'advanced-programming-concurrency',
    type: 'unimodules',
  },
  {
    name: 'Agents and Multi Agents Systems',
    slug: 'agents-and-multi-agents-systems',
    type: 'unimodules',
  },
  {
    name: 'Cloud and Consultancy',
    slug: 'cloud-and-consultancy',
    type: 'unimodules',
  },
  {
    name: 'Cloud Computing',
    slug: 'cloud-computing',
    type: 'unimodules',
  },
  {
    name: 'Computer Graphics',
    slug: 'computer-graphics',
    type: 'unimodules',
  },
  {
    name: 'Computer Networks',
    slug: 'computer-networks',
    type: 'unimodules',
  },
  {
    name: 'Computer Science, Ethics & Society',
    slug: 'computer-science-ethics-society',
    type: 'unimodules',
  },
  {
    name: 'Computer Vision',
    slug: 'computer-vision',
    type: 'unimodules',
  },
  {
    name: 'Continuing Professional Development in IT',
    slug: 'continuing-professional-development-in-it',
    type: 'unimodules',
  },
  {
    name: 'Data Structures and Algorithms',
    slug: 'data-structures-and-algorithms',
    type: 'unimodules',
  },
  {
    name: 'Data Visualization',
    slug: 'data-visualization',
    type: 'unimodules',
  },
  {
    name: 'Databases',
    slug: 'databases',
    type: 'unimodules',
  },
  {
    name: 'Digital Signal Processing and Audio Programming',
    slug: 'digital-signal-processing-and-audio-programming',
    type: 'unimodules',
  },
  {
    name: 'Functional Programming',
    slug: 'functional-programming',
    type: 'unimodules',
  },
  {
    name: 'Games Technology',
    slug: 'games-technology',
    type: 'unimodules',
  },
  {
    name: 'Hewlett Packard Enterprise: Technology Consulting',
    slug: 'hewlett-packard-enterprise-technology-consulting',
    type: 'unimodules',
  },
  {
    name: 'Individual Project',
    slug: 'individual-project',
    type: 'unimodules',
  },
  {
    name: 'Information Retrieval',
    slug: 'information-retrieval',
    type: 'unimodules',
  },
  {
    name: 'Information Security Fundamentals',
    slug: 'information-security-fundamentals',
    type: 'unimodules',
  },
  {
    name: 'Introduction to Algorithms',
    slug: 'introduction-to-algorithms',
    type: 'unimodules',
  },
  {
    name: 'Introduction to Artificial Intelligence',
    slug: 'introduction-to-artificial-intelligence',
    type: 'unimodules',
  },
  {
    name: 'Language Processors',
    slug: 'language-processors',
    type: 'unimodules',
  },
  {
    name: 'Mathematics for Computing',
    slug: 'mathematics-for-computing',
    type: 'unimodules',
  },
  {
    name: 'Natural Language Processing',
    slug: 'natural-language-processing',
    type: 'unimodules',
  },
  {
    name: 'Object-Oriented Analysis and Design',
    slug: 'object-oriented-analysis-and-design',
    type: 'unimodules',
  },
  {
    name: 'Operating Systems',
    slug: 'operating-systems',
    type: 'unimodules',
  },
  {
    name: 'Principles of Artificial Intelligence',
    slug: 'principles-of-artificial-intelligence',
    type: 'unimodules',
  },
  {
    name: 'Professional Development in IT',
    slug: 'professional-development-in-it',
    type: 'unimodules',
  },
  {
    name: 'Programming and Mathematics for AI',
    slug: 'programming-and-mathematics-for-ai',
    type: 'unimodules',
  },
  {
    name: 'Programming in C++',
    slug: 'programming-in-c',
    type: 'unimodules',
  },
  {
    name: 'Programming in Java',
    slug: 'programming-in-java',
    type: 'unimodules',
  },
  {
    name: 'Project Management',
    slug: 'project-management',
    type: 'unimodules',
  },
  {
    name: 'Semantic Web Technologies and Knowledge Graphs',
    slug: 'semantic-web-technologies-and-knowledge-graphs',
    type: 'unimodules',
  },
  {
    name: 'Systems Architecture',
    slug: 'systems-architecture',
    type: 'unimodules',
  },
  {
    name: 'Team Project',
    slug: 'team-project',
    type: 'unimodules',
  },
  {
    name: 'Theory of Computation',
    slug: 'theory-of-computation',
    type: 'unimodules',
  },
  {
    name: 'User Centred Systems Design',
    slug: 'user-centred-systems-design',
    type: 'unimodules',
  },
  {
    name: 'Web Development',
    slug: 'web-development',
    type: 'unimodules',
  },
  {
    name: 'Work Based Project',
    slug: 'work-based-project',
    type: 'unimodules',
  },
];
