'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin, Clock, User, Search, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Import Leaflet components directly
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Helper component to pan map
function MapFocus({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14, { duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

// Custom Marker Icons
const createCustomIcon = (L: any, color: string) => {
    return new L.DivIcon({
        html: `<div style="
            background-color: ${color};
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
        "></div>`,
        className: 'custom-marker-icon',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
};

export default function AttendanceMap() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [L, setL] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLog, setSelectedLog] = useState<any>(null);

    useEffect(() => {
        // Import leaflet for internal usage (icons etc)
        import('leaflet').then(leaf => {
            setL(leaf);
            // Fix default marker icon issues in React
            delete (leaf.Icon.Default.prototype as any)._getIconUrl;
            leaf.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
        });

        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/attendance/map');
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) {
            console.error("Failed to fetch map data");
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        if (!searchQuery) return logs;
        return logs.filter(log =>
            log.employee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.employee?.designation?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [logs, searchQuery]);

    const mapPoints = useMemo(() => {
        const points: any[] = [];
        filteredLogs.forEach(log => {
            if (log.clock_in_lat) {
                points.push({
                    id: `${log.id}-in`,
                    pos: [log.clock_in_lat, log.clock_in_lng],
                    color: '#3b82f6',
                    type: 'In',
                    log: log
                });
            }
            if (log.clock_out_lat) {
                points.push({
                    id: `${log.id}-out`,
                    pos: [log.clock_out_lat, log.clock_out_lng],
                    color: '#f43f5e',
                    type: 'Out',
                    log: log
                });
            }
        });
        return points;
    }, [filteredLogs]);

    if (loading || !L) return (
        <Card className="h-[500px] flex items-center justify-center bg-zinc-50/50 border-zinc-100">
            <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Initialising Live Workforce Map</p>
            </div>
        </Card>
    );

    const defaultCenter: [number, number] = [28.6139, 77.2090];
    const initialCenter: [number, number] = logs.find(l => l.clock_in_lat)
        ? [logs.find(l => l.clock_in_lat).clock_in_lat, logs.find(l => l.clock_in_lat).clock_in_lng]
        : defaultCenter;

    return (
        <Card className="overflow-hidden border-zinc-100 shadow-sm bg-white rounded-[2.5rem]">
            <CardHeader className="p-8 border-b border-zinc-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <CardTitle className="text-xl font-black text-zinc-900 tracking-tight uppercase">Live Attendance Tracking</CardTitle>
                        <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Real-time Geolocation Data • {filteredLogs.length} Active Points
                        </p>
                    </div>

                    <div className="flex flex-1 max-w-md items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                placeholder="Search employee..."
                                className="pl-10 h-11 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all ring-0 focus:ring-2 focus:ring-indigo-100"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="hidden sm:flex gap-4 border-l border-zinc-100 pl-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">In</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Out</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 relative flex flex-col lg:flex-row h-[600px]">
                {/* Side List */}
                <div className="w-full lg:w-80 border-r border-zinc-50 bg-zinc-50/20 overflow-y-auto no-scrollbar h-48 lg:h-full">
                    <div className="p-4 space-y-2">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 px-2">
                            Active Check-ins ({filteredLogs.length})
                        </p>
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-xs font-semibold text-zinc-400">No logs found</p>
                            </div>
                        ) : (
                            filteredLogs.map(log => (
                                <button
                                    key={log.id}
                                    onClick={() => setSelectedLog(log)}
                                    className={`w-full text-left p-3 rounded-2xl transition-all group ${selectedLog?.id === log.id
                                        ? "bg-white shadow-md border border-indigo-100"
                                        : "hover:bg-white/60"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-zinc-900 truncate leading-tight">
                                                {log.employee?.full_name}
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide truncate mt-0.5">
                                                {log.employee?.designation}
                                            </p>
                                        </div>
                                        <Navigation className="w-3 h-3 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-[10px] font-bold">
                                        <div className="flex items-center gap-1.5 text-blue-600">
                                            <Clock className="w-3 h-3" />
                                            {new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {log.clock_out && (
                                            <div className="flex items-center gap-1.5 text-rose-500">
                                                <LogOutIcon className="w-3 h-3" />
                                                {new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative z-10">
                    <MapContainer center={initialCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {selectedLog && (selectedLog.clock_in_lat || selectedLog.clock_out_lat) && (
                            <MapFocus center={[
                                selectedLog.clock_out_lat || selectedLog.clock_in_lat,
                                selectedLog.clock_out_lng || selectedLog.clock_in_lng
                            ]} />
                        )}

                        <MarkerClusterGroup
                            chunkedLoading
                            spiderfyOnMaxZoom={true}
                            showCoverageOnHover={false}
                        >
                            {mapPoints.map((point) => (
                                <Marker
                                    key={point.id}
                                    position={point.pos}
                                    icon={createCustomIcon(L, point.color)}
                                >
                                    <Popup>
                                        <div className="p-2 min-w-[150px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-8 h-8 rounded-lg ${point.type === 'In' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center`}>
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-zinc-900 leading-none">{point.log.employee.full_name}</p>
                                                    <p className="text-[10px] text-zinc-400 mt-1">{point.log.employee.designation}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 border-t border-zinc-100 pt-2">
                                                <p className={`text-[10px] font-bold ${point.type === 'In' ? 'text-blue-600' : 'text-rose-600'} uppercase flex items-center gap-1.5`}>
                                                    <MapPin className="w-3 h-3" /> Clock {point.type} Location
                                                </p>
                                                <p className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" /> {new Date(point.type === 'In' ? point.log.clock_in : point.log.clock_out).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>
            </CardContent>
        </Card>
    );
}

function LogOutIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}
