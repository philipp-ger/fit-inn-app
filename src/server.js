const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Datenbank
const dbPath = path.join(__dirname, '../data/timetracking.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Database connected');
});

// Datenbank-Initialisierung
db.serialize(() => {
  // Tabelle Mitarbeiter
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      uuid TEXT UNIQUE NOT NULL,
      hourly_wage REAL DEFAULT 12.00,
      fixed_salary REAL DEFAULT 0,
      salary_type TEXT DEFAULT 'hourly',
      employment_type TEXT DEFAULT 'Festangestellter',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabelle Lohnhistorie (pro Monat)
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_salary_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      hourly_wage REAL DEFAULT 12.00,
      fixed_salary REAL DEFAULT 0,
      salary_type TEXT DEFAULT 'hourly',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(employee_id) REFERENCES employees(id),
      UNIQUE(employee_id, year, month)
    )
  `);

  // Tabelle Zeiteinträge
  db.run(`
    CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    )
  `);

  // Prüfe ob Test-Daten existieren
  db.get('SELECT COUNT(*) as count FROM employees', (err, row) => {
    if (err) console.error('Error:', err);
    else if (row.count === 0) {
      console.log('Initializing test data...');
      initializeTestData();
    }
  });

  // Migration: Prüfe ob neue Spalten existieren und füge sie hinzu wenn nicht
  db.all('PRAGMA table_info(employees)', (err, columns) => {
    if (err) return;
    const hasHourlyWage = columns.some(col => col.name === 'hourly_wage');
    const hasEmploymentType = columns.some(col => col.name === 'employment_type');
    const hasSalaryType = columns.some(col => col.name === 'salary_type');
    const hasFixedSalary = columns.some(col => col.name === 'fixed_salary');

    if (!hasHourlyWage) {
      db.run('ALTER TABLE employees ADD COLUMN hourly_wage REAL DEFAULT 12.00', (err) => {
        if (err) console.error('Fehler beim Hinzufügen von hourly_wage:', err);
        else console.log('✅ Spalte hourly_wage hinzugefügt');
      });
    }

    if (!hasEmploymentType) {
      db.run('ALTER TABLE employees ADD COLUMN employment_type TEXT DEFAULT \'Festangestellter\'', (err) => {
        if (err) console.error('Fehler beim Hinzufügen von employment_type:', err);
        else console.log('✅ Spalte employment_type hinzugefügt');
      });
    }

    if (!hasSalaryType) {
      db.run('ALTER TABLE employees ADD COLUMN salary_type TEXT DEFAULT \'hourly\'', (err) => {
        if (err) console.error('Fehler beim Hinzufügen von salary_type:', err);
        else console.log('✅ Spalte salary_type hinzugefügt');
      });
    }

    if (!hasFixedSalary) {
      db.run('ALTER TABLE employees ADD COLUMN fixed_salary REAL DEFAULT 0', (err) => {
        if (err) console.error('Fehler beim Hinzufügen von fixed_salary:', err);
        else console.log('✅ Spalte fixed_salary hinzugefügt');
      });
    }
  });

  // Migration: Erstelle Lohnhistorie aus aktuellen Löhnen
  db.serialize(() => {
    // Kopiere aktuelle Löhne als Lohnhistorie für aktuellen Monat (falls noch nicht vorhanden)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    db.all('SELECT id, hourly_wage, fixed_salary, salary_type FROM employees', (err, employees) => {
      if (err || !employees) return;

      employees.forEach(emp => {
        db.run(
          `INSERT OR IGNORE INTO employee_salary_history (employee_id, year, month, hourly_wage, fixed_salary, salary_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [emp.id, year, month, emp.hourly_wage, emp.fixed_salary, emp.salary_type],
          (err) => {
            if (!err) console.log(`✅ Lohnhistorie für ${emp.id} migriert`);
          }
        );
      });
    });
  });
});

// Test-Daten einrichten
function initializeTestData() {
  const employees = [
    { name: 'Anna', uuid: uuidv4() },
    { name: 'Marco', uuid: uuidv4() },
    { name: 'Lisa', uuid: uuidv4() },
    { name: 'Tom', uuid: uuidv4() }
  ];

  employees.forEach(emp => {
    const id = uuidv4();
    db.run(
      'INSERT INTO employees (id, name, uuid) VALUES (?, ?, ?)',
      [id, emp.name, emp.uuid],
      function(err) {
        if (err) console.error('Error inserting employee:', err);
        else console.log(`Mitarbeiter ${emp.name} erstellt (Link: /time/${emp.uuid})`);
      }
    );
  });
}

// ==================== EMPLOYEE ROUTES ====================

// Mitarbeiter-View (neue Version - einfach mit Name-Dropdown)
app.get('/time', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/employee.html'));
});

// API: Get all employees
app.get('/api/employees', (req, res) => {
  db.all('SELECT id, name FROM employees ORDER BY name', (err, employees) => {
    if (err) {
      return res.status(500).json({ error: 'Fehler beim Abrufen der Mitarbeiter' });
    }
    res.json(employees);
  });
});

// API: Get employee data by ID
app.get('/api/employee/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT id, name FROM employees WHERE id = ?', [id], (err, employee) => {
    if (err || !employee) {
      return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
    }
    res.json(employee);
  });
});

// API: Save timesheet entry
app.post('/api/timesheet', (req, res) => {
  const { employee_id, date, start_time, end_time } = req.body;

  if (!employee_id || !date || (!start_time && !end_time)) {
    return res.status(400).json({ error: 'Fehlende Felder' });
  }

  // Prüfe ob bereits ein Eintrag für dieses Datum existiert
  db.get(
    'SELECT id FROM timesheets WHERE employee_id = ? AND date = ?',
    [employee_id, date],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      if (row) {
        // Update vorhandenen Eintrag
        db.run(
          'UPDATE timesheets SET start_time = ?, end_time = ? WHERE id = ?',
          [start_time || null, end_time || null, row.id],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Eintrag aktualisiert' });
          }
        );
      } else {
        // Neuen Eintrag erstellen
        db.run(
          'INSERT INTO timesheets (employee_id, date, start_time, end_time) VALUES (?, ?, ?, ?)',
          [employee_id, date, start_time || null, end_time || null],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Eintrag gespeichert' });
          }
        );
      }
    }
  );
});

// API: Get entry for specific date (Query parameters)
app.get('/api/timesheet', (req, res) => {
  const { employee_id, date } = req.query;

  if (!employee_id || !date) {
    return res.status(400).json({ error: 'employee_id und date sind erforderlich' });
  }

  db.get(
    'SELECT * FROM timesheets WHERE employee_id = ? AND date = ?',
    [employee_id, date],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || {});
    }
  );
});

// API: Get today's entry
app.get('/api/timesheet/today/:employee_id', (req, res) => {
  const { employee_id } = req.params;
  const today = new Date().toISOString().split('T')[0];

  db.get(
    'SELECT * FROM timesheets WHERE employee_id = ? AND date = ?',
    [employee_id, today],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || {});
    }
  );
});

// API: Save timesheet entry
app.post('/api/timesheets', (req, res) => {
  const { employee_id, date, start_time, end_time } = req.body;
  
  if (!employee_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Mitarbeiter, Datum, Start- und Endzeit sind erforderlich' });
  }

  // Überprüfe ob bereits ein Eintrag für dieses Datum existiert
  db.get(
    'SELECT id FROM timesheets WHERE employee_id = ? AND date = ?',
    [employee_id, date],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Datenbankfehler: ' + err.message });
      }

      if (row) {
        // Update existing entry
        db.run(
          'UPDATE timesheets SET start_time = ?, end_time = ? WHERE id = ?',
          [start_time, end_time, row.id],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Zeiterfassung aktualisiert!' });
          }
        );
      } else {
        // Insert new entry
        db.run(
          'INSERT INTO timesheets (employee_id, date, start_time, end_time) VALUES (?, ?, ?, ?)',
          [employee_id, date, start_time, end_time],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Zeiterfassung gespeichert!' });
          }
        );
      }
    }
  );
});

// ==================== ADMIN ROUTES ====================

// Admin-Login Page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin-login.html'));
});

// Admin-Dashboard
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

// API: Admin Login (einfaches Passwort)
const ADMIN_PASSWORD = 'fitinn2024';

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ error: 'Falsches Passwort' });
  }
});

// API: Add new employee
app.post('/api/admin/employee', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name ist erforderlich' });
  }

  const id = uuidv4();
  db.run(
    'INSERT INTO employees (id, name, uuid) VALUES (?, ?, ?)',
    [id, name.trim(), uuidv4()],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Hinzufügen: ' + err.message });
      }
      res.json({ success: true, id, name: name.trim(), message: `Mitarbeiter "${name}" hinzugefügt!` });
    }
  );
});

// API: Get all employees (für Admin)
app.get('/api/admin/employees', (req, res) => {
  db.all('SELECT id, name, hourly_wage, fixed_salary, salary_type, employment_type FROM employees ORDER BY name', (err, employees) => {
    if (err) {
      return res.status(500).json({ error: 'Fehler beim Abrufen' });
    }
    res.json(employees);
  });
});

// API: Delete employee
app.delete('/api/admin/employee/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM employees WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Fehler beim Löschen: ' + err.message });
    }
    res.json({ success: true, message: 'Mitarbeiter gelöscht!' });
  });
});

// API: Get monthly report
app.get('/api/admin/report/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const monthStr = String(month).padStart(2, '0');
  const datePattern = `${year}-${monthStr}%`;

  db.all(
    `SELECT 
       e.id,
       e.name,
       COALESCE(esh.hourly_wage, e.hourly_wage) as hourly_wage,
       COALESCE(esh.fixed_salary, e.fixed_salary) as fixed_salary,
       COALESCE(esh.salary_type, e.salary_type) as salary_type,
       t.date,
       t.start_time,
       t.end_time
     FROM employees e
     LEFT JOIN employee_salary_history esh ON e.id = esh.employee_id AND esh.year = ? AND esh.month = ?
     LEFT JOIN timesheets t ON e.id = t.employee_id AND t.date LIKE ?
     ORDER BY e.name, t.date`,
    [year, month, datePattern],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // Daten aggregieren
      const report = {};
      rows.forEach(row => {
        if (!report[row.id]) {
          report[row.id] = {
            name: row.name,
            salary_type: row.salary_type || 'hourly',
            hourly_wage: row.hourly_wage || 0,
            fixed_salary: row.fixed_salary || 0,
            days: {},
            totalHours: 0,
            totalWage: 0
          };
        }
        if (row.date && row.start_time && row.end_time) {
          const start = new Date(`2000-01-01 ${row.start_time}`);
          const end = new Date(`2000-01-01 ${row.end_time}`);
          const hours = (end - start) / (1000 * 60 * 60);
          report[row.id].days[row.date] = {
            hours: hours,
            start_time: row.start_time,
            end_time: row.end_time
          };
          report[row.id].totalHours += hours;
        }
      });

      // Berechne Lohn basierend auf Gehalt-Typ
      const reportArray = Object.values(report).map(emp => {
        if (emp.salary_type === 'hourly') {
          emp.totalWage = emp.totalHours * emp.hourly_wage;
        } else {
          emp.totalWage = emp.fixed_salary;
        }
        return emp;
      });

      const totalHoursAll = reportArray.reduce((sum, emp) => sum + emp.totalHours, 0);
      const totalWageAll = reportArray.reduce((sum, emp) => sum + emp.totalWage, 0);
      const totalWageHourly = reportArray.filter(emp => emp.salary_type === 'hourly').reduce((sum, emp) => sum + emp.totalWage, 0);
      const totalWageFixed = reportArray.filter(emp => emp.salary_type === 'fixed').reduce((sum, emp) => sum + emp.totalWage, 0);

      res.json({
        year,
        month: parseInt(month),
        employees: reportArray,
        totalHours: totalHoursAll,
        totalWage: totalWageAll,
        totalWageHourly: totalWageHourly,
        totalWageFixed: totalWageFixed
      });
    }
  );
});

// API: Export CSV
app.get('/api/admin/export/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const monthStr = String(month).padStart(2, '0');
  const datePattern = `${year}-${monthStr}%`;

  db.all(
    `SELECT 
       e.id,
       e.name,
       COALESCE(esh.hourly_wage, e.hourly_wage) as hourly_wage,
       COALESCE(esh.fixed_salary, e.fixed_salary) as fixed_salary,
       COALESCE(esh.salary_type, e.salary_type) as salary_type,
       t.date,
       t.start_time,
       t.end_time
     FROM employees e
     LEFT JOIN employee_salary_history esh ON e.id = esh.employee_id AND esh.year = ? AND esh.month = ?
     LEFT JOIN timesheets t ON e.id = t.employee_id AND t.date LIKE ?
     ORDER BY e.name, t.date`,
    [year, month, datePattern],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // Aggregiere Daten
      const report = {};
      rows.forEach(row => {
        if (!report[row.id]) {
          report[row.id] = {
            name: row.name,
            salary_type: row.salary_type || 'hourly',
            hourly_wage: row.hourly_wage || 0,
            fixed_salary: row.fixed_salary || 0,
            days: {},
            totalHours: 0,
            totalWage: 0
          };
        }
        if (row.date && row.start_time && row.end_time) {
          const start = new Date(`2000-01-01 ${row.start_time}`);
          const end = new Date(`2000-01-01 ${row.end_time}`);
          const hours = (end - start) / (1000 * 60 * 60);
          report[row.id].days[row.date] = {
            hours: hours,
            start_time: row.start_time,
            end_time: row.end_time
          };
          report[row.id].totalHours += hours;
        }
      });

      // Berechne Lohn
      const reportArray = Object.values(report).map(emp => {
        if (emp.salary_type === 'hourly') {
          emp.totalWage = emp.totalHours * emp.hourly_wage;
        } else {
          emp.totalWage = emp.fixed_salary;
        }
        return emp;
      });

      // CSV generieren
      let csv = 'Mitarbeitername,Gehaltstyp,Stundenlohn/Festgehalt,Arbeitstage,Gesamtstunden,Gesamtverdienst\n';
      reportArray.forEach(emp => {
        const workDays = Object.keys(emp.days).length;
        const salaryInfo = emp.salary_type === 'hourly' 
          ? `${emp.hourly_wage.toFixed(2)}€/h`
          : `${emp.fixed_salary.toFixed(2)}€`;
        const salaryType = emp.salary_type === 'hourly' ? 'Stundenlohn' : 'Festgehalt';
        csv += `"${emp.name}",${salaryType},"${salaryInfo}",${workDays},${emp.totalHours.toFixed(2)},${emp.totalWage.toFixed(2)}€\n`;
      });

      const totalHours = reportArray.reduce((sum, emp) => sum + emp.totalHours, 0);
      const totalWage = reportArray.reduce((sum, emp) => sum + emp.totalWage, 0);
      csv += `\nGesamt,,,${reportArray.length},${totalHours.toFixed(2)},${totalWage.toFixed(2)}€\n`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Zeiterfassung_${year}-${monthStr}.csv"`);
      res.send(csv);
    }
  );
});

// API: Update employee
app.put('/api/admin/employee/:id', (req, res) => {
  const { id } = req.params;
  const { name, hourly_wage, fixed_salary, salary_type, employment_type } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name ist erforderlich' });
  }

  const salaryTypeValue = salary_type || 'hourly';
  const wageValue = salaryTypeValue === 'hourly' ? (hourly_wage || 12.00) : 0;
  const salaryValue = salaryTypeValue === 'fixed' ? (fixed_salary || 0) : 0;

  // Aktuelles Jahr und Monat
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Transaction: Update Employee und speichere Lohnhistorie
  db.serialize(() => {
    // Update Employee
    db.run(
      'UPDATE employees SET name = ?, hourly_wage = ?, fixed_salary = ?, salary_type = ?, employment_type = ? WHERE id = ?',
      [name.trim(), wageValue, salaryValue, salaryTypeValue, employment_type || 'Festangestellter', id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Fehler beim Aktualisieren: ' + err.message });
        }

        // Speichere/Update Lohnhistorie für diesen Monat
        db.run(
          `INSERT INTO employee_salary_history (employee_id, year, month, hourly_wage, fixed_salary, salary_type)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(employee_id, year, month) DO UPDATE SET
           hourly_wage = ?, fixed_salary = ?, salary_type = ?`,
          [id, year, month, wageValue, salaryValue, salaryTypeValue, wageValue, salaryValue, salaryTypeValue],
          function(err2) {
            if (err2) {
              return res.status(500).json({ error: 'Fehler beim Speichern der Lohnhistorie: ' + err2.message });
            }
            res.json({ success: true, message: 'Mitarbeiter aktualisiert!' });
          }
        );
      }
    );
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     Fit-Inn Zeiterfassung läuft auf Port ${PORT}      ║
║  http://0.0.0.0:${PORT}                         ║
║                                                ║
║  Mitarbeiter-Links siehe: /admin/employees    ║
╚════════════════════════════════════════════════╝
  `);
});
