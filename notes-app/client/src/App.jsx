import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import CreateNote from './components/CreateNote';
import EditNote from './components/EditNote';
import NoteDetail from './components/NoteDetail';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';
import './styles/Auth.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes - require authentication */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create" 
                element={
                  <ProtectedRoute>
                    <CreateNote />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit/:id" 
                element={
                  <ProtectedRoute>
                    <EditNote />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/note/:id" 
                element={
                  <ProtectedRoute>
                    <NoteDetail />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;