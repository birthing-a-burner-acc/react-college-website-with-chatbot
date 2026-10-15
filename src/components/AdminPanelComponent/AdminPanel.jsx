import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

function AdminPanelComp() {
  const [faqs, setFaqs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const API = import.meta.env.VITE_API_URL;

  const loadData = () => {
    fetch(`${API}/api/faqs`)
      .then((res) => res.json())
      .then(setFaqs);

    fetch(`${API}/api/documents`)
      .then((res) => res.json())
      .then(setDocuments);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddFaq = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
    });
    if (res.ok) {
      const added = await res.json();
      setFaqs([...faqs, { _id: added.insertedId, question: newQuestion, answer: newAnswer }]);
      setNewQuestion('');
      setNewAnswer('');
    }
  };

  const handleDeleteFaq = async (id) => {
    await fetch(`${API}/api/faqs/${id}`, { method: 'DELETE' });
    setFaqs(faqs.filter((f) => f._id !== id));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(`Uploaded "${selectedFile.name}" — ${data.chunks} chunks indexed.`);
        setSelectedFile(null);
        loadData();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (source) => {
    await fetch(`${API}/api/documents/${encodeURIComponent(source)}`, { method: 'DELETE' });
    setDocuments(documents.filter((d) => d._id !== source));
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Knowledge Bank Management</h1>
        <p>Manage FAQs and uploaded documents for your chatbot.</p>
      </div>

      {/* --- Add FAQ Card --- */}
      <div className="admin-card">
        <h2>Add New FAQ</h2>
        <form onSubmit={handleAddFaq} className="admin-form">
          <div className="form-group">
            <label>Question</label>
            <input
              type="text"
              placeholder="e.g., What is the admission deadline?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Answer</label>
            <input
              type="text"
              placeholder="e.g., The admission deadline is July 31st."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="admin-btn-primary">Add FAQ</button>
        </form>
      </div>

      {/* --- File Upload Card --- */}
      <div className="admin-card">
        <h2>Upload PDF or TXT Document</h2>
        <p style={{ color: '#777', marginBottom: '20px' }}>
          Upload admission brochures, fee structures, or policy documents. The text will be extracted and indexed for the chatbot.
        </p>
        <form onSubmit={handleUpload} className="admin-form">
          <div className="form-group">
            <label className="form-label">Select File (.pdf or .txt, max 10 MB)</label>
            
            <div className="custom-file-wrapper">
              {/* 1. Visually hidden native input */}
              <input
                type="file"
                id="admin-file-picker"
                accept=".pdf,.txt"
                className="hidden-file-input"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                disabled={uploading}
                required
              />
              
              {/* 2. Beautiful mock button linked to the native input */}
              <label 
                htmlFor="admin-file-picker" 
                className={`admin-btn-secondary ${uploading ? 'disabled' : ''}`}
              >
                📂 Choose File
              </label>

              {/* 3. Live placeholder or filename display */}
              <span className="file-status-text">
                {selectedFile ? selectedFile.name : 'No file selected'}
              </span>
            </div>
          </div>

          <button type="submit" className="admin-btn-primary" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload & Index'}
          </button>
          
          {message && <p style={{ marginTop: '15px', color: '#333' }}>{message}</p>}
        </form>
      </div>

      {/* --- Uploaded Documents Card --- */}
      <div className="admin-card">
        <h2>Uploaded Documents ({documents.length})</h2>
        {documents.length === 0 ? (
          <p className="empty-state">No documents uploaded yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Chunks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td>{doc._id}</td>
                  <td>{doc.chunks}</td>
                  <td>
                    <button
                      className="admin-btn-danger"
                      onClick={() => handleDeleteDocument(doc._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- Existing FAQs Card --- */}
      <div className="admin-card">
        <h2>Existing FAQs ({faqs.length})</h2>
        {faqs.length === 0 ? (
          <p className="empty-state">No FAQs yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Answer</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq._id}>
                  <td>{faq.question}</td>
                  <td>{faq.answer}</td>
                  <td>
                    <button
                      className="admin-btn-danger"
                      onClick={() => handleDeleteFaq(faq._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminPanelComp;
