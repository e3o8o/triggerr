import { Send } from "lucide-react";

import React, { useState } from "react";
import Image from "next/image";
import type { UnsplashImage } from "@/lib/image-fetcher";

// --- TYPE DEFINITIONS ---

interface ChatMessage {
  id: number;
  sender: "user" | "assistant";
  text: string;
  hasCta?: boolean;
}

interface ChatTabProps {
  handleAddToCart: (item: any) => void;
  backgroundImages: UnsplashImage[];
  currentImageIndex: number;
  handleManualRotate: () => void;
}

// --- COMPONENT ---

const ChatTab: React.FC<ChatTabProps> = ({
  handleAddToCart,
  backgroundImages,
  currentImageIndex,
  handleManualRotate,
}) => {
  // --- STATE ---

  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // --- EVENT HANDLERS ---

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (!hasStartedChat) {
      setHasStartedChat(true);
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: chatInput,
    };

    console.log("User sent message:", chatInput);

    const assistantResponse: ChatMessage = {
      id: Date.now() + 1,
      sender: "assistant",
      text: `Received: "${chatInput}". I can also provide a sample quote.`,
      hasCta: true,
    };

    setChatMessages((prev) => [...prev, userMessage, assistantResponse]);
    setChatInput("");
  };

  // --- RENDER LOGIC ---

  if (!hasStartedChat) {
    return (
      <div className="relative bg-transparent p-10 rounded-lg h-[70vh] flex flex-col items-center justify-center overflow-hidden">
        {/* This is the NEW, sharp image layer using next/image */}
        {backgroundImages.length > 0 &&
          backgroundImages[currentImageIndex]?.url && (
            <Image
              key={backgroundImages[currentImageIndex].id}
              src={backgroundImages[currentImageIndex].url}
              alt="Travel Background"
              fill
              className="absolute top-0 left-0 w-full h-full object-cover rounded-lg z-0"
              priority={currentImageIndex === 0}
            />
          )}

        {/* This container provides the dark overlay for text readability */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 rounded-lg"></div>

        <div className="relative z-20 text-center p-6">
          <h2 className="text-3xl font-bold text-white">
            Conversational Interface
          </h2>
          <p className="text-gray-200 mt-2 mb-6 max-w-md mx-auto">
            Ask about flight insurance, policies, or your wallet. The system
            will respond based on the context. Images rotate every 5 minutes and
            a new set is fetched every 30 minutes.
          </p>
          <form
            onSubmit={handleSendMessage}
            className="w-full max-w-xl flex gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g., Insurance for flight BA245 tomorrow"
              className="flex-grow p-3 border border-gray-300 rounded-lg text-sm bg-white/90 focus:bg-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        {backgroundImages.length > 0 && (
          <div className="absolute bottom-4 right-4 z-20 text-xs flex items-center gap-4">
            <button
              onClick={handleManualRotate}
              className="px-2 py-1 bg-black/30 text-white/80 rounded-md hover:bg-black/50 transition-colors"
            >
              Rotate Image
            </button>
            <a
              href={backgroundImages[currentImageIndex]?.user.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white"
            >
              Photo by {backgroundImages[currentImageIndex]?.user.name}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/20">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Chat Interface
      </h2>
      <div className="flex flex-col h-[60vh]">
        <div className="flex-grow overflow-y-auto p-4 bg-gray-50 rounded-md mb-4 border">
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-md p-3 rounded-lg ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.text}
                  {msg.hasCta && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <button
                        onClick={() =>
                          handleAddToCart({
                            name: "Sample Flight Insurance",
                            description: "Coverage for BA245",
                            price: "25.00",
                          })
                        }
                        className="text-sm bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-md hover:bg-blue-200"
                      >
                        Add Sample Quote to Cart
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="flex-grow p-3 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatTab;
