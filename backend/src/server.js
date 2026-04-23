require("dotenv").config();
const app = require("./app");
const prisma = require("./config/prisma");

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    if (error?.errorCode === "P1000") {
      console.error("Failed to start server: invalid DATABASE_URL credentials.");
      console.error("Fix backend/.env or start PostgreSQL from docker-compose.yml.");
    } else if (error?.errorCode === "P1001") {
      console.error("Failed to start server: database server is unreachable.");
      console.error("Start PostgreSQL and verify host/port in backend/.env.");
    } else {
      console.error("Failed to start server:", error);
    }
    process.exit(1);
  }
}

bootstrap();
