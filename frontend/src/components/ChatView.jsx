import { useState, useRef, useEffect, useContext } from 'react';
import { MdSend } from 'react-icons/md';
import axios from 'axios';
import { replaceProfanities } from 'no-profanity';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { useLocation , useNavigate} from 'react-router-dom'; // ⬅️ Add this line at the top
import botImage from '../assets/bot.gif';
import { Pencil, Trash2 } from 'lucide-react';


import Message from './Message';
import Thinking from './Thinking';
import Modal from './Modal';
import Setting from './Setting';

import { ChatContext } from '../context/chatContext';
import { davinci } from '../utils/davinci';
import { dalle } from '../utils/dalle';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const options = ['ABC-service-bot', 'ChatGPT', 'DALL·E'];
const gptModels = ['gpt-3.5-turbo', 'gpt-4', 'deepseek', 'grok', 'llama-3-70b', 'grok_RAG'];

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
    console.log(1);
    const { data: existingData } = await axios.get(`${API_BASE_URL}/api/conversation/${chatId}`);
    const existingMessages = existingData?.messages || [];
    
    console.log(existingData);
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
  const navigate = useNavigate(); 

  const [formValue, setFormValue] = useState("");
  const [thinking, setThinking] = useState(false);
  const [selected, setSelected] = useState("");
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [gpt, setGpt] = useState(gptModels[1]);
  const [messages, addMessage] = useContext(ChatContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [showImprovePanel, setShowImprovePanel] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [modelText, setModelText] = useState("");
  const [improvedText, setImprovedText] = useState("");
  const [trainingSidebarOpen, setTrainingSidebarOpen] = useState(false);
  const [selectedBotMessage, setSelectedBotMessage] = useState(null);
  const [previousUserMessage, setPreviousUserMessage] = useState(null);
  const [addInstructionModalOpen, setAddInstructionModalOpen] = useState(false);
  const [instructionsList, setInstructionsList] = useState([
    { text: "Fix grammar",value:0.9, active: true },
    { text: "Improve clarity",value: 0.7, active: false },
  ]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedInstruction, setEditedInstruction] = useState({ text: ''});


  const location = useLocation(); // ⬅️ Get route state

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

  /*useEffect(() => {
  if (trainingSidebarOpen && selectedBotMessage?.text) {
    fetchInstructions(selectedBotMessage.text).then((fetchedInstructions) => {
      setInstructionsList(fetchedInstructions);
    });
  }
}, [trainingSidebarOpen, selectedBotMessage]);*/

  useEffect(() => {
  if (location.state?.checkDataset && !selectedDataset) {
    
    const timer = setTimeout(() => {
    alert("Please select the data set!");

    // Clear the checkDataset flag so alert doesn’t show again
    navigate(location.pathname, { replace: true, state: {} });
    }, 400);
  }
  }, [location.state, selectedDataset]);
  
  const fetchInstructions = async (botMessage) => {
  try {
    const response = await axios.post(
      "https://811cffm7r3.execute-api.eu-north-1.amazonaws.com/match-instruction",
      { bot_reply: botMessage }
    );
    const data = response.data.instructions;

    // Convert the response to your desired format
    return data.map((inst) => ({
      id: inst.instructionId,
      text: inst.instruction,
      value: inst.score,
      active: inst.status === "ACTIVE",
    }));
  } catch (error) {
    console.error("Failed to fetch instructions", error);
    return [];
  }
};

  /*useEffect(() => {
    if (location.state?.checkDataset) {
      // Show alert only once
      const timer = setTimeout(() => {
        alert('Please select the data set!');
        // Reset the state to prevent re-trigger on reload
        navigate('.', { replace: true, state: {} });
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [location.state, navigate]);*/

  const handleSubmit = async () => {
  const payload = {
    instructionId: uuidv4(), // ✅ generate unique ID
    bot_reply: modelText,
    created_at: new Date().toISOString(),
    instruction_text:improvedText, // ✅ improved response
    status:"pending" ,
    user_message: queryText,
  };

  try {
    await axios.post(`${API_BASE_URL}/api/instructions`, payload);
      console.log("Submitted successfully!");
      setQueryText("");
      setModelText("");
      setImprovedText("");
  } catch (err) {
    console.error("Error submitting data:", err);
  }
};
const handleEditInstruction = (index) => {
  setEditIndex(index);
  setEditedInstruction({ ...instructionsList[index] });
};

const handleSaveEdit = async () => {
  const updated = [...instructionsList];
  const edited = { ...editedInstruction };
  
  try {
    await axios.put(`${API_BASE_URL}/api/enhancedInstructions`, {
      instructionId: updated[editIndex].id,
      updatedText: edited.text, // adjust field name
      status: updated[editIndex].active ? 'ACTIVE':'INACTIVE' || 'ACTIVE', // optional
    });

    updated[editIndex].text = edited.text;
    setInstructionsList(updated);
    setEditIndex(null);
  } catch (error) {
    console.error('Update failed:', error);
  }
};

const handleDeleteInstruction = async (index) => {
  const Id = instructionsList[index].id;
  console.log(instructionsList[index]);
  try {
    await axios.delete(`${API_BASE_URL}/api/enhancedInstructions/${Id}`);

    const updated = instructionsList.filter((_, i) => i !== index);
    setInstructionsList(updated);
  } catch (error) {
    console.error('Delete failed:', error);
  }
};




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
    /*if (!key) {
      setModalOpen(true);
      return;
    }*/

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
      }
      else if (gpt === 'grok_RAG') {
        const res = await fetch(`${API_BASE_URL}/ask3`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanPrompt, dataset: selected }),
        });
        const data = await res.json();
        responseText = data?.response;
      } 
      else if (selected === 'gpt-4') {
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
        await updateMessage(`${responseText}`, true, selected);
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
      {trainingSidebarOpen && selectedBotMessage && (
  <div className="fixed top-0 right-0 h-full w-[40rem] bg-[#1e1e1e] text-white shadow-xl border-l border-gray-600 p-5 overflow-y-auto z-50">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Train Message</h3>
      <button
        className="text-red-400 hover:text-red-600"
        onClick={() => setTrainingSidebarOpen(false)}
      >
        ✖
      </button>
    </div>

    <div className="mb-4">
      <h4 className="text-sm text-gray-300 mb-1">Previous User Message</h4>
      <div className="bg-[#2c2c2c] p-3 rounded">{previousUserMessage?.text || "N/A"}</div>
    </div>

    <div className="mb-4">
      <h4 className="text-sm text-gray-300 mb-1">Bot Message</h4>
      <div className="bg-[#2c2c2c] p-3 rounded">{selectedBotMessage?.text}</div>
    </div>

<div className="mb-4">
  <h4 className="text-sm text-gray-300 mb-1">Instructions</h4>

  {/* Scrollable Table Container */}
  <div className="max-h-60 overflow-y-auto border border-gray-600 rounded">
    <table className="table-auto w-full text-left border-collapse">
      <thead className="bg-gray-800">
        <tr>
          <th className="sticky top-0 z-10 w-2 p-2 border border-gray-600 bg-gray-800">Active</th>
          <th className="sticky top-0 z-10 w-2 p-2 border border-gray-600 bg-gray-800">Value</th>
          <th className="sticky top-0 z-10 text-center p-2 border border-gray-600 bg-gray-800">Instruction</th>
          <th className="sticky top-0 z-10 w-2 p-2 border border-gray-600 bg-gray-800 text-center">Actions</th>
        </tr>
      </thead>
<tbody>
  {instructionsList.map((inst, i) => (
    <tr key={i} className="bg-gray-900 text-white">
      <td className="p-2 border border-gray-600 text-center">
        <input
          type="checkbox"
          checked={inst.active}
          onChange={async() => {
            const updated = [...instructionsList];
            updated[i].active = !updated[i].active;
            await axios.put(`${API_BASE_URL}/api/enhancedInstructions`, {
            instructionId: inst.id,
            updatedText: inst.text, // adjust field name
            status: updated[i].active ? 'ACTIVE':'INACTIVE' || 'ACTIVE', // optional
            });
            
            setInstructionsList(updated);
          }}
        />
      </td>
      <td className="p-2 border border-gray-600">
          {inst.value}
      </td>
      <td className="p-2 border border-gray-600">
        {editIndex === i ? (
          <textarea
  className="w-full bg-gray-800 text-white p-2 rounded resize-y min-h-[80px] max-h-[200px] overflow-y-auto"
  value={editedInstruction.text}
  onChange={(e) =>
    setEditedInstruction({ ...editedInstruction, text: e.target.value })
  }
/>
        ) : (
          inst.text
        )}
      </td>
      <td className="p-2 border border-gray-600 text-center">
        <div className="flex items-center justify-center gap-3">
          {editIndex === i ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="text-green-400 hover:text-green-300"
                title="Save"
              >
                ✅
              </button>
              <button
                onClick={() => setEditIndex(null)}
                className="text-red-400 hover:text-red-300"
                title="Cancel"
              >
                ❌
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleEditInstruction(i)}
                className="text-yellow-400 hover:text-yellow-300"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteInstruction(i)}
                className="text-red-500 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  ))}
</tbody>


    </table>
  </div>
</div>



    <button
      onClick={() => setAddInstructionModalOpen(true)}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
    >
      ➕ New Instruction
    </button>
  </div>
)}

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
                  className={`px-4 py-2 text-gray-200 hover:bg-[#3a3a3a] cursor-pointer ${
                    gpt === model ? "bg-[#444] font-semibold" : ""
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
          messages.map((message, index) => {
  const prevMsg = index > 0 ? messages[index - 1] : null;

  return (
    <Message
      key={message.id}
      message={message}
      trainingButton={
        message.ai && (
          <button
            className="text-sm text-blue-500 hover:text-blue-950 transition"
            onClick={() => {
              setSelectedBotMessage(message);
              setPreviousUserMessage(prevMsg?.ai ? null : prevMsg);
              fetchInstructions(message.text).then((fetchedInstructions) => {
              setInstructionsList(fetchedInstructions); // Set instructions after fetch
              setTrainingSidebarOpen(true); // Open sidebar only after data is ready
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#adb8bf"><path d="M206-206q-41-48-63.5-107.5T120-440q0-150 105-255t255-105h8l-64-64 56-56 160 160-160 160-57-57 63-63h-6q-116 0-198 82t-82 198q0 51 16.5 96t46.5 81l-57 57Zm234-14q0-23-15.5-45.5t-34.5-47q-19-24.5-34.5-51T340-420q0-58 41-99t99-41q58 0 99 41t41 99q0 30-15.5 56.5t-34.5 51q-19 24.5-34.5 47T520-220h-80Zm0 100v-60h80v60h-80Zm314-86-57-57q30-36 46.5-81t16.5-96q0-66-27.5-122.5T657-657l57-57q58 50 92 120.5T840-440q0 67-22.5 126.5T754-206Z"/></svg>
          </button>
        )
      }
    />
  );
})
        ) : (
          <div className="flex justify-center my-2">
            <div className="w-screen font-bold text-3xl text-center">
              Hi! How can I help you?
            </div>
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
          <button
            type="submit"
            className="join-item btn"
            disabled={!formValue.trim()}
          >
            <MdSend size={30} />
          </button>
        </div>
      </form>

      <Modal title="Setting" modalOpen={modalOpen} setModalOpen={setModalOpen}>
        <Setting modalOpen={modalOpen} setModalOpen={setModalOpen} />
      </Modal>
      <Modal title="Add Instruction" modalOpen={addInstructionModalOpen} setModalOpen={setAddInstructionModalOpen}>
  <div className="space-y-4">
    <input
      type="text"
      placeholder="Instruction text..."
      className="input input-bordered w-full"
      onKeyDown={async (e) => {
        if (e.key === "Enter") {
          const newText = e.target.value.trim();
          if (newText) {
            try {
              // Call your API endpoint using Axios
              const response = await axios.post(`${API_BASE_URL}/api/enhancedInstructions`, { 
                enhanced_text: newText,
                status: "ACTIVE" 
              });
              console.log(response.data.instruction);
              // Update local state with the response data
              setInstructionsList([...instructionsList, {
                value:0, 
                text: newText, 
                active: true,
                id: response.data.instruction.instructionId, // Get ID from response
              }]);
              
              e.target.value = '';
              setAddInstructionModalOpen(false);
            } catch (error) {
              console.error('Error creating instruction:', error);
              // You can add user feedback here (e.g., toast notification)
            }
          }
        }
      }}
    />
    <p className="text-sm text-gray-500">Press Enter to add</p>
  </div>
</Modal>

      <div className="fixed bottom-6 right-6 z-50">
        <img
          src={botImage} // Image must exist in public/bot-icon.png
          alt="Bot"
          className="w-16 h-16 cursor-pointer rounded-full shadow-lg hover:scale-105 transition"
          onClick={() => setShowImprovePanel((prev) => !prev)}
        />
      </div>

      {/* Dark mode panel for response improvement */}
      {showImprovePanel && (
        <div className="fixed bottom-28 right-6 z-50 bg-[#1e1e1e] text-white rounded-xl shadow-2xl p-5 w-[22rem] space-y-4 border border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              User's Query
            </label>
            <textarea
              rows={3}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#2c2c2c] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter query..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Model Response
            </label>
            <textarea
              rows={3}
              value={modelText}
              onChange={(e) => setModelText(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#2c2c2c] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Model's response..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Improved Response
            </label>
            <textarea
              rows={3}
              value={improvedText}
              onChange={(e) => setImprovedText(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#2c2c2c] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Write improved version..."
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Submit
          </button>
        </div>
      )}
    </main>
  );
};

export default ChatView;