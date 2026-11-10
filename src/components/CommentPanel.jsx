import React, { useState, useEffect } from 'react';
import { commentsApi } from '../api';
import { LoadingSpinner, ErrorAlert } from './common/UIComponents';

export const CommentPanel = ({ requestId, currentUserId, incomingCommentEvent }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setError('');
      const res = await commentsApi.list(requestId);
      setComments(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [requestId]);

  // Handle incoming real-time comment events from WebSocket
  useEffect(() => {
    if (!incomingCommentEvent) return;

    const { type, comment, comment_id, request_id } = incomingCommentEvent;

    // Only process if it matches current request
    if (request_id && request_id !== requestId) return;
    if (comment && comment.request_id !== requestId) return;

    if (type === 'comment' && comment) {
      setComments((prev) => {
        const exists = prev.some((c) => c.id === comment.id);
        if (exists) return prev;
        return [...prev, comment];
      });
    } else if (type === 'comment_updated' && comment) {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? comment : c))
      );
    } else if (type === 'comment_deleted' && comment_id) {
      setComments((prev) => prev.filter((c) => c.id !== comment_id && c.parent_comment_id !== comment_id));
    }
  }, [incomingCommentEvent, requestId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setSubmitting(true);
      const res = await commentsApi.create(requestId, {
        content: newContent.trim(),
        parent_comment_id: null,
      });
      setComments((prev) => {
        const exists = prev.some((c) => c.id === res.data.id);
        return exists ? prev : [...prev, res.data];
      });
      setNewContent('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentId) => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const res = await commentsApi.create(requestId, {
        content: replyContent.trim(),
        parent_comment_id: parentId,
      });
      setComments((prev) => {
        const exists = prev.some((c) => c.id === res.data.id);
        return exists ? prev : [...prev, res.data];
      });
      setReplyToId(null);
      setReplyContent('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_comment_id !== commentId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete comment');
    }
  };

  // Group comments: top-level comments and replies
  const rootComments = comments.filter((c) => !c.parent_comment_id);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parent_comment_id) {
      if (!acc[c.parent_comment_id]) acc[c.parent_comment_id] = [];
      acc[c.parent_comment_id].push(c);
    }
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* New Root Comment Input */}
      <form onSubmit={handlePostComment} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add a comment on this request..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={submitting || !newContent.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-md text-xs font-semibold cursor-pointer transition-colors"
        >
          Post
        </button>
      </form>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" text="Loading comments..." />
          </div>
        ) : rootComments.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No comments yet. Start the conversation!
          </div>
        ) : (
          rootComments.map((root) => {
            const replies = repliesByParent[root.id] || [];
            const isAuthor = root.user_id === currentUserId;

            return (
              <div
                key={root.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">
                      {root.username || `User #${root.user_id}`}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(root.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {root.is_edited && ' (edited)'}
                    </span>
                  </div>

                  {isAuthor && (
                    <button
                      onClick={() => handleDelete(root.id)}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="Delete comment"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="text-slate-300 whitespace-pre-wrap">{root.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/40">
                  <button
                    onClick={() => setReplyToId(replyToId === root.id ? null : root.id)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Reply
                  </button>
                </div>

                {/* Inline Reply Form */}
                {replyToId === root.id && (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      autoFocus
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${root.username || 'comment'}...`}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-hidden"
                    />
                    <button
                      onClick={() => handlePostReply(root.id)}
                      disabled={submitting || !replyContent.trim()}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-md text-[11px] font-semibold cursor-pointer"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyToId(null);
                        setReplyContent('');
                      }}
                      className="px-2 py-1 text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Threaded Replies */}
                {replies.length > 0 && (
                  <div className="space-y-2 pl-3 border-l-2 border-slate-800 mt-2">
                    {replies.map((reply) => (
                      <div key={reply.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-300">
                              {reply.username || `User #${reply.user_id}`}
                            </span>
                            <span className="text-slate-500">
                              {new Date(reply.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {reply.user_id === currentUserId && (
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <p className="text-slate-300">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
