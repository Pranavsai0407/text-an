import { MdComputer, MdPerson } from 'react-icons/md'; // Or use your own icons or images

export default function ChatViewer({ chat }) {
  return (
    <div className="chat-viewer space-y-2">
      
      {chat.messages.map((msg, idx) => (
        <div
          key={idx}
          className={`chat ${msg.role === 'assistant' ? 'chat-start' : 'chat-end'}`}
        >
          <div className="chat-image avatar">
            <div className="w-8 rounded-full bg-base-200 p-1">
              {msg.role === 'assistant' ? (
              <MdComputer className='w-6 h-full m-auto' />
              ) : (
                <MdPerson className='w-6 h-full m-auto' />
              )}
            </div>
          </div>
          <div className="chat-bubble">{msg.content}</div>
          <div className="text-xs opacity-50 mt-1">
            {/* Optionally include timestamp here */}
          </div>
        </div>
      ))}
    </div>
  );
}
