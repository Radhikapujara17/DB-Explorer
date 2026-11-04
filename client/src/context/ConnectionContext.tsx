import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface SavedProfile {
  id: string;
  name: string;
  uri: string;
  isReadOnly: boolean;
  color?: string;
}

export interface CollectionTab {
  id: string;
  dbName: string;
  collectionName: string;
}

export interface SavedQuerySnippet {
  id: string;
  name: string;
  query: any;
  collectionName?: string;
  createdAt: string;
}

interface ConnectionContextType {
  activeProfile: SavedProfile | null;
  savedProfiles: SavedProfile[];
  selectedDb: string | null;
  selectedCollection: string | null;
  databases: any[];
  collections: any[];
  readOnlyMode: boolean;
  connectionLatency: number | null;
  isConnected: boolean;
  loadingDbs: boolean;
  loadingCollections: boolean;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  saveProfile: (name: string, uri: string, isReadOnly: boolean) => void;
  deleteProfile: (id: string) => void;
  connectProfile: (profile: SavedProfile) => Promise<boolean>;
  disconnect: () => void;
  selectDatabase: (dbName: string) => void;
  selectCollection: (collName: string) => void;
  toggleReadOnly: () => void;
  refreshDatabases: () => Promise<void>;
  refreshCollections: () => Promise<void>;
  
  theme: string;
  setTheme: (theme: string) => void;

  // Tabbed Workspace
  tabs: CollectionTab[];
  activeTabId: string | null;
  openTab: (dbName: string, collectionName: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string) => void;

  // Query History & Saved Snippets
  queryHistory: any[];
  addQueryHistory: (query: any) => void;
  savedQueries: SavedQuerySnippet[];
  saveQuerySnippet: (name: string, query: any, collectionName?: string) => void;
  deleteQuerySnippet: (id: string) => void;
}

const DEFAULT_PROFILES: SavedProfile[] = [
  {
    id: 'local-default',
    name: 'Local Standalone Mongo',
    uri: 'mongodb://localhost:27017',
    isReadOnly: false,
    color: '#10b981'
  }
];

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>(() => {
    const saved = localStorage.getItem('db_explorer_profiles');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_PROFILES;
  });

  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(() => {
    return localStorage.getItem('db_explorer_gemini_key') || '';
  });

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    localStorage.setItem('db_explorer_gemini_key', key);
  };

  const [theme, setThemeState] = useState<string>(() => {
    return localStorage.getItem('db_explorer_theme') || 'theme-mongo';
  });

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem('db_explorer_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [activeProfile, setActiveProfile] = useState<SavedProfile | null>(() => {
    const active = localStorage.getItem('db_explorer_active_profile');
    if (active) {
      try { return JSON.parse(active); } catch {}
    }
    return DEFAULT_PROFILES[0];
  });

  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [databases, setDatabases] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [readOnlyMode, setReadOnlyMode] = useState<boolean>(activeProfile?.isReadOnly || false);
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loadingDbs, setLoadingDbs] = useState<boolean>(false);
  const [loadingCollections, setLoadingCollections] = useState<boolean>(false);

  // Tabs
  const [tabs, setTabs] = useState<CollectionTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // History & Saved Snippets
  const [queryHistory, setQueryHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('db_explorer_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedQueries, setSavedQueries] = useState<SavedQuerySnippet[]>(() => {
    const saved = localStorage.getItem('db_explorer_saved_queries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('db_explorer_profiles', JSON.stringify(savedProfiles));
  }, [savedProfiles]);

  useEffect(() => {
    localStorage.setItem('db_explorer_history', JSON.stringify(queryHistory.slice(-20)));
  }, [queryHistory]);

  useEffect(() => {
    localStorage.setItem('db_explorer_saved_queries', JSON.stringify(savedQueries));
  }, [savedQueries]);

  useEffect(() => {
    if (activeProfile) {
      localStorage.setItem('db_explorer_active_profile', JSON.stringify(activeProfile));
      setReadOnlyMode(activeProfile.isReadOnly);
      connectProfile(activeProfile);
    }
  }, []);

  const saveProfile = (name: string, uri: string, isReadOnly: boolean) => {
    const newProfile: SavedProfile = {
      id: Date.now().toString(),
      name,
      uri,
      isReadOnly,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setSavedProfiles(prev => [...prev, newProfile]);
  };

  const deleteProfile = (id: string) => {
    setSavedProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfile?.id === id) {
      setActiveProfile(null);
      setIsConnected(false);
      setDatabases([]);
      setCollections([]);
      setTabs([]);
    }
  };

  const connectProfile = async (profile: SavedProfile): Promise<boolean> => {
    setLoadingDbs(true);
    try {
      const testRes = await axios.post('/api/connect/test', { connectionUri: profile.uri });
      if (!testRes.data.success) {
        setIsConnected(false);
        setLoadingDbs(false);
        return false;
      }

      setConnectionLatency(testRes.data.latencyMs);
      setActiveProfile(profile);
      setReadOnlyMode(profile.isReadOnly);
      setIsConnected(true);

      const dbsRes = await axios.get('/api/databases', {
        headers: { 'x-mongo-uri': profile.uri }
      });

      if (dbsRes.data.success) {
        setDatabases(dbsRes.data.databases);
        if (dbsRes.data.databases.length > 0) {
          const firstDb = dbsRes.data.databases[0].name;
          setSelectedDb(firstDb);
          await loadCollections(profile.uri, firstDb);
        }
      }
      setLoadingDbs(false);
      return true;
    } catch (err) {
      console.error('Connection failed:', err);
      setIsConnected(false);
      setLoadingDbs(false);
      return false;
    }
  };

  const loadCollections = async (uri: string, dbName: string) => {
    setLoadingCollections(true);
    try {
      const res = await axios.get(`/api/collections/${dbName}`, {
        headers: { 'x-mongo-uri': uri }
      });
      if (res.data.success) {
        setCollections(res.data.collections);
        if (res.data.collections.length > 0) {
          openTab(dbName, res.data.collections[0].name);
        } else {
          setSelectedCollection(null);
        }
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
      setCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  const selectDatabase = async (dbName: string) => {
    setSelectedDb(dbName);
    if (activeProfile) {
      await loadCollections(activeProfile.uri, dbName);
    }
  };

  const selectCollection = (collName: string) => {
    if (selectedDb) {
      openTab(selectedDb, collName);
    }
  };

  const openTab = (dbName: string, collectionName: string) => {
    const tabId = `${dbName}:${collectionName}`;
    setSelectedDb(dbName);
    setSelectedCollection(collectionName);

    setTabs(prev => {
      if (prev.some(t => t.id === tabId)) return prev;
      return [...prev, { id: tabId, dbName, collectionName }];
    });
    setActiveTabId(tabId);
  };

  const closeTab = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        const last = newTabs[newTabs.length - 1];
        setSelectedDb(last.dbName);
        setSelectedCollection(last.collectionName);
        setActiveTabId(last.id);
      } else if (newTabs.length === 0) {
        setSelectedCollection(null);
        setActiveTabId(null);
      }
      return newTabs;
    });
  };

  const addQueryHistory = (query: any) => {
    setQueryHistory(prev => [
      { id: Date.now().toString(), query, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 19)
    ]);
  };

  const saveQuerySnippet = (name: string, query: any, collectionName?: string) => {
    const snippet: SavedQuerySnippet = {
      id: Date.now().toString(),
      name,
      query,
      collectionName,
      createdAt: new Date().toLocaleDateString()
    };
    setSavedQueries(prev => [...prev, snippet]);
  };

  const deleteQuerySnippet = (id: string) => {
    setSavedQueries(prev => prev.filter(q => q.id !== id));
  };

  const disconnect = () => {
    setActiveProfile(null);
    setIsConnected(false);
    setDatabases([]);
    setCollections([]);
    setSelectedDb(null);
    setSelectedCollection(null);
    setTabs([]);
    localStorage.removeItem('db_explorer_active_profile');
  };

  const toggleReadOnly = () => {
    setReadOnlyMode(prev => !prev);
  };

  const refreshDatabases = async () => {
    if (activeProfile) {
      await connectProfile(activeProfile);
    }
  };

  const refreshCollections = async () => {
    if (activeProfile && selectedDb) {
      await loadCollections(activeProfile.uri, selectedDb);
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        activeProfile,
        savedProfiles,
        selectedDb,
        selectedCollection,
        databases,
        collections,
        readOnlyMode,
        connectionLatency,
        isConnected,
        loadingDbs,
        loadingCollections,
        geminiApiKey,
        setGeminiApiKey,
        saveProfile,
        deleteProfile,
        connectProfile,
        disconnect,
        selectDatabase,
        selectCollection,
        toggleReadOnly,
        refreshDatabases,
        refreshCollections,
        theme,
        setTheme,
        tabs,
        activeTabId,
        openTab,
        closeTab,
        setActiveTabId,
        queryHistory,
        addQueryHistory,
        savedQueries,
        saveQuerySnippet,
        deleteQuerySnippet
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error('useConnection must be used within ConnectionProvider');
  return context;
};
