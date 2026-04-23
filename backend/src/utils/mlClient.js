/**
 * ML Service Client
 * Calls the Python FastAPI microservice for ML-based threat detection.
 * All calls are non-blocking: if the service is down, null is returned
 * so the rest of the security pipeline continues uninterrupted.
 */

const http = require("http");

const ML_SERVICE_HOST = process.env.ML_SERVICE_HOST || "127.0.0.1";
const ML_SERVICE_PORT = parseInt(process.env.ML_SERVICE_PORT || "5001", 10);
const ML_TIMEOUT_MS   = parseInt(process.env.ML_TIMEOUT_MS  || "2000", 10);

/** @param {string} path @param {object} body @returns {Promise<object|null>} */
function callService(path, body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);

    const options = {
      hostname: ML_SERVICE_HOST,
      port:     ML_SERVICE_PORT,
      path,
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve(null);
        }
      });
    });

    req.setTimeout(ML_TIMEOUT_MS, () => {
      req.destroy();
      resolve(null);
    });

    req.on("error", () => resolve(null));
    req.write(payload);
    req.end();
  });
}

/**
 * Classify an HTTP request as normal (0) or malicious (1).
 *
 * @param {{
 *   request_length:    number,
 *   num_special_chars: number,
 *   sql_keyword_count: number,
 *   has_script_tag:    number,
 *   num_parameters:    number
 * }} features
 * @returns {Promise<{ label: number, malicious_prob: number, risk_score: number }|null>}
 */
async function predictRequest(features) {
  return callService("/predict", features);
}

/**
 * Check whether a request flow is anomalous.
 *
 * @param {{
 *   flow_duration:          number,
 *   total_fwd_packets:      number,
 *   total_backward_packets: number,
 *   flow_bytes_per_sec:     number,
 *   flow_packets_per_sec:   number
 * }} features
 * @returns {Promise<{ is_anomaly: boolean, anomaly_score: number, risk_score: number }|null>}
 */
async function detectAnomaly(features) {
  return callService("/anomaly", features);
}

module.exports = { predictRequest, detectAnomaly };
