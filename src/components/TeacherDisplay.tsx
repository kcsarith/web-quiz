import React from "react";
import Image from "next/image";
import { TeacherType } from "@/types";
interface TeacherImages {
  neutral: string;
  happy: string;
  sad: string;
  angry: string;
  worried: string;
  excited: string;
}

interface TTSEngine {
  baseUrl: string | null;
  token: string | null;
  model: string | null;
  voiceName: string | null;
}

interface SpeechBubble {
  message: string;
  isVisible: boolean;
  autoHide?: boolean;
  duration?: number;
}

interface TeacherDisplayProps {
  teacher: TeacherType;
  emotion?: keyof TeacherImages;
  position?: "bottom-left" | "bottom-right";
  size?: "small" | "medium" | "large";
  className?: string;
  speechBubble?: SpeechBubble;
  onSpeechComplete?: () => void;
}

const TeacherDisplay: React.FC<TeacherDisplayProps> = ({
  teacher,
  emotion = "neutral",
  position = "bottom-right",
  size = "large",
  className = "",
  speechBubble,
  onSpeechComplete,
}) => {
  const [showBubble, setShowBubble] = React.useState(false);
  const [displayedText, setDisplayedText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [currentAudio, setCurrentAudio] =
    React.useState<HTMLAudioElement | null>(null);
  const [lastMessage, setLastMessage] = React.useState<string>("");

  // Function to detect and format code blocks
  const formatMessageWithCode = (text: string) => {
    // Split by code blocks (```language\ncode\n``` pattern)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText.trim()) {
          parts.push({ type: "text", content: beforeText });
        }
      }

      // Add code block
      const language = match[1] || "text";
      const code = match[2].trim();
      parts.push({ type: "code", content: code, language });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push({ type: "text", content: remainingText, language: null });
      }
    }

    // If no code blocks found, return original text as single part
    if (parts.length === 0) {
      // Check for inline code (backticks)
      const inlineCodeRegex = /`([^`]+)`/g;
      if (inlineCodeRegex.test(text)) {
        return formatInlineCode(text);
      }
      return [{ type: "text", content: text }];
    }

    return parts;
  };

  // Function to format inline code
  const formatInlineCode = (text: string) => {
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText) {
          parts.push({ type: "text", content: beforeText });
        }
      }

      // Add inline code
      parts.push({ type: "inline-code", content: match[1] });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        parts.push({ type: "text", content: remainingText });
      }
    }

    return parts;
  };

  // Function to render formatted content
  const renderFormattedContent = (content: string) => {
    const parts = formatMessageWithCode(content);

    return (
      <div className="space-y-2">
        {parts.map((part, index) => {
          if (part.type === "code") {
            return (
              <div key={index} className="relative">
                {/* Language label */}
                {part.language && part.language !== "text" && (
                  <div className="text-xs text-gray-500 mb-1 font-mono">
                    {part.language}
                  </div>
                )}
                {/* Code block */}
                <pre className="bg-gray-900 text-green-400 p-3 rounded-md overflow-x-auto text-xs font-mono max-h-64 overflow-y-auto">
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          } else if (part.type === "inline-code") {
            return (
              <code
                key={index}
                className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs font-mono"
              >
                {part.content}
              </code>
            );
          } else {
            // Regular text - preserve line breaks
            return (
              <div key={index} className="whitespace-pre-wrap">
                {part.content}
              </div>
            );
          }
        })}
      </div>
    );
  };

  // TTS function to synthesize speech
  const synthesizeSpeech = async (
    text: string
  ): Promise<HTMLAudioElement | null> => {
    try {
      // Strip markdown/code formatting for TTS
      const cleanText = text
        .replace(/```[\s\S]*?```/g, " [code block] ")
        .replace(/`([^`]+)`/g, " $1 ")
        .replace(/\n+/g, " ")
        .trim();

      const voiceId = teacher.ttsEngine.voiceName || null;
      const voiceBaseUrl = teacher.ttsEngine.baseUrl || null;
      const voiceModel = teacher.ttsEngine.model || null;

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseUrl: voiceBaseUrl,
          model: voiceModel,
          Text: cleanText,
          OutputFormat: "mp3",
          VoiceId: voiceId,
          SampleRate: "22050",
        }),
      });

      if (
        response.ok &&
        response.headers.get("content-type")?.includes("audio/mpeg")
      ) {
        // Success: got audio
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Clean up the object URL when audio is done
        audio.addEventListener("ended", () => {
          URL.revokeObjectURL(audioUrl);
        });

        return audio;
      } else {
        // Fallback to Web Speech API
        console.log("TTS API failed, falling back to Web Speech API");
        return createWebSpeechAudio(cleanText);
      }
    } catch (error) {
      console.error("TTS API error:", error);
      // Fallback to Web Speech API
      const cleanText = text
        .replace(/```[\s\S]*?```/g, " [code block] ")
        .replace(/`([^`]+)`/g, " $1 ")
        .replace(/\n+/g, " ")
        .trim();
      return createWebSpeechAudio(cleanText);
    }
  };

  // Fallback Web Speech API function
  const createWebSpeechAudio = (text: string): HTMLAudioElement | null => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);

      // Try to match gender if possible
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice =
          voices.find((voice) =>
            teacher.gender.toLowerCase() === "female"
              ? voice.name.toLowerCase().trim() === "female" ||
                voice.name.toLowerCase().trim() === "woman"
              : teacher.gender.toLowerCase() === "male"
              ? voice.name.toLowerCase().trim() === "male" ||
                voice.name.toLowerCase().trim() === "man"
              : true
          ) || voices[0];
        console.log(teacher.gender.toLowerCase(), preferredVoice);
        utterance.voice = preferredVoice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Create a promise-based wrapper for the speech synthesis
      return new Promise<HTMLAudioElement | null>((resolve) => {
        utterance.onstart = () => {
          // Create a dummy audio element for consistent interface
          const dummyAudio = new Audio();
          dummyAudio.play = () => {
            speechSynthesis.speak(utterance);
            return Promise.resolve();
          };
          dummyAudio.pause = () => speechSynthesis.cancel();
          resolve(dummyAudio);
        };

        utterance.onerror = () => resolve(null);

        // Start synthesis immediately to trigger onstart
        speechSynthesis.speak(utterance);
      }) as any;
    }

    return null;
  };

  // Handle speech bubble visibility and typing animation
  React.useEffect(() => {
    // Only process if there's a new message or if visibility changed
    const currentMessage = speechBubble?.message || "";
    const isVisible = speechBubble?.isVisible || false;

    // If not visible, hide everything
    if (!isVisible) {
      setShowBubble(false);
      setDisplayedText("");
      setLastMessage("");
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
      return;
    }

    // If it's the same message as before and we're already showing it, don't restart
    if (currentMessage === lastMessage && showBubble && currentMessage !== "") {
      return;
    }

    // If there's no message, don't show anything
    if (!currentMessage) {
      setShowBubble(false);
      setDisplayedText("");
      return;
    }

    // Set the new message as the last message
    setLastMessage(currentMessage);

    setShowBubble(true);
    setIsTyping(true);
    setDisplayedText("");

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }

    let typingInterval: NodeJS.Timeout;
    let hideTimeout: NodeJS.Timeout;
    let audioEndedListener: () => void;
    let audioErrorListener: () => void;

    // Start TTS synthesis
    synthesizeSpeech(currentMessage)
      .then((audio) => {
        if (audio) {
          // Set up event listeners before playing
          audioEndedListener = () => {
            if (speechBubble.autoHide) {
              hideTimeout = setTimeout(() => {
                setShowBubble(false);
                setCurrentAudio(null);
                setLastMessage("");
                onSpeechComplete?.();
              }, 1500);
            }
          };

          audioErrorListener = () => {
            console.warn("Audio playback error, completing speech");
            if (speechBubble.autoHide) {
              hideTimeout = setTimeout(() => {
                setShowBubble(false);
                setCurrentAudio(null);
                setLastMessage("");
                onSpeechComplete?.();
              }, 1500);
            }
          };

          audio.addEventListener("ended", audioEndedListener);
          audio.addEventListener("error", audioErrorListener);

          setCurrentAudio(audio);

          // Play with error handling
          audio.play().catch((error) => {
            console.warn("Audio play failed:", error);
            // Still complete the speech flow even if audio fails
            if (speechBubble.autoHide) {
              const estimatedDuration = Math.max(
                4000,
                currentMessage.length * 80
              );
              hideTimeout = setTimeout(() => {
                setShowBubble(false);
                setCurrentAudio(null);
                setLastMessage("");
                onSpeechComplete?.();
              }, estimatedDuration);
            }
          });
        } else if (speechBubble.autoHide) {
          // If no audio, use text-based timing
          const estimatedDuration = Math.max(4000, currentMessage.length * 80);
          hideTimeout = setTimeout(() => {
            setShowBubble(false);
            setLastMessage("");
            onSpeechComplete?.();
          }, estimatedDuration);
        }
      })
      .catch((error) => {
        console.error("TTS synthesis failed:", error);
        // Ensure speech completes even if TTS fails
        if (speechBubble.autoHide) {
          const estimatedDuration = Math.max(4000, currentMessage.length * 80);
          hideTimeout = setTimeout(() => {
            setShowBubble(false);
            setLastMessage("");
            onSpeechComplete?.();
          }, estimatedDuration);
        }
      });

    // Typing animation - for large content, show immediately
    const messageLength = currentMessage.length;
    if (messageLength > 500) {
      // For long messages, show content immediately
      setDisplayedText(currentMessage);
      setIsTyping(false);
    } else {
      // Normal typing animation for shorter messages
      let currentIndex = 0;
      typingInterval = setInterval(() => {
        if (currentIndex < currentMessage.length) {
          setDisplayedText(currentMessage.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
        }
      }, 50);
    }

    return () => {
      clearInterval(typingInterval);
      clearTimeout(hideTimeout);
      if (currentAudio) {
        // Remove event listeners before pausing
        if (audioEndedListener) {
          currentAudio.removeEventListener("ended", audioEndedListener);
        }
        if (audioErrorListener) {
          currentAudio.removeEventListener("error", audioErrorListener);
        }
        currentAudio.pause();
      }
    };
  }, [
    speechBubble?.isVisible,
    speechBubble?.message,
    speechBubble?.autoHide,
    onSpeechComplete,
  ]);

  // Cleanup audio on component unmount
  React.useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
    };
  }, [currentAudio]);

  // Size configurations
  const sizeClasses = {
    small: "w-16 h-16 sm:w-20 sm:h-20",
    medium: "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28",
    large: "w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36",
  };

  // Position classes
  const positionClasses = {
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  // Get the image source based on emotion
  const getImageSrc = () => {
    const imagePath = teacher.images[emotion];

    // Handle base64 images (like the angry emotion in your example)
    if (imagePath.startsWith("data:image")) {
      return imagePath;
    }

    // For regular file paths, you might want to prepend a base path
    // Adjust this based on your file structure
    return `/images/teachers/${teacher.name.toLowerCase()}/${imagePath}`;
  };

  // Speech bubble position based on teacher position
  const getBubblePosition = () => {
    if (position === "bottom-left") {
      return {
        container: "bottom-full left-0 mb-2",
        arrow: "bottom-0 left-4 transform translate-y-full",
        arrowStyle:
          "border-t-white border-l-transparent border-r-transparent border-b-transparent",
      };
    } else {
      return {
        container: "bottom-full right-0 mb-2",
        arrow: "bottom-0 right-4 transform translate-y-full",
        arrowStyle:
          "border-t-white border-l-transparent border-r-transparent border-b-transparent",
      };
    }
  };

  const bubblePos = getBubblePosition();

  return (
    <div
      className={`
        fixed z-50
        ${positionClasses[position]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Speech Bubble - Made much larger for long content */}
      {showBubble && (
        <div
          className={`absolute ${bubblePos.container} w-96 max-w-2xl max-h-96`}
        >
          <div className="relative">
            {/* Bubble Content */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4 relative max-h-96 overflow-y-auto">
              <div className="text-sm text-gray-800 leading-relaxed">
                {displayedText && renderFormattedContent(displayedText)}
                {isTyping && (
                  <span className="inline-block w-2 h-4 bg-gray-600 ml-1 animate-pulse"></span>
                )}
              </div>

              {/* Close button */}
              {!speechBubble?.autoHide && (
                <button
                  onClick={() => {
                    setShowBubble(false);
                    setLastMessage("");
                    if (currentAudio) {
                      currentAudio.pause();
                      setCurrentAudio(null);
                    }
                    onSpeechComplete?.();
                  }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-gray-300 hover:bg-gray-400 rounded-full flex items-center justify-center text-sm text-gray-600 transition-colors font-bold"
                  aria-label="Close speech bubble"
                >
                  ×
                </button>
              )}

              {/* Scroll indicator for long content */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {displayedText.length > 1000 && "Scroll for more..."}
              </div>
            </div>

            {/* Arrow pointing to teacher */}
            <div
              className={`absolute ${bubblePos.arrow} w-0 h-0 border-8 ${bubblePos.arrowStyle}`}
            ></div>
          </div>
        </div>
      )}

      <div className="relative w-full h-full">
        {/* Teacher Image */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white shadow-lg bg-white">
          <Image
            src={getImageSrc()}
            alt={`${teacher.name} - ${emotion}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80px, (max-width: 1024px) 112px, 144px"
            priority
          />
        </div>

        {/* Optional: Emotion indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white opacity-75"></div>

        {/* Optional: Name tooltip on hover */}
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {teacher.name} - {emotion}
        </div>
      </div>
    </div>
  );
};

export default TeacherDisplay;
