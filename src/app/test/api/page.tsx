"use client"
import React, { useState } from "react";
import { ApiResponseProps, RequestFormProps } from "@/types";

import ResponseDisplay from "@/components/ResponseDisplay";
interface QuickExamplesProps {
  onExampleClick: (method: string, endpoint: string, body?: string) => void;
}
import TeacherContainer from "@/components/TeacherContainer";
import { json } from "stream/consumers";
// Request Form Component
const RequestForm: React.FC<RequestFormProps> = ({
  endpoint,
  setEndpoint,
  method,
  setMethod,
  body,
  setBody,
  onSendRequest,
  loading,
}) => {
  const [bodyError, setBodyError] = useState<string | null>(null);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
      setBodyError(null);
    } catch (e) {
      setBodyError("Invalid JSON format");
    }
  };

  const showBodyField = method !== "GET" && method !== "DELETE";

  return (
    <div className="space-y-4">
      {/* Method and Endpoint */}
      <div className="flex gap-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>

        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="/api/endpoint"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Request Body */}
      {showBodyField && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Request Body (JSON)
            </label>
            <button
              onClick={formatJson}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Format JSON
            </button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter JSON body here..."
          />
          {bodyError && (
            <p className="text-xs text-red-600 mt-1">{bodyError}</p>
          )}
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={onSendRequest}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Sending..." : "Send Request"}
      </button>
    </div>
  );
};

// Quick Examples Component
const QuickExamples: React.FC<QuickExamplesProps> = ({ onExampleClick }) => {
  const examples = [
    {
      method: "GET",
      endpoint: "/api/teachers",
      description: "Get all teachers mappings",
      color: "text-green-600",
    },
    {
      method: "GET",
      endpoint: "/api/quizzes",
      description: "Get all quiz mappings",
      color: "text-green-600",
    },
    {
      method: "POST",
      endpoint: "/api/users",
      body: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
      description: "Create a new user",
      color: "text-blue-600",
    },
    {
      method: "PUT",
      endpoint: "/api/users/1",
      body: '{\n  "name": "Jane Doe",\n  "email": "jane@example.com"\n}',
      description: "Update user by ID",
      color: "text-orange-600",
    },
    {
      method: "DELETE",
      endpoint: "/api/users/1",
      description: "Delete user by ID",
      color: "text-red-600",
    },
    {
      method: "GET",
      endpoint: "/api/tts",
      description: "Get all voices",
      color: "text-green-600",
    },
    {
      method: "POST",
      endpoint: "/api/tts",
      body: JSON.stringify({
        baseUrl: "http://192.168.0.2:8880/v1",
        model: "kokoro",
        Text: "This is a test.",
        OutputFormat: "mp3",
        VoiceId: "af",
        SampleRate: "22050",
      }, null, 2),
      description: "Create sample audio file",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="pt-6 border-t">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Examples</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() =>
              onExampleClick(example.method, example.endpoint, example.body)
            }
            className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className={`font-mono text-sm ${example.color} font-medium`}>
              {example.method} {example.endpoint}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {example.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Main API Tester Component
export default function ApiTester() {
  const [endpoint, setEndpoint] = useState("/api/quizzes");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState(
    '{\n  "name": "example",\n  "email": "test@example.com"\n}'
  );
  const [response, setResponse] = useState<ApiResponseProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Only add body for methods that support it
      if (method !== "GET" && method !== "DELETE" && body.trim()) {
        try {
          JSON.parse(body); // Validate JSON
          options.body = body;
        } catch (e) {
          throw new Error("Invalid JSON in request body");
        }
      }

      const res = await fetch(endpoint, options);

      // Check content type to determine how to handle the response
      const contentType = res.headers.get("content-type") || "";

      let data;
      if (contentType.includes("audio/") || contentType.includes("video/")) {
        // Handle audio/video content
        const blob = await res.blob();
        data = URL.createObjectURL(blob);
      } else {
        // Handle JSON and other content types
        data = await res.json();
      }

      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };
  const clearResponse = () => {
    setResponse(null);
    setError(null);
  };

  const handleExampleClick = (
    exampleMethod: string,
    exampleEndpoint: string,
    exampleBody?: string
  ) => {
    setMethod(exampleMethod);
    setEndpoint(exampleEndpoint);
    if (exampleBody) {
      setBody(exampleBody);
    }
    clearResponse();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <TeacherContainer teacherName="nakedApronGirl" />
          <h1 className="text-2xl font-bold text-gray-900 mb-6">API Tester</h1>

          {/* Request Form */}
          <div className="mb-6">
            <RequestForm
              endpoint={endpoint}
              setEndpoint={setEndpoint}
              method={method}
              setMethod={setMethod}
              body={body}
              setBody={setBody}
              onSendRequest={sendRequest}
              loading={loading}
            />
          </div>

          {/* Response Display */}
          <ResponseDisplay
            response={response}
            error={error}
            onClear={clearResponse}
          />

          {/* Quick Examples */}
          <QuickExamples onExampleClick={handleExampleClick} />
        </div>
      </div>
    </div>
  );
}
