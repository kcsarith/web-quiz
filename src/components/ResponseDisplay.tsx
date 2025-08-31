import { ResponseDisplayProps } from "@/types";
import AudioPlayer from "@/components/AudioPlayer";
import WebSpeechTTS from "@/components/WebSpeechTTS";
const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  response,
  error,
  onClear,
}) => {
  if (!response && !error) return null;

  // Check if response data contains audio content
  const isAudioResponse =
    response?.data &&
    typeof response.data === "string" &&
    (response.data.startsWith("data:audio") ||
      response.data.startsWith("blob:"));

  // Check if it's a TTS error response (has status 500 and contains text in data)
  const isTTSErrorResponse =
    response?.status === 500 &&
    response.data &&
    typeof response.data === "object" &&
    response.data.text;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {error ? "Error" : "Response"}
        </h3>
        <button
          onClick={onClear}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-1">Error</h4>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 pb-2 border-b">
            <span
              className={`px-2 py-1 text-xs font-bold rounded ${
                response.status >= 200 && response.status < 300
                  ? "bg-green-100 text-green-800"
                  : response.status >= 400
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              Status: {response.status}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(response.timestamp).toLocaleString()}
            </span>
          </div>

          {/* Audio Player (if audio response) */}
          {isAudioResponse && <AudioPlayer audioData={response.data} />}

          {/* Web Speech TTS Fallback (if TTS error response) */}
          {isTTSErrorResponse && <WebSpeechTTS text={response.data.text} />}

          {/* Standard JSON Response */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Response Body
            </h4>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm border max-h-96">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseDisplay;
