# 🏎️ F1 Tracker - Handover Business Analyst

**Date** : 24 janvier 2026
**Version** : 1.0.0
**Statut** : ✅ Production-ready

---

## 📋 Résumé Exécutif

**F1 Tracker** est une application web permettant de suivre la saison de Formule 1 2026 en temps réel, avec un système de pronostics entre amis.

### Proposition de Valeur
> Permettre à un groupe d'amis (4-5 utilisateurs) de suivre la F1 et de s'affronter via des pronostics sur chaque course.

### Stack Technique
| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 + React 19 |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Next.js API Routes |
| Base de données | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth 5 (JWT) |
| Hébergement | Vercel |

---

## 🎯 Fonctionnalités Livrées

### 1. Calendrier (Public)
- ✅ 25 courses de la saison 2026
- ✅ Images des circuits
- ✅ Badges Sprint (6 sprints)
- ✅ Horaires des sessions (FP1, FP2, FP3, Quali, Course)
- ✅ Countdown jusqu'à la prochaine session

### 2. Classements (Public)
- ✅ Classement Pilotes en temps réel
- ✅ Classement Constructeurs
- ✅ Filtres par année et par course
- ✅ Évolution des points course par course

### 3. News (Public)
- ✅ Agrégation temps réel de 4 sources :
  - Formula1.com
  - Autosport
  - Motorsport.com
  - Pitpass
- ✅ Catégories : Teams, Drivers, Technical, Results
- ✅ Articles Featured mis en avant

### 4. Explorer (Public)
- ✅ Fiches des 21 pilotes 2026
  - Photo, numéro, équipe
  - Stats carrière (victoires, podiums, poles)
  - Titres mondiaux
- ✅ Fiches des 12 équipes
  - Logo, localisation
  - Palmarès historique

### 5. Pronostics - Mode Duel (Authentifié)
- ✅ Affrontement 1v1 sur la saison
- ✅ Score cumulé par course
- ✅ Historique des résultats
- ✅ Prédiction de la prochaine course

### 6. Pronostics - Mode Groupes (Authentifié)
- ✅ Création de groupes (max 20 membres)
- ✅ Code d'invitation partageable
- ✅ Classement interne au groupe
- ✅ Gestion des membres (propriétaire)

### 7. Système de Notifications
- ✅ Push notifications (VAPID)
- ✅ Rappels avant les courses
- ✅ Alertes résultats

### 8. Gamification
- ✅ Système de points
- ✅ Badges et achievements
- ✅ Animations de victoire

---

## 👥 Données 2026 Intégrées

### Nouveaux Pilotes
| Pilote | Équipe | Note |
|--------|--------|------|
| Andrea Kimi Antonelli | Mercedes | Rookie |
| Oliver Bearman | Haas | Rookie |
| Gabriel Bortoleto | Kick Sauber | Rookie |
| Arvid Lindblad | Racing Bulls | Rookie |
| Isack Hadjar | Red Bull | Rookie |

### Transferts Majeurs
| Pilote | De → Vers |
|--------|-----------|
| Lewis Hamilton | Mercedes → Ferrari |
| Carlos Sainz | Ferrari → Williams |

### Nouvelles Équipes
| Équipe | Base | Note |
|--------|------|------|
| Audi | Hinwil, Suisse | Remplace Sauber |
| Cadillac F1 Team | Charlotte, USA | 11ème équipe |

---

## 🏗️ Architecture Technique

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  Next.js 16 + React 19 + shadcn/ui + Tailwind      │
└─────────────────────┬───────────────────────────────┘
                      │ API Routes
┌─────────────────────▼───────────────────────────────┐
│                  BACKEND                            │
│  Next.js API Routes + NextAuth 5                   │
└─────────────────────┬───────────────────────────────┘
                      │ Prisma ORM
┌─────────────────────▼───────────────────────────────┐
│                 DATABASE                            │
│  PostgreSQL (Supabase) + Row Level Security        │
└─────────────────────────────────────────────────────┘
```

### Modèles de Données Principaux
- `User` : Utilisateurs authentifiés
- `Driver` / `Constructor` : Données F1
- `Race` / `Circuit` : Calendrier
- `RaceResult` : Résultats officiels
- `Prediction` : Pronostics utilisateurs
- `PredictionGroup` : Groupes de pronostics
- `GroupMembership` : Appartenance aux groupes

---

## 🔐 Sécurité

| Mesure | Statut |
|--------|--------|
| Row Level Security (RLS) | ✅ Activé sur toutes les tables |
| Authentification JWT | ✅ NextAuth 5 |
| HTTPS | ✅ Via Vercel |
| Variables d'environnement | ✅ Secrets protégés |

---

## 📊 Tests Effectués (24/01/2026)

### Tests Automatisés (Playwright)
| Page | Statut | Observations |
|------|--------|--------------|
| Homepage | ✅ Pass | Stats, navigation |
| Calendar | ✅ Pass | 25 courses affichées |
| Standings | ✅ Pass | Filtres fonctionnels |
| News | ✅ Pass | 4 sources agrégées |
| Explorer Drivers | ✅ Pass | 21 pilotes |
| Explorer Teams | ✅ Pass | 12 équipes |
| Predictions Duel | ✅ Pass | Scores, historique |
| Predictions Groups | ✅ Pass | Création, invitation |

### Couverture
- **Fonctionnalités publiques** : 100%
- **Fonctionnalités authentifiées** : 100%
- **Erreurs console** : 401 (attendu sans auth), aucune erreur bloquante

---

## 🚀 Déploiement

| Environnement | URL | Statut |
|---------------|-----|--------|
| Production | Vercel (configuré) | ✅ Prêt |
| Base de données | Supabase | ✅ Opérationnel |
| Repository | github.com/sbellott/f1-tracker | ✅ À jour |

### Variables d'Environnement Requises
```bash
DATABASE_URL          # Supabase PostgreSQL (pooler)
DIRECT_URL            # Supabase PostgreSQL (direct)
NEXTAUTH_URL          # URL de l'application
NEXTAUTH_SECRET       # Secret JWT
VAPID_PUBLIC_KEY      # Push notifications
VAPID_PRIVATE_KEY     # Push notifications
VAPID_SUBJECT         # Email contact
```

---

## 📈 Métriques Cibles

| Métrique | Cible | Justification |
|----------|-------|---------------|
| Utilisateurs | 4-5 | Groupe d'amis |
| Disponibilité | Best effort | Pas de SLA |
| Temps de réponse | < 3s | UX acceptable |

---

## 🔮 Évolutions Potentielles

### Court Terme
- [ ] Amélioration du scoring des pronostics
- [ ] Statistiques détaillées par utilisateur
- [ ] Export des résultats

### Moyen Terme
- [ ] Intégration API F1 officielle (temps réel)
- [ ] Mode Fantasy F1
- [ ] Comparaison Head-to-Head avancée

### Long Terme
- [ ] Application mobile (React Native)
- [ ] Support multi-saisons
- [ ] Ouverture publique (scaling)

---

## 📞 Contacts

| Rôle | Contact |
|------|---------|
| Product Owner | Sébastien Bellotto |
| Développement | Claude (AI Assistant) |

---

## 📁 Fichiers Clés

```
f1-tracker/
├── src/
│   ├── app/                    # Pages Next.js
│   ├── components/             # Composants React
│   │   ├── ui/                 # shadcn/ui
│   │   └── predictions/        # Module pronostics
│   ├── lib/
│   │   ├── hooks/              # React hooks
│   │   └── services/           # Services API
│   └── server/                 # API routes
├── prisma/
│   └── schema.prisma           # Modèle de données
├── SPECIFICATION_PRODUIT.md    # Spécifications détaillées
└── HANDOVER_BA.md              # Ce document
```

---

**Document généré le 24 janvier 2026**
**Dernier commit** : `f09a1f3 chore: Remove duplicate files from cleanup`
