/**
 * View Assignments Page — Teacher views student submissions (read-only)
 */

import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ViewAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data.assignments);
    } catch (err) {
      setError('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const res = await api.get(`/assignments/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed.');
    }
  };

  if (loading) return <div className="page-loading">Loading assignments...</div>;

  return (
    <div className="assignments-page">
      <div className="page-header">
        <h1>Student Assignments</h1>
        <p className="page-subtitle">View submitted assignments (read-only)</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2 className="card-title">
          Submissions
          <span className="badge">{assignments.length}</span>
        </h2>

        {assignments.length === 0 ? (
          <p className="empty-state">No assignments submitted yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table" id="assignments-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Title</th>
                  <th>File</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="name-cell">{a.student_name}</td>
                    <td>{a.title}</td>
                    <td className="filename-cell">📄 {a.filename}</td>
                    <td className="date-cell">
                      {new Date(a.uploaded_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownload(a.id, a.filename)}
                      >
                        Download
                      </button>
                    </td>
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
