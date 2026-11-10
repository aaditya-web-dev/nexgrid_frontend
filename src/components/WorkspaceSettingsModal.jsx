import React, { useState } from 'react';
import { Modal, ErrorAlert, LoadingSpinner } from './common/UIComponents';
import { workspacesApi, environmentsApi } from '../api';

export const WorkspaceSettingsModal = ({
  isOpen,
  onClose,
  workspace,
  members,
  userRole,
  isOwner,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState('members');
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Environments management inside modal
  const [envName, setEnvName] = useState('');
  const [envIsDefault, setEnvIsDefault] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await workspacesApi.inviteMember(workspace.id, {
        user_id: Number(inviteUserId),
        role: inviteRole,
      });
      setSuccess('Member invited successfully');
      setInviteUserId('');
      onRefresh();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberUserId, newRole) => {
    try {
      await workspacesApi.updateMemberRole(workspace.id, memberUserId, { role: newRole });
      onRefresh();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await workspacesApi.removeMember(workspace.id, memberUserId);
      onRefresh();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to remove member');
    }
  };

  const handleCreateEnvironment = async (e) => {
    e.preventDefault();
    if (!envName.trim()) return;
    try {
      await environmentsApi.create(workspace.id, {
        name: envName.trim(),
        is_default: envIsDefault,
      });
      setEnvName('');
      setEnvIsDefault(false);
      onRefresh();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to create environment');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Workspace: ${workspace?.name || ''}`}>
      <div className="space-y-4">
        {/* Role badge */}
        <div className="flex items-center justify-between text-xs bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
          <span className="text-slate-400">Your role:</span>
          <span className="font-bold uppercase px-2 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {userRole || 'Viewer'}
          </span>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'members'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('envs')}
            className={`pb-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'envs'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Environments
          </button>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError('')} />
        {success && (
          <div className="p-2 text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md">
            {success}
          </div>
        )}

        {/* Tab 1: Members */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {isOwner && (
              <form onSubmit={handleInvite} className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Invite Member
                </span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    placeholder="User ID (e.g. 2)"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-hidden"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-hidden"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold cursor-pointer"
                  >
                    Invite
                  </button>
                </div>
              </form>
            )}

            {/* Members List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-md bg-slate-800/50 text-xs"
                >
                  <div>
                    <span className="text-slate-200 font-medium">User #{m.user_id}</span>
                    <span className="text-slate-500 text-[10px] ml-2">
                      Joined {new Date(m.joined_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner && m.role !== 'owner' ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xs text-[11px] text-slate-200 px-1 py-0.5"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-[11px] uppercase font-bold text-slate-400">
                        {m.role}
                      </span>
                    )}

                    {isOwner && m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="text-slate-500 hover:text-rose-400 text-xs px-1 cursor-pointer"
                        title="Remove member"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Environments */}
        {activeTab === 'envs' && (
          <div className="space-y-4">
            <form onSubmit={handleCreateEnvironment} className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Create Environment
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Production / Staging"
                  value={envName}
                  onChange={(e) => setEnvName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold cursor-pointer"
                >
                  Create
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={envIsDefault}
                  onChange={(e) => setEnvIsDefault(e.target.checked)}
                />
                <span>Set as default workspace environment</span>
              </label>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
};
