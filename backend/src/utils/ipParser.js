/**
 * IP Parsing Utility
 * 
 * CRITICAL: Properly extracts client IP from various proxy headers.
 * Must be used after 'trust proxy' is set in Express.
 */

const getClientIp = (req) => {
  // Standard proxy headers (when trust proxy is enabled)
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare
  const cfIp = req.headers['x-cf-connecting-ip']; // Alternative CF header
  
  // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2, ...
  // The first IP is always the original client
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0]; // Always return the first (original client) IP
  }
  
  // X-Real-IP (nginx)
  if (realIp) {
    return realIp.trim();
  }
  
  // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  if (cfIp) {
    return cfIp.trim();
  }
  
  // Fallback to direct connection IP
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

/**
 * Parse and validate IP address
 * Returns null if invalid
 */
const parseIpAddress = (ip) => {
  if (!ip || ip === 'unknown') return null;
  
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Pattern);
  
  if (match) {
    // Validate each octet (0-255)
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i], 10);
      if (octet > 255) return null;
    }
    return ip;
  }
  
  // IPv6 (simplified check)
  if (ip.includes(':')) {
    return ip; // Accept IPv6 as-is for now
  }
  
  return null;
};

/**
 * Get normalized client IP
 */
const getNormalizedClientIp = (req) => {
  const ip = getClientIp(req);
  return parseIpAddress(ip);
};

/**
 * Get all IPs from X-Forwarded-For (for logging/audit)
 */
const getAllForwardedIps = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (!forwardedFor) return [];
  
  return forwardedFor
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => parseIpAddress(ip));
};

/**
 * Check if request is from a known bot/crawler
 * This is a simple heuristic - production would use a more robust solution
 */
const isKnownBot = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const botIndicators = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 
    'baiduspider', 'yandexbot', 'facebot', 'applebot',
    'GPTBot', 'Claude-Web', 'CCBot', 'anthropic-ai'
  ];
  
  const lowerUA = userAgent.toLowerCase();
  return botIndicators.some(bot => lowerUA.includes(bot));
};

module.exports = {
  getClientIp,
  parseIpAddress,
  getNormalizedClientIp,
  getAllForwardedIps,
  isKnownBot,
};