// Keep the backend (Cloudflare Worker, with its own node_modules) out of the app bundle.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dir = path.join(__dirname, 'backend');
// Windows drive letters can come through in either case ("d:" / "D:").
const prefix = /^[A-Za-z]:/.test(dir) ? `[${dir[0].toLowerCase()}${dir[0].toUpperCase()}]${escape(dir.slice(1))}` : escape(dir);
const backend = new RegExp(`^${prefix}[\\\\/].*`);
const existing = config.resolver.blockList;
config.resolver.blockList = [...(Array.isArray(existing) ? existing : existing ? [existing] : []), backend];

module.exports = config;
