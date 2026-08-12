import { execSync } from 'child_process';

try {
  execSync('npx eslint src/components/admin/users/RolesTab.tsx src/app/\\"(admin)\\'/admin/users/page.tsx src/app/\\"(staff)\\'/staff/users/page.tsx src/config/admin-nav.ts', { stdio: 'inherit', cwd: 'D:/Project/EdTech/Yakinlulus.id/frontend' });
} catch (e) {
  process.exit(1);
}
