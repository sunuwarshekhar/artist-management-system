require("dotenv").config({
  path: [".env", ".env.local"],
  override: true,
  quiet: true,
});

const bcrypt = require("bcrypt");
const { query } = require("../src/database/config");

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash("password@123", 10);

    const result = await query(
      `INSERT INTO "user"
        (first_name, last_name, email, password, phone, dob, gender, address, role, created_at, updated_at)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, role`,
      [
        "Shekhar",
        "Sunuwar",
        "admin@gmail.com",
        hashedPassword,
        "9813815431",
        "2000-01-01",
        "m",
        "Kathmandu",
        "super_admin",
      ],
    );

    if (result.rowCount === 0) {
      console.log("This super admin user already exists!");
    } else {
      console.log("Super admin created successfully.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
