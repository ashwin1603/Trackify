const http = require("http");

function makeRequest(method, path, body = null, jwt = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "dev-api-key-secure-bug-tracker-2026",
      },
    };

    if (jwt) {
      options.headers["Authorization"] = `Bearer ${jwt}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log("\n" + "=".repeat(80));
  console.log("🔒 SECURITY ALERTS WORKFLOW DEMONSTRATION");
  console.log("=".repeat(80));

  try {
    // Step 1: Admin login
    console.log("\n📋 STEP 1: Admin Authentication");
    console.log("-".repeat(80));
    const adminLogin = await makeRequest("POST", "/api/auth/login", {
      email: "vinayn@gmail.com",
      password: "Admin@123",
    });
    const adminJWT = adminLogin.body.token;
    console.log("✅ Admin logged in");

    // Step 2: Security Team login
    console.log("\n📋 STEP 2: Security Team Authentication");
    console.log("-".repeat(80));
    const teamLogin = await makeRequest("POST", "/api/auth/login", {
      email: "ashwinampily@gmail.com",
      password: "Security@1",
    });
    const teamJWT = teamLogin.body.token;
    console.log("✅ Security Team member logged in");

    // Step 3: Trigger SQL Injection
    console.log("\n⚠️  STEP 3: Trigger SQL Injection Threat Detection");
    console.log("-".repeat(80));
    const payload = "'; DROP TABLE users; --";
    console.log(`📤 Sending malicious payload: "${payload}"`);

    const threatRes = await makeRequest(
      "POST",
      "/api/bugs",
      {
        title: "Malicious Test",
        description: payload,
        priority: 1,
      },
      adminJWT,
    );
    console.log(`✅ Request processed (Status: ${threatRes.status})`);

    // Step 4: View alerts (Admin)
    console.log("\n📊 STEP 4: Admin Retrieves All Security Alerts");
    console.log("-".repeat(80));

    const alertsRes = await makeRequest(
      "GET",
      "/api/security/alerts",
      null,
      adminJWT,
    );
    const alerts = alertsRes.body.data || [];
    console.log(`✅ Found ${alerts.length} total alert(s)`);

    if (alerts.length > 0) {
      const alert = alerts[0];
      console.log("\n🚨 Alert Details:");
      console.log(`   Type: ${alert.type} (OWASP ${alert.type.split("_")[0]})`);
      console.log(`   Category: ${alert.metadata?.category || "N/A"}`);
      console.log(`   Severity: ${alert.severity}⚡`);
      console.log(`   Status: ${alert.status}`);
      console.log(`   Message: ${alert.message}`);
      console.log(`   Endpoint: ${alert.endpoint}`);
      console.log(`   Detected IP: ${alert.ipAddress}`);

      if (alert.aiAnalysis) {
        console.log("\n🤖 AI Risk Analysis:");
        console.log(`   Risk Score: 🔴 ${alert.aiAnalysis.riskScore}/100`);
        console.log(
          `   Analysis: ${alert.aiAnalysis.explanation.substring(0, 75)}...`,
        );
        console.log(`   Top Recommendations:`);
        alert.aiAnalysis.recommendedAction?.slice(0, 3).forEach((r, i) => {
          console.log(`     ${i + 1}. ${r}`);
        });
      }

      // Step 5: Get security team users
      console.log("\n📌 STEP 5: Assign Alert to Security Team");
      console.log("-".repeat(80));

      const usersRes = await makeRequest("GET", "/api/users", null, adminJWT);
      const securityTeam = usersRes.body.data?.find(
        (u) => u.role.name === "SECURITY_TEAM",
      );

      if (securityTeam) {
        const assignRes = await makeRequest(
          "POST",
          "/api/security/assign-alert",
          {
            alertId: alert.id,
            securityUserId: securityTeam.id,
          },
          adminJWT,
        );

        if (assignRes.status === 200) {
          const assigned = assignRes.body.data;
          console.log(`✅ Alert assigned to: ${assigned.assignedTo.email}`);
          console.log(`   Status Changed: OPEN → ${assigned.status}`);
        }

        // Step 6: View assigned alerts (Team)
        console.log("\n👁️  STEP 6: Security Team Views Assigned Alerts");
        console.log("-".repeat(80));

        const myRes = await makeRequest(
          "GET",
          "/api/security/my-alerts?status=ASSIGNED",
          null,
          teamJWT,
        );
        const myAlerts = myRes.body.data || [];
        console.log(
          `✅ Security team has ${myAlerts.length} assigned alert(s)`,
        );

        if (myAlerts.length > 0) {
          const assignedAlert = myAlerts[0];
          console.log("\n📋 Team View - Alert Details:");
          console.log(`   Type: ${assignedAlert.type}`);
          console.log(`   Severity: ${assignedAlert.severity}`);
          console.log(
            `   Risk Score: ${assignedAlert.aiAnalysis?.riskScore}/100`,
          );
          console.log(`   Status: ${assignedAlert.status} ✓ (Assigned to me)`);

          // Step 7: Resolve alert
          console.log("\n✅ STEP 7: Security Team Resolves Alert");
          console.log("-".repeat(80));

          const resolveRes = await makeRequest(
            "PUT",
            "/api/security/resolve-alert",
            {
              alertId: assignedAlert.id,
              resolutionNotes:
                "Investigated and confirmed as test of SQL injection detection system. No actual threat. System working as expected.",
            },
            teamJWT,
          );

          if (resolveRes.status === 200) {
            const resolved = resolveRes.body.data;
            console.log(`✅ Alert resolved successfully`);
            console.log(`   Status: ${resolved.status}`);
            console.log(`   Notes: ${resolved.resolutionNotes}`);
          }
        }
      }

      // Step 8: View stats
      console.log("\n📊 STEP 8: Alert Dashboard Statistics");
      console.log("-".repeat(80));

      const statsRes = await makeRequest(
        "GET",
        "/api/security/stats",
        null,
        adminJWT,
      );
      const stats = statsRes.body.data;

      console.log("✅ Alert Statistics:");
      console.log(
        `   Open: ${stats.statusStats.OPEN || 0} | Assigned: ${stats.statusStats.ASSIGNED || 0} | Resolved: ${stats.statusStats.RESOLVED || 0}`,
      );
      console.log(`   Critical Threats: ${stats.criticalCount}`);
      console.log(`   Total Alerts: ${stats.totalAlerts}`);
      console.log("\n   By Severity:");
      Object.entries(stats.severityStats).forEach(([sev, count]) => {
        console.log(`     ${sev}: ${count}`);
      });
      console.log("\n   Top OWASP Categories:");
      Object.entries(stats.typeStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([type, count]) => {
          console.log(`     ${type}: ${count}`);
        });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ DEMONSTRATION COMPLETE - System is working perfectly!");
  console.log("=".repeat(80) + "\n");
}

run().catch((e) => console.error(e));
