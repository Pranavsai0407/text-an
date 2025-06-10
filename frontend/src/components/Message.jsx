import PropTypes from 'prop-types';
import { MdComputer, MdPerson } from 'react-icons/md';
import moment from 'moment';
import Image from './Image';
import Markdown from './Markdown';

/**
 * A chat message component that displays a message with a timestamp and an icon.
 *
 * @param {Object} props - The properties for the component.
 */
const Message = ({ message, trainingButton }) => {
  const { id, createdAt, text, ai = false, selected } = message;

  return (
    <div
      key={id}
      className={`flex items-end my-2 gap-2 ${
        ai ? 'flex-row-reverse justify-end' : 'flex-row justify-end'
      }`}
    >
      {selected === 'DALL·E' && ai ? (
        <Image url={text} />
      ) : (
        <div className={`w-screen overflow-hidden chat ${ai ? 'chat-start' : 'chat-end'}`}>
          <div className="relative chat-bubble max-w-[70%] text-neutral-content">
            {trainingButton && (
              <div className="absolute bottom-0 right-0 z-3">
                {trainingButton}
              </div>
            )}
            <Markdown markdownText={text} />
            <div className={`${ai ? 'text-left' : 'text-right'} text-xs`}>
              {moment(createdAt).calendar()}
            </div>
          </div>
        </div>
      )}

      <div className="avatar">
        <div className="w-8 border rounded-full border-slate-400">
          {ai ? (
            <MdComputer className="w-6 h-full m-auto" />
          ) : (
            <MdPerson className="w-6 h-full m-auto" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;

Message.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.number.isRequired,
    createdAt: PropTypes.number.isRequired,
    text: PropTypes.string,
    ai: PropTypes.bool,
    selected: PropTypes.string,
  }).isRequired,
  trainingButton: PropTypes.node, // Optional icon/button (e.g., 🛠️)
};
