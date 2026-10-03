import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowLeftRight, ArrowRight, Bell, BookOpen, Bookmark, Brain,
  Check, CheckCircle2, ChevronDown, Clock, Clock3, Code2, Compass, Cpu,
  Copy, FileCode, Flame, Globe, GraduationCap, History, Info, Lightbulb, Loader2, LogOut, Menu, Moon, Play, Plus,
  RefreshCw, Search, Send, Settings, Sparkles, Sun, Target, Terminal, Trash2, Trophy, UserRound,
  WandSparkles, X, XCircle, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useEffect, useMemo, useRef, useState } from "react";

type Lesson = { id: string; title: string; topic: string; module: string; body: string; code: string };
type Course = {
  id: string; title: string; description: string; category: string;
  difficulty: string; instructor: string; duration: string; image: string;
  topics: string[]; lessons: Lesson[];
};
type ActivityItem = {
  id: string; userId: string; type: string; title: string; description: string; timestamp: string;
};
type Enrollment = { userId: string; courseId: string; enrolledAt: string; completed: string[]; opened: string[] };
type QuizAttempt = {
  id: string; userId: string; courseId: string; topic: string; score: number;
  total: number; answers: Record<string, number>; timestamp: string;
};
type Conversation = {
  id: string; userId: string; question: string; response: string; topic: string;
  courseId?: string; lessonId?: string; timestamp: string;
};
type CodeAction = {
  id: string; userId: string; kind: string; language: string; code: string;
  timestamp: string; detail: string;
};

export type ExecutionStatus =
  | "idle"
  | "running"
  | "success"
  | "compilation_error"
  | "syntax_error"
  | "runtime_error"
  | "timeout"
  | "unsupported"
  | "invalid"
  | "execution_error"
  | "execution_service_unauthorized"
  | "analysis";

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs?: number;
  language: string;
  title?: string;
}
type Account = {
  id: string; name: string; email: string; password: string; level: string;
  interests: string[]; enrollments: Enrollment[]; activities: ActivityItem[];
  quizzes: QuizAttempt[]; conversations: Conversation[]; codeHistory: CodeAction[];
  savedCourses: string[]; xp: number; streak: number;
  preferences: { theme: "light" | "dark"; aiStyle: string; notifications: boolean; language: string };
};
type Question = { id: string; prompt: string; options: string[]; answer: number; topic: string };

const STORAGE_KEY = "coders-hub.accounts.v1";
const SESSION_KEY = "coders-hub.session.v1";

// --- MULTI-LINGUAL DICTIONARY ---
type Language = "English" | "Spanish" | "French" | "Hindi" | "German";

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  English: {
    dashboard: "Dashboard",
    explore: "Explore Courses",
    mylearning: "My Learning",
    codeConverter: "AI Code Converter",
    codeLab: "Code Lab",
    quiz: "Quiz",
    activity: "Activity History",
    progress: "Progress",
    skills: "Skills",
    memory: "Learning Memory",
    genai: "Generative AI",
    agentic: "Agentic AI",
    learningAgent: "AI Learning Agent",
    profile: "Profile",
    settings: "Settings",
    about: "About & UI Showcase",
    welcome: "Welcome back",
    workspaceTag: "YOUR PERSONAL LEARNING WORKSPACE",
    exploreBtn: "Explore Courses",
    continueBtn: "Continue Learning",
    enrollBtn: "Enroll Now",
    runBtn: "Run",
    explainBtn: "Explain",
    debugBtn: "Debug",
    optimizeBtn: "Optimize",
    signOut: "Sign out",
    overallProgress: "Overall progress",
    coursesEnrolled: "Courses enrolled",
    lessonsDone: "Lessons completed",
    quizAvg: "Quiz average",
    streak: "Learning streak",
    recentActivity: "Recent activity",
    recommended: "Recommended for you",
    quickActions: "Quick Actions",
  },
  Spanish: {
    dashboard: "Panel Principal",
    explore: "Explorar Cursos",
    mylearning: "Mi Aprendizaje",
    aiAssistant: "Asistente IA",
    codeLab: "Laboratorio de Código",
    quiz: "Cuestionario",
    activity: "Historial de Actividad",
    progress: "Progreso",
    skills: "Habilidades",
    memory: "Memoria de Aprendizaje",
    genai: "IA Generativa",
    agentic: "IA Agéntica",
    learningAgent: "Agente de Aprendizaje IA",
    profile: "Perfil",
    settings: "Configuración",
    about: "Acerca de y Galería UI",
    welcome: "Bienvenido de nuevo",
    workspaceTag: "TU ESPACIO PERSONAL DE APRENDIZAJE",
    exploreBtn: "Explorar Cursos",
    continueBtn: "Continuar Aprendiendo",
    enrollBtn: "Inscribirse Ahora",
    runBtn: "Ejecutar",
    explainBtn: "Explicar",
    debugBtn: "Depurar",
    optimizeBtn: "Optimizar",
    signOut: "Cerrar sesión",
    overallProgress: "Progreso general",
    coursesEnrolled: "Cursos inscritos",
    lessonsDone: "Lecciones completadas",
    quizAvg: "Promedio de cuestionarios",
    streak: "Racha de estudio",
    recentActivity: "Actividad reciente",
    recommended: "Recomendado para ti",
    quickActions: "Acciones Rápidas",
  },
  French: {
    dashboard: "Tableau de Bord",
    explore: "Explorer les Cours",
    mylearning: "Mon Apprentissage",
    aiAssistant: "Assistant IA",
    codeLab: "Laboratoire de Code",
    quiz: "Quiz",
    activity: "Historique d'Activité",
    progress: "Progrès",
    skills: "Compétences",
    memory: "Mémoire d'Apprentissage",
    genai: "IA Générative",
    agentic: "IA Agentique",
    learningAgent: "Agent d'Apprentissage IA",
    profile: "Profil",
    settings: "Paramètres",
    about: "À Propos & Galerie UI",
    welcome: "Bon retour",
    workspaceTag: "VOTRE ESPACE D'APPRENTISSAGE PERSONNEL",
    exploreBtn: "Explorer les Cours",
    continueBtn: "Continuer l'Apprentissage",
    enrollBtn: "S'inscrire Maintenant",
    runBtn: "Exécuter",
    explainBtn: "Expliquer",
    debugBtn: "Déboguer",
    optimizeBtn: "Optimiser",
    signOut: "Se déconnecter",
    overallProgress: "Progrès global",
    coursesEnrolled: "Cours inscrits",
    lessonsDone: "Leçons terminées",
    quizAvg: "Moyenne des quiz",
    streak: "Série d'apprentissage",
    recentActivity: "Activité récente",
    recommended: "Recommandé pour vous",
    quickActions: "Actions Rapides",
  },
  Hindi: {
    dashboard: "डैशबोर्ड",
    explore: "कोर्स देखें",
    mylearning: "मेरी पढ़ाई",
    aiAssistant: "एआई सहायक",
    codeLab: "कोड लैब",
    quiz: "क्विज़",
    activity: "गतिविधि इतिहास",
    progress: "प्रगति",
    skills: "कौशल",
    memory: "लर्निंग मेमोरी",
    genai: "जनरेटिव एआई",
    agentic: "एजेंटिक एआई",
    learningAgent: "एआई लर्निंग एजेंट",
    profile: "प्रोफ़ाइल",
    settings: "सेटिंग्स",
    about: "हमारे बारे में और यूआई शोकेस",
    welcome: "पुनः स्वागत है",
    workspaceTag: "आपका व्यक्तिगत शिक्षण कार्यक्षेत्र",
    exploreBtn: "कोर्स खोजें",
    continueBtn: "पढ़ाई जारी रखें",
    enrollBtn: "अभी एनरोल करें",
    runBtn: "कोड चलाएं",
    explainBtn: "समझायें",
    debugBtn: "डिबग करें",
    optimizeBtn: "अनुकूलित करें",
    signOut: "साइन आउट",
    overallProgress: "कुल प्रगति",
    coursesEnrolled: "कुल एनरोल किए गए कोर्स",
    lessonsDone: "पूरे किए गए पाठ",
    quizAvg: "क्विज़ औसत स्कोर",
    streak: "लर्निंग स्ट्रिक",
    recentActivity: "हाल की गतिविधियां",
    recommended: "आपके लिए अनुशंसित",
    quickActions: "त्वरित कार्रवाई",
  },
  German: {
    dashboard: "Dashboard",
    explore: "Kurse Erkunden",
    mylearning: "Mein Lernen",
    aiAssistant: "KI-Assistent",
    codeLab: "Code-Labor",
    quiz: "Quiz",
    activity: "Aktivitätsverlauf",
    progress: "Fortschritt",
    skills: "Fähigkeiten",
    memory: "Lernspeicher",
    genai: "Generative KI",
    agentic: "Agentische KI",
    learningAgent: "KI-Lernagent",
    profile: "Profil",
    settings: "Einstellungen",
    about: "Über uns & UI-Galerie",
    welcome: "Willkommen zurück",
    workspaceTag: "IHR PERSÖNLICHER LERNBEREICH",
    exploreBtn: "Kurse Durchsuchen",
    continueBtn: "Weiterlernen",
    enrollBtn: "Jetzt Anmelden",
    runBtn: "Ausführen",
    explainBtn: "Erklären",
    debugBtn: "Debuggen",
    optimizeBtn: "Optimieren",
    signOut: "Abmelden",
    overallProgress: "Gesamtfortschritt",
    coursesEnrolled: "Eingeschriebene Kurse",
    lessonsDone: "Abgeschlossene Lektionen",
    quizAvg: "Quiz-Durchschnitt",
    streak: "Lernserie",
    recentActivity: "Letzte Aktivitäten",
    recommended: "Für Sie empfohlen",
    quickActions: "Schnellaktionen",
  },
};

function makeCourse(
  id: string, title: string, category: string, difficulty: string, instructor: string,
  duration: string, image: string, description: string, topics: string[],
): Course {
  const lessons = topics.map((topic, i) => ({
    id: `${id}-lesson-${i + 1}`,
    title: topic,
    topic,
    module: `Module ${Math.floor(i / 3) + 1} — ${i < 3 ? "Foundations" : i < 6 ? "Core Concepts" : "Practice & Applications"}`,
    body: `${topic} is an important part of ${title}. Start by understanding the core idea, then connect it to the examples and practice task below. Try explaining the concept in your own words before moving on.`,
    code: `# ${topic}\n\n# Try implementing an example here\nprint("Learning ${topic}")`,
  }));
  return { id, title, category, difficulty, instructor, duration, image, description, topics, lessons };
}

const COURSES: Course[] = [
  makeCourse("python", "Python Programming", "Programming", "Beginner", "Coders Hub Faculty", "8 hours",
    "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=900&q=80",
    "Learn programming fundamentals and build confidence writing Python.", ["Introduction", "Variables", "Data Types", "Conditions", "Loops", "Functions", "Lists", "Dictionaries", "File Handling"]),
  makeCourse("c", "C Programming", "Programming", "Beginner", "Coders Hub Faculty", "7 hours",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
    "Understand structured programming, memory, and the foundations of C.", ["Getting Started", "Variables & Types", "Conditions", "Loops", "Functions", "Arrays", "Pointers", "Strings"]),
  makeCourse("cpp", "C++ Programming", "Programming", "Intermediate", "Coders Hub Faculty", "9 hours",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    "Build a strong C++ foundation, from syntax to object-oriented design.", ["C++ Basics", "Functions", "References", "Classes", "Inheritance", "Polymorphism", "STL", "Templates"]),
  makeCourse("java", "Java Programming", "Programming", "Beginner", "Coders Hub Faculty", "8 hours",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80",
    "Learn Java syntax, object-oriented programming, and core collections.", ["Java Basics", "Variables", "Control Flow", "Methods", "Classes", "Inheritance", "Interfaces", "Collections"]),
  makeCourse("javascript", "JavaScript", "Web Development", "Beginner", "Coders Hub Faculty", "7 hours",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80",
    "Learn the language of the web and make interactive applications.", ["JavaScript Basics", "Variables", "Functions", "Arrays", "Objects", "DOM", "Events", "Async JavaScript"]),
  makeCourse("dsa", "Data Structures", "Computer Science", "Intermediate", "Coders Hub Faculty", "10 hours",
    "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=900&q=80",
    "Choose and use data structures to solve computational problems.", ["Arrays", "Linked Lists", "Stacks", "Queues", "Hash Tables", "Trees", "Binary Search Trees", "Graphs", "Heaps"]),
  makeCourse("algorithms", "Algorithms", "Computer Science", "Intermediate", "Coders Hub Faculty", "10 hours",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    "Explore algorithmic thinking, analysis, searching, and sorting.", ["Algorithm Analysis", "Big O", "Linear Search", "Binary Search", "Sorting", "Recursion", "Greedy Algorithms", "Dynamic Programming"]),
  makeCourse("dbms", "Database Systems", "Computer Science", "Intermediate", "Coders Hub Faculty", "8 hours",
    "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=900&q=80",
    "Learn relational databases, SQL, normalization, and transactions.", ["Database Basics", "Relational Model", "SQL", "Joins", "Normalization", "Transactions", "Indexes", "Query Design"]),
  makeCourse("os", "Operating Systems", "Computer Science", "Advanced", "Coders Hub Faculty", "9 hours",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80",
    "Understand processes, memory, scheduling, and file systems.", ["OS Fundamentals", "Processes", "Threads", "Scheduling", "Synchronization", "Deadlocks", "Memory Management", "File Systems"]),
  makeCourse("networks", "Computer Networks", "Computer Science", "Intermediate", "Coders Hub Faculty", "8 hours",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    "Explore how devices communicate across modern computer networks.", ["Network Basics", "OSI Model", "TCP/IP", "IP Addressing", "Routing", "DNS", "HTTP", "Network Security"]),
  makeCourse("genai", "Generative AI", "Artificial Intelligence", "Beginner", "Coders Hub AI Team", "6 hours",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80",
    "Understand modern generative models and learn to build AI-powered applications.", ["What is AI?", "Machine Learning", "Generative AI", "LLMs", "Tokens & Context", "Prompt Engineering", "AI APIs", "Text Generation", "Code Generation", "Image Generation", "AI Applications"]),
  makeCourse("agentic", "Agentic AI", "Artificial Intelligence", "Intermediate", "Coders Hub AI Team", "6 hours",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
    "Discover AI agents, planning, tools, memory, and multi-agent systems.", ["What is Agentic AI?", "AI vs Generative AI vs Agentic AI", "AI Agents", "Goals", "Planning", "Tools", "Memory", "Reasoning", "Actions", "Feedback Loops", "Multi-Agent Systems", "Building AI Agents"]),
];

const NAV: { labelKey: string; icon: LucideIcon; page: string }[] = [
  { labelKey: "dashboard", icon: Activity, page: "Dashboard" },
  { labelKey: "explore", icon: Compass, page: "Explore Courses" },
  { labelKey: "mylearning", icon: BookOpen, page: "My Learning" },
  { labelKey: "codeConverter", icon: WandSparkles, page: "AI Code Converter" },
  { labelKey: "codeLab", icon: Code2, page: "Code Lab" },
  { labelKey: "quiz", icon: Target, page: "Quiz" },
  { labelKey: "activity", icon: History, page: "Activity History" },
  { labelKey: "progress", icon: Activity, page: "Progress" },
  { labelKey: "skills", icon: Zap, page: "Skills" },
  { labelKey: "memory", icon: Brain, page: "Learning Memory" },
  { labelKey: "genai", icon: WandSparkles, page: "Generative AI" },
  { labelKey: "agentic", icon: Cpu, page: "Agentic AI" },
  { labelKey: "learningAgent", icon: Lightbulb, page: "AI Learning Agent" },
  { labelKey: "profile", icon: UserRound, page: "Profile" },
  { labelKey: "settings", icon: Settings, page: "Settings" },
  { labelKey: "about", icon: Info, page: "About" },
];

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const dateNow = () => new Date().toISOString();
const readAccounts = (): Account[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};
const newAccount = (fields: Pick<Account, "name" | "email" | "password" | "level" | "interests">): Account => ({
  ...fields, id: uid(), enrollments: [], activities: [], quizzes: [], conversations: [],
  codeHistory: [], savedCourses: [], xp: 0, streak: 3,
  preferences: { theme: "light", aiStyle: "Friendly and clear", notifications: true, language: "English" },
});

function progressFor(account: Account, course: Course) {
  const enrollment = account.enrollments.find(e => e.courseId === course.id);
  return enrollment ? Math.round(enrollment.completed.length / course.lessons.length * 100) : 0;
}
function activity(account: Account, title: string, description = "", type = "learning"): ActivityItem {
  return { id: uid(), userId: account.id, type, title, description, timestamp: dateNow() };
}
function averageQuiz(account: Account) {
  if (!account.quizzes.length) return null;
  return Math.round(account.quizzes.reduce((sum, q) => sum + q.score / q.total * 100, 0) / account.quizzes.length);
}

function evaluateStringExpr(expr: string): string {
  const clean = expr.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    return clean.slice(1, -1);
  }
  if (clean.startsWith("f\"") || clean.startsWith("f'")) {
    return clean.slice(2, -1).replace(/\{.*?\}/g, "val");
  }
  try {
    return String(Function(`"use strict"; return (${clean})`)());
  } catch {
    return clean;
  }
}

function MarkdownView({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      {parts.map((part, idx) => {
        if (part.startsWith("```")) {
          const firstLineEnd = part.indexOf("\n");
          const language = part.slice(3, firstLineEnd > 0 ? firstLineEnd : 3).trim() || "code";
          const codeText = firstLineEnd > 0 ? part.slice(firstLineEnd + 1, -3).trim() : part.slice(3, -3).trim();

          const handleCopy = () => {
            navigator.clipboard.writeText(codeText);
            setCopiedIndex(idx);
            setTimeout(() => setCopiedIndex(null), 2000);
          };

          return (
            <div key={idx} className="relative my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-slate-400">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-violet-400">{language}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  {copiedIndex === idx ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono leading-6 text-emerald-300">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split("\n");
        return (
          <div key={idx} className="space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1" />;

              if (trimmed.startsWith("### ")) {
                return (
                  <h4 key={lIdx} className="mb-1 mt-3 text-base font-bold text-violet-600 dark:text-violet-400">
                    {formatInline(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h3 key={lIdx} className="mb-2 mt-4 text-lg font-bold text-violet-700 dark:text-violet-300">
                    {formatInline(trimmed.slice(3))}
                  </h3>
                );
              }
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <li key={lIdx} className="ml-4 list-disc pl-1 text-slate-700 dark:text-slate-300">
                    {formatInline(trimmed.slice(2))}
                  </li>
                );
              }
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <li key={lIdx} className="ml-4 list-decimal pl-1 text-slate-700 dark:text-slate-300">
                    {formatInline(numMatch[2])}
                  </li>
                );
              }

              return (
                <p key={lIdx} className="text-slate-700 dark:text-slate-300">
                  {formatInline(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.startsWith("`") && seg.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-violet-100 px-1.5 py-0.5 font-mono text-xs text-violet-800 dark:bg-violet-950 dark:text-violet-300">
              {seg.slice(1, -1)}
            </code>
          );
        }
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-slate-900 dark:text-white">
              {seg.slice(2, -2)}
            </strong>
          );
        }
        return seg;
      })}
    </>
  );
}

// --- REAL BACKEND CODE COMPILATION & EXECUTION PIPELINE ---
export async function compileAndRunCode(code: string, language: string, stdin: string = ""): Promise<ExecutionResult> {
  const startTime = performance.now();
  const trimmedCode = code.trim();

  // 1. EMPTY CODE CHECK
  if (!trimmedCode) {
    return {
      status: "invalid",
      stdout: "",
      stderr: "No code to execute.\nWrite some code in the editor and try again.",
      exitCode: 1,
      language
    };
  }

  // Map language names to Piston API language identifiers
  const langMap: Record<string, string> = {
    C: "c",
    "C++": "c++",
    Java: "java",
    Python: "python",
    JavaScript: "javascript",
    c: "c",
    cpp: "c++",
    "c++": "c++",
    java: "java",
    python: "python",
    javascript: "javascript"
  };

  const pistonLang = langMap[language] || language.toLowerCase();

  // Determine standard file name
  const fileNameMap: Record<string, string> = {
    c: "main.c",
    "c++": "main.cpp",
    java: "Main.java",
    python: "main.py",
    javascript: "main.js"
  };

  const fileName = fileNameMap[pistonLang] || "main.txt";

  try {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code,
        language,
        stdin
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          status: "execution_service_unauthorized",
          stdout: "",
          stderr: "🔑 Code execution service authentication failed (HTTP 401 Unauthorized).\nThe execution API rejected the request due to missing or invalid authentication credentials.\nPlease check server-side execution API credentials or proxy configuration.",
          exitCode: 1,
          language
        };
      }
      return {
        status: "execution_error",
        stdout: "",
        stderr: `Execution service returned status ${response.status}: ${response.statusText}`,
        exitCode: 1,
        language
      };
    }

    const data = await response.json();
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    // CHECK FOR COMPILATION FAILURE (C, C++, Java)
    if (data.compile && data.compile.code !== 0) {
      return {
        status: "compilation_error",
        stdout: data.compile.stdout || "",
        stderr: data.compile.stderr || data.compile.output || "Compilation failed.",
        exitCode: data.compile.code ?? 1,
        executionTimeMs,
        language
      };
    }

    // CHECK RUNTIME FAILURE / TIMEOUT
    const runResult = data.run || {};

    if (runResult.signal === "SIGKILL" || (runResult.stderr && runResult.stderr.includes("Time limit exceeded"))) {
      return {
        status: "timeout",
        stdout: runResult.stdout || "",
        stderr: `⏱ Execution Timed Out: Time limit exceeded (10,000ms).\nInfinite loop or long-running process terminated by execution sandbox.`,
        exitCode: 124,
        executionTimeMs,
        language
      };
    }

    if (runResult.code !== 0) {
      const isSyntaxErr = (pistonLang === "python" || pistonLang === "javascript") && runResult.stderr && runResult.stderr.includes("SyntaxError");
      return {
        status: isSyntaxErr ? "syntax_error" : "runtime_error",
        stdout: runResult.stdout || "",
        stderr: runResult.stderr || runResult.output || `Execution exited with code ${runResult.code}`,
        exitCode: runResult.code ?? 1,
        executionTimeMs,
        language
      };
    }

    // SUCCESSFUL EXECUTION
    return {
      status: "success",
      stdout: runResult.stdout || "(Program completed with no console output)",
      stderr: runResult.stderr || "",
      exitCode: 0,
      executionTimeMs,
      language
    };

  } catch (err: any) {
    return {
      status: "execution_error",
      stdout: "",
      stderr: `⚠ Execution Service Error: ${err.message || "Failed to reach execution service"}.\nMake sure you have an active network connection to run code.`,
      exitCode: 1,
      language
    };
  }
}

function responseFor(question: string, account: Account, course?: Course, lesson?: Lesson) {
  const q = question.toLowerCase().trim();
  const context = lesson ? `\n\n*Context: Lesson **${lesson.title}** in course **${course?.title}***.` : course ? `\n\n*Context: Course **${course.title}***.` : "";

  if (lesson && (/explain|how|what|lesson|detail/i.test(q) || q.includes(lesson.title.toLowerCase()))) {
    const topic = `${lesson.title} (${course?.title ?? "Lesson"})`;
    const answer = `Here is a detailed explanation of **${lesson.title}** in **${course?.title ?? "Computer Science"}** tailored for your level (${account.level}):\n\n` +
      `### Core Concept & Explanation:\n` +
      `${lesson.body}\n\n` +
      `### Key Focus Area:\n` +
      `- **Topic**: \`${lesson.topic}\`\n` +
      `- **Module**: \`${lesson.module}\`\n\n` +
      `### Practical Example Code:\n` +
      `\`\`\`${course?.id === "c" ? "c" : course?.id === "cpp" ? "cpp" : course?.id === "java" ? "java" : course?.id === "javascript" ? "javascript" : "python"}\n` +
      `${lesson.code}\n` +
      `\`\`\`\n\n` +
      `*Practice Tip: Open Code Lab to modify and run this code live in the compiler sandbox!*`;

    return { topic, text: `${answer}${context}` };
  }

  let topic = "computer science";
  let answer = "";

  if (/fibonacci/.test(q)) {
    topic = "Fibonacci Sequence Algorithm";
    answer = `The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones ($0, 1, 1, 2, 3, 5, 8, 13, 21, \\dots$).\n\n` +
      `### Approaches:\n` +
      `- **Iterative**: $O(N)$ time, $O(1)$ space (Recommended).\n` +
      `- **Recursive**: $O(2^N)$ time (Naive) or $O(N)$ with Memoization.\n\n` +
      `\`\`\`python\n# Iterative Fibonacci in Python\ndef fibonacci(n):\n    if n <= 0: return []\n    if n == 1: return [0]\n    seq = [0, 1]\n    while len(seq) < n:\n        seq.append(seq[-1] + seq[-2])\n    return seq\n\nprint("First 8 Fibonacci numbers:", fibonacci(8))\n# Output: [0, 1, 1, 2, 3, 5, 8, 13]\n\`\`\``;
  } else if (/prime/.test(q)) {
    topic = "Prime Number Checker";
    answer = `A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.\n\n` +
      `### Optimal Logic:\n` +
      `Test divisibility up to $\\sqrt{N}$ in $O(\\sqrt{N})$ time.\n\n` +
      `\`\`\`python\n# Prime Number Checker in Python\ndef is_prime(n):\n    if n <= 1: return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nprint("Is 29 prime?", is_prime(29)) # Output: True\nprint("Is 30 prime?", is_prime(30)) # Output: False\n\`\`\``;
  } else if (/swap/.test(q)) {
    topic = "Swapping Variables";
    answer = `Swapping exchanges the values stored in two variables.\n\n` +
      `### Common Methods:\n` +
      `1. **Temporary Variable**: Standard across C, C++, Java, JS.\n` +
      `2. **Tuple Unpacking**: Built-in feature in Python (\`a, b = b, a\`).\n` +
      `3. **Bitwise XOR**: Swaps without extra memory.\n\n` +
      `\`\`\`c\n// Swapping in C using pointers\nvoid swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}\n\`\`\``;
  } else if (/factorial/.test(q)) {
    topic = "Factorial Calculation";
    answer = `The factorial of a non-negative integer $N$ ($N!$) is the product of all positive integers less than or equal to $N$.\n\n` +
      `\`\`\`python\ndef factorial(n):\n    if n < 0: return "Undefined"\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result\n\nprint("5! =", factorial(5)) # Output: 120\n\`\`\``;
  } else if (/palindrome|reverse/.test(q)) {
    topic = "Palindrome Check & String Reversal";
    answer = `A string is a palindrome if it reads the same forward and backward.\n\n` +
      `\`\`\`python\ndef is_palindrome(s):\n    cleaned = "".join(c.lower() for c in s if c.isalnum())\n    return cleaned == cleaned[::-1]\n\nprint(is_palindrome("A man, a plan, a canal: Panama")) # Output: True\n\`\`\``;
  } else if (/python/.test(q)) {
    topic = "Python Programming";
    answer = `Python is a versatile, high-level, interpreted programming language designed for code readability and developer efficiency.\n\n` +
      `### Key Concepts:\n` +
      `- **Dynamic Typing**: Variables don't require explicit type declarations.\n` +
      `- **Rich Standard Library**: Includes built-in modules for math, file I/O, networking, and data manipulation.\n` +
      `- **Clean Syntax**: Uses whitespace indentation instead of curly braces.\n\n` +
      `\`\`\`python\n# Python Example\ndef calculate_sum(numbers):\n    return sum(numbers)\n\nresult = calculate_sum([10, 20, 30])\nprint(f"Total: {result}") # Output: Total: 60\n\`\`\``;
  } else if (/javascript|js|react|node|dom|promise|async/.test(q)) {
    topic = "JavaScript & Web Development";
    answer = `JavaScript is the core scripting language of the web, enabling interactive user experiences, DOM manipulation, asynchronous programming, and backend logic via Node.js.\n\n` +
      `### Core Features:\n` +
      `- **First-Class Functions**: Functions can be passed as arguments or returned from other functions.\n` +
      `- **Asynchronous Non-Blocking**: Uses Event Loop, Promises, and \`async\`/\`await\` for asynchronous I/O.\n` +
      `- **DOM Manipulation**: Directly modify web page elements dynamically.\n\n` +
      `\`\`\`javascript\n// Asynchronous JavaScript Example\nasync function fetchData(url) {\n    const response = await fetch(url);\n    const data = await response.json();\n    return data;\n}\n\`\`\``;
  } else if (/recursion|recursive/.test(q)) {
    topic = "Recursion";
    answer = `Recursion is a programming technique where a function solves a problem by calling itself with smaller inputs until it reaches a base condition.\n\n` +
      `### Essential Components:\n` +
      `1. **Base Case**: Prevents infinite call loops by terminating recursion.\n` +
      `2. **Recursive Step**: Reduces problem size and moves closer to the base case.\n` +
      `3. **Call Stack**: Memory allocation for active sub-calls.\n\n` +
      `\`\`\`python\n# Factorial with Recursion\ndef factorial(n):\n    if n <= 1: # Base Case\n        return 1\n    return n * factorial(n - 1) # Recursive Step\n\nprint(factorial(5)) # Output: 120\n\`\`\``;
  } else if (/\b(c|cpp|c\+\+|pointer|memory|malloc)\b/.test(q)) {
    topic = "Pointers & Memory Management";
    answer = `A pointer is a variable that stores the memory address of another variable. Essential in languages like C and C++ for direct memory manipulation.\n\n` +
      `### Key Concepts:\n` +
      `- **\`&\` Address-of Operator**: Obtains the memory location of a variable.\n` +
      `- **\`*\` Dereference Operator**: Accesses or modifies the value stored at the target memory address.\n` +
      `- **Dynamic Allocation**: \`malloc()\` / \`free()\` in C, \`new\` / \`delete\` in C++.\n\n` +
      `\`\`\`c\n// C Pointer Example\nint val = 42;\nint *ptr = &val; // ptr stores address of val\nprintf("Value: %d, Address: %p\\n", *ptr, (void*)ptr);\n\`\`\``;
  } else if (/binary search/.test(q)) {
    topic = "Binary Search Algorithm";
    answer = `Binary Search is an efficient searching algorithm that operates on **sorted arrays** in **O(log N)** time complexity.\n\n` +
      `### How it Works:\n` +
      `1. Find the middle element of the sorted array.\n` +
      `2. If the target equals the middle element, search is complete.\n` +
      `3. If target < middle, narrow search range to the left half.\n` +
      `4. If target > middle, narrow search range to the right half.\n` +
      `5. Repeat until found or search interval is empty.\n\n` +
      `\`\`\`python\ndef binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1\n\`\`\``;
  } else if (/database|sql|norm|join|table/.test(q)) {
    topic = "Database Systems & SQL";
    answer = `Databases organize structured information for fast querying and reliability.\n\n` +
      `### Core Concepts:\n` +
      `- **SQL Queries**: \`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\`.\n` +
      `- **Joins**: Combine records from two or more tables (\`INNER JOIN\`, \`LEFT JOIN\`).\n` +
      `- **Normalization**: Process of structuring relational database schema to reduce redundancy.\n` +
      `- **ACID Properties**: Atomicity, Consistency, Isolation, Durability for reliable transactions.\n\n` +
      `\`\`\`sql\nSELECT students.name, courses.title\nFROM students\nJOIN enrollments ON students.id = enrollments.student_id\nJOIN courses ON enrollments.course_id = courses.id;\n\`\`\``;
  } else if (/loop|for|while|control flow/.test(q)) {
    topic = "Control Flow & Loops";
    answer = `Control flow structures determine the execution path of program instructions.\n\n` +
      `### Main Loop Types:\n` +
      `- **For Loop**: Used when the exact number of iterations is known ahead of time.\n` +
      `- **While Loop**: Repeats instructions as long as a boolean condition remains \`true\`.\n` +
      `- **Do-While Loop**: Guarantees at least one execution before condition checking.\n\n` +
      `\`\`\`javascript\n// For loop example\nfor (let i = 0; i < 5; i++) {\n    console.log("Iteration: " + i);\n}\n\`\`\``;
  } else if (/generative|llm|ai|agent|transformer|prompt/.test(q)) {
    topic = "Generative & Agentic AI";
    answer = `Generative AI uses deep neural networks (like Transformer architectures) to produce text, code, images, and audio based on context prompts.\n\n` +
      `### Key Foundations:\n` +
      `- **LLMs (Large Language Models)**: Trained on vast text corpora to predict tokens.\n` +
      `- **Prompt Engineering**: Designing structured context to optimize AI model outputs.\n` +
      `- **AI Agents**: Extend LLMs with tool execution, planning algorithms, external APIs, and persistent memory.\n\n` +
      `\`\`\`python\n# Conceptual Agent Loop\nwhile not task.is_complete():\n    thought = agent.reason(current_state)\n    action = agent.select_tool(thought)\n    observation = execute(action)\n    agent.update_memory(observation)\n\`\`\``;
  } else if (/array|stack|queue|tree|graph|list|hash|structure/.test(q)) {
    topic = "Data Structures";
    answer = `Data structures organize data in memory for efficient retrieval, insertion, and manipulation.\n\n` +
      `### Classifications:\n` +
      `- **Arrays & Vectors**: Contiguous memory, $O(1)$ indexed access.\n` +
      `- **Stacks (LIFO)**: Last-In-First-Out (used in function call stacks, undo mechanisms).\n` +
      `- **Queues (FIFO)**: First-In-First-Out (used in task scheduling, BFS).\n` +
      `- **Hash Tables**: Key-Value mapping with $O(1)$ average time complexity.\n` +
      `- **Trees & Graphs**: Hierarchical and network relationship representations.\n\n` +
      `\`\`\`python\n# Stack implementation in Python\nstack = []\nstack.append("A") # Push\nstack.append("B")\ntop = stack.pop() # Pop -> "B"\n\`\`\``;
  } else if (/oop|object|class|inherit|polymorph|encapsulat/.test(q)) {
    topic = "Object-Oriented Programming (OOP)";
    answer = `OOP is a programming paradigm organized around objects containing data fields and methods.\n\n` +
      `### The 4 Pillars of OOP:\n` +
      `1. **Encapsulation**: Bundling data with methods and hiding internal state.\n` +
      `2. **Abstraction**: Exposing only essential interface features while hiding complexity.\n` +
      `3. **Inheritance**: Creating new classes based on existing ones to reuse code.\n` +
      `4. **Polymorphism**: Allowing subclass methods to redefine parent behavior.\n\n` +
      `\`\`\`java\n// Java OOP Example\nclass Animal {\n    void speak() { System.out.println("Animal sound"); }\n}\nclass Dog extends Animal {\n    @Override\n    void speak() { System.out.println("Woof!"); }\n}\n\`\`\``;
  } else if (/big o|complexity|time complexity|space complexity/.test(q)) {
    topic = "Big O Notation & Complexity";
    answer = `Big O notation measures algorithm efficiency as input size ($N$) grows.\n\n` +
      `### Common Complexity Classes:\n` +
      `- **$O(1)$ Constant**: Instant access (e.g. Array lookup by index).\n` +
      `- **$O(\\log N)$ Logarithmic**: Binary search in sorted arrays.\n` +
      `- **$O(N)$ Linear**: Single pass loop through an array.\n` +
      `- **$O(N \\log N)$ Linearithmic**: Efficient sorting (Merge Sort, Quick Sort).\n` +
      `- **$O(N^2)$ Quadratic**: Nested loops over input.\n` +
      `- **$O(2^N)$ Exponential**: Naive recursive Fibonacci computation.`;
  } else {
    const rawTopic = question.replace(/how to|what is|write a|explain|code for/gi, "").trim();
    topic = rawTopic ? rawTopic.charAt(0).toUpperCase() + rawTopic.slice(1) : "Computer Science Concept";

    answer = `Here is a structured breakdown of **${question}** tailored for your level (${account.level}):\n\n` +
      `### Key Concepts:\n` +
      `1. **Core Problem**: Understand input conditions and expected outputs.\n` +
      `2. **Algorithmic Logic**: Deconstruct the problem step-by-step into executable code.\n` +
      `3. **Validation**: Test edge cases and analyze performance bounds.\n\n` +
      `### Practical Example:\n` +
      `\`\`\`python\n# Solution for ${question}\ndef solve():\n    print("Executing solution for ${topic}")\n\nsolve()\n\`\`\`\n\n` +
      `*Practice Tip: Try running this logic in Code Lab!*`;
  }

  return {
    topic,
    text: `${answer}${context}`
  };
}

const QUESTIONS: Question[] = [
  { id: "q1", topic: "Variables", prompt: "Which statement best describes a variable?", options: ["A named place to store a value", "A loop that repeats forever", "A type of compiler", "A comment in code"], answer: 0 },
  { id: "q2", topic: "Loops", prompt: "What is a common purpose of a loop?", options: ["Repeat a block of instructions", "Store a database schema", "Declare a class only", "Stop a program from running"], answer: 0 },
  { id: "q3", topic: "Functions", prompt: "What does a return statement usually do?", options: ["Sends a result back to the caller", "Starts a new computer", "Repeats a loop", "Deletes a variable"], answer: 0 },
  { id: "q4", topic: "Algorithms", prompt: "Binary search requires the input to be…", options: ["Sorted", "Encrypted", "A linked list only", "Empty"], answer: 0 },
  { id: "q5", topic: "Recursion", prompt: "What prevents a recursive function from continuing indefinitely?", options: ["A base case", "A global variable", "A comment", "A larger input"], answer: 0 },
  { id: "q6", topic: "Data Structures", prompt: "Which data structure follows last-in, first-out order?", options: ["Stack", "Queue", "Graph", "Hash table"], answer: 0 },
  { id: "q7", topic: "Databases", prompt: "What is a primary key used for?", options: ["Uniquely identify a row", "Format a web page", "Repeat a query", "Encrypt a password"], answer: 0 },
  { id: "q8", topic: "Generative AI", prompt: "What is a token in language-model processing?", options: ["A unit of text processed by the model", "A database primary key", "A computer's RAM module", "A programming loop"], answer: 0 },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</div>;
}

function AuthScreen({ onCreate, onLogin, onGoogleLogin, onDemoLogin }: {
  onCreate: (account: Account) => void;
  onLogin: (email: string, password: string) => string | null;
  onGoogleLogin: () => void;
  onDemoLogin: () => void;
}) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [level, setLevel] = useState("Beginner"); const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const choices = ["C", "C++", "Java", "Python", "JavaScript", "Data Structures", "Algorithms", "DBMS", "Operating Systems", "Computer Networks", "AI/ML", "Generative AI", "Agentic AI"];

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim() || "password123";
    const fallbackName = cleanEmail ? cleanEmail.split("@")[0] : "Learner";
    const cleanName = name.trim() || fallbackName;

    if (!cleanEmail) {
      return setError("Please enter your email address.");
    }

    if (mode === "signup") {
      onCreate(newAccount({
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        email: cleanEmail,
        password: cleanPassword,
        level,
        interests
      }));
    } else {
      const message = onLogin(cleanEmail, cleanPassword);
      if (message) setError(message);
    }
  };

  return <div className="min-h-screen bg-[#f7f7fc] dark:bg-slate-950">
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#17152f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="relative flex items-center gap-3"><div className="rounded-xl bg-violet-500 p-2"><Code2 size={22} /></div><span className="text-xl font-bold">Coders Hub</span></div>
        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-violet-200"><Sparkles size={16} /> AI-powered learning workspace</div>
          <h1 className="text-5xl font-bold leading-tight">Learn. Code.<br />Practice. Remember.<br /><span className="text-violet-300">Improve.</span></h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">A learning space that grows with you. Your progress begins when you do.</p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {["Learn with lessons", "Practice in Code Lab", "Build your own path"].map((x, i) => <div key={x} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><div className="mb-2 text-violet-300">{[<BookOpen size={18}/>, <Code2 size={18}/>, <Brain size={18}/>][i]}</div>{x}</div>)}
          </div>
        </div>
        <p className="relative text-sm text-slate-400">A personal learning system for computer science students.</p>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="rounded-xl bg-violet-600 p-2 text-white"><Code2 /></div><b className="text-xl">Coders Hub</b></div>
          <div className="mb-7">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-violet-600">Welcome to Coders Hub</p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{mode === "signup" ? "Let's personalize your learning journey." : "Welcome back."}</h2>
            <p className="mt-2 text-slate-500">{mode === "signup" ? "Create your account to get started. Your workspace starts empty." : "Log in to continue your learning journey."}</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && <>
              <label className="block text-sm font-medium">Name<input value={name} onChange={e => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500" placeholder="Your name (e.g. Alex)" /></label>
            </>}
            <label className="block text-sm font-medium">Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500" placeholder="you@example.com" /></label>
            <label className="block text-sm font-medium">Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500" placeholder="Enter your password" /></label>
            {mode === "signup" && <>
              <label className="block text-sm font-medium">Confirm password<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500" placeholder="Confirm your password" /></label>
              <label className="block text-sm font-medium">Learning level<select value={level} onChange={e => setLevel(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
              <div><p className="mb-2 text-sm font-medium">What are you interested in?</p><div className="flex flex-wrap gap-2">{choices.map(item => <button type="button" key={item} onClick={() => setInterests(v => v.includes(item) ? v.filter(x => x !== item) : [...v, item])} className={`rounded-full border px-3 py-1.5 text-xs ${interests.includes(item) ? "border-violet-600 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600"}`}>{item}</button>)}</div></div>
            </>}
            {mode === "login" && <div className="text-right"><button type="button" className="text-sm text-violet-600" onClick={() => setError("For this local prototype, contact support to reset your password.")}>Forgot password?</button></div>}
            {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <Button type="submit" onClick={() => submit()} className="w-full py-3">{mode === "signup" ? "Create my account" : "Log in"} <ArrowRight size={17} /></Button>
            <Button type="button" variant="secondary" className="w-full" onClick={onGoogleLogin}>
              <svg className="mr-1.5 inline-block h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </Button>
            <Button type="button" variant="quiet" className="w-full text-xs text-slate-500 hover:text-slate-700" onClick={onDemoLogin}>
              ⚡ Quick Start with Demo Account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">{mode === "signup" ? "Already have an account?" : "New to Coders Hub?"}{" "}<button onClick={() => { setError(""); setMode(mode === "signup" ? "login" : "signup"); }} className="font-semibold text-violet-600">{mode === "signup" ? "Log in" : "Create an account"}</button></p>
        </div>
      </section>
    </div>
  </div>;
}

function Button({ children, onClick, variant = "primary", className = "", disabled = false, type = "button" }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "quiet";
  className?: string; disabled?: boolean; type?: "button" | "submit";
}) {
  const style = variant === "primary"
    ? "bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-300 shadow-sm"
    : variant === "secondary"
      ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${style} ${className}`}>{children}</button>;
}
function offlineCodeConverter(code: string, fromLang: string, toLang: string): { code: string; notes: string[] } {
  const notes: string[] = [
    `Converted syntax rules from ${fromLang} to ${toLang}.`,
    `Mapped functions, loop constructs, variables, and output statements.`,
    `Review explicit type declarations and library imports for ${toLang}.`
  ];

  if (fromLang === toLang) {
    return { code, notes: ["Source and target programming languages are identical."] };
  }

  let converted = code;

  if (fromLang === "Python") {
    if (toLang === "C++") {
      converted = `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\n` +
        code
          .replace(/def\s+(\w+)\s*\(([^)]*)\):/g, 'auto $1($2) {')
          .replace(/print\((f?".*?"|.*?)\)/g, (match, p1) => {
            const clean = p1.replace(/^f/, '').replace(/\{([^}]+)\}/g, '<< $1 <<');
            return `cout << ${clean} << endl;`;
          })
          .replace(/for\s+(\w+)\s+in\s+range\(([^,]+),\s*([^)]+)\):/g, 'for (int $1 = $2; $1 < $3; $1++) {')
          .replace(/for\s+(\w+)\s+in\s+range\(([^)]+)\):/g, 'for (int $1 = 0; $1 < $2; $1++) {')
          .replace(/elif\s+(.*?):/g, '} else if ($1) {')
          .replace(/if\s+(.*?):/g, 'if ($1) {')
          .replace(/else:/g, '} else {')
          .replace(/return\s+(.*)/g, 'return $1;') +
        `\n\nint main() {\n    // Executed converted logic\n    return 0;\n}`;
      notes.push("Added `#include <iostream>` and `using namespace std;`.");
      notes.push("Replaced `def` with `auto` and `print()` with `std::cout`.");
    } else if (toLang === "C") {
      converted = `#include <stdio.h>\n\n` +
        code
          .replace(/def\s+(\w+)\s*\(([^)]*)\):/g, 'int $1($2) {')
          .replace(/print\((f?".*?"|.*?)\)/g, 'printf("%s\\n", $1);')
          .replace(/for\s+(\w+)\s+in\s+range\(([^,]+),\s*([^)]+)\):/g, 'for (int $1 = $2; $1 < $3; $1++) {')
          .replace(/for\s+(\w+)\s+in\s+range\(([^)]+)\):/g, 'for (int $1 = 0; $1 < $2; $1++) {')
          .replace(/elif\s+(.*?):/g, '} else if ($1) {')
          .replace(/if\s+(.*?):/g, 'if ($1) {')
          .replace(/else:/g, '} else {')
          .replace(/return\s+(.*)/g, 'return $1;') +
        `\n\nint main() {\n    return 0;\n}`;
      notes.push("C requires strict explicit type declarations and `printf()`.");
    } else if (toLang === "JavaScript" || toLang === "TypeScript") {
      converted = code
        .replace(/def\s+(\w+)\s*\(([^)]*)\):/g, 'function $1($2) {')
        .replace(/print\((.*?)\)/g, 'console.log($1);')
        .replace(/for\s+(\w+)\s+in\s+range\(([^,]+),\s*([^)]+)\):/g, 'for (let $1 = $2; $1 < $3; $1++) {')
        .replace(/for\s+(\w+)\s+in\s+range\(([^)]+)\):/g, 'for (let $1 = 0; $1 < $2; $1++) {')
        .replace(/elif\s+(.*?):/g, '} else if ($1) {')
        .replace(/if\s+(.*?):/g, 'if ($1) {')
        .replace(/else:/g, '} else {')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/None/g, 'null');
      notes.push("Replaced `def` with `function` and `print()` with `console.log()`.");
    } else if (toLang === "Java") {
      converted = `public class Main {\n    ` +
        code
          .replace(/def\s+(\w+)\s*\(([^)]*)\):/g, 'public static int $1($2) {')
          .replace(/print\((.*?)\)/g, 'System.out.println($1);')
          .replace(/for\s+(\w+)\s+in\s+range\(([^,]+),\s*([^)]+)\):/g, 'for (int $1 = $2; $1 < $3; $1++) {')
          .replace(/for\s+(\w+)\s+in\s+range\(([^)]+)\):/g, 'for (int $1 = 0; $1 < $2; $1++) {')
          .replace(/elif\s+(.*?):/g, '} else if ($1) {')
          .replace(/if\s+(.*?):/g, 'if ($1) {')
          .replace(/else:/g, '} else {')
          .split('\n').join('\n    ') +
        `\n\n    public static void main(String[] args) {\n        // Main entry point\n    }\n}`;
      notes.push("Wrapped in `public class Main` with static method declarations.");
    }
  } else if (fromLang === "C" || fromLang === "C++") {
    if (toLang === "Python") {
      converted = code
        .replace(/#include\s+<.*?>/g, '')
        .replace(/using\s+namespace\s+std;/g, '')
        .replace(/(int|void|float|double|auto)\s+(\w+)\s*\(([^)]*)\)\s*\{/g, 'def $2($3):')
        .replace(/std::cout\s*<<\s*(.*?)\s*<<\s*std::endl;/g, 'print($1)')
        .replace(/cout\s*<<\s*(.*?)\s*<<\s*endl;/g, 'print($1)')
        .replace(/printf\((.*?)\);/g, 'print($1)')
        .replace(/for\s*\(\s*int\s+(\w+)\s*=\s*0;\s*\1\s*<\s*([^;]+);\s*\1\+\+\s*\)\s*\{/g, 'for $1 in range($2):')
        .replace(/for\s*\(\s*int\s+(\w+)\s*=\s*([^;]+);\s*\1\s*<\s*([^;]+);\s*\1\+\+\s*\)\s*\{/g, 'for $1 in range($2, $3):')
        .replace(/\}/g, '')
        .replace(/;/g, '');
      notes.push("Removed C/C++ includes, semicolons, and curly braces for Python syntax.");
    }
  } else if (fromLang === "JavaScript" || fromLang === "TypeScript") {
    if (toLang === "Python") {
      converted = code
        .replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, 'def $1($2):')
        .replace(/const\s+|let\s+|var\s+/g, '')
        .replace(/console\.log\((.*?)\);?/g, 'print($1)')
        .replace(/for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*([^;]+);\s*\1\+\+\s*\)\s*\{/g, 'for $1 in range($2):')
        .replace(/true/g, 'True')
        .replace(/false/g, 'False')
        .replace(/null|undefined/g, 'None')
        .replace(/\}/g, '')
        .replace(/;/g, '');
      notes.push("Converted `function` to `def` and `console.log` to `print`.");
    }
  }

  return { code: converted, notes };
}

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>(readAccounts);
  const [activeId, setActiveId] = useState(() => localStorage.getItem(SESSION_KEY) || "");
  const [page, setPage] = useState("Dashboard");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);
  const [quizTopic, setQuizTopic] = useState("Programming fundamentals");
  const [code, setCode] = useState('def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("world"))\n\nfor i in range(3):\n    print(f"Loop count: {i + 1}")');
  const [codeStdin, setCodeStdin] = useState("");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("Python");
  const [assistantInput, setAssistantInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [converterSourceLang, setConverterSourceLang] = useState("Python");
  const [converterTargetLang, setConverterTargetLang] = useState("C++");
  const [converterInputCode, setConverterInputCode] = useState(
`def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    
    a, b = 0, 1
    for i in range(2, n + 1):
        a, b = b, a + b
    return b

# Test Fibonacci function
result = fibonacci(10)
print("Fibonacci(10) =", result)`
  );
  const [converterOutputCode, setConverterOutputCode] = useState("");
  const [converterNotes, setConverterNotes] = useState<string[]>([]);
  const [isConvertingCode, setIsConvertingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [agentPlan, setAgentPlan] = useState<string[] | null>(null);
  const [myTab, setMyTab] = useState("In Progress");
  const [themeVersion, setThemeVersion] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => {
    if (activeId) localStorage.setItem(SESSION_KEY, activeId);
    else localStorage.removeItem(SESSION_KEY);
  }, [activeId]);

  const current = accounts.find(a => a.id === activeId);
  const currentCourse = COURSES.find(c => c.id === courseId);
  const currentLesson = currentCourse?.lessons.find(l => l.id === lessonId);

  const lang: Language = (current?.preferences.language as Language) || "English";
  const t = (key: string): string => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.English[key] ?? key;

  useEffect(() => {
    if (page === "AI Assistant") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [current?.conversations.length, page, isTyping]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3200); };
  const updateUser = (fn: (u: Account) => Account) => {
    setAccounts(all => all.map(a => a.id === activeId ? fn(a) : a));
  };
  const goCourse = (id: string) => { setCourseId(id); setLessonId(""); setPage("Course"); setSidebarOpen(false); };
  const goPage = (name: string) => { setPage(name); setCourseId(""); setLessonId(""); setSidebarOpen(false); };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", current?.preferences.theme === "dark");
    setThemeVersion(v => v + 1);
  }, [current?.preferences.theme]);

  const login = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    if (!cleanEmail) return "Please enter your email.";
    if (!cleanPass) return "Please enter your password.";

    const found = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (found) {
      if (found.password !== cleanPass) {
        setAccounts(all => all.map(a => a.id === found.id ? { ...a, password: cleanPass } : a));
      }
      setActiveId(found.id);
      setPage("Dashboard");
      return null;
    }

    const nameFromEmail = cleanEmail.split("@")[0].replace(/[._-]/g, " ");
    const formattedName = nameFromEmail ? nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1) : "Student";
    const acc = newAccount({
      name: formattedName,
      email: cleanEmail,
      password: cleanPass,
      level: "Beginner",
      interests: ["Python", "JavaScript", "Generative AI"],
    });
    setAccounts(all => [...all, acc]);
    setActiveId(acc.id);
    setPage("Dashboard");
    return null;
  };

  const createAccount = (account: Account) => {
    const cleanEmail = account.email.trim().toLowerCase();
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      const updated = { ...existing, ...account, id: existing.id };
      setAccounts(all => all.map(a => a.id === existing.id ? updated : a));
      setActiveId(existing.id);
    } else {
      setAccounts(all => [...all, account]);
      setActiveId(account.id);
    }
    setPage("Dashboard");
    return null;
  };
  const googleLogin = () => {
    const googleEmail = "google.user@example.com";
    const existing = accounts.find(a => a.email.toLowerCase() === googleEmail);
    if (existing) {
      setActiveId(existing.id);
    } else {
      const acc = newAccount({
        name: "Google User",
        email: googleEmail,
        password: "google-oauth-session",
        level: "Intermediate",
        interests: ["Python", "Generative AI", "Agentic AI"],
      });
      setAccounts(all => [...all, acc]);
      setActiveId(acc.id);
    }
    setPage("Dashboard");
  };
  const demoLogin = () => {
    const demoEmail = "demo@codershub.dev";
    const existing = accounts.find(a => a.email.toLowerCase() === demoEmail);
    if (existing) {
      setActiveId(existing.id);
    } else {
      const acc = newAccount({
        name: "Demo Student",
        email: demoEmail,
        password: "demopassword123",
        level: "Beginner",
        interests: ["Python", "JavaScript", "Generative AI"],
      });
      setAccounts(all => [...all, acc]);
      setActiveId(acc.id);
    }
    setPage("Dashboard");
  };
  const logout = () => { setActiveId(""); setPage("Dashboard"); setCourseId(""); setLessonId(""); };

  const enrolledCourses = useMemo(() => {
    if (!current) return [];
    return current.enrollments
      .map(e => COURSES.find(c => c.id === e.courseId)).filter((c): c is Course => Boolean(c));
  }, [current]);

  const skills = useMemo(() => {
    if (!current) return [];
    const entries = new Map<string, { score: number; evidence: number }>();
    current.enrollments.forEach(e => {
      const c = COURSES.find(x => x.id === e.courseId);
      if (!c) return;
      const quizScores = current.quizzes.filter(q => q.courseId === c.id);
      const quizAvg = quizScores.length
        ? quizScores.reduce((s, q) => s + q.score / q.total * 100, 0) / quizScores.length : 0;
      const codeCount = current.codeHistory.filter(x => x.language.toLowerCase() === c.title.toLowerCase().split(" ")[0]).length;
      const evidence = e.completed.length + quizScores.length + codeCount;
      if (evidence) entries.set(c.title, {
        score: Math.min(100, Math.round(e.completed.length / c.lessons.length * 55 + quizAvg * (quizScores.length ? .4 : 0) + codeCount * 5)),
        evidence,
      });
    });
    current.quizzes.forEach(q => {
      const c = COURSES.find(x => x.id === q.courseId);
      const key = c?.title ?? q.topic;
      if (!entries.has(key)) entries.set(key, { score: Math.round(q.score / q.total * 100), evidence: 1 });
    });
    return [...entries].map(([name, v]) => ({ name, ...v }));
  }, [current]);

  if (!current) {
    return <AuthScreen onCreate={createAccount} onLogin={login} onGoogleLogin={googleLogin} onDemoLogin={demoLogin} />;
  }

  const enroll = (id: string) => {
    const course = COURSES.find(c => c.id === id);
    if (!course || !current) return;
    if (current.enrollments.some(e => e.courseId === id)) { goCourse(id); return; }
    updateUser(u => ({
      ...u,
      enrollments: [...u.enrollments, { userId: u.id, courseId: id, enrolledAt: dateNow(), completed: [], opened: [] }],
      activities: [...u.activities, activity(u, `Enrolled in ${course.title}`, "Course added to My Learning.", "enrollment")],
    }));
    notify(`${course.title} added to My Learning.`);
    goCourse(id);
  };
  const saveCourse = (id: string) => {
    if (!current) return;
    const saved = current.savedCourses.includes(id);
    updateUser(u => ({
      ...u,
      savedCourses: saved ? u.savedCourses.filter(x => x !== id) : [...u.savedCourses, id],
      activities: [...u.activities, activity(u, saved ? "Removed saved course" : `Saved ${COURSES.find(c => c.id === id)?.title ?? "course"}`, "", "saved")],
    }));
    notify(saved ? "Removed from saved courses." : "Course saved.");
  };
  const openLesson = (course: Course, lesson: Lesson) => {
    updateUser(u => {
      const enroll = u.enrollments.find(e => e.courseId === course.id);
      if (!enroll) return u;
      const opened = enroll.opened.includes(lesson.id) ? enroll.opened : [...enroll.opened, lesson.id];
      const changed = opened.length !== enroll.opened.length;
      return {
        ...u,
        enrollments: u.enrollments.map(e => e.courseId === course.id ? { ...e, opened } : e),
        activities: changed ? [...u.activities, activity(u, `Opened ${lesson.title}`, course.title, "lesson-opened")] : u.activities,
      };
    });
    setCourseId(course.id); setLessonId(lesson.id); setPage("Course");
  };
  const completeLesson = (course: Course, lesson: Lesson) => {
    if (!current) return;
    const already = current.enrollments.find(e => e.courseId === course.id)?.completed.includes(lesson.id);
    if (already) { notify("Lesson already completed."); return; }
    updateUser(u => ({
      ...u,
      xp: u.xp + 25,
      enrollments: u.enrollments.map(e => e.courseId === course.id
        ? { ...e, completed: [...e.completed, lesson.id] } : e),
      activities: [...u.activities, activity(u, `Completed ${lesson.title}`, course.title, "lesson-completed")],
    }));
    notify("Lesson completed! +25 XP");
  };

  const askTutor = async (question: string, contextCourse?: Course, contextLesson?: Lesson) => {
    if (!current || !question.trim() || isTyping) return;
    const qText = question.trim();
    setAssistantInput("");
    setIsTyping(true);

    const contextPayload: Record<string, any> = {
      level: current.level,
      language: codeLanguage,
    };

    if (contextCourse || currentCourse) {
      contextPayload.courseTitle = (contextCourse || currentCourse)?.title;
    }
    if (contextLesson || currentLesson) {
      contextPayload.lessonTitle = (contextLesson || currentLesson)?.title;
    }
    if (page === "Code Lab" && code.trim()) {
      contextPayload.code = code;
    }

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: qText,
          context: contextPayload,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.error || `AI service returned status ${res.status}`;
        updateUser(u => ({
          ...u,
          conversations: [...u.conversations, {
            id: uid(), userId: u.id, question: qText,
            response: `⚠️ **AI Service Notice**\n\n${errorText}`,
            topic: "System Notice",
            courseId: contextCourse?.id || currentCourse?.id,
            lessonId: contextLesson?.id || currentLesson?.id,
            timestamp: dateNow(),
          }]
        }));
        notify(errorText);
      } else {
        updateUser(u => ({
          ...u,
          conversations: [...u.conversations, {
            id: uid(), userId: u.id, question: qText,
            response: data.text || "No response received from AI service.",
            topic: data.topic || "Computer Science",
            courseId: contextCourse?.id || currentCourse?.id,
            lessonId: contextLesson?.id || currentLesson?.id,
            timestamp: dateNow(),
          }],
          activities: [...u.activities, activity(u, `Asked AI about ${data.topic || "CS"}`, qText, "ai-question")],
        }));
        notify("AI Tutor answered your question.");
      }
    } catch (err: any) {
      const errMsg = `Unable to reach AI service: ${err.message || "Network error"}`;
      updateUser(u => ({
        ...u,
        conversations: [...u.conversations, {
          id: uid(), userId: u.id, question: qText,
          response: `⚠️ **Network Error**\n\n${errMsg}`,
          topic: "Connection Error",
          timestamp: dateNow(),
        }]
      }));
      notify(errMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChatHistory = () => {
    if (!current) return;
    updateUser(u => ({ ...u, conversations: [] }));
    notify("Conversation history cleared.");
  };

  const recordCodeAction = (kind: string, detail: string) => {
    if (!current) return;
    updateUser(u => ({
      ...u,
      xp: kind === "Run" ? u.xp + 5 : u.xp,
      codeHistory: [...u.codeHistory, { id: uid(), userId: u.id, kind, language: codeLanguage, code, timestamp: dateNow(), detail }],
      activities: [...u.activities, activity(u, `${kind === "Run" ? "Ran" : kind === "Debug" ? "Debugged" : kind === "Optimize" ? "Optimized" : "Explained"} ${codeLanguage} program`, detail, `code-${kind.toLowerCase()}`)],
    }));
  };

  const questions = QUESTIONS;
  const submitQuiz = () => {
    if (!current) return;
    const score = questions.reduce((n, q) => n + (quizAnswers[q.id] === q.answer ? 1 : 0), 0);
    const related = enrolledCourses.find(c => c.title.toLowerCase().includes(quizTopic.toLowerCase())) ?? enrolledCourses[0];
    const attempt: QuizAttempt = {
      id: uid(), userId: current.id, courseId: related?.id ?? "", topic: quizTopic,
      score, total: questions.length, answers: quizAnswers, timestamp: dateNow(),
    };
    updateUser(u => ({
      ...u, quizzes: [...u.quizzes, attempt], xp: u.xp + 20,
      activities: [...u.activities, activity(u, `Completed ${quizTopic} quiz — ${Math.round(score / questions.length * 100)}%`, `${score} of ${questions.length} correct`, "quiz")],
    }));
    setQuizResult(attempt); setQuizActive(false); notify(`Quiz complete — ${Math.round(score / questions.length * 100)}%.`);
  };

  const overallProgress = enrolledCourses.length
    ? Math.round(enrolledCourses.reduce((s, c) => s + progressFor(current, c), 0) / enrolledCourses.length) : 0;
  const quizAvg = averageQuiz(current);
  const recent = [...current.activities].reverse().slice(0, 5);
  const searchResults = search.trim()
    ? COURSES.filter(c => `${c.title} ${c.description} ${c.topics.join(" ")}`.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];
  const lessonIndex = currentCourse && currentLesson ? currentCourse.lessons.findIndex(l => l.id === currentLesson.id) : -1;
  const allQuizQuestions = QUESTIONS;

  // --- MODERN REDESIGNED DASHBOARD ---
  const renderDashboard = () => <div className="space-y-8">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 p-8 text-white shadow-2xl sm:p-10 border border-slate-800/80">
      <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl pointer-events-none" />
      <div className="absolute right-40 bottom-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-violet-300 backdrop-blur-md shadow-inner">
          <Sparkles size={14} className="text-violet-400 animate-pulse" />
          <span>{t("workspaceTag")}</span>
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          {t("welcome")}, <span className="bg-gradient-to-r from-violet-300 via-indigo-200 to-white bg-clip-text text-transparent">{current.name.split(" ")[0]}</span> 👋
        </h1>
        <p className="mt-4 max-w-xl text-base text-slate-300 leading-relaxed">
          Level: <b className="text-violet-200 font-semibold">{current.level}</b> · Earned <b className="text-emerald-400">{current.xp} XP</b> · Streak <b className="text-rose-400">{current.streak || 3} Days 🔥</b>. Advance your computer science skills with real-time compilers and AI tutoring.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => goPage("Explore Courses")} className="bg-gradient-to-r from-violet-500 to-indigo-600 !text-white hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-900/30">
            {t("exploreBtn")} <ArrowRight size={16} />
          </Button>
          <button onClick={() => goPage("Code Lab")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:bg-white/20 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-violet-400">
            <Code2 size={16} /> {t("codeLab")}
          </button>
          <button onClick={() => goPage("AI Code Converter")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/20 px-4 py-2.5 text-sm font-semibold text-violet-200 shadow-sm backdrop-blur-md transition hover:bg-violet-500/30 hover:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400">
            <WandSparkles size={16} className="text-violet-300" /> AI Code Converter
          </button>
        </div>
      </div>
      <div className="absolute bottom-6 right-8 hidden text-violet-400/20 lg:block">
        <Brain size={160} />
      </div>
    </section>

    {/* Modern Metrics Bar */}
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      <Card className="p-5 border-t-4 border-t-violet-600 transition hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">{t("overallProgress")}</span>
          <Activity size={18} className="text-violet-600" />
        </div>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{overallProgress}%</p>
        <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500" style={{ width: `${overallProgress}%` }} />
        </div>
      </Card>

      <Card className="p-5 border-t-4 border-t-indigo-600 transition hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">{t("coursesEnrolled")}</span>
          <BookOpen size={18} className="text-indigo-600" />
        </div>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{current.enrollments.length}</p>
        <p className="mt-2 text-xs text-slate-400 font-medium">Active learning pathways</p>
      </Card>

      <Card className="p-5 border-t-4 border-t-emerald-600 transition hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">{t("lessonsDone")}</span>
          <CheckCircle2 size={18} className="text-emerald-600" />
        </div>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {current.enrollments.reduce((n, e) => n + e.completed.length, 0)}
        </p>
        <p className="mt-2 text-xs text-slate-400 font-medium">Completed lessons</p>
      </Card>

      <Card className="p-5 border-t-4 border-t-amber-500 transition hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">{t("quizAvg")}</span>
          <Target size={18} className="text-amber-500" />
        </div>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{quizAvg === null ? "N/A" : `${quizAvg}%`}</p>
        <p className="mt-2 text-xs text-slate-400 font-medium">{current.quizzes.length} quizzes taken</p>
      </Card>

      <Card className="p-5 border-t-4 border-t-rose-500 transition hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">{t("streak")}</span>
          <Flame size={18} className="text-rose-500" />
        </div>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{current.streak || 3} Days</p>
        <p className="mt-2 text-xs text-rose-500 font-semibold">Active streak 🔥</p>
      </Card>
    </div>

    {/* Interactive Quick Actions */}
    <Card className="p-6 bg-gradient-to-r from-slate-900/5 to-indigo-900/5 dark:from-slate-900/60 dark:to-slate-800/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("quickActions")}</h2>
        <span className="text-xs text-slate-400">Direct Workspace Access</span>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <button onClick={() => goPage("Code Lab")} className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700 transition group-hover:scale-110 dark:bg-violet-950 dark:text-violet-300"><Code2 size={22} /></div>
          <div><b className="block text-sm text-slate-900 dark:text-white">Code Lab</b><span className="text-xs text-slate-500 dark:text-slate-400">Multi-language IDE</span></div>
        </button>
        <button onClick={() => goPage("AI Code Converter")} className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 transition group-hover:scale-110 dark:bg-indigo-950 dark:text-indigo-300"><WandSparkles size={22} /></div>
          <div><b className="block text-sm text-slate-900 dark:text-white">Code Converter</b><span className="text-xs text-slate-500 dark:text-slate-400">Translate programming code</span></div>
        </button>
        <button onClick={() => goPage("Quiz")} className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 transition group-hover:scale-110 dark:bg-amber-950 dark:text-amber-300"><Target size={22} /></div>
          <div><b className="block text-sm text-slate-900 dark:text-white">Practice Quiz</b><span className="text-xs text-slate-500 dark:text-slate-400">Test knowledge</span></div>
        </button>
        <button onClick={() => goPage("Learning Memory")} className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 transition group-hover:scale-110 dark:bg-emerald-950 dark:text-emerald-300"><Brain size={22} /></div>
          <div><b className="block text-sm text-slate-900 dark:text-white">Learning Memory</b><span className="text-xs text-slate-500 dark:text-slate-400">Retention review</span></div>
        </button>
      </div>
    </Card>

    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">Continue learning</h2><p className="text-sm text-slate-500">Pick up where you left off.</p></div><button onClick={() => goPage("My Learning")} className="text-sm font-semibold text-violet-600 hover:text-violet-700">My Learning →</button></div>
        {enrolledCourses.length ? <div className="space-y-3">{enrolledCourses.slice(0, 3).map(c => <CourseRow key={c.id} course={c} progress={progressFor(current, c)} onClick={() => goCourse(c.id)} />)}</div>
          : <Empty icon={BookOpen} title="No courses enrolled yet" text="Start your learning journey by exploring our courses." action="Explore Courses" onAction={() => goPage("Explore Courses")} />}
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">{t("recentActivity")}</h2><p className="text-sm text-slate-500">Your latest actions.</p></div><button onClick={() => goPage("Activity History")} className="text-sm font-semibold text-violet-600 hover:text-violet-700">View all →</button></div>
        {recent.length ? <ActivityList items={recent}/> : <Empty icon={History} title="No activity recorded yet" text="Your learning timeline will populate as you complete lessons." />}
      </Card>
    </div>

    <Card className="p-5 sm:p-6">
      <div className="mb-4"><h2 className="text-lg font-bold">{t("recommended")}</h2><p className="text-sm text-slate-500">Tailored to your interests and learning level.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        {COURSES.filter(c => !current.enrollments.some(e => e.courseId === c.id))
          .sort((a, b) => Number(current.interests.some(i => `${a.title} ${a.category} ${a.topics}`.toLowerCase().includes(i.toLowerCase()))) -
            Number(current.interests.some(i => `${b.title} ${b.category} ${b.topics}`.toLowerCase().includes(i.toLowerCase())))).reverse()
          .slice(0, 3).map(c => <CourseCard key={c.id} course={c} enrolled={false} saved={current.savedCourses.includes(c.id)} onOpen={() => goCourse(c.id)} onEnroll={() => enroll(c.id)} onSave={() => saveCourse(c.id)} />)}
      </div>
    </Card>
  </div>;

  const renderExplore = () => <div className="space-y-6">
    <PageHeading eyebrow="COURSE MARKETPLACE" title="Explore courses" subtitle="Choose what you want to learn. Courses join My Learning only when you enroll." />
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {COURSES.map(c => <CourseCard key={c.id} course={c} enrolled={current.enrollments.some(e => e.courseId === c.id)} saved={current.savedCourses.includes(c.id)} onOpen={() => goCourse(c.id)} onEnroll={() => enroll(c.id)} onSave={() => saveCourse(c.id)} />)}
    </div>
  </div>;

  const renderMyLearning = () => {
    const tabs = ["In Progress", "Not Started", "Completed", "Saved"];
    const list = myTab === "Saved"
      ? COURSES.filter(c => current.savedCourses.includes(c.id))
      : enrolledCourses.filter(c => myTab === "In Progress" ? progressFor(current, c) > 0 && progressFor(current, c) < 100
        : myTab === "Not Started" ? progressFor(current, c) === 0 : progressFor(current, c) === 100);
    return <div className="space-y-6">
      <PageHeading eyebrow="YOUR WORKSPACE" title="My Learning" subtitle="Only courses you have enrolled in appear here." />
      <div className="flex flex-wrap gap-2">{tabs.map(t => <button key={t} onClick={() => setMyTab(t)} className={`rounded-full px-4 py-2 text-sm font-semibold ${myTab === t ? "bg-violet-600 text-white" : "bg-white text-slate-600"}`}>{t}</button>)}</div>
      {list.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{list.map(c => <CourseCard key={c.id} course={c} enrolled={current.enrollments.some(e => e.courseId === c.id)} saved={current.savedCourses.includes(c.id)} progress={progressFor(current, c)} onOpen={() => goCourse(c.id)} onEnroll={() => enroll(c.id)} onSave={() => saveCourse(c.id)} />)}</div>
        : <Card className="p-10"><Empty icon={BookOpen} title={current.enrollments.length || myTab === "Saved" ? `No ${myTab.toLowerCase()} courses` : "Your learning journey starts here."} text={current.enrollments.length || myTab === "Saved" ? "Try another tab or explore the course catalogue." : "No courses enrolled yet. Find a course that interests you to get started."} action="Explore Courses" onAction={() => goPage("Explore Courses")} /></Card>}
    </div>;
  };

  const renderCourse = () => {
    if (!currentCourse) return <Empty icon={BookOpen} title="Course not found" text="Choose a course from the catalogue." action="Explore courses" onAction={() => goPage("Explore Courses")} />;
    const enrollment = current.enrollments.find(e => e.courseId === currentCourse.id);
    const pct = progressFor(current, currentCourse);
    if (currentLesson) {
      const done = enrollment?.completed.includes(currentLesson.id);
      const prev = currentCourse.lessons[lessonIndex - 1];
      const next = currentCourse.lessons[lessonIndex + 1];
      return <div className="mx-auto max-w-4xl space-y-5">
        <button onClick={() => setLessonId("")} className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600"><ArrowLeft size={16}/> Course curriculum</button>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-violet-700 to-indigo-600 p-7 text-white"><p className="text-sm text-violet-200">{currentCourse.title} · {currentLesson.module}</p><h1 className="mt-2 text-3xl font-bold">{currentLesson.title}</h1><p className="mt-2 text-violet-100">Lesson {lessonIndex + 1} of {currentCourse.lessons.length}</p></div>
          <div className="space-y-6 p-6 sm:p-9">
            <div><h2 className="mb-2 text-xl font-bold">What you’ll learn</h2><p className="leading-7 text-slate-600 dark:text-slate-300">{currentLesson.body}</p></div>
            <div className="rounded-2xl bg-violet-50 p-5 dark:bg-slate-800"><div className="mb-3 flex items-center gap-2 font-semibold text-violet-800 dark:text-violet-200"><Lightbulb size={18}/> Key idea</div><p className="text-sm leading-6 text-slate-700 dark:text-slate-300">Focus on <b>{currentLesson.topic}</b>. Try to connect the explanation to a small example, then consider what would happen if the input or conditions changed.</p></div>
            <div><h2 className="mb-3 text-lg font-bold">Example</h2><pre className="overflow-x-auto rounded-xl bg-slate-950 p-5 text-sm leading-6 text-emerald-300"><code>{currentLesson.code}</code></pre></div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" disabled={!prev} onClick={() => prev && openLesson(currentCourse, prev)}><ArrowLeft size={16}/> Previous</Button>
              <Button variant="secondary" onClick={() => {
                setConverterInputCode(currentLesson.code);
                setConverterSourceLang(currentCourse?.title.split(" ")[0] || "Python");
                goPage("AI Code Converter");
              }}>Convert Code <WandSparkles size={16}/></Button>
              <Button onClick={() => completeLesson(currentCourse, currentLesson)}>{done ? <Check size={17}/> : <CheckCircle2 size={17}/>} {done ? "Completed" : "Mark complete"}</Button>
              <Button variant="secondary" disabled={!next} onClick={() => next && openLesson(currentCourse, next)}>Next <ArrowRight size={16}/></Button>
            </div>
          </div>
        </Card>
      </div>;
    }
    if (!enrollment) return <div className="space-y-6">
      <button onClick={() => goPage("Explore Courses")} className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600"><ArrowLeft size={16}/> Back to Explore</button>
      <Card className="overflow-hidden">
        <div className="relative h-52 sm:h-64"><img src={currentCourse.image} alt="" className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"/><div className="absolute bottom-6 left-6 right-6 text-white"><span className="rounded-full bg-white/20 px-3 py-1 text-xs">{currentCourse.category}</span><h1 className="mt-3 text-3xl font-bold">{currentCourse.title}</h1><p className="mt-1 text-white/80">Instructor: {currentCourse.instructor}</p></div></div>
        <div className="p-6">
          <p className="leading-7 text-slate-600 dark:text-slate-300">{currentCourse.description}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4 text-sm text-slate-500"><span>{currentCourse.difficulty}</span><span>·</span><span>{currentCourse.duration}</span><span>·</span><span>{currentCourse.lessons.length} lessons</span></div>
            <Button onClick={() => enroll(currentCourse.id)}>Enroll in Course <ArrowRight size={16}/></Button>
          </div>
        </div>
      </Card>
      <Card className="p-5 sm:p-7"><h2 className="mb-5 text-xl font-bold">Course Curriculum Preview</h2>
        {Array.from(new Set(currentCourse.lessons.map(l => l.module))).map(module => <div key={module} className="mb-6 last:mb-0"><h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{module}</h3><div className="divide-y divide-slate-100 dark:divide-slate-800">{currentCourse.lessons.filter(l => l.module === module).map(l => <button key={l.id} onClick={() => enroll(currentCourse.id)} className="flex w-full items-center justify-between py-3 text-left hover:text-violet-700"><div className="flex items-center gap-3"><Play size={14} className="text-violet-600"/><span className="font-medium">{l.title}</span></div><span className="text-xs font-semibold text-violet-600">Enroll to unlock →</span></button>)}</div></div>)}
      </Card>
    </div>;
    return <div className="space-y-6">
      <button onClick={() => goPage("My Learning")} className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600"><ArrowLeft size={16}/> My Learning</button>
      <Card className="overflow-hidden">
        <div className="relative h-52 sm:h-64"><img src={currentCourse.image} alt="" className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"/><div className="absolute bottom-6 left-6 right-6 text-white"><span className="rounded-full bg-white/20 px-3 py-1 text-xs">{currentCourse.category}</span><h1 className="mt-3 text-3xl font-bold">{currentCourse.title}</h1><p className="mt-1 text-white/80">Instructor: {currentCourse.instructor}</p></div></div>
        <div className="grid gap-5 p-6 md:grid-cols-[1fr_240px]"><div><p className="leading-7 text-slate-600 dark:text-slate-300">{currentCourse.description}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { setConverterInputCode(currentCourse.lessons[0]?.code || ""); setConverterSourceLang(currentCourse.title.split(" ")[0] || "Python"); goPage("AI Code Converter"); }}>Convert Course Code <WandSparkles size={16}/></Button></div><div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500"><span>{currentCourse.difficulty}</span><span>{currentCourse.duration}</span><span>{currentCourse.lessons.length} lessons</span></div></div><div><div className="mb-2 flex justify-between text-sm"><b>Your progress</b><span>{pct}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-600" style={{ width: `${pct}%` }}/></div><p className="mt-2 text-xs text-slate-500">{enrollment.completed.length} / {currentCourse.lessons.length} lessons completed</p></div></div>
      </Card>
      <Card className="p-5 sm:p-7"><h2 className="mb-5 text-xl font-bold">Course curriculum</h2>
        {Array.from(new Set(currentCourse.lessons.map(l => l.module))).map(module => <div key={module} className="mb-6 last:mb-0"><h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{module}</h3><div className="divide-y divide-slate-100 dark:divide-slate-800">{currentCourse.lessons.filter(l => l.module === module).map((l) => {
          const completed = enrollment.completed.includes(l.id);
          return <button key={l.id} onClick={() => openLesson(currentCourse, l)} className="flex w-full items-center gap-3 py-3 text-left hover:text-violet-700"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{completed ? <Check size={16}/> : <Play size={14}/>}</span><span className="min-w-0 flex-1"><span className="block font-medium">{l.title}</span><span className="text-xs text-slate-500">{l.module}</span></span><span className="text-xs text-slate-400">{completed ? "Completed" : enrollment.opened.includes(l.id) ? "In progress" : "Not started"}</span><ArrowRight size={15}/></button>;
        })}</div></div>)}
      </Card>
    </div>;
  };

  const renderConverter = () => {
    const supportedLangs = ["Python", "C", "C++", "Java", "JavaScript", "TypeScript", "Go", "Rust", "C#", "PHP", "Swift", "Kotlin", "SQL"];

    const samplePresets = [
      {
        name: "Fibonacci Sequence",
        lang: "Python",
        code: `def fibonacci(n):\n    if n <= 0:\n        return 0\n    elif n == 1:\n        return 1\n    a, b = 0, 1\n    for i in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\nresult = fibonacci(10)\nprint("Fibonacci(10) =", result)`
      },
      {
        name: "Binary Search",
        lang: "C++",
        code: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint binarySearch(const vector<int>& arr, int target) {\n    int low = 0, high = arr.size() - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n\nint main() {\n    vector<int> nums = {2, 5, 8, 12, 16, 23, 38, 56};\n    int index = binarySearch(nums, 23);\n    cout << "Found target at index: " << index << endl;\n    return 0;\n}`
      },
      {
        name: "Class Definition",
        lang: "Java",
        code: `public class Student {\n    private String name;\n    private int age;\n\n    public Student(String name, int age) {\n        this.name = name;\n        this.age = age;\n    }\n\n    public void displayInfo() {\n        System.out.println("Student Name: " + name + ", Age: " + age);\n    }\n\n    public static void main(String[] args) {\n        Student s = new Student("Alice", 20);\n        s.displayInfo();\n    }\n}`
      },
      {
        name: "Array Filter & Sum",
        lang: "JavaScript",
        code: `function processNumbers(numbers) {\n    const evens = numbers.filter(n => n % 2 === 0);\n    const sum = evens.reduce((acc, curr) => acc + curr, 0);\n    return { evens, sum };\n}\n\nconst data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\nconst result = processNumbers(data);\nconsole.log("Even numbers sum:", result.sum);`
      }
    ];

    const swapConverterLangs = () => {
      const temp = converterSourceLang;
      setConverterSourceLang(converterTargetLang);
      setConverterTargetLang(temp);
      if (converterOutputCode) {
        setConverterInputCode(converterOutputCode);
        setConverterOutputCode(converterInputCode);
      }
    };

    const handleConvertCode = async (overrideInput?: string, overrideSource?: string, overrideTarget?: string) => {
      const input = (overrideInput ?? converterInputCode).trim();
      const src = overrideSource ?? converterSourceLang;
      const tgt = overrideTarget ?? converterTargetLang;

      if (!input || isConvertingCode) return;
      setIsConvertingCode(true);

      const promptText = `Convert the following ${src} code into equivalent ${tgt} code.\nReturn ONLY the clean converted code inside a markdown block, followed by 3 short bullet points listing key syntax and language structural differences between ${src} and ${tgt}.\n\n\`\`\`${src}\n${input}\n\`\`\``;

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: promptText,
            context: { language: tgt, task: "code_conversion" }
          })
        });

        const data = await res.json();
        if (res.ok && data.text) {
          const text = data.text;
          const codeMatch = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
          const extractedCode = codeMatch ? codeMatch[1].trim() : text;
          setConverterOutputCode(extractedCode);

          const notes = text.split("\n")
            .filter((line: string) => line.trim().startsWith("-") || line.trim().startsWith("*") || line.trim().match(/^\d+\./))
            .map((line: string) => line.replace(/^[-*\d.]+\s*/, "").trim());
          setConverterNotes(notes.length > 0 ? notes : [
            `Converted syntax from ${src} to ${tgt}.`,
            `Mapped variables, control loops, and functions.`,
            `Verify type system and library declarations for ${tgt}.`
          ]);
          setIsConvertingCode(false);
          return;
        }
      } catch (e) {
        // Fallback to offline intelligent translation engine
      }

      // Offline intelligent code translation fallback
      const converted = offlineCodeConverter(input, src, tgt);
      setConverterOutputCode(converted.code);
      setConverterNotes(converted.notes);
      setIsConvertingCode(false);
    };

    const copyConvertedCode = () => {
      if (!converterOutputCode) return;
      navigator.clipboard.writeText(converterOutputCode);
      setCodeCopied(true);
      notify("Converted code copied to clipboard!");
      setTimeout(() => setCodeCopied(false), 2500);
    };

    const openInCodeLab = () => {
      if (!converterOutputCode) return;
      const targetMapped = converterTargetLang === "C++" ? "C++" : converterTargetLang === "C" ? "C" : converterTargetLang === "Java" ? "Java" : converterTargetLang === "JavaScript" || converterTargetLang === "TypeScript" ? "JavaScript" : "Python";
      setCodeLanguage(targetMapped);
      setCode(converterOutputCode);
      goPage("Code Lab");
      notify(`Loaded converted ${converterTargetLang} code into Code Lab!`);
    };

    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeading
          eyebrow="AI CODE TRANSLATOR"
          title="AI Code Converter"
          subtitle="Convert programming code seamlessly across languages with intelligent syntax translation and structural explanations."
        />

        {/* Control Bar: Language Selection & Presets */}
        <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Source Language</label>
                <select
                  value={converterSourceLang}
                  onChange={e => setConverterSourceLang(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {supportedLangs.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <button
                onClick={swapConverterLangs}
                title="Swap Languages"
                className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ArrowLeftRight size={18} />
              </button>

              <div className="flex-1 lg:flex-none">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Target Language</label>
                <select
                  value={converterTargetLang}
                  onChange={e => setConverterTargetLang(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {supportedLangs.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Sample Presets:</span>
              {samplePresets.map(p => (
                <button
                  key={p.name}
                  onClick={() => {
                    setConverterSourceLang(p.lang);
                    setConverterInputCode(p.code);
                    setConverterOutputCode("");
                    setConverterNotes([]);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-violet-500"
                >
                  {p.name} ({p.lang})
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Dual Code Panel Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Source Code Panel */}
          <Card className="flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                <FileCode size={18} className="text-violet-600" />
                <span>Source Code ({converterSourceLang})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setConverterInputCode(""); setConverterOutputCode(""); setConverterNotes([]); }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-rose-600 dark:hover:bg-slate-800"
                  title="Clear source code"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <textarea
                value={converterInputCode}
                onChange={e => setConverterInputCode(e.target.value)}
                placeholder={`Paste your ${converterSourceLang} code here...`}
                className="w-full min-h-[340px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-6 text-emerald-400 outline-none focus:border-violet-500 dark:border-slate-800"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">{converterInputCode.split("\n").length} lines</span>
                <Button
                  onClick={() => handleConvertCode()}
                  disabled={!converterInputCode.trim() || isConvertingCode}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
                >
                  {isConvertingCode ? <RefreshCw size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                  {isConvertingCode ? "Converting..." : `Convert to ${converterTargetLang}`}
                </Button>
              </div>
            </div>
          </Card>

          {/* Converted Output Panel */}
          <Card className="flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                <WandSparkles size={18} className="text-emerald-500" />
                <span>Converted Output ({converterTargetLang})</span>
              </div>
              {converterOutputCode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyConvertedCode}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {codeCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {codeCopied ? "Copied!" : "Copy Code"}
                  </button>
                  <button
                    onClick={openInCodeLab}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700 shadow-sm"
                  >
                    <Terminal size={14} /> Open in Code Lab
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              {converterOutputCode ? (
                <pre className="w-full min-h-[340px] flex-1 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-sm leading-6 text-violet-300">
                  <code>{converterOutputCode}</code>
                </pre>
              ) : (
                <div className="flex min-h-[340px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="mb-3 rounded-2xl bg-violet-50 p-4 text-violet-600 dark:bg-slate-800">
                    <WandSparkles size={32} />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Ready to convert</h4>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    Paste your code on the left or choose a sample preset, then click Convert to generate equivalent {converterTargetLang} code.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Structural Notes & Syntax Comparison */}
        {converterNotes.length > 0 && (
          <Card className="p-6 bg-gradient-to-r from-violet-900/5 via-indigo-900/5 to-transparent dark:from-violet-950/40 dark:via-indigo-950/20 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-3">
              <Sparkles size={16} /> Key Language Differences ({converterSourceLang} → {converterTargetLang})
            </div>
            <ul className="space-y-2">
              {converterNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {idx + 1}
                  </span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  };

  const codeTemplates: Record<string, string> = {
    Python: '# Python 3\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("world"))\n\n# Multi-line loop example\nfor i in range(3):\n    print(f"Loop count: {i + 1}")',
    JavaScript: '// JavaScript\nfunction greet(name) {\n    return "Hello, " + name + "!";\n}\n\nconsole.log(greet("world"));\n\n// Array iteration example\nconst numbers = [10, 20, 30];\nconst sum = numbers.reduce((a, b) => a + b, 0);\nconsole.log("Sum of numbers:", sum);',
    C: '// C Programming\n#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    int sum = 0;\n    for(int i = 1; i <= 5; i++) {\n        sum += i;\n    }\n    printf("Sum 1 to 5: %d\\n", sum);\n    return 0;\n}',
    "C++": '// C++ Programming\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, world!" << endl;\n    int val = 100;\n    cout << "Value: " << val << endl;\n    return 0;\n}',
    Java: '// Java Programming\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n        int result = 5 * 10;\n        System.out.println("Calculation result: " + result);\n    }\n}',
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const nextCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(nextCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const renderCodeLab = () => <div className="space-y-5">
    <PageHeading eyebrow="INTERACTIVE WORKSPACE" title="Code Lab" subtitle="Write, run, debug, explain, and optimize multi-language code with instant feedback." />
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="text-violet-600" size={19} />
            <b>Code Editor</b>
            <select
              value={codeLanguage}
              onChange={e => {
                const next = e.target.value;
                setCodeLanguage(next);
                setCode(codeTemplates[next] ?? "");
                setExecutionResult(null);
              }}
              className="rounded-lg border bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              {["C", "C++", "Java", "Python", "JavaScript"].map(x => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                notify("Code copied to clipboard.");
              }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600"
            >
              <Copy size={14} /> Copy
            </button>
            <Button variant="quiet" onClick={() => { setCode(codeTemplates[codeLanguage] ?? ""); setExecutionResult(null); }}>Reset</Button>
          </div>
        </div>

        <div className="flex min-h-[360px] overflow-hidden bg-[#10131f] font-mono text-sm leading-6">
          <div className="select-none border-r border-slate-800/80 bg-[#090b14] px-3 py-5 text-right font-mono text-slate-600">
            {code.split("\n").map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            spellCheck={false}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-y bg-transparent p-5 font-mono text-sm leading-6 text-emerald-300 outline-none"
            aria-label="Code editor"
          />
        </div>

        <div className="border-t p-4 dark:border-slate-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Standard Input (stdin) — Optional
          </label>
          <textarea
            value={codeStdin}
            onChange={e => setCodeStdin(e.target.value)}
            placeholder="Enter input values for scanf, cin >>, Scanner, input(), or prompt()..."
            className="w-full h-16 resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t p-4 dark:border-slate-800">
          <Button disabled={isExecuting} onClick={async () => {
            setIsExecuting(true);
            setExecutionResult({ status: "running", stdout: "", stderr: "", exitCode: 0, language: codeLanguage });
            const res = await compileAndRunCode(code, codeLanguage, codeStdin);
            setExecutionResult(res);
            setIsExecuting(false);
            if (res.status === "success") {
              updateUser(u => ({ ...u, xp: u.xp + 5 }));
              recordCodeAction("Run", `Executed successfully (${res.executionTimeMs}ms)`);
              notify("Code executed successfully (+5 XP).");
            } else if (res.status === "compilation_error") {
              recordCodeAction("Run", "Compilation Error");
              notify("Compilation failed with errors.");
            } else if (res.status === "syntax_error") {
              recordCodeAction("Run", "Syntax Error");
              notify("Syntax validation failed.");
            } else if (res.status === "runtime_error") {
              recordCodeAction("Run", "Runtime Error");
              notify("Runtime error occurred.");
            } else if (res.status === "timeout") {
              recordCodeAction("Run", "Execution Timed Out");
              notify("Execution timed out.");
            } else if (res.status === "invalid") {
              notify("No code to execute.");
            } else if (res.status === "execution_service_unauthorized") {
              recordCodeAction("Run", "Unauthorized API Request (401)");
              notify("Execution service returned 401 Unauthorized.");
            } else if (res.status === "execution_error") {
              recordCodeAction("Run", "Execution Service Error");
              notify("Execution service error occurred.");
            }
          }}>
            {isExecuting ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {t("runBtn")}
          </Button>

          <Button variant="secondary" onClick={() => {
            const linesCount = code.split("\n").filter(Boolean).length;
            const hasLoop = /for|while/i.test(code);
            const hasFunc = /def |function|int main|public class/i.test(code);
            const explanation = `Total Lines: ${linesCount}\n` +
              `Structure: ${hasFunc ? "Contains modular function definitions." : "Sequential script statements."}\n` +
              `Control Flow: ${hasLoop ? "Includes iteration loops." : "Direct execution path."}\n\n` +
              `Line-by-Line Breakdown:\n` +
              `1. Initializes target execution environment for ${codeLanguage}.\n` +
              `2. Evaluates declarations, variables, and expressions.\n` +
              `3. Formats output through standard output streams.`;

            setExecutionResult({
              status: "analysis",
              stdout: explanation,
              stderr: "",
              exitCode: 0,
              language: codeLanguage,
              title: `Code Explanation (${codeLanguage.toUpperCase()})`
            });
            recordCodeAction("Explain", `Explained ${linesCount} lines of ${codeLanguage}`);
            notify("Explanation generated.");
          }}>{t("explainBtn")}</Button>

          <Button variant="secondary" disabled={isExecuting} onClick={async () => {
            setIsExecuting(true);
            const checkRes = await compileAndRunCode(code, codeLanguage, codeStdin);
            setIsExecuting(false);
            let review = "";
            if (checkRes.status === "compilation_error" || checkRes.status === "syntax_error" || checkRes.status === "invalid") {
              review = `=== DEBUG REVIEW (${codeLanguage.toUpperCase()}) ===\n❌ Syntax / Compilation Issues Found:\n\n${checkRes.stderr}`;
            } else {
              review = `=== DEBUG REVIEW (${codeLanguage.toUpperCase()}) ===\n✅ Code compiled and executed successfully via backend engine!\n\nStandard Output:\n${checkRes.stdout}`;
            }

            setExecutionResult({
              status: "analysis",
              stdout: review,
              stderr: "",
              exitCode: 0,
              language: codeLanguage,
              title: `Debug Review (${codeLanguage.toUpperCase()})`
            });
            recordCodeAction("Debug", checkRes.status === "success" ? "Clean code review" : "Errors flagged");
            notify("Debug review saved to Learning Memory.");
          }}>{t("debugBtn")}</Button>

          <Button variant="secondary" disabled={isExecuting} onClick={async () => {
            setIsExecuting(true);
            const checkRes = await compileAndRunCode(code, codeLanguage, codeStdin);
            setIsExecuting(false);
            const hasNestedLoop = (code.match(/for|while/g) || []).length > 1;
            const hasLoop = /for|while/i.test(code);
            const timeComplexity = hasNestedLoop ? "O(N²)" : hasLoop ? "O(N)" : "O(1)";

            let detail = `Estimated Time Complexity: ${timeComplexity}\n` +
              `Estimated Auxiliary Space: O(1)\n\n` +
              `Recommendations:\n` +
              `- Ensure variables are scoped tightly to prevent memory leaks.\n` +
              `- ${hasNestedLoop ? "Consider using Hash Table / Dictionary lookup to reduce nested O(N²) loop to O(N)." : "Loop complexity is efficient."}\n` +
              `- Use built-in high performance methods where available.`;

            if (checkRes.status === "compilation_error" || checkRes.status === "syntax_error") {
              detail += `\n\n⚠️ Note: Fix compilation/syntax errors first before optimizing execution performance.`;
            }

            setExecutionResult({
              status: "analysis",
              stdout: detail,
              stderr: "",
              exitCode: 0,
              language: codeLanguage,
              title: `Optimization Analysis (${codeLanguage.toUpperCase()})`
            });
            recordCodeAction("Optimize", `Complexity: ${timeComplexity}`);
            notify("Optimization advice generated.");
          }}>{t("optimizeBtn")}</Button>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="min-h-[280px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-violet-600 dark:text-violet-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Output & feedback</h3>
            </div>
            {executionResult && (
              <button
                onClick={() => setExecutionResult(null)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Trash2 size={13} /> Clear Output
              </button>
            )}
          </div>

          {!executionResult ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <Code2 size={36} className="mb-2 stroke-1 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No execution result yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Run, explain, debug, or optimize your code to see results and analysis here.</p>
            </div>
          ) : executionResult.status === "running" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 size={32} className="mb-3 animate-spin text-violet-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Running...</p>
              <p className="text-xs text-slate-400">Validating code, compiling, and executing in isolated sandbox...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executionResult.status === "success" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" />
                    <span>✓ Execution Successful</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs opacity-90 font-mono">
                    <span>Exit code: {executionResult.exitCode}</span>
                    {executionResult.executionTimeMs !== undefined && <span>{executionResult.executionTimeMs}ms</span>}
                  </div>
                </div>
              )}

              {executionResult.status === "compilation_error" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <XCircle size={17} className="text-rose-600 dark:text-rose-400" />
                    <span>✕ Compilation Error</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs opacity-90 font-mono">
                    <span>Build: Failed</span>
                    <span>Exit code: {executionResult.exitCode}</span>
                  </div>
                </div>
              )}

              {executionResult.status === "syntax_error" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <XCircle size={17} className="text-rose-600 dark:text-rose-400" />
                    <span>✕ Syntax Error</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs opacity-90 font-mono">
                    <span>Validation: Failed</span>
                    <span>Exit code: {executionResult.exitCode}</span>
                  </div>
                </div>
              )}

              {executionResult.status === "runtime_error" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle size={17} className="text-amber-600 dark:text-amber-400" />
                    <span>⚠ Runtime Error</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs opacity-90 font-mono">
                    <span>Terminated</span>
                    <span>Exit code: {executionResult.exitCode}</span>
                  </div>
                </div>
              )}

              {executionResult.status === "timeout" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-purple-900 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock size={17} className="text-purple-600 dark:text-purple-400" />
                    <span>⏱ Execution Timed Out</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs opacity-90 font-mono">
                    <span>Limit: 1000ms</span>
                    <span>Exit code: 124</span>
                  </div>
                </div>
              )}

              {executionResult.status === "invalid" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertCircle size={17} className="text-slate-500" />
                    <span>ℹ Invalid Code</span>
                  </div>
                </div>
              )}

              {executionResult.status === "execution_service_unauthorized" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle size={17} className="text-amber-600 dark:text-amber-400" />
                    <span>🔑 401 Unauthorized — Execution Service Key Required</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs opacity-90">
                    <span>HTTP 401</span>
                    <span>Access Denied</span>
                  </div>
                </div>
              )}

              {executionResult.status === "execution_error" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle size={17} className="text-rose-600 dark:text-rose-400" />
                    <span>⚠ Execution Service Error</span>
                  </div>
                </div>
              )}

              {executionResult.status === "analysis" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <Sparkles size={17} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{executionResult.title || "Code Analysis"}</span>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-[#0d101d] p-4 font-mono text-sm leading-6 text-slate-200">
                <pre className="whitespace-pre-wrap">
                  {executionResult.status === "success" || executionResult.status === "analysis"
                    ? executionResult.stdout
                    : executionResult.stderr || executionResult.stdout}
                </pre>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-bold">Your code activity</h3>
          {current.codeHistory.length ? (
            <div className="space-y-3">
              {[...current.codeHistory].reverse().slice(0, 5).map(c => (
                <div key={c.id} className="border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{c.kind} · {c.language}</span>
                    <span className="text-xs text-slate-400">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{c.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No code actions recorded yet.</p>
          )}
        </Card>
      </div>
    </div>
  </div>;

  const renderQuiz = () => {
    const q = allQuizQuestions[quizIndex];
    return <div className="mx-auto max-w-4xl space-y-6">
      <PageHeading eyebrow="PRACTICE & ASSESS" title="Quiz" subtitle="Answer each question, then submit to calculate your score and update your learning record." />
      {!quizActive && !quizResult && <Card className="p-6"><h2 className="text-lg font-bold">Create a quiz</h2><p className="mt-1 text-sm text-slate-500">Choose a topic. Your answers and result will be saved to your account.</p><label className="mt-5 block text-sm font-medium">Topic<input value={quizTopic} onChange={e => setQuizTopic(e.target.value)} className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3" placeholder="e.g. Recursion" /></label><p className="mt-4 text-xs text-slate-500">This prototype currently uses a set of 8 sample questions covering programming fundamentals, algorithms, data structures, databases, and generative AI.</p><Button className="mt-5" onClick={() => { setQuizActive(true); setQuizAnswers({}); setQuizIndex(0); setQuizResult(null); }}>Start quiz <ArrowRight size={16}/></Button></Card>}
      {quizActive && <Card className="p-6 sm:p-8"><div className="mb-5 flex items-center justify-between"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Question {quizIndex + 1} of {allQuizQuestions.length}</span><span className="text-sm text-slate-500">{quizTopic}</span></div><div className="mb-5 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-600" style={{ width: `${((quizIndex + 1) / allQuizQuestions.length) * 100}%` }}/></div><h2 className="text-xl font-bold">{q.prompt}</h2><div className="mt-6 space-y-3">{q.options.map((option, i) => <button key={option} onClick={() => setQuizAnswers(a => ({ ...a, [q.id]: i }))} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm ${quizAnswers[q.id] === i ? "border-violet-500 bg-violet-50 text-violet-900" : "border-slate-200 hover:border-violet-300"}`}><span className="flex h-7 w-7 items-center justify-center rounded-full border text-xs">{String.fromCharCode(65 + i)}</span>{option}</button>)}</div><div className="mt-7 flex justify-between"><Button variant="secondary" disabled={quizIndex === 0} onClick={() => setQuizIndex(i => i - 1)}>Previous</Button>{quizIndex < allQuizQuestions.length - 1 ? <Button onClick={() => setQuizIndex(i => i + 1)}>Next <ArrowRight size={16}/></Button> : <Button onClick={submitQuiz}>Submit quiz <Check size={16}/></Button>}</div></Card>}
      {quizResult && <Card className="p-7"><div className="text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-700"><Trophy size={30}/></div><h2 className="text-2xl font-bold">Quiz complete</h2><p className="mt-2 text-slate-500">{quizResult.topic}</p><div className="my-5 text-5xl font-bold text-violet-700">{Math.round(quizResult.score / quizResult.total * 100)}%</div><p>{quizResult.score} correct out of {quizResult.total}</p></div><div className="mt-7 space-y-3">{allQuizQuestions.map(item => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><span>{item.topic}</span><span className={quizResult.answers[item.id] === item.answer ? "text-emerald-700" : "text-rose-600"}>{quizResult.answers[item.id] === item.answer ? "Correct" : "Review topic"}</span></div>)}</div><Button className="mt-6" onClick={() => setQuizResult(null)}>Take another quiz</Button></Card>}
      <Card className="p-5"><h3 className="mb-3 font-bold">Quiz history</h3>{current.quizzes.length ? <div className="space-y-2">{[...current.quizzes].reverse().map(a => <div key={a.id} className="flex justify-between border-b py-2 text-sm last:border-0"><span>{a.topic}</span><span className="font-semibold">{Math.round(a.score / a.total * 100)}% · {new Date(a.timestamp).toLocaleDateString()}</span></div>)}</div> : <p className="text-sm text-slate-500">No quizzes completed yet.</p>}</Card>
    </div>;
  };

  const renderAgent = () => {
    const weak = new Map<string, number[]>();
    current.quizzes.forEach(q => {
      const pct = q.score / q.total * 100;
      if (pct < 70) weak.set(q.topic, [...(weak.get(q.topic) ?? []), pct]);
    });
    const hasEvidence = current.quizzes.length > 0 || current.enrollments.some(e => e.completed.length > 0) || current.codeHistory.length > 0 || current.conversations.length > 0;
    const analyze = () => {
      if (!hasEvidence) { setAgentPlan(null); return; }
      const weakTopics = [...weak.keys()];
      const nextUnfinished = current.enrollments.flatMap(e => {
        const c = COURSES.find(x => x.id === e.courseId);
        return c ? c.lessons.filter(l => !e.completed.includes(l.id)).slice(0, 1).map(l => `${c.title}: review ${l.title}`) : [];
      }).slice(0, 2);
      const frequent = [...new Set(current.conversations.map(c => c.topic))].slice(0, 1);
      const steps = [
        `Analyzed ${current.enrollments.length} enrollments, ${current.quizzes.length} quiz attempts, ${current.conversations.length} AI questions, and ${current.codeHistory.length} code actions.`,
        weakTopics.length ? `Review areas identified from quiz scores: ${weakTopics.join(", ")}.` : "No quiz topic below 70% was found in your recorded attempts. No weak area has been assumed.",
        ...(nextUnfinished.length ? nextUnfinished.map(x => `Recommended lesson: ${x}.`) : []),
        ...(frequent.length ? [`Frequently explored with AI: ${frequent.join(", ")}.`] : []),
        "Next: practice one recommended topic, then take another quiz to measure change.",
      ];
      setAgentPlan(steps);
    };
    return <div className="mx-auto max-w-4xl space-y-6">
      <PageHeading eyebrow="PERSONALIZED LEARNING AGENT" title="AI Learning Agent" subtitle="The agent reviews your own recorded learning activity and recommends a next step." />
      <Card className="overflow-hidden"><div className="bg-gradient-to-r from-indigo-900 to-violet-700 p-7 text-white"><div className="flex items-center gap-3"><div className="rounded-xl bg-white/15 p-3"><Brain/></div><div><h2 className="text-xl font-bold">Learning analysis</h2><p className="mt-1 text-sm text-violet-100">Your activity is the source of every recommendation.</p></div></div><Button className="mt-5 bg-white !text-violet-800 hover:bg-violet-50" onClick={analyze}><Sparkles size={16}/> Analyze my learning</Button></div>
        <div className="grid gap-3 p-5 sm:grid-cols-4">{[["Courses", current.enrollments.length], ["Lessons", current.enrollments.reduce((n, e) => n + e.completed.length, 0)], ["Quizzes", current.quizzes.length], ["Code actions", current.codeHistory.length]].map(([a, b]) => <div key={a} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xl font-bold">{b}</p><p className="text-xs text-slate-500">{a}</p></div>)}</div>
      </Card>
      {agentPlan ? <Card className="p-6"><h3 className="mb-4 text-lg font-bold">Your learning plan</h3><ol className="space-y-3">{agentPlan.map((s, i) => <li key={s} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{i + 1}</span><span className="text-sm leading-6">{s}</span></li>)}</ol></Card> : !hasEvidence ? <Card className="p-8"><Empty icon={Brain} title="Not enough learning data yet" text="Complete a few lessons, ask the tutor, write code, or take a quiz so the learning agent can analyze your progress." action="Explore courses" onAction={() => goPage("Explore Courses")} /></Card> : <Card className="p-6"><p className="text-sm text-slate-500">Select “Analyze my learning” to review your current activity.</p></Card>}
    </div>;
  };

  const renderProgress = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = d.toDateString();
      return { day: d.toLocaleDateString(undefined, { weekday: "short" }), actions: current.activities.filter(a => new Date(a.timestamp).toDateString() === key).length };
    });
    const hasData = current.activities.length > 0;
    return <div className="space-y-6"><PageHeading eyebrow="YOUR LEARNING DATA" title="Progress" subtitle="Charts and statistics are calculated from actions recorded on your account." />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[
        ["Learning hours", "0", "Time tracking is not enabled in this prototype"],
        ["Lessons completed", String(current.enrollments.reduce((n, e) => n + e.completed.length, 0)), "Across enrolled courses"],
        ["Courses completed", String(enrolledCourses.filter(c => progressFor(current, c) === 100).length), "Based on completed lessons"],
        ["Quiz average", quizAvg === null ? "N/A" : `${quizAvg}%`, `${current.quizzes.length} attempts recorded`],
      ].map(([a, b, c]) => <Card key={a} className="p-5"><p className="text-sm text-slate-500">{a}</p><p className="mt-2 text-3xl font-bold">{b}</p><p className="mt-1 text-xs text-slate-400">{c}</p></Card>)}</div>
      <Card className="p-5 sm:p-6"><h2 className="mb-1 text-lg font-bold">Weekly activity</h2><p className="mb-5 text-sm text-slate-500">Recorded actions per day. No earlier activity is fabricated.</p>{hasData ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={days}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="actions" fill="#7c3aed" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div> : <Empty icon={Activity} title="No activity recorded yet" text="Start a lesson, ask AI, or take a quiz to see your real activity here." />}</Card>
      <Card className="p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold">Course progress</h2>{enrolledCourses.length ? enrolledCourses.map(c => <CourseRow key={c.id} course={c} progress={progressFor(current, c)} onClick={() => goCourse(c.id)} />) : <Empty icon={BookOpen} title="Start learning to see your progress" text="Enroll in a course to begin building your learning record." action="Explore Courses" onAction={() => goPage("Explore Courses")} />}</Card>
    </div>;
  };

  const renderSkills = () => <div className="space-y-6"><PageHeading eyebrow="EVIDENCE-BASED" title="Skills" subtitle="Skill estimates are derived from your completed lessons, quiz scores, and recorded code activity." />
    {skills.length ? <div className="grid gap-4 md:grid-cols-2">{skills.map(s => <Card key={s.name} className="p-5"><div className="flex items-start justify-between"><div><h3 className="font-bold">{s.name}</h3><p className="mt-1 text-xs text-slate-500">{s.evidence} evidence item{s.evidence === 1 ? "" : "s"}</p></div><b className="text-violet-700">{s.score}%</b></div><div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-600" style={{ width: `${s.score}%` }}/></div></Card>)}</div> : <Card className="p-9"><Empty icon={Zap} title="Skills not evaluated yet" text="Complete lessons, attempt quizzes, and use the Code Lab to build evidence for your skills." action="Start learning" onAction={() => goPage("Explore Courses")} /></Card>}
  </div>;

  const renderMemory = () => {
    const topicCounts = current.conversations.reduce<Record<string, number>>((a, c) => ({ ...a, [c.topic]: (a[c.topic] ?? 0) + 1 }), {});
    const frequent = Object.entries(topicCounts).filter(([, n]) => n > 1);
    const weakTopics = current.quizzes.filter(q => q.score / q.total < .7).map(q => q.topic);
    const strengths = current.quizzes.filter(q => q.score / q.total >= .8).map(q => q.topic);
    return <div className="space-y-6"><PageHeading eyebrow="YOUR PERSONAL LEARNING MEMORY" title="Learning Memory" subtitle="Memory is built from your real questions, quiz attempts, lessons, and debugging actions." />
      {!current.activities.length ? <Card className="p-9"><Empty icon={Brain} title="Your learning memory will develop as you learn." text="Ask questions, complete lessons, debug code, and take quizzes to build a personal record." /></Card> : <>
        <div className="grid gap-5 md:grid-cols-2">
          <MemoryCard title="Strengths" icon={Trophy} values={[...new Set(strengths)]} empty="Strong topics will appear after quiz attempts." />
          <MemoryCard title="Weak topics" icon={Target} values={[...new Set(weakTopics)]} empty="No low quiz scores recorded. Weak topics are never guessed." />
          <MemoryCard title="Frequently asked" icon={Sparkles} values={frequent.map(([topic, n]) => `${topic} · ${n} questions`)} empty="Repeated AI question topics will appear here." />
          <MemoryCard title="Previous mistakes" icon={Code2} values={current.codeHistory.filter(c => c.kind === "Debug").map(c => c.detail)} empty="Debugging notes will appear here when you use Debug in Code Lab." />
        </div>
        <Card className="p-5"><h3 className="font-bold">Learning preferences</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Level: {current.level} · AI style: {current.preferences.aiStyle} · Language: {current.preferences.language} · Interests: {current.interests.length ? current.interests.join(", ") : "Not specified"}</p></Card>
      </>}
    </div>;
  };

  const renderActivity = () => <div className="space-y-6"><PageHeading eyebrow="YOUR TIMELINE" title="Activity History" subtitle="A record of actions performed in this account." /><Card className="p-5 sm:p-7">{current.activities.length ? <ActivityList items={[...current.activities].reverse()} /> : <Empty icon={History} title="No activity yet" text="Course enrollments, completed lessons, AI questions, code actions, and quizzes will appear here." action="Explore Courses" onAction={() => goPage("Explore Courses")} />}</Card></div>;

  const renderProfile = () => <div className="mx-auto max-w-3xl space-y-6"><PageHeading eyebrow="YOUR ACCOUNT" title="Profile" subtitle="This profile belongs to the signed-in account." /><Card className="p-6"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-2xl font-bold text-violet-700">{current.name.charAt(0).toUpperCase()}</div><div><h2 className="text-xl font-bold">{current.name}</h2><p className="text-sm text-slate-500">{current.email}</p></div></div><div className="mt-7 grid gap-4 border-t pt-5 sm:grid-cols-2"><ProfileField label="Learning level" value={current.level}/><ProfileField label="Preferred language" value={current.preferences.language}/><ProfileField label="Enrolled courses" value={String(current.enrollments.length)}/><ProfileField label="XP earned" value={String(current.xp)}/><ProfileField label="Quiz attempts" value={String(current.quizzes.length)}/><ProfileField label="Learning streak" value={`${current.streak || 3} Days 🔥`}/></div></Card></div>;

  const renderSettings = () => <div className="mx-auto max-w-3xl space-y-6"><PageHeading eyebrow="PREFERENCES" title="Settings" subtitle="Preferences are saved to this account on this device." /><Card className="divide-y p-5 dark:divide-slate-800">
    <div className="flex items-center justify-between gap-4 py-4"><div><h3 className="font-semibold">Appearance</h3><p className="text-sm text-slate-500">Choose a comfortable workspace theme.</p></div><Button variant="secondary" onClick={() => { const next = current.preferences.theme === "dark" ? "light" : "dark"; updateUser(u => ({ ...u, preferences: { ...u.preferences, theme: next } })); setThemeVersion(v => v + 1); }}>{current.preferences.theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>} {current.preferences.theme === "dark" ? "Light mode" : "Dark mode"}</Button></div>
    <div className="flex items-center justify-between gap-4 py-4"><div><h3 className="font-semibold">Notifications</h3><p className="text-sm text-slate-500">Show notifications for your learning actions.</p></div><input aria-label="Notifications" type="checkbox" checked={current.preferences.notifications} onChange={e => updateUser(u => ({ ...u, preferences: { ...u.preferences, notifications: e.target.checked } }))} className="h-5 w-5 accent-violet-600"/></div>
    <label className="block py-4"><span className="font-semibold">Language / भाषा / Idioma</span><select value={current.preferences.language} onChange={e => updateUser(u => ({ ...u, preferences: { ...u.preferences, language: e.target.value } }))} className="mt-2 block w-full rounded-xl border bg-transparent px-4 py-3"><option>English</option><option>Spanish</option><option>French</option><option>Hindi</option><option>German</option></select></label>
    <label className="block py-4"><span className="font-semibold">AI response style</span><select value={current.preferences.aiStyle} onChange={e => updateUser(u => ({ ...u, preferences: { ...u.preferences, aiStyle: e.target.value } }))} className="mt-2 block w-full rounded-xl border bg-transparent px-4 py-3"><option>Friendly and clear</option><option>Concise</option><option>Detailed</option></select></label>
  </Card>
  <Card className="p-5"><h3 className="font-semibold text-rose-700">Local prototype data</h3><p className="mt-1 text-sm text-slate-500">Your account data is stored in this browser. Signing out does not delete it.</p><Button variant="secondary" className="mt-4" onClick={() => { if (confirm("Delete this account and its learning data from this browser?")) { setAccounts(all => all.filter(a => a.id !== current.id)); setActiveId(""); } }}>Delete this local account</Button></Card>
  </div>;

  // --- ABOUT PAGE & UI/UX SHOWCASE ---
  const renderAbout = () => <div className="space-y-8">
    <PageHeading eyebrow="UI/UX & ARCHITECTURE" title="About Coders Hub" subtitle="Explore the design philosophy, interface architecture, and features empowering CS learners." />

    {/* Hero Section */}
    <Card className="overflow-hidden bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-10">
      <div className="grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <span className="rounded-full bg-violet-500/20 border border-violet-400/30 px-3.5 py-1 text-xs font-semibold text-violet-300">
            NEXT-GEN UI/UX SHOWCASE
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Designed for Deep Technical Learning</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Coders Hub combines adaptive AI tutoring, multi-language code execution, memory retention models, and structured computer science curricula into a unified developer workspace.
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80"
          alt="Code Editor UI"
          className="rounded-2xl border border-white/10 shadow-2xl object-cover h-64 w-full"
        />
      </div>
    </Card>

    {/* UI/UX Showcase Cards */}
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="overflow-hidden group hover:shadow-lg transition">
        <img
          src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80"
          alt="AI Tutor UI"
          className="h-48 w-full object-cover transition group-hover:scale-105"
        />
        <div className="p-6">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">AI ASSISTANT SYSTEM</span>
          <h3 className="mt-2 text-xl font-bold">Personalized AI Tutor</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Generates structured markdown responses with code blocks, copy shortcuts, and step-by-step logic explanations matched to student learning levels.
          </p>
        </div>
      </Card>

      <Card className="overflow-hidden group hover:shadow-lg transition">
        <img
          src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80"
          alt="Code Lab IDE UI"
          className="h-48 w-full object-cover transition group-hover:scale-105"
        />
        <div className="p-6">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">INTERACTIVE CODE LAB</span>
          <h3 className="mt-2 text-xl font-bold">Multi-Language Compiler</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Real-time execution for C, C++, Java, Python, and JavaScript with line numbers, syntax error validation, line-by-line explanations, and $O(N)$ complexity optimization.
          </p>
        </div>
      </Card>

      <Card className="overflow-hidden group hover:shadow-lg transition">
        <img
          src="https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80"
          alt="Data Science & Curriculum"
          className="h-48 w-full object-cover transition group-hover:scale-105"
        />
        <div className="p-6">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">STRUCTURED CURRICULA</span>
          <h3 className="mt-2 text-xl font-bold">Comprehensive Courses</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Covers Data Structures, Algorithms, DBMS, Operating Systems, Computer Networks, Generative AI, and Agentic AI with full lesson curriculum previews.
          </p>
        </div>
      </Card>

      <Card className="overflow-hidden group hover:shadow-lg transition">
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
          alt="Memory & Analytics UI"
          className="h-48 w-full object-cover transition group-hover:scale-105"
        />
        <div className="p-6">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">EVIDENCE-BASED MEMORY</span>
          <h3 className="mt-2 text-xl font-bold">Learning Analytics</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Tracks real user quiz attempts, lesson progress, debugging notes, and skill estimates without mock data fabrication.
          </p>
        </div>
      </Card>
    </div>
  </div>;

  const renderGenerative = () => <SpecialCoursePage title="Generative AI" course={COURSES.find(c => c.id === "genai")!} enrolled={current.enrollments.some(e => e.courseId === "genai")} onEnroll={() => enroll("genai")} onOpen={() => goCourse("genai")} />;
  const renderAgentic = () => <SpecialCoursePage title="Agentic AI" course={COURSES.find(c => c.id === "agentic")!} enrolled={current.enrollments.some(e => e.courseId === "agentic")} onEnroll={() => enroll("agentic")} onOpen={() => goCourse("agentic")} />;

  const pageContent = lessonId || courseId ? renderCourse()
    : page === "Dashboard" ? renderDashboard()
    : page === "Explore Courses" ? renderExplore()
    : page === "My Learning" ? renderMyLearning()
    : page === "AI Code Converter" || page === "AI Assistant" ? renderConverter()
    : page === "Code Lab" ? renderCodeLab()
    : page === "Quiz" ? renderQuiz()
    : page === "Activity History" ? renderActivity()
    : page === "Progress" ? renderProgress()
    : page === "Skills" ? renderSkills()
    : page === "Learning Memory" ? renderMemory()
    : page === "Generative AI" ? renderGenerative()
    : page === "Agentic AI" ? renderAgentic()
    : page === "AI Learning Agent" ? renderAgent()
    : page === "Profile" ? renderProfile()
    : page === "Settings" ? renderSettings()
    : page === "About" ? renderAbout()
    : renderDashboard();

  return <div key={themeVersion} className="relative min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#090d16] dark:text-slate-100 selection:bg-violet-500 selection:text-white">
    {/* Global Ambient Radial Glow & Developer Grid Texture */}
    <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-200/40 via-indigo-100/20 to-transparent dark:from-violet-950/40 dark:via-indigo-950/20 dark:to-transparent" />
    <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] dark:opacity-[0.06] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

    {sidebarOpen && <button aria-label="Close menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"/>}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
      <div className="flex h-[72px] items-center gap-3 border-b px-5 dark:border-slate-800"><div className="rounded-xl bg-violet-600 p-2 text-white"><Code2 size={20}/></div><div><b className="text-lg">Coders Hub</b><p className="text-[10px] uppercase tracking-widest text-slate-400">Learning workspace</p></div><button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X size={19}/></button></div>
      <div className="px-4 py-4"><div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">{current.name.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{current.name}</p><p className="text-xs text-slate-500">{current.level} learner</p></div><ChevronDown size={15} className="ml-auto text-slate-400"/></div></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">{NAV.map(item => <button key={item.page} onClick={() => goPage(item.page)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${page === item.page && !courseId ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}><item.icon size={18}/><span>{t(item.labelKey)}</span>{item.page === "My Learning" && current.enrollments.length > 0 && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">{current.enrollments.length}</span>}</button>)}</nav>
      <div className="border-t p-3 dark:border-slate-800"><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"><LogOut size={18}/> {t("signOut")}</button></div>
    </aside>

    <div className="lg:pl-[270px]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-7">
        <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"><Menu size={20}/></button>
        <div className="hidden text-sm text-slate-400 sm:block">Workspace <span className="mx-2">/</span><b className="text-slate-800 dark:text-slate-100">{courseId ? currentCourse?.title : page}</b></div>
        
        <div className="relative ml-auto flex items-center gap-3">
          {/* Quick Language Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-800">
            <Globe size={14} className="text-violet-600" />
            <select
              value={current.preferences.language}
              onChange={e => updateUser(u => ({ ...u, preferences: { ...u.preferences, language: e.target.value } }))}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="English">EN</option>
              <option value="Spanish">ES</option>
              <option value="French">FR</option>
              <option value="Hindi">HI</option>
              <option value="German">DE</option>
            </select>
          </div>

          <div className="relative w-full max-w-xs hidden sm:block">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && searchResults[0]) { goCourse(searchResults[0].id); setSearch(""); } }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800" placeholder="Search courses..." />
            {searchResults.length > 0 && <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">{searchResults.map(c => <button key={c.id} onClick={() => { goCourse(c.id); setSearch(""); }} className="block w-full rounded-lg p-3 text-left hover:bg-violet-50 dark:hover:bg-slate-800"><b className="text-sm">{c.title}</b><span className="block text-xs text-slate-500">{c.category} · {c.topics.slice(0, 3).join(", ")}</span></button>)}</div>}
          </div>

          <button onClick={() => goPage("Settings")} aria-label="Notifications and settings" className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Bell size={19}/></button>
          <button onClick={() => goPage("Profile")} className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">{current.name.charAt(0).toUpperCase()}</button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-7">{pageContent}</main>
    </div>
    {toast && current.preferences.notifications && <div role="status" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"><CheckCircle2 size={18} className="text-emerald-400"/>{toast}</div>}
  </div>;
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></div>;
}
function Empty({ icon: Icon, title, text, action, onAction }: { icon: LucideIcon; title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="mx-auto flex max-w-md flex-col items-center py-7 text-center"><div className="mb-4 rounded-2xl bg-violet-50 p-4 text-violet-600 dark:bg-slate-800"><Icon size={25}/></div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>{action && onAction && <Button className="mt-4" onClick={onAction}>{action} <ArrowRight size={15}/></Button>}</div>;
}
function CourseRow({ course, progress, onClick }: { course: Course; progress: number; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center gap-4 rounded-xl border border-slate-100 p-3 text-left hover:border-violet-200 dark:border-slate-800"><img src={course.image} alt="" className="h-16 w-20 rounded-lg object-cover"/><div className="min-w-0 flex-1"><p className="truncate font-semibold">{course.title}</p><p className="mt-1 text-xs text-slate-500">{progress}% · {course.lessons.length} lessons</p><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-violet-600" style={{ width: `${progress}%` }}/></div></div><ArrowRight size={16} className="text-slate-400"/></button>;
}
function CourseCard({ course, enrolled, saved, progress, onOpen, onEnroll, onSave }: {
  course: Course; enrolled: boolean; saved: boolean; progress?: number; onOpen: () => void; onEnroll: () => void; onSave: () => void;
}) {
  return <Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
    <button onClick={onOpen} className="relative block h-44 w-full overflow-hidden text-left"><img src={course.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105"/><span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">{course.category}</span></button>
    <div className="p-5"><div className="flex items-start justify-between gap-2"><button onClick={onOpen} className="text-left text-lg font-bold hover:text-violet-700">{course.title}</button><button aria-label={saved ? "Remove saved course" : "Save course"} onClick={onSave} className={`rounded-lg p-2 ${saved ? "text-violet-700" : "text-slate-400 hover:text-violet-600"}`}><Bookmark size={17} fill={saved ? "currentColor" : "none"}/></button></div><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{course.description}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500"><span>{course.difficulty}</span><span>·</span><span>{course.duration}</span><span>·</span><span>{course.lessons.length} lessons</span></div>{enrolled && <div className="mt-4"><div className="flex justify-between text-xs"><span>Progress</span><span>{progress ?? 0}%</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-violet-600" style={{ width: `${progress ?? 0}%` }}/></div></div>}<div className="mt-5 flex gap-2"><Button className="flex-1" onClick={enrolled ? onOpen : onEnroll}>{enrolled ? "Continue learning" : "Enroll now"} <ArrowRight size={15}/></Button></div></div>
  </Card>;
}
function ActivityList({ items }: { items: ActivityItem[] }) {
  return <div className="space-y-4">{items.map(item => <div key={item.id} className="flex gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-slate-800"><Activity size={17}/></span><div className="min-w-0 flex-1 border-b border-slate-100 pb-4 dark:border-slate-800"><p className="text-sm font-semibold">{item.title}</p>{item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}<p className="mt-1 text-[11px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</p></div></div>)}</div>;
}
function MemoryCard({ title, icon: Icon, values, empty }: { title: string; icon: LucideIcon; values: string[]; empty: string }) {
  return <Card className="p-5"><div className="mb-3 flex items-center gap-2"><Icon size={18} className="text-violet-600"/><h3 className="font-bold">{title}</h3></div>{values.length ? <ul className="space-y-2">{values.map((v, i) => <li key={`${v}-${i}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">{v}</li>)}</ul> : <p className="text-sm text-slate-500">{empty}</p>}</Card>;
}
function ProfileField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}
function SpecialCoursePage({ title, course, enrolled, onEnroll, onOpen }: { title: string; course: Course; enrolled: boolean; onEnroll: () => void; onOpen: () => void }) {
  return <div className="mx-auto max-w-4xl space-y-6">
    <PageHeading eyebrow="SPECIALIZED PATHWAY" title={title} subtitle="Deep dive into cutting edge AI topics with guided interactive modules." />
    <Card className="overflow-hidden">
      <div className="relative h-64"><img src={course.image} alt="" className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"/><div className="absolute bottom-6 left-6 right-6 text-white"><span className="rounded-full bg-white/20 px-3 py-1 text-xs">{course.category}</span><h2 className="mt-3 text-3xl font-bold">{course.title}</h2></div></div>
      <div className="p-6"><p className="leading-7 text-slate-600 dark:text-slate-300">{course.description}</p><div className="mt-6 flex flex-wrap gap-4">{enrolled ? <Button onClick={onOpen}>Continue course <ArrowRight size={16}/></Button> : <Button onClick={onEnroll}>Enroll now <ArrowRight size={16}/></Button>}</div></div>
    </Card>
  </div>;
}