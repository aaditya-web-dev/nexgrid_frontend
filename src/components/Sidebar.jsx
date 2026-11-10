import React, { useState } from 'react';
import { MethodBadge } from './common/UIComponents';

export const Sidebar = ({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onOpenWorkspaceSettings,
  collections,
  foldersByCollection,
  requestsByCollection,
  selectedRequestId,
  onSelectRequest,
  onCreateCollection,
  onCreateFolder,
  onCreateRequest,
  onDeleteCollection,
  onDeleteRequest,
  canEdit,
  lockedRequests = {},
  typingUsers = {},
}) => {
  const [expandedCollections, setExpandedCollections] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleCollection = (id) => {
    setExpandedCollections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFolder = (id) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 select-none">
      {/* Workspace Selector Bar */}
      <div className="p-3 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </span>
          <div className="flex items-center gap-1">
            {activeWorkspace && (
              <button
                onClick={onOpenWorkspaceSettings}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-sm text-xs cursor-pointer"
                title="Workspace settings & members"
              >
                ⚙️
              </button>
            )}
            <button
              onClick={onCreateWorkspace}
              className="p-1 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-sm text-xs font-semibold cursor-pointer"
              title="Create new workspace"
            >
              + New
            </button>
          </div>
        </div>

        <select
          value={activeWorkspace?.id || ''}
          onChange={(e) => onSelectWorkspace(Number(e.target.value))}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-hidden focus:border-indigo-500"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
          {workspaces.length === 0 && <option value="">No workspaces found</option>}
        </select>
      </div>

      {/* Collections & Nested Request Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Collections
          </span>
          {canEdit && (
            <button
              onClick={onCreateCollection}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              title="Add Collection"
            >
              + Add
            </button>
          )}
        </div>

        {collections.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            No collections yet. Click "+ Add" to create your first collection.
          </div>
        ) : (
          collections.map((col) => {
            const isColExpanded = !!expandedCollections[col.id];
            const folders = foldersByCollection[col.id] || [];
            const allRequests = requestsByCollection[col.id] || [];
            const rootRequests = allRequests.filter((r) => !r.folder_id);

            return (
              <div key={col.id} className="rounded-md">
                {/* Collection item */}
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-800/80 rounded-md group cursor-pointer text-slate-300 hover:text-slate-100">
                  <div
                    className="flex items-center gap-1.5 flex-1 min-w-0"
                    onClick={() => toggleCollection(col.id)}
                  >
                    <span className="text-[10px] text-slate-500 w-3">
                      {isColExpanded ? '▼' : '▶'}
                    </span>
                    <span className="text-xs">📁</span>
                    <span className="text-xs font-semibold truncate">{col.name}</span>
                  </div>

                  {canEdit && (
                    <div className="hidden group-hover:flex items-center gap-1 text-[11px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateRequest(col.id, null);
                        }}
                        className="text-slate-400 hover:text-indigo-400 p-0.5"
                        title="Add Request to Collection"
                      >
                        +Req
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateFolder(col.id);
                        }}
                        className="text-slate-400 hover:text-indigo-400 p-0.5"
                        title="Add Folder"
                      >
                        +Dir
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCollection(col.id);
                        }}
                        className="text-slate-400 hover:text-rose-400 p-0.5"
                        title="Delete Collection"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub-tree */}
                {isColExpanded && (
                  <div className="pl-4 mt-0.5 space-y-0.5 border-l border-slate-800 ml-3">
                    {/* Folders in collection */}
                    {folders.map((folder) => {
                      const isFolderExpanded = !!expandedFolders[folder.id];
                      const folderRequests = allRequests.filter(
                        (r) => r.folder_id === folder.id
                      );

                      return (
                        <div key={folder.id}>
                          <div className="flex items-center justify-between px-2 py-1 hover:bg-slate-800/60 rounded-md group cursor-pointer text-slate-400 hover:text-slate-200">
                            <div
                              className="flex items-center gap-1.5 flex-1 min-w-0"
                              onClick={() => toggleFolder(folder.id)}
                            >
                              <span className="text-[9px] text-slate-500 w-3">
                                {isFolderExpanded ? '▼' : '▶'}
                              </span>
                              <span className="text-xs">📂</span>
                              <span className="text-xs truncate">{folder.name}</span>
                            </div>

                            {canEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCreateRequest(col.id, folder.id);
                                }}
                                className="hidden group-hover:block text-[11px] text-slate-400 hover:text-indigo-400 p-0.5"
                                title="Add Request into Folder"
                              >
                                +Req
                              </button>
                            )}
                          </div>

                          {/* Requests inside folder */}
                          {isFolderExpanded && (
                            <div className="pl-4 border-l border-slate-800 ml-3 space-y-0.5 mt-0.5">
                              {folderRequests.map((req) => (
                                <div
                                  key={req.id}
                                  onClick={() => onSelectRequest(req)}
                                  className={`flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer group ${
                                    selectedRequestId === req.id
                                      ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <MethodBadge method={req.method} />
                                    <span className="truncate">{req.name}</span>
                                    {lockedRequests[req.id] && (
                                      <span
                                        title={`Locked by ${lockedRequests[req.id].username}`}
                                        className="text-[10px] shrink-0"
                                      >
                                        🔒
                                      </span>
                                    )}
                                    {typingUsers[req.id] && (
                                      <span
                                        title={`${typingUsers[req.id]} is typing...`}
                                        className="text-[10px] shrink-0 animate-pulse"
                                      >
                                        ✏️
                                      </span>
                                    )}
                                  </div>
                                  {canEdit && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteRequest(req.id);
                                      }}
                                      className="hidden group-hover:block text-slate-500 hover:text-rose-400 text-xs px-1"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                              {folderRequests.length === 0 && (
                                <div className="text-[11px] text-slate-600 py-1 pl-2">
                                  Empty folder
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Root requests (no folder) */}
                    {rootRequests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => onSelectRequest(req)}
                        className={`flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer group ${
                          selectedRequestId === req.id
                            ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MethodBadge method={req.method} />
                          <span className="truncate">{req.name}</span>
                          {lockedRequests[req.id] && (
                            <span
                              title={`Locked by ${lockedRequests[req.id].username}`}
                              className="text-[10px] shrink-0"
                            >
                              🔒
                            </span>
                          )}
                          {typingUsers[req.id] && (
                            <span
                              title={`${typingUsers[req.id]} is typing...`}
                              className="text-[10px] shrink-0 animate-pulse"
                            >
                              ✏️
                            </span>
                          )}
                        </div>
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRequest(req.id);
                            }}
                            className="hidden group-hover:block text-slate-500 hover:text-rose-400 text-xs px-1"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    {folders.length === 0 && rootRequests.length === 0 && (
                      <div className="text-[11px] text-slate-600 py-1 pl-2">
                        No requests in collection
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
