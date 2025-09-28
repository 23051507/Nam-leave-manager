const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

// Config connexion PostgreSQL
const pool = new Pool({
  user: "postgres", // Mets ton user PostgreSQL
  host: "localhost",
  database: "gestion_conges", // Mets le nom correct de ta base
  password: "postgres", // Ton mot de passe PostgreSQL
  port: 5432,
});

async function hashPasswords() {
  try {
    console.log("🚀 Hashing des mots de passe...");

    // Liste des utilisateurs avec mots de passe en clair
    const users = [
      { email: "admin@nams.com", password: "admin123" },
      { email: "rh@nams.com", password: "rh123" },
      { email: "coordo@nams.com", password: "coordo123" },
      { email: "employe@nams.com", password: "employe123" },
    ];

    for (let user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Mise à jour dans la BDD
      await pool.query(
        "UPDATE users SET password_hash = $1 WHERE email = $2",
        [hashedPassword, user.email]
      );

      console.log(`✅ Mot de passe hashé pour : ${user.email}`);
    }

    console.log("🎉 Hashing terminé avec succès !");
  } catch (err) {
    console.error("❌ Erreur :", err);
  } finally {
    await pool.end();
  }
}

hashPasswords();
