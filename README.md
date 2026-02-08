# 🏋️ Fit-Inn Zeiterfassung

Eine moderne, mobile-optimierte Web-App zur Zeiterfassung für Fitnessstudio-Mitarbeiter. Vollständig responsive und Touch-freundlich für Smartphones & Tablets.

## ✨ Features

### 👤 Mitarbeiter-View
- **Tab-basiertes Interface** 
  - 📝 **Heute:** Schnelle Zeiterfassung für den aktuellen Tag
  - 📋 **Diesen Monat:** Übersicht aller bisherigen Einträge
- **Bearbeitbar:** Bereits eingetragene Zeiten können jederzeit angepasst werden
- **Wochentag-Anzeige** für bessere Kontextinformation
- **Quick-Action Buttons** ("Start jetzt" / "Ende jetzt")
- **Mitarbeiter-Dropdown:** Einfache Auswahl aus der Liste
- **Mobile-optimiert:** Full-responsive Design (360px - 1200px+)
- **Toast-Benachrichtigungen:** Klare Bestätigungen beim Speichern/Laden

### 📊 Admin-Dashboard
- **Accordion-View:** Mitarbeiter klicken → Details aufklappen
- **Wochentag-Anzeige:** Jeder Eintrag mit Wochentag (Mo, Di, etc.)
- **Inline Stundensummen:** Gesamtstunden pro Mitarbeiter sofort sichtbar
- **Monatliche Navigation:** Vor-/Zurück-Buttons für jeden Monat
- **CSV/Excel Export** mit Stundendetails
- **Login-Schutz** mit einfachem Passwort
- **Neue Mitarbeiter hinzufügen** direkt im Dashboard
- **Mitarbeiter löschen** mit Bestätigung

## 🎨 Design

- **Modern & Minimalistisch:** Gradient-Header mit Purple/Blue Scheme
- **Große Touch-Targets:** Alle Buttons ≥ 48px für einfache Mobile-Bedienung
- **Smooth Animations:** Scale-Effekte & Slide-In Nachrichten
- **Dark-Mode freundlich:** Gutes Contrast-Verhältnis
- **Accessible:** Klare Labels und Feedback

## 🛠 Tech-Stack

- **Backend:** Node.js + Express.js
- **Datenbank:** SQLite (lokal, persistent)
- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript (no frameworks)
- **APIs:** RESTful Endpoints mit JSON

## 📦 Installation & Start

### Voraussetzungen
- Node.js 14+ installiert
- Terminal/CMD Zugriff
- Port 3000 verfügbar

### Installation
```bash
cd /data/.openclaw/workspace/fit-inn-app
npm install
```

### App starten
```bash
npm start
```

**App läuft dann auf:** http://localhost:3000

**Im Studio-Netzwerk:** http://<DEINE-PC-IP>:3000/time

## 📱 Erste Schritte

### Für Mitarbeiter (Zeiterfassung)
1. **URL öffnen:** http://localhost:3000/time (oder IP-Adresse im Studio)
2. **Mitarbeiter wählen** aus dem Dropdown
3. **Datum wählen** (default: Heute)
4. **Zeiten eingeben:**
   - Startzeit: Manuell eingeben oder "Start jetzt" drücken
   - Endzeit: Manuell eingeben oder "Ende jetzt" drücken
5. **Speichern** drücken → grüne Toast-Nachricht bestätigt!
6. **Bearbeiten:** Im "Diesen Monat"-Tab einen Tag klicken → Zeiten neu eingeben

### Für Admin/Philipp (Dashboard)
1. **Admin-Seite:** http://localhost:3000/admin
2. **Anmelden:** Passwort eingeben (`fitinn2024`)
3. **Dashboard sehen:** Monatliche Übersicht aller Mitarbeiter
4. **Details:** Auf Mitarbeiter klicken → Arbeitstage aufklappen
5. **Aktionen:**
   - 📥 **Exportieren:** CSV für Excel/Google Sheets
   - ➕ **Mitarbeiter hinzufügen:** Namen eingeben & speichern
   - 🗑️ **Mitarbeiter löschen:** Mit Bestätigung

## 🔗 URLs

```
http://localhost:3000/            → Startseite
http://localhost:3000/time        → Mitarbeiter-Zeiterfassung
http://localhost:3000/admin       → Admin-Login
http://localhost:3000/admin/dashboard → Admin-Dashboard (nach Login)
```

## 🗂 Projektstruktur

```
fit-inn-app/
├── src/
│   └── server.js                 # Express Server + alle APIs
├── public/
│   ├── index.html                # Startseite
│   ├── employee.html             # Mitarbeiter-Zeiterfassung (TAB-DESIGN)
│   ├── admin-login.html          # Admin-Login
│   └── admin-dashboard.html      # Admin-Dashboard (ACCORDION)
├── data/
│   └── timetracking.db           # SQLite Datenbank (auto-erstellt)
├── package.json
└── README.md
```

## 🔧 Konfiguration

### Admin-Passwort ändern
In `src/server.js` (ca. Zeile 170):
```javascript
const ADMIN_PASSWORD = 'fitinn2024';
```

### Port ändern
In `src/server.js` (ca. Zeile 160):
```javascript
const PORT = 3000;
```

### Mitarbeiter manual hinzufügen (DB)
Über Admin-Dashboard: "➕ Neuen Mitarbeiter hinzufügen"

Oder in `initializeTestData()` für neue Test-Daten:
```javascript
const employees = [
  { name: 'Anna' },
  { name: 'Marco' },
  { name: 'Dein Name' }
];
```

## 📡 API Endpoints

### Öffentlich (Mitarbeiter)
```
GET /time
  → Mitarbeiter-Zeiterfassungs-Seite

GET /api/employees
  → Alle Mitarbeiter abrufen
  Response: [{ id: "uuid", name: "Anna" }, ...]

GET /api/employee/:id
  → Mitarbeiter-Details
  Response: { id: "uuid", name: "Anna" }

GET /api/timesheet?employee_id=X&date=2024-02-08
  → Eintrag für Datum laden
  Response: { id: 1, start_time: "08:00", end_time: "17:00" }

POST /api/timesheets
  Body: { employee_id, date, start_time, end_time }
  → Eintrag speichern/aktualisieren
  Response: { success: true, message: "..." }
```

### Admin
```
GET /admin
  → Admin-Login Seite

POST /api/admin/login
  Body: { password: "..." }
  → Authentifizierung
  Response: { success: true, token: "..." }

GET /api/admin/employees
  → Alle Mitarbeiter mit IDs
  Response: [{ id: "uuid", name: "Anna" }, ...]

POST /api/admin/employee
  Body: { name: "Neuer Name" }
  → Mitarbeiter hinzufügen
  Response: { success: true, id: "uuid", name: "..." }

DELETE /api/admin/employee/:id
  → Mitarbeiter löschen
  Response: { success: true, message: "..." }

GET /api/admin/report/:year/:month
  → Monatsbericht (z.B. /api/admin/report/2024/02)
  Response: { year, month, employees: [...], totalHours: 150.5 }

GET /api/admin/export/:year/:month
  → CSV-Export herunterladen
```

## 💾 Datenbank

SQLite mit 2 Tabellen:

### `employees`
```
id (TEXT, PRIMARY KEY) - UUID
name (TEXT) - Mitarbeitername
uuid (TEXT, UNIQUE) - Legacy UUID (deprecated)
created_at (DATETIME) - Erstellt am
```

### `timesheets`
```
id (INTEGER, PRIMARY KEY) - Auto-increment
employee_id (TEXT, FK) - Referenz zu employees
date (TEXT) - Datum YYYY-MM-DD
start_time (TEXT) - Startzeit HH:MM
end_time (TEXT) - Endzeit HH:MM
created_at (DATETIME) - Erstellt am
```

## 📊 CSV Export Format

```csv
Mitarbeitername,Arbeitstage,Stunden pro Tag,Gesamtstunden
Anna,10,"2024-02-01: 8.00h; 2024-02-02: 8.50h; ...",82.50
Marco,8,"2024-02-05: 7.50h; ...",60.00

Gesamtstunden aller Mitarbeiter,,,142.50
```

## 🔐 Sicherheit

- ✅ Admin-Dashboard mit Passwort geschützt
- ✅ Datenbank lokal auf dem Rechner (keine Cloud)
- ✅ Keine API-Keys oder Secrets erforderlich
- ✅ Nur für lokales Netzwerk (Studio-WLAN) gedacht
- ⚠️ **Nicht ins Internet freigeben!**

## 📱 Mobile Responsive Breakpoints

```
360px - 480px   → Telefone (iPhone SE, älter)
480px - 768px   → Telefone & Small Tablets
768px - 1024px  → Tablets
1024px+         → Desktops
```

## 🐛 Troubleshooting

### App startet nicht
```bash
# Dependencies neu installieren
npm install

# Node-Version prüfen
node --version  # Sollte ≥ 14 sein
```

### Datenbank beschädigt / Zurücksetzen
```bash
# Alte Datenbank löschen
rm data/timetracking.db

# App neu starten (erstellt neue DB)
npm start
```

### Port bereits belegt
```bash
# Anderen Port verwenden (z.B. 3001)
PORT=3001 npm start
```

### Mitarbeiter im Studio-Netzwerk erreichbar?
1. **Deine PC-IP finden:**
   - Windows: `ipconfig` im CMD
   - Mac: `ifconfig` im Terminal
   - Suche nach `192.168.x.x` oder `10.0.x.x`

2. **Mitarbeitern die URL geben:**
   - z.B. `http://192.168.1.50:3000/time`

3. **Test:** Auf deinem Handy im Studio-WLAN öffnen

## 📈 Geplante Features

- [ ] Benutzer-Authentifizierung (Login pro Mitarbeiter)
- [ ] Schichtplanung & Übersicht
- [ ] Automatische Pausen-Berechnung
- [ ] Urlaub/Krankheitstage Tracking
- [ ] SMS-Benachrichtigungen
- [ ] Statistiken & Charts

## 📄 Lizenz

Erstellt für Fit-Inn Heldenbergen

---

**Version:** 2.0.0  
**Letztes Update:** Februar 2026  
**Status:** ✅ Produktionsreif  
**Letzter Commit:** Responsive UI mit Tab-Navigation & Toast-Notifications
