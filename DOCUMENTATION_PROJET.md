# Documentation du projet

## Ce que couvre l'application

- Authentification administrateur
- Gestion des employés, stagiaires et encadrants
- Capture faciale par webcam
- Enregistrement de 5 photos par utilisateur pour l'entraînement
- Génération et stockage des face descriptors 128D
- Reconnaissance faciale en temps réel
- Check-in et check-out automatiques
- Anti-fraude avec délai minimum de 15 minutes entre deux scans
- Détection automatique des anomalies de type retard et départ anticipé
- Journalisation des scans acceptés et rejetés
- Dashboard RH avec statistiques et graphiques
- Export des rapports en PDF et Excel

## Règles métier principales

- Un utilisateur est reconnu si la distance euclidienne est inférieure au seuil défini dans le contrôleur de pointage.
- Un nouveau scan d'un même utilisateur est refusé si moins de 15 minutes se sont écoulées depuis le dernier scan.
- Le check-in en retard crée une anomalie automatique.
- Le check-out anticipé crée une anomalie automatique.
- Les photos et les face descriptors sont enregistrés côté backend.

## Modules principaux

### Backend

- API REST Laravel
- Authentification Sanctum
- Contrôleurs de gestion des employés, stagiaires, encadrants, pointage, dashboard et rapports
- Export PDF via DomPDF
- Export Excel via Laravel Excel

### Frontend

- Interface React + Vite
- Formulaires de gestion des utilisateurs
- Capture webcam pour la reconnaissance faciale
- Tableau de bord avec statistiques et graphiques
- Consommation de l'API via Axios

## Remarque de complétude

Le concept fonctionnel du cahier des charges est maintenant couvert de manière très large :

- gestion RH
- reconnaissance faciale
- pointage
- anti-fraude
- anomalies
- reporting
- dashboard

Les écarts restants sont surtout liés à des détails d'implémentation ou d'ajustement fin, pas à l'architecture globale du projet.
