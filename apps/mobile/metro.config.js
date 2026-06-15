const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Monorepo : Metro surveille la racine du workspace pour résoudre les deps hoistées,
// mais il ne doit PAS surveiller les autres apps (le mobile ne les importe pas).
// Le backend tourne en `nest --watch` et reconstruit son `dist/` en continu, ce qui
// fait crasher le watcher de secours de Metro (ENOENT). On les exclut donc.
const workspaceRoot = path.resolve(__dirname, '../..');
const escape = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
const blocked = [
  new RegExp(`^${escape(path.join(workspaceRoot, 'apps', 'backend'))}/.*`),
  new RegExp(`^${escape(path.join(workspaceRoot, 'apps', 'web'))}/.*`),
];

const existingBlockList = config.resolver.blockList;
if (Array.isArray(existingBlockList)) {
  config.resolver.blockList = [...existingBlockList, ...blocked];
} else if (existingBlockList) {
  config.resolver.blockList = [existingBlockList, ...blocked];
} else {
  config.resolver.blockList = blocked;
}

module.exports = withNativeWind(config, { input: './global.css' });
