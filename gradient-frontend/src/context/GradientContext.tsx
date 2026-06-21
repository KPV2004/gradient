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

export type UserRole = 'student' | 'teacher' | 'admin';

interface GradientContextType {
  readonly role: UserRole;
  readonly setRole: (role: UserRole) => void;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly setUsername: (name: string) => void;
  readonly token: string | null;
  readonly login: (username: string, password: string) => Promise<void>;
  readonly register: (username: string, email: string, password: string, displayName: string, role: string) => Promise<void>;
  readonly logout: () => void;
  readonly problems: readonly Problem[];
  readonly testcases: readonly Testcase[];
  readonly contests: readonly Contest[];
  readonly submissions: readonly Submission[];
  readonly addProblem: (problem: Omit<Problem, 'id' | 'createdAt' | 'createdBy'>) => void;
  readonly updateProblem: (id: string, updates: Partial<Problem>) => Promise<void>;
  readonly deleteProblem: (id: string) => Promise<void>;
  readonly publishProblem: (id: string, isPublished: boolean) => Promise<void>;
  readonly addTestcase: (problemId: string, testcase: Omit<Testcase, 'id' | 'problemId' | 'orderIndex'>) => void;
  readonly deleteTestcase: (id: string) => Promise<void>;
  readonly addContest: (contest: Omit<Contest, 'id' | 'createdBy' | 'participants'>) => void;
  readonly updateContest: (id: string, updates: Omit<Contest, 'id' | 'createdBy' | 'participants'>) => Promise<void>;
  readonly deleteContest: (id: string) => Promise<void>;
  readonly joinContest: (contestId: string) => void;
  readonly submitCode: (problemId: string, language: string, sourceCode: string) => Promise<string>;
  readonly regradeSubmission: (submissionId: string) => void;
  readonly theme: 'light' | 'dark';
  readonly toggleTheme: () => void;
}

const GradientContext = createContext<GradientContextType | undefined>(undefined);

function mapBackendStatus(status: string): Submission['status'] {
  switch (status) {
    case 'pending': return 'Pending';
    case 'running': return 'Running';
    case 'accepted': return 'Accepted';
    case 'wrong_answer': return 'Wrong Answer';
    case 'time_limit_exceeded': return 'Time Limit Exceeded';
    case 'compile_error': return 'Compilation Error';
    default: return 'Wrong Answer';
  }
}

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
    return saved === 'admin' || saved === 'student' || saved === 'teacher' ? (saved as UserRole) : 'student';
  });

  const [username, setUsernameState] = useState<string>(() => {
    const saved = localStorage.getItem('gradient_username');
    return saved || 'user_student';
  });

  const [userId, setUserIdState] = useState<string>(() => {
    const saved = localStorage.getItem('gradient_user_id');
    return saved || 'u4';
  });

  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem('gradient_token');
  });

  const [displayName, setDisplayNameState] = useState<string>(() => localStorage.getItem('gradient_display_name') || '');
  const [email, setEmailState] = useState<string>(() => localStorage.getItem('gradient_email') || '');

  const [problems, setProblems] = useState<readonly Problem[]>([]);
  const [testcases, setTestcases] = useState<readonly Testcase[]>([]);
  const [contests, setContests] = useState<readonly Contest[]>([]);
  const [submissions, setSubmissions] = useState<readonly Submission[]>([]);

  // API fetch wrapper inside Provider lexical scope for auto-logout on 401
  const apiFetch = async (url: string, tokenOverride: string | null = token, options: RequestInit = {}): Promise<any> => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(tokenOverride ? { 'Authorization': `Bearer ${tokenOverride}` } : {}),
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      if (res.status === 401) {
        logout();
      }
      const err = await res.json().catch(() => ({ error: `HTTP error ${res.status}` }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  };

  // Fetch initial data from backend API
  const initData = async (tokenToUse: string | null, currentUserId: string, currentUsername: string, currentRole: string) => {
    if (!tokenToUse) return;
    try {
      // 1. Fetch problems
      const probData = await apiFetch('/api/problems', tokenToUse);
      const mappedProblems: Problem[] = probData.map((p: any) => ({
        id: p.ID,
        title: p.Title,
        slug: p.Slug,
        description: p.Description,
        inputFormat: p.InputFormat || '',
        outputFormat: p.OutputFormat || '',
        constraints: p.Constraints || '',
        difficulty: p.Difficulty === 'easy' ? 'Easy' : p.Difficulty === 'medium' ? 'Medium' : 'Hard',
        timeoutMs: p.TimeoutMs,
        memoryLimitMb: p.MemoryLimitMb,
        score: p.Score,
        isPublished: p.IsPublished,
        createdBy: p.CreatedBy,
        createdAt: p.CreatedAt,
        tags: p.Slug === 'two-sum' ? ['Array', 'Hash Table'] : 
              p.Slug === 'valid-parentheses' ? ['String', 'Stack'] : 
              p.Slug === 'longest-substring-without-repeating' ? ['String', 'Sliding Window'] : 
              p.Slug === 'optimal-path-finder' ? ['Graph', 'Shortest Path'] : []
      }));
      setProblems(mappedProblems);

      // 2. Preload testcases for all problems
      const allTestcases: Testcase[] = [];
      for (const p of mappedProblems) {
        try {
          const tcData = await apiFetch(`/api/problems/${p.id}/testcases`, tokenToUse);
          const mappedTCs: Testcase[] = tcData.map((t: any) => ({
            id: t.ID,
            problemId: t.ProblemID,
            orderIndex: t.OrderIndex,
            input: t.Input || '',
            expectedOutput: t.ExpectedOutput || '',
            isSample: t.IsSample,
            score: t.Score
          }));
          allTestcases.push(...mappedTCs);
        } catch (e) {
          console.error(`Failed to load testcases for problem ${p.id}`, e);
        }
      }
      setTestcases(allTestcases);

      // 3. Fetch contests
      const contestData = await apiFetch('/api/contests', tokenToUse);
      const mappedContests: Contest[] = contestData.map((c: any) => ({
        id: c.ID,
        title: c.Title,
        description: c.Description,
        startTime: c.StartTime,
        endTime: c.EndTime,
        createdBy: c.CreatedBy,
        isPublic: c.IsPublic,
        problems: [],
        participants: []
      }));
      
      for (const contest of mappedContests) {
        try {
          const contestProbs = await apiFetch(`/api/contests/${contest.id}/problems`, tokenToUse);
          const newContestProblems = contestProbs.map((p: any) => {
            const probObj = p.Problem;
            if (probObj) {
              const mappedProb: Problem = {
                id: probObj.ID,
                title: probObj.Title,
                slug: probObj.Slug,
                description: probObj.Description,
                inputFormat: probObj.InputFormat || '',
                outputFormat: probObj.OutputFormat || '',
                constraints: probObj.Constraints || '',
                difficulty: probObj.Difficulty === 'easy' ? 'Easy' : probObj.Difficulty === 'medium' ? 'Medium' : 'Hard',
                timeoutMs: probObj.TimeoutMs,
                memoryLimitMb: probObj.MemoryLimitMb,
                score: probObj.Score,
                isPublished: probObj.IsPublished,
                createdBy: probObj.CreatedBy,
                createdAt: probObj.CreatedAt,
                tags: probObj.Slug === 'two-sum' ? ['Array', 'Hash Table'] : 
                      probObj.Slug === 'valid-parentheses' ? ['String', 'Stack'] : 
                      probObj.Slug === 'longest-substring-without-repeating' ? ['String', 'Sliding Window'] : 
                      probObj.Slug === 'optimal-path-finder' ? ['Graph', 'Shortest Path'] : []
              };
              
              setProblems(prev => {
                if (prev.some(x => x.id === mappedProb.id)) return prev;
                return [...prev, mappedProb];
              });
              
              return mappedProb.id;
            }
            return p.ID || p.id || '';
          });
          (contest as any).problems = newContestProblems;
        } catch (e) {
          console.error('Failed to load contest problems', e);
        }

        try {
          const participants = await apiFetch(`/api/contests/${contest.id}/participants`, tokenToUse);
          (contest as any).participants = participants;
        } catch (e) {
          console.error('Failed to load contest participants', e);
          (contest as any).participants = [];
        }
      }
      setContests(mappedContests);

      // 4. Fetch submissions
      const subData = await apiFetch('/api/submissions', tokenToUse);
      const mappedSubmissions: Submission[] = subData.map((s: any) => {
        const prob = mappedProblems.find((p: any) => p.id === s.ProblemID);
        return {
          id: s.ID,
          problemId: s.ProblemID,
          problemTitle: prob ? prob.title : 'Unknown Problem',
          userId: s.UserID,
          username: s.Username || (s.UserID === 'u1' ? 'admin_master' : 'user_student'),
          language: s.Language,
          sourceCode: s.SourceCode,
          status: mapBackendStatus(s.Status),
          score: s.Score,
          timeUsedMs: s.TimeUsedMs,
          memoryUsedKb: s.MemoryUsedKb,
          stdout: s.Stdout,
          stderr: s.Stderr,
          createdAt: s.CreatedAt
        };
      });
      setSubmissions(mappedSubmissions);
    } catch (err) {
      console.error('Failed to load data from backend:', err);
    }
  };

  const login = async (userParam: string, passwordParam: string): Promise<void> => {
    const res = await apiFetch('/api/auth/login', null, {
      method: 'POST',
      body: JSON.stringify({
        username: userParam,
        password: passwordParam
      })
    });
    
    const tokenVal = res.token;
    const userVal = res.user;
    const resolvedRole: UserRole = (userVal.role === 'admin' || userVal.role === 'teacher' || userVal.role === 'student') ? userVal.role as UserRole : 'student';
    
    localStorage.setItem('gradient_token', tokenVal);
    localStorage.setItem('gradient_role', resolvedRole);
    localStorage.setItem('gradient_username', userVal.username);
    localStorage.setItem('gradient_user_id', userVal.id);
    localStorage.setItem('gradient_display_name', userVal.display_name || '');
    localStorage.setItem('gradient_email', userVal.email || '');
    
    setRoleState(resolvedRole);
    setUsernameState(userVal.username);
    setUserIdState(userVal.id);
    setTokenState(tokenVal);
    setDisplayNameState(userVal.display_name || '');
    setEmailState(userVal.email || '');
    
    await initData(tokenVal, userVal.id, userVal.username, resolvedRole);
  };

  const register = async (
    userParam: string, 
    emailParam: string, 
    passwordParam: string, 
    displayNameParam: string, 
    roleParam: string
  ): Promise<void> => {
    // Map visual 'admin' or 'student' values to Go backend role requirements
    const backendRole = roleParam === 'admin' ? 'admin' : 'student';
    await apiFetch('/api/auth/register', null, {
      method: 'POST',
      body: JSON.stringify({
        username: userParam,
        email: emailParam,
        password: passwordParam,
        display_name: displayNameParam,
        role: backendRole
      })
    });
  };

  const logout = (): void => {
    localStorage.removeItem('gradient_token');
    localStorage.removeItem('gradient_role');
    localStorage.removeItem('gradient_username');
    localStorage.removeItem('gradient_user_id');
    localStorage.removeItem('gradient_display_name');
    localStorage.removeItem('gradient_email');
    setTokenState(null);
    setRoleState('student');
    setUsernameState('user_student');
    setUserIdState('u4');
    setDisplayNameState('');
    setEmailState('');
    setProblems([]);
    setTestcases([]);
    setContests([]);
    setSubmissions([]);
  };

  const setRole = (newRole: UserRole): void => {
    // Left for direct theme/preview role switching
    setRoleState(newRole);
    localStorage.setItem('gradient_role', newRole);
  };

  const setUsername = (name: string): void => {
    setUsernameState(name);
    localStorage.setItem('gradient_username', name);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('gradient_token');
    const savedRole = (localStorage.getItem('gradient_role') as UserRole) || 'student';
    const savedUsername = localStorage.getItem('gradient_username') || 'user_student';
    const savedUserId = localStorage.getItem('gradient_user_id') || 'u4';
    
    if (savedToken) {
      setTokenState(savedToken);
      setRoleState(savedRole);
      setUsernameState(savedUsername);
      setUserIdState(savedUserId);
      initData(savedToken, savedUserId, savedUsername, savedRole);
    }
  }, []);

  const addProblem = async (newProb: Omit<Problem, 'id' | 'createdAt' | 'createdBy'>): Promise<void> => {
    try {
      const res = await apiFetch('/api/problems', token, {
        method: 'POST',
        body: JSON.stringify({
          title: newProb.title,
          slug: newProb.slug,
          description: newProb.description,
          input_format: newProb.inputFormat,
          output_format: newProb.outputFormat,
          constraints: newProb.constraints,
          difficulty: newProb.difficulty.toLowerCase(),
          timeout_ms: newProb.timeoutMs,
          memory_limit_mb: newProb.memoryLimitMb,
          score: newProb.score,
          is_published: newProb.isPublished
        })
      });
      
      const problem: Problem = {
        id: res.ID,
        title: res.Title,
        slug: res.Slug,
        description: res.Description,
        inputFormat: res.InputFormat || '',
        outputFormat: res.OutputFormat || '',
        constraints: res.Constraints || '',
        difficulty: res.Difficulty === 'easy' ? 'Easy' : res.Difficulty === 'medium' ? 'Medium' : 'Hard',
        timeoutMs: res.TimeoutMs,
        memoryLimitMb: res.MemoryLimitMb,
        score: res.Score,
        isPublished: res.IsPublished,
        createdBy: res.CreatedBy,
        createdAt: res.CreatedAt,
        tags: newProb.tags
      };
      setProblems(prev => [...prev, problem]);

      // Create initial sample testcase for problem
      await apiFetch(`/api/problems/${res.ID}/testcases`, token, {
        method: 'POST',
        body: JSON.stringify({
          order_index: 1,
          input: 'sample input data',
          expected_output: 'sample expected output',
          is_sample: true,
          score: 100
        })
      });

      await reloadTestcases(res.ID);
    } catch (e) {
      console.error('Failed to add problem:', e);
    }
  };

  const reloadTestcases = async (problemId: string) => {
    try {
      const tcData = await apiFetch(`/api/problems/${problemId}/testcases`, token);
      const mappedTCs: Testcase[] = tcData.map((t: any) => ({
        id: t.ID,
        problemId: t.ProblemID,
        orderIndex: t.OrderIndex,
        input: t.Input || '',
        expectedOutput: t.ExpectedOutput || '',
        isSample: t.IsSample,
        score: t.Score
      }));
      setTestcases(prev => {
        const filtered = prev.filter(tc => tc.problemId !== problemId);
        return [...filtered, ...mappedTCs];
      });
    } catch (e) {
      console.error('Failed to reload testcases:', e);
    }
  };

  const updateProblem = async (id: string, updates: Partial<Problem>): Promise<void> => {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.slug !== undefined) payload.slug = updates.slug;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.inputFormat !== undefined) payload.input_format = updates.inputFormat;
      if (updates.outputFormat !== undefined) payload.output_format = updates.outputFormat;
      if (updates.constraints !== undefined) payload.constraints = updates.constraints;
      if (updates.difficulty !== undefined) payload.difficulty = updates.difficulty.toLowerCase();
      if (updates.timeoutMs !== undefined) payload.timeout_ms = updates.timeoutMs;
      if (updates.memoryLimitMb !== undefined) payload.memory_limit_mb = updates.memoryLimitMb;
      if (updates.score !== undefined) payload.score = updates.score;
      if (updates.isPublished !== undefined) payload.is_published = updates.isPublished;
      await apiFetch(`/api/problems/${id}`, token, { method: 'PUT', body: JSON.stringify(payload) });
      setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (e) {
      console.error('Failed to update problem:', e);
      throw e;
    }
  };

  const deleteProblem = async (id: string): Promise<void> => {
    try {
      await apiFetch(`/api/problems/${id}`, token, { method: 'DELETE' });
      setProblems(prev => prev.filter(p => p.id !== id));
      setTestcases(prev => prev.filter(t => t.problemId !== id));
    } catch (e) {
      console.error('Failed to delete problem:', e);
      throw e;
    }
  };

  const publishProblem = async (id: string, isPublished: boolean): Promise<void> => {
    await updateProblem(id, { isPublished });
  };

  const addTestcase = async (problemId: string, tc: Omit<Testcase, 'id' | 'problemId' | 'orderIndex'>): Promise<void> => {
    try {
      const probTCs = testcases.filter(t => t.problemId === problemId);
      const orderIndex = probTCs.length + 1;
      
      const res = await apiFetch(`/api/problems/${problemId}/testcases`, token, {
        method: 'POST',
        body: JSON.stringify({
          order_index: orderIndex,
          input: tc.input,
          expected_output: tc.expectedOutput,
          is_sample: tc.isSample,
          score: tc.score
        })
      });
      
      const newTC: Testcase = {
        id: res.ID,
        problemId: res.ProblemID,
        orderIndex: res.OrderIndex,
        input: res.Input || '',
        expectedOutput: res.ExpectedOutput || '',
        isSample: res.IsSample,
        score: res.Score
      };
      setTestcases(prev => [...prev, newTC]);
    } catch (e) {
      console.error('Failed to add testcase:', e);
    }
  };

  const deleteTestcase = async (id: string): Promise<void> => {
    try {
      const tc = testcases.find(t => t.id === id);
      if (!tc) return;
      await apiFetch(`/api/problems/${tc.problemId}/testcases/${id}`, token, { method: 'DELETE' });
      setTestcases(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error('Failed to delete testcase:', e);
      throw e;
    }
  };

  const addContest = async (newContest: Omit<Contest, 'id' | 'createdBy' | 'participants'>): Promise<void> => {
    try {
      const res = await apiFetch('/api/contests', token, {
        method: 'POST',
        body: JSON.stringify({
          title: newContest.title,
          description: newContest.description,
          start_time: newContest.startTime,
          end_time: newContest.endTime,
          is_public: newContest.isPublic
        })
      });

      const contest: Contest = {
        id: res.ID,
        title: res.Title,
        description: res.Description,
        startTime: res.StartTime,
        endTime: res.EndTime,
        createdBy: res.CreatedBy,
        isPublic: res.IsPublic,
        problems: [],
        participants: []
      };

      for (let idx = 0; idx < newContest.problems.length; idx++) {
        const probId = newContest.problems[idx];
        try {
          const cp = await apiFetch(`/api/contests/${res.ID}/problems`, token, {
            method: 'POST',
            body: JSON.stringify({
              problem_id: probId,
              label: String.fromCharCode(65 + idx),
              order_index: idx + 1
            })
          });
          contest.problems.push(cp.ProblemID);
        } catch (e) {
          console.error(`Failed to map problem ${probId} to contest:`, e);
        }
      }

      setContests(prev => [...prev, contest]);
    } catch (e) {
      console.error('Failed to add contest:', e);
    }
  };

  const joinContest = async (contestId: string): Promise<void> => {
    try {
      await apiFetch(`/api/contests/${contestId}/join`, token, {
        method: 'POST'
      });
      
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
    } catch (e) {
      console.error('Failed to join contest:', e);
    }
  };

  const updateContest = async (
    contestId: string,
    updatedContest: Omit<Contest, 'id' | 'createdBy' | 'participants'>
  ): Promise<void> => {
    try {
      const res = await apiFetch(`/api/contests/${contestId}`, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedContest.title,
          description: updatedContest.description,
          start_time: updatedContest.startTime,
          end_time: updatedContest.endTime,
          is_public: updatedContest.isPublic
        })
      });

      for (let idx = 0; idx < updatedContest.problems.length; idx++) {
        const probId = updatedContest.problems[idx];
        try {
          await apiFetch(`/api/contests/${contestId}/problems`, token, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problem_id: probId,
              label: String.fromCharCode(65 + idx),
              order_index: idx
            })
          });
        } catch (e) {
          console.error(`Failed to map problem ${probId} to contest during update:`, e);
        }
      }

      setContests(prev => prev.map(c => {
        if (c.id === contestId) {
          return {
            ...c,
            title: res.Title || updatedContest.title,
            description: res.Description || updatedContest.description,
            startTime: res.StartTime || updatedContest.startTime,
            endTime: res.EndTime || updatedContest.endTime,
            isPublic: res.IsPublic !== undefined ? res.IsPublic : updatedContest.isPublic,
            problems: updatedContest.problems
          };
        }
        return c;
      }));
    } catch (e) {
      console.error('Failed to update contest:', e);
      throw e;
    }
  };

  const deleteContest = async (contestId: string): Promise<void> => {
    try {
      await apiFetch(`/api/contests/${contestId}`, token, {
        method: 'DELETE'
      });
      setContests(prev => prev.filter(c => c.id !== contestId));
    } catch (e) {
      console.error('Failed to delete contest:', e);
      throw e;
    }
  };

  // Poll submission status in real-time
  const pollSubmission = (subId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 60) { // Timeout after 60 seconds
        clearInterval(interval);
        return;
      }
      try {
        const tokenToUse = localStorage.getItem('gradient_token');
        const s = await apiFetch(`/api/submissions/${subId}`, tokenToUse);
        if (s.Status !== 'pending' && s.Status !== 'running') {
          setSubmissions(prev => prev.map(item => item.id === subId ? {
            ...item,
            status: mapBackendStatus(s.Status),
            score: s.Score,
            timeUsedMs: s.TimeUsedMs,
            memoryUsedKb: s.MemoryUsedKb,
            stdout: s.Stdout,
            stderr: s.Stderr
          } : item));
          clearInterval(interval);
        } else {
          setSubmissions(prev => prev.map(item => item.id === subId ? {
            ...item,
            status: mapBackendStatus(s.Status)
          } : item));
        }
      } catch (e) {
        console.error('Failed to poll submission', e);
        clearInterval(interval);
      }
    }, 1000);
  };

  const submitCode = async (problemId: string, language: string, sourceCode: string): Promise<string> => {
    const res = await apiFetch('/api/submissions', token, {
      method: 'POST',
      body: JSON.stringify({
        problem_id: problemId,
        language: language.toLowerCase(),
        source_code: sourceCode
      })
    });
    
    const newSub: Submission = {
      id: res.ID,
      problemId: res.ProblemID,
      problemTitle: problems.find(p => p.id === problemId)?.title ?? 'Unknown Problem',
      userId: res.UserID,
      username: username,
      language: res.Language,
      sourceCode: res.SourceCode,
      status: mapBackendStatus(res.Status),
      score: res.Score,
      timeUsedMs: res.TimeUsedMs,
      memoryUsedKb: res.MemoryUsedKb,
      stdout: res.Stdout,
      stderr: res.Stderr,
      createdAt: res.CreatedAt
    };
    
    setSubmissions(prev => [newSub, ...prev]);
    pollSubmission(res.ID);
    
    return res.ID;
  };

  const regradeSubmission = (submissionId: string): void => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;
    submitCode(sub.problemId, sub.language, sub.sourceCode);
  };

  return (
    <GradientContext.Provider value={{
      role,
      setRole,
      username,
      displayName,
      email,
      setUsername,
      token,
      login,
      register,
      logout,
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
      updateContest,
      deleteContest,
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
