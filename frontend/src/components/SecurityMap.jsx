import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaShieldAlt, FaExclamationTriangle, FaMapMarkerAlt } from 'react-icons/fa';

// Custom icons using React Icons and Leaflet divIcon
const createCustomIcon = (priority) => {
    let colorClass = 'text-blue-500';
    let bgClass = 'bg-blue-900/50';
    let Icon = FaShieldAlt;

    if (priority === 'Critical') {
        colorClass = 'text-red-500';
        bgClass = 'bg-red-900/50 animate-pulse';
        Icon = FaExclamationTriangle;
    } else if (priority === 'High') {
        colorClass = 'text-orange-500';
        bgClass = 'bg-orange-900/50';
        Icon = FaExclamationTriangle;
    }

    const iconMarkup = renderToStaticMarkup(
        <div className={`p-2 rounded-full ${bgClass} border-2 border-current ${colorClass} shadow-lg shadow-current/30`}>
            <Icon size={16} />
        </div>
    );

    return L.divIcon({
        html: iconMarkup,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

const SecurityMap = ({ incidents }) => {
    // Default center (e.g., center of campus)
    // Replace these coordinates with the actual default center of your campus
    const defaultCenter = [28.6139, 77.2090]; // New Delhi coordinates as fallback

    // If there are incidents, center on the first one, else use default
    const center = incidents.length > 0 && incidents[0].location?.coordinates
        ? [incidents[0].location.coordinates[1], incidents[0].location.coordinates[0]] // GeoJSON is [long, lat], Leaflet is [lat, long]
        : defaultCenter;

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-700 shadow-2xl relative z-0">
            <MapContainer 
                center={center} 
                zoom={16} 
                style={{ height: '100%', width: '100%', backgroundColor: '#0a0e1a' }} // Matches --bg-primary
            >
                {/* Dark mode map tiles (CartoDB Dark Matter) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {incidents.map((inc) => {
                    if (!inc.location?.coordinates || inc.location.coordinates.length < 2) return null;
                    
                    // Note: GeoJSON stores as [longitude, latitude]
                    const [lng, lat] = inc.location.coordinates;
                    
                    return (
                        <Marker 
                            key={inc._id} 
                            position={[lat, lng]} 
                            icon={createCustomIcon(inc.priority)}
                        >
                            <Popup className="custom-popup">
                                <div className="bg-gray-800 text-white p-3 rounded-lg shadow-xl border border-gray-600 w-64">
                                    <h3 className="font-bold text-lg mb-1">{inc.title}</h3>
                                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                                        <FaMapMarkerAlt /> {inc.location?.blockName}
                                    </p>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                                            inc.priority === 'Critical' ? 'bg-red-600' : 
                                            inc.priority === 'High' ? 'bg-orange-600' : 'bg-blue-600'
                                        }`}>
                                            {inc.priority} Priority
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded border ${
                                            inc.status === 'RESOLVED' ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'
                                        }`}>
                                            {inc.status}
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            
            {/* Global overrides for leaflet popups to fit the dark theme */}
            <style>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    background: transparent;
                    padding: 0;
                    box-shadow: none;
                }
                .custom-popup .leaflet-popup-tip {
                    background: #1f2937; /* Tailwind gray-800 */
                    border: 1px solid #4b5563; /* Tailwind gray-600 */
                }
                .custom-leaflet-icon {
                    background: transparent;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default SecurityMap;
