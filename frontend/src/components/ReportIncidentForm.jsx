import { useState } from "react";
import axios from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { FaMapMarkerAlt, FaCamera, FaTimes } from "react-icons/fa"; // Run npm install react-icons if needed

const ReportIncidentForm = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Electrical", // Default
    blockName: "",
    roomNumber: "",
  });
  
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState({ lat: null, long: null });
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Not fetched");

  // 1. Handle Text Inputs
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Handle File Input
  const onFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  // 3. Handle Geolocation
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocationStatus("Fetching...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        });
        setLocationStatus("Acquired ✅");
        toast.success("Location acquired!");
      },
      (error) => {
        setLocationStatus("Failed ❌");
        toast.error("Unable to retrieve your location");
      }
    );
  };

  // 4. Submit Form
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!location.lat) {
      return toast.error("Please enable location services to report.");
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("blockName", formData.blockName);
    data.append("roomNumber", formData.roomNumber);
    data.append("latitude", location.lat);
    data.append("longitude", location.long);
    if (image) {
      data.append("image", image); // Match the field name expected by Multer
    }

    try {
      setLoading(true);
      // Content-Type is auto-set by Axios for FormData
      await axios.post("/incidents", data);
      
      toast.success("Incident reported successfully!");
      setFormData({
        title: "", description: "", category: "Electrical", blockName: "", roomNumber: ""
      });
      setImage(null);
      setLocation({ lat: null, long: null });
      onSuccess(); // Refresh the parent list
      onClose();   // Close the modal
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to report incident");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <FaTimes size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Report New Incident</h2>
        
        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* Title & Category */}
          <div className="grid grid-cols-2 gap-4">
            <input 
              name="title" placeholder="Title (e.g. Broken Fan)" value={formData.title} onChange={onChange}
              className="bg-gray-700 text-white p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required
            />
            <select 
              name="category" value={formData.category} onChange={onChange}
              className="bg-gray-700 text-white p-3 rounded-lg w-full focus:outline-none"
            >
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Furniture">Furniture</option>
              <option value="Internet">Internet</option>
              <option value="Civil">Civil</option>
            </select>
          </div>

          {/* Description */}
          <textarea 
            name="description" placeholder="Describe the issue..." value={formData.description} onChange={onChange}
            className="bg-gray-700 text-white p-3 rounded-lg w-full h-24 focus:outline-none focus:ring-2 focus:ring-blue-500" required
          />

          {/* Location Details */}
          <div className="grid grid-cols-2 gap-4">
            <input 
              name="blockName" placeholder="Block Name (e.g. A-Block)" value={formData.blockName} onChange={onChange}
              className="bg-gray-700 text-white p-3 rounded-lg w-full" required
            />
            <input 
              name="roomNumber" placeholder="Room No (e.g. 304)" value={formData.roomNumber} onChange={onChange}
              className="bg-gray-700 text-white p-3 rounded-lg w-full" required
            />
          </div>

          {/* Action Buttons: Geo & Camera */}
          <div className="flex gap-4">
            
            {/* Geo Button */}
            <button 
              type="button" onClick={getLocation}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-semibold transition ${location.lat ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'}`}
            >
              <FaMapMarkerAlt /> {location.lat ? "Location Set" : "Get Location"}
            </button>
            
            {/* Image Upload */}
            <label className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 p-3 rounded-lg cursor-pointer transition">
              <FaCamera /> {image ? "Image Selected" : "Attach Photo"}
              <input type="file" onChange={onFileChange} className="hidden" accept="image/*" />
            </label>
          </div>
            
            {locationStatus !== 'Not fetched' && (
                <p className="text-xs text-center text-gray-400">GPS Status: {locationStatus}</p>
            )}

          {/* Submit */}
          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentForm;