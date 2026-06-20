import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export interface Problem {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly inputFormat: string;
  readonly outputFormat: string;
  readonly constraints: string;
  readonly difficulty: 'Easy' | 'Medium' | 'Hard';
  readonly timeoutMs: number;
  readonly memoryLimitMb: number;
  readonly score: number;
  readonly isPublished: boolean;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly tags?: readonly string[];
}

export interface Testcase {
  readonly id: string;
  readonly problemId: string;
  readonly orderIndex: number;
  readonly input: string;
  readonly expectedOutput: string;
  readonly isSample: boolean;
  readonly score: number;
}

export interface Contest {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly createdBy: string;
  readonly isPublic: boolean;
  readonly problems: string[]; // Problem IDs
  readonly participants: string[]; // Usernames
}

export interface Submission {
  readonly id: string;
  readonly problemId: string;
  readonly problemTitle: string;
  readonly userId: string;
  readonly username: string;
  readonly language: string;
  readonly sourceCode: string;
  status: 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error';
  score: number;
  timeUsedMs: number;
  memoryUsedKb: number;
  readonly stdout?: string;
  readonly stderr?: string;
  readonly createdAt: string;
}

export type UserRole = 'student' | 'admin';

interface GradientContextType {
  readonly role: UserRole;
  readonly setRole: (role: UserRole) => void;
  readonly username: string;
  readonly setUsername: (name: string) => void;
  readonly problems: readonly Problem[];
  readonly testcases: readonly Testcase[];
  readonly contests: readonly Contest[];
  readonly submissions: readonly Submission[];
  readonly addProblem: (problem: Omit<Problem, 'id' | 'createdAt' | 'createdBy'>) => void;
  readonly updateProblem: (id: string, updates: Partial<Problem>) => void;
  readonly deleteProblem: (id: string) => void;
  readonly publishProblem: (id: string, isPublished: boolean) => void;
  readonly addTestcase: (problemId: string, testcase: Omit<Testcase, 'id' | 'problemId' | 'orderIndex'>) => void;
  readonly deleteTestcase: (id: string) => void;
  readonly addContest: (contest: Omit<Contest, 'id' | 'createdBy' | 'participants'>) => void;
  readonly joinContest: (contestId: string) => void;
  readonly submitCode: (problemId: string, language: string, sourceCode: string) => Promise<string>;
  readonly regradeSubmission: (submissionId: string) => void;
  readonly theme: 'light' | 'dark';
  readonly toggleTheme: () => void;
}

const GradientContext = createContext<GradientContextType | undefined>(undefined);

// Seed Data
const DEFAULT_PROBLEMS: Problem[] = [
  {
    id: 'p1',
    title: 'Two Sum',
    slug: 'two-sum',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    inputFormat: 'The first line contains an integer N (the size of array) and target.\nThe second line contains N integers separated by space representing the array elements.',
    outputFormat: 'Print the two indices (0-indexed) separated by space, in ascending order.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
    difficulty: 'Easy',
    timeoutMs: 1000,
    memoryLimitMb: 256,
    score: 100,
    isPublished: true,
    createdBy: 'admin_master',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Array', 'Hash Table']
  },
  {
    id: 'p2',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    inputFormat: 'A single line containing the string `s`.',
    outputFormat: 'Print `true` if the string is valid, or `false` otherwise.',
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses characters only.',
    difficulty: 'Easy',
    timeoutMs: 1000,
    memoryLimitMb: 256,
    score: 100,
    isPublished: true,
    createdBy: 'admin_master',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['String', 'Stack']
  },
  {
    id: 'p3',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating',
    description: 'Given a string `s`, find the length of the longest substring without repeating characters.\n\nFor example, the longest substring without repeating characters for "abcabcbb" is "abc", which has a length of 3.',
    inputFormat: 'A single line containing the string `s`. Note that the string may contain spaces.',
    outputFormat: 'Print a single integer representing the length of the longest substring without repeating characters.',
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    difficulty: 'Medium',
    timeoutMs: 1500,
    memoryLimitMb: 256,
    score: 200,
    isPublished: true,
    createdBy: 'teacher_joy',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['String', 'Sliding Window']
  },
  {
    id: 'p4',
    title: 'Optimal Path Finder (Dijkstra)',
    slug: 'optimal-path-finder',
    description: 'You are given a weighted directed graph of N nodes (numbered 1 to N) and M edges. Find the shortest path distance from node 1 to node N.\n\nIf node N is unreachable from node 1, output -1.',
    inputFormat: 'The first line contains N and M (nodes and edges).\nThe next M lines each contain three integers u, v, and w, representing a directed edge from u to v with weight w.',
    outputFormat: 'Print a single integer representing the shortest path distance, or -1 if unreachable.',
    constraints: '1 <= N <= 10^5\n1 <= M <= 2 * 10^5\n1 <= u, v <= N\n1 <= w <= 10^6',
    difficulty: 'Hard',
    timeoutMs: 2000,
    memoryLimitMb: 512,
    score: 300,
    isPublished: false,
    createdBy: 'teacher_joy',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Graph', 'Shortest Path']
  }
];

const DEFAULT_TESTCASES: Testcase[] = [
  { id: 't1', problemId: 'p1', orderIndex: 1, input: '4 9\n2 7 11 15', expectedOutput: '0 1', isSample: true, score: 50 },
  { id: 't2', problemId: 'p1', orderIndex: 2, input: '3 6\n3 2 4', expectedOutput: '1 2', isSample: true, score: 50 },
  { id: 't3', problemId: 'p2', orderIndex: 1, input: '()', expectedOutput: 'true', isSample: true, score: 30 },
  { id: 't4', problemId: 'p2', orderIndex: 2, input: '()[]{}', expectedOutput: 'true', isSample: true, score: 35 },
  { id: 't5', problemId: 'p2', orderIndex: 3, input: '(]', expectedOutput: 'false', isSample: false, score: 35 },
  { id: 't6', problemId: 'p3', orderIndex: 1, input: 'abcabcbb', expectedOutput: '3', isSample: true, score: 100 },
  { id: 't7', problemId: 'p3', orderIndex: 2, input: 'bbbbb', expectedOutput: '1', isSample: false, score: 100 },
  { id: 't8', problemId: 'p4', orderIndex: 1, input: '4 5\n1 2 5\n1 3 2\n3 2 1\n2 4 3\n3 4 8', expectedOutput: '6', isSample: true, score: 150 },
  { id: 't9', problemId: 'p4', orderIndex: 2, input: '3 1\n1 2 10', expectedOutput: '-1', isSample: false, score: 150 }
];

const DEFAULT_CONTESTS: Contest[] = [
  {
    id: 'c1',
    title: 'Gradient Beta Coding Contest',
    description: 'Welcome to the inaugural Gradient platform contest! Solve 3 algorithmic tasks of varying difficulty. Code evaluation is dynamic and sandboxed in our isolated Docker environment.',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Ongoing
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin_master',
    isPublic: true,
    problems: ['p1', 'p2', 'p3'],
    participants: ['alice_coder', 'bob_dev', 'user_student']
  },
  {
    id: 'c2',
    title: 'Advanced Graph Algorithms Cup',
    description: 'Focus on shortest paths, spanning trees, and maximum flows. Recommended for advanced competitors.',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Upcoming
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    createdBy: 'teacher_joy',
    isPublic: true,
    problems: ['p4'],
    participants: []
  }
];

const DEFAULT_SUBMISSIONS: Submission[] = [
  {
    id: 's1',
    problemId: 'p1',
    problemTitle: 'Two Sum',
    userId: 'u2',
    username: 'alice_coder',
    language: 'python',
    sourceCode: 'def twoSum(nums, target):\n    dct = {}\n    for i, num in enumerate(nums):\n        if target - num in dct:\n            return [dct[target - num], i]\n        dct[num] = i\n    return []',
    status: 'Accepted',
    score: 100,
    timeUsedMs: 45,
    memoryUsedKb: 14200,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 's2',
    problemId: 'p2',
    problemTitle: 'Valid Parentheses',
    userId: 'u3',
    username: 'bob_dev',
    language: 'cpp',
    sourceCode: '#include <iostream>\n#include <stack>\nusing namespace std;\nbool isValid(string s) {\n    stack<char> st;\n    for(char c : s) {\n        if(c==\'(\'||c==\'{\'||c==\'[\') st.push(c);\n        else {\n            if(st.empty()) return false;\n            if(c==\')\' && st.top()!=\'(\') return false;\n            if(c==\'}\' && st.top()!=\'{\') return false;\n            if(c==\']\' && st.top()!=\'[\') return false;\n            st.pop();\n        }\n    }\n    return st.empty();\n}',
    status: 'Wrong Answer',
    score: 30,
    timeUsedMs: 12,
    memoryUsedKb: 3400,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  }
];

export function GradientProvider({ children }: { readonly children: React.ReactNode }): JSX.Element {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('gradient_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const toggleTheme = (): void => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('gradient_theme', next);
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('gradient_role');
    return saved === 'admin' || saved === 'student' ? saved : 'student';
  });

  const [username, setUsernameState] = useState<string>(() => {
    const saved = localStorage.getItem('gradient_username');
    return saved || 'user_student';
  });

  const [problems, setProblems] = useState<readonly Problem[]>(() => {
    const saved = localStorage.getItem('gradient_problems');
    return saved ? JSON.parse(saved) : DEFAULT_PROBLEMS;
  });

  const [testcases, setTestcases] = useState<readonly Testcase[]>(() => {
    const saved = localStorage.getItem('gradient_testcases');
    return saved ? JSON.parse(saved) : DEFAULT_TESTCASES;
  });

  const [contests, setContests] = useState<readonly Contest[]>(() => {
    const saved = localStorage.getItem('gradient_contests');
    return saved ? JSON.parse(saved) : DEFAULT_CONTESTS;
  });

  const [submissions, setSubmissions] = useState<readonly Submission[]>(() => {
    const saved = localStorage.getItem('gradient_submissions');
    return saved ? JSON.parse(saved) : DEFAULT_SUBMISSIONS;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gradient_problems', JSON.stringify(problems));
  }, [problems]);

  useEffect(() => {
    localStorage.setItem('gradient_testcases', JSON.stringify(testcases));
  }, [testcases]);

  useEffect(() => {
    localStorage.setItem('gradient_contests', JSON.stringify(contests));
  }, [contests]);

  useEffect(() => {
    localStorage.setItem('gradient_submissions', JSON.stringify(submissions));
  }, [submissions]);

  const setRole = (newRole: UserRole): void => {
    setRoleState(newRole);
    localStorage.setItem('gradient_role', newRole);
    // Auto sync appropriate username
    const name = newRole === 'admin' ? 'admin_master' : 'user_student';
    setUsernameState(name);
    localStorage.setItem('gradient_username', name);
  };

  const setUsername = (name: string): void => {
    setUsernameState(name);
    localStorage.setItem('gradient_username', name);
  };

  // Actions
  const addProblem = (newProb: Omit<Problem, 'id' | 'createdAt' | 'createdBy'>): void => {
    const id = `p_${Date.now()}`;
    const problem: Problem = {
      ...newProb,
      id,
      createdBy: username,
      createdAt: new Date().toISOString()
    };
    setProblems(prev => [...prev, problem]);

    // Create a dummy testcase for this new problem
    const defaultTestcase: Testcase = {
      id: `t_${Date.now()}`,
      problemId: id,
      orderIndex: 1,
      input: 'sample input data',
      expectedOutput: 'sample expected output',
      isSample: true,
      score: 100
    };
    setTestcases(prev => [...prev, defaultTestcase]);
  };

  const updateProblem = (id: string, updates: Partial<Problem>): void => {
    setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProblem = (id: string): void => {
    setProblems(prev => prev.filter(p => p.id !== id));
    setTestcases(prev => prev.filter(t => t.problemId !== id));
  };

  const publishProblem = (id: string, isPublished: boolean): void => {
    updateProblem(id, { isPublished });
  };

  const addTestcase = (problemId: string, tc: Omit<Testcase, 'id' | 'problemId' | 'orderIndex'>): void => {
    const probTCs = testcases.filter(t => t.problemId === problemId);
    const orderIndex = probTCs.length + 1;
    const newTC: Testcase = {
      ...tc,
      id: `t_${Date.now()}`,
      problemId,
      orderIndex
    };
    setTestcases(prev => [...prev, newTC]);
  };

  const deleteTestcase = (id: string): void => {
    setTestcases(prev => prev.filter(t => t.id !== id));
  };

  const addContest = (newContest: Omit<Contest, 'id' | 'createdBy' | 'participants'>): void => {
    const contest: Contest = {
      ...newContest,
      id: `c_${Date.now()}`,
      createdBy: username,
      participants: []
    };
    setContests(prev => [...prev, contest]);
  };

  const joinContest = (contestId: string): void => {
    setContests(prev => prev.map(c => {
      if (c.id === contestId) {
        if (c.participants.includes(username)) return c;
        return {
          ...c,
          participants: [...c.participants, username]
        };
      }
      return c;
    }));
  };

  // Mock code runner inside browser. It simulates the compilation & run of code.
  const submitCode = async (problemId: string, language: string, sourceCode: string): Promise<string> => {
    const prob = problems.find(p => p.id === problemId);
    const subId = `sub_${Date.now()}`;
    const newSubmission: Submission = {
      id: subId,
      problemId,
      problemTitle: prob?.title ?? 'Unknown Problem',
      userId: role === 'admin' ? 'u1' : 'u4',
      username,
      language,
      sourceCode,
      status: 'Pending',
      score: 0,
      timeUsedMs: 0,
      memoryUsedKb: 0,
      createdAt: new Date().toISOString()
    };

    setSubmissions(prev => [newSubmission, ...prev]);

    // Trigger asynchronous mock evaluation
    triggerMockEvaluation(subId, problemId, sourceCode);

    return subId;
  };

  const triggerMockEvaluation = (subId: string, problemId: string, sourceCode: string): void => {
    // 1. Pending -> Running after 600ms
    setTimeout(() => {
      setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: 'Running' } : s));

      // 2. Running -> Evaluation Result after 1500ms
      setTimeout(() => {
        const prob = problems.find(p => p.id === problemId);
        const probTestcases = testcases.filter(t => t.problemId === problemId);

        let status: Submission['status'] = 'Accepted';
        let score = 0;
        let timeUsedMs = Math.floor(Math.random() * 80) + 15; // 15ms - 95ms
        let memoryUsedKb = Math.floor(Math.random() * 8000) + 4000; // 4MB - 12MB
        let stdout = 'All tests passed.\n';
        let stderr = '';

        // Simplistic code checks to make it interactive and respond to code contents:
        const lowerCode = sourceCode.toLowerCase();
        
        if (lowerCode.trim() === '' || sourceCode.length < 10) {
          status = 'Compilation Error';
          score = 0;
          stdout = '';
          stderr = 'error: syntax error, empty solution file or missing main declaration';
        } else if (lowerCode.includes('while true') || lowerCode.includes('for(;;)') || lowerCode.includes('while(true)')) {
          status = 'Time Limit Exceeded';
          score = Math.floor(probTestcases.filter(t => t.isSample).reduce((acc, curr) => acc + curr.score, 0));
          timeUsedMs = prob?.timeoutMs ?? 1000;
          stdout = 'Testcase 1: Success\nTestcase 2: Running...\n';
          stderr = 'Process terminated: exceeded maximum execution time.';
        } else if (lowerCode.includes('throw') || lowerCode.includes('raise') || lowerCode.includes('panic') || lowerCode.includes('exception')) {
          status = 'Compilation Error';
          score = 0;
          stdout = 'Testcase 1: Crashed\n';
          stderr = 'Runtime Exception: Simulated error occurred in line 4.';
        } else {
          // Standard submission: calculate score based on testcases
          const hasIncorrectLogic = lowerCode.includes('wrong') || lowerCode.includes('return -1') || lowerCode.includes('return false') && prob?.slug === 'valid-parentheses';
          if (hasIncorrectLogic) {
            status = 'Wrong Answer';
            // Solve sample, fail non-sample
            const sampleScore = probTestcases.filter(t => t.isSample).reduce((acc, curr) => acc + curr.score, 0);
            score = sampleScore;
            stdout = 'Testcase 1 (Sample): Success\nTestcase 2: Failed. Expected "true", got "false"';
          } else {
            // Full score
            status = 'Accepted';
            score = prob?.score ?? 100;
            stdout = probTestcases.map((t, idx) => `Testcase ${idx + 1} (${t.isSample ? 'Sample' : 'Secret'}): Success (${t.score}/${t.score} pts)`).join('\n');
          }
        }

        setSubmissions(prev => prev.map(s => s.id === subId ? {
          ...s,
          status,
          score,
          timeUsedMs,
          memoryUsedKb,
          stdout,
          stderr
        } : s));

      }, 1500);
    }, 600);
  };

  const regradeSubmission = (submissionId: string): void => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    setSubmissions(prev => prev.map(s => s.id === submissionId ? {
      ...s,
      status: 'Pending',
      score: 0,
      timeUsedMs: 0,
      memoryUsedKb: 0
    } : s));

    triggerMockEvaluation(submissionId, sub.problemId, sub.sourceCode);
  };

  return (
    <GradientContext.Provider value={{
      role,
      setRole,
      username,
      setUsername,
      problems,
      testcases,
      contests,
      submissions,
      addProblem,
      updateProblem,
      deleteProblem,
      publishProblem,
      addTestcase,
      deleteTestcase,
      addContest,
      joinContest,
      submitCode,
      regradeSubmission,
      theme,
      toggleTheme
    }}>
      {children}
    </GradientContext.Provider>
  );
}

export function useGradient(): GradientContextType {
  const context = useContext(GradientContext);
  if (context === undefined) {
    throw new Error('useGradient must be used within a GradientProvider');
  }
  return context;
}
