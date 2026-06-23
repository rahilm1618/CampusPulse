import { useEffect, useState, useCallback } from "react";
import axios from "../utils/axiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ReportIncidentForm from "../components/ReportIncidentForm";
import ChatInterface from "../components/ChatInterface"; // <--- Import the Chat Component

const StudentDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' or 'chat'
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Optimized Fetch Function (Reusable)
    const fetchIncidents = useCallback(async () => {
        try {
            const res = await axios.get("/incidents/my-incidents");
            setIncidents(res.data.data);
        } catch (error) {
            console.error("Fetch error", error);
            toast.error("Failed to load your data");
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "OPEN": return "bg-yellow-500";
            case "IN_PROGRESS": return "bg-blue-500";
            case "RESOLVED": return "bg-green-500";
            case "REOPENED": return "bg-red-500";
            default: return "bg-gray-500";
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-700 pb-4 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-blue-400">Welcome, {user?.name}</h1>
                    <p className="text-gray-400">Student Dashboard</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold transition shadow-lg hover:shadow-blue-500/50"
                    >
                        + Report New Issue
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg font-semibold transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* --- TAB NAVIGATION --- */}
            <div className="flex gap-6 mb-6">
                <button 
                    onClick={() => setActiveTab("dashboard")}
                    className={`pb-2 px-2 font-semibold transition ${
                        activeTab === 'dashboard' 
                        ? 'text-blue-400 border-b-2 border-blue-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Dashboard Overview
                </button>
                <button 
                    onClick={() => setActiveTab("chat")}
                    className={`pb-2 px-2 font-semibold transition ${
                        activeTab === 'chat' 
                        ? 'text-blue-400 border-b-2 border-blue-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Messages / Chat
                </button>
            </div>

            {/* --- CONTENT AREA --- */}
            {activeTab === "dashboard" ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                            <h3 className="text-gray-400 text-sm">Total Reports</h3>
                            <p className="text-3xl font-bold">{incidents.length}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                            <h3 className="text-gray-400 text-sm">Resolved</h3>
                            <p className="text-3xl font-bold">
                                {incidents.filter(i => i.status === 'RESOLVED').length}
                            </p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
                            <h3 className="text-gray-400 text-sm">Pending</h3>
                            <p className="text-3xl font-bold">
                                {incidents.filter(i => i.status !== 'RESOLVED').length}
                            </p>
                        </div>
                    </div>

                    {/* Incidents Table */}
                    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold">My Report History</h2>
                        </div>

                        {loading ? (
                            <div className="p-6 text-center text-gray-400 animate-pulse">Loading data...</div>
                        ) : incidents.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                <p className="text-lg">No incidents reported yet.</p>
                                <button onClick={() => setIsModalOpen(true)} className="text-blue-400 hover:underline mt-2">Create your first report</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                                        <tr>
                                            <th className="p-4">Title</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Assigned To</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {incidents.map((incident) => (
                                            <tr key={incident._id} className="hover:bg-gray-750 transition">
                                                <td className="p-4 font-medium flex items-center gap-2">
                                                    {incident.priority === 'Critical' && <span className="text-red-500 animate-pulse">●</span>}
                                                    {incident.title}
                                                </td>
                                                <td className="p-4 text-sm text-gray-300">{incident.category}</td>
                                                <td className="p-4 text-sm text-gray-400">
                                                    {new Date(incident.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(incident.status)}`}>
                                                        {incident.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-400">
                                                    {incident.assignedTo?.name || "Unassigned"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* --- CHAT TAB --- */
                <ChatInterface 
                    incidents={incidents} 
                    currentUser={user} 
                    onRefresh={fetchIncidents} // Pass the refresh function to chat
                />
            )}

            {/* Modal */}
            {isModalOpen && (
                <ReportIncidentForm
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchIncidents} // Pass refresh function instead of reloading page
                />
            )}
        </div>
    );
};

export default StudentDashboard;