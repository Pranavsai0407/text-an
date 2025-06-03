import React, { useEffect, useState,useRef } from "react";
import { Eye, Pencil, Trash2, Plus ,Maximize2,MoreVertical} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

//import { initialRoles } from "./ViewRoles";

//const API_URL = "http://localhost:5001/api/datasets";
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const statusColor = {
  Active: "badge-success",
  Inactive: "badge-error",
  Draft: "badge-warning",
};




const DatasetCard = ({ data, level = 0, handleDelete, handleEdit }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
            <h2 className="card-title text-lg sm:text-2xl font-semibold">
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

            <div className="flex gap-2 mt-2 flex-wrap">
              <span
                className={`badge ${
                  statusColor[data.status] || "badge-outline"
                }`}
              >
                {data.status}
              </span>
            </div>
            {data.roles?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {data.roles.map((role) => (
                  <span key={role.id} className="badge badge-outline">
                    {role.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/*<div className="flex gap-2 flex-wrap">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate(`/viewDataset/${data.id}`)}
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </button>
            <button
              className="btn btn-accent btn-sm text-white"
              onClick={() => handleEdit(data)}
            >
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </button>
            <button
              className="btn btn-error btn-sm text-white"
              onClick={() => handleDelete(data.id)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </button>
          </div>*/}
          {/* Dropdown Menu */}
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
                  <button onClick={() => navigate(`/viewDataset/${data.id}`)}>
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </li>
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


const AdminPage = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newDataset, setNewDataset] = useState({
    name: "",
    description: "",
    converted:"No",
    status: "Draft",
    roles: [],
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandType, setExpandType] = useState(null);

  // Fetch datasets on mount
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

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/datasets`);
        setDatasets(response.data);
      } catch (err) {
        console.error("Error fetching datasets", err);
      }
    };
    fetchDatasets();
  }, []);

  const handleAddDataset = async () => {
    try {
      if (isEditMode) {
        //console.log(newDataset);
        await axios.put(`${API_BASE_URL}/api/datasets/${editId}`, {
          ...newDataset,
        });
        setDatasets((prev) =>
          prev.map((item) =>
            item.id === editId ? { ...item, ...newDataset } : item
          )
        );
      } else {
        console.log(1);
        const newEntry = {
          id: Date.now().toString(), // ensure it's string to match DynamoDB schema
          ...newDataset,
          children: [],
        };
        //console.log(newEntry);
        await axios.post(`${API_BASE_URL}/api/datasets`, newEntry);
        setDatasets((prev) => [...prev, newEntry]);
      }

      setNewDataset({ name: "", description: "", converted: "No", status: "Draft", roles: [] });
      setIsEditMode(false);
      setEditId(null);
      setShowModal(false);
    } catch (err) {
      console.error("Error saving dataset", err);
    }
  };

  const handleDeleteDataset = async (idToDelete) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/datasets/${idToDelete}`);
      setDatasets((prev) => prev.filter((d) => d.id !== idToDelete));
    } catch (err) {
      console.error("Error deleting dataset", err);
    }
  };

  const handleEdit = (dataset) => {
    console.log(dataset);
    setNewDataset({
      name: dataset.name,
      description: dataset.description,
      converted:"No",
      status: dataset.status || "Draft",
      roles: dataset.roles || [],
    });
    setEditId(dataset.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  return (
    <div className="p-6 min-h-screen bg-base-100 w-full max-w-none">
      <div className="flex justify-between items-center mb-8 w-full">
        <h1 className="text-4xl font-bold text-white text-center w-full">Admin Panel</h1>
        <div className="absolute right-6">
          <div className="flex justify-center">
            <button className="btn btn-info text-white mr-4 font-medium" onClick={() => navigate("/viewRoles")}>
              View Roles
            </button>
            <button
              className="btn btn-primary text-white"
              onClick={() => {
                setShowModal(true);
                setIsEditMode(false);
                setNewDataset({ name: "", description: "",converted:"No", status: "Draft", roles: [] });
              }}
            >
              <Plus className="w-5 h-5 mr-2" /> Add Dataset
            </button>
            <button className="btn btn-success text-white mr-4 ml-4 font-medium" onClick={() => window.open("http://textanythingadminn.s3-website.eu-north-1.amazonaws.com/", "_blank")}>
              Add credentials
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {datasets.map((dataset) => (
          <DatasetCard key={dataset.id} data={dataset} handleDelete={handleDeleteDataset} handleEdit={handleEdit} />
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-base-200 text-base-content p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{isEditMode ? "Edit Dataset" : "Add New Dataset"}</h2>

            <div className="form-control mb-2">
              <label className="label text-base-content">Name</label>
              <input
                className="input input-bordered bg-base-100 text-base-content"
                value={newDataset.name}
                onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
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
                value={newDataset.description}
                onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
              />
            </div>

            <div className="form-control mb-2">
              <label className="label text-base-content">Status</label>
              <select
                className="select select-bordered bg-base-100 text-base-content"
                value={newDataset.status}
                onChange={(e) => setNewDataset({ ...newDataset, status: e.target.value })}
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Draft</option>
              </select>
            </div>

            {/* Role Selector */}
            <div className="form-control mb-2">
              <label className="label text-base-content">Attach Roles</label>
              <select
                multiple
                className="form-multiselect bg-base-100 text-base-content h-32 w-full border rounded px-2 py-1"
                value={newDataset.roles.map((role) => role.id.toString())}
                onChange={(e) => {
                  const selectedIds = Array.from(e.target.selectedOptions, (opt) => opt.value);
                  const selectedRoles = roles.filter((role) =>
                    selectedIds.includes(role.id.toString())
                  );
                  setNewDataset({ ...newDataset, roles: selectedRoles });
                }}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id.toString()}>
                    {role.name}
                  </option>
                ))}
              </select>

              {newDataset.roles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm mb-1">Selected Roles:</p>
                  <div className="flex flex-wrap gap-2">
                    {newDataset.roles.map((role) => (
                      <div key={role.id} className="badge badge-outline flex items-center gap-1">
                        {role.name}
                        <button
                          onClick={() =>
                            setNewDataset({
                              ...newDataset,
                              roles: newDataset.roles.filter((r) => r.id !== role.id),
                            })
                          }
                          className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button className="btn btn-success" onClick={handleAddDataset}>
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
              value={newDataset[expandType]}
              onChange={(e) => setNewDataset({ ...newDataset, [expandType]: e.target.value })}
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

export default AdminPage;
