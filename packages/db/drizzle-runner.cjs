const { spawn } = require('child_process');

const child = spawn('npx', ['drizzle-kit', 'generate'], {
    cwd: process.cwd(),
    env: { ...process.env, CI: 'false' },
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
    const out = data.toString();
    console.log(out);
    if (out.toLowerCase().includes('rename') || out.toLowerCase().includes('yes')) {
        console.log('Sending YES');
        child.stdin.write('y\n');
    }
    if (out.toLowerCase().includes('drop')) {
        console.log('Sending YES');
        child.stdin.write('y\n');
    }
});

child.stderr.on('data', (data) => {
    console.error(data.toString());
});

child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    process.exit(code);
});
