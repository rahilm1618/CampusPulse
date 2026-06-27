import { useState } from "react";
import axios from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { FaTimes, FaCamera } from "react-icons/fa";

const TaskActionModal = ({ incident, onClose, onUpdate }) => {
  const [status, setStatus] = useState(incident.status);
  const [proofImage, setProofImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Note: We removed the 'comment' state and 'sendComment' function 
  // because we now use the dedicated Chat Interface for that!

  // Handle Status Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Validation: Must upload proof if Resolving
    if (status === "RESOLVED" && !proofImage) {
      return toast.error("You must upload a 'After Fix' photo to resolve this.");
    }

    const formData = new FormData();
    formData.append("status", status);
    if (proofImage) {
      formData.append("afterFix", proofImage); 
    }

    try {
      setLoading(true);
      await axios.patch(`/incidents/${incident._id}/status`, formData);
      toast.success(`Task updated to ${status}`);
      onUpdate(); // Refresh parent dashboard
      onClose();
    } catch (error) {
      console.error(error.response?.data);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FaTimes size={20} />
        </button>

        {/* Header */}
        <div className="mb-6 border-b border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-white">{incident.title}</h2>
          <span className={`mt-2 inline-block px-3 py-1 text-xs rounded-full font-bold ${
             incident.priority === 'Critical' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
             {incident.priority} Priority
          </span>
        </div>

        <div className="space-y-6">
          {/* Details */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-300 text-sm mb-1">Location:</p>
            <p className="font-semibold text-white mb-2">
              {incident.location.blockName} - Room {incident.location.roomNumber}
            </p>
            <p className="text-gray-300 text-sm mb-1">Description:</p>
            <p className="text-white text-sm">{incident.description}</p>
          </div>
          
           {/* Before Image (If exists) */}
           {incident.images?.beforeFix[0] && (
              <div className="bg-gray-700 p-2 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Issue Photo:</p>
                <img 
                  src={incident.images.beforeFix[0]} 
                  alt="Issue" 
                  className="w-full h-32 object-cover rounded border border-gray-600"
                />
              </div>
           )}

          {/* Action Form */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
                <label className="text-sm text-gray-400">Update Status</label>
                <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full mt-1 p-3 bg-gray-900 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
                >
                    {incident.status === 'REOPENED' ? (
                        <option value="REOPENED">Reopened (Needs Attention)</option>
                    ) : (
                        <option value="OPEN">Open (Not Started)</option>
                    )}
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved (Done)</option>
                </select>
            </div>

            {status === 'RESOLVED' && (
                <label className="flex items-center justify-center gap-2 cursor-pointer bg-gray-700 hover:bg-gray-600 p-4 rounded border border-dashed border-gray-500 transition">
                <FaCamera className="text-blue-400" />
                <span className="text-sm text-gray-300">
                    {proofImage ? "Proof Photo Selected" : "Upload Proof (Required)"}
                </span>
                <input type="file" className="hidden" onChange={(e) => setProofImage(e.target.files[0])} />
                </label>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold transition disabled:opacity-50"
            >
                {loading ? "Updating..." : "Update Task"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskActionModal;