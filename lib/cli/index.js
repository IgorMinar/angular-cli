const cli = require('ember-cli/lib/cli');
const path = require('path');


// This file hooks up on require calls to transpile TypeScript.
const fs = require('fs');
const ts = require('typescript');
const old = require.extensions['.ts'];

require.extensions['.ts'] = function(m, filename) {
  // If we're in node module, either call the old hook or simply compile the
  // file without transpilation. We do not touch node_modules/**.
  if (!filename.match(/angular-cli/) && filename.match(/node_modules/)) {
    if (old) {
      return old(m, filename);
    }
    return m._compile(fs.readFileSync(filename), filename);
  }

  // Node requires all require hooks to be sync.
  const source = fs.readFileSync(filename).toString();

  try {
    const result = ts.transpile(source, {
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJs,
    });

    // Send it to node to execute.
    return m._compile(result, filename);
  } catch (err) {
    console.error('Error while running script "' + filename + '":');
    console.error(err.stack);
    throw err;
  }
};


module.exports = function(options) {
  const oldStdoutWrite = process.stdout.write;
  process.stdout.write = function(line) {
    line = line.toString();
    if (line.match(/version:|warning:/)) {
      return;
    }
    line = line.replace(/ember-cli(?!.com)/g, 'angular-cli')
               .replace(/ember(?!-cli.com)/g, 'ng');
    return oldStdoutWrite.apply(process.stdout, arguments);
  };

  const oldStderrWrite = process.stderr.write;
  process.stderr.write = function(line) {
    line = line.toString()
               .replace(/ember-cli(?!.com)/g, 'angular-cli')
               .replace(/ember(?!-cli.com)/g, 'ng');
    return oldStderrWrite.apply(process.stdout, arguments);
  };

  options.cli = {
    name: 'ng',
    root: path.join(__dirname, '..', '..'),
    npmPackage: 'angular-cli'
  };
    
  return cli(options);
}
