/**
 * Upload Notes Page — Teacher uploads PDF notes
 */

import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function UploadNotes() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchMyNotes();
  }, []);

  const fetchMyNotes = async () => {
    try {
      // Teacher can see the notes list by calling the same endpoint
      // but we need a teacher-accessible endpoint. For simplicity,
      // we'll use a direct query. The GET /api/notes is student-only,
      // so we show previously uploaded notes from the upload response history.
      // Actually, let's just show a success list from local state.
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setMessage({ text: 'Title and PDF file are required.', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);

      const res = await api.post('/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNotes([res.data.note, ...notes]);
      setTitle('');
      setFile(null);
      setMessage({ text: 'Note uploaded successfully!', type: 'success' });

      // Reset file input
      const fileInput = document.getElementById('note-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Upload failed.',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>Upload Notes</h1>
        <p className="page-subtitle">Share study materials with students</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Upload Form */}
      <div className="card">
        <h2 className="card-title">📤 Upload New Note</h2>
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="note-title">Note Title</label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 5 — Data Structures"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="note-file-input">PDF File</label>
            <div className="file-input-wrapper">
              <input
                id="note-file-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
              {file && (
                <span className="file-name">📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Note'}
          </button>
        </form>
      </div>

      {/* Recently Uploaded */}
      {notes.length > 0 && (
        <div className="card">
          <h2 className="card-title">✅ Recently Uploaded</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Original File</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => (
                  <tr key={n.id}>
                    <td>{n.title}</td>
                    <td>{n.filename}</td>
                    <td className="date-cell">
                      {new Date(n.uploaded_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
