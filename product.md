# ALFRED – AI Travel Companion

## 1 — CONTEXTE DU PROJET

ALFRED est un assistant de voyage intelligent combinant la puissance d'optimisation des comparateurs (Kayak, Skyscanner), la flexibilité conversationnelle, et une personnalité amicale. Il optimise les itinéraires sous contraintes multiples et apprend des utilisateurs.

Il doit :

- Comprendre les contraintes humaines
- Optimiser des itinéraires
- Proposer des alternatives créatives
- Challenger les décisions de l’utilisateur
- Apprendre des habitudes

## 2 — PERSONNALITÉ D’ALFRED

Intelligent, direct, humain, malin, optimisateur, sympathique. Il parle comme un ami organisant un voyage et propose des idées claires avec des compromis. Il peut contredire l’utilisateur si un choix est sous-optimal.

## 3 — OBJECTIF PRODUIT

Comprendre un besoin vague, poser des questions intelligentes, optimiser les contraintes, proposer plusieurs plans avec compromis, et apprendre des préférences pour s’améliorer.

## 4 — ARCHITECTURE DU SYSTÈME

Le système est composé de 7 modules principaux :

1. **Conversation Engine** : Comprendre la demande, poser des questions, déclencher le solver.
2. **User Personality Engine** : Profil utilisateur (budget, fatigue, nature/city, transport, confort, spontanéité, météo, passions).
3. **Mood Engine** : Modifie les poids du solver selon l'humeur (Chill, Budget Hacker, YOLO, Explorer, Efficient).
4. **Constraint Solver** : Moteur d'optimisation (budget, temps, transport, météo, visa) générant Plans A, B, C.
5. **Travel Data Layer** : Sources de données (vols, trains, bus, hôtels, météo, visas).
6. **Memory System** : Mémorisation des préférences implicites et explicites.
7. **Learning Engine** : Système d'apprentissage continu basé sur les retours utilisateurs.

## 5 — PREMIER CONTACT

Identification du style de voyage via des profils (Chill Explorer, Budget Hacker, etc.) ou via 5 micro-questions (confort/aventure, budget/temps, etc.).

## 6 — UTILISATION FUTURE

Proposer des modes mémorisés ("Weekend express", "Comme d'habitude").

## 7 — OPTIMISATION DES VOYAGES

Calculs avancés incluant le temps de trajet travail-aéroport, les marges de retard, et propositions créatives (prendre un lundi de congé pour économiser 85%).

## 8 — ALTERNATIVES CRÉATIVES

Mix de transports (train+ferry), destinations inattendues ou micro-aventures locales.

## 9 — EXPÉRIENCE UTILISATEUR

Chaque proposition inclut : Résumé (3 lignes), Plans A/B/C, Feuille de route, Note de calcul (budget détaillé), et Justification.

## 10 — NOTE DE CALCUL VISUELLE

Affichage d'une "feuille de calcul" en temps réel avec ratures et ajustements.

## 11 — MODE GROUPE

Gestion des contraintes multiples, partage de budget et votes rapides.

## 12 — APPRENTISSAGE CONTINU

Détection de routines et automatisation des propositions futures.

## 13 — OBJECTIF FINAL

Un assistant IA complet, proactif, créatif et optimisateur.
"J’ai envie de partir quelque part la semaine prochaine avec un petit budget" -> Plan optimisé complet.
