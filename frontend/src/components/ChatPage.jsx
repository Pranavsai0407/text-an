import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ChatList from './ChatList';
import ChatViewer from './ChatViewer';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [filters, setFilters] = useState({ chatId: '', adminId: '' });
  const [sortDesc, setSortDesc] = useState(true);
  const [showOnlyLeads, setShowOnlyLeads] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(350);

  const sidebarRef = useRef(null);
  const isResizing = useRef(false);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/conversation`)
      .then((res) => setConversations(res.data))
      .catch(console.error);
  }, []);

  const filteredChats = conversations
    .filter((c) =>
      c.chatId.includes(filters.chatId) &&
      c.adminId.includes(filters.adminId) &&
      (!showOnlyLeads || c.status === 'processed')
    )
    .sort((a, b) =>
      sortDesc
        ? new Date(b.timestamp) - new Date(a.timestamp)
        : new Date(a.timestamp) - new Date(b.timestamp)
    );

  const startResize = (e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleResizing);
    document.addEventListener('mouseup', stopResize);
  };

  const handleResizing = (e) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth > 250 && newWidth < 600) {
      setSidebarWidth(newWidth);
    }
  };

  const stopResize = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResizing);
    document.removeEventListener('mouseup', stopResize);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <div
        ref={sidebarRef}
        className="border-r bg-base-200 overflow-hidden"
        style={{ width: sidebarWidth }}
      >
        <div className="sticky top-0 z-10 bg-base-200 p-3 space-y-2">
          <input
            type="text"
            placeholder="Filter by Chat ID"
            className="input input-bordered w-full"
            onChange={(e) =>
              setFilters((f) => ({ ...f, chatId: e.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Filter by Bot ID"
            className="input input-bordered w-full"
            onChange={(e) =>
              setFilters((f) => ({ ...f, adminId: e.target.value }))
            }
          />
          <div className="flex items-center justify-between">
            <button
              className="btn btn-sm"
              onClick={() => setSortDesc((prev) => !prev)}
            >
              Sort: {sortDesc ? 'Newest First' : 'Oldest First'}
            </button>
            <label className="label cursor-pointer">
              <span className="label-text mr-2 text-sm">Only Leads</span>
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={showOnlyLeads}
                onChange={() => setShowOnlyLeads((prev) => !prev)}
              />
            </label>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-12rem)] px-2 pb-4">
          <ChatList chats={filteredChats} onSelect={setSelectedChat} />
        </div>
      </div>

      {/* Draggable Divider */}
      <div
        className="w-2 bg-base-300 cursor-col-resize"
        onMouseDown={startResize}
      />

      {/* Right Conversation Panel */}
      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-10 bg-base-100 p-4 border-b font-bold text-lg">
          Conversation
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedChat ? (
            <ChatViewer chat={selectedChat} />
          ) : (
            <p className="text-gray-400">
              Select a conversation to view messages
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
