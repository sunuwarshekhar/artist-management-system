require("dotenv").config({
  path: [".env", ".env.local"],
  override: true,
  quiet: true,
});

const bcrypt = require("bcrypt");
const { query } = require("../src/database/config");

async function seedUser(hashedPassword, user) {
  const result = await query(
    `INSERT INTO "user"
      (first_name, last_name, email, password, phone, dob, gender, address, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email, role`,
    [
      user.first_name,
      user.last_name,
      user.email,
      hashedPassword,
      user.phone,
      user.dob,
      user.gender,
      user.address,
      user.role,
    ],
  );

  if (result.rowCount > 0) {
    console.log(`${user.role} created: ${user.email}`);
    return;
  }

  console.log(`${user.role} already exists: ${user.email}`);
}

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash("password@123", 10);

    await seedUser(hashedPassword, {
      first_name: "Shekhar",
      last_name: "Sunuwar",
      email: "admin@gmail.com",
      phone: "9813815431",
      dob: "2000-01-01",
      gender: "m",
      address: "Kathmandu",
      role: "super_admin",
    });

    await seedUser(hashedPassword, {
      first_name: "Rita",
      last_name: "Gurung",
      email: "manager@gmail.com",
      phone: "9855458684",
      dob: "1995-06-15",
      gender: "f",
      address: "Pokhara",
      role: "artist_manager",
    });

    await seedUser(hashedPassword, {
      first_name: "Bipul",
      last_name: "Chettri",
      email: "bipul@gmail.com",
      phone: "9831532145",
      dob: "1998-03-20",
      gender: "m",
      address: "Lalitpur",
      role: "artist",
    });

    await seedUser(hashedPassword, {
      first_name: "Sujata",
      last_name: "Khatri",
      email: "sujata@gmail.com",
      phone: "9802222222",
      dob: "1999-11-08",
      gender: "f",
      address: "Bhaktapur",
      role: "artist",
    });

    console.log("Seed completed.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
