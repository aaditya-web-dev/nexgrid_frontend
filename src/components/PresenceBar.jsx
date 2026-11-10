import React from 'react';

export const PresenceBar = ({ isConnected, onlineUsers = [], currentUserId }) => {
  return (
    <div className="flex items-center gap-2">
      {/* Connection Indicator */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px]">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
          }`}
        />
        <span className="text-slate-400 font-mono text-[10px]">
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Online User Avatars */}
      {onlineUsers.length > 0 && (
        <div className="flex items-center -space-x-1.5 overflow-hidden pl-1" title="Users active in this workspace">
          {onlineUsers.slice(0, 5).map((u) => {
            const isSelf = u.user_id === currentUserId;
            const initials = (u.username || 'U').slice(0, 2).toUpperCase();
            return (
              <div
                key={u.user_id}
                title={`${u.username}${isSelf ? ' (you)' : ''}`}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-slate-900 cursor-default select-none ${
                  isSelf
                    ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-700 text-emerald-100'
                }`}
              >
                {initials}
              </div>
            );
          })}
          {onlineUsers.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold">
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
