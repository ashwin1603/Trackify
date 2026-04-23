/**
 * OWASP Threat Detection & Alert System Test Suite
 * Examples and tests for threat detection, alerts, and security workflows
 */

const API_BASE = "http://localhost:3000/api";
const API_KEY = "dev-api-key-secure-bug-tracker-2026";
const ADMIN_JWT = "your-admin-jwt-token-here";
const SECURITY_JWT = "your-security-team-jwt-token-here";

// Common headers
const adminHeaders = {
  Authorization: `Bearer ${ADMIN_JWT}`,
  "X-API-Key": API_KEY,
  "Content-Type": "application/json",
};

const securityHeaders = {
  Authorization: `Bearer ${SECURITY_JWT}`,
  "X-API-Key": API_KEY,
  "Content-Type": "application/json",
};

/**
 * TEST 1: SQL Injection Detection
 * Should trigger A05_INJECTION alert
 */
async function testSQLInjectionDetection() {
  console.log("\n🧪 TEST 1: SQL Injection Detection");

  try {
    const response = await fetch(`${API_BASE}/bugs`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "Test Bug",
        description: "'; OR 1=1; --",
        priority: 1,
      }),
    });

    console.log(`✓ Request sent with SQL injection payload`);

    // Check if alert was created
    const alerts = await getAlerts({ type: "A05_INJECTION" });
    if (alerts.some((a) => a.metadata?.category === "SQL_INJECTION")) {
      console.log("✓ SQL Injection alert created successfully");
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 2: XSS Payload Detection
 * Should trigger A05_INJECTION with CROSS_SITE_SCRIPTING category
 */
async function testXSSDetection() {
  console.log("\n🧪 TEST 2: XSS Detection");

  try {
    const response = await fetch(`${API_BASE}/comments`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        bugId: "bug-id",
        content: "<script>alert('xss')</script>",
      }),
    });

    console.log(`✓ Request sent with XSS payload`);

    // Check alerts
    const alerts = await getAlerts({ type: "A05_INJECTION", severity: "HIGH" });
    const xssAlert = alerts.find(
      (a) => a.metadata?.category === "CROSS_SITE_SCRIPTING",
    );
    if (xssAlert) {
      console.log("✓ XSS alert created");
      console.log(`  - Risk Score: ${xssAlert.aiAnalysis?.riskScore}`);
      console.log(
        `  - Recommendation: ${xssAlert.aiAnalysis?.recommendedAction?.[0]}`,
      );
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 3: Brute Force Detection (Simulated)
 * Trigger A07_AUTHENTICATION_FAILURES
 */
async function testBruteForceDetection() {
  console.log("\n🧪 TEST 3: Brute Force Detection");

  try {
    // Simulate 6 failed login attempts
    for (let i = 0; i < 6; i++) {
      await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      });
    }

    console.log(`✓ Sent 6 failed login attempts`);

    // Check for brute force alert
    const alerts = await getAlerts({ type: "A07_AUTHENTICATION_FAILURES" });
    const bruteForceAlert = alerts.find(
      (a) => a.metadata?.category === "BRUTE_FORCE",
    );
    if (bruteForceAlert) {
      console.log("✓ Brute force alert created");
      console.log(`  - Severity: ${bruteForceAlert.severity}`);
      console.log(`  - Message: ${bruteForceAlert.message}`);
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 4: Unauthorized Access Detection
 * Try accessing another user's data - should trigger A01
 */
async function testUnauthorizedAccess() {
  console.log("\n🧪 TEST 4: Unauthorized Access Detection");

  try {
    const response = await fetch(`${API_BASE}/users/other-user-id`, {
      method: "GET",
      headers: adminHeaders,
    });

    if (response.status === 403) {
      console.log(`✓ Unauthorized access rejected (403)`);

      const alerts = await getAlerts({ type: "A01_BROKEN_ACCESS_CONTROL" });
      if (alerts.length > 0) {
        console.log("✓ Access control alert created");
      }
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 5: API Key Validation
 * Missing API key should return 403
 */
async function testMissingAPIKey() {
  console.log("\n🧪 TEST 5: Missing API Key");

  try {
    const response = await fetch(`${API_BASE}/security/alerts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ADMIN_JWT}`,
        "Content-Type": "application/json",
        // X-API-Key intentionally missing
      },
    });

    if (response.status === 403) {
      const data = await response.json();
      console.log(`✓ Request rejected without API key`);
      console.log(`  - Status: ${response.status}`);
      console.log(`  - Message: ${data.error?.message}`);
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 6: Get All Alerts (Admin)
 * Admin can view all alerts with filtering
 */
async function testGetAllAlerts() {
  console.log("\n🧪 TEST 6: Get All Alerts (Admin)");

  try {
    const response = await fetch(
      `${API_BASE}/security/alerts?severity=CRITICAL&limit=10`,
      {
        method: "GET",
        headers: adminHeaders,
      },
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Retrieved ${data.data.length} alerts`);
      console.log(`  - Total alerts: ${data.pagination.total}`);

      if (data.data.length > 0) {
        const alert = data.data[0];
        console.log(`\n  Sample alert:`);
        console.log(`  - Type: ${alert.type}`);
        console.log(`  - Severity: ${alert.severity}`);
        console.log(`  - Status: ${alert.status}`);
        console.log(`  - Risk Score: ${alert.aiAnalysis?.riskScore}`);
      }
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 7: Assign Alert (Admin)
 * Admin assigns alert to security team member
 */
async function testAssignAlert(alertId, securityUserId) {
  console.log("\n🧪 TEST 7: Assign Alert");

  try {
    const response = await fetch(`${API_BASE}/security/assign-alert`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        alertId,
        securityUserId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Alert assigned successfully`);
      console.log(`  - Status: ${data.data.status}`);
      console.log(`  - Assigned to: ${data.data.assignedTo?.email}`);
    } else {
      console.error(`✗ Failed to assign alert: ${response.status}`);
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 8: Get My Alerts (Security Team)
 * Security team member views assigned alerts
 */
async function testGetMyAlerts() {
  console.log("\n🧪 TEST 8: Get My Alerts (Security Team)");

  try {
    const response = await fetch(`${API_BASE}/security/my-alerts`, {
      method: "GET",
      headers: securityHeaders,
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Retrieved ${data.data.length} assigned alerts`);

      if (data.data.length > 0) {
        const alert = data.data[0];
        console.log(`\n  Sample alert:`);
        console.log(`  - ID: ${alert.id}`);
        console.log(`  - Type: ${alert.type}`);
        console.log(`  - Message: ${alert.message}`);
        console.log(`  - Created: ${alert.createdAt}`);
      }
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 9: Resolve Alert (Security Team)
 * Security team member resolves alert with notes
 */
async function testResolveAlert(alertId) {
  console.log("\n🧪 TEST 9: Resolve Alert");

  try {
    const response = await fetch(`${API_BASE}/security/resolve-alert`, {
      method: "PUT",
      headers: securityHeaders,
      body: JSON.stringify({
        alertId,
        resolutionNotes: "False positive - legitimate test activity",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Alert resolved successfully`);
      console.log(`  - Status: ${data.data.status}`);
      console.log(`  - Notes: ${data.data.resolutionNotes}`);
    } else {
      console.error(`✗ Failed to resolve alert: ${response.status}`);
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 10: Get Alert Statistics
 * View security alert statistics
 */
async function testGetAlertStats() {
  console.log("\n🧪 TEST 10: Get Alert Statistics");

  try {
    const response = await fetch(`${API_BASE}/security/stats`, {
      method: "GET",
      headers: adminHeaders,
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Alert statistics retrieved`);
      console.log(`\n  Status Distribution:`);
      Object.entries(data.data.statusStats).forEach(([status, count]) => {
        console.log(`    - ${status}: ${count}`);
      });

      console.log(`\n  Severity Distribution:`);
      Object.entries(data.data.severityStats).forEach(([severity, count]) => {
        console.log(`    - ${severity}: ${count}`);
      });

      console.log(`\n  Top Threat Types:`);
      Object.entries(data.data.typeStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([type, count]) => {
          console.log(`    - ${type}: ${count}`);
        });

      console.log(`\n  Summary:`);
      console.log(`    - Open alerts: ${data.data.openCount}`);
      console.log(`    - Critical alerts: ${data.data.criticalCount}`);
      console.log(`    - Total alerts: ${data.data.totalAlerts}`);
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * HELPER: Get alerts with filters
 */
async function getAlerts(filters = {}) {
  try {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE}/security/alerts?${queryString}`, {
      method: "GET",
      headers: adminHeaders,
    });

    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch alerts:", error.message);
    return [];
  }
}

/**
 * TEST 11: Create API Key (Admin)
 */
async function testCreateAPIKey() {
  console.log("\n🧪 TEST 11: Create API Key");

  try {
    const response = await fetch(`${API_BASE}/security/api-keys`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Production API Key - " + new Date().toISOString(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ API key created successfully`);
      console.log(`  - Key: ${data.data.key}`);
      console.log(`  - Name: ${data.data.name}`);
      console.log(`  - Active: ${data.data.active}`);
    } else {
      console.error(`✗ Failed to create API key: ${response.status}`);
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

/**
 * TEST 12: List API Keys (Admin)
 */
async function testListAPIKeys() {
  console.log("\n🧪 TEST 12: List API Keys");

  try {
    const response = await fetch(`${API_BASE}/security/api-keys`, {
      method: "GET",
      headers: adminHeaders,
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Retrieved ${data.data.length} API keys`);

      data.data.forEach((key) => {
        console.log(`\n  - Name: ${key.name}`);
        console.log(`    Key: ${key.key.substring(0, 10)}...`);
        console.log(`    Active: ${key.active}`);
        console.log(`    Created: ${key.createdAt}`);
        console.log(`    Last Used: ${key.lastUsedAt || "Never"}`);
      });
    }
  } catch (error) {
    console.error("✗ Test failed:", error.message);
  }
}

// ============ EXPORT TEST FUNCTIONS ============
module.exports = {
  testSQLInjectionDetection,
  testXSSDetection,
  testBruteForceDetection,
  testUnauthorizedAccess,
  testMissingAPIKey,
  testGetAllAlerts,
  testAssignAlert,
  testGetMyAlerts,
  testResolveAlert,
  testGetAlertStats,
  testCreateAPIKey,
  testListAPIKeys,
};

// Run all tests
async function runAllTests() {
  console.log("=== OWASP THREAT DETECTION SYSTEM TEST SUITE ===\n");

  try {
    await testMissingAPIKey();
    await testSQLInjectionDetection();
    await testXSSDetection();
    await testUnauthorizedAccess();
    await testGetAllAlerts();
    await testGetAlertStats();
    await testCreateAPIKey();
    await testListAPIKeys();

    console.log("\n=== ALL TESTS COMPLETED ===");
  } catch (error) {
    console.error("Test suite failed:", error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests();
}
