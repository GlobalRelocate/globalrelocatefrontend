import axiosInstance from "@/config/axiosInstance";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "./LanguageContext";

const CountryAiChatContext = createContext();

const baseURL = import.meta.env.VITE_API_URL;

export const CountryAiChatProvider = ({ children, countrySlug }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const { selectedLanguage } = useLanguage();

  // Fetch all sessions
  const fetchAllSessions = async () => {
    if (!countrySlug) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/countries/${countrySlug}/ai-assistant/sessions`
      );
      setSessions(response.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Start new chat
  const startChatSession = async () => {
    if (!countrySlug) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(
        `/countries/${countrySlug}/ai-assistant/start`
      );
      const newSession = { id: data.data.sessionId, title: data.data.title };
      setCurrentSession(newSession);
      setMessages([]);
      toast.success("New chat session started!");
      return newSession;
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Ask AI
  // const askAI = async (sessionId, content) => {
  //   if (!countrySlug || !sessionId) return;
  //   setLoading(true);
  //   try {
  //     if (content) {
  //       await axiosInstance.post(
  //         `/countries/${countrySlug}/ai-assistant/${sessionId}`,
  //         { message: content, language: selectedLanguage.name }
  //       );
  //     }
  //     await fetchSingleSession(sessionId);
  //   } catch (error) {
  //     toast.error(error?.response?.data?.message || error?.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const askAI = async (sessionId, content) => {
  //   if (!countrySlug || !sessionId) return;
  //   setLoading(true);

  //   try {
  //     // Immediately add user's message
  //     setMessages((prev) => [...prev, { senderId: "user", message: content }]);

  //     const url = `${baseURL}/countries/${countrySlug}/ai-assistant/${sessionId}`;
  //     const user = JSON.parse(localStorage.getItem("user")); // adjust to your auth setup

  //     // Start streaming request (SSE style)
  //     const response = await fetch(url, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
  //       },
  //       body: JSON.stringify({
  //         message: content,
  //         language: selectedLanguage.name,
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP ${response.status}`);
  //     }

  //     // 🧠 Stream reader setup
  //     const reader = response.body.getReader();
  //     const decoder = new TextDecoder("utf-8");
  //     let fullText = "";
  //     let partialMessage = "";

  //     // Add placeholder for streaming response
  //     setMessages((prev) => [...prev, { senderId: "aichatId", message: "" }]);

  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;
  //       const chunk = decoder.decode(value, { stream: true });

  //       // Split on event lines
  //       const events = chunk.split("\n\n");
  //       for (const evt of events) {
  //         if (!evt.trim()) continue;
  //         if (evt.startsWith("data:")) {
  //           const data = JSON.parse(evt.replace("data: ", ""));
  //           if (data.chunk) {
  //             fullText += data.chunk;
  //             partialMessage += data.chunk;

  //             // Update the last AI message progressively
  //             setMessages((prev) => {
  //               const updated = [...prev];
  //               const last = updated[updated.length - 1];
  //               if (last && last.senderId === "aichatId") {
  //                 last.message = partialMessage;
  //               }
  //               return updated;
  //             });
  //           }
  //         } else if (evt.startsWith("event: done")) {
  //           console.log("Streaming complete");
  //         } else if (evt.startsWith("event: error")) {
  //           const errorData = JSON.parse(evt.replace("data: ", ""));
  //           console.error("Stream error:", errorData);
  //           toast.error(errorData?.message || "AI stream error");
  //         }
  //       }
  //     }

  //     // Final message save
  //     setMessages((prev) => {
  //       const updated = [...prev];
  //       const last = updated[updated.length - 1];
  //       if (last && last.senderId === "aichatId") {
  //         last.message = fullText.trim();
  //       }
  //       return updated;
  //     });
  //   } catch (error) {
  //     console.error("AI streaming error:", error);
  //     toast.error("Failed to stream AI response.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const askAI = async (sessionId, content) => {
    if (!countrySlug || !sessionId) return;
    setLoading(true);

    try {
      // Add user's message immediately
      setMessages((prev) => [...prev, { senderId: "user", message: content }]);

      // Add placeholder AI message
      setMessages((prev) => [
        ...prev,
        { senderId: "aichatId", message: "", isStreaming: true },
      ]);

      const url = `${baseURL}/countries/${countrySlug}/ai-assistant/${sessionId}`;
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({
          message: content,
          language: selectedLanguage.name,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // 🔹 Stream setup
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";
      const bufferRef = { current: "" };
      let animationFrameId;

      // 🔹 Smooth animation loop (runs ~60fps)
      const animate = () => {
        if (bufferRef.current) {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.senderId === "aichatId") {
              last.message += bufferRef.current;
            }
            return updated;
          });
          bufferRef.current = "";
        }
        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);

      // 🔹 Read stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split("\n\n");

        for (const evt of events) {
          if (!evt.trim()) continue;

          if (evt.startsWith("data:")) {
            const data = JSON.parse(evt.replace("data: ", ""));
            if (data.chunk) {
              fullText += data.chunk;
              bufferRef.current += data.chunk; // only buffer, don’t render instantly
            }
          } else if (evt.startsWith("event: done")) {
            console.log("Streaming complete");
          } else if (evt.startsWith("event: error")) {
            const errorData = JSON.parse(evt.replace("data: ", ""));
            console.error("Stream error:", errorData);
            toast.error(errorData?.message || "AI stream error");
          }
        }
      }

      cancelAnimationFrame(animationFrameId);

      // 🔹 Finalize message
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.senderId === "aichatId") {
          last.message = fullText.trim();
          last.isStreaming = false;
        }
        return updated;
      });
    } catch (error) {
      console.error("AI streaming error:", error);
      toast.error("Failed to stream AI response.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch single session
  const fetchSingleSession = async (sessionId) => {
    if (!countrySlug || !sessionId) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/countries/${countrySlug}/ai-assistant/sessions/${sessionId}`
      );
      const { id, title } = response.data.data;
      setCurrentSession({ id, title });
      setMessages(response.data.data.messages || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear chat
  const clearChatSession = async (sessionId) => {
    if (!countrySlug || !sessionId) return;
    setLoading(true);
    try {
      await axiosInstance.delete(
        `/countries/${countrySlug}/ai-assistant/sessions/${sessionId}`
      );
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

  // Rename chat
  const renameChatSession = async (sessionId, newName) => {
    if (!countrySlug || !sessionId) return;
    setLoading(true);
    try {
      await axiosInstance.put(
        `/countries/${countrySlug}/ai-assistant/sessions/${sessionId}`,
        { title: newName }
      );
      toast.success("Chat session renamed!");
      await fetchAllSessions();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sessions on load
  useEffect(() => {
    if (countrySlug) fetchAllSessions();
  }, [countrySlug]);

  return (
    <CountryAiChatContext.Provider
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
    </CountryAiChatContext.Provider>
  );
};

export const useCountryAIChat = () => useContext(CountryAiChatContext);
