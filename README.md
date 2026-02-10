# 🏋️ InnTime v3.0

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

---
## 🚀 Installation & Setup

Folge diesen Schritten, um die Anwendung zu installieren und zu starten.

### 1. Voraussetzungen
Stelle sicher, dass [Node.js](https://nodejs.org/) installiert ist.

### 2. Repository klonen & Installieren
```bash
git clone https://github.com/philipp-ger/InnTime.git
cd InnTime

# Backend installieren
npm install

# Frontend installieren
cd client
npm install
cd ..
```

### 3. Frontend Build erstellen (WICHTIG)
Da das Frontend auf dem Server im `dist`-Ordner liegen muss, muss dieser einmalig (oder nach Änderungen) erstellt werden:
```bash
cd client
npm run build
cd ..
```

---

## 💻 Betrieb & Nutzung

### Studio-Betrieb (Ein-Port-System)
Nachdem der Build erstellt wurde (siehe oben), startet ein einziger Befehl die gesamte App:

1. **Server starten:** `node src/server.js`
2. Öffne **[http://localhost:3000](http://localhost:3000)** im Browser.

Die Anwendung liefert nun das moderne React-Frontend direkt über Port 3000 aus. 
Falls du von anderen Geräten im WLAN zugreifen willst, nutze die IP deines Rechners (z.B. `http://192.168.178.20:3000`).

---

## ⚙️ Konfiguration

*   **Admin-Passwort:** Das Standard-Passwort ist `fitinn2024`. Du kannst es in `src/server.js` ändern.
*   **Ports:** Der Standard-Port ist `3000` (Backend) und `5173` (Frontend).

---

## 🗂 Projektstruktur

```text
InnTime/
├── src/                  # Backend Quellcode
├── client/               # Frontend (React App)
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
