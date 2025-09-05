"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import {
  SpeechBubble,
  TeacherType,
  TeacherExpressionsType,
  QuizType,
  ImageOrNull,
} from "@/types";
import TeacherDisplay from "@/components/TeacherDisplay";
import Editor from "@monaco-editor/react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const teacherName = searchParams.get("teacher") || "default";
  const [questions, setQuestions] = useState<QuizType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string[];
  }>({});
  const [codeAnswers, setCodeAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [codeLanguage, setCodeLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferredCodeLanguage');
      return savedLanguage || "javascript";
    }
    return "javascript";
  });
  const [codeResults, setCodeResults] = useState<{
    [key: number]: { isCorrect: boolean; results: any[]; iterations: number[] };
  }>({});
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isAnalyzingCode, setIsAnalyzingCode] = useState(false);
  const [chartData, setChartData] = useState<any>(null);

  const [teacher, setTeacher] = useState<TeacherType | null>(null);
  const [currentEmotion, setCurrentEmotion] =
    useState<keyof TeacherExpressionsType>("neutral");
  const [speechBubble, setSpeechBubble] = useState<SpeechBubble>({
    message: "",
    isVisible: false,
    autoHide: true,
    duration: 5000,
  });
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [questionHints, setQuestionHints] = useState<{ [key: number]: string }>(
    {}
  );

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const path = Array.isArray(params.path)
          ? params.path.join("/")
          : params.path;
        const response = await fetch(`/api/quiz/${path}`);
        if (!response.ok) {
          throw new Error("Failed to fetch quiz data");
        }
        const data = await response.json();
        setQuestions(data);

        const initialAnswers: { [key: number]: string[] } = {};
        const initialCodeAnswers: { [key: number]: string } = {};

        data.forEach((question: any, index: number) => {
          initialAnswers[index] = [];

          if (question.choices.length === 0 && question.answers.length > 0) {
            const language = determineLanguage(question.question);

            if (index === currentQuestionIndex) {
              setCodeLanguage(language);
            }

            initialCodeAnswers[index] = getDefaultCodeTemplate(language, question.question);
          }
        });

        setSelectedAnswers(initialAnswers);
        setCodeAnswers(initialCodeAnswers);

        if (data.length > 0 && data[0].choices.length === 0) {
          const savedLanguage = localStorage.getItem('preferredCodeLanguage');
          if (savedLanguage) {
            setCodeLanguage(savedLanguage);
          } else {
            const language = determineLanguage(data[0].question);
            setCodeLanguage(language);
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    const fetchTeacher = async () => {
      try {
        const response = await fetch(`/api/teachers/${teacherName}`);
        if (response.ok) {
          const teacherData = await response.json();
          setTeacher(teacherData);
          setSpeechBubble({
            message: `Hi, I'm ${teacherData.name}! Let's start this quiz. For coding questions, you can write and run your code!`,
            isVisible: true,
            autoHide: true,
            duration: 6000,
          });
        }
      } catch (err) {
        console.error("Failed to load teacher:", err);
      }
    };

    fetchQuizData();
    fetchTeacher();
  }, [params.path, teacherName]);

  const determineLanguage = (question: string): string => {
    question = question.toLowerCase();
    if (question.includes('python')) return 'python';
    if (question.includes('javascript') || question.includes('js')) return 'javascript';
    if (question.includes('c#')) return 'csharp';
    if (question.includes('java')) return 'java';
    if (question.includes('c++')) return 'cpp';
    return 'javascript';
  };

  const getDefaultCodeTemplate = (language: string, question: string): string => {
    const lowerQuestion = question.toLowerCase();
    const isSortQuestion = lowerQuestion.includes('sort') || lowerQuestion.includes('bubble');

    switch (language) {
      case 'python':
        if (isSortQuestion) {
          return `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n-i-1):
            pass

    return arr

# Example: bubble_sort([5, 2, 4, 2, 6, 2]) should return [2, 2, 2, 4, 5, 6]`;
        }
        return `def solution(arr):

    return result`;

      case 'javascript':
        if (isSortQuestion) {
          return `function bubbleSort(arr) {
    const n = arr.length;

    for (let i = 0; i < n; i++) {
        let swapped = false;

        for (let j = 0; j < n - i - 1; j++) {

        }

        if (!swapped) break;
    }

    return arr;
}

// Example: bubbleSort([5, 2, 4, 2, 6, 2]) should return [2, 2, 2, 4, 5, 6]`;
        }
        return `function solution(arr) {

    return result;
}`;

      case 'csharp':
        if (isSortQuestion) {
          return `using System;

public class Solution {
    public int[] BubbleSort(int[] arr) {
        int n = arr.Length;

        int[] sortedArr = new int[n];
        Array.Copy(arr, sortedArr, n);

        for (int i = 0; i < n; i++) {
            bool swapped = false;

            for (int j = 0; j < n - i - 1; j++) {

            }

            if (!swapped) break;
        }

        return sortedArr;
    }
}`;
        }
        return `using System;
using System.Collections.Generic;

public class Solution {
    public object SolveChallenge(object[] args) {

        return result;
    }
}`;

      case 'java':
        if (isSortQuestion) {
          return `import java.util.Arrays;

public class Solution {
    public int[] bubbleSort(int[] arr) {
        int n = arr.length;

        int[] sortedArr = Arrays.copyOf(arr, n);

        for (int i = 0; i < n; i++) {
            boolean swapped = false;

            for (int j = 0; j < n - i - 1; j++) {

            }

            if (!swapped) break;
        }

        return sortedArr;
    }
}`;
        }
        return `import java.util.*;

public class Solution {
    public Object solveChallenge(Object[] args) {

        return result;
    }
}`;

      case 'cpp':
        if (isSortQuestion) {
          return `#include <vector>
#include <algorithm>

std::vector<int> bubbleSort(std::vector<int> arr) {
    int n = arr.size();

    for (int i = 0; i < n; i++) {
        bool swapped = false;

        for (int j = 0; j < n - i - 1; j++) {

        }

        if (!swapped) break;
    }

    return arr;
}`;
        }
        return `#include <vector>
#include <string>

std::vector<int> solution(std::vector<int> arr) {

    return result;
}`;

      default:
        return `// Write your solution in your preferred language`;
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setCodeLanguage(newLanguage);

    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredCodeLanguage', newLanguage);
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && currentQuestion.choices.length === 0) {
      const newTemplate = getDefaultCodeTemplate(newLanguage, currentQuestion.question);

      const currentCode = codeAnswers[currentQuestionIndex] || '';
      const currentLangTemplate = getDefaultCodeTemplate(codeLanguage, currentQuestion.question);

      if (!currentCode || currentCode === currentLangTemplate) {
        setCodeAnswers(prev => ({
          ...prev,
          [currentQuestionIndex]: newTemplate
        }));
      } else {
        if (confirm("Do you want to replace your current code with the default template for the new language?")) {
          setCodeAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: newTemplate
          }));
        }
      }
    }
  };

  const countSortIterations = (array: any[]): number => {
    let iterations = 0;
    const arr = [...array];
    const n = arr.length;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        iterations++;
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
      }
    }

    return iterations;
  };

  const runCode = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const userCode = codeAnswers[currentQuestionIndex] || '';

    if (!currentQuestion.answers || currentQuestion.answers.length === 0) {
      return;
    }

    setIsRunningCode(true);
    setCurrentEmotion("worried");

    try {
      const testCases = currentQuestion.answers.map(testCase => {
        const inputs = testCase[0];
        const expectedOutput = testCase[1];
        return { inputs, expectedOutput };
      });

      let allPassed = true;
      let results = [];
      let iterations = [];

      for (const testCase of testCases) {
        const { inputs, expectedOutput } = testCase;

        const iterationCount = inputs[0]?.length ? countSortIterations(inputs[0]) : 0;
        iterations.push(iterationCount);

        let result;
        try {
          if (codeLanguage === 'javascript') {
            const wrappedCode = `
              ${userCode}
              ${userCode.includes('bubbleSort') ? 'bubbleSort' : 'solution'}(${JSON.stringify(inputs[0])})
            `;
            result = eval(wrappedCode);
          } else {
            result = simulateCodeExecution(userCode, codeLanguage, inputs);
          }

          const passed = compareResults(result, expectedOutput);
          results.push({
            inputs,
            expectedOutput,
            output: result,
            passed
          });

          if (!passed) allPassed = false;
        } catch (error) {
          results.push({
            inputs,
            expectedOutput,
            output: `Error: ${(error as Error).message}`,
            passed: false
          });
          allPassed = false;
        }
      }

      setCodeResults(prev => ({
        ...prev,
        [currentQuestionIndex]: {
          isCorrect: allPassed,
          results,
          iterations
        }
      }));

      createAlgorithmPerformanceChart(iterations, testCases.map(t => t.inputs[0]?.length || 0));

      if (allPassed) {
        setCurrentEmotion("excited");
        setSpeechBubble({
          message: "Great job! Your code passed all the test cases!",
          isVisible: true,
          autoHide: true,
          duration: 4000,
        });
      } else {
        setCurrentEmotion("worried");
        setSpeechBubble({
          message: "Your code didn't pass all the test cases. Check the results and try again!",
          isVisible: true,
          autoHide: true,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error running code:", error);
      setCodeResults(prev => ({
        ...prev,
        [currentQuestionIndex]: {
          isCorrect: false,
          results: [{ error: (error as Error).message }],
          iterations: []
        }
      }));

      setCurrentEmotion("surprised");
      setSpeechBubble({
        message: "Oops! There was an error running your code. Check for syntax errors!",
        isVisible: true,
        autoHide: true,
        duration: 4000,
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  const analyzeCode = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const userCode = codeAnswers[currentQuestionIndex] || '';

    if (!userCode.trim()) {
      setCurrentEmotion("worried");
      setSpeechBubble({
        message: "There's no code to analyze yet. Start writing your solution first!",
        isVisible: true,
        autoHide: true,
        duration: 3000,
      });
      return;
    }

    setIsAnalyzingCode(true);
    setCurrentEmotion("worried");
    setSpeechBubble({
      message: "",
      isVisible: false,
      autoHide: true,
      duration: 0,
    });

    setTimeout(() => {
      setSpeechBubble({
        message: "Let me review your code...",
        isVisible: true,
        autoHide: false,
        duration: 0,
      });
    }, 100);

    try {
      let testCasesInfo = "";
      if (currentQuestion.answers && currentQuestion.answers.length > 0) {
        testCasesInfo = currentQuestion.answers.map((testCase, index) => {
          const inputs = JSON.stringify(testCase[0]);
          const expectedOutput = JSON.stringify(testCase[1]);
          return `Test case ${index + 1}: Input: ${inputs}, Expected output: ${expectedOutput}`;
        }).join("\n");
      }

      const prompt = `
As a ${teacher?.gender} programming teacher, analyze this ${codeLanguage} code for the following problem:

PROBLEM: ${currentQuestion.question}

CODE:
\`\`\`${codeLanguage}
${userCode}
\`\`\`

TEST CASES:
${testCasesInfo}

Please provide constructive feedback on:
1. What's good about the code (if anything)
2. What needs improvement
3. Any potential bugs or edge cases not handled
4. Algorithm efficiency and suggestions for optimization
5. Style and best practices

Provide specific, actionable advice that will help the student improve their solution. Be encouraging but thorough in your analysis.
`;

      const response = await fetch("/api/llm", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      const data = await response.json();
      console.log(data);
      const analysisResponse: string = data;

      setSpeechBubble({
        message: "",
        isVisible: false,
        autoHide: true,
        duration: 0,
      });

      setTimeout(() => {
        setCurrentEmotion("happy");
        setSpeechBubble({
          message: analysisResponse,
          isVisible: true,
          autoHide: true,
          duration: 12000,
        });
      }, 200);
    } catch (error) {
      console.error("Error analyzing code:", error);
      setSpeechBubble({
        message: "",
        isVisible: false,
        autoHide: true,
        duration: 0,
      });

      setTimeout(() => {
        setCurrentEmotion("worried");
        setSpeechBubble({
          message: "Sorry, I couldn't analyze your code right now. Please try again later.",
          isVisible: true,
          autoHide: true,
          duration: 4000,
        });
      }, 200);
    } finally {
      setIsAnalyzingCode(false);
    }
  };

  const createAlgorithmPerformanceChart = (iterations: number[], inputSizes: number[]) => {
    const sortedPairs = inputSizes.map((size, index) => ({
      size,
      iterations: iterations[index]
    })).sort((a, b) => a.size - b.size);

    const chartData = {
      labels: sortedPairs.map(pair => pair.size.toString()),
      datasets: [
        {
          label: 'Number of Iterations',
          data: sortedPairs.map(pair => pair.iterations),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };

    setChartData(chartData);
  };

  const simulateCodeExecution = (code: string, language: string, inputs: any[][]): any => {
    const input = inputs[0];
    if (!input || !Array.isArray(input)) return [];

    return [...input].sort((a, b) => a - b);
  };

  const compareResults = (result: any, expectedOutput: any): boolean => {
    if (Array.isArray(result) && Array.isArray(expectedOutput)) {
      if (result.length !== expectedOutput.length) return false;
      return result.every((val, idx) => val === expectedOutput[idx]);
    }
    return result === expectedOutput;
  };

  const generateHint = async (
    type: "question" | "choice" | "explanation",
    content: string,
    questionData?: QuizType,
    choiceIndex?: number
  ) => {
    setIsLoadingHint(true);
    setCurrentEmotion("angry");
    setSpeechBubble({
      message: "",
      isVisible: false,
      autoHide: true,
      duration: 0,
    });
    setTimeout(() => {
      setSpeechBubble({
        message: "Let me think about this...",
        isVisible: true,
        autoHide: false,
        duration: 0,
      });
    }, 100);
    try {
      let prompt = "";
      const extraPrompt = `Give simple code snippets and use cases for examples.`
      if (type === "question") {
        if (questionData?.choices.length === 0) {
          prompt = `${extraPrompt} As a helpful ${teacher?.gender} programming teacher, provide a hint for this coding challenge without giving away the solution directly. Challenge: "${content}". Give a supportive hint that guides thinking about the algorithm and implementation.`;
        } else {
          prompt = `${extraPrompt} As a helpful ${teacher?.gender} teacher, provide a hint for this question without giving away the answer directly. Question: "${content}". Available choices: ${questionData?.choices.join(
            ", "
          )}. Give a supportive hint that guides thinking.`;
        }
      } else if (type === "choice") {
        prompt = `${extraPrompt} As a helpful ${teacher?.gender} teacher, provide guidance about this answer choice without revealing if it's correct or wrong. Question: "${questionData?.question}". Choice: "${content}". Give a hint about what to consider when evaluating this choice.`;
      } else if (type === "explanation") {
        if (questionData?.choices.length === 0) {
          prompt = `${extraPrompt} As a supportive ${teacher?.gender} programming teacher, explain the correct approach to solve this coding challenge: "${questionData?.question}". Provide a high-level explanation of the algorithm and implementation strategy without giving the complete code solution. Be encouraging and educational.`;
        } else {
          const correctAnswers = questionData?.answers.join(", ") || "";
          prompt = `${extraPrompt} As a supportive ${teacher?.gender} teacher, explain why the correct answer is "${correctAnswers}" for the question: "${questionData?.question}". Also explain common misconceptions about the incorrect choices. Be encouraging and educational.`;
        }
      }
      const response = await fetch("/api/llm", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });
      const data = await response.json();
      console.log(data);
      const chatResponse: string = data;
      setSpeechBubble({
        message: "",
        isVisible: false,
        autoHide: true,
        duration: 0,
      });
      setTimeout(() => {
        setCurrentEmotion("happy");
        setSpeechBubble({
          message: chatResponse,
          isVisible: true,
          autoHide: true,
          duration: 8000,
        });
      }, 200);
    } catch (error) {
      console.error("Failed to generate hint:", error);
      setSpeechBubble({
        message: "",
        isVisible: false,
        autoHide: true,
        duration: 0,
      });
      setTimeout(() => {
        setCurrentEmotion("worried");
        setSpeechBubble({
          message:
            "Sorry, I couldn't generate a hint right now. Try thinking about what you already know about this topic!",
          isVisible: true,
          autoHide: true,
          duration: 5000,
        });
      }, 200);
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleQuestionHint = () => {
    const currentQuestion = questions[currentQuestionIndex];
    generateHint("question", currentQuestion.question, currentQuestion);
  };

  const handleChoiceHint = (choice: string, choiceIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    generateHint("choice", choice, currentQuestion, choiceIndex);
  };

  const handleAnswerChange = (choice: string, isChecked: boolean) => {
    setSelectedAnswers((prev) => {
      const currentAnswers = Array.isArray(prev[currentQuestionIndex])
        ? [...prev[currentQuestionIndex]]
        : [];
      const currentQuestion = questions[currentQuestionIndex];
      const isSingleChoice = currentQuestion.answers.length === 1;
      if (isSingleChoice) {
        return { ...prev, [currentQuestionIndex]: [choice] };
      } else {
        if (isChecked) {
          return {
            ...prev,
            [currentQuestionIndex]: [...currentAnswers, choice],
          };
        } else {
          return {
            ...prev,
            [currentQuestionIndex]: currentAnswers.filter((a) => a !== choice),
          };
        }
      }
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCodeAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: value
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      if (questions[currentQuestionIndex].choices.length === 0) {
        const currentCode = codeAnswers[currentQuestionIndex] || '';
        if (currentCode) {
          setCodeAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: currentCode
          }));
        }
      }

      setCurrentQuestionIndex((prev) => prev + 1);

      const nextQuestion = questions[currentQuestionIndex + 1];
      if (nextQuestion.choices.length === 0) {
        const savedLanguage = localStorage.getItem('preferredCodeLanguage') || determineLanguage(nextQuestion.question);
        setCodeLanguage(savedLanguage);
      }

      setSpeechBubble({
        message: "Great! Let's move to the next question.",
        isVisible: true,
        autoHide: true,
        duration: 3000,
      });
      setCurrentEmotion("happy");
    } else {
      calculateScore();
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);

      const prevQuestion = questions[currentQuestionIndex - 1];
      if (prevQuestion.choices.length === 0) {
        const language = determineLanguage(prevQuestion.question);
        setCodeLanguage(language);
      }
    }
  };

  const calculateScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((question, index) => {
      if (question.choices.length > 0) {
        const userAnswers = selectedAnswers[index] || [];
        const correctAnswers = question.answers;

        const correctSelections = userAnswers.filter(answer =>
          correctAnswers.includes(answer)
        ).length;

        const incorrectSelections = userAnswers.filter(answer =>
          !correctAnswers.includes(answer)
        ).length;

        const questionPoints = Math.max(0, correctSelections - incorrectSelections);
        earnedPoints += questionPoints;
        totalPoints += correctAnswers.length;
      } else {
        const result = codeResults[index];
        if (result) {
          const testsPassed = result.results.filter(r => r.passed).length;
          const totalTests = result.results.length;

          earnedPoints += testsPassed;
          totalPoints += totalTests;
        } else {
          totalPoints += question.answers.length;
        }
      }
    });

    const finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    setScore(finalScore);

    if (finalScore >= 80) {
      setCurrentEmotion("excited");
      setSpeechBubble({
        message: `Excellent job! You scored ${finalScore.toFixed(1)}%! You can review your answers below.`,
        isVisible: true,
        autoHide: true,
        duration: 6000,
      });
    } else if (finalScore >= 60) {
      setCurrentEmotion("happy");
      setSpeechBubble({
        message: `Good work! You scored ${finalScore.toFixed(1)}%. Review your answers to see where you can improve!`,
        isVisible: true,
        autoHide: true,
        duration: 6000,
      });
    } else {
      setCurrentEmotion("worried");
      setSpeechBubble({
        message: `You scored ${finalScore.toFixed(1)}%. Don't worry! Review the solutions and try again.`,
        isVisible: true,
        autoHide: true,
        duration: 6000,
      });
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuestionHints({});
    setCodeResults({});

    const initialAnswers: { [key: number]: string[] } = {};
    const initialCodeAnswers: { [key: number]: string } = {};

    questions.forEach((question, index) => {
      initialAnswers[index] = [];

      if (question.choices.length === 0 && question.answers.length > 0) {
        const language = determineLanguage(question.question);
        initialCodeAnswers[index] = getDefaultCodeTemplate(language, question.question);
      }
    });

    setSelectedAnswers(initialAnswers);
    setCodeAnswers(initialCodeAnswers);
    setCurrentEmotion("neutral");
    setSpeechBubble({
      message:
        "Let's try again! You can do it! Remember, you can click for hints anytime.",
      isVisible: true,
      autoHide: true,
      duration: 4000,
    });

    if (questions.length > 0 && questions[0].choices.length === 0) {
      const language = determineLanguage(questions[0].question);
      setCodeLanguage(language);
    }
  };

  const handleSpeechComplete = () => {
    setTimeout(() => {
      setCurrentEmotion("neutral");
    }, 1000);
  };

  const handleExplanationRequest = (questionIndex: number) => {
    const question = questions[questionIndex];
    generateHint("explanation", "", question);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">No questions found for this quiz.</div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Quiz Results</h1>
          <div className="text-center mb-8">
            <div className="text-5xl font-bold mb-2">{score.toFixed(1)}%</div>
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Review Your Answers</h2>
            {questions.map((question, index) => {
              if (question.choices.length > 0) {
                const userAnswers = selectedAnswers[index] || [];
                const correctAnswers = question.answers;
                const isCorrect =
                  userAnswers.length === correctAnswers.length &&
                  userAnswers.every((answer) => correctAnswers.includes(answer));
                return (
                  <div
                    key={index}
                    className={`mb-6 p-4 rounded-lg ${
                      isCorrect
                        ? "bg-green-50 border-l-4 border-green-400"
                        : "bg-red-50 border-l-4 border-red-400"
                    }`}
                  >
                    <div className="font-medium mb-2">
                      Question {index + 1}: {question.question}
                    </div>
                    <div className="ml-4 mb-2">
                      <div className="font-medium">Your answer:</div>
                      {userAnswers.length > 0 ? (
                        <ul className="list-disc ml-5">
                          {userAnswers.map((answer, i) => (
                            <li
                              key={i}
                              className={
                                correctAnswers.includes(answer) ? "text-green-700" : "text-red-700"
                              }
                            >
                              {answer}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="italic text-gray-500">
                          No answer provided
                        </div>
                      )}
                    </div>
                    <div className="ml-4 mb-3">
                      <div className="font-medium">Correct answer:</div>
                      <ul className="list-disc ml-5">
                        {correctAnswers.map((answer, i) => (
                          <li key={i} className="text-green-700 font-medium">
                            {answer}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {!isCorrect && (
                      <div className="ml-4">
                        <button
                          onClick={() => handleExplanationRequest(index)}
                          disabled={isLoadingHint}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingHint
                            ? "Getting explanation..."
                            : "🧠 Get Teacher Explanation"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              } else {
                const result = codeResults[index];
                const hasResults = result && result.results && result.results.length > 0;
                const isCorrect = hasResults && result.isCorrect;

                return (
                  <div
                    key={index}
                    className={`mb-6 p-4 rounded-lg ${
                      isCorrect
                        ? "bg-green-50 border-l-4 border-green-400"
                        : "bg-red-50 border-l-4 border-red-400"
                    }`}
                  >
                    <div className="font-medium mb-2">
                      Question {index + 1}: {question.question}
                    </div>
                    <div className="ml-4 mb-2">
                      <div className="font-medium">Your code:</div>
                      <div className="bg-gray-800 text-white rounded-md p-3 text-sm overflow-x-auto">
                        <pre>{codeAnswers[index] || "No code submitted"}</pre>
                      </div>
                    </div>

                    {hasResults && (
                      <div className="ml-4 mb-3">
                        <div className="font-medium mt-3">Test Results:</div>
                        <div className="mt-2 space-y-3">
                          {result.results.map((testResult, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded-md ${testResult.passed ? "bg-green-100" : "bg-red-100"}`}
                            >
                              <div className="font-medium">Test Case {i + 1}:</div>
                              <div>Input: {JSON.stringify(testResult.inputs)}</div>
                              <div>Expected: {JSON.stringify(testResult.expectedOutput)}</div>
                              <div>Your Output: {JSON.stringify(testResult.output)}</div>
                              <div className={`font-bold ${testResult.passed ? "text-green-700" : "text-red-700"}`}>
                                {testResult.passed ? "✅ Passed" : "❌ Failed"}
                              </div>
                            </div>
                          ))}
                        </div>

                        {result.iterations.length > 0 && (
                          <div className="mt-4">
                            <div className="font-medium">Algorithm Performance:</div>
                            <div className="mt-2 h-64 bg-white p-2 rounded-md">
                              {chartData && (
                                <Line
                                  data={chartData}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                        title: {
                                          display: true,
                                          text: 'Number of Iterations'
                                        }
                                      },
                                      x: {
                                        title: {
                                          display: true,
                                          text: 'Input Size'
                                        }
                                      }
                                    },
                                    plugins: {
                                      title: {
                                        display: true,
                                        text: 'Algorithm Performance by Input Size'
                                      },
                                      legend: {
                                        position: 'top'
                                      }
                                    }
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!isCorrect && (
                      <div className="ml-4 mt-3">
                        <button
                          onClick={() => handleExplanationRequest(index)}
                          disabled={isLoadingHint}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingHint
                            ? "Getting explanation..."
                            : "🧠 Get Teacher Explanation"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={handleRestart}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Restart Quiz
            </button>
          </div>
        </div>
        {teacher && (
          <TeacherDisplay
            teacher={teacher}
            emotion={currentEmotion}
            position="bottom-right"
            size="large"
            speechBubble={speechBubble}
            onSpeechComplete={handleSpeechComplete}
          />
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCodingQuestion = currentQuestion.choices.length === 0;

  if (!isCodingQuestion) {
    const isSingleChoice = currentQuestion.answers.length === 1;
    const userSelectedAnswers = selectedAnswers[currentQuestionIndex] || [];

    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className="h-2 bg-gray-200 rounded-full flex-grow mx-4">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4">
              <h2 className="text-xl font-bold flex-grow">
                {currentQuestion.question}
              </h2>
              <button
                onClick={handleQuestionHint}
                disabled={isLoadingHint}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                title="Get a hint about this question"
              >
                {isLoadingHint ? "💭" : "💡 Hint"}
              </button>
            </div>
            {currentQuestion.question_images.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-4">
                {currentQuestion.question_images.map(
                  (img, index) =>
                    img && (
                      <div key={index} className="relative h-48 w-auto">
                        <Image
                          src={img}
                          alt={`Question image ${index + 1}`}
                          className="rounded-md"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    )
                )}
              </div>
            )}
            <div className="space-y-3 mt-6">
              {currentQuestion.choices.map((choice, index) => {
                const isSelected = userSelectedAnswers.includes(choice);
                const note = currentQuestion.notes[index];
                return (
                  <div key={index} className="flex items-start group">
                    <div className="flex items-center">
                      {isSingleChoice ? (
                        <input
                          type="radio"
                          id={`choice-${index}`}
                          name={`question-${currentQuestionIndex}`}
                          className="h-5 w-5 text-blue-600"
                          checked={isSelected}
                          onChange={() => handleAnswerChange(choice, true)}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          id={`choice-${index}`}
                          className="h-5 w-5 text-blue-600 rounded"
                          checked={isSelected}
                          onChange={(e) =>
                            handleAnswerChange(choice, e.target.checked)
                          }
                        />
                      )}
                    </div>
                    <div className="ml-3 flex-grow">
                      <div className="flex items-start gap-2">
                        <label
                          htmlFor={`choice-${index}`}
                          className="block text-gray-800 cursor-pointer flex-grow"
                        >
                          {choice}
                          {currentQuestion.choice_images[index] && (
                            <div className="mt-2 relative h-24 w-auto">
                              <Image
                                src={
                                  currentQuestion.choice_images[index] as string
                                }
                                alt={`Choice ${index + 1} image`}
                                className="rounded-md"
                                fill
                                style={{ objectFit: "contain" }}
                              />
                            </div>
                          )}
                        </label>
                        <button
                          onClick={() => handleChoiceHint(choice, index)}
                          disabled={isLoadingHint}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-xs font-medium opacity-0 group-hover:opacity-100 disabled:opacity-25 flex-shrink-0"
                          title="Get a hint about this choice"
                        >
                          💭
                        </button>
                      </div>
                      {note && (
                        <div className="mt-1 text-sm text-gray-500 italic">
                          {note}
                          {currentQuestion.note_images[index] && (
                            <div className="mt-2 relative h-20 w-auto">
                              <Image
                                src={currentQuestion.note_images[index] as string}
                                alt={`Note ${index + 1} image`}
                                className="rounded-md"
                                fill
                                style={{ objectFit: "contain" }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded-md ${
                currentQuestionIndex === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
              }`}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
        {teacher && (
          <TeacherDisplay
            teacher={teacher}
            emotion={currentEmotion}
            position="bottom-right"
            size="large"
            speechBubble={speechBubble}
            onSpeechComplete={handleSpeechComplete}
          />
        )}
      </div>
    );
  } else {
    const codeResult = codeResults[currentQuestionIndex];

    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className="h-2 bg-gray-200 rounded-full flex-grow mx-4">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4">
              <h2 className="text-xl font-bold flex-grow">
                {currentQuestion.question}
              </h2>
              <button
                onClick={handleQuestionHint}
                disabled={isLoadingHint || isAnalyzingCode}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                title="Get a hint about this question"
              >
                {isLoadingHint ? "💭" : "💡 Hint"}
              </button>
            </div>
            {currentQuestion.question_images.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-4">
                {currentQuestion.question_images.map(
                  (img, index) =>
                    img && (
                      <div key={index} className="relative h-48 w-auto">
                        <Image
                          src={img}
                          alt={`Question image ${index + 1}`}
                          className="rounded-md"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    )
                )}
              </div>
            )}

            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-gray-700">Write your code solution:</div>
                <div className="flex items-center gap-2">
                  <select
                    value={codeLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="csharp">C#</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>

                  <button
                    onClick={analyzeCode}
                    disabled={isAnalyzingCode || isRunningCode}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Get feedback on your code"
                  >
                    {isAnalyzingCode ? "Analyzing..." : "🔍 Analyze Code"}
                  </button>

                  <button
                    onClick={runCode}
                    disabled={isRunningCode || isAnalyzingCode}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunningCode ? "Running..." : "▶ Run Code"}
                  </button>
                </div>
              </div>
              <div className="h-80 border rounded-md overflow-hidden">
                <Editor
                  height="100%"
                  language={codeLanguage}
                  value={codeAnswers[currentQuestionIndex] || ''}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on"
                  }}
                />
              </div>
            </div>

            {codeResult && (
              <div className="mt-4">
                <div className="font-medium text-gray-700 mb-2">Test Results:</div>
                <div className="space-y-2">
                  {codeResult.results.map((result, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-md ${result.passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          Test Case {i + 1}: {result.passed ? "✅ Passed" : "❌ Failed"}
                        </div>
                      </div>
                      <div className="mt-1 text-sm">
                        <div>Input: {JSON.stringify(result.inputs)}</div>
                        <div>Expected: {JSON.stringify(result.expectedOutput)}</div>
                        <div>Your Output: {JSON.stringify(result.output)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {codeResult.iterations.length > 1 && chartData && (
                  <div className="mt-4">
                    <div className="font-medium text-gray-700 mb-2">Algorithm Performance:</div>
                    <div className="h-64 bg-white p-3 rounded-md border">
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Number of Iterations'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Input Size'
                              }
                            }
                          },
                          plugins: {
                            title: {
                              display: true,
                              text: 'Algorithm Performance by Input Size'
                            },
                            legend: {
                              position: 'top'
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded-md ${
                currentQuestionIndex === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
              }`}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
        {teacher && (
          <TeacherDisplay
            teacher={teacher}
            emotion={currentEmotion}
            position="bottom-right"
            size="large"
            speechBubble={speechBubble}
            onSpeechComplete={handleSpeechComplete}
          />
        )}
      </div>
    );
  }
}
