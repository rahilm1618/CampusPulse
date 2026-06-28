import { useState, useEffect, useRef } from "react";
import axios from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { FaPaperPlane, FaUserCircle } from "react-icons/fa";
import { io } from "socket.io-client"; // Import Socket Client
import { markIncidentAsRead, getIncidentUnreadCount } from "../hooks/useUnreadMessages";

// Initialize socket outside component to prevent re-connections on every render
// Make sure this matches your backend URL (usually localhost:5000)
const socket = io("http://localhost:5000");

const ChatInterface = ({ incidents, currentUser }) => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  // 1. Join the specific Socket Room when an incident is selected
  useEffect(() => {
    if (selectedIncident) {
      // Emit event to join specific room (Backend listens for 'join_incident')
      socket.emit("join_incident", selectedIncident._id);
      markIncidentAsRead(selectedIncident, currentUser);
    }
  }, [selectedIncident, currentUser]);

  // 2. Listen for Incoming Messages (Real-Time)
  useEffect(() => {
    const handleReceiveComment = (newComment) => {
      // Logic: Only update state if the incoming message belongs to the CURRENTLY open chat
      // and it wasn't sent by me (because my own message is added optimistically below)
      
      // However, for simplicity and safety, we can just check if we have a selected incident
      // and if the incoming comment matches this incident's ID (if you passed incidentId in payload)
      // OR rely on the fact that we only joined this room.
      
      setSelectedIncident((prev) => {
        if (!prev) return null;
        
        // Prevent duplicate messages if the sender is 'Me' (since we add it manually in handleSend)
        if (newComment.sender._id === currentUser.id) return prev;

        return {
           ...prev,
           comments: [...prev.comments, newComment]
        };
      });
    };

    socket.on("receive_comment", handleReceiveComment);

    // Cleanup listener on unmount or when incident changes
    return () => {
      socket.off("receive_comment", handleReceiveComment);
    };
  }, [selectedIncident, currentUser]);

  // 3. Auto-scroll to bottom whenever comments change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedIncident?.comments]);


  // 4. Send Message Logic
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedIncident) return;

    try {
      setLoading(true);
      
      // Optimistic UI Update: Show message immediately before server confirms
      const optimisticComment = {
          sender: { _id: currentUser.id, name: currentUser.name || "Me" },
          message: message,
          createdAt: new Date().toISOString()
      };
      
      // Update Local State immediately
      setSelectedIncident(prev => ({
          ...prev,
          comments: [...prev.comments, optimisticComment]
      }));
      
      const msgToSend = message; // Capture msg before clearing state
      setMessage(""); // Clear input

      // Send to Backend (Backend will save to DB AND emit socket event to others)
      await axios.post(`/incidents/${selectedIncident._id}/comment`, { message: msgToSend });
      
    } catch (error) {
      toast.error("Failed to send");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-150 bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
      
      {/* LEFT SIDE: Incident List */}
      <div className="w-1/3 border-r border-gray-700 bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-bold">Select Conversation</h3>
        </div>
        <div className="overflow-y-auto flex-1">
          {incidents.length === 0 && <p className="p-4 text-gray-500">No active incidents.</p>}
          {incidents.map((inc) => (
            <div 
              key={inc._id}
              onClick={() => setSelectedIncident(inc)}
              className={`p-4 cursor-pointer border-b border-gray-800 transition hover:bg-gray-800 ${
                selectedIncident?._id === inc._id ? "bg-blue-900 border-l-4 border-blue-500" : ""
              }`}
            >
              <p className="text-white font-semibold truncate">{inc.title}</p>
              <p className="text-xs text-gray-400 flex items-center justify-between">
                 <span>ID: #{inc._id.slice(-6)}</span>
                 {getIncidentUnreadCount(inc, currentUser) > 0 && (
                     <span className="text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full font-bold">
                        {getIncidentUnreadCount(inc, currentUser)} new msgs
                     </span>
                 )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Chat Window */}
      <div className="w-2/3 flex flex-col bg-gray-800">
        {selectedIncident ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">{selectedIncident.title}</h3>
                <p className="text-xs text-gray-400">
                    Talking with: {selectedIncident.assignedTo?.name || "Pending Assignment..."}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                  selectedIncident.status === 'OPEN' ? 'bg-yellow-600' : 'bg-green-600'
              }`}>{selectedIncident.status}</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4"> 
                {selectedIncident.comments?.length === 0 && (
                    <p className="text-center text-gray-500 mt-10">No messages yet. Start the conversation!</p>
                )}
                {selectedIncident.comments?.map((msg, index) => {
                    // Check if sender is current user (handle both populated object and raw ID)
                    const senderId = msg.sender?._id || msg.sender; 
                    const isMe = senderId === currentUser.id;
                    
                    return (
                        <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] p-3 rounded-lg text-sm ${
                                isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-700 text-gray-200 rounded-bl-none"
                            }`}>
                                <p className="font-bold text-xs mb-1 opacity-70">
                                    {msg.sender?.name || "User"}
                                </p>
                                <p>{msg.message}</p>
                                <p className="text-[10px] text-right opacity-50 mt-1">
                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Just now"}
                                </p>
                            </div>
                        </div>
                    )
                })}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-gray-900 border-t border-gray-700 flex gap-2">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg transition"
              >
                <FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
             <FaUserCircle size={64} className="mb-4 opacity-20"/>
             <p>Select an incident from the left to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;