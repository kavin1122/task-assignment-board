/**
 * Code Runner — Child process worker script for JavaScript execution
 * Receives code + input via process message, executes it, sends back output
 */

process.on('message', ({ code, input }) => {
  try {
    // Capture console.log output
    const outputs = [];
    console.log = (...args) => {
      outputs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    // Build the execution context with input helpers
    const wrappedCode = `
      const input = ${JSON.stringify(input || '')};
      const inputLines = input.split('\\n');
      let __lineIndex = 0;
      function readline() { return inputLines[__lineIndex++] || ''; }
      ${code}
    `;

    // Execute in sandbox
    const vm = require('vm');
    const sandbox = {
      console: { log: console.log, error: console.log, warn: console.log },
      parseInt, parseFloat, Math, JSON, Array, Object, String, Number,
      Boolean, Date, RegExp, Map, Set,
      setTimeout: undefined, setInterval: undefined, require: undefined,
    };

    const context = vm.createContext(sandbox);
    const script = new vm.Script(wrappedCode, { timeout: 5000 });
    script.runInContext(context, { timeout: 5000 });

    const output = outputs.join('\n');
    process.send({ success: true, output });
  } catch (error) {
    process.send({
      success: false,
      output: '',
      error: error.message || 'Runtime error',
    });
  }
});
