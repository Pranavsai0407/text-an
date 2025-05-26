import { useState, useRef, useEffect, useContext } from 'react';
import { MdSend } from 'react-icons/md';
import axios from 'axios';
import { replaceProfanities } from 'no-profanity';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';


import Message from './Message';
import Thinking from './Thinking';
import Modal from './Modal';
import Setting from './Setting';

import { ChatContext } from '../context/chatContext';
import { davinci } from '../utils/davinci';
import { dalle } from '../utils/dalle';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const options = ['ABC-service-bot', 'ChatGPT', 'DALL·E'];
const gptModels = ['gpt-3.5-turbo', 'gpt-4', 'deepseek', 'grok', 'llama-3-70b'];

const getOrCreateChatId = (selected) => {
  let chatId = Cookies.get('chatId');

  if (!chatId) {
    chatId = `uuid-${selected.toLowerCase()}-${Math.floor(Math.random() * 100000)}`;
    Cookies.set('chatId', chatId, { expires: 1 / 12 }); // 2 hours
  }

  return chatId;
};

const saveMessage = async (msg, selected) => {
  let chatId = getOrCreateChatId(selected);

  const newMessage = {
    content: msg.text,
    role: msg.ai ? 'assistant' : 'user',
    timestamp: new Date().toISOString(),
  };

  try {
    const { data: existingData } = await axios.get(`${API_BASE_URL}/api/conversation/${chatId}`);
    const existingMessages = existingData?.messages || [];

    const updatedPayload = {
      chatId,
      adminId: selected,
      messages: [...existingMessages, newMessage],
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    await axios.post(`${API_BASE_URL}/api/conversation`, updatedPayload);

  } catch (err) {
    console.warn(`Fetch failed for chatId "${chatId}". Creating a new chat...`, err);

    chatId = `uuid-${selected.toLowerCase()}-${Math.floor(Math.random() * 100000)}`;
    Cookies.set('chatId', chatId, { expires: 1 / 12 });


    const newPayload = {
      chatId,
      adminId: selected,
      messages: [newMessage],
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post(`${API_BASE_URL}/api/conversation`, newPayload);
    } catch (innerErr) {
      console.error('Failed to save new conversation:', innerErr);
    }
  }
};

const ChatView = () => {
  const messagesEndRef = useRef();
  const inputRef = useRef();

  const [formValue, setFormValue] = useState('');
  const [thinking, setThinking] = useState(false);
  const [selected, setSelected] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [gpt, setGpt] = useState(gptModels[0]);
  const [messages, addMessage] = useContext(ChatContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/datasets`);
        setDatasets(response.data);
      } catch (err) {
        console.error('Error fetching datasets', err);
      }
    };
    fetchDatasets();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateMessage = async (text, ai = false, selected) => {
    const newMsg = {
      id: Date.now() + Math.floor(Math.random() * 1000000),
      createdAt: Date.now(),
      text,
      ai,
      selected,
    };
    setThinking(false);
    addMessage(newMsg);
    await saveMessage(newMsg, selected);
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    const key = window.localStorage.getItem('api-key');
    if (!key) {
      setModalOpen(true);
      return;
    }

    const cleanPrompt = replaceProfanities(formValue.trim());
    if (!cleanPrompt) return;

    const lowerPrompt = cleanPrompt.toLowerCase();
    const rejectionKeywords = ['no', 'nope', 'nah', 'not really', "no i'm fine"];

    setFormValue('');
    await updateMessage(cleanPrompt, false, selected);

    if (rejectionKeywords.includes(lowerPrompt)) {
      await updateMessage("Can you please share your contact info so we can follow up with you if needed?", true, selected);
      return;
    }

    setThinking(true);

    try {
      let responseText = '';

      if (gpt === 'deepseek') {
        const res = await fetch(`${API_BASE_URL}/ask1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanPrompt }),
        });
        const data = await res.json();
        responseText = data?.response;
      } else if (gpt === 'grok') {
        const res = await fetch(`${API_BASE_URL}/ask2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanPrompt, dataset: selected }),
        });
        const data = await res.json();
        responseText = data?.response;
      } else if (selected === options[0]) {
        const res = await fetch(`${API_BASE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanPrompt, key, gptVersion: gpt }),
        });
        const data = await res.json();
        responseText = data?.response;
      } else if (selected === options[1]) {
        responseText = await davinci(cleanPrompt, key, gpt);
      } else {
        const imageResponse = await dalle(cleanPrompt, key);
        const imageUrl = imageResponse.data.data[0].url;
        await updateMessage(imageUrl, true, selected);
        setThinking(false);
        return;
      }

      if (responseText) {
        await updateMessage(`${responseText}\n\nIs there anything else you want me to do?`, true, selected);
      }
    } catch (err) {
      alert(`Error: ${err.message || err} - please try again later.`);
      setThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage(e);
  };

  useEffect(() => scrollToBottom(), [messages, thinking]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.relative')) setDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => inputRef.current.focus(), []);

  // Auto send intro message when dataset is selected
  useEffect(() => {
    const sendIntroMessage = async () => {
      if (selectedDataset?.roles?.length > 0) {
        const roleNames = selectedDataset.roles
          .map((role) => role.name)
          .filter(Boolean);
  
        let roleText = '';
        if (roleNames.length === 1) {
          roleText = roleNames[0];
        } else if (roleNames.length === 2) {
          roleText = `${roleNames[0]} and ${roleNames[1]}`;
        } else {
          roleText = `${roleNames.slice(0, -1).join(', ')}, and ${roleNames.slice(-1)}`;
        }
  
        const introText = `Hello! I am your ${roleText} from ${selectedDataset.name}. How can I assist you today?`;
        await updateMessage(introText, true, selectedDataset.id);
      }
    };
  
    if (selectedDataset) {
      sendIntroMessage();
    }
  }, [selectedDataset]);
  
  
  return (
    <main className="relative flex flex-col h-screen p-1 overflow-hidden bg-[#272629]">
      <div className="relative flex justify-center my-4">
        <div className="relative w-64">
          <button
            className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg shadow-md hover:bg-gray-600"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            {`Model: ${gpt}`}
          </button>
          {dropdownOpen && (
            <ul className="absolute z-10 w-full mt-2 bg-[#2c2c2c] border border-gray-600 rounded-md shadow-lg">
              {gptModels.map((model) => (
                <li
                  key={model}
                  className={`px-4 py-2 text-gray-200 hover:bg-[#3a3a3a] cursor-pointer ${gpt === model ? 'bg-[#444] font-semibold' : ''}`}
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
          messages.map((message, index) => <Message key={index} message={message} />)
        ) : (
          <div className="flex justify-center my-2">
            <div className="w-screen font-bold text-3xl text-center">Hi! How can I help you?</div>
          </div>
        )}
        {thinking && <Thinking />}
        <span ref={messagesEndRef}></span>
      </section>

      <form className="flex flex-col px-10 mb-2 md:px-32 join sm:flex-row" onSubmit={sendMessage}>
        <select
          value={selected}
          onChange={(e) => {
            const datasetId = e.target.value;
            setSelected(datasetId);
            const ds = datasets.find((d) => d.id === datasetId);
            setSelectedDataset(ds);
          }}
          className="w-full sm:w-40 select select-bordered join-item"
        >
          <option value="">Select Dataset</option>
          {datasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name}
            </option>
          ))}
        </select>
        <div className="flex items-stretch justify-between w-full">
          <textarea
            ref={inputRef}
            className="w-full grow input input-bordered join-item max-h-[20rem] min-h-[3rem]"
            value={formValue}
            onKeyDown={handleKeyDown}
            onChange={(e) => setFormValue(e.target.value)}
          />
          <button type="submit" className="join-item btn" disabled={!formValue.trim()}>
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
