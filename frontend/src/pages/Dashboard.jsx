/**
 * Dashboard Page — Student grades & GPA
 */

import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Grade color mapping
const gradeColors = {
  'A+': '#10b981', 'A': '#10b981', 'A-': '#34d399',
  'B+': '#3b82f6', 'B': '#3b82f6', 'B-': '#60a5fa',
  'C+': '#f59e0b', 'C': '#f59e0b', 'C-': '#fbbf24',
  'D+': '#f97316', 'D': '#f97316', 'F': '#ef4444',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const res = await api.get('/grades');
      setData(res.data);
    } catch (err) {
      setError('Failed to load grades.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loading">Loading grades...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  // GPA ring color
  const gpaColor = data.gpa >= 3.5 ? '#10b981' : data.gpa >= 2.5 ? '#3b82f6' : '#f59e0b';

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="page-subtitle">Here's your academic overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card gpa-card">
          <div className="gpa-ring" style={{ '--gpa-color': gpaColor }}>
            <span className="gpa-value">{data.gpa.toFixed(2)}</span>
            <span className="gpa-label">GPA</span>
          </div>
          <p className="stat-desc">out of 4.00</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <span className="stat-number">{data.grades.length}</span>
            <span className="stat-label">Courses Graded</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <span className="stat-number">{data.totalCredits}</span>
            <span className="stat-label">Total Credits</span>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="card">
        <h2 className="card-title">Grade Report</h2>
        {data.grades.length === 0 ? (
          <p className="empty-state">No grades available yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table" id="grades-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Credits</th>
                  <th>Grade</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {data.grades.map((g, i) => (
                  <tr key={i}>
                    <td className="code-cell">{g.subjectCode}</td>
                    <td>{g.subjectName}</td>
                    <td className="center-cell">{g.credits}</td>
                    <td>
                      <span
                        className="grade-badge"
                        style={{ backgroundColor: gradeColors[g.grade] || '#6b7280' }}
                      >
                        {g.grade}
                      </span>
                    </td>
                    <td className="center-cell">{g.gradePoints.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
