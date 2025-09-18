const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

// Load env if exists
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

const { initializeDatabase, User } = require("../lib/sequelize");

async function main() {
  try {
    await initializeDatabase();

    const email = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "admin123";
    const username = process.env.ADMIN_USERNAME || process.env.SEED_ADMIN_USERNAME || "admin";

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`User with email ${email} already exists.`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, password_hash: passwordHash });
    console.log("Seeded admin user:", { id: user.id, email: user.email, username: user.username });
    console.log("Use these credentials to login:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  }
}

main();

