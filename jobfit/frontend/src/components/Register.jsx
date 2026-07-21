import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "30px", background: "white", borderRadius: "10px" }}>
      <h2>🚀 Create JobFit Account</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
        <button type="submit" style={btnStyle}>Create Account</button>
      </form>
      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "12px", margin: "10px 0", borderRadius: "5px", border: "2px solid #ddd", boxSizing: "border-box" };
const btnStyle = { width: "100%", padding: "12px", background: "#e94560", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" };

export default Register;