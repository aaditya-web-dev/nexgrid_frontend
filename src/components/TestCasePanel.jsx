import React, { useState, useEffect, useCallback } from 'react';
import { testCasesApi } from '../api';
import { LoadingSpinner, ErrorAlert } from './common/UIComponents';

// ---------------------------------------------------------------------------
// Category badge config
// ---------------------------------------------------------------------------
const CATEGORY_STYLES = {
  positive:      { label: 'Positive',       cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  negative:      { label: 'Negative',       cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  boundary:      { label: 'Boundary',       cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  validation:    { label: 'Validation',     cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  authentication:{ label: 'Auth',           cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  authorization: { label: 'Authz',          cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

const CategoryBadge = ({ category }) => {
  const cfg = CATEGORY_STYLES[category] || { label: category, cls: 'bg-slate-700 text-slate-300 border-slate-600' };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Assertion result row
// ---------------------------------------------------------------------------
const AssertionRow = ({ assertion }) => (
  <div className={`flex items-start gap-2 text-[11px] py-0.5 ${assertion.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
    <span className="mt-0.5 shrink-0">{assertion.passed ? '✓' : '✗'}</span>
    <div className="min-w-0">
      <span className="font-mono text-slate-400">[{assertion.type}]</span>{' '}
      <span>{assertion.message}</span>
      {!assertion.passed && assertion.actual !== undefined && assertion.actual !== null && (
        <div className="text-slate-500 text-[10px] mt-0.5">
          Expected: <code className="text-slate-300">{JSON.stringify(assertion.expected)}</code>
          {' · '}
          Got: <code className="text-rose-300">{JSON.stringify(assertion.actual)}</code>
        </div>
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Individual test case card
// ---------------------------------------------------------------------------
const TestCaseCard = ({ tc, activeEnvironmentId, onUpdated, onDeleted }) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [runError, setRunError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(tc.name);
  const [editDesc, setEditDesc] = useState(tc.description || '');
  const [editCategory, setEditCategory] = useState(tc.category);
  const [editStatus, setEditStatus] = useState(tc.expected_status_code || '');
  const [saving, setSaving] = useState(false);

  const handleApprove = async () => {
    try {
      const res = await testCasesApi.approve(tc.id);
      onUpdated(res.data);
    } catch (err) {
      console.error('Approve error', err);
    }
  };

  const handleReject = async () => {
    try {
      const res = await testCasesApi.reject(tc.id);
      onUpdated(res.data);
    } catch (err) {
      console.error('Reject error', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete test case "${tc.name}"?`)) return;
    try {
      await testCasesApi.delete(tc.id);
      onDeleted(tc.id);
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunError('');
    setResult(null);
    try {
      const res = await testCasesApi.run(tc.id, {
        environment_id: activeEnvironmentId || null,
        timeout_seconds: 30,
      });
      setResult(res.data);
    } catch (err) {
      setRunError(err.response?.data?.detail || 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await testCasesApi.update(tc.id, {
        name: editName,
        description: editDesc,
        category: editCategory,
        expected_status_code: editStatus ? Number(editStatus) : null,
      });
      onUpdated(res.data);
      setEditing(false);
    } catch (err) {
      console.error('Save error', err);
    } finally {
      setSaving(false);
    }
  };

  const statusPass = result?.status === 'passed';
  const statusFail = result?.status === 'failed';
  const statusErr  = result?.status === 'error';

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs">
      {/* Header row */}
      <div className="flex items-start gap-2 flex-wrap">
        <CategoryBadge category={tc.category} />

        {/* Approval badge */}
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
          tc.is_approved
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}>
          {tc.is_approved ? 'APPROVED' : 'PENDING'}
        </span>

        {tc.is_ai_generated && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
            AI
          </span>
        )}

        {tc.expected_status_code && (
          <span className="text-[10px] text-slate-400 font-mono">
            expect {tc.expected_status_code}
          </span>
        )}

        {/* Actions — pushed to right */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded cursor-pointer transition-colors"
            >
              Edit
            </button>
          )}
          {!tc.is_approved ? (
            <button
              onClick={handleApprove}
              className="px-2 py-0.5 text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded cursor-pointer transition-colors"
            >
              Approve
            </button>
          ) : (
            <button
              onClick={handleReject}
              className="px-2 py-0.5 text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded cursor-pointer transition-colors"
            >
              Pending
            </button>
          )}
          {tc.is_approved && (
            <button
              onClick={handleRun}
              disabled={running}
              className="px-2 py-0.5 text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {running ? <LoadingSpinner size="sm" /> : '▶ Run'}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-2 py-0.5 text-[10px] text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded cursor-pointer transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Test name & description */}
      {editing ? (
        <div className="space-y-2 pt-1">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            placeholder="Test case name"
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Description"
          />
          <div className="flex gap-2">
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
            >
              {Object.keys(CATEGORY_STYLES).map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_STYLES[cat].label}</option>
              ))}
            </select>
            <input
              type="number"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none font-mono"
              placeholder="Exp. status"
            />
            <div className="flex gap-1 ml-auto">
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editName.trim()}
                className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded cursor-pointer transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditName(tc.name);
                  setEditDesc(tc.description || '');
                  setEditCategory(tc.category);
                  setEditStatus(tc.expected_status_code || '');
                }}
                className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 rounded cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-semibold text-slate-200">{tc.name}</p>
          {tc.description && <p className="text-slate-400 mt-0.5">{tc.description}</p>}
        </div>
      )}

      {/* Run result */}
      {runError && (
        <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[11px]">
          {runError}
        </div>
      )}

      {result && (
        <div className={`mt-1 p-2 rounded border space-y-1.5 ${
          statusPass ? 'bg-emerald-500/10 border-emerald-500/20'
            : statusErr ? 'bg-orange-500/10 border-orange-500/20'
            : 'bg-rose-500/10 border-rose-500/20'
        }`}>
          {/* Summary row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
              statusPass ? 'bg-emerald-500/30 text-emerald-300'
                : statusErr ? 'bg-orange-500/30 text-orange-300'
                : 'bg-rose-500/30 text-rose-300'
            }`}>
              {result.status.toUpperCase()}
            </span>
            {result.actual_status_code && (
              <span className="text-slate-400 font-mono text-[11px]">
                HTTP {result.actual_status_code}
                {tc.expected_status_code && result.actual_status_code !== tc.expected_status_code && (
                  <span className="text-rose-400"> (expected {tc.expected_status_code})</span>
                )}
              </span>
            )}
            {result.response_time_ms && (
              <span className="text-slate-500 font-mono text-[11px]">{result.response_time_ms} ms</span>
            )}
          </div>

          {/* Assertion breakdown */}
          {result.assertion_results && result.assertion_results.length > 0 && (
            <div className="space-y-0.5 border-t border-slate-700/50 pt-1.5">
              {result.assertion_results.map((a, i) => (
                <AssertionRow key={i} assertion={a} />
              ))}
            </div>
          )}

          {/* Failure reason */}
          {!statusPass && result.failure_reason && (
            <p className="text-rose-300 text-[11px] border-t border-rose-500/20 pt-1 mt-1">
              {result.failure_reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main TestCasePanel
// ---------------------------------------------------------------------------
export const TestCasePanel = ({ requestId, activeEnvironmentId, currentUserId }) => {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [error, setError] = useState('');

  const fetchTestCases = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setError('');
      const res = await testCasesApi.list(requestId);
      setTestCases(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load test cases');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchTestCases();
  }, [fetchTestCases]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setBulkResult(null);
    try {
      const res = await testCasesApi.generate(requestId, {});
      setTestCases((prev) => {
        const existingIds = new Set(prev.map((tc) => tc.id));
        const newOnes = res.data.test_cases.filter((tc) => !existingIds.has(tc.id));
        return [...prev, ...newOnes];
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'AI generation failed. Check your API key in backend .env.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    setBulkResult(null);
    setError('');
    try {
      const res = await testCasesApi.runAll(requestId, {
        environment_id: activeEnvironmentId || null,
        timeout_seconds: 30,
      });
      setBulkResult(res.data);
      // Refresh list to get latest
      await fetchTestCases();
    } catch (err) {
      setError(err.response?.data?.detail || 'Bulk run failed');
    } finally {
      setRunningAll(false);
    }
  };

  const handleUpdated = (updated) => {
    setTestCases((prev) => prev.map((tc) => (tc.id === updated.id ? updated : tc)));
  };

  const handleDeleted = (id) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const approvedCount = testCases.filter((tc) => tc.is_approved).length;

  return (
    <div className="flex flex-col h-full space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={generating || !requestId}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold cursor-pointer transition-colors"
        >
          {generating ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Generating…</span>
            </>
          ) : (
            <>✨ Generate Tests with AI</>
          )}
        </button>

        {approvedCount > 0 && (
          <button
            onClick={handleRunAll}
            disabled={runningAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-md text-xs font-semibold cursor-pointer transition-colors"
          >
            {runningAll ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Running…</span>
              </>
            ) : (
              <>▶ Run {approvedCount} Approved</>
            )}
          </button>
        )}

        <span className="ml-auto text-[11px] text-slate-500">
          {testCases.length} test{testCases.length !== 1 ? 's' : ''} · {approvedCount} approved
        </span>
      </div>

      {/* Bulk run summary */}
      {bulkResult && (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs space-y-1 shrink-0">
          <p className="font-semibold text-slate-200">Bulk Run Complete</p>
          <div className="flex gap-4 text-[11px]">
            <span className="text-slate-400">Executed: <strong className="text-slate-200">{bulkResult.executed}</strong></span>
            <span className="text-emerald-400">Passed: <strong>{bulkResult.passed}</strong></span>
            <span className="text-rose-400">Failed: <strong>{bulkResult.failed}</strong></span>
            {bulkResult.errored > 0 && (
              <span className="text-orange-400">Errors: <strong>{bulkResult.errored}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Test case list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading && testCases.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner size="sm" text="Loading test cases…" />
          </div>
        ) : testCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="text-3xl">🧪</div>
            <p className="text-slate-400 text-sm font-medium">No test cases yet</p>
            <p className="text-slate-600 text-xs max-w-xs">
              Click <strong className="text-indigo-400">Generate Tests with AI</strong> to automatically
              create positive, negative, boundary, and auth test cases for this request.
            </p>
          </div>
        ) : (
          testCases.map((tc) => (
            <TestCaseCard
              key={tc.id}
              tc={tc}
              activeEnvironmentId={activeEnvironmentId}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
};
