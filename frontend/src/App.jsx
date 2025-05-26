import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatContextProvider } from './context/chatContext';
import SideBar from './components/SideBar';
import ChatView from './components/ChatView';
import ViewRoles from './components/ViewRoles';
import AdminPage from './components/AdminPage'; // Make sure this exists
import ViewDataset from './components/ViewDataset';
import { useEffect, useState } from 'react';
import Modal from './components/Modal';
import Setting from './components/Setting';

const App = () => {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const apiKey = window.localStorage.getItem('api-key');
    if (!apiKey) {
      setModalOpen(false);
    }
  }, []);

  return (
    <ChatContextProvider>
      <Router> {/* ✅ Wrap everything inside Router */}
        <Modal title='Setting' modalOpen={modalOpen} setModalOpen={setModalOpen}>
          <Setting modalOpen={modalOpen} setModalOpen={setModalOpen} />
        </Modal>
        <div className='flex transition duration-500 ease-in-out'>
          <SideBar /> {/* ✅ Now useNavigate works here */}
          <Routes>
            <Route path="/" element={<ChatView />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/viewRoles" element={<ViewRoles/>} />
            <Route path="/viewDataset/:_id" element={<ViewDataset/>}/>
          </Routes>
        </div>
      </Router>
    </ChatContextProvider>
  );
};

export default App;
