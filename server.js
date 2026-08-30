require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const JWT_SECRET = process.env.JWT_SECRET || "change-cette-phrase-secrete";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "2026";
const DRENA_PASSWORD = process.env.DRENA_PASSWORD || "drena2026";
const PORT = process.env.PORT || 4000;

const adapter = new FileSync(path.join(__dirname, "data", "db.json"));
const db = low(adapter);

db.defaults({
  schools: [
    { id: "challenger", name: "Collège Privé Le Challenger", city: "Boundiali", region: "Boundiali", statut: "actif", echeance: "2026-09-05", passwordHash: bcrypt.hashSync("challenger2026", 8), data: {} },
    { id: "sacre-coeur", name: "Groupe Scolaire Sacré-Cœur", city: "Korhogo", region: "Korhogo", statut: "actif", echeance: "2026-08-15", passwordHash: bcrypt.hashSync("sacrecoeur2026", 8), data: {} },
    { id: "avenir", name: "Complexe Scolaire L'Avenir", city: "Ferkessédougou", region: "Ferkessédougou", statut: "actif", echeance: "2026-08-01", passwordHash: bcrypt.hashSync("avenir2026", 8), data: {} },
  ],
}).write();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

function requireAuth(role) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Connexion requise." });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (role && decoded.role !== role) return res.status(403).json({ error: "Accès refusé." });
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: "Session expirée, reconnectez-vous." });
    }
  };
}

function schoolGuard(req, res, next) {
  const school = db.get("schools").find({ id: req.user.schoolId }).value();
  if (!school) return res.status(404).json({ error: "Établissement introuvable." });
  if (school.statut !== "actif") return res.status(403).json({ error: "Accès suspendu pour défaut de paiement.", statut: school.statut });
  req.school = school;
  next();
}

/* ---------- Espace administrateur ---------- */

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Code administrateur incorrect." });
  res.json({ token: signToken({ role: "admin" }) });
});

app.get("/api/admin/schools", requireAuth("admin"), (req, res) => {
  const schools = db.get("schools").value().map(({ data, passwordHash, ...rest }) => rest);
  res.json(schools);
});

app.post("/api/admin/schools", requireAuth("admin"), (req, res) => {
  const { id, name, city, password } = req.body || {};
  if (!id || !name || !password) return res.status(400).json({ error: "Identifiant, nom et mot de passe requis." });
  if (db.get("schools").find({ id }).value()) return res.status(409).json({ error: "Cet identifiant existe déjà." });
  const school = { id, name, city: city || "", statut: "actif", echeance: "", passwordHash: bcrypt.hashSync(password, 8), data: {} };
  db.get("schools").push(school).write();
  const { data, passwordHash, ...rest } = school;
  res.json(rest);
});

app.patch("/api/admin/schools/:id/mot-de-passe", requireAuth("admin"), (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 4) return res.status(400).json({ error: "Mot de passe trop court (4 caractères minimum)." });
  const ref = db.get("schools").find({ id: req.params.id });
  if (!ref.value()) return res.status(404).json({ error: "Établissement introuvable." });
  ref.assign({ passwordHash: bcrypt.hashSync(password, 8) }).write();
  res.json({ ok: true });
});

app.patch("/api/admin/schools/:id/statut", requireAuth("admin"), (req, res) => {
  const { statut } = req.body || {};
  if (!["actif", "suspendu"].includes(statut)) return res.status(400).json({ error: "Statut invalide." });
  const ref = db.get("schools").find({ id: req.params.id });
  if (!ref.value()) return res.status(404).json({ error: "Établissement introuvable." });
  ref.assign({ statut }).write();
  res.json(ref.value());
});

app.patch("/api/admin/schools/:id/echeance", requireAuth("admin"), (req, res) => {
  const { echeance } = req.body || {};
  const ref = db.get("schools").find({ id: req.params.id });
  if (!ref.value()) return res.status(404).json({ error: "Établissement introuvable." });
  ref.assign({ echeance }).write();
  res.json(ref.value());
});

/* ---------- Connexion côté établissement ---------- */

app.post("/api/schools/:id/login", (req, res) => {
  const { password } = req.body || {};
  const school = db.get("schools").find({ id: req.params.id }).value();
  if (!school) return res.status(404).json({ error: "Établissement introuvable." });
  if (school.statut !== "actif") {
    return res.status(403).json({ error: "Accès suspendu pour défaut de paiement. Contactez l'administrateur de la plateforme.", statut: school.statut });
  }
  if (!password || !bcrypt.compareSync(password, school.passwordHash || "")) {
    return res.status(401).json({ error: "Mot de passe incorrect." });
  }
  res.json({
    token: signToken({ role: "school", schoolId: school.id }),
    school: { id: school.id, name: school.name, city: school.city, statut: school.statut },
  });
});

// Vérification rapide et publique du statut (pratique pour afficher un message avant même de se connecter)
app.get("/api/schools/:id/status", (req, res) => {
  const school = db.get("schools").find({ id: req.params.id }).value();
  if (!school) return res.status(404).json({ error: "Établissement introuvable." });
  res.json({ statut: school.statut, echeance: school.echeance });
});

app.get("/api/schools", (req, res) => {
  const schools = db.get("schools").value().map(({ data, passwordHash, ...rest }) => rest);
  res.json(schools);
});

/* ---------- Espace régional (DRENA / DDENA) ---------- */

app.post("/api/drena/login", (req, res) => {
  const { password } = req.body || {};
  if (password !== DRENA_PASSWORD) return res.status(401).json({ error: "Code régional incorrect." });
  res.json({ token: signToken({ role: "drena" }) });
});

// Vue consolidée : agrège les données de toutes les écoles actives à partir de leur `data` sauvegardée
app.get("/api/drena/overview", requireAuth("drena"), (req, res) => {
  const schools = db.get("schools").value();
  const overview = schools.map((s) => {
    const d = s.data || {};
    const eleves = d.eleves || [];
    const personnel = d.personnel || [];
    const moyennes = d.moyennes || {};
    const nonRemontes = eleves.filter((e) => {
      const notes = moyennes[e.id];
      if (!notes) return true;
      const periodes = notes.T1 || notes.T2 || notes.T3 ? [notes.T1, notes.T2, notes.T3] : [notes];
      return periodes.every((p) => !p || Object.keys(p).length === 0);
    }).length;
    return {
      id: s.id, name: s.name, city: s.city, region: s.region || s.city, statut: s.statut,
      effectifEleves: eleves.length,
      effectifFilles: eleves.filter((e) => e.sexe === "F").length,
      effectifPersonnel: personnel.length,
      redoublants: eleves.filter((e) => e.doublant).length,
      candidatsBepc: eleves.filter((e) => e.candidatBepc).length,
      candidatsBac: eleves.filter((e) => e.candidatBac).length,
      elevesNonRemontes: nonRemontes,
    };
  });
  res.json(overview);
});

/* ---------- Données de l'établissement (emplois, personnel, élèves, notes, paiements, messages, cours à domicile) ---------- */

app.get("/api/schools/:id/data", requireAuth("school"), schoolGuard, (req, res) => {
  if (req.params.id !== req.school.id) return res.status(403).json({ error: "Accès refusé." });
  res.json(req.school.data || {});
});

app.put("/api/schools/:id/data", requireAuth("school"), schoolGuard, (req, res) => {
  if (req.params.id !== req.school.id) return res.status(403).json({ error: "Accès refusé." });
  db.get("schools").find({ id: req.params.id }).assign({ data: req.body || {} }).write();
  res.json({ ok: true });
});

app.get("/", (req, res) => res.send("Serveur 2T School — en ligne."));

app.listen(PORT, () => {
  console.log(`\n2T School — serveur démarré : http://localhost:${PORT}`);
  console.log(`Code administrateur actuel : ${ADMIN_PASSWORD} (à changer dans le fichier .env)`);
  console.log(`Code régional (DRENA) actuel : ${DRENA_PASSWORD} (à changer dans le fichier .env)\n`);
});
