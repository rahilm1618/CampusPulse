import { useState, useEffect } from 'react';

export const markIncidentAsRead = (incident, user) => {
    if (!incident || !user) return;
    const key = `chat_read_${user.id}_${incident._id}`;
    localStorage.setItem(key, incident.comments?.length || 0);
    window.dispatchEvent(new Event('chat_read_updated'));
};

export const getIncidentUnreadCount = (incident, user) => {
    if (!incident || !user) return 0;
    const key = `chat_read_${user.id}_${incident._id}`;
    const readCount = parseInt(localStorage.getItem(key) || '0', 10);
    const totalCount = incident.comments?.length || 0;
    return Math.max(0, totalCount - readCount);
};

export const useUnreadMessages = (incidents, user) => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const calculateUnread = () => {
            if (!incidents || !user) return;
            const total = incidents.reduce((acc, inc) => {
                return acc + getIncidentUnreadCount(inc, user);
            }, 0);
            setUnreadCount(total);
        };

        calculateUnread();
        
        // Listen to custom event for when a chat is read
        window.addEventListener('chat_read_updated', calculateUnread);
        
        return () => window.removeEventListener('chat_read_updated', calculateUnread);
    }, [incidents, user]);

    return unreadCount;
};
