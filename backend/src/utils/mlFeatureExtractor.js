/**
 * ML Feature Extractor
 * =====================
 * Computes the exact feature vectors both ML models expect from an
 * Express `req` object and an in-memory per-IP session tracker.
 *
 * REQUEST MODEL features (5):
 *   request_length    – byte length of URL + serialised body
 *   num_special_chars – count of < > ' " ; | & { } $ in the payload
 *   sql_keyword_count – occurrences of common SQL keywords
 *   has_script_tag    – 1 if <script found anywhere in payload
 *   num_parameters    – total query + body parameter count
 *
 * ANOMALY MODEL features (5, passed through StandardScaler):
 *   Flow Duration          – ms since this IP's session window opened
 *   Total Fwd Packets      – total request count from IP in window
 *   Total Backward Packets – approximated as fwd count
 *   Flow Bytes/s           – bytes per second rate for this IP
 *   Flow Packets/s         – requests per second for this IP
 */

// ─── SQL keyword list ─────────────────────────────────────────────────────────
const SQL_KEYWORDS = [
  "select", "insert", "update", "delete", "drop", "create", "alter",
  "union",  "join",   "where",  "from",   "having", "group",
  "exec",   "execute","cast",   "convert","declare","xp_",
];

// ─── Special characters the model was trained on ─────────────────────────────
const SPECIAL_CHARS = new Set(["<", ">", "'", '"', ";", "|", "&", "{", "}", "$"]);

// ─── In-memory per-IP session tracker (TTL: 5 minutes) ───────────────────────
const SESSION_TTL_MS  = 5 * 60 * 1000;   // 5 minutes
const ipSessions      = new Map();        // ip → { startTime, requestCount, totalBytes, lastSeen }

function getSession(ip, payloadBytes) {
  const now = Date.now();

  if (ipSessions.has(ip)) {
    const s = ipSessions.get(ip);
    // Reset if session has expired
    if (now - s.startTime > SESSION_TTL_MS) {
      ipSessions.set(ip, { startTime: now, requestCount: 1, totalBytes: payloadBytes, lastSeen: now });
    } else {
      s.requestCount++;
      s.totalBytes += payloadBytes;
      s.lastSeen    = now;
    }
  } else {
    ipSessions.set(ip, { startTime: now, requestCount: 1, totalBytes: payloadBytes, lastSeen: now });
  }

  // Prune old sessions periodically (every 500 requests)
  if (Math.random() < 0.002) {
    for (const [k, v] of ipSessions) {
      if (now - v.startTime > SESSION_TTL_MS) ipSessions.delete(k);
    }
  }

  return ipSessions.get(ip);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function countSpecialChars(str) {
  let count = 0;
  for (const ch of str) {
    if (SPECIAL_CHARS.has(ch)) count++;
  }
  return count;
}

function countSQLKeywords(str) {
  const lower = str.toLowerCase();
  let count = 0;
  for (const kw of SQL_KEYWORDS) {
    // Simple occurrence count (not word-boundary – matches training approach)
    let idx = 0;
    while ((idx = lower.indexOf(kw, idx)) !== -1) {
      count++;
      idx += kw.length;
    }
  }
  return count;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Extract features for the RandomForest request classifier.
 * @param {import('express').Request} req
 * @returns {{ request_length, num_special_chars, sql_keyword_count, has_script_tag, num_parameters }}
 */
function extractRequestFeatures(req) {
  // Strip out text-heavy fields meant for code/bugs from ML extraction
  let bodyCopy = req.body;
  if (typeof req.body === "object" && req.body !== null) {
    bodyCopy = { ...req.body };
    delete bodyCopy.title;
    delete bodyCopy.description;
  }
  
  const bodyStr  = typeof bodyCopy === "object" ? JSON.stringify(bodyCopy) : String(bodyCopy || "");
  const queryStr = JSON.stringify(req.query || {});
  const payload  = req.originalUrl + bodyStr;

  const request_length    = Buffer.byteLength(payload, "utf8");
  const num_special_chars = countSpecialChars(payload);
  const sql_keyword_count = countSQLKeywords(payload);
  const has_script_tag    = /<script/i.test(payload) ? 1 : 0;
  const num_parameters    =
    Object.keys(req.query  || {}).length +
    (typeof req.body === "object" ? Object.keys(req.body).length : 0);

  return { request_length, num_special_chars, sql_keyword_count, has_script_tag, num_parameters };
}

/**
 * Extract features for the IsolationForest anomaly detector.
 * @param {import('express').Request} req
 * @returns {{ flow_duration, total_fwd_packets, total_backward_packets, flow_bytes_per_sec, flow_packets_per_sec }}
 */
function extractAnomalyFeatures(req) {
  // Strip out text-heavy fields meant for code/bugs from ML extraction
  let bodyCopy = req.body;
  if (typeof req.body === "object" && req.body !== null) {
    bodyCopy = { ...req.body };
    delete bodyCopy.title;
    delete bodyCopy.description;
  }

  const bodyStr    = typeof bodyCopy === "object" ? JSON.stringify(bodyCopy) : String(bodyCopy || "");
  const payloadLen = Buffer.byteLength(req.originalUrl + bodyStr, "utf8");
  const ip         = req.ip || "unknown";
  const session    = getSession(ip, payloadLen);

  const now            = Date.now();
  const flow_duration  = Math.max(1, now - session.startTime);         // ms
  const fwd_packets    = session.requestCount;
  const elapsed_sec    = flow_duration / 1000;

  return {
    flow_duration:          flow_duration,
    total_fwd_packets:      fwd_packets,
    total_backward_packets: fwd_packets,                               // approximation
    flow_bytes_per_sec:     session.totalBytes / elapsed_sec,
    flow_packets_per_sec:   fwd_packets / elapsed_sec,
  };
}

module.exports = { extractRequestFeatures, extractAnomalyFeatures };
