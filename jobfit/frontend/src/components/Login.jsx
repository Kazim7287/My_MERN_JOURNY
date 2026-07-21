import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "30px", background: "white", borderRadius: "10px" }}>
      <h2>🔑 Login to JobFit</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
        <button type="submit" style={btnStyle}>Login</button>
      </form>
      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Don't have an account? <Link to="/register">Sign Up</Link>
      </p>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "12px", margin: "10px 0", borderRadius: "5px", border: "2px solid #ddd", boxSizing: "border-box" };
const btnStyle = { width: "100%", padding: "12px", background: "#e94560", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" };

export default Login;