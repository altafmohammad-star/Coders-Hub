import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: any;
declare const Buffer: any;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const executionApiKey = env.EXECUTION_API_KEY || env.EXECUTION_SERVICE_KEY || env.RAPIDAPI_KEY || env.JUDGE0_API_KEY || (process.env && process.env.EXECUTION_API_KEY) || '';
  if (process.env) {
    process.env.EXECUTION_API_KEY = executionApiKey;
  }

  if (executionApiKey) {
    console.log('[Coders Hub Backend] Code Execution API Key status: PRESENT');
  } else {
    console.warn('[Coders Hub Backend] Code Execution API Key status: ABSENT');
  }

  return {
    base: '/Coders-Hub/',
    plugins: [
      react(),
      {
        name: 'execution-backend-proxy',
        configureServer(server: any) {
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
                  // Compilation Error
                  responsePayload = {
                    compile: {
                      code: 1,
                      stdout: stdout,
                      stderr: compileOutput || stderr || messageOutput || "Compilation failed."
                    },
                    run: { code: 1, stdout: "", stderr: "" }
                  };
                } else if (statusId === 5) {
                  // Time Limit Exceeded
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
                  // Runtime Error
                  responsePayload = {
                    compile: { code: 0 },
                    run: {
                      code: 1,
                      stdout: stdout,
                      stderr: stderr || compileOutput || messageOutput || `Execution error (Status ID: ${statusId})`
                    }
                  };
                } else {
                  // Success
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
        }
      }
    ]
  };
});
