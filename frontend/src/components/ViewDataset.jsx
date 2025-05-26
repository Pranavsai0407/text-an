import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import RecursiveDataset from "./RecursiveDataset";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const ViewDataset = () => {
  const { _id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/datasets`);
        const found = res.data.find((item) => item.id.toString() === _id);
        setDataset(found || null);
        setLoading(false);
      } catch (error) {
        console.error("Error loading dataset:", error);
        setLoading(false);
      }
    };

    fetchDataset();
  }, [_id]);

  const updateDataset = async (updatedData) => {
    try {
      await axios.put(`${API_BASE_URL}/api/datasets/${updatedData.id}`, updatedData);
      setDataset(updatedData); // locally update after successful save
    } catch (error) {
      console.error("Error updating dataset:", error);
    }
  };

  const deleteDataset = async (targetId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/datasets/${targetId}`);
    } catch (error) {
      console.error("Error deleting dataset:", error);
    }
  };

  const handleDelete = async (targetId) => {
    const deleteRecursively = (node) => {
      if (!node.children) return;
      node.children = node.children.filter((child) => child.id !== targetId);
      node.children.forEach(deleteRecursively);
    };

    if (dataset.id === targetId) return;

    const updatedData = structuredClone(dataset);
    deleteRecursively(updatedData);
    await updateDataset(updatedData);
  };

  const handleEdit = async (updatedItem) => {
    const updateRecursively = (node) => {
      if (node.id === updatedItem.id) {
        Object.assign(node, updatedItem);
        return;
      }
      node.children?.forEach(updateRecursively);
    };

    const updatedData = structuredClone(dataset);
    updateRecursively(updatedData);
    await updateDataset(updatedData);
  };

  const handleAddChild = async (parentId) => {
    const newChild = {
      id: Date.now(),
      name: "New Child Dataset",
      description: "New child description",
      status: "Draft",
      children: [],
    };

    const addChildRecursively = (node) => {
      if (node.id === parentId) {
        node.children = [...(node.children || []), newChild];
        return true;
      }
      return node.children?.some(addChildRecursively);
    };

    const updatedData = structuredClone(dataset);
    addChildRecursively(updatedData);
    await updateDataset(updatedData);
  };

  if (loading) return <div className="text-center text-gray-300">Loading...</div>;
  if (!dataset) return <div className="text-center text-red-500">Dataset not found</div>;

  const roles = dataset?.roles || [];

  return (
    <div className="p-6 max-w-5xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Dataset Details</h1>
        <button
          className="btn btn-sm btn-outline"
          onClick={() => setShowRawJson(!showRawJson)}
        >
          {showRawJson ? "Hide Raw JSON" : "Show Raw JSON"}
        </button>
      </div>

      {showRawJson && (
        <div className="mb-6 bg-base-200 p-4 rounded-lg overflow-x-auto max-h-[500px]">
          <pre className="text-sm text-left whitespace-pre-wrap text-base-content">
            {JSON.stringify(dataset, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-2">Roles:</h2>
        {roles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span key={role.id} className="badge badge-outline text-sm">
                {role.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No roles attached.</p>
        )}
      </div>

      <RecursiveDataset
        data={dataset}
        onAddChild={handleAddChild}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </div>
  );
};

export default ViewDataset;
