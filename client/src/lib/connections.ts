import { useEffect, useState } from "react";

export type ConnectionProfile = {
  id: string;
  label: string;
  uri: string;
  color: string;
  readOnly: boolean;
};

export const profileColors = ["#3b82f6", "#00a35c", "#ff6c37", "#a855f7", "#f59e0b"];

const STORAGE_KEY = "explorer-connections";

const defaults: ConnectionProfile[] = [
  {
    id: "local",
    label: "Local standalone",
    uri: "mongodb://localhost:27017",
    color: "#3b82f6",
    readOnly: false,
  },
  {
    id: "atlas",
    label: "Atlas production",
    uri: "mongodb+srv://cluster0.mongodb.net",
    color: "#ff6c37",
    readOnly: true,
  },
];

export function useConnections() {
  const [profiles, setProfiles] = useState<ConnectionProfile[]>(defaults);
  const [activeId, setActiveId] = useState("local");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { profiles: ConnectionProfile[]; activeId: string };
        if (saved.profiles?.length) setProfiles(saved.profiles);
        if (saved.activeId) setActiveId(saved.activeId);
      }
    } catch {
      /* ignore malformed storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles, activeId }));
  }, [profiles, activeId, ready]);

  const active = profiles.find((p) => p.id === activeId) ?? profiles[0]!;

  return { profiles, setProfiles, active, activeId, setActiveId };
}

/** Simulated driver ping — returns round-trip latency in milliseconds. */
export function pingConnection(uri: string): Promise<{ ok: boolean; latency: number }> {
  const latency = Math.round(4 + Math.random() * (uri.startsWith("mongodb+srv") ? 90 : 12));
  return new Promise((resolve) =>
    setTimeout(() => resolve({ ok: uri.startsWith("mongodb"), latency }), Math.min(latency, 400)),
  );
}
