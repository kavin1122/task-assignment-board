/**
 * Code Executor — Multi-language code execution engine
 * Supports: JavaScript, Python, C, C++, Java
 * Executes code in child processes with timeout and memory limits
 */

const { fork, execFile, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const JS_RUNNER_PATH = path.join(__dirname, 'codeRunner.js');
const TIMEOUT_MS = 10000; // 10 seconds per test case
const TEMP_DIR = path.join(os.tmpdir(), 'code-executor');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Supported languages config
const LANGUAGES = {
  javascript: { name: 'JavaScript', extension: '.js', icon: '🟨' },
  python: { name: 'Python', extension: '.py', icon: '🐍' },
  c: { name: 'C', extension: '.c', icon: '🔵' },
  cpp: { name: 'C++', extension: '.cpp', icon: '🔷' },
  java: { name: 'Java', extension: '.java', icon: '☕' },
};

/**
 * Generate a unique filename for temp files
 */
function getTempFile(ext) {
  const id = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  return path.join(TEMP_DIR, `code_${id}${ext}`);
}

/**
 * Clean up temp files
 */
function cleanup(...files) {
  for (const f of files) {
    try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { /* ignore */ }
  }
}

/**
 * Execute a shell command with timeout
 */
function execWithTimeout(command, input, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve) => {
    const child = exec(command, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed || error.signal === 'SIGTERM') {
          resolve({ success: false, output: '', error: 'Time Limit Exceeded (10 seconds)' });
        } else {
          const errMsg = stderr?.trim() || error.message || 'Runtime error';
          resolve({ success: false, output: stdout?.trim() || '', error: errMsg });
        }
      } else {
        resolve({ success: true, output: stdout?.trim() || '', error: stderr?.trim() || null });
      }
    });

    // Send input to stdin
    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

/**
 * Execute JavaScript code using the sandboxed VM runner
 */
function executeJavaScript(code, input) {
  return new Promise((resolve) => {
    const child = fork(JS_RUNNER_PATH, [], {
      silent: true,
      execArgv: ['--max-old-space-size=50'],
    });

    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        child.kill('SIGKILL');
        resolve({ success: false, output: '', error: 'Time Limit Exceeded (10 seconds)' });
      }
    }, TIMEOUT_MS + 1000);

    child.on('message', (result) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        child.kill();
        resolve(result);
      }
    });

    child.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ success: false, output: '', error: err.message });
      }
    });

    child.on('exit', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ success: false, output: '', error: 'No output produced' });
      }
    });

    child.send({ code, input: input || '' });
  });
}

/**
 * Execute Python code
 */
async function executePython(code, input) {
  const srcFile = getTempFile('.py');
  try {
    fs.writeFileSync(srcFile, code);
    const result = await execWithTimeout(`python "${srcFile}"`, input);
    return result;
  } catch (e) {
    return { success: false, output: '', error: e.message };
  } finally {
    cleanup(srcFile);
  }
}

/**
 * Execute C code
 */
async function executeC(code, input) {
  const srcFile = getTempFile('.c');
  const outFile = srcFile.replace('.c', '.exe');
  try {
    fs.writeFileSync(srcFile, code);
    // Compile
    const compileResult = await execWithTimeout(`gcc "${srcFile}" -o "${outFile}" -lm`, '', 15000);
    if (!compileResult.success && compileResult.error) {
      return { success: false, output: '', error: `Compilation Error:\n${compileResult.error}` };
    }
    // Run
    const result = await execWithTimeout(`"${outFile}"`, input);
    return result;
  } catch (e) {
    return { success: false, output: '', error: e.message };
  } finally {
    cleanup(srcFile, outFile);
  }
}

/**
 * Execute C++ code
 */
async function executeCpp(code, input) {
  const srcFile = getTempFile('.cpp');
  const outFile = srcFile.replace('.cpp', '.exe');
  try {
    fs.writeFileSync(srcFile, code);
    // Compile
    const compileResult = await execWithTimeout(`g++ "${srcFile}" -o "${outFile}" -lm`, '', 15000);
    if (!compileResult.success && compileResult.error) {
      return { success: false, output: '', error: `Compilation Error:\n${compileResult.error}` };
    }
    // Run
    const result = await execWithTimeout(`"${outFile}"`, input);
    return result;
  } catch (e) {
    return { success: false, output: '', error: e.message };
  } finally {
    cleanup(srcFile, outFile);
  }
}

/**
 * Execute Java code
 */
async function executeJava(code, input) {
  // Extract class name from code
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Main';
  const srcFile = path.join(TEMP_DIR, `${className}.java`);
  const classFile = path.join(TEMP_DIR, `${className}.class`);
  try {
    fs.writeFileSync(srcFile, code);
    // Compile
    const compileResult = await execWithTimeout(`javac "${srcFile}"`, '', 15000);
    if (!compileResult.success && compileResult.error) {
      return { success: false, output: '', error: `Compilation Error:\n${compileResult.error}` };
    }
    // Run
    const result = await execWithTimeout(`java -cp "${TEMP_DIR}" ${className}`, input);
    return result;
  } catch (e) {
    return { success: false, output: '', error: e.message };
  } finally {
    cleanup(srcFile, classFile);
  }
}

/**
 * Execute code in the specified language
 */
async function executeCode(code, input, language = 'javascript') {
  switch (language) {
    case 'javascript': return executeJavaScript(code, input);
    case 'python': return executePython(code, input);
    case 'c': return executeC(code, input);
    case 'cpp': return executeCpp(code, input);
    case 'java': return executeJava(code, input);
    default: return { success: false, output: '', error: `Unsupported language: ${language}` };
  }
}

/**
 * Run code against all test cases for a question
 */
async function runTestCases(code, testCases, language = 'javascript') {
  const results = [];
  let totalPassed = 0;

  for (const tc of testCases) {
    const result = await executeCode(code, tc.input, language);
    const actualOutput = (result.output || '').trim();
    const expectedOutput = (tc.expectedOutput || '').trim();
    const isPassed = result.success && actualOutput === expectedOutput;

    if (isPassed) totalPassed++;

    results.push({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: result.success ? result.output : `Error: ${result.error}`,
      passed: isPassed,
      error: result.error || null,
    });
  }

  return {
    results,
    passed: totalPassed === testCases.length,
    totalPassed,
    totalTests: testCases.length,
  };
}

module.exports = { executeCode, runTestCases, LANGUAGES };
