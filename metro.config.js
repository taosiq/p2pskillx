// Keep the backend (Cloudflare Worker) and the rules tests, each with their own
// node_modules, out of the app bundle.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const blockDir = (name) => {
  const dir = path.join(__dirname, name);
  // Windows drive letters can come through in either case ("d:" / "D:").
  const prefix = /^[A-Za-z]:/.test(dir) ? `[${dir[0].toLowerCase()}${dir[0].toUpperCase()}]${escape(dir.slice(1))}` : escape(dir);
  return new RegExp(`^${prefix}[\\\\/].*`);
};

const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  blockDir('backend'),
  blockDir('firestore-tests'),
];

module.exports = config;
