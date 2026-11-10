import React, { useState, useEffect, useRef } from 'react';
import { MethodBadge, LoadingSpinner, ErrorAlert } from './common/UIComponents';
import { CommentPanel } from './CommentPanel';
import { TestCasePanel } from './TestCasePanel';
import { requestsApi } from '../api';

export const RequestEditor = ({
  request,
  onSave,
  canEdit,
  environments = [],
  activeEnvironmentId,
  onChangeEnvironment,
  currentUserId,
  isLockedByOther = false,
  lockHolderName = '',
  isLockedByMe = false,
  onAcquireLock,
  onReleaseLock,
  typingUser = null,
  onTyping,
  onStopTyping,
  incomingCommentEvent = null,
}) => {
  const [method, setMethod] = useState(request?.method || 'GET');
  const [url, setUrl] = useState(request?.url || '');
  const [name, setName] = useState(request?.name || '');
  const [description, setDescription] = useState(request?.description || '');
  const [activeTab, setActiveTab] = useState('params');

  const typingTimerRef = useRef(null);

  const isEffectivelyEditable = canEdit && !isLockedByOther;

  const notifyTyping = () => {
    if (!onTyping || !request?.id) return;
    onTyping(request.id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onStopTyping?.(request.id);
    }, 1500);
  };

  // Key-value pairs for Query Params & Headers
  const [queryParams, setQueryParams] = useState([]);
  const [headers, setHeaders] = useState([]);

  // Body
  const [bodyType, setBodyType] = useState(request?.body_type || 'none');
  const [body, setBody] = useState(request?.body || '');

  // Auth
  const [authType, setAuthType] = useState(request?.auth_type || 'none');
  const [bearerToken, setBearerToken] = useState(request?.auth_config?.token || '');
  const [basicUser, setBasicUser] = useState(request?.auth_config?.username || '');
  const [basicPass, setBasicPass] = useState(request?.auth_config?.password || '');
  const [apiKeyName, setApiKeyName] = useState(request?.auth_config?.key || '');
  const [apiKeyValue, setApiKeyValue] = useState(request?.auth_config?.value || '');
  const [apiKeyAddTo, setApiKeyAddTo] = useState(request?.auth_config?.add_to || 'header');

  // Execution States
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [execError, setExecError] = useState('');
  const [resolvedPreview, setResolvedPreview] = useState(null);

  // Sync state whenever selected request changes
  useEffect(() => {
    if (request) {
      setMethod(request.method || 'GET');
      setUrl(request.url || '');
      setName(request.name || '');
      setDescription(request.description || '');
      setBodyType(request.body_type || 'none');
      setBody(request.body || '');
      setAuthType(request.auth_type || 'none');

      // Sync params
      const qp = request.query_params || {};
      setQueryParams(Object.entries(qp).map(([k, v]) => ({ key: k, value: String(v), enabled: true })));

      // Sync headers
      const hdrs = request.headers || {};
      setHeaders(Object.entries(hdrs).map(([k, v]) => ({ key: k, value: String(v), enabled: true })));

      // Sync auth
      const auth = request.auth_config || {};
      setBearerToken(auth.token || '');
      setBasicUser(auth.username || '');
      setBasicPass(auth.password || '');
      setApiKeyName(auth.key || '');
      setApiKeyValue(auth.value || '');
      setApiKeyAddTo(auth.add_to || 'header');

      setExecutionResult(null);
      setExecError('');
      setResolvedPreview(null);
    }
  }, [request]);

  const assemblePayload = () => {
    const qpObj = {};
    queryParams.filter((p) => p.enabled && p.key).forEach((p) => {
      qpObj[p.key] = p.value;
    });

    const headerObj = {};
    headers.filter((h) => h.enabled && h.key).forEach((h) => {
      headerObj[h.key] = h.value;
    });

    let authConfig = {};
    if (authType === 'bearer') authConfig = { token: bearerToken };
    if (authType === 'basic') authConfig = { username: basicUser, password: basicPass };
    if (authType === 'api_key') authConfig = { key: apiKeyName, value: apiKeyValue, add_to: apiKeyAddTo };

    return {
      name,
      description,
      method,
      url,
      query_params: qpObj,
      headers: headerObj,
      body_type: bodyType,
      body: bodyType === 'none' ? null : body,
      auth_type: authType,
      auth_config: authConfig,
    };
  };

  const handleSave = () => {
    if (!isEffectivelyEditable) return;
    const payload = assemblePayload();
    onSave(request.id, payload);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setExecError('');
    setExecutionResult(null);

    try {
      if (request?.id) {
        // Auto-save changes first if editable
        if (isEffectivelyEditable) {
          await onSave(request.id, assemblePayload());
        }
        // Direct call to FastAPI execution endpoint
        const res = await requestsApi.execute(request.id, activeEnvironmentId || null, 30.0);
        setExecutionResult(res.data);
      } else {
        // Quick run ad-hoc endpoint
        const payload = assemblePayload();
        const res = await requestsApi.quickRun({
          url: payload.url,
          method: payload.method,
          headers: payload.headers,
          query_params: payload.query_params,
          body: payload.body,
        });
        setExecutionResult(res.data);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setExecError(typeof detail === 'string' ? detail : 'Execution failed. Check URL and server status.');
    } finally {
      setExecuting(false);
    }
  };

  const handlePreviewResolve = async () => {
    if (!request?.id) return;
    try {
      const res = await requestsApi.resolve(request.id, activeEnvironmentId || null);
      setResolvedPreview(res.data);
    } catch (err) {
      console.error('Resolve preview error:', err);
    }
  };

  // Helper row managers for Key-Value Tables
  const addParamRow = () => setQueryParams((prev) => [...prev, { key: '', value: '', enabled: true }]);
  const updateParamRow = (index, field, val) => {
    setQueryParams((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };
  const removeParamRow = (index) => setQueryParams((prev) => prev.filter((_, i) => i !== index));

  const addHeaderRow = () => setHeaders((prev) => [...prev, { key: '', value: '', enabled: true }]);
  const updateHeaderRow = (index, field, val) => {
    setHeaders((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };
  const removeHeaderRow = (index) => setHeaders((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Header / URL Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex flex-col gap-3">
        {/* Lock Banner if locked by someone else */}
        {isLockedByOther && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-md text-xs">
            <span className="text-sm">🔒</span>
            <span>
              This request is currently being edited by <strong>{lockHolderName || 'another team member'}</strong>. It is locked in read-only mode to prevent edit conflicts.
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={name}
              disabled={!isEffectivelyEditable}
              onChange={(e) => {
                setName(e.target.value);
                notifyTyping();
              }}
              placeholder="Request Name"
              className="bg-transparent text-sm font-semibold text-slate-100 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-hidden px-1 py-0.5"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Environment Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700">
              <span className="text-[11px] text-slate-400">Env:</span>
              <select
                value={activeEnvironmentId || ''}
                onChange={(e) => onChangeEnvironment(e.target.value ? Number(e.target.value) : null)}
                className="bg-transparent text-xs text-slate-200 focus:outline-hidden"
              >
                <option value="">No Environment</option>
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} {env.is_default ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Lock Controls */}
            {canEdit && (
              <>
                {isLockedByMe ? (
                  <button
                    onClick={onReleaseLock}
                    className="px-2.5 py-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md cursor-pointer flex items-center gap-1 transition-colors"
                    title="Release lock to allow others to edit"
                  >
                    <span>🔓</span> Release Lock
                  </button>
                ) : isLockedByOther ? (
                  <span className="text-[11px] text-amber-400/80 font-medium px-2 py-1 flex items-center gap-1">
                    <span>🔒</span> Locked
                  </span>
                ) : (
                  <button
                    onClick={onAcquireLock}
                    className="px-2.5 py-1 text-xs text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md cursor-pointer flex items-center gap-1 transition-colors"
                    title="Acquire exclusive editing lock"
                  >
                    <span>🔒</span> Lock
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!isEffectivelyEditable}
                  className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded-md cursor-pointer transition-colors"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* URL Input Group */}
        <div className="flex items-center gap-2">
          <select
            value={method}
            disabled={!isEffectivelyEditable}
            onChange={(e) => {
              setMethod(e.target.value);
              notifyTyping();
            }}
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-hidden focus:border-indigo-500"
          >
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={url}
            disabled={!isEffectivelyEditable}
            onChange={(e) => {
              setUrl(e.target.value);
              notifyTyping();
            }}
            placeholder="Enter request URL or {{variable}}"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-hidden focus:border-indigo-500"
          />

          <button
            onClick={handleExecute}
            disabled={executing || !url.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {executing ? <LoadingSpinner size="sm" /> : 'Send'}
          </button>
        </div>

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 animate-pulse pl-1">
            <span>✏️</span>
            <span><strong>{typingUser}</strong> is typing...</span>
          </div>
        )}
      </div>

      {/* Editor & Response Split View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Request Config Tabs */}
        <div className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
          {/* Tabs bar */}
          <div className="flex items-center border-b border-slate-800 px-4 bg-slate-900/30 gap-4 text-xs font-medium">
            {['params', 'headers', 'body', 'auth', 'preview', 'comments', 'tests'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setActiveTab(t);
                  if (t === 'preview') handlePreviewResolve();
                }}
                className={`py-3 capitalize border-b-2 cursor-pointer transition-colors ${
                  activeTab === t
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* PARAMS TAB */}
            {activeTab === 'params' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Query Parameters</span>
                  {canEdit && (
                    <button
                      onClick={addParamRow}
                      className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      + Add Param
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {queryParams.map((param, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        disabled={!canEdit}
                        onChange={(e) => updateParamRow(idx, 'enabled', e.target.checked)}
                        className="rounded-xs border-slate-700 bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Key"
                        value={param.key}
                        disabled={!canEdit}
                        onChange={(e) => updateParamRow(idx, 'key', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-sm px-2 py-1 text-xs font-mono text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Value (or {{var}})"
                        value={param.value}
                        disabled={!canEdit}
                        onChange={(e) => updateParamRow(idx, 'value', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-sm px-2 py-1 text-xs font-mono text-slate-200"
                      />
                      {canEdit && (
                        <button
                          onClick={() => removeParamRow(idx)}
                          className="text-slate-500 hover:text-rose-400 text-xs px-1 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {queryParams.length === 0 && (
                    <div className="text-xs text-slate-600 py-2">No query parameters configured.</div>
                  )}
                </div>
              </div>
            )}

            {/* HEADERS TAB */}
            {activeTab === 'headers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Request Headers</span>
                  {canEdit && (
                    <button
                      onClick={addHeaderRow}
                      className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      + Add Header
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {headers.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={h.enabled}
                        disabled={!canEdit}
                        onChange={(e) => updateHeaderRow(idx, 'enabled', e.target.checked)}
                        className="rounded-xs border-slate-700 bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Header"
                        value={h.key}
                        disabled={!canEdit}
                        onChange={(e) => updateHeaderRow(idx, 'key', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-sm px-2 py-1 text-xs font-mono text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={h.value}
                        disabled={!canEdit}
                        onChange={(e) => updateHeaderRow(idx, 'value', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-sm px-2 py-1 text-xs font-mono text-slate-200"
                      />
                      {canEdit && (
                        <button
                          onClick={() => removeHeaderRow(idx)}
                          className="text-slate-500 hover:text-rose-400 text-xs px-1 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {headers.length === 0 && (
                    <div className="text-xs text-slate-600 py-2">No custom headers configured.</div>
                  )}
                </div>
              </div>
            )}

            {/* BODY TAB */}
            {activeTab === 'body' && (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs">
                  {['none', 'json', 'raw', 'x_www_form_urlencoded'].map((bt) => (
                    <label key={bt} className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="bodyType"
                        value={bt}
                        checked={bodyType === bt}
                        disabled={!canEdit}
                        onChange={(e) => setBodyType(e.target.value)}
                        className="text-indigo-600"
                      />
                      <span>{bt}</span>
                    </label>
                  ))}
                </div>

                {bodyType !== 'none' && (
                  <textarea
                    rows={12}
                    value={body}
                    disabled={!canEdit}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-3 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                )}
              </div>
            )}

            {/* AUTH TAB */}
            {activeTab === 'auth' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Type:</span>
                  <select
                    value={authType}
                    disabled={!canEdit}
                    onChange={(e) => setAuthType(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-sm px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="api_key">API Key</option>
                  </select>
                </div>

                {authType === 'bearer' && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 uppercase">Token</label>
                    <input
                      type="text"
                      placeholder="eyJhbG... or {{token}}"
                      value={bearerToken}
                      disabled={!canEdit}
                      onChange={(e) => setBearerToken(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-sm p-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                )}

                {authType === 'basic' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 uppercase">Username</label>
                      <input
                        type="text"
                        value={basicUser}
                        disabled={!canEdit}
                        onChange={(e) => setBasicUser(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-sm p-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 uppercase">Password</label>
                      <input
                        type="password"
                        value={basicPass}
                        disabled={!canEdit}
                        onChange={(e) => setBasicPass(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-sm p-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                  </div>
                )}

                {authType === 'api_key' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 uppercase">Key</label>
                      <input
                        type="text"
                        placeholder="X-API-Key"
                        value={apiKeyName}
                        disabled={!canEdit}
                        onChange={(e) => setApiKeyName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-sm p-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 uppercase">Value</label>
                      <input
                        type="text"
                        placeholder="Key value"
                        value={apiKeyValue}
                        disabled={!canEdit}
                        onChange={(e) => setApiKeyValue(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-sm p-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 uppercase">Add To</label>
                      <select
                        value={apiKeyAddTo}
                        disabled={!canEdit}
                        onChange={(e) => setApiKeyAddTo(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-sm p-2 text-xs font-mono text-slate-200"
                      >
                        <option value="header">Header</option>
                        <option value="query">Query Params</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RESOLVE PREVIEW TAB */}
            {activeTab === 'preview' && (
              <div className="space-y-3 font-mono text-xs">
                <p className="text-slate-400">Live preview with substituted environment variables:</p>
                {resolvedPreview ? (
                  <div className="bg-slate-900 p-3 rounded-md border border-slate-800 space-y-2">
                    <div>
                      <span className="text-indigo-400">URL: </span>
                      <span className="text-slate-200">{resolvedPreview.resolved_url}</span>
                    </div>
                    <div>
                      <span className="text-indigo-400">Headers: </span>
                      <pre className="text-slate-300 mt-1">
                        {JSON.stringify(resolvedPreview.resolved_headers, null, 2)}
                      </pre>
                    </div>
                    {resolvedPreview.resolved_body && (
                      <div>
                        <span className="text-indigo-400">Body: </span>
                        <pre className="text-slate-300 mt-1">{resolvedPreview.resolved_body}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <LoadingSpinner size="sm" text="Resolving placeholders..." />
                )}
              </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === 'comments' && (
              <CommentPanel
                requestId={request?.id}
                currentUserId={currentUserId}
                incomingCommentEvent={incomingCommentEvent}
              />
            )}

            {/* TESTS TAB */}
            {activeTab === 'tests' && (
              <TestCasePanel
                requestId={request?.id}
                activeEnvironmentId={activeEnvironmentId}
                currentUserId={currentUserId}
              />
            )}
          </div>
        </div>

        {/* Right Side: Live Response Panel */}
        <div className="flex-1 flex flex-col bg-slate-900/20 overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Response
            </span>

            {executionResult && (
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded-sm ${
                    executionResult.status_code && executionResult.status_code < 400
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  Status: {executionResult.status_code || 'Err'}
                </span>
                {executionResult.response_time_ms && (
                  <span className="text-slate-400 font-mono">
                    {executionResult.response_time_ms} ms
                  </span>
                )}
                {executionResult.response_size_bytes !== null && (
                  <span className="text-slate-400 font-mono">
                    {executionResult.response_size_bytes} bytes
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <ErrorAlert message={execError} onDismiss={() => setExecError('')} />

            {executing ? (
              <div className="flex flex-col items-center justify-center h-full">
                <LoadingSpinner size="lg" text="Calling endpoint..." />
              </div>
            ) : executionResult ? (
              <div className="space-y-4">
                {executionResult.error_message && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-sm">
                    {executionResult.error_message}
                  </div>
                )}

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Response Body
                  </div>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs text-slate-200 overflow-x-auto max-h-96">
                    {(() => {
                      try {
                        return JSON.stringify(
                          JSON.parse(executionResult.response_body || '{}'),
                          null,
                          2
                        );
                      } catch {
                        return executionResult.response_body || '(empty response body)';
                      }
                    })()}
                  </pre>
                </div>

                {executionResult.response_headers && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Response Headers
                    </div>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs text-slate-400 overflow-x-auto">
                      {JSON.stringify(executionResult.response_headers, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs">
                Click "Send" to execute this API request against the real backend
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
