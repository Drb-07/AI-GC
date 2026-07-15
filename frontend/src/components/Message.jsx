import React from 'react';

/**
 * Message
 * ---------------------------------------------------------------------------
 * Renders a single chat message, styled differently depending on whether
 * it was sent by the user or by an AI agent.
 * ---------------------------------------------------------------------------
 */
export default function Message({ message, agentLookup }) {
  const isUser = message.sender_id === 'user-1';
  const agent = agentLookup[message.sender_id];
  const avatarColor = isUser ? '#5865f2' : agent?.color || '#777';
  const avatarEmoji = isUser ? '🧑' : agent?.avatar_emoji || '🤖';

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="message-row">
      <div className="avatar" style={{ background: avatarColor }}>
        {avatarEmoji}
      </div>
      <div className="message-body">
        <div className="message-meta">
          <span className={`sender-name ${isUser ? 'user' : 'agent'}`}>
            {message.sender_name}
          </span>
          <span className="timestamp">{time}</span>
        </div>
        <div className="message-content">{message.content}</div>
      </div>
    </div>
  );
}
