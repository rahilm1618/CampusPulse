import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import axios from "../utils/axiosInstance";
import { toast } from "react-toastify";
import TaskActionModal from "../components/TaskActionModal";
import ChatInterface from "../components/ChatInterface";
import SecurityMap from "../components/SecurityMap";
import PanicButton from "../components/PanicButton";
import AnnouncementBanner from "../components/AnnouncementBanner";
import ProfileSettingsModal from "../components/ProfileSettingsModal";
import { FaMapMarkedAlt, FaListUl, FaComments, FaExclamationTriangle, FaShieldAlt, FaCog, FaUserCircle } from "react-icons/fa";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

const SecurityDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const [tasks, setTasks] = useState([]);
    const [mapData, setMapData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'map', 'chat'
    const [selectedTask, setSelectedTask] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const unreadCount = useUnreadMessages(tasks, user);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [tasksRes, mapRes] = await Promise.all([
                axios.get('/incidents/my-tasks'),
                axios.get('/incidents/map-data')
            ]);
            setTasks(tasksRes.data.data || tasksRes.data);
            setMapData(mapRes.data.data || mapRes.data);
        } catch (error) {
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    // Derived stats
    const unassignedCritical = mapData.filter(inc => inc.priority === 'Critical' && !inc.assignedTo).length;
    const activeTasksCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;

    return (
        <div className="min-h-screen bg-gray-900 pb-12 pt-6 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 mb-8">
                    <div className="flex items-center gap-4">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-lg" />
                        ) : (
                            <FaUserCircle className="text-5xl text-gray-400" />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Security Command Center</h1>
                            <p className="text-gray-400">Officer: <span className="text-blue-400 font-semibold">{user.name}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <div className="bg-gray-700 px-4 py-3 rounded-xl border border-gray-600 text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Active Patrol</p>
                            <p className="text-2xl font-bold text-blue-400">{activeTasksCount}</p>
                        </div>
                        <div className={`px-4 py-3 rounded-xl border text-center ${unassignedCritical > 0 ? 'bg-red-900/30 border-red-700' : 'bg-gray-700 border-gray-600'}`}>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Critical Alerts</p>
                            <p className={`text-2xl font-bold ${unassignedCritical > 0 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
                                {unassignedCritical}
                            </p>
                        </div>
                        <div className="flex items-center ml-2 border-l border-gray-700 pl-4 gap-3">
                            <button 
                                onClick={() => setIsSettingsOpen(true)}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition border border-gray-700 shadow-sm"
                                title="Profile Settings"
                            >
                                <FaCog size={20} />
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-gray-800 rounded-xl p-1 mb-6 border border-gray-700 max-w-md">
                    <button 
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition ${
                            activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                        <FaListUl /> Action Queue
                    </button>
                    <button 
                        onClick={() => setActiveTab('map')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition ${
                            activeTab === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                        <FaMapMarkedAlt /> Live Map
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition relative ${
                            activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                        <FaComments /> Comms
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-md">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="fade-in-up">
                        {activeTab === 'tasks' && (
                            <div className="space-y-6">
                                <AnnouncementBanner />
                                <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-700">
                                        <h2 className="text-xl font-bold text-white">Your Assigned Tasks & Unassigned Alerts</h2>
                                        <p className="text-sm text-gray-400 mt-1">Claim unassigned incidents or update your active patrol tasks.</p>
                                    </div>
                                    
                                    {tasks.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <FaShieldAlt className="mx-auto text-4xl text-gray-600 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-300">Campus is secure</h3>
                                        <p className="text-gray-500 mt-1">No active incidents require your attention.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-700">
                                        {tasks.map((task) => (
                                            <div 
                                                key={task._id} 
                                                onClick={() => setSelectedTask(task)}
                                                className="p-5 hover:bg-gray-700/50 cursor-pointer transition flex flex-col md:flex-row justify-between md:items-center gap-4"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-full mt-1 ${
                                                        task.priority === 'Critical' ? 'bg-red-900/50 text-red-500' :
                                                        task.priority === 'High' ? 'bg-orange-900/50 text-orange-500' :
                                                        'bg-blue-900/50 text-blue-500'
                                                    }`}>
                                                        {task.priority === 'Critical' ? <FaExclamationTriangle /> : <FaShieldAlt />}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                                            {task.title}
                                                            {!task.assignedTo && (
                                                                <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border border-yellow-500/30">
                                                                    Unassigned
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm mb-2">{task.description.substring(0, 80)}...</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                                                📍 {task.location?.blockName} - Room {task.location?.roomNumber}
                                                            </span>
                                                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                                                ⏱️ {new Date(task.createdAt).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-gray-700 pt-3 md:pt-0">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        task.status === 'OPEN' ? 'bg-yellow-600 text-white' : 
                                                        task.status === 'IN_PROGRESS' ? 'bg-blue-600 text-white' : 
                                                        'bg-green-600 text-white'
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                    <span className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                                                        {!task.assignedTo ? 'Claim Task →' : 'Update Status →'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        )}

                        {activeTab === 'map' && (
                            <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-4">
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-white">Live Campus Map</h2>
                                    <p className="text-sm text-gray-400 mt-1">Real-time view of reported incidents.</p>
                                </div>
                                <SecurityMap incidents={mapData} />
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 h-150 overflow-hidden">
                                <ChatInterface 
                                    incidents={tasks}  
                                    currentUser={user} 
                                    onRefresh={fetchDashboardData} 
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Popup */}
            {selectedTask && (
                <TaskActionModal 
                    incident={selectedTask} 
                    onClose={() => setSelectedTask(null)}
                    onUpdate={fetchDashboardData} 
                />
            )}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <ProfileSettingsModal onClose={() => setIsSettingsOpen(false)} />
            )}

            {/* Floating Panic Button
            <PanicButton onPanicSuccess={fetchDashboardData} /> */}
        </div>
    );
};

export default SecurityDashboard;
