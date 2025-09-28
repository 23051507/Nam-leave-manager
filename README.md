# NAMS Leave Manager

Système de gestion des congés pour entreprises hiérarchisées, développé avec React.js et Node.js.

## 🚀 Fonctionnalités

### ✅ Implémentées
- **Authentification JWT** avec gestion des rôles (ADMIN, HR, COORDINATOR, EMPLOYEE)
- **Gestion des utilisateurs** (CRUD complet)
- **Système de demandes de congés** avec validation des dates et conflits
- **Workflow d'approbation hiérarchique** (Manager → RH si nécessaire)
- **Gestion des soldes de congés** automatique
- **Interface utilisateur moderne** avec Material-UI
- **Base de données PostgreSQL** avec schéma complet
- **API REST** complète et documentée

### 🔄 En cours de développement
- Notifications email
- Rapports et exports
- Gestion des pièces jointes
- Calendrier des congés

## 🛠️ Technologies

### Backend
- **Node.js** avec Express.js
- **PostgreSQL** pour la base de données
- **JWT** pour l'authentification
- **bcryptjs** pour le hachage des mots de passe
- **Express-validator** pour la validation

### Frontend
- **React.js** avec hooks
- **Material-UI** pour l'interface
- **React Router** pour la navigation
- **Axios** pour les appels API
- **Context API** pour la gestion d'état

## 📋 Prérequis

- Node.js (v16 ou plus récent)
- PostgreSQL (v12 ou plus récent)
- npm ou yarn

## 🚀 Installation

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd NAMS-Leave-Manager
```

### 2. Configuration de la base de données

#### Installer PostgreSQL
- **Windows** : Télécharger depuis [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS** : `brew install postgresql`
- **Ubuntu** : `sudo apt install postgresql postgresql-contrib`

#### Créer la base de données
```sql
CREATE DATABASE nams_leave_manager;
CREATE USER nams_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nams_leave_manager TO nams_user;
```

### 3. Configuration Backend

```bash
cd backend
npm install
```

#### Créer le fichier .env
```bash
cp .env.example .env
```

Éditer le fichier `.env` :
```env
# Configuration de la base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nams_leave_manager
DB_USER=nams_user
DB_PASSWORD=your_password

# Configuration JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=2h

# Configuration du serveur
PORT=5000
NODE_ENV=development

# Configuration email (pour les notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Configuration de l'entreprise
COMPANY_NAME=NAMS Entreprise
COMPANY_EMAIL=noreply@nams.com
```

#### Initialiser la base de données
```bash
# Créer les tables
psql -U nams_user -d nams_leave_manager -f config/schema.sql

# Ajouter les données de test
npm run init-db
```

### 4. Configuration Frontend

```bash
cd frontend
npm install
```

### 5. Démarrage

#### Démarrer le backend
```bash
cd backend
npm run dev
```

#### Démarrer le frontend (dans un nouveau terminal)
```bash
cd frontend
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend** : http://localhost:5000

## 👥 Comptes de test

| Rôle | Email | Mot de passe | Description |
|------|-------|--------------|-------------|
| **Admin** | admin@nams.com | admin123 | Accès complet au système |
| **RH** | rh@nams.com | rh123 | Gestion des employés et validation RH |
| **Coordinateur** | coordo@nams.com | coordo123 | Approuve les demandes de ses subordonnés |
| **Employé** | employe@nams.com | employe123 | Crée et suit ses demandes |
| **Manager** | manager@nams.com | manager123 | Manager commercial |
| **Employé 2** | employe2@nams.com | employe123 | Commercial |

## 🏗️ Architecture

### Structure du projet
```
NAMS-Leave-Manager/
├── backend/
│   ├── config/
│   │   ├── database.js          # Configuration DB
│   │   └── schema.sql           # Schéma de base de données
│   ├── middleware/
│   │   └── auth.js              # Middleware d'authentification
│   ├── models/
│   │   ├── User.js              # Modèle utilisateur
│   │   ├── LeaveRequest.js      # Modèle demande de congé
│   │   ├── LeaveApproval.js     # Modèle approbation
│   │   └── LeaveBalance.js      # Modèle solde de congés
│   ├── routes/
│   │   ├── auth.js              # Routes d'authentification
│   │   ├── users.js             # Routes utilisateurs
│   │   ├── leaveRequests.js     # Routes demandes de congés
│   │   ├── leaveApprovals.js    # Routes approbations
│   │   └── leaveBalances.js     # Routes soldes
│   ├── scripts/
│   │   └── initDatabase.js      # Script d'initialisation
│   └── server.js                # Serveur principal
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NavBar.jsx       # Barre de navigation
│   │   │   └── ProtectedRoute.jsx # Protection des routes
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx  # Contexte d'authentification
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Page de connexion
│   │   │   └── Dashboard.jsx    # Tableau de bord
│   │   └── main.jsx             # Point d'entrée React
│   └── package.json
└── README.md
```

### Base de données

#### Tables principales
- **users** : Utilisateurs et hiérarchie
- **leave_types** : Types de congés (annuel, maladie, etc.)
- **leave_requests** : Demandes de congés
- **leave_approvals** : Approbations et workflow
- **leave_balances** : Soldes par utilisateur et type
- **notifications** : Notifications système
- **audit_logs** : Journal d'audit

## 🔐 Sécurité

- **Authentification JWT** avec expiration
- **Hachage des mots de passe** avec bcrypt
- **Validation des entrées** côté serveur
- **Protection CSRF** avec tokens
- **Gestion des rôles** (RBAC)
- **Logs d'audit** pour les actions sensibles

## 📊 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/change-password` - Changer mot de passe
- `GET /api/auth/profile` - Profil utilisateur
- `GET /api/auth/verify` - Vérifier token

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs (Admin/RH)
- `GET /api/users/:id` - Détail utilisateur
- `POST /api/users` - Créer utilisateur (Admin/RH)
- `PUT /api/users/:id` - Modifier utilisateur (Admin/RH)
- `DELETE /api/users/:id` - Supprimer utilisateur (Admin)

### Demandes de congés
- `GET /api/leave-requests` - Liste des demandes
- `GET /api/leave-requests/:id` - Détail demande
- `POST /api/leave-requests` - Créer demande
- `PUT /api/leave-requests/:id` - Modifier demande
- `DELETE /api/leave-requests/:id` - Annuler demande

### Approbations
- `GET /api/leave-approvals/pending` - Demandes en attente
- `POST /api/leave-approvals/:id/approve` - Approuver
- `POST /api/leave-approvals/:id/reject` - Rejeter
- `POST /api/leave-approvals/:id/request-change` - Demander modification

### Soldes
- `GET /api/leave-balances/:userId` - Soldes utilisateur
- `GET /api/leave-balances` - Tous les soldes (Admin/RH)
- `PUT /api/leave-balances/:userId/:typeId` - Ajuster solde (Admin/RH)

## 🧪 Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 Développement

### Ajouter une nouvelle fonctionnalité

1. **Backend** : Créer le modèle, les routes et les tests
2. **Frontend** : Créer les composants et pages
3. **Base de données** : Ajouter les migrations si nécessaire
4. **Documentation** : Mettre à jour ce README

### Standards de code

- **ESLint** pour le linting
- **Prettier** pour le formatage
- **Conventional Commits** pour les messages de commit
- **JSDoc** pour la documentation du code

## 🚀 Déploiement

### Production

1. **Base de données** : Configurer PostgreSQL en production
2. **Variables d'environnement** : Configurer les variables de production
3. **Build** : `npm run build` pour le frontend
4. **Serveur** : Déployer sur votre plateforme (Heroku, AWS, etc.)

### Docker (optionnel)

```bash
# Backend
docker build -t nams-backend ./backend
docker run -p 5000:5000 nams-backend

# Frontend
docker build -t nams-frontend ./frontend
docker run -p 3000:3000 nams-frontend
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contacter l'équipe de développement

## 🎯 Roadmap

### Version 2.0
- [ ] Notifications email automatiques
- [ ] Calendrier des congés interactif
- [ ] Rapports PDF/Excel
- [ ] Application mobile
- [ ] Intégration calendrier externe
- [ ] Workflow personnalisable
- [ ] Multi-langue (FR/EN)

### Version 2.1
- [ ] API GraphQL
- [ ] Tests end-to-end
- [ ] CI/CD pipeline
- [ ] Monitoring et logs
- [ ] Backup automatique





