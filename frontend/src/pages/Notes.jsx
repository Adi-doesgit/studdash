/**
 * Notes Page — Student views and downloads teacher-uploaded notes
 */

import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data.notes);
    } catch (err) {
      setError('Failed to load notes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const res = await api.get(`/notes/${id}/download`, { responseType: 'blob' });
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

  if (loading) return <div className="page-loading">Loading notes...</div>;

  return (
    <div className="notes-page">
      <div className="page-header">
        <h1>Course Notes</h1>
        <p className="page-subtitle">Download study materials uploaded by teachers</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {notes.length === 0 ? (
          <p className="empty-state">No notes available yet. Check back later!</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table" id="notes-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => (
                  <tr key={n.id}>
                    <td className="title-cell">
                      <span className="file-icon">📄</span>
                      {n.title}
                    </td>
                    <td>{n.teacher_name}</td>
                    <td className="date-cell">
                      {new Date(n.uploaded_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownload(n.id, n.filename)}
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
