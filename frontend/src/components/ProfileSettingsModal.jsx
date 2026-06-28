import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { FaUserCircle, FaTimes, FaCamera } from "react-icons/fa";
import { updateUser } from "../features/auth/authSlice";

const ProfileSettingsModal = ({ onClose }) => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        password: '',
        confirmPassword: ''
    });
    
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            return toast.error("Passwords do not match");
        }
        if (formData.password && formData.password.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        try {
            setIsUpdating(true);
            const data = new FormData();
            
            if (formData.name !== user.name) data.append("name", formData.name);
            if (formData.password) data.append("password", formData.password);
            if (avatarFile) data.append("avatar", avatarFile);

            const res = await axios.put("/auth/profile", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Update Redux state
            dispatch(updateUser(res.data.data));
            toast.success("Profile updated successfully!");
            onClose();

        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative fade-in-up">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                    <FaTimes size={20} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div 
                            className="relative w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-purple-500 transition-colors"
                            onClick={handleAvatarClick}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <FaUserCircle size={48} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <FaCamera className="text-white text-xl" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Click to change avatar</p>
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileChange} 
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Full Name</label>
                        <input
                            type="text" required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Email (Disabled) */}
                    <div>
                        <label className="text-sm text-gray-400 block mb-1 flex justify-between">
                            Email Address <span className="text-xs text-orange-500">Locked</span>
                        </label>
                        <input
                            type="email" disabled
                            value={user?.email || 'N/A'}
                            className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="pt-2 border-t border-gray-800">
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">Change Password (Optional)</h4>
                        
                        <div className="space-y-3">
                            <div>
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="Confirm New Password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit" disabled={isUpdating}
                        className="w-full py-3 mt-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
                    >
                        {isUpdating ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettingsModal;
