import React, { useState, useEffect ,useRef} from "react";
import { Eye, Pencil, Trash2, Plus, Maximize2,MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const statusColor = {
  Active: "badge-success",
  Inactive: "badge-error",
  Draft: "badge-warning",
};

const DatasetCard = ({ data, level = 0, handleDelete, handleEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedInstruction, setExpandedInstruction] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
      function handleClickOutside(event) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuOpen(false);
        }
      }
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
  
  return (
    <div
      className={`card bg-base-200 shadow-lg mb-4 w-full max-w-[1000px] mx-auto ml-${
        level * 4
      }`}
    >
      <div className="card-body p-6">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
          <div>
            <h2 className="card-title text-2xl sm:text-2xl font-semibold">
              {data.name}
            </h2>
            <div className="text-sm text-gray-400 whitespace-pre-wrap">
              {expanded || data.description.length <= 200
                ? data.description
                : `${data.description.slice(0, 200)}... `}
              {data.description.length > 200 && (
                <button
                  className="text-blue-400 ml-1 underline text-xs"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            <div className="text-sm text-gray-400 whitespace-pre-wrap">
              {expandedInstruction || data.instruction.length <= 200
                ? data.instruction
                : `${data.instruction.slice(0, 200)}... `}
              {data.instruction.length > 200 && (
                <button
                  className="text-blue-400 ml-1 underline text-xs"
                  onClick={() => setExpandedInstruction(!expandedInstruction)}
                >
                  {expandedInstruction ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              <span
                className={`badge ${
                  statusColor[data.status] || "badge-outline"
                }`}
              >
                {data.status}
              </span>
            </div>
          </div>
          {/*<div className="flex gap-2 flex-wrap">
            <button className="btn btn-accent btn-sm text-white" onClick={() => handleEdit(data)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </button>
            <button className="btn btn-error btn-sm text-white" onClick={() => handleDelete(data.id)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </button>
          </div>*/}
          <div className="relative mt-2 sm:mt-0" ref={menuRef}>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <ul className="absolute right-0 mt-2 w-40 menu bg-base-100 rounded-box shadow-lg z-50">
                <li>
                  <button onClick={() => handleEdit(data)}>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                </li>
                <li>
                  <button onClick={() => handleDelete(data.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">Delete</span>
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewRoles = () => {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    instruction: "",
    status: "Draft",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandType, setExpandType] = useState(null); // "description" or "instruction"

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/roles`);
        setRoles(response.data);
      } catch (err) {
        console.error("Error fetching roles", err);
      }
    };
    fetchRoles();
  }, []);

  const handleAddRole = async () => {
    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/api/roles/${editId}`, { ...newRole });
        setRoles((prev) => prev.map((item) => item.id === editId ? { ...item, ...newRole } : item));
      } else {
        const newEntry = {
          id: Date.now().toString(),
          ...newRole,
        };
        await axios.post(`${API_BASE_URL}/api/roles`, newEntry);
        setRoles((prev) => [...prev, newEntry]);
      }

      setNewRole({ name: "", description: "", instruction: "", status: "Draft" });
      setIsEditMode(false);
      setEditId(null);
      setShowModal(false);
    } catch (err) {
      console.error("Error saving role", err);
    }
  };

  const handleDeleteRole = async (idToDelete) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/roles/${idToDelete}`);
      setRoles((prev) => prev.filter((d) => d.id !== idToDelete));
    } catch (err) {
      console.error("Error deleting dataset", err);
    }
  };

  const handleEdit = (role) => {
    setNewRole({
      name: role.name,
      description: role.description,
      instruction: role.instruction,
      status: role.status,
    });
    setEditId(role.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  return (
    <div className="p-6 min-h-screen bg-base-100 w-full max-w-none">
      <div className="flex justify-between items-center mb-8 w-full">
        <h1 className="text-4xl font-bold text-white text-center w-full">Roles</h1>
        <div className="absolute right-6">
          <div className="flex justify-center">
            <button
              className="btn btn-primary text-white"
              onClick={() => {
                setShowModal(true);
                setIsEditMode(false);
                setNewRole({ name: "", description: "", instruction: "", status: "Draft" });
              }}
            >
              <Plus className="w-5 h-5 mr-2" /> Add Role
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {roles.map((role) => (
          <DatasetCard
            key={role.id}
            data={role}
            handleDelete={handleDeleteRole}
            handleEdit={handleEdit}
          />
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-base-200 text-base-content p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Role" : "Add New Role"}
            </h2>
            <div className="form-control mb-2">
              <label className="label text-base-content">Name</label>
              <input
                className="input input-bordered bg-base-100 text-base-content"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              />
            </div>

            <div className="form-control mb-2">
              <label className="label text-base-content flex justify-between">
                Description
                <button
                  type="button"
                  onClick={() => setExpandType("description")}
                  className="btn btn-xs btn-outline"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </label>
              <textarea
                className="textarea textarea-bordered bg-base-100 text-base-content"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              />
            </div>

            <div className="form-control mb-2">
              <label className="label text-base-content flex justify-between">
                Instruction
                <button
                  type="button"
                  onClick={() => setExpandType("instruction")}
                  className="btn btn-xs btn-outline"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </label>
              <textarea
                className="textarea textarea-bordered bg-base-100 text-base-content"
                value={newRole.instruction}
                onChange={(e) => setNewRole({ ...newRole, instruction: e.target.value })}
              />
            </div>

            <div className="form-control mb-2">
              <label className="label text-base-content">Status</label>
              <select
                className="select select-bordered bg-base-100 text-base-content"
                value={newRole.status}
                onChange={(e) => setNewRole({ ...newRole, status: e.target.value })}
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Draft</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button className="btn btn-success" onClick={handleAddRole}>
                {isEditMode ? "Save Changes" : "Add"}
              </button>
              <button
                className="btn btn-neutral"
                onClick={() => {
                  setShowModal(false);
                  setIsEditMode(false);
                  setEditId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {(expandType === "description" || expandType === "instruction") && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 overflow-auto">
          <div className="bg-base-200 p-4 w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl flex flex-col">
            <h3 className="text-lg font-bold mb-2">
              Edit {expandType.charAt(0).toUpperCase() + expandType.slice(1)}
            </h3>
            <textarea
              className="textarea textarea-bordered bg-base-100 text-base-content resize both min-h-[200px] max-h-[500px] min-w-[100%] overflow-auto"
              style={{
                resize: "both",
                width: "100%",
                height: "500px",
              }}
              value={newRole[expandType]}
              onChange={(e) => setNewRole({ ...newRole, [expandType]: e.target.value })}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-success" onClick={() => setExpandType(null)}>
                Save
              </button>
              <button className="btn btn-neutral" onClick={() => setExpandType(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewRoles;
