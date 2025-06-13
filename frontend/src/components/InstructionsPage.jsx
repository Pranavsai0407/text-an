import { useState } from 'react';

const initialData = {
  groups: [
    {
      category: 'Location Inquiries',
      summary: 'Instructions related to providing location information',
      instructions: [
        {
          instructionId: 'inst-01',
          status: 'INACTIVE',
          text: 'We are located at the following addresses: [Patna Address], Patna, Bihar, India; [Ranchi Address], Ranchi, Jharkhand, India. Is there anything else I can assist you with?'
        }
      ]
    },
    {
      category: 'Refund Requests',
      summary: 'Instructions related to handling refund inquiries',
      instructions: [
        {
          instructionId: '49503f55-1f69-4be4-b541-37934c11295007',
          status: 'ACTIVE',
          text: 'I can help you with a refund. Do you have the order number?'
        },
        {
          instructionId: '49503f55-1f69-4be4-b541-37934c112950107',
          status: 'ACTIVE',
          text: 'When the user asks about a refund, you need to reconfirm and say thank you'
        }
      ]
    },
    {
      category: 'Company Information',
      summary: 'Instructions for responding to inquiries about the company',
      instructions: [
        {
          instructionId: '0e5dec43-a1ba-41c5-b407-ba1df8368747',
          status: 'ACTIVE',
          text: "Thank you for your interest in our company. Could you please specify what you'd like to know more about, such as our services, history, or values?"
        }
      ]
    },
    {
      category: 'Greetings',
      summary: 'Instructions for initial user greetings',
      instructions: [
        {
          instructionId: 'c618927f-ddba-416a-875e-c5841ca3b0bc',
          status: 'ACTIVE',
          text: 'The initial greeting should be : Hello'
        }
      ]
    }
  ]
};

export default function GroupedInstructions() {
  const [data, setData] = useState(initialData);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState('');

  const handleBack = () => {
    setSelectedCategory(null);
    setEditingId(null);
  };

  const handleDelete = (instructionId) => {
    const updatedGroups = data.groups.map(group => {
      if (group.category === selectedCategory.category) {
        return {
          ...group,
          instructions: group.instructions.filter(i => i.instructionId !== instructionId)
        };
      }
      return group;
    });
    setData({ groups: updatedGroups });
    setSelectedCategory(prev => ({
      ...prev,
      instructions: prev.instructions.filter(i => i.instructionId !== instructionId)
    }));
  };

  const toggleStatus = (instructionId) => {
    const updatedGroups = data.groups.map(group => {
      if (group.category === selectedCategory.category) {
        return {
          ...group,
          instructions: group.instructions.map(i =>
            i.instructionId === instructionId
              ? { ...i, status: i.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
              : i
          )
        };
      }
      return group;
    });
    setData({ groups: updatedGroups });
    setSelectedCategory(prev => ({
      ...prev,
      instructions: prev.instructions.map(i =>
        i.instructionId === instructionId
          ? { ...i, status: i.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
          : i
      )
    }));
  };

  const handleEdit = (id, text) => {
    setEditingId(id);
    setEditedText(text);
  };

  const handleSave = (instructionId) => {
    const updatedGroups = data.groups.map(group => {
      if (group.category === selectedCategory.category) {
        return {
          ...group,
          instructions: group.instructions.map(i =>
            i.instructionId === instructionId ? { ...i, text: editedText } : i
          )
        };
      }
      return group;
    });
    setData({ groups: updatedGroups });
    setSelectedCategory(prev => ({
      ...prev,
      instructions: prev.instructions.map(i =>
        i.instructionId === instructionId ? { ...i, text: editedText } : i
      )
    }));
    setEditingId(null);
    setEditedText('');
  };

  return (
    <div className="p-6 min-h-screen bg-base-100 w-full mx-auto">
      {!selectedCategory ? (
        <div>
          <h2 className="text-3xl font-bold mb-6 text-center">Instructions</h2>
          <div className="grid gap-4  mx-10">
            {data.groups.map((group, idx) => (
              <div
                key={idx}
                className="p-4 rounded bg-base-200 hover:bg-base-300 transition cursor-pointer flex flex-col items-center text-center"
                onClick={() => setSelectedCategory(group)}
              >
                <h3 className="text-xl font-semibold">{group.category}</h3>
                <p className="text-sm text-gray-400 mt-1">{group.summary}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto">
          <button className="btn btn-sm btn-outline" onClick={handleBack}>
            ← Back
          </button>
          <h2 className="text-2xl font-bold">{selectedCategory.category}</h2>
          <p className="text-gray-400">{selectedCategory.summary}</p>

          {selectedCategory.instructions.map((inst) => (
            <div
              key={inst.instructionId}
              className="w-full bg-base-200 p-6 rounded-xl shadow space-y-4"
            >
              <div className="flex justify-between items-start">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    inst.status === "ACTIVE" ? "bg-green-500" : "bg-gray-600"
                  } text-white`}
                >
                  {inst.status}
                </span>

                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-sm btn-ghost btn-circle"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 12h.01M12 12h.01M18 12h.01"
                      />
                    </svg>
                  </div>
                  <ul
                    tabIndex={0}
                    className="menu dropdown-content bg-base-100 shadow rounded-box w-40 z-[10]"
                  >
                    <li>
                      <button onClick={() => toggleStatus(inst.instructionId)}>
                        Toggle Status
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleEdit(inst.instructionId, inst.text)}>
                        Edit
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleDelete(inst.instructionId)}
                        className="text-error"
                      >
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {editingId === inst.instructionId ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="w-full bg-gray-800 text-white p-2 rounded resize-y min-h-[80px] max-h-[200px] overflow-y-auto"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleSave(inst.instructionId)}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{inst.text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
