import { useState } from 'react';
import axios from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const PanicButton = ({ onPanicSuccess }) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handlePanicClick = () => {
        setIsConfirming(true);
    };

    const cancelPanic = () => {
        setIsConfirming(false);
    };

    const triggerPanic = () => {
        setIsSending(true);

        // Get coordinates from browser
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    try {
                        // The backend expects FormData because of upload.none() middleware in the route
                        const formData = new FormData();
                        formData.append('latitude', latitude);
                        formData.append('longitude', longitude);
                        formData.append('locationDescription', 'Current Location (GPS)');

                        await axios.post('/incidents/panic', formData);
                        
                        toast.error("🚨 PANIC ALERT SENT TO SECURITY!", { 
                            autoClose: false,
                            theme: 'colored'
                        });
                        setIsConfirming(false);
                        if (onPanicSuccess) onPanicSuccess();
                    } catch (error) {
                        toast.error("Failed to send alert. Try again!");
                        console.error(error);
                    } finally {
                        setIsSending(false);
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    // Fallback if GPS fails
                    sendFallbackPanic();
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            sendFallbackPanic();
        }
    };

    const sendFallbackPanic = async () => {
        try {
            const formData = new FormData();
            formData.append('latitude', 28.6139); // Default fallback coords
            formData.append('longitude', 77.2090);
            formData.append('locationDescription', 'Unknown Location (GPS Failed)');

            await axios.post('/incidents/panic', formData);
            toast.error("🚨 PANIC ALERT SENT (No GPS)", { theme: 'colored' });
            setIsConfirming(false);
            if (onPanicSuccess) onPanicSuccess();
        } catch (error) {
            toast.error("Failed to send alert.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {/* The Floating Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={handlePanicClick}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-2xl flex items-center justify-center animate-bounce hover:animate-none transition-all transform hover:scale-110 border-4 border-red-500/50 relative"
                    style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)' }}
                >
                    <div className="absolute inset-0 rounded-full animate-ping bg-red-600 opacity-75"></div>
                    <FaExclamationTriangle size={32} className="relative z-10" />
                </button>
            </div>

            {/* Confirmation Dialog */}
            {isConfirming && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border-2 border-red-600 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-pulse-glow text-center relative overflow-hidden">
                        
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse"></div>

                        <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4 animate-bounce" />
                        
                        <h2 className="text-2xl font-black text-white mb-2 tracking-wide uppercase">Trigger Panic?</h2>
                        <p className="text-gray-300 text-sm mb-6">
                            This will immediately alert all campus security personnel with your exact GPS location. Use for emergencies only.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={triggerPanic}
                                disabled={isSending}
                                className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-lg shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50"
                            >
                                {isSending ? 'Sending...' : 'YES, I NEED HELP!'}
                            </button>
                            
                            <button
                                onClick={cancelPanic}
                                disabled={isSending}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.4); }
                    50% { box-shadow: 0 0 50px rgba(220, 38, 38, 0.8); }
                }
                .animate-pulse-glow {
                    animation: pulse-glow 2s infinite;
                }
            `}</style>
        </>
    );
};

export default PanicButton;
