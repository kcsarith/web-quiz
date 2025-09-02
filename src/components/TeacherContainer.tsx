"use client"
import React from "react";
import TeacherDisplay from "./TeacherDisplay";
import { TeacherType } from "@/types";
interface TeacherImages {
  neutral: string;
  happy: string;
  sad: string;
  angry: string;
  worried: string;
  excited: string;
}

interface SpeechBubble {
  message: string;
  isVisible: boolean;
  autoHide?: boolean;
  duration?: number;
}


const TeacherContainer: React.FC<{ teacherName: string }> = ({
  teacherName,
}) => {
  const [teacher, setTeacher] = React.useState<TeacherType | null>(null);
  const [currentEmotion, setCurrentEmotion] =
    React.useState<keyof TeacherImages>("neutral");
  const [loading, setLoading] = React.useState(true);
  const [speechBubble, setSpeechBubble] = React.useState<SpeechBubble>({
    message: "",
    isVisible: false,
  });
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  React.useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await fetch(`/api/teachers/${teacherName}`);
        if (response.ok) {
          const teacherData = await response.json();
          setTeacher(teacherData);
        }
      } catch (error) {
        console.error("Failed to fetch teacher:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [teacherName]);

  // Example function to make teacher speak
  const makeTeacherSpeak = (
    message: string,
    emotion: keyof TeacherImages = "neutral",
    autoHide = true
  ) => {
    // Prevent multiple concurrent speeches
    if (isSpeaking) {
      return;
    }

    setIsSpeaking(true);
    setCurrentEmotion(emotion);
    setSpeechBubble({
      message,
      isVisible: true,
      autoHide,
      duration: autoHide ? Math.max(5000, message.length * 100) : undefined, // Longer duration based on message length
    });
  };

  const handleSpeechComplete = () => {
    setSpeechBubble((prev) => ({ ...prev, isVisible: false }));
    setIsSpeaking(false);

    // Keep emotion for a bit longer after speech completes, then return to neutral
    setTimeout(() => {
      if (!isSpeaking) {
        // Only reset to neutral if not speaking again
        setCurrentEmotion("neutral");
      }
    }, 2000); // Stay in emotion for 2 more seconds after speech bubble disappears
  };

  // Safety timeout to reset isSpeaking state if it gets stuck
  React.useEffect(() => {
    if (isSpeaking) {
      const safetyTimeout = setTimeout(() => {
        console.warn(
          "Speech safety timeout triggered, resetting isSpeaking state"
        );
        setIsSpeaking(false);
      }, 15000); // Reset after 15 seconds maximum

      return () => clearTimeout(safetyTimeout);
    }
  }, [isSpeaking]);

  // Teacher loads silently without automatic speech

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 w-20 h-20 rounded-full bg-gray-200 animate-pulse border-2 border-white shadow-lg"></div>
    );
  }

  if (!teacher) {
    return null;
  }

  return (
    <>
      <TeacherDisplay
        teacher={teacher}
        emotion={currentEmotion}
        position="bottom-right"
        size="medium"
        speechBubble={speechBubble}
        onSpeechComplete={handleSpeechComplete}
      />

      {/* Example controls for testing */}
      <div className="fixed top-4 left-4 space-y-2 z-40">
        <button
          onClick={() =>
            makeTeacherSpeak("Great job! Keep up the good work!", "excited")
          }
          disabled={isSpeaking}
          className={`px-3 py-1 rounded text-sm text-white ${
            isSpeaking
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          Encourage
        </button>
        <button
          onClick={() =>
            makeTeacherSpeak(
              "Hmm, let me think about that question...",
              "worried"
            )
          }
          disabled={isSpeaking}
          className={`px-3 py-1 rounded text-sm text-white ${
            isSpeaking
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
        >
          Think
        </button>
        <button
          onClick={() =>
            makeTeacherSpeak(
              "I'm sorry, but that's not quite right. Let's try again.",
              "sad"
            )
          }
          disabled={isSpeaking}
          className={`px-3 py-1 rounded text-sm text-white ${
            isSpeaking
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          Correct
        </button>
      </div>
    </>
  );
};


export default TeacherContainer;
