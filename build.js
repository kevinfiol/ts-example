import esbuild from 'esbuild';
import { resolve } from 'node:path';
import { ChildProcess, fork } from 'node:child_process';

const OUTFILE = resolve('build/app.js');
const ENTRY = resolve('src/index.ts');
const DEV = process.argv.includes('--dev');

/** @type {ChildProcess | undefined} **/
let proc;

function runApp() {
  proc = fork(OUTFILE);

  if (proc.pid === undefined) {
    console.error('Unable to start process');
    process.exit(1);
  }

  console.log(`Process started with PID: ${proc.pid}`);
}

const buildOptions = {
  format: 'esm',
  platform: 'node',
  // bundle: true,
  // minify: true,
  target: 'node18',
  entryPoints: [ENTRY],
  outfile: OUTFILE,
  sourcemap: DEV,
  plugins: [{
    name: 'on-end',
    setup(build) {
      build.onEnd(({ errors }) => {
        if (errors[0]) {
          console.error('Build failed:', errors[0]);
          return;
        }

        console.log('Build: ', OUTFILE);

        if (DEV && !proc) {
          runApp();
        } else if (proc) {
          console.clear();
          console.log('Restarting process...');

          // start app if not already running
          if (proc.exitCode !== null) {
            runApp();
            return;
          }

          // else, kill existing proc and restart upon closure
          proc.on('close', runApp);
          proc.kill();
        }
      });
    }
  }]
};

if (DEV) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();

  let exited = false;
  ['SIGINT', 'SIGTERM', 'exit'].forEach((signal) =>
    process.on(signal, () => {
      if (exited) return;
      ctx.dispose();
      if (proc) proc.kill();
      exited = true;
    })
  );
} else {
  await esbuild.build(buildOptions);
}