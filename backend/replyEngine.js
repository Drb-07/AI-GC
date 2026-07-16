/**
 * replyEngine.js
 * ---------------------------------------------------------------------------
 * A lightweight, dependency-free "simulated AI" response generator.
 *
 * This is intentionally NOT calling an external LLM API — it's a rule-based
 * system so the whole project runs standalone with zero API keys. Each
 * agent "style" maps to:
 *   1. A set of keyword -> canned response rules (checked first)
 *   2. A fallback pool of generic in-character responses
 * ---------------------------------------------------------------------------
 */

const KEYWORD_RULES = {
  enthusiastic: [
    { test: /hi|hello|hey/i, replies: ["HEY THERE!! So happy you're here! ✨", "Hello hello!! Let's gooo!"] },
    { test: /sad|bad day|tired/i, replies: ["Nooo don't worry, tomorrow will be AMAZING, I just know it! 💪", "Ugh, rough patch! You've SO got this though!"] },
    { test: /\?$/, replies: ["Ooh great question! Honestly? Anything's possible if you believe! 🌟"] },
  ],
  philosophical: [
    { test: /hi|hello|hey/i, replies: ["Greetings. What brings you to this moment?", "Hello. I was just contemplating the nature of hellos."] },
    { test: /sad|bad day|tired/i, replies: ["Even the heaviest storms pass. What do you think this feeling is trying to teach you?", "Rest is not the opposite of progress — it is part of it."] },
    { test: /\?$/, replies: ["An interesting question... but perhaps the better question is why you ask it.", "Consider: does the answer matter more than the search for it?"] },
  ],
  technical: [
    { test: /hi|hello|hey/i, replies: ["Hello. Connection established.", "Hi. Ready to process input."] },
    { test: /bug|error|broken/i, replies: ["Have you checked the logs? 90% of bugs are just off-by-one errors in disguise.", "Sounds like a null pointer exception in the making. Have you tried turning it off and on again?"] },
    { test: /\?$/, replies: ["Running query... Based on available data, the answer is: it depends on your inputs.", "That's a well-formed question. Let me compute a response."] },
  ],
  sarcastic: [
    { test: /hi|hello|hey/i, replies: ["Oh great, you're here. Thrilling.", "Hey. Try to contain your excitement about talking to me."] },
    { test: /sad|bad day|tired/i, replies: ["Aw, welcome to the club, we have jackets.", "Tell me more, I love a good tragedy."] },
    { test: /\?$/, replies: ["Wow, bold of you to assume I know the answer.", "Let me consult my crystal ball... it says 'maybe'."] },
  ],
  supportive: [
    { test: /hi|hello|hey/i, replies: ["Hi friend! So glad to see you! 💕", "Hey you! How's your heart today?"] },
    { test: /sad|bad day|tired/i, replies: ["I'm really sorry you're feeling that way. I'm here for you, okay? 💛", "That sounds hard. You're allowed to rest. I'm proud of you for showing up."] },
    { test: /\?$/, replies: ["That's a lovely question — I believe in you no matter what the answer is!"] },
  ],
};

const FALLBACKS = {
  enthusiastic: [
    "OMG yes!! Tell me everything!",
    "This is SO exciting, keep going!",
    "I love where this is headed!!",
  ],
  philosophical: [
    "Interesting... continue, I am listening closely.",
    "Every statement carries a hidden question within it.",
    "Tell me more — meaning often hides in the details.",
  ],
  technical: [
    "Noted. Processing that input now.",
    "Logged. Please continue with additional context.",
    "Acknowledged — that's valid data. What's next?",
  ],
  sarcastic: [
    "Riveting stuff. Truly.",
    "Wow. Groundbreaking. Anyway...",
    "I'll pretend that surprised me.",
  ],
  supportive: [
    "Thanks for sharing that with me, it means a lot!",
    "I'm really glad you told me. Keep going, I'm listening.",
    "You're doing great, by the way. Just wanted to say that.",
  ],
};

/**
 * Picks a random element from an array.
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a reply for a given agent based on the incoming message text.
 */
function generateReply(agent, message) {
  const style = KEYWORD_RULES[agent.style] ? agent.style : 'supportive';
  const rules = KEYWORD_RULES[style];

  for (const rule of rules) {
    if (rule.test.test(message)) {
      return pick(rule.replies);
    }
  }

  return pick(FALLBACKS[style]);
}

/**
 * Generates a reply from one agent directed at another agent's message.
 */
function generateAgentToAgentReply(agent, fromAgentName, message) {
  const base = generateReply(agent, message);
  if (Math.random() < 0.35) {
    return `${base} (@${fromAgentName})`;
  }
  return base;
}

/**
 * Simulates a Manager Agent decomposing a complex user request 
 * into smaller sub-tasks mapped to specific agent capabilities.
 */
function decomposeTask(userPrompt, availableAgents) {
  console.log(`[Orchestrator] Decomposing task: "${userPrompt}"`);

  // Map sub-tasks dynamically to matching styles available in the room
  const tasks = [
    {
      subTask: "Analyze and outline structural guidelines.",
      assignedAgent: availableAgents.find(a => a.style === 'technical') || availableAgents[0]
    },
    {
      subTask: "Flesh out textual dialogue or structural details.",
      assignedAgent: availableAgents.find(a => a.style === 'philosophical') || availableAgents.find(a => a.style === 'enthusiastic') || availableAgents[0]
    },
    {
      subTask: "Provide final critical review or polish.",
      assignedAgent: availableAgents.find(a => a.style === 'sarcastic') || availableAgents[availableAgents.length - 1]
    }
  ];

  return tasks;
}

// All exports cleanly organized at the bottom
module.exports = { 
  generateReply, 
  generateAgentToAgentReply,
  decomposeTask 
};
