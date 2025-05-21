import React, { useState } from "react";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";

const statusColor = {
  Active: "badge-success",
  Inactive: "badge-error",
  Draft: "badge-warning",
};

const RecursiveDataset = ({ data, onAddChild, onDelete, onEdit }) => {
  const [showChildren, setShowChildren] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: data.name,
    description: data.description,
    status: data.status,
    role: data.role || "service bot",
  });

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
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </button>
            <button
              className="btn btn-error btn-sm text-white"
              onClick={() => onDelete(data.id)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </button>
            <button
              className="btn btn-success btn-sm text-white text-sm"
              onClick={() => onAddChild(data.id)}
            >
              <Plus className="w-4 h-4" /> Add data
            </button>
          </div>

          <input
            type="checkbox"
            id={`edit-modal-${data.id}`}
            className="modal-toggle"
            checked={isEditing}
            readOnly
          />
          <div className="modal">
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
                <label className="label">Description</label>
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
        </div>

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
