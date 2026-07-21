import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNotes, deleteNote } from '../services/api';
import './Home.css'; // Import the CSS file

function Home() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getNotes();
      console.log('Notes response:', res.data);
      setNotes(res.data.data || res.data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      setError('Failed to load notes. Please try again.');
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await deleteNote(id);
      setNotes(notes.filter(n => n._id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get random gradient for note cards
  const getCardGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    return gradients[index % gradients.length];
  };

  // Loading state
  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your notes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="home-container">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>Oops!</h2>
          <p className="error-message">{error}</p>
          <button onClick={loadNotes} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="container">
        {/* Header Section */}
        <div className="notes-header">
          <div className="header-left">
            <h1 className="page-title">
              <span className="title-icon">📝</span>
              My Notes
            </h1>
            <p className="note-count">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
          <Link to="/create" className="btn-create">
            <span className="btn-icon">+</span>
            Create Note
          </Link>
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>No Notes Yet</h2>
            <p>Start your journey by creating your first note!</p>
            <Link to="/create" className="btn-create-large">
              <span className="btn-icon">✨</span>
              Create Your First Note
            </Link>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note, index) => (
              <div 
                key={note._id} 
                className="note-card"
                style={{ '--card-gradient': getCardGradient(index) }}
              >
                <div className="note-card-header" style={{ background: getCardGradient(index) }}>
                  <div className="note-card-badge">
                    {note.completed ? '✅' : '📌'}
                  </div>
                </div>
                
                <div className="note-card-body">
                  <h3 className="note-title">{note.title}</h3>
                  <p className="note-description">
                    {note.description.length > 120 
                      ? `${note.description.substring(0, 120)}...` 
                      : note.description}
                  </p>
                  
                  <div className="note-meta">
                    <span className="meta-item">
                      📅 {formatDate(note.createdAt)}
                    </span>
                    {note.updatedAt !== note.createdAt && (
                      <span className="meta-item updated">
                        ✏️ Updated
                      </span>
                    )}
                  </div>
                </div>

                <div className="note-card-footer">
                  <Link 
                    to={`/note/${note._id}`} 
                    className="btn-action btn-view"
                    title="View note"
                  >
                    👁️ View
                  </Link>
                  <Link 
                    to={`/edit/${note._id}`} 
                    className="btn-action btn-edit"
                    title="Edit note"
                  >
                    ✏️ Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(note._id)} 
                    className="btn-action btn-delete"
                    title="Delete note"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;