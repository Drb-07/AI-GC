/* ---------------------------------------------------------------------------
   Global Discord-inspired dark theme
--------------------------------------------------------------------------- */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: #313338;
  color: #dbdee1;
}

.app {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* ---- Sidebar -------------------------------------------------------------- */
.sidebar {
  width: 280px;
  background: #2b2d31;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1e1f22;
}

.sidebar-header {
  padding: 16px;
  font-weight: 700;
  font-size: 18px;
  border-bottom: 1px solid #1e1f22;
  color: #fff;
}

.sidebar-actions {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-btn {
  background: #404249;
  color: #dbdee1;
  border: none;
  border-radius: 6px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.sidebar-btn:hover {
  background: #4b4d53;
}

.sidebar-section-label {
  padding: 8px 16px 4px;
  font-size: 12px;
  font-weight: 700;
  color: #949ba4;
  letter-spacing: 0.02em;
}

.channel-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 2px;
}

.channel-item:hover {
  background: #35373c;
}

.channel-item.active {
  background: #404249;
  color: #fff;
}

.channel-avatars {
  display: flex;
}

.mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-left: -8px;
  border: 2px solid #2b2d31;
}

.mini-avatar:first-child {
  margin-left: 0;
}

.channel-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-hint {
  color: #949ba4;
  font-size: 13px;
  padding: 12px;
  text-align: center;
}

/* ---- Chat window ------------------------------------------------------- */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #313338;
}

.chat-window.empty-state {
  align-items: center;
  justify-content: center;
  color: #949ba4;
  font-size: 15px;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #1e1f22;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.15);
}

.chat-title {
  font-weight: 700;
  color: #fff;
  font-size: 16px;
}

.chat-subtitle {
  font-size: 12px;
  color: #949ba4;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.message-row {
  display: flex;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.message-body {
  display: flex;
  flex-direction: column;
}

.message-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sender-name {
  font-weight: 600;
  font-size: 14px;
}

.sender-name.user {
  color: #5865f2;
}

.sender-name.agent {
  color: #f2a33d;
}

.timestamp {
  font-size: 11px;
  color: #949ba4;
}

.message-content {
  font-size: 15px;
  line-height: 1.4;
  color: #dbdee1;
  white-space: pre-wrap;
}

.typing-indicator {
  font-size: 13px;
  font-style: italic;
  color: #949ba4;
  padding-left: 52px;
}

.message-input-form {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #1e1f22;
}

.message-input-form input {
  flex: 1;
  background: #383a40;
  border: none;
  border-radius: 8px;
  padding: 12px 14px;
  color: #dbdee1;
  font-size: 14px;
}

.message-input-form input:focus {
  outline: 2px solid #5865f2;
}

.message-input-form button {
  background: #5865f2;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0 18px;
  cursor: pointer;
  font-weight: 600;
}

.message-input-form button:hover {
  background: #4752c4;
}

/* ---- Modals -------------------------------------------------------------- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal {
  background: #313338;
  width: 420px;
  max-height: 80vh;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #1e1f22;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: #949ba4;
  font-size: 18px;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.agent-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #3a3c42;
}

.agent-info {
  flex: 1;
}

.agent-name {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
}

.agent-personality {
  font-size: 12px;
  color: #949ba4;
}

.btn-primary {
  background: #5865f2;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.btn-primary:disabled {
  background: #4b4d53;
  cursor: not-allowed;
}

.btn-secondary {
  background: #4b4d53;
  color: #dbdee1;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
}

.full-width {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
}

.text-input {
  width: 100%;
  background: #383a40;
  border: none;
  border-radius: 6px;
  padding: 10px 12px;
  color: #dbdee1;
  margin-bottom: 12px;
  font-size: 14px;
}

.hint {
  font-size: 13px;
  color: #949ba4;
  margin: 8px 0;
}

/* ---------------------------------------------------------------------
   Auth page (login/signup)
--------------------------------------------------------------------- */
.app-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #949ba4;
  background: #1e1f22;
  font-size: 15px;
}

.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #1e1f22;
}

.auth-card {
  width: 360px;
  max-width: 90vw;
  background: #2b2d31;
  border-radius: 10px;
  padding: 32px 28px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.auth-card h1 {
  color: #fff;
  font-size: 22px;
  margin: 0 0 4px;
  text-align: center;
}

.auth-subtitle {
  color: #949ba4;
  font-size: 14px;
  text-align: center;
  margin: 0 0 20px;
}

.auth-switch {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: #00a8fc;
  font-size: 13px;
  margin-top: 14px;
  cursor: pointer;
  text-align: center;
}

.auth-switch:hover {
  text-decoration: underline;
}

/* ---------------------------------------------------------------------
   Generic form rows (used by AuthPage + AddFriendModal create-agent form)
--------------------------------------------------------------------- */
.form-row {
  margin-bottom: 14px;
}

.form-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #949ba4;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.form-row input,
.form-row select,
.form-row textarea {
  width: 100%;
  background: #383a40;
  border: 1px solid #1e1f22;
  border-radius: 6px;
  padding: 10px 12px;
  color: #dbdee1;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
}

.form-row input:focus,
.form-row select:focus,
.form-row textarea:focus {
  outline: none;
  border-color: #00a8fc;
}

.form-row textarea {
  resize: vertical;
}

.form-error {
  background: rgba(237, 66, 69, 0.15);
  color: #f77;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  margin-bottom: 14px;
}

/* ---------------------------------------------------------------------
   Create-agent form chips (AddFriendModal)
--------------------------------------------------------------------- */
.choice-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.choice-chip {
  background: #383a40;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 18px;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.choice-chip--selected {
  border-color: #00a8fc;
}

.color-chip {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-chip--selected {
  border-color: #fff;
}

.agent-row-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #232428;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

/* ---------------------------------------------------------------------
   Sidebar footer (logged-in user + logout)
--------------------------------------------------------------------- */
.sidebar-footer {
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid #1e1f22;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sidebar-user-name {
  color: #dbdee1;
  font-size: 13px;
  font-weight: 600;
}

.sidebar-user-email {
  color: #949ba4;
  font-size: 11px;
}

.sidebar-logout {
  flex-shrink: 0;
  padding: 6px 10px;
  font-size: 12px;
}
