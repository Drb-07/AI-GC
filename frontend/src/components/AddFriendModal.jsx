import React from 'react';

/**
 * AddFriendModal
 * ---------------------------------------------------------------------------
 * Lists every available agent and lets the user add/remove them as a
 * "friend". Adding a friend automatically creates a 1:1 DM channel.
 * ---------------------------------------------------------------------------
 */
export default function AddFriendModal({ agents, friendIds, onToggleFriend, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Agent Friends</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {agents.map((agent) => {
            const isFriend = friendIds.has(agent.id);
            return (
              <div key={agent.id} className="agent-row">
                <div className="mini-avatar" style={{ background: agent.color }}>
                  {agent.avatar_emoji}
                </div>
                <div className="agent-info">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-personality">{agent.personality}</div>
                </div>
                <button
                  className={isFriend ? 'btn-secondary' : 'btn-primary'}
                  onClick={() => onToggleFriend(agent.id, isFriend)}
                >
                  {isFriend ? 'Remove' : 'Add Friend'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
