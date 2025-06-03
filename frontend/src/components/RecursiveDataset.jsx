import React, { useState ,useRef,useEffect} from "react";
import { Pencil, Trash2, Plus, Maximize2, MoreVertical } from "lucide-react";

const statusColor = {
  Active: "badge-success",
  Inactive: "badge-error",
  Draft: "badge-warning",
};

const RecursiveDataset = ({ data, onAddChild, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expandDescription, setExpandDescription] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef();

  const [editValues, setEditValues] = useState({
    name: data.name,
    description: data.description,
    status: data.status,
    role: data.role || "service bot",
  });

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
    <div className="card bg-base-200 shadow-md mb-4 w-full mx-auto">
      <div className="card-body p-4">
        <div className="flex justify-between items-start flex-col sm:flex-row">
          <div>
            <h2 className="card-title">{data.name}</h2>
            <p>{data.description}</p>
            <span className={`badge ${statusColor[data.status] || "badge-outline"}`}>
              {data.status}
            </span>
          </div>

          {/* Dropdown Menu */}
          <div className="relative mt-2 sm:mt-0"ref={menuRef}>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <ul className="absolute right-0 mt-2 w-40 menu bg-base-100 rounded-box shadow-lg z-50">
                <li>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onDelete(data.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">Delete</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onAddChild(data.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Plus className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Add data</span>
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Main Edit Modal */}
        {isEditing && !expandDescription && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Edit Dataset</h3>

              <div className="form-control mb-2">
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editValues.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                />
              </div>

              <div className="form-control mb-2">
                <label className="label flex justify-between">
                  <span>Description</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => {
                      setIsEditing(false);
                      setExpandDescription(true);
                    }}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={editValues.description}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">Status</label>
                <select
                  className="select select-bordered"
                  value={editValues.status}
                  onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Draft</option>
                </select>
              </div>

              <div className="modal-action">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onEdit({ ...data, ...editValues });
                    setIsEditing(false);
                  }}
                >
                  Save
                </button>
                <button className="btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expanded Description Modal */}
        {expandDescription && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center overflow-auto">
            <div className="bg-base-200 p-6 w-full max-w-4xl max-h-[90vh] rounded-lg shadow-lg flex flex-col">
              <h3 className="text-lg font-bold mb-2">Edit Description</h3>
              <textarea
                className="textarea textarea-bordered bg-base-100 text-base-content resize both min-h-[200px] max-h-[500px] w-full overflow-auto"
                style={{ resize: "both", height: "500px" }}
                value={editValues.description}
                onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="btn btn-success"
                  onClick={() => {
                    setExpandDescription(false);
                    setIsEditing(true);
                  }}
                >
                  Save
                </button>
                <button
                  className="btn btn-neutral"
                  onClick={() => {
                    setExpandDescription(false);
                    setIsEditing(true);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recursive Rendering of Children */}
        {data.children?.length > 0 && (
          <div className="ml-6 mt-4 space-y-4">
            {data.children.map((child) => (
              <RecursiveDataset
                key={child.id}
                data={child}
                onAddChild={onAddChild}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecursiveDataset;
