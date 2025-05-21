import React, { useState } from "react";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001/api/roles";

export const initialRoles = [
  {
    id: 1,
    name: "service bot",
    description: "This is a role1.",
    instruction:"abcd",
    status: "Active",
  },
  {
    id: 2,
    name: "sales bot",
    description: "This is a role2.",
    instruction:"abcd",
    status: "Active",
  },
  {
    id: 3,
    name: "support bot",
    description: "This is a role3.",
    instruction:"abcd",
    status: "Active",
  },
];

const statusColor = {
  Active: "badge-success",
  Inactive: "badge-error",
  Draft: "badge-warning",
};


const DatasetCard = ({ data, level = 0, handleDelete, handleEdit }) => {
  const navigate = useNavigate();

  return (
    <div className={`card bg-base-200 shadow-lg mb-4 w-full max-w-[1000px] mx-auto ml-${level * 4}`}>
      <div className="card-body p-6">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
          <div>
            <h2 className="card-title text-2xl sm:text-2xl font-semibold">{data.name}</h2>
            <p className="text-xl text-gray-400">{data.description}</p>
            <p className="text-xs font-serif text-gray-400">Instruction:  {data.instruction}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`badge ${statusColor[data.status] || "badge-outline"}`}>{data.status}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-accent btn-sm text-white" onClick={() => handleEdit(data)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </button>
            <button className="btn btn-error btn-sm text-white" onClick={() => handleDelete(data.id)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </button>
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
    instruction:"",
    status: "Draft",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  useEffect(() => {
      const fetchRoles = async () => {
        try {
          const response = await axios.get(API_URL);
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
            await axios.put(`${API_URL}/${editId}`, {
              ...newRole,
            });
            setRoles((prev) =>
              prev.map((item) =>
                item.id === editId ? { ...item, ...newRole } : item
              )
            );
          } else {
            console.log(1);
            const newEntry = {
              id: Date.now().toString(), // ensure it's string to match DynamoDB schema
              ...newRole,
            };
            //console.log(newEntry);
            await axios.post(API_URL, newEntry);
            setRoles((prev) => [...prev, newEntry]);
          }
    
          setNewRole({ name: "", description: "", instruction:"",status: "Draft" });
          setIsEditMode(false);
          setEditId(null);
          setShowModal(false);
        } catch (err) {
          console.error("Error saving role", err);
        }
      };
    
  

      const handleDeleteRole = async (idToDelete) => {
        try {
          await axios.delete(`${API_URL}/${idToDelete}`);
          setRoles((prev) => prev.filter((d) => d.id !== idToDelete));
        } catch (err) {
          console.error("Error deleting dataset", err);
        }
      };
  

      const handleEdit = (role) => {
        setNewRole({
          name: role.name,
          description: role.description,
          instruction:role.instruction,
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
          <button className="btn btn-primary text-white" onClick={() => {
            setShowModal(true);
            setIsEditMode(false);
            setNewRole({
              name: "",
              description: "",
              instruction:"",
              status: "Draft",
            });
          }}>
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
              <label className="label text-base-content">Description</label>
              <textarea
                className="textarea textarea-bordered bg-base-100 text-base-content"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              />
            </div>
            <div className="form-control mb-2">
              <label className="label text-base-content">Instruction</label>
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
              <button className="btn btn-neutral" onClick={() => {
                setShowModal(false);
                setIsEditMode(false);
                setEditId(null);
              }}>
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