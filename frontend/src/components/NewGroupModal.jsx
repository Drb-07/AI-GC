import React, { useState } from 'react';

/**
 * NewGroupModal
 * ---------------------------------------------------------------------------
 * Lets the user pick 2+ friended agents and a name to create a group chat
 * channel where all selected agents (and the user) can talk together.
 * ---------------------------------------------------------------------------
 */
export default function NewGroupModal({ friends, onCreate, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [name, setName] = useState('');

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (selected.size < 2) return;
    onCreate(name.trim() || 'New Group', Array.from(selected));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Group Chat</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <input
            className="text-input"
            placeholder="Group name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="hint">Pick at least 2 agent friends:</p>
          {friends.length === 0 && (
            <div className="empty-hint">Add some agent friends first!</div>
          )}
          {friends.map((agent) => (
            <div key={agent.id} className="agent-row">
              <input
                type="checkbox"
                checked={selected.has(agent.id)}
                onChange={() => toggle(agent.id)}
              />
              <div className="mini-avatar" style={{ background: agent.color }}>
                {agent.avatar_emoji}
              </div>
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
              </div>
            </div>
          ))}
          <button
            className="btn-primary full-width"
            disabled={selected.size < 2}
            onClick={handleCreate}
          >
            Create Group ({selected.size} selected)
          </button>
        </div>
      </div>
    </div>
  );
}
