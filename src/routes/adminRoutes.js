const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// API: Admin Login
router.post('/login', (req, res) => {
    const { password } = req.body;
    db.get("SELECT value FROM settings WHERE key = 'admin_password'", (err, row) => {
        if (err) return res.status(500).json({ error: 'Datenbankfehler' });

        if (row && password === row.value) {
            res.json({ success: true, token: 'admin-token' });
        } else {
            res.status(401).json({ error: 'Falsches Passwort' });
        }
    });
});

// API: Change Admin Password
router.post('/change-password', (req, res) => {
    const { oldPassword, newPassword } = req.body;

    db.get("SELECT value FROM settings WHERE key = 'admin_password'", (err, row) => {
        if (err) return res.status(500).json({ error: 'Datenbankfehler' });

        if (row && oldPassword === row.value) {
            db.run("UPDATE settings SET value = ? WHERE key = 'admin_password'", [newPassword], (err2) => {
                if (err2) return res.status(500).json({ error: 'Fehler beim Speichern' });
                res.json({ success: true, message: 'Passwort erfolgreich geändert' });
            });
        } else {
            res.status(401).json({ error: 'Das alte Passwort ist nicht korrekt' });
        }
    });
});

// API: Get all employees (Admin view)
router.get('/employees', (req, res) => {
    db.all('SELECT id, first_name, last_name, hourly_wage, fixed_salary, salary_type, employment_type FROM employees ORDER BY first_name, last_name', (err, employees) => {
        if (err) {
            return res.status(500).json({ error: 'Fehler beim Abrufen' });
        }
        res.json(employees);
    });
});

// API: Add new employee
router.post('/employee', (req, res) => {
    const { first_name, last_name, hourly_wage, fixed_salary, salary_type, employment_type } = req.body;

    if (!first_name || !last_name || first_name.trim() === '' || last_name.trim() === '') {
        return res.status(400).json({ error: 'Vor- und Nachname sind erforderlich' });
    }

    const salaryTypeValue = salary_type || 'hourly';
    const wageValue = salaryTypeValue === 'hourly' ? (hourly_wage || 12.00) : 0;
    const salaryValue = salaryTypeValue === 'fixed' ? (fixed_salary || 0) : 0;
    const employmentTypeValue = employment_type || 'Festangestellter';

    const id = uuidv4();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const fullName = `${first_name.trim()} ${last_name.trim()}`;

    db.run(
        'INSERT INTO employees (id, name, first_name, last_name, uuid, hourly_wage, fixed_salary, salary_type, employment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, fullName, first_name.trim(), last_name.trim(), uuidv4(), wageValue, salaryValue, salaryTypeValue, employmentTypeValue],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Fehler beim Hinzufügen: ' + err.message });
            }

            // Erstelle auch Lohnhistorie für aktuellen Monat
            db.run(
                'INSERT INTO employee_salary_history (employee_id, year, month, hourly_wage, fixed_salary, salary_type) VALUES (?, ?, ?, ?, ?, ?)',
                [id, year, month, wageValue, salaryValue, salaryTypeValue],
                (err2) => {
                    if (err2) {
                        console.error('Fehler beim Erstellen der Lohnhistorie:', err2);
                    }
                    res.json({ success: true, id, first_name: first_name.trim(), last_name: last_name.trim(), message: `Mitarbeiter "${fullName}" hinzugefügt!` });
                }
            );
        }
    );

});

// API: Update employee
router.put('/employee/:id', (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, hourly_wage, fixed_salary, salary_type, employment_type } = req.body;

    if (!first_name || !last_name || first_name.trim() === '' || last_name.trim() === '') {
        return res.status(400).json({ error: 'Vor- und Nachname sind erforderlich' });
    }

    const salaryTypeValue = salary_type || 'hourly';
    const wageValue = salaryTypeValue === 'hourly' ? (hourly_wage || 12.00) : 0;
    const salaryValue = salaryTypeValue === 'fixed' ? (fixed_salary || 0) : 0;
    const employmentTypeValue = employment_type || 'Festangestellter';
    const fullName = `${first_name.trim()} ${last_name.trim()}`;

    db.run(
        'UPDATE employees SET name = ?, first_name = ?, last_name = ?, hourly_wage = ?, fixed_salary = ?, salary_type = ?, employment_type = ? WHERE id = ?',
        [fullName, first_name.trim(), last_name.trim(), wageValue, salaryValue, salaryTypeValue, employmentTypeValue, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Fehler beim Aktualisieren: ' + err.message });
            }
            res.json({ success: true, message: 'Mitarbeiter aktualisiert!' });
        }
    );
});

// API: Delete employee
router.delete('/employee/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM employees WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Fehler beim Löschen: ' + err.message });
        }
        res.json({ success: true, message: 'Mitarbeiter gelöscht!' });
    });
});

// API: Get monthly report
router.get('/report/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const monthStr = String(month).padStart(2, '0');
    const datePattern = `${year}-${monthStr}%`;

    const fillSql = `
    INSERT OR IGNORE INTO employee_salary_history (employee_id, year, month, hourly_wage, fixed_salary, salary_type)
    SELECT DISTINCT e.id, ?, ?, e.hourly_wage, e.fixed_salary, e.salary_type
    FROM employees e
    WHERE EXISTS (
      SELECT 1 FROM timesheets t 
      WHERE t.employee_id = e.id AND t.date LIKE ?
    )
    AND NOT EXISTS (
      SELECT 1 FROM employee_salary_history esh 
      WHERE esh.employee_id = e.id AND esh.year = ? AND esh.month = ?
    )
  `;

    db.run(fillSql, [year, month, datePattern, year, month], (err) => {
        if (err) console.error('Fehler beim Füllen der Lohnhistorie:', err);

        db.all(
            `SELECT 
         e.id,
         e.first_name,
         e.last_name,
         COALESCE(esh.hourly_wage, e.hourly_wage) as hourly_wage,
         COALESCE(esh.fixed_salary, e.fixed_salary) as fixed_salary,
         COALESCE(esh.salary_type, e.salary_type) as salary_type,
         t.date,
         t.start_time,
         t.end_time
       FROM employees e
       LEFT JOIN employee_salary_history esh ON e.id = esh.employee_id AND esh.year = ? AND esh.month = ?
       LEFT JOIN timesheets t ON e.id = t.employee_id AND t.date LIKE ?
       ORDER BY e.first_name, e.last_name, t.date`,
            [year, month, datePattern],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });

                const report = {};
                rows.forEach(row => {
                    if (!report[row.id]) {
                        report[row.id] = {
                            id: row.id,
                            name: `${row.first_name} ${row.last_name}`,
                            first_name: row.first_name,
                            last_name: row.last_name,
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
});

// API: Export monthly report as CSV
router.get('/export/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const monthStr = String(month).padStart(2, '0');
    const datePattern = `${year}-${monthStr}%`;

    const fillSql = `
    INSERT OR IGNORE INTO employee_salary_history (employee_id, year, month, hourly_wage, fixed_salary, salary_type)
    SELECT DISTINCT e.id, ?, ?, e.hourly_wage, e.fixed_salary, e.salary_type
    FROM employees e
    WHERE EXISTS (
      SELECT 1 FROM timesheets t 
      WHERE t.employee_id = e.id AND t.date LIKE ?
    )
    AND NOT EXISTS (
      SELECT 1 FROM employee_salary_history esh 
      WHERE esh.employee_id = e.id AND esh.year = ? AND esh.month = ?
    )
    `;

    db.run(fillSql, [year, month, datePattern, year, month], (err) => {
        if (err) console.error('Fehler beim Füllen der Lohnhistorie:', err);

        db.all(
            `SELECT 
         e.id,
         e.first_name,
         e.last_name,
         COALESCE(esh.hourly_wage, e.hourly_wage) as hourly_wage,
         COALESCE(esh.fixed_salary, e.fixed_salary) as fixed_salary,
         COALESCE(esh.salary_type, e.salary_type) as salary_type,
         t.date,
         t.start_time,
         t.end_time
       FROM employees e
       LEFT JOIN employee_salary_history esh ON e.id = esh.employee_id AND esh.year = ? AND esh.month = ?
       LEFT JOIN timesheets t ON e.id = t.employee_id AND t.date LIKE ?
       ORDER BY e.first_name, e.last_name, t.date`,
            [year, month, datePattern],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });

                const report = {};
                rows.forEach(row => {
                    if (!report[row.id]) {
                        report[row.id] = {
                            name: `${row.first_name} ${row.last_name}`,
                            salary_type: row.salary_type || 'hourly',
                            hourly_wage: row.hourly_wage || 0,
                            fixed_salary: row.fixed_salary || 0,
                            days: {},
                            totalHours: 0
                        };
                    }
                    if (row.date && row.start_time && row.end_time) {
                        const start = new Date(`2000-01-01 ${row.start_time}`);
                        const end = new Date(`2000-01-01 ${row.end_time}`);
                        const hours = (end - start) / (1000 * 60 * 60);
                        report[row.id].days[row.date] = hours;
                        report[row.id].totalHours += hours;
                    }
                });

                // CSV generieren
                let csv = 'Mitarbeiter,Gehaltstyp,Stundenlohn/Festgehalt,Arbeitstage,Stunden Details,Gesamtstunden,Verdienst\n';

                Object.values(report).forEach(emp => {
                    const workDays = Object.keys(emp.days).length;
                    const details = Object.entries(emp.days)
                        .map(([date, hours]) => `${date}: ${hours.toFixed(2)}h`)
                        .join('; ');

                    const wageInfo = emp.salary_type === 'hourly' ? `${emp.hourly_wage} €/h` : `${emp.fixed_salary} €`;
                    const totalWage = emp.salary_type === 'hourly' ? (emp.totalHours * emp.hourly_wage) : emp.fixed_salary;
                    const salaryTypeText = emp.salary_type === 'hourly' ? 'Stundenlohn' : 'Festgehalt';

                    csv += `"${emp.name}","${salaryTypeText}","${wageInfo}",${workDays},"${details}",${emp.totalHours.toFixed(2)},"${totalWage.toFixed(2).replace('.', ',')} €"\n`;
                });

                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="InnTime_Report_${year}-${monthStr}.csv"`);
                res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support
            }
        );
    });
});

// API: Import salary data from CSV
router.post('/import-salary', (req, res) => {
    const { csvData } = req.body;
    if (!csvData) return res.status(400).json({ error: 'CSV-Daten erforderlich' });

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return res.status(400).json({ error: 'CSV muss Header enthalten' });

    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    let imported = 0;
    let errors = [];

    const processLine = (line) => {
        return new Promise((resolve) => {
            const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
            const data = {};
            header.forEach((h, idx) => data[h] = parts[idx]);

            db.get('SELECT id FROM employees WHERE first_name || " " || last_name = ? OR name = ?', [data['Mitarbeitername'], data['Mitarbeitername']], (err, employee) => {
                if (err || !employee) {
                    errors.push(`Mitarbeiter "${data['Mitarbeitername']}" nicht gefunden`);
                    return resolve();
                }

                const year = parseInt(data['Jahr'] || new Date().getFullYear());
                const month = parseInt(data['Monat'] || new Date().getMonth() + 1);
                const salaryType = data['Gehaltstyp'] === 'Festgehalt' ? 'fixed' : 'hourly';

                let wage = parseFloat(data['Stundenlohn/Festgehalt']?.replace(/[€\/h]/g, '').replace(',', '.')) || 0;
                const hourlyWage = salaryType === 'hourly' ? wage : 0;
                const fixedSalary = salaryType === 'fixed' ? wage : 0;

                db.run(
                    `INSERT INTO employee_salary_history (employee_id, year, month, hourly_wage, fixed_salary, salary_type)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON CONFLICT(employee_id, year, month) DO UPDATE SET
                     hourly_wage = excluded.hourly_wage, fixed_salary = excluded.fixed_salary, salary_type = excluded.salary_type`,
                    [employee.id, year, month, hourlyWage, fixedSalary, salaryType],
                    (err) => {
                        if (!err) imported++;
                        resolve();
                    }
                );
            });
        });
    };

    Promise.all(lines.slice(1).filter(l => l.trim()).map(processLine)).then(() => {
        res.json({ success: true, imported, errors, message: `${imported} Einträge importiert` });
    });
});

// API: Export employees
router.get('/export-employees', (req, res) => {
    db.all('SELECT id, first_name, last_name, hourly_wage, fixed_salary, salary_type, employment_type FROM employees ORDER BY first_name', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Fehler beim Export' });

        let csv = 'ID,Vorname,Nachname,Stundenlohn,Festgehalt,Gehaltstyp,Anstellungsart\n';
        rows.forEach(row => {
            csv += `${row.id},"${row.first_name}","${row.last_name}",${row.hourly_wage},${row.fixed_salary},"${row.salary_type}","${row.employment_type}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=InnTime_Mitarbeiter.csv');
        res.send('\uFEFF' + csv);
    });
});

module.exports = router;
