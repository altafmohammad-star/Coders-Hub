export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, language, stdin } = req.body || {};
  const apiKey = process.env.EXECUTION_API_KEY || process.env.EXECUTION_SERVICE_KEY || process.env.RAPIDAPI_KEY || process.env.JUDGE0_API_KEY || '';

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

  try {
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
      return res.status(upstreamRes.status).json({
        error: `Upstream execution service error ${upstreamRes.status}`
      });
    }

    const rawData = await upstreamRes.json();
    const decodeB64 = (str: string | null) => str ? Buffer.from(str, 'base64').toString('utf-8') : '';

    return res.status(200).json({
      stdout: decodeB64(rawData.stdout),
      stderr: decodeB64(rawData.stderr),
      compile: rawData.compile_output ? {
        code: rawData.status?.id === 6 ? 1 : 0,
        stdout: '',
        stderr: decodeB64(rawData.compile_output)
      } : null,
      run: {
        code: rawData.status?.id === 3 ? 0 : rawData.status?.id || 1,
        signal: rawData.signal || null,
        stdout: decodeB64(rawData.stdout),
        stderr: decodeB64(rawData.stderr) || rawData.status?.description || ''
      },
      status: rawData.status
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Execution request failed' });
  }
}
