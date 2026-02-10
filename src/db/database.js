const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../../data/timetracking.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Database connected');
});

// Helper to run queries as promises
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};


function initializeDatabase() {
  db.serialize(() => {
    // Tabelle Mitarbeiter
    db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        name TEXT, -- Legacy full name, kept for compatibility
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

    // Tabelle Einstellungen (für Passwort etc.)
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `, () => {
      initializeSettings();
    });

    // Check migrations
    runMigrations();
  });
}

function initializeSettings() {
  db.get("SELECT value FROM settings WHERE key = 'admin_password'", (err, row) => {
    if (!err && !row) {
      db.run("INSERT INTO settings (key, value) VALUES ('admin_password', 'fitinn2024')");
    }
  });
}

function runMigrations() {
  // Migration: Prüfe ob neue Spalten existieren und füge sie hinzu wenn nicht
  db.all('PRAGMA table_info(employees)', (err, columns) => {
    if (err) return;
    const hasHourlyWage = columns.some(col => col.name === 'hourly_wage');
    const hasEmploymentType = columns.some(col => col.name === 'employment_type');
    const hasSalaryType = columns.some(col => col.name === 'salary_type');
    const hasFixedSalary = columns.some(col => col.name === 'fixed_salary');
    const hasFirstName = columns.some(col => col.name === 'first_name');
    const hasLastName = columns.some(col => col.name === 'last_name');
    const hasName = columns.some(col => col.name === 'name');

    if (!hasHourlyWage) {
      db.run('ALTER TABLE employees ADD COLUMN hourly_wage REAL DEFAULT 12.00');
    }
    if (!hasEmploymentType) {
      db.run('ALTER TABLE employees ADD COLUMN employment_type TEXT DEFAULT \'Festangestellter\'');
    }
    if (!hasSalaryType) {
      db.run('ALTER TABLE employees ADD COLUMN salary_type TEXT DEFAULT \'hourly\'');
    }
    if (!hasFixedSalary) {
      db.run('ALTER TABLE employees ADD COLUMN fixed_salary REAL DEFAULT 0');
    }

    // Migration: name -> first_name, last_name
    if (hasName && !hasFirstName && !hasLastName) {
      db.run('ALTER TABLE employees ADD COLUMN first_name TEXT', (err) => {
        if (!err) {
          db.run('ALTER TABLE employees ADD COLUMN last_name TEXT', (err) => {
            if (!err) {
              // Split existing names
              db.all('SELECT id, name FROM employees WHERE first_name IS NULL', (err, rows) => {
                if (err || !rows) return;
                rows.forEach(row => {
                  const parts = row.name.trim().split(' ');
                  const firstName = parts[0] || '';
                  const lastName = parts.slice(1).join(' ') || '';
                  db.run('UPDATE employees SET first_name = ?, last_name = ? WHERE id = ?', [firstName, lastName, row.id]);
                });
              });
            }
          });
        }
      });
    }
  });
}

function initializeTestData() {
  // Prüfe ob Test-Daten existieren
  db.get('SELECT COUNT(*) as count FROM employees', (err, row) => {
    if (err) console.error('Error:', err);
    else if (row.count === 0) {
      console.log('Initializing test data...');
      const employees = [
        { name: 'Anna' },
        { name: 'Marco' },
        { name: 'Lisa' },
        { name: 'Tom' }
      ];

      employees.forEach(emp => {
        const id = uuidv4();
        const uuid = uuidv4();
        // Simple split for test data
        db.run(
          'INSERT INTO employees (id, name, first_name, last_name, uuid) VALUES (?, ?, ?, ?, ?)',
          [id, emp.name, emp.name, '', uuid],
          function (err) {
            if (err) console.error('Error inserting employee:', err);
            else console.log(`Mitarbeiter ${emp.name} erstellt (Link: /time/${uuid})`);
          }
        );
      });
    }
  });
}

// Start initialization
initializeDatabase();
initializeTestData();

module.exports = db;
