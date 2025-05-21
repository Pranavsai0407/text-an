import { useState, useRef, useEffect, useContext } from 'react';
import Message from './Message';
import { ChatContext } from '../context/chatContext';
import Thinking from './Thinking';
import { MdSend } from 'react-icons/md';
import { replaceProfanities } from 'no-profanity';
import { davinci } from '../utils/davinci';
import { dalle } from '../utils/dalle';
import Modal from './Modal';
import Setting from './Setting';
import { Dropdown, DropdownButton } from 'react-bootstrap';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;


const options = ['ABC-service-bot','ChatGPT', 'DALL·E'];
const gptModels = ['gpt-3.5-turbo', 'gpt-4', 'deepseek', 'grok', 'llama-3-70b'];

const template = [
  {
    title: 'Plan my food diet',
    prompt: 'I want to plan a perfect healthy diet.',
  },
  {
    title: 'Help me to cook Masala Dosa',
    prompt: 'How to cook Masala Dosa',
  },
  {
    title: 'Help in studying Data structures and Algorithms',
    prompt: 'Give me a detailed roadmap of studying Data structures and algorithms',
  },
  {
    title: 'What is Dynamic programming?',
    prompt: 'What is Dynamic programming? Explain with examples.',
  },
];

/**
 * A chat view component that displays a list of messages and a form for sending new messages.
 */
const ChatView = () => {
  const messagesEndRef = useRef();
  const inputRef = useRef();
  const [formValue, setFormValue] = useState('');
  const [thinking, setThinking] = useState(false);
  const [selected, setSelected] = useState(options[0]);
  const [gpt, setGpt] = useState(gptModels[0]);
  const [messages, addMessage] = useContext(ChatContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);


  /**
   * Scrolls the chat area to the bottom.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Adds a new message to the chat.
   *
   * @param {string} newValue - The text of the new message.
   * @param {boolean} [ai=false] - Whether the message was sent by an AI or the user.
   */
  const updateMessage = (newValue, ai = false, selected) => {
    const id = Date.now() + Math.floor(Math.random() * 1000000);
    const newMsg = {
      id: id,
      createdAt: Date.now(),
      text: newValue,
      ai: ai,
      selected: `${selected}`,
    };

    addMessage(newMsg);
  };

  /**
   * Sends our prompt to our API and get response to our request from openai.
   *
   * @param {Event} e - The submit event of the form.
   */
  const sendMessage = async (e) => {
    e.preventDefault();
  
    const key = window.localStorage.getItem('api-key');
    if (!key) {
      setModalOpen(true);
      return;
    }
  
    const userMessageLower = formValue.trim().toLowerCase();
    if (["no", "nope", "nah", "not really","No I'm fine"].includes(userMessageLower)) {
      updateMessage(formValue, false, selected);
      updateMessage("Can you please share your contact info so we can follow up with you if needed?", true, selected);
      setFormValue('');
      return;
    }
  
    const cleanPrompt = replaceProfanities(formValue);
    const newMsg = cleanPrompt;
    const aiModel = selected;
    const gptVersion = gpt;
  
    setThinking(true);
    setFormValue('');
    updateMessage(newMsg, false, aiModel);
  
    try {
     
      if(gptVersion=="deepseek"){
        const LLMresponse = await fetch(`${API_BASE_URL}/ask1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cleanPrompt,
          })
        });
        const data = await LLMresponse.json();
        data?.response && updateMessage(`${data.response}\n\nIs there anything else you want me to do?`, true, aiModel);
      }
      else if(gptVersion=="grok"){
        const LLMresponse = await fetch(`${API_BASE_URL}/ask2`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cleanPrompt,
          })
        });
        const data = await LLMresponse.json();
        data?.response && updateMessage(`${data.response}\n\nIs there anything else you want me to do?`, true, aiModel);
      }
      else if (aiModel === options[0]) {
        const LLMresponse = await fetch(`${API_BASE_URL}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cleanPrompt,
            key: key,
            gptVersion: gptVersion
          })
        });
        const data = await LLMresponse.json();
        data?.response && updateMessage(`${data.response}\n\nIs there anything else you want me to do?`, true, aiModel);
      } 
      else if (aiModel === options[1]) {
        const LLMresponse = await davinci(cleanPrompt, key, gptVersion);
        LLMresponse && updateMessage(LLMresponse, true, aiModel);
      }
      else {
        const response = await dalle(cleanPrompt, key);
        const data = response.data.data[0].url;
        data && updateMessage(data, true, aiModel);
      }
    } catch (err) {
      window.alert(`Error: ${err} please try again later`);
    }
  
    setThinking(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // 👇 Get input value
      sendMessage(e);
    }
  };

  /**
   * Scrolls the chat area to the bottom when the messages array is updated.
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.relative')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  

  /**
   * Focuses the TextArea input to when the component is first rendered.
   */
  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <main className="relative flex flex-col h-screen p-1 overflow-hidden bg-[#272629]">
      <div className="relative flex justify-center my-4">
  <div className="relative w-64">
    <button
      className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg shadow-md hover:bg-gray-600"
      onClick={() => setDropdownOpen(prev => !prev)}
    >
      {`Model: ${gpt}`}
    </button>
    {dropdownOpen && (
      <ul className="absolute z-10 w-full mt-2 bg-[#2c2c2c] border border-gray-600 rounded-md shadow-lg">
        {gptModels.map((model) => (
          <li
            key={model}
            className={`px-4 py-2 text-gray-200 hover:bg-[#3a3a3a] cursor-pointer ${
              gpt === model ? 'bg-[#444] font-semibold' : ''
            }`}
            onClick={() => {
              setGpt(model);
              setDropdownOpen(false);
            }}
          >
            {model}
          </li>
        ))}
      </ul>
    )}
  </div>
</div>



      <section className="flex flex-col flex-grow w-full px-4 overflow-y-scroll sm:px-10 md:px-32">
        {messages.length ? (
          messages.map((message, index) => (
            <Message key={index} message={{ ...message }} />
          ))
        ) : (
          <div className="flex justify-center my-2">
            <div className="w-screen overflow-hidden font-bold text-3xl text-center">Hi! How can I Help you?</div>
          </div>
        )}

        {thinking && <Thinking />}

        <span ref={messagesEndRef}></span>
      </section>
      <form
        className="flex flex-col px-10 mb-2 md:px-32 join sm:flex-row"
        onSubmit={sendMessage}
      >
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full sm:w-40 select select-bordered join-item"
        >
          <option>{options[0]}</option>
          <option>{options[1]}</option>
          <option>{options[2]}</option>
        </select>
        <div className="flex items-stretch justify-between w-full">
          <textarea
            ref={inputRef}
            className="w-full grow input input-bordered join-item max-h-[20rem] min-h-[3rem]"
            value={formValue}
            onKeyDown={handleKeyDown}
            onChange={(e) => setFormValue(e.target.value)}
          />
          <button type="submit" className="join-item btn" disabled={!formValue}>
            <MdSend size={30} />
          </button>
        </div>
      </form>
      <Modal title="Setting" modalOpen={modalOpen} setModalOpen={setModalOpen}>
        <Setting modalOpen={modalOpen} setModalOpen={setModalOpen} />
      </Modal>
    </main>
  );
};

export default ChatView;
