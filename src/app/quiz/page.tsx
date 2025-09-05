"use client";
import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface QuizData {
  [path: string]: string[];
}

interface TreeNode {
  type: "file" | "folder";
  children: { [key: string]: TreeNode };
  fullPath: string;
  originalPath?: string;
}

interface FileTree {
  [key: string]: TreeNode;
}

type TabType = "normal" | "sample";

const QuizNavigation: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("normal");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    // Set active tab based on query parameters
    const tab = searchParams.get("tab");
    if (tab === "sample") {
      setActiveTab("sample");
    } else {
      setActiveTab("normal");
    }

    // Fetch quiz data
    fetchQuizData();
  }, [searchParams]);

  const fetchQuizData = async (): Promise<void> => {
    try {
      const response = await fetch("/api/quiz");
      const data: QuizData = await response.json();
      setQuizData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch quiz data:", error);
      setLoading(false);
    }
  };

  const toggleFolder = (path: string): void => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const navigateToQuiz = (quizPath: string): void => {
    router.push(`/quiz/${encodeURIComponent(quizPath)}`);
  };

  const buildFileTree = (data: QuizData, isNormalTab: boolean): FileTree => {
    const tree: FileTree = {};

    // Get all paths that match the current tab
    const filteredPaths = Object.keys(data).filter((path: string) => {
      if (!path) return false;
      const isNormalQuiz = !path.includes("samples");
      return (isNormalTab && isNormalQuiz) || (!isNormalTab && !isNormalQuiz);
    });

    // Build the tree structure
    filteredPaths.forEach((path: string) => {
      if (!path) return;

      const parts = path.split("/").filter((part) => part.length > 0);
      let currentLevel: { [key: string]: TreeNode } = tree;

      parts.forEach((part: string, index: number) => {
        const currentPath = parts.slice(0, index + 1).join("/");

        if (!currentLevel[part]) {
          currentLevel[part] = {
            type: "folder", // Start as folder, will change if it has quiz files
            children: {},
            fullPath: currentPath,
            originalPath: path,
          };
        }

        currentLevel = currentLevel[part].children;
      });
    });

    return tree;
  };

  const getDirectChildrenCount = (
    data: QuizData,
    path: string,
    isNormalTab: boolean
  ): number => {
    const filteredPaths = Object.keys(data).filter((p: string) => {
      if (!p) return false;
      const isNormalQuiz = !p.includes("samples");
      const matchesTab =
        (isNormalTab && isNormalQuiz) || (!isNormalTab && !isNormalQuiz);
      return matchesTab && p.startsWith(path + "/") && p !== path;
    });

    const directChildren = new Set<string>();
    filteredPaths.forEach((p: string) => {
      const relativePath = p.substring(path.length + 1);
      const firstPart = relativePath.split("/")[0];
      directChildren.add(firstPart);
    });

    return directChildren.size;
  };

  const getQuestionCount = (data: QuizData, path: string): number => {
    return data[path]?.length || 0;
  };

  const renderFileTree = (
    tree: FileTree,
    depth: number = 0
  ): React.ReactNode[] => {
    return Object.entries(tree)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, node]: [string, TreeNode]) => {
        const isExpanded: boolean = expandedFolders.has(node.fullPath);
        const hasChildren: boolean = Object.keys(node.children).length > 0;
        const indent: number = depth * 24;

        const childrenCount = getDirectChildrenCount(
          quizData!,
          node.fullPath,
          activeTab === "normal"
        );
        const questionCount = getQuestionCount(quizData!, node.fullPath);

        return (
          <div key={node.fullPath} className="select-none">
            <div
              className="flex items-center py-3 transition-colors duration-150"
              style={{ marginLeft: `${indent}px` }}
            >
              {/* Expand/Collapse button - larger click area */}
              <div
                className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded cursor-pointer mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasChildren) toggleFolder(node.fullPath);
                }}
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )
                ) : (
                  <div className="w-4 h-4" />
                )}
              </div>

              {/* Folder icon and content - clickable for navigation */}
              <div
                className="flex items-center flex-1 px-3 py-2 hover:bg-blue-50 rounded-md cursor-pointer transition-colors duration-150"
                onClick={() =>
                  navigateToQuiz(node.originalPath || node.fullPath)
                }
              >
                <Folder className="w-4 h-4 text-yellow-500 mr-3" />
                <span className="text-gray-700 font-medium mr-2">{name}</span>
                <span className="text-sm text-gray-500">
                  ({childrenCount} {childrenCount === 1 ? "topic" : "topics"}
                  {questionCount > 0 ? `, ${questionCount} questions` : ""})
                </span>
              </div>
            </div>

            {hasChildren && isExpanded && (
              <div>{renderFileTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      });
  };

  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Failed to load quiz data</p>
        </div>
      </div>
    );
  }

  // Count quizzes for each tab
  const normalQuizzes: string[] = Object.keys(quizData).filter(
    (path: string) => path && !path.includes("samples")
  );
  const sampleQuizzes: string[] = Object.keys(quizData).filter(
    (path: string) => path && path.includes("samples")
  );

  // Build trees
  const normalTree: FileTree = buildFileTree(quizData, true);
  const sampleTree: FileTree = buildFileTree(quizData, false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz Navigator
          </h1>
          <p className="text-gray-600">
            Browse and select quizzes from the available categories
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => handleTabChange("normal")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-150 ${
                  activeTab === "normal"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Interview Kickstart ({normalQuizzes.length} paths)
              </button>
              <button
                onClick={() => handleTabChange("sample")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-150 ${
                  activeTab === "sample"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Sample Quizzes ({sampleQuizzes.length} paths)
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "normal" && (
              <div className="space-y-1">
                {Object.keys(normalTree).length > 0 ? (
                  renderFileTree(normalTree)
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No normal quizzes available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sample" && (
              <div className="space-y-1">
                {Object.keys(sampleTree).length > 0 ? (
                  renderFileTree(sampleTree)
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No sample quizzes available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Quiz Paths
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {normalQuizzes.length + sampleQuizzes.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Folder className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    new Set(
                      [...normalQuizzes, ...sampleQuizzes]
                        .filter((path) => path)
                        .map((path: string) => path.split("/")[0])
                    ).size
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizNavigation;
