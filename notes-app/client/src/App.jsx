import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { getNotes, getNoteById, createNote, updateNote, deleteNote } from './services/api';
import './App.css';

// ============ COMPONENTS ============

// Navbar Component
function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="brand">📝 Notes App</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/create">+ New Note</Link>
        </div>
      </div>
    </nav>
  );
}

// Home Page - List all notes
function Home() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const res = await getNotes();
      setNotes(res.data.data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await deleteNote(id);
      setNotes(notes.filter(n => n._id !== id));
    } catch (error) {
      alert('Failed to delete');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <h1>My Notes</h1>
      <div className="notes-grid">
        {notes.length === 0 ? (
          <p>No notes yet. Create one!</p>
        ) : (
          notes.map(note => (
            <div key={note._id} className="note-card">
              <h3>{note.title}</h3>
              <p>{note.description}</p>
              <div className="note-actions">
                <Link to={`/edit/${note._id}`} className="btn-edit">✏️ Edit</Link>
                <button onClick={() => handleDelete(note._id)} className="btn-delete">🗑️ Delete</button>
                <Link to={`/note/${note._id}`} className="btn-view">👁️ View</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Create Note Page
function CreateNote() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      alert('Please fill all fields');
      return;
    }
    try {
      setLoading(true);
      await createNote(form);
      navigate('/');
    } catch (error) {
      alert('Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Create Note</h1>
      <form onSubmit={handleSubmit} className="note-form">
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Note'}
        </button>
      </form>
    </div>
  );
}

// Edit Note Page
function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNote();
  }, []);

  const loadNote = async () => {
    try {
      const res = await getNoteById(id);
      setForm(res.data.data);
    } catch (error) {
      alert('Note not found');
      navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateNote(id, form);
      navigate('/');
    } catch (error) {
      alert('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Edit Note</h1>
      <form onSubmit={handleSubmit} className="note-form">
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Note'}
        </button>
      </form>
    </div>
  );
}

// Note Detail Page
function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNote();
  }, []);

  const loadNote = async () => {
    try {
      const res = await getNoteById(id);
      setNote(res.data.data);
    } catch (error) {
      alert('Note not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!note) return <div>Note not found</div>;

  return (
    <div className="container">
      <Link to="/" className="back-link">← Back to Notes</Link>
      <div className="note-detail">
        <h1>{note.title}</h1>
        <p>{note.description}</p>
        <small>Created: {new Date(note.createdAt).toLocaleDateString()}</small>
        <br />
        <small>Updated: {new Date(note.updatedAt).toLocaleDateString()}</small>
        <div style={{ marginTop: '20px' }}>
          <Link to={`/edit/${note._id}`} className="btn-edit" style={{ padding: '10px 20px', textDecoration: 'none', borderRadius: '5px' }}>
            ✏️ Edit This Note
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateNote />} />
        <Route path="/edit/:id" element={<EditNote />} />
        <Route path="/note/:id" element={<NoteDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;