export default function ChatList({ chats, onSelect }) {
  return (
    <ul className="menu space-y-1">
      {chats.map(chat => {
        const isLead = chat.status === 'processed';

        return (
          <li key={chat.chatId}>
            <button
              onClick={() => onSelect(chat)}
              className="flex justify-between items-center w-full text-left p-2 rounded hover:bg-base-300"
            >
              <div className="flex flex-col">
                <span className="font-bold text-sm">Chat ID: {chat.chatId}</span>
                <span className="text-sm">Bot ID: {chat.adminId}</span>
                <span className="text-xs text-gray-400">
                  {new Date(chat.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center">
                <span
                  className={`h-3 w-3 rounded-full ${
                    isLead ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  title={isLead ? 'Lead' : 'Not a Lead'}
                ></span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
