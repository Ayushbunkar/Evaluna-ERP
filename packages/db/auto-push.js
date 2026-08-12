const { spawn } = require('child_process');

const child = spawn('bunx', ['drizzle-kit', 'push', '--force'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: 'd:/Evaluna ERP/packages/db'
});

child.stdout.on('data', (data) => {
    const text = data.toString();
    console.log('[STDOUT]:', text);
    if (text.toLowerCase().includes('?') || text.toLowerCase().includes('y/n')) {
        console.log('Detected prompt, sending "y"');
        child.stdin.write('y\n');
    }
});

child.stderr.on('data', (data) => {
    console.log('[STDERR]:', data.toString());
});

child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    process.exit(code);
});
