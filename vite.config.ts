import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: any;
declare const Buffer: any;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const executionApiKey = env.EXECUTION_API_KEY || env.EXECUTION_SERVICE_KEY || env.RAPIDAPI_KEY || env.JUDGE0_API_KEY || (process.env && process.env.EXECUTION_API_KEY) || '';
  const geminiApiKey = env.GEMINI_API_KEY || env.AI_SERVICE_KEY || (process.env && (process.env.GEMINI_API_KEY || process.env.AI_SERVICE_KEY)) || '';
  const openAiApiKey = env.OPENAI_API_KEY || (process.env && process.env.OPENAI_API_KEY) || '';
  const aiApiKey = geminiApiKey || openAiApiKey;

  if (process.env) {
    process.env.EXECUTION_API_KEY = executionApiKey;
    process.env.GEMINI_API_KEY = geminiApiKey;
    process.env.AI_SERVICE_KEY = env.AI_SERVICE_KEY || geminiApiKey;
    process.env.OPENAI_API_KEY = openAiApiKey;
  }

  if (executionApiKey) {
    console.log('[Coders Hub Backend] Code Execution API Key status: PRESENT');
  } else {
    console.warn('[Coders Hub Backend] Code Execution API Key status: ABSENT');
  }

  if (aiApiKey) {
    console.log(`[Coders Hub Backend] AI Assistant API Key status: PRESENT (Provider: ${geminiApiKey ? 'Gemini' : 'OpenAI'}, Key Length: ${aiApiKey.length})`);
  } else {
    console.log('[Coders Hub Backend] AI Assistant API Key status: NOT_CONFIGURED (Requires GEMINI_API_KEY or AI_SERVICE_KEY in .env)');
  }

  return {
    base: process.env.VERCEL ? '/' : (process.env.BASE_URL || '/'),
    plugins: [
      react(),
      {
        name: 'execution-backend-proxy',
        configureServer(server: any) {
          // Code Execution Engine Route
          server.middlewares.use('/api/execute', (req: any, res: any) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk: any) => {
              bodyStr += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const { code, language, stdin } = JSON.parse(bodyStr || '{}');
                const apiKey = (process.env && process.env.EXECUTION_API_KEY) || '';

                const langMap: Record<string, number> = {
                  C: 50, "C++": 54, Java: 62, Python: 71, JavaScript: 63,
                  c: 50, cpp: 54, "c++": 54, java: 62, python: 71, javascript: 63
                };
                const langId = langMap[language] || 71;

                const base64Code = Buffer.from(code || '').toString('base64');
                const base64Stdin = Buffer.from(stdin || '').toString('base64');

                const headers: Record<string, string> = {
                  "Content-Type": "application/json"
                };

                if (apiKey) {
                  headers["X-Auth-Token"] = apiKey;
                  headers["Authorization"] = `Bearer ${apiKey}`;
                }

                const upstreamRes = await fetch("https://ce.judge0.com/submissions?wait=true&base64_encoded=true", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({
                    source_code: base64Code,
                    language_id: langId,
                    stdin: base64Stdin
                  })
                });

                if (!upstreamRes.ok) {
                  res.statusCode = upstreamRes.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    status: upstreamRes.status,
                    error: `Upstream execution service error ${upstreamRes.status}`
                  }));
                  return;
                }

                const rawData = await upstreamRes.json();
                const statusId = rawData.status?.id ?? 3;

                const decodeB64 = (str: string | null) => str ? Buffer.from(str, 'base64').toString('utf-8') : '';

                const stdout = decodeB64(rawData.stdout);
                const stderr = decodeB64(rawData.stderr);
                const compileOutput = decodeB64(rawData.compile_output);
                const messageOutput = decodeB64(rawData.message);

                let responsePayload: any = {};

                if (statusId === 6) {
                  responsePayload = {
                    compile: {
                      code: 1,
                      stdout: stdout,
                      stderr: compileOutput || stderr || messageOutput || "Compilation failed."
                    },
                    run: { code: 1, stdout: "", stderr: "" }
                  };
                } else if (statusId === 5) {
                  responsePayload = {
                    compile: { code: 0 },
                    run: {
                      code: 124,
                      signal: "SIGKILL",
                      stdout: stdout,
                      stderr: "Time limit exceeded (10,000ms)."
                    }
                  };
                } else if (statusId !== 3) {
                  responsePayload = {
                    compile: { code: 0 },
                    run: {
                      code: 1,
                      stdout: stdout,
                      stderr: stderr || compileOutput || messageOutput || `Execution error (Status ID: ${statusId})`
                    }
                  };
                } else {
                  responsePayload = {
                    compile: { code: 0 },
                    run: {
                      code: 0,
                      stdout: stdout,
                      stderr: stderr
                    }
                  };
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(responsePayload));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Execution backend error' }));
              }
            });
          });

          // AI Tutor Real Backend Route
          server.middlewares.use('/api/ai', (req: any, res: any) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk: any) => {
              bodyStr += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const { message, context } = JSON.parse(bodyStr || '{}');

                if (!message || typeof message !== 'string' || !message.trim()) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Question message cannot be empty.' }));
                  return;
                }

                const userMsg = message.trim();
                const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_SERVICE_KEY || '';
                const openAiKey = process.env.OPENAI_API_KEY || '';
                const aiKey = geminiKey || openAiKey;

                let systemPrompt = "You are the AI Learning Tutor for Coders Hub, an interactive computer science platform. Explain concepts clearly, concisely, and accurately. Format your response in clean Markdown with code blocks where appropriate.";
                if (context) {
                  if (context.courseTitle) systemPrompt += `\nCourse Context: ${context.courseTitle}`;
                  if (context.lessonTitle) systemPrompt += `\nLesson Context: ${context.lessonTitle}`;
                  if (context.language) systemPrompt += `\nProgramming Language: ${context.language}`;
                  if (context.level) systemPrompt += `\nLearner Skill Level: ${context.level}`;
                  if (context.code) systemPrompt += `\nCurrent Code in Code Lab:\n\`\`\`${context.language || ''}\n${context.code}\n\`\`\``;
                }

                // 1. Try Gemini API if key is present
                if (geminiKey) {
                  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
                  let lastErr: any = null;

                  for (const model of modelsToTry) {
                    try {
                      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMsg}` }] }]
                        })
                      });

                      if (geminiRes.ok) {
                        const gData = await geminiRes.json();
                        const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                          res.statusCode = 200;
                          res.setHeader('Content-Type', 'application/json');
                          res.end(JSON.stringify({ text, topic: context?.lessonTitle || "Computer Science" }));
                          return;
                        }
                      } else {
                        const gErr = await geminiRes.json().catch(() => ({}));
                        lastErr = { status: geminiRes.status, message: gErr.error?.message || `Gemini API returned status ${geminiRes.status}` };
                      }
                    } catch (e: any) {
                      lastErr = { status: 500, message: e.message };
                    }
                  }

                  if (lastErr) {
                    res.statusCode = lastErr.status || 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      status: lastErr.status,
                      error: lastErr.message
                    }));
                    return;
                  }
                }

                // 2. Try OpenAI API if key is present
                if (openAiKey) {
                  const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${openAiKey}`
                    },
                    body: JSON.stringify({
                      model: 'gpt-3.5-turbo',
                      messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMsg }
                      ]
                    })
                  });

                  if (openAiRes.ok) {
                    const oData = await openAiRes.json();
                    const text = oData.choices?.[0]?.message?.content;
                    if (text) {
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ text, topic: context?.lessonTitle || "Computer Science" }));
                      return;
                    }
                  } else if (openAiRes.status === 401) {
                    res.statusCode = 401;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'AI service authentication failed (HTTP 401). Please check server OPENAI_API_KEY.' }));
                    return;
                  }
                }

                // 3. Fallback error when no key is configured
                if (!aiKey) {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'AI service authentication is not configured. Please set GEMINI_API_KEY or AI_SERVICE_KEY in server .env file.' }));
                  return;
                }

                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Unable to reach AI service. Please check your network connection.' }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'AI backend error' }));
              }
            });
          });
        }
      }
    ]
  };
});
