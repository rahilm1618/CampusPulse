import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import axios from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { FaUsers, FaTasks, FaCheckCircle, FaUserPlus, FaTimes, FaCog, FaUserCircle } from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import AnnouncementBanner from "../components/AnnouncementBanner";
import ProfileSettingsModal from "../components/ProfileSettingsModal";

const HODDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Add Staff Form State
  const [staffData, setStaffData] = useState({ name: '', email: '', password: '', role: 'Maintenance' });
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/departments/hod/dashboard');
      setStats(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load HOD data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      setIsAddingStaff(true);
      
      // Enforce the correct role based on HOD's department
      const finalRole = stats?.departmentName === 'Security' ? 'Security' : 'Maintenance';
      const submitData = { ...staffData, role: finalRole };

      await axios.post('/auth/add-staff', submitData);
      toast.success(`${finalRole} account created successfully!`);
      setIsAddStaffModalOpen(false);
      setStaffData({ name: '', email: '', password: '', role: 'Maintenance' });
      fetchDashboardData(); // Refresh the data to show the new staff
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create staff account");
    } finally {
      setIsAddingStaff(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-20 text-xl animate-pulse">Loading Department Analytics...</div>;
  }

  if (!stats) {
    return <div className="text-white text-center mt-20">Failed to load data.</div>;
  }
  console.log(stats)
  // --- Prepare Data for Charts ---
  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']; // Red, Orange, Green, Blue
  const statusData = stats.statusSummary.map(item => ({
    name: item._id,
    value: item.count
  }));  

  // Reformat staff workload data for the bar chart
  const workloadData = stats.teamWorkload.map(staff => ({
    name: staff.name,
    "Active Tasks": staff.activeTasks
  }));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 fade-in-up">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
        <div className="flex items-center gap-4">
            {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-lg" />
            ) : (
                <FaUserCircle className="text-5xl text-gray-400" />
            )}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-emerald-400">
                    HOD Analytics
                </h1>
                <p className="text-gray-400 mt-1">Department Oversight & Staff Management</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
              onClick={() => setIsSettingsOpen(true)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-3 rounded-xl transition border border-gray-600 shadow-sm flex items-center justify-center"
              title="Profile Settings"
          >
              <FaCog size={20} />
          </button>
          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="flex items-center gap-2 bg-linear-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20"
          >
            <FaUserPlus /> Add New Staff
          </button>
          <button
            onClick={() => dispatch(logout())}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-bold transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <AnnouncementBanner />

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="bg-blue-500/20 p-4 rounded-xl text-blue-400"><FaTasks size={30} /></div>
          <div>
            <p className="text-gray-400 font-medium">Total Staff Members</p>
            <p className="text-3xl font-bold text-white">{stats.teamWorkload.length}</p>
          </div>
        </div>
        <div className="bg-linear-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="bg-orange-500/20 p-4 rounded-xl text-orange-400"><FaUsers size={30} /></div>
          <div>
            <p className="text-gray-400 font-medium">Active Incidents</p>
            <p className="text-3xl font-bold text-white">
              {stats.statusSummary.filter(s => s._id !== 'RESOLVED').reduce((acc, curr) => acc + curr.count, 0)}
            </p>
          </div>
        </div>
        <div className="bg-linear-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="bg-green-500/20 p-4 rounded-xl text-green-400"><FaCheckCircle size={30} /></div>
          <div>
            <p className="text-gray-400 font-medium">Resolved Incidents</p>
            <p className="text-3xl font-bold text-white">
              {stats.statusSummary.find(s => s._id === 'RESOLVED')?.count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Incident Status Pie Chart */}
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Incident Status Breakdown</h2>
          <div className="h-80">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No incident data available</div>
            )}
          </div>
        </div>

        {/* Staff Workload Bar Chart */}
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Staff Workload (Active Tasks)</h2>
          <div className="h-80">
            {workloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ fill: '#374151', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="Active Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {workloadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry["Active Tasks"] > 5 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No staff workload data</div>
            )}
          </div>
        </div>
      </div>

      {/* STAFF LIST TABLE */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Complete Staff Roster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900 text-gray-400 text-sm uppercase">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-center">Active Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {stats.teamWorkload.map((staff) => (
                <tr key={staff.email} className="hover:bg-gray-750 transition-colors">
                  <td className="p-4 text-white font-medium">{staff.name}</td>
                  <td className="p-4 text-gray-300">{staff.email}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      staff.activeTasks > 5 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {staff.activeTasks}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.teamWorkload.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-500">No staff members found in your department.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT ACTIVITY TABLE */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Recent Department Incidents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900 text-gray-400 text-sm uppercase">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Reported By</th>
                <th className="p-4">Assigned To</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {stats.recentActivity.map((incident) => (
                <tr key={incident._id} className="hover:bg-gray-750 transition-colors">
                  <td className="p-4 text-white font-medium">{incident.title}</td>
                  <td className="p-4 text-gray-300">{incident.reportedBy?.name || 'Unknown'}</td>
                  <td className="p-4 text-gray-300">{incident.assignedTo?.name || 'Unassigned'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${incident.status === 'OPEN' ? 'bg-orange-500' :
                      incident.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                        incident.status === 'REOPENED' ? 'bg-red-500' :
                          'bg-green-500'
                      }`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${incident.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                      incident.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                        incident.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                      }`}>
                      {incident.priority}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentActivity.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No recent incidents found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in-up">
          <div className="bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-gray-700">
            <button
              onClick={() => setIsAddStaffModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Register New Staff</h2>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Full Name</label>
                <input
                  type="text" required
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={staffData.name} onChange={(e) => setStaffData({ ...staffData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Email Address</label>
                <input
                  type="email" required
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={staffData.email} onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Temporary Password</label>
                <input
                  type="password" required minLength={6}
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={staffData.password} onChange={(e) => setStaffData({ ...staffData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Role</label>
                <select
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={staffData.role} onChange={(e) => setStaffData({ ...staffData, role: e.target.value })}
                >
                  {stats.departmentName === 'Security' ? (
                    <option value="Security">Security Guard</option>
                  ) : (
                    <option value="Maintenance">Maintenance Worker</option>
                  )}
                </select>
              </div>
              <button
                type="submit" disabled={isAddingStaff}
                className="w-full py-3 mt-4 bg-linear-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-xl font-bold shadow-lg shadow-green-500/25 transition-all disabled:opacity-50"
              >
                {isAddingStaff ? "Creating Account..." : "Create Staff Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
          <ProfileSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};

export default HODDashboard;
