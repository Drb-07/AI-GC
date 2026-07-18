import React from 'react';

/**
 * Sidebar
 * ---------------------------------------------------------------------------
 * Discord-style left sidebar. Lists all channels (DMs + group chats) the
 * user currently has, plus buttons to open the "Add Friend" and
 * "New Group Chat" modals.
 * ---------------------------------------------------------------------------
 */
export default function Sidebar({
  channels,
  activeChannelId,
  onSelectChannel,
  onOpenAddFriend,
  onOpenNewGroup,
  currentUser,
  onLogout,
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="logo">🤖 AgentCord</span>
      </div>

      <div className="sidebar-actions">
        <button className="sidebar-btn" onClick={onOpenAddFriend}>
          ➕ Add Agent Friend
        </button>
        <button className="sidebar-btn" onClick={onOpenNewGroup}>
          👥 New Group Chat
        </button>
      </div>

      <div className="sidebar-section-label">CHATS</div>
      <div className="channel-list">
        {channels.length === 0 && (
          <div className="empty-hint">No chats yet — add a friend to start!</div>
        )}
        {channels.map((c) => (
          <div
            key={c.id}
            className={`channel-item ${c.id === activeChannelId ? 'active' : ''}`}
            onClick={() => onSelectChannel(c.id)}
          >
            <div className="channel-avatars">
              {c.members.slice(0, 3).map((m) => (
                <span
                  key={m.id}
                  className="mini-avatar"
                  style={{ background: m.color }}
                >
                  {m.avatar_emoji}
                </span>
              ))}
            </div>
            <div className="channel-name">
              {c.is_group ? c.name : c.members[0]?.name}
            </div>
          </div>
        ))}
      </div>

      {currentUser && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-name">{currentUser.name}</div>
            <div className="sidebar-user-email">{currentUser.email}</div>
          </div>
          <button className="sidebar-btn sidebar-logout" onClick={onLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
