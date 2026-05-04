/**
 * Upload Assignment Page — Student uploads PDF assignments
 */

import React, { useState } from 'react';
import api from '../api/axios';

export default function UploadAssignment() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

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

      const res = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmissions([res.data.assignment, ...submissions]);
      setTitle('');
      setFile(null);
      setMessage({ text: 'Assignment submitted successfully!', type: 'success' });

      // Reset file input
      const fileInput = document.getElementById('assignment-file-input');
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
        <h1>Submit Assignment</h1>
        <p className="page-subtitle">Upload your assignments as PDF files</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="card">
        <h2 className="card-title">📤 Upload Assignment</h2>
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="assignment-title">Assignment Title</label>
            <input
              id="assignment-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lab 3 — Sorting Algorithms"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="assignment-file-input">PDF File</label>
            <div className="file-input-wrapper">
              <input
                id="assignment-file-input"
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
            {uploading ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </form>
      </div>

      {submissions.length > 0 && (
        <div className="card">
          <h2 className="card-title">✅ Recent Submissions</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>File</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((a) => (
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td>📄 {a.filename}</td>
                    <td className="date-cell">
                      {new Date(a.uploaded_at).toLocaleDateString()}
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
