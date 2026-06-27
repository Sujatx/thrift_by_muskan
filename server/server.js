require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./config/db");
const cron = require("node-cron");
const { releaseExpiredReservations } = require("./jobs/releaseExpiredReservations");

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    const Admin = require("./models/Admin");
    const bcrypt = require("bcryptjs");

    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;

    if (email && password) {
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Upsert: Create or Update the initial admin
      const admin = await Admin.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { passwordHash },
        { upsert: true, returnDocument: 'after' }
      );
      
      console.log(`[Bootstrap] Initial admin synced: ${admin.email}`);
    }
  } catch (err) {
    console.error("[Bootstrap] Failed to sync initial admin", err);
  }
}

async function start() {
  await connectDB();
  await bootstrap();

  cron.schedule("*/5 * * * *", () => {
    releaseExpiredReservations().catch((err) => {
      console.error("Reservation cleanup failed", err);
    });
  });

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Startup error", err);
  process.exit(1);
});
