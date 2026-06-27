import { useEffect, useState, useCallback } from "react";
import axios from "../utils/axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import TaskActionModal from "../components/TaskActionModal";
import ChatInterface from "../components/ChatInterface";
import PanicButton from "../components/PanicButton"; // Reusing the chat!
import { FaClipboardCheck, FaTools, FaStar, FaExclamationTriangle } from "react-icons/fa";

const StaffDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ completedToday: 0, activePending: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  // Reusable Fetch Function
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Get My Tasks
      const taskRes = await axios.get("/incidents/my-tasks");
      setTasks(taskRes.data.data);

      // 2. Get Stats
      const statRes = await axios.get("/staff/stats");
      setStats(statRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error("Fetch error", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">Staff Dashboard</h1>
          <p className="text-gray-400">Welcome, {user?.name}</p>
        </div>
        <button 
          onClick={() => { dispatch(logout()); navigate("/login"); }}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg font-semibold"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6">
        <button 
            onClick={() => setActiveTab("dashboard")}
            className={`pb-2 px-2 font-semibold transition ${
                activeTab === 'dashboard' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            }`}
        >
            My Tasks
        </button>
        <button 
            onClick={() => setActiveTab("chat")}
            className={`pb-2 px-2 font-semibold transition ${
                activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            }`}
        >
            Messages
        </button>
      </div>

      {/* Content Switcher */}
      {activeTab === "dashboard" ? (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-green-500 flex items-center gap-4">
                    <div className="bg-green-900 p-3 rounded-full text-green-400"><FaClipboardCheck size={24}/></div>
                    <div>
                        <p className="text-gray-400 text-sm">Completed Today</p>
                        <p className="text-3xl font-bold">{stats.completedToday}</p>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-yellow-500 flex items-center gap-4">
                    <div className="bg-yellow-900 p-3 rounded-full text-yellow-400"><FaTools size={24}/></div>
                    <div>
                        <p className="text-gray-400 text-sm">Active Pending</p>
                        <p className="text-3xl font-bold">{stats.activePending}</p>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-purple-500 flex items-center gap-4">
                    <div className="bg-purple-900 p-3 rounded-full text-purple-400"><FaStar size={24}/></div>
                    <div>
                        <p className="text-gray-400 text-sm">Avg Rating</p>
                        <p className="text-3xl font-bold">{stats.averageRating} / 5</p>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Assigned Tasks</h2>
                
                {loading ? (
                    <p className="text-center text-gray-500">Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-lg">No active tasks. Good job! ☕</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {tasks.map((task) => (
                        <div 
                            key={task._id} 
                            onClick={() => setSelectedTask(task)}
                            className="bg-gray-700 hover:bg-gray-650 p-4 rounded-lg flex justify-between items-center cursor-pointer transition border border-transparent hover:border-blue-500 group"
                        >
                            <div className="flex items-start gap-4">
                                {/* Priority Icon */}
                                {task.priority === 'Critical' ? (
                                    <div className="bg-red-900/50 p-3 rounded-full text-red-500 animate-pulse">
                                        <FaExclamationTriangle />
                                    </div>
                                ) : (
                                    <div className="bg-blue-900/50 p-3 rounded-full text-blue-500">
                                        <FaTools />
                                    </div>
                                )}
                                
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg group-hover:text-blue-400 transition">{task.title}</h3>
                                        {task.priority === 'Critical' && (
                                            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Critical</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {task.location.blockName} - Room {task.location.roomNumber}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Assigned: {new Date(task.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    task.status === 'OPEN' ? 'bg-yellow-600' : 
                                    task.status === 'IN_PROGRESS' ? 'bg-blue-600' : 'bg-green-600'
                                }`}>
                                    {task.status}
                                </span>
                                <span className="text-xs text-blue-400 hover:underline">Click to Update</span>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </div>
          </>
      ) : (
          /* --- CHAT TAB --- */
          <ChatInterface 
              incidents={tasks}  // Staff sees "Tasks" in the chat list
              currentUser={user} 
              onRefresh={fetchDashboardData} 
          />
      )}

      {selectedTask && (
        <TaskActionModal 
          incident={selectedTask} 
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchDashboardData} 
        />
      )}

      {/* Floating Panic Button */}
      <PanicButton onPanicSuccess={fetchDashboardData} />
    </div>
  );
};

export default StaffDashboard;