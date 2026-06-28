import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { FaUsers, FaTasks, FaBullhorn, FaTrash, FaChartPie, FaCog, FaUserCircle } from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import ProfileSettingsModal from "../components/ProfileSettingsModal";

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [incidentsList, setIncidentsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Broadcast Form State
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    priority: 'Normal',
    audience: 'All',
    targetDepartment: ''
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, incidentsRes, deptsRes, announcementsRes] = await Promise.all([
        axios.get("/admin/stats"),
        axios.get("/admin/users"),
        axios.get("/admin/incidents"),
        axios.get("/departments"),
        axios.get("/admin/announcements")
      ]);
      setStats(statsRes.data);
      setUsersList(usersRes.data);
      setIncidentsList(incidentsRes.data.data);
      setDepartments(deptsRes.data);
      setAnnouncementsList(announcementsRes.data);
    } catch (error) {
      toast.error("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user permanently?")) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      setUsersList(usersList.filter(u => u._id !== id));
      toast.success("User deleted successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user.");
    }
  };

  const handleDeleteIncident = async (id) => {
    if (!window.confirm("Are you sure you want to delete this incident permanently?")) return;
    try {
      await axios.delete(`/admin/incidents/${id}`);
      setIncidentsList(incidentsList.filter(i => i._id !== id));
      toast.success("Incident deleted successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete incident.");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this broadcast?")) return;
    try {
      await axios.delete(`/admin/announcements/${id}`);
      setAnnouncementsList(announcementsList.filter(a => a._id !== id));
      toast.success("Broadcast deleted successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete broadcast.");
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (broadcastData.audience === 'Department' && !broadcastData.targetDepartment) {
        return toast.error("Please select a target department.");
    }
    try {
      setIsBroadcasting(true);
      const res = await axios.post("/admin/announcements", broadcastData);
      setAnnouncementsList([res.data.data, ...announcementsList]);
      toast.success("Broadcast sent successfully!");
      setBroadcastData({ title: '', message: '', priority: 'Normal', audience: 'All', targetDepartment: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to broadcast announcement.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (loading || !stats) {
    return <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white text-xl animate-pulse">Loading System Data...</div>;
  }

  // Prepare Chart Data
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const userRoleData = stats.usersByRole.map(r => ({ name: r._id, value: r.count }));
  const incidentStatusData = stats.incidentsByStatus.map(s => ({ name: s._id, value: s.count }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
          <div className="flex items-center gap-4">
            {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-purple-500 shadow-lg" />
            ) : (
                <FaUserCircle className="text-5xl text-gray-400" />
            )}
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-500">
                Super Admin Console
              </h1>
              <p className="text-gray-400">System Overview & Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-3 rounded-xl transition border border-gray-600 shadow-sm flex items-center justify-center"
                title="Profile Settings"
            >
                <FaCog size={20} />
            </button>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-xl font-bold transition">
              Logout
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b border-gray-700 pb-2 overflow-x-auto whitespace-nowrap">
          {['overview', 'users', 'incidents', 'broadcast'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold capitalize transition ${
                activeTab === tab ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'broadcast' ? 'Broadcast & Announce' : tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl min-h-125">
          
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Users Chart */}
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FaUsers /> Users by Role</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={userRoleData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label>
                          {userRoleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Incidents Chart */}
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FaChartPie /> Incidents by Status</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incidentStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <RechartsTooltip cursor={{fill: '#374151', opacity: 0.4}} contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-fade-in overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-900 text-gray-400">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {usersList.map(u => (
                    <tr key={u._id} className="hover:bg-gray-750">
                      <td className="p-4">{u.name}</td>
                      <td className="p-4 text-gray-400">{u.email}</td>
                      <td className="p-4">
                        <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-bold">{u.role}</span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-400" title="Delete User">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="animate-fade-in overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-900 text-gray-400">
                  <tr>
                    <th className="p-4">Title</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {incidentsList.map(inc => (
                    <tr key={inc._id} className="hover:bg-gray-750">
                      <td className="p-4 font-semibold">{inc.title}</td>
                      <td className="p-4">{inc.status}</td>
                      <td className="p-4">{inc.priority}</td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteIncident(inc._id)} className="text-red-500 hover:text-red-400" title="Delete Incident">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="max-w-2xl mx-auto animate-fade-in">
              <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 bg-linear-to-b from-purple-500 to-pink-500 h-full"></div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><FaBullhorn className="text-purple-400"/> New Broadcast</h2>
                
                <form onSubmit={handleBroadcast} className="space-y-6">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Announcement Title</label>
                    <input type="text" required value={broadcastData.title} onChange={e => setBroadcastData({...broadcastData, title: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Message</label>
                    <textarea required rows="4" value={broadcastData.message} onChange={e => setBroadcastData({...broadcastData, message: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Priority Level</label>
                      <select value={broadcastData.priority} onChange={e => setBroadcastData({...broadcastData, priority: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white outline-none">
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Target Audience</label>
                      <select value={broadcastData.audience} onChange={e => setBroadcastData({...broadcastData, audience: e.target.value, targetDepartment: ''})} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white outline-none">
                        <option value="All">All Users</option>
                        <option value="Student">Students Only</option>
                        <option value="Faculty">Faculty Only</option>
                        <option value="Maintenance">All Maintenance / Security</option>
                        <option value="Department">Specific Department</option>
                      </select>
                    </div>
                  </div>

                  {broadcastData.audience === 'Department' && (
                    <div className="animate-fade-in">
                      <label className="block text-gray-400 text-sm mb-2">Select Department</label>
                      <select required value={broadcastData.targetDepartment} onChange={e => setBroadcastData({...broadcastData, targetDepartment: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white outline-none focus:border-purple-500">
                        <option value="">-- Choose a Department --</option>
                        {departments.map(d => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button type="submit" disabled={isBroadcasting} className="w-full py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold shadow-lg shadow-purple-500/25 transition disabled:opacity-50 text-lg">
                    {isBroadcasting ? 'Broadcasting...' : 'Broadcast Message'}
                  </button>
                </form>
              </div>

              {/* Announcements Table */}
              <div className="mt-8 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                  <h3 className="text-lg font-bold">Active Broadcasts</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-gray-400 text-sm">
                      <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Audience</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {announcementsList.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-gray-500">No active broadcasts.</td>
                        </tr>
                      ) : (
                        announcementsList.map(a => (
                          <tr key={a._id} className="hover:bg-gray-750">
                            <td className="p-4 font-semibold">{a.title}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                a.priority === 'Critical' ? 'bg-red-500/20 text-red-500' :
                                a.priority === 'High' ? 'bg-orange-500/20 text-orange-500' :
                                'bg-blue-500/20 text-blue-500'
                              }`}>
                                {a.priority}
                              </span>
                            </td>
                            <td className="p-4">{a.audience}</td>
                            <td className="p-4">
                              <button onClick={() => handleDeleteAnnouncement(a._id)} className="text-red-500 hover:text-red-400" title="Delete Broadcast">
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
          <ProfileSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;