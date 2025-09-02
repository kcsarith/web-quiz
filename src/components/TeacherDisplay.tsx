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

  // TTS function to synthesize speech
  const synthesizeSpeech = async (
    text: string
  ): Promise<HTMLAudioElement | null> => {
    try {
      const voiceId = teacher.ttsEngine.voiceName || "Ivy";
      const voiceBaseUrl = teacher.ttsEngine.baseUrl || null;
      const voiceModel = teacher.ttsEngine.model || "polly";

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseUrl: voiceBaseUrl,
          model: voiceModel,
          Text: text,
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
        return createWebSpeechAudio(text);
      }
    } catch (error) {
      console.error("TTS API error:", error);
      // Fallback to Web Speech API
      return createWebSpeechAudio(text);
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
              ? voice.name.toLowerCase().includes("female") ||
                voice.name.toLowerCase().includes("woman")
              : voice.name.toLowerCase().includes("male") ||
                voice.name.toLowerCase().includes("man")
          ) || voices[0];

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
    if (speechBubble?.isVisible && speechBubble.message) {
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
      synthesizeSpeech(speechBubble.message)
        .then((audio) => {
          if (audio) {
            // Set up event listeners before playing
            audioEndedListener = () => {
              if (speechBubble.autoHide) {
                hideTimeout = setTimeout(() => {
                  setShowBubble(false);
                  setCurrentAudio(null);
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
                  speechBubble.message.length * 80
                );
                hideTimeout = setTimeout(() => {
                  setShowBubble(false);
                  setCurrentAudio(null);
                  onSpeechComplete?.();
                }, estimatedDuration);
              }
            });
          } else if (speechBubble.autoHide) {
            // If no audio, use text-based timing
            const estimatedDuration = Math.max(
              4000,
              speechBubble.message.length * 80
            );
            hideTimeout = setTimeout(() => {
              setShowBubble(false);
              onSpeechComplete?.();
            }, estimatedDuration);
          }
        })
        .catch((error) => {
          console.error("TTS synthesis failed:", error);
          // Ensure speech completes even if TTS fails
          if (speechBubble.autoHide) {
            const estimatedDuration = Math.max(
              4000,
              speechBubble.message.length * 80
            );
            hideTimeout = setTimeout(() => {
              setShowBubble(false);
              onSpeechComplete?.();
            }, estimatedDuration);
          }
        });

      // Typing animation
      let currentIndex = 0;
      typingInterval = setInterval(() => {
        if (currentIndex < speechBubble.message.length) {
          setDisplayedText(speechBubble.message.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
        }
      }, 50);

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
    } else {
      setShowBubble(false);
      setDisplayedText("");
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
    }
  }, [speechBubble?.isVisible, speechBubble?.message, onSpeechComplete]);

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
      {/* Speech Bubble */}
      {showBubble && (
        <div className={`absolute ${bubblePos.container} w-64 max-w-xs`}>
          <div className="relative">
            {/* Bubble Content */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-3 relative">
              <div className="text-sm text-gray-800 leading-relaxed">
                {displayedText}
                {isTyping && (
                  <span className="inline-block w-2 h-4 bg-gray-600 ml-1 animate-pulse"></span>
                )}
              </div>

              {/* Close button (optional) */}
              {!speechBubble?.autoHide && (
                <button
                  onClick={() => {
                    setShowBubble(false);
                    if (currentAudio) {
                      currentAudio.pause();
                      setCurrentAudio(null);
                    }
                    onSpeechComplete?.();
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gray-300 hover:bg-gray-400 rounded-full flex items-center justify-center text-xs text-gray-600 transition-colors"
                  aria-label="Close speech bubble"
                >
                  ×
                </button>
              )}
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
