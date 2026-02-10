# 🏋️ Fit-Inn Zeiterfassung v2.0

Eine moderne, mobile-optimierte Full-Stack Anwendung zur Zeiterfassung für Fitnessstudios. Entwickelt für **Fit-Inn Heldenbergen**, optimiert für Smartphones, Tablets und Desktop.

![License](https://img.shields.io/badge/License-Proprietary-red.svg)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)

---

## 🌟 Highlights

*   **Mobile-First Design:** Große Touch-Targets und intuitive Bedienung für Mitarbeiter unterwegs.
*   **Admin Power:** Vollständiges Dashboard zur Verwaltung von Mitarbeitern, Arbeitszeiten und Lohnabrechnungen.
*   **Ready-to-Go:** Lokale SQLite-Datenbank – keine komplexe Server-Einrichtung nötig.
*   **Datenschutz:** Alle Daten bleiben lokal in deinem Studio-Netzwerk.

---

## ✨ Features

### 👤 Für Mitarbeiter (Zeiterfassung)
*   **Einfacher Login:** Mitarbeiterauswahl per Dropdown (keine Passwörter nötig für schnelle Erfassung).
*   **Quick-Actions:** "Start jetzt" / "Ende jetzt" mit einem Klick.
*   **Monatsübersicht:** Transparente Einsicht in alle geleisteten Stunden des aktuellen Monats.
*   **Fehlerkorrektur:** Bearbeitung von Einträgen direkt in der App möglich.
*   **Toast-Feedback:** Sofortige Bestätigung bei jeder Aktion.

### 📊 Für den Admin (Philipp)
*   **Employee Management (CRUD):** Mitarbeiter hinzufügen, bearbeiten oder löschen.
*   **Intelligente Reports:** Monatliche Übersicht aller Stunden mit automatischer Summenbildung.
*   **Lohn-Dashboard:** Unterstützung für Stundenlohn und Festgehalt mit automatischer Verdienstberechnung.
*   **Export-Funktion:** CSV-Download für Excel oder Google Sheets.
*   **Daten-Import:** Batch-Import von Mitarbeitern und Lohnhistorien via CSV.
*   **Flexibilität:** Sortierung nach Name, Stunden, Verdienst oder Lohn.

---

## 🛠 Tech Stack

| Komponente | Technologie |
| :--- | :--- |
| **Frontend** | React 18, Vite, Framer Motion, Vanilla CSS |
| **Backend** | Node.js, Express.js |
| **Datenbank** | SQLite3 |
| **Utilities** | Date-fns (Datumshandling), Lucide Icons |

---

## 🚀 Installation & Setup (GitHub-Guide)

Folge diesen Schritten, um die Anwendung auf deinem Rechner oder Studio-Server zu installieren.

### 1. Voraussetzungen
Stelle sicher, dass [Node.js](https://nodejs.org/) (Version 16 oder höher) installiert ist.

### 2. Repository klonen
```bash
git clone https://github.com/philipp-ger/zeiterfassung_mitarbeiter.git
cd zeiterfassung_mitarbeiter
```

### 3. Abhängigkeiten installieren
Du musst die Pakete sowohl für den Server als auch für den Client installieren:

```bash
# Backend-Pakete
npm install

# Frontend-Pakete
cd client
npm install
cd ..
```

---

## 💻 Betrieb & Nutzung

### Lokale Entwicklung (Dev-Modus)
Ideal für Änderungen am Design oder Code:

1.  **Server starten:** `node src/server.js` (läuft auf Port 3000)
2.  **Client starten:** `cd client && npm run dev` (läuft auf Port 5173)

### Studio-Betrieb (Netzwerk-Modus)
Damit Mitarbeiter von ihren Handys zugreifen können:

1.  **Server starten:** `node src/server.js`
2.  **Frontend extern freigeben:** `cd client && npm run dev -- --host`
3.  Öffne die angezeigte **Network-URL** (z.B. `http://192.168.178.20:5173`) auf den Geräten im Studio-WLAN.

---

## ⚙️ Konfiguration

*   **Admin-Passwort:** Das Standard-Passwort ist `fitinn2024`. Du kannst es in `src/server.js` ändern.
*   **Ports:** Der Standard-Port ist `3000` (Backend) und `5173` (Frontend).

---

## 🗂 Projektstruktur

```text
zeiterfassung_mitarbeiter/
├── src/                  # Backend Quellcode
│   ├── db/               # Datenbank-Initialisierung & Schema
│   ├── routes/           # API-Endpunkte (Admin, Employee)
│   └── server.js         # Express-Server Konfiguration
├── client/               # Frontend (React App)
│   ├── src/              # React Komponenten & Seiten
│   ├── public/           # Statische Assets
│   └── package.json      # Frontend Abhängigkeiten
├── data/                 # Speicherort der SQLite Datenbank
├── README.md             # Diese Dokumentation
└── package.json          # Root/Backend Abhängigkeiten
```

---

## 📑 Lizenz & Support

Erstellt für **Fit-Inn Heldenbergen**.

**Support:** Bei Fragen wende dich direkt an Philipp.

---
**Version:** 3.0.0 | **Stand:** Februar 2026
