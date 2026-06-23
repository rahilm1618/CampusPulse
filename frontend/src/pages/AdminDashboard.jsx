import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
    FaUsers, 
    FaClipboardList, 
    FaBullhorn, 
    FaTrash, 
    FaBuilding, 
    FaUserTie, 
    FaChartPie 
} from "react-icons/fa";

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data States
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Form States
  const [newDept, setNewDept] = useState({ name: "", description: "", buildingLocation: "" });
  const [announcement, setAnnouncement] = useState({ title: "", message: "", priority: "Normal" });
  
  // HOD Assignment Modal States
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  // --- FETCHING FUNCTIONS ---
  const fetchStats = async () => {
    try { const res = await axios.get("/admin/stats"); setStats(res.data); } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try { const res = await axios.get("/admin/users"); setUsers(res.data); } catch (e) { toast.error("Failed to load users"); }
  };

  const fetchIncidents = async () => {
    try { 
        const res = await axios.get("/admin/incidents");
        setIncidents(res.data.data ? res.data.data : res.data);
    } catch (e) { toast.error("Failed to load incidents"); }
  };

  const fetchDepartments = async () => {
    try { const res = await axios.get("/departments"); setDepartments(res.data); } catch (e) { toast.error("Failed to load departments"); }
  };

  // Load Data on Tab Change
  useEffect(() => {
    fetchStats(); 
    if (activeTab === "users") fetchUsers();
    if (activeTab === "incidents") fetchIncidents();
    if (activeTab === "departments") { fetchDepartments(); fetchUsers(); } 
  }, [activeTab]);

  // --- ACTION HANDLERS ---

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure? This action is irreversible.")) return;
    try { await axios.delete(`/admin/users/${id}`); toast.success("User deleted"); fetchUsers(); } 
    catch (err) { toast.error("Failed to delete user"); }
  };

  const handleDeleteIncident = async (id) => {
    if (!window.confirm("Delete this incident report?")) return;
    try { await axios.delete(`/admin/incidents/${id}`); toast.success("Incident deleted"); fetchIncidents(); } 
    catch (err) { toast.error("Failed to delete incident"); }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
        await axios.post("/departments", newDept);
        toast.success("Department Created Successfully");
        setNewDept({ name: "", description: "", buildingLocation: "" });
        fetchDepartments();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create department"); }
  };

  const handleAssignHOD = async () => {
      if(!selectedUserId) return toast.error("Please select a user");
      try {
          await axios.put(`/departments/${selectedDeptId}/assign-hod`, { hodId: selectedUserId });
          toast.success("HOD Assigned Successfully");
          setSelectedDeptId(null); 
          setSelectedUserId("");
          fetchDepartments(); 
      } catch (err) { toast.error(err.response?.data?.message || "Failed to assign HOD"); }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/admin/announcements", announcement);
      toast.success("Announcement Broadcasted!");
      setAnnouncement({ title: "", message: "", priority: "Normal" });
    } catch (err) { toast.error("Failed to post announcement"); }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-red-500">Admin Control Center</h1>
          <p className="text-gray-400 text-sm">System Administrator: <span className="text-white">{user?.name}</span></p>
        </div>
        <button 
          onClick={() => { dispatch(logout()); navigate("/login"); }}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition"
        >
          Logout
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-4 mb-8">
        {[
            { id: "overview", label: "Overview", icon: <FaChartPie/> },
            { id: "departments", label: "Departments", icon: <FaBuilding/> },
            { id: "users", label: "Users", icon: <FaUsers/> },
            { id: "incidents", label: "Incidents", icon: <FaClipboardList/> },
            { id: "announcements", label: "Broadcasts", icon: <FaBullhorn/> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${
              activeTab === tab.id ? "bg-red-600 text-white shadow-lg shadow-red-500/30" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* --- CONTENT AREA --- */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
            <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-blue-500 shadow-lg">
                <h3 className="text-gray-400 text-sm uppercase">Total Users</h3>
                <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-yellow-500 shadow-lg">
                <h3 className="text-gray-400 text-sm uppercase">Total Incidents</h3>
                <p className="text-4xl font-bold mt-2">{stats.totalIncidents}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-orange-500 shadow-lg">
                <h3 className="text-gray-400 text-sm uppercase">Active Issues</h3>
                <p className="text-4xl font-bold mt-2">{stats.openIncidents}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-red-600 shadow-lg animate-pulse">
                <h3 className="text-gray-400 text-sm uppercase">Critical Threats</h3>
                <p className="text-4xl font-bold mt-2 text-red-500">{stats.criticalIncidents}</p>
            </div>
        </div>
      )}

      {/* 2. DEPARTMENTS TAB */}
      {activeTab === "departments" && (
        <div className="space-y-8 animate-fade-in">
            {/* Create Dept Form */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-blue-400">Add New Department</h3>
                <form onSubmit={handleCreateDept} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input 
                        placeholder="Name (e.g. Electrical)" 
                        className="bg-gray-900 p-3 rounded text-white border border-gray-600 focus:border-blue-500 outline-none"
                        value={newDept.name} onChange={(e) => setNewDept({...newDept, name: e.target.value})} required
                    />
                    <input 
                        placeholder="Location (e.g. Block A)" 
                        className="bg-gray-900 p-3 rounded text-white border border-gray-600 focus:border-blue-500 outline-none"
                        value={newDept.buildingLocation} onChange={(e) => setNewDept({...newDept, buildingLocation: e.target.value})} required
                    />
                    <input 
                        placeholder="Description (Optional)" 
                        className="bg-gray-900 p-3 rounded text-white border border-gray-600 focus:border-blue-500 outline-none"
                        value={newDept.description} onChange={(e) => setNewDept({...newDept, description: e.target.value})} 
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 font-bold rounded transition">Create</button>
                </form>
            </div>

            {/* Department List */}
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-gray-300">
                        <tr>
                            <th className="p-4">Department Name</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">Head of Dept (HOD)</th>
                            <th className="p-4">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {departments.map((dept) => (
                            <tr key={dept._id} className="hover:bg-gray-750 transition">
                                <td className="p-4 font-bold">{dept.name}</td>
                                <td className="p-4 text-gray-400">{dept.buildingLocation}</td>
                                <td className="p-4">
                                    {dept.headOfDepartment ? (
                                        <span className="text-green-400 flex items-center gap-2 bg-green-900/30 px-2 py-1 rounded w-fit text-sm">
                                            <FaUserTie/> {dept.headOfDepartment.name}
                                        </span>
                                    ) : <span className="text-red-400 text-sm italic">Not Assigned</span>}
                                </td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => setSelectedDeptId(dept._id)}
                                        className="bg-gray-700 hover:bg-gray-600 text-blue-400 px-3 py-1 rounded text-xs border border-gray-600 hover:border-blue-400 transition"
                                    >
                                        Assign HOD
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* HOD Assignment Modal (Filtered) */}
            {selectedDeptId && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
                    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-600 shadow-2xl">
                        <h3 className="font-bold text-xl mb-4 text-white">Select New HOD</h3>
                        <p className="text-xs text-yellow-500 mb-4 bg-yellow-900/20 p-2 rounded">
                            ⚠️ Note: Only 'Maintenance' staff assigned to this department are shown.
                        </p>
                        
                        <label className="text-sm text-gray-400 block mb-2">Choose Staff Member:</label>
                        <select 
                            className="w-full p-3 bg-gray-900 text-white rounded mb-6 border border-gray-600 focus:border-blue-500 outline-none"
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            value={selectedUserId}
                        >
                            <option value="">-- Select Staff from {departments.find(d => d._id === selectedDeptId)?.name} --</option>
                            
                            {users
                                .filter(u => {
                                    // 1. Must be Maintenance Staff
                                    if (u.role !== 'Maintenance') return false;
                                    
                                    // 2. Must belong to the Selected Department
                                    // Handle both populated object and raw ID string
                                    const userDeptId = u.department?._id || u.department;
                                    return userDeptId === selectedDeptId;
                                })
                                .map(u => (
                                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                            ))}

                            {/* Show message if empty */}
                            {users.filter(u => u.role === 'Maintenance' && (u.department?._id || u.department) === selectedDeptId).length === 0 && (
                                <option disabled>No staff members found in this department</option>
                            )}
                        </select>

                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => { setSelectedDeptId(null); setSelectedUserId(""); }} 
                                className="px-4 py-2 text-gray-400 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAssignHOD} 
                                className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded text-white font-bold transition shadow-lg"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* 3. USERS TAB */}
      {activeTab === "users" && (
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700 animate-fade-in">
          <table className="w-full text-left">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Department</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-750 transition">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-gray-400">{u.email}</td>
                  <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${
                          u.role === 'Admin' ? 'bg-red-900/50 border-red-500 text-red-200' :
                          u.role === 'Student' ? 'bg-green-900/50 border-green-500 text-green-200' :
                          'bg-blue-900/50 border-blue-500 text-blue-200'
                      }`}>
                          {u.role}
                      </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                      {/* Safely handle populated department name */}
                      {u.department?.name || u.department || "—"}
                  </td>
                  <td className="p-4">
                    {u.role !== 'Admin' && (
                      <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-400 hover:bg-red-900/30 p-2 rounded transition">
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. INCIDENTS TAB */}
      {activeTab === "incidents" && (
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700 animate-fade-in">
           <div className="p-4 bg-gray-750 flex justify-between items-center border-b border-gray-700">
              <h3 className="font-bold text-gray-200">System Tickets Log</h3>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">{incidents.length} Total</span>
           </div>
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="p-4">Incident Title</th>
                  <th className="p-4">Reported By</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-gray-750 transition">
                    <td className="p-4 font-medium">{inc.title}</td>
                    <td className="p-4 text-sm text-gray-400">{inc.reportedBy?.name || 'Unknown'}</td>
                    <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                            inc.priority === 'Critical' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                        }`}>{inc.priority}</span>
                    </td>
                    <td className="p-4 text-sm">
                        <span className={`text-xs px-2 py-1 rounded border ${
                            inc.status === 'RESOLVED' ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'
                        }`}>{inc.status}</span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleDeleteIncident(inc._id)} className="text-red-500 hover:text-red-400 hover:bg-red-900/30 p-2 rounded transition">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ANNOUNCEMENTS TAB */}
      {activeTab === "announcements" && (
        <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 animate-fade-in">
            <div className="flex items-center gap-3 mb-6 text-yellow-500 border-b border-gray-700 pb-4">
                <FaBullhorn size={24} />
                <h2 className="text-2xl font-bold text-white">Broadcast Announcement</h2>
            </div>
            
            <form onSubmit={handlePostAnnouncement} className="space-y-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-2 font-semibold">Announcement Title</label>
                    <input 
                        className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none transition"
                        placeholder="e.g., Scheduled Power Maintenance"
                        value={announcement.title}
                        onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2 font-semibold">Priority Level</label>
                    <select 
                        className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none transition"
                        value={announcement.priority}
                        onChange={(e) => setAnnouncement({...announcement, priority: e.target.value})}
                    >
                        <option value="Normal">Normal (Info)</option>
                        <option value="High">High (Warning)</option>
                        <option value="Critical">Critical (Emergency)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2 font-semibold">Message Content</label>
                    <textarea 
                        className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white h-32 focus:border-yellow-500 outline-none transition"
                        placeholder="Type your message here..."
                        value={announcement.message}
                        onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                        required
                    />
                </div>
                <button className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition shadow-lg hover:shadow-yellow-500/50">
                    Send Broadcast to All Users
                </button>
            </form>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;