import React, { useState, useEffect } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminDashboard = () => {
    const [report, setReport] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [expandedEmployee, setExpandedEmployee] = useState(null);

    // Add/Edit Employee State
    const [showModal, setShowModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [employeeForm, setEmployeeForm] = useState({ id: '', first_name: '', last_name: '', hourly_wage: 12 });
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [formMessage, setFormMessage] = useState(null);

    const loadReport = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        fetch(`/api/admin/report/${year}/${month}`)
            .then(res => res.json())
            .then(data => setReport(data));
    };

    useEffect(() => {
        loadReport();
    }, [currentDate]);

    const handleExport = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        window.open(`/api/admin/export/${year}/${month}`, '_blank');
    };

    const handlePDFExport = () => {
        const doc = new jsPDF();
        const monthName = format(currentDate, 'MMMM yyyy', { locale: de });

        // Header
        doc.setFontSize(22);
        doc.setTextColor(102, 126, 234); // Primary color #667eea
        doc.text('InnTime - Monatsbericht', 14, 22);

        doc.setFontSize(12);
        doc.setTextColor(113, 128, 150);
        doc.text(`Zeitraum: ${monthName}`, 14, 30);
        doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 36);

        // Stats
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 42, 196, 42);

        doc.setFontSize(14);
        doc.setTextColor(45, 55, 72);
        doc.text(`Gesamtstunden: ${report.totalHours.toFixed(2)} h`, 14, 52);
        doc.text(`Lohnkosten geschätzt: ${report.totalWage.toFixed(2)} €`, 14, 60);
        doc.text(`Mitarbeiter: ${report.employees.length}`, 14, 68);

        // Table
        const tableData = report.employees.map(emp => [
            emp.name,
            emp.salary_type === 'hourly' ? 'Stundenlohn' : 'Festgehalt',
            Object.keys(emp.days).length,
            emp.totalHours.toFixed(2),
            emp.totalWage.toFixed(2) + ' €'
        ]);

        doc.autoTable({
            startY: 76,
            head: [['Mitarbeiter', 'Typ', 'Tage', 'Stunden', 'Verdienst']],
            body: tableData,
            headStyles: { fillColor: [102, 126, 234] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 76 }
        });

        // Add details for each employee on new pages if needed or just a summary table
        // For now, a clean summary table is a great start.

        doc.save(`InnTime_Report_${format(currentDate, 'yyyy-MM')}.pdf`);
    };

    const openAddModal = () => {
        setIsEditing(false);
        setEmployeeForm({ id: '', first_name: '', last_name: '', hourly_wage: 12 });
        setShowModal(true);
    };

    const openEditModal = (emp) => {
        setIsEditing(true);
        setEmployeeForm({
            id: emp.id,
            first_name: emp.first_name,
            last_name: emp.last_name,
            hourly_wage: emp.hourly_wage
        });
        setShowModal(true);
    };

    const handleSaveEmployee = async (e) => {
        e.preventDefault();
        const url = isEditing ? `/api/admin/employee/${employeeForm.id}` : '/api/admin/employee';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeForm)
            });
            const data = await res.json();

            if (data.success) {
                setFormMessage({ text: isEditing ? 'Gespeichert!' : 'Mitarbeiter hinzugefügt!', type: 'success' });
                loadReport();
                if (!isEditing) {
                    setEmployeeForm({ id: '', first_name: '', last_name: '', hourly_wage: 12 });
                }
                setTimeout(() => {
                    setShowModal(false);
                    setFormMessage(null);
                }, 1000);
            } else {
                setFormMessage({ text: data.error, type: 'error' });
            }
        } catch (err) {
            setFormMessage({ text: 'Verbindungsfehler', type: 'error' });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setFormMessage({ text: 'Passwörter stimmen nicht überein', type: 'error' });
            return;
        }

        try {
            const res = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldPassword: passwordForm.oldPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            const data = await res.json();
            if (data.success) {
                setFormMessage({ text: 'Passwort erfolgreich geändert!', type: 'success' });
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setFormMessage(null);
                    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }, 1500);
            } else {
                setFormMessage({ text: data.error, type: 'error' });
            }
        } catch (err) {
            setFormMessage({ text: 'Verbindungsfehler', type: 'error' });
        }
    };

    const handleDeleteEmployee = async (id) => {
        try {
            const res = await fetch(`/api/admin/employee/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                loadReport();
            } else {
                alert('Fehler: ' + data.error);
            }
        } catch (err) {
            alert('Verbindungsfehler');
        }
    };

    if (!report) return <div style={{ padding: '40px', textAlign: 'center' }}>Laden...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: 'white', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>📊</span> Dashboard
                </h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                        🔐 Passwort ändern
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/'}>
                        Logout
                    </Button>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>

                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <Card style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ fontSize: '20px', padding: '8px', background: 'none' }}>◀️</button>
                        <span style={{ fontWeight: 'bold', fontSize: '18px', minWidth: '160px', textAlign: 'center' }}>
                            {format(currentDate, 'MMMM yyyy', { locale: de })}
                        </span>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ fontSize: '20px', padding: '8px', background: 'none' }}>▶️</button>
                    </Card>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button onClick={openAddModal}>
                            ➕ Neuer Mitarbeiter
                        </Button>
                        <Button onClick={handleExport} variant="success">
                            📊 CSV
                        </Button>
                        <Button onClick={handlePDFExport} variant="danger" style={{ background: '#e53e3e' }}>
                            📄 PDF
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <Card>
                        <div style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Gesamtstunden</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginTop: '4px' }}>
                            {report.totalHours.toFixed(2)} h
                        </div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Lohnkosten (Geschätzt)</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#48bb78', marginTop: '4px' }}>
                            {report.totalWage.toFixed(2)} €
                        </div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Mitarbeiter</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#718096', marginTop: '4px' }}>
                            {report.employees.length}
                        </div>
                    </Card>
                </div>

                {/* Employee List */}
                <div style={{ display: 'grid', gap: '16px' }}>
                    {report.employees.map(emp => (
                        <Card key={emp.id} style={{ padding: '0', overflow: 'hidden' }}>
                            <div
                                style={{
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: expandedEmployee === emp.id ? '#f8fafc' : 'white',
                                    borderBottom: expandedEmployee === emp.id ? '1px solid #e2e8f0' : 'none'
                                }}
                            >
                                <div
                                    onClick={() => setExpandedEmployee(expandedEmployee === emp.id ? null : emp.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', flex: 1 }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%', background: '#667eea', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                    }}>
                                        {emp.first_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{emp.name}</div>
                                        <div style={{ fontSize: '12px', color: '#718096' }}>
                                            {Object.keys(emp.days).length} Arbeitstage • {emp.totalHours.toFixed(2)} Stunden
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#48bb78' }}>
                                            {emp.totalWage.toFixed(2)} €
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={(e) => { e.stopPropagation(); openEditModal(emp); }} style={{ padding: '8px' }}>
                                        ✏️
                                    </Button>
                                    <Button variant="ghost" onClick={(e) => { e.stopPropagation(); if (window.confirm(`Möchtest du ${emp.name} wirklich löschen?`)) handleDeleteEmployee(emp.id); }} style={{ padding: '8px', color: '#f56565' }}>
                                        🗑️
                                    </Button>
                                    <div
                                        onClick={() => setExpandedEmployee(expandedEmployee === emp.id ? null : emp.id)}
                                        style={{ fontSize: '20px', cursor: 'pointer', transform: expandedEmployee === emp.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '8px' }}
                                    >
                                        ⌄
                                    </div>
                                </div>
                            </div>

                            {expandedEmployee === emp.id && (
                                <div style={{ padding: '20px', background: '#f8fafc' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', color: '#718096', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '8px' }}>Datum</th>
                                                <th style={{ padding: '8px' }}>Zeitraum</th>
                                                <th style={{ padding: '8px', textAlign: 'right' }}>Stunden</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(emp.days).sort().map(([date, day]) => (
                                                <tr key={date} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>
                                                        {format(new Date(date), 'dd.MM.')} <span style={{ color: '#a0aec0', fontWeight: 'normal' }}>{format(new Date(date), 'EEEE', { locale: de })}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 8px', color: '#718096' }}>
                                                        {day.start_time} - {day.end_time}
                                                    </td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#667eea' }}>
                                                        {day.hours.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {Object.keys(emp.days).length === 0 && (
                                                <tr>
                                                    <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>Keine Einträge in diesem Monat</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: '#edf2f7' }}>
                                                <td colSpan="2" style={{ padding: '12px 8px', fontWeight: 'bold' }}>Gesamt (Monat)</td>
                                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2d3748' }}>{emp.totalHours.toFixed(2)} h</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>

            {/* Add/Edit Employee Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <Card style={{ width: '400px', maxWidth: '90vw' }}>
                                <h2 style={{ marginBottom: '20px' }}>{isEditing ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}</h2>

                                <form onSubmit={handleSaveEmployee}>
                                    <Input
                                        label="Vorname"
                                        value={employeeForm.first_name}
                                        onChange={e => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
                                        required
                                        placeholder="z.B. Max"
                                    />
                                    <Input
                                        label="Nachname"
                                        value={employeeForm.last_name}
                                        onChange={e => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                                        required
                                        placeholder="z.B. Mustermann"
                                    />
                                    <Input
                                        label="Stundenlohn (€)"
                                        type="number"
                                        step="0.01"
                                        value={employeeForm.hourly_wage}
                                        onChange={e => setEmployeeForm({ ...employeeForm, hourly_wage: e.target.value })}
                                    />

                                    {formMessage && (
                                        <div style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            background: formMessage.type === 'success' ? '#c6f6d5' : '#fed7d7',
                                            color: formMessage.type === 'success' ? '#276749' : '#c53030',
                                            marginBottom: '16px',
                                            fontSize: '14px'
                                        }}>
                                            {formMessage.text}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                        <Button type="button" variant="danger" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                                            Abbrechen
                                        </Button>
                                        <Button type="submit" variant="success" style={{ flex: 1, justifyContent: 'center' }}>
                                            Speichern
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Password Modal */}
            {showPasswordModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <Card style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
                        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>🔐 Passwort ändern</h2>

                        <form onSubmit={handlePasswordChange}>
                            <Input
                                type="password"
                                label="Aktuelles Passwort"
                                value={passwordForm.oldPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                            />
                            <Input
                                type="password"
                                label="Neues Passwort"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                            />
                            <Input
                                type="password"
                                label="Neues Passwort bestätigen"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                            />

                            {formMessage && (
                                <div style={{
                                    padding: '12px',
                                    background: formMessage.type === 'success' ? '#f0fff4' : '#fff5f5',
                                    color: formMessage.type === 'success' ? '#38a169' : '#e53e3e',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    textAlign: 'center'
                                }}>
                                    {formMessage.text}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                <Button type="button" variant="danger" onClick={() => { setShowPasswordModal(false); setFormMessage(null); }} style={{ flex: 1 }}>
                                    Abbrechen
                                </Button>
                                <Button type="submit" variant="success" style={{ flex: 1 }}>
                                    Speichern
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
