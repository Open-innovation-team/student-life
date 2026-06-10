// Configuration Metro pour le monorepo (npm workspaces).
//
// Sans elle, Metro charge DEUX copies de React : le code de l'app resout
// apps/mobile/node_modules/react (19.1.0) tandis que react-native resout la
// copie hoistee a la racine (tiree par l'app web) -> erreur "Invalid hook call"
// car renderer et hooks n'utilisent pas la meme instance de React.
//
// On surveille la racine du monorepo, on resout les deps depuis les deux
// node_modules, et on force une instance unique de react / react-native.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Instance unique de React : on redirige TOUT import de `react` (y compris
// celui fait par react-native depuis la racine) vers la copie de l'app
// (apps/mobile/node_modules/react, 19.1.0 attendue par Expo SDK 54). On ancre
// la resolution sur un fichier de l'app pour que la remontee node_modules
// trouve d'abord celle de l'app. extraNodeModules seul ne suffit pas (fallback).
const reactAnchor = path.join(projectRoot, 'package.json');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return context.resolveRequest(
      { ...context, originModulePath: reactAnchor },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
