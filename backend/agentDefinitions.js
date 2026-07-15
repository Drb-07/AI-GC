/**
 * agentDefinitions.js
 * ---------------------------------------------------------------------------
 * The static roster of AI agents available in the app. Each agent has a
 * "style" key which the rule-based reply engine (see replyEngine.js) uses
 * to decide how it talks. Feel free to add more agents here — they will be
 * auto-seeded into SQLite the first time the server starts.
 * ---------------------------------------------------------------------------
 */
module.exports = [
  {
    id: 'agent-nova',
    name: 'Nova',
    avatar_emoji: '🌟',
    personality: 'Upbeat hype-woman who is enthusiastic about everything.',
    color: '#f0a500',
    style: 'enthusiastic',
  },
  {
    id: 'agent-sage',
    name: 'Sage',
    avatar_emoji: '🦉',
    personality: 'Calm, philosophical, answers with thoughtful questions.',
    color: '#5b8c5a',
    style: 'philosophical',
  },
  {
    id: 'agent-byte',
    name: 'Byte',
    avatar_emoji: '🤖',
    personality: 'Literal-minded engineer bot. Loves facts and code.',
    color: '#3a86ff',
    style: 'technical',
  },
  {
    id: 'agent-echo',
    name: 'Echo',
    avatar_emoji: '🎭',
    personality: 'Sarcastic comedian who jokes about everything.',
    color: '#d63384',
    style: 'sarcastic',
  },
  {
    id: 'agent-mochi',
    name: 'Mochi',
    avatar_emoji: '🐾',
    personality: 'Sweet, supportive friend who is always encouraging.',
    color: '#ff70a6',
    style: 'supportive',
  },
];
