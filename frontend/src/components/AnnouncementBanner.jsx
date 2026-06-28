import { useState, useEffect } from 'react';
import axios from '../utils/axiosInstance';
import { FaBullhorn } from 'react-icons/fa';

const AnnouncementBanner = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await axios.get('/auth/my-announcements');
                setAnnouncements(res.data.data);
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
            }
        };
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        if (announcements.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % announcements.length);
        }, 5000); // Rotate every 5 seconds
        return () => clearInterval(interval);
    }, [announcements.length]);

    if (announcements.length === 0) return null;

    const currentAnnouncement = announcements[currentIndex];

    let priorityColors = "bg-blue-600 border-blue-500 text-white";
    if (currentAnnouncement.priority === 'High') priorityColors = "bg-orange-600 border-orange-500 text-white";
    if (currentAnnouncement.priority === 'Critical') priorityColors = "bg-red-600 border-red-500 text-white animate-pulse";

    return (
        <div className={`mb-6 p-4 rounded-xl shadow-lg border-l-4 flex items-start gap-4 ${priorityColors}`}>
            <div className="mt-1">
                <FaBullhorn size={24} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-lg flex items-center justify-between">
                    {currentAnnouncement.title}
                    {announcements.length > 1 && (
                        <span className="text-xs bg-black/20 px-2 py-1 rounded">
                            {currentIndex + 1} / {announcements.length}
                        </span>
                    )}
                </h4>
                <p className="text-sm mt-1 opacity-90">{currentAnnouncement.message}</p>
            </div>
        </div>
    );
};

export default AnnouncementBanner;
