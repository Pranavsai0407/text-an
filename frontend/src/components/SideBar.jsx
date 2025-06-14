import { useState, useEffect, useContext } from 'react';
import {
  MdClose,
  MdMenu,
  MdOutlineCoffee,
  MdOutlineVpnKey,
  MdDelete,
  MdChat
} from 'react-icons/md';
import { AiOutlineGithub } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/chatContext';
import bot from '../assets/bot.gif';
import ToggleTheme from './ToggleTheme';
import Modal from './Modal';
import Setting from './Setting';
import { useLocation } from 'react-router-dom'; // ⬅️ Add this line at the top

/**
 * A sidebar component that displays a list of nav items and a toggle
 * for switching between light and dark modes.
 *
 * @param {Object} props - The properties for the component.
 */
const SideBar = () => {
  const navigate = useNavigate(); 
  const [open, setOpen] = useState(true);
  const [, , clearChat] = useContext(ChatContext);
  const [modalOpen, setModalOpen] = useState(false);
  const location = useLocation();


  function handleResize() {
    window.innerWidth <= 720 ? setOpen(false) : setOpen(true);
  }

  useEffect(() => {
    handleResize();
  }, []);

  function clear() {
    clearChat();
  }

  return (
    <section
      className={`${
        open ? "w-72" : "w-16"
      } bg-[#222223] flex flex-col items-center gap-y-4 h-screen pt-4 relative duration-100 shadow-md`}
    >
      <div className="flex items-center justify-between w-full px-2 mx-auto">
        <div
          className={` ${
            !open && "scale-0 hidden"
          } flex flex-row items-center gap-2 mx-auto w-full`}
        > 
          <div className='flex flex-col'>
          <img src={bot} alt="logo" className="w-10 h-10" />
          <h1 className={` ${!open && "scale-0 hidden"}`}>Service bot ABC</h1>
          </div>

        </div>
        <div
          className="mx-auto btn btn-square btn-ghost"
          onClick={() => setOpen(!open)}
        >
          {open ? <MdClose size={15} /> : <MdMenu size={15} />}
        </div>
      </div>

      <ul className="w-full menu rounded-box">
        <li>
          <a
            className="border bg-[#7453f9] border-slate-500 font-bold"
            onClick={clear}
          >
            <MdDelete size={15} />
            <p className={`${!open && "hidden"}`}>Clear chat</p>
          </a>
        </li>
        {location.pathname === '/' && (
  <li>
    <a
      className="mt-4 border-slate-500 font-bold"
      onClick={() => navigate('.', { state: { checkDataset: true }, replace: true })}
    >
      <MdChat size={18} />
      <p className={`${!open && 'hidden'}`}>Start Conversation</p>
    </a>
  </li>
)}

      </ul>

      <ul className="absolute bottom-0 w-full gap-1 menu rounded-box">
        <li>
          <a onClick={() => navigate("/admin")}>
            <MdOutlineVpnKey size={15} />
            <p className={`${!open && "hidden"}`}>Admin Page</p>
          </a>
        </li>
        <li>
          <ToggleTheme open={open} />
        </li>
        <li>
          <a onClick={() => setModalOpen(true)}>
            <MdOutlineVpnKey size={15} />
            <p className={`${!open && "hidden"}`}>OpenAI Key</p>
          </a>
        </li>
      </ul>
      <Modal title="Setting" modalOpen={modalOpen} setModalOpen={setModalOpen}>
        <Setting modalOpen={modalOpen} setModalOpen={setModalOpen} />
      </Modal>
    </section>
  );
};

export default SideBar;
