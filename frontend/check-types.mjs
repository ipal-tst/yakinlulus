import { execSync } from 'child_process';

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: 'D:/Project/EdTech/Yakinlulus.id/frontend' });
} catch (e) {
  process.exit(1);
}
