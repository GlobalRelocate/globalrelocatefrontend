import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Custom CarouselIndicators component
export const CarouselIndicators = ({ currentIndex, total, onClick }) => {
  return (
    <div className="flex absolute bottom-4 left-1/2 transform -translate-x-1/2 justify-center mt-2">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          className={`w-6 h-1 shadow rounded-md mx-1 ${
            currentIndex === index ? "bg-black" : "bg-gray-300"
          }`}
          onClick={() => onClick(index)}
        />
      ))}
    </div>
  );
};

export const StreamingMessage = ({ text = "", isStreaming }) => {
  const [displayedText, setDisplayedText] = useState("");
  const bufferRef = useRef("");

  // Smoothly animate the text as it streams
  useEffect(() => {
    bufferRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      return;
    }

    let animationFrame;
    let lastRendered = 0;

    const tick = (timestamp) => {
      if (timestamp - lastRendered > 30) {
        setDisplayedText((prev) => {
          const nextChunk = bufferRef.current.slice(0, prev.length + 3); // ~3 chars per frame
          return nextChunk;
        });
        lastRendered = timestamp;
      }
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [isStreaming, text]);

  return (
    <div className="relative">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedText || "▌"}
      </ReactMarkdown>
      {isStreaming && (
        <span className="absolute bottom-0 ml-1 animate-pulse text-gray-400">
          ▌
        </span>
      )}
    </div>
  );
};
