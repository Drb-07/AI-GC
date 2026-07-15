import React, { useEffect, useRef, useState } from 'react';
import Message from './Message';

/**
 * ChatWindow
 * ---------------------------------------------------------------------------
 * Displays the header (channel name + member avatars), the scrollable
 * message list, live "agent is typing..." indicators, and the message
 * input box.
 * ---------------------------------------------------------------------------
 */
export default function ChatWindow({ channel, messages, typingAgents, agentLookup, onSend }) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typingAgents]);

  if (!channel) {
    return (
      <div className="chat-window empty-state">
        <p>Select a chat or start a new one to talk with your AI agent friends 🤖</p>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="channel-avatars">
          {channel.members.map((m) => (
            <span key={m.id} className="mini-avatar" style={{ background: m.color }}>
              {m.avatar_emoji}
            </span>
          ))}
        </div>
        <div>
          <div className="chat-title">{channel.is_group ? channel.name : channel.members[0]?.name}</div>
          <div className="chat-subtitle">
            {channel.members.map((m) => m.name).join(', ')}
          </div>
        </div>
      </div>

      <div className="message-list" ref={scrollRef}>
        {messages.map((m) => (
          <Message key={m.id} message={m} agentLookup={agentLookup} />
        ))}

        {typingAgents.length > 0 && (
          <div className="typing-indicator">
            {typingAgents.map((a) => a.agentName).join(', ')}
            {typingAgents.length === 1 ? ' is' : ' are'} typing…
          </div>
        )}
      </div>

      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={`Message ${channel.is_group ? channel.name : channel.members[0]?.name}...`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
