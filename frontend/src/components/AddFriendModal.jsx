import React, { useState } from 'react';
import { api } from '../api';

const EMOJI_CHOICES = ['🤖', '🧠', '⚡', '✨', '🎯', '🛰️', '🔧', '🕵️', '📐', '🎨'];
const COLOR_CHOICES = ['#5865f2', '#7c4dff', '#10a37f', '#1a73e8', '#ff9800', '#ef4444', '#14b8a6', '#ec4899'];
const ENGINE_CHOICES = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
];
// Maps the chosen engine to a reply-engine "style" key so the agent still
// has sensible fallback behavior in the rule-based banter round.
const ENGINE_TO_STYLE = {
  'gpt-4o': 'technical',
  'gpt-4o-mini': 'enthusiastic',
  'gemini-1.5-pro': 'philosophical',
  'gemini-1.5-flash': 'supportive',
};

/**
 * AddFriendModal
 * ---------------------------------------------------------------------------
 * Lists every available agent and lets the user add/remove them as a
 * "friend" (adding a friend implicitly creates a 1:1 DM channel), and now
 * also lets the user create a brand-new custom agent from scratch via a
 * form right inside the modal. On creation we POST /api/agents, then
 * re-fetch the roster so the new agent shows up instantly.
 * ---------------------------------------------------------------------------
 */
export default function AddFriendModal({ agents, friendIds, onToggleFriend, onClose, onAgentsChanged }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    avatar_emoji: EMOJI_CHOICES[0],
    color: COLOR_CHOICES[0],
    engine: ENGINE_CHOICES[0].value,
    personality: '',
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateAgent(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Please give your agent a name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const newAgent = await api.createAgent({
        name: form.name.trim(),
        avatar_emoji: form.avatar_emoji,
        color: form.color,
        personality: form.personality.trim() || `A custom ${form.engine} agent.`,
        style: ENGINE_TO_STYLE[form.engine] || 'supportive',
        engine: form.engine,
      });

      // Re-fetch the full roster so the new agent appears instantly,
      // and immediately add it as a friend so it's ready to chat with.
      if (onAgentsChanged) {
        await onAgentsChanged();
      }
      if (newAgent?.id && onToggleFriend) {
        onToggleFriend(newAgent.id, false);
      }

      setForm({
        name: '',
        avatar_emoji: EMOJI_CHOICES[0],
        color: COLOR_CHOICES[0],
        engine: ENGINE_CHOICES[0].value,
        personality: '',
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create agent:', err);
      setError('Something went wrong creating that agent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Agent Friends</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <button
            className="btn-secondary"
            style={{ width: '100%', marginBottom: '12px' }}
            onClick={() => setShowCreateForm((v) => !v)}
          >
            {showCreateForm ? '▲ Hide Create Agent Form' : '➕ Create a Custom Agent'}
          </button>

          {showCreateForm && (
            <form className="create-agent-form" onSubmit={handleCreateAgent} style={{ marginBottom: '16px' }}>
              <div className="form-row">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Debugger Dan"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  maxLength={40}
                />
              </div>

              <div className="form-row">
                <label>Avatar Emoji</label>
                <div className="choice-grid">
                  {EMOJI_CHOICES.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      className={`choice-chip ${form.avatar_emoji === emoji ? 'choice-chip--selected' : ''}`}
                      onClick={() => updateField('avatar_emoji', emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label>Color</label>
                <div className="choice-grid">
                  {COLOR_CHOICES.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={`color-chip ${form.color === color ? 'color-chip--selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => updateField('color', color)}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label>Engine Model</label>
                <select value={form.engine} onChange={(e) => updateField('engine', e.target.value)}>
                  {ENGINE_CHOICES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Personality Prompt</label>
                <textarea
                  placeholder="Describe how this agent should think and respond..."
                  value={form.personality}
                  onChange={(e) => updateField('personality', e.target.value)}
                  rows={3}
                  maxLength={300}
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="agent-row-preview">
                <div className="mini-avatar" style={{ background: form.color }}>{form.avatar_emoji}</div>
                <div className="agent-info">
                  <div className="agent-name">{form.name || 'New Agent'}</div>
                  <div className="agent-personality">{form.personality || `Runs on ${form.engine}`}</div>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Agent'}
              </button>
            </form>
          )}

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
