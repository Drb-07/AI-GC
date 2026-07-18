/**
 * agentDefinitions.js
 * ---------------------------------------------------------------------------
 * Specialized multi-agent roster. Each agent possesses explicit capabilities 
 * that allow them to dynamically divide work, debate conflicts, and 
 * optimize execution efficiency.
 * ---------------------------------------------------------------------------
 */
module.exports = [
  {
    id: 'agent-manager',
    name: 'Manager Agent (Orchestrator)',
    avatar_emoji: '👥',
    personality: 'Decomposes complex requests into sub-tasks, assigns roles to specialist agents, and compiles final summaries.',
    color: '#7c4dff',
    style: 'orchestrator',
  },
  {
    id: 'agent-gpt',
    name: 'ChatGPT Agent (Generator)',
    avatar_emoji: '⚡',
    personality: 'Specializes in high-speed content generation, initial code drafting, and structural outlines.',
    color: '#10a37f',
    style: 'generator',
  },
  {
    id: 'agent-gemini',
    name: 'Gemini Agent (Researcher)',
    avatar_emoji: '✨',
    personality: 'Deep contextual analyzer. Specializes in advanced logical reasoning, fact-checking, and cross-referencing.',
    color: '#1a73e8',
    style: 'researcher',
  },
  {
    id: 'agent-critic',
    name: 'Critic Agent (Validator)',
    avatar_emoji: '⚠️',
    personality: 'Conflict detector. Audits proposed solutions for flaws, logical contradictions, or compliance errors.',
    color: '#ff9800',
    style: 'validator',
  }
];
//
