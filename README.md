# Serveur 2T School (Tamani Tèhè)

Ce dossier contient le **serveur central** de 2T School. C'est lui qui garde en mémoire, de façon permanente, la liste des établissements, leur statut (à jour / suspendu) et leurs données.

## 1. Installer sur un ordinateur (une seule fois)

1. Installer **Node.js** (version 18 ou plus récente) : https://nodejs.org — choisir la version "LTS", cliquer Suivant partout.
2. Copier ce dossier `2t-school-server` sur l'ordinateur qui va faire office de serveur.
3. Ouvrir une invite de commande (ou Terminal) dans ce dossier.
4. Copier le fichier `.env.example` en `.env` et changer les valeurs :
   - `ADMIN_PASSWORD` → le code d'accès de l'espace administrateur
   - `JWT_SECRET` → n'importe quelle longue phrase secrète
5. Lancer :
   ```
   npm install
   npm start
   ```
6. Le terminal affiche : `2T School — serveur démarré : http://localhost:4000`

Tant que ce terminal reste ouvert, le serveur tourne. Les données sont sauvegardées automatiquement dans `data/db.json`.

## 2. Utiliser l'application avec ce serveur

Ouvre le fichier de l'application 2T School : elle affiche un écran de connexion (choix de l'établissement + mot de passe, ou onglet Administrateur). Par défaut, elle cherche le serveur à l'adresse `http://localhost:4000`. Si le serveur tourne sur un autre ordinateur ou est hébergé en ligne, clique sur "Paramètres du serveur" sur l'écran de connexion et indique la bonne adresse.

## 3. Identifiants par défaut (à changer après la première connexion)

| Établissement | Identifiant | Mot de passe par défaut |
|---|---|---|
| Collège Privé Le Challenger | `challenger` | `challenger2026` |
| Groupe Scolaire Sacré-Cœur | `sacre-coeur` | `sacrecoeur2026` |
| Complexe Scolaire L'Avenir | `avenir` | `avenir2026` |

Espace administrateur : mot de passe défini dans `.env` (`ADMIN_PASSWORD`, `2026` par défaut).

Depuis l'espace administrateur, tu peux changer le mot de passe de chaque établissement à tout moment (bouton "Changer le mot de passe"), ajouter un nouvel établissement, et suspendre/réactiver l'accès de n'importe lequel.

## 4. Ce que le serveur permet déjà

- Un **espace administrateur** protégé par mot de passe
- La liste des établissements et leur **statut** : actif ou suspendu
- **Suspendre / réactiver** un établissement, et **changer son mot de passe**, à tout moment
- Dès qu'un établissement est suspendu, sa connexion est **automatiquement refusée**, sur n'importe quel ordinateur utilisant ce même serveur
- Une sauvegarde réelle des données de chaque établissement (élèves, notes, personnel, paiements, emplois du temps, messages, cours à domicile) dans `data/db.json` — plus de perte de données au rechargement
- L'en-tête de l'application affiche "Enregistrement..." puis "À jour" à chaque modification, preuve que la sauvegarde fonctionne

## 5. Pour un vrai contrôle "à distance" (plusieurs villes, plusieurs ordinateurs)

Ce serveur doit être **accessible sur internet**, pas seulement sur l'ordinateur qui le fait tourner. Deux options simples et peu coûteuses pour l'Afrique de l'Ouest :

- **Render.com** ou **Railway.app** : on dépose ce dossier, ils hébergent le serveur en continu (offre gratuite limitée, ou quelques dollars/mois pour un usage permanent)
- Un **VPS** (serveur privé virtuel) à louer, par exemple chez un hébergeur qui facture en FCFA/carte locale

Une fois hébergé à une adresse fixe (ex. `https://2tschool-serveur.onrender.com`), toutes les écoles s'y connectent, où qu'elles soient, et le blocage à distance fonctionne réellement et instantanément — c'est la seule chose qui manque encore pour un contrôle 100% à distance.

Dis-moi quand tu veux passer à l'hébergement en ligne — je peux préparer les fichiers nécessaires pour Render ou Railway.

## 6. Sécurité — à faire avant un usage réel

- Changer `ADMIN_PASSWORD` et `JWT_SECRET` dans `.env` (ne jamais garder les valeurs par défaut)
- Changer le mot de passe de chaque établissement dès la première connexion
- Ne jamais partager le fichier `.env`
- Prévoir une sauvegarde régulière du fichier `data/db.json`
