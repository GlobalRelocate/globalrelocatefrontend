import axiosInstance from "@/config/axiosInstance";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

const AiChatContext = createContext();

export const AiChatProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  // Fetch all sessions
  const fetchAllSessions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/ai/session");
      setSessions(response.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Start a new chat session
  const startChatSession = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/ai/start");
      console.log("session", data)
      const newSession = { id: data.data.sessionId, title: data.data.title };
      setCurrentSession(newSession);
      setMessages([]); // Clear messages for the new session
      toast.success("New chat session started!");
      return newSession; // Return the new session data
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Send a message to the AI
  const askAI = async (sessionId, message) => {
    setLoading(true);
    try {
      await axiosInstance.post(`/ai/${sessionId}`, { message });
      // Fetch the updated session to get the latest messages
      await fetchSingleSession(sessionId);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single session by ID
  const fetchSingleSession = async (sessionId) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/ai/session/${sessionId}`);
      const { id, title } = response.data.data;
      setCurrentSession({ id, title });
      setMessages(response.data.data.messages || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear a chat session
  const clearChatSession = async (sessionId) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/ai/${sessionId}`);
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      await fetchAllSessions();
      toast.success("Chat session cleared!");
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Rename a chat session
  const renameChatSession = async (sessionId, newName) => {
    setLoading(true);
    try {
      await axiosInstance.put(`/ai/${sessionId}`, { name: newName });
      toast.success("Chat session renamed!");
      fetchAllSessions(); // Refresh the list of sessions
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all sessions on component mount
  useEffect(() => {
    fetchAllSessions();
  }, []);

  return (
    <AiChatContext.Provider
      value={{
        sessions,
        currentSession,
        setCurrentSession,
        loading,
        messages,
        startChatSession,
        askAI,
        clearChatSession,
        renameChatSession,
        fetchSingleSession,
        fetchAllSessions,
      }}
    >
      {children}
    </AiChatContext.Provider>
  );
};

export const useAIChat = () => useContext(AiChatContext);