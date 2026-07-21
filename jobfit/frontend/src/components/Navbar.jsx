import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🎯 JobFit AI</Link>
      <div style={styles.links}>
        {user ? (
          <>
            <Link to="/dashboard" style={styles.link}>Dashboard</Link>
            <span style={styles.name}>👤 {user.name}</span>
            <button onClick={() => { logout(); navigate("/login"); }} style={styles.btn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.btn}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: "flex", justifyContent: "space-between", padding: "15px 30px", background: "#1a1a2e", color: "white", alignItems: "center" },
  brand: { color: "#e94560", fontSize: "24px", fontWeight: "bold", textDecoration: "none" },
  links: { display: "flex", gap: "20px", alignItems: "center" },
  link: { color: "white", textDecoration: "none" },
  name: { color: "#ddd" },
  btn: { background: "#e94560", color: "white", border: "none", padding: "8px 16px", borderRadius: "5px", cursor: "pointer", textDecoration: "none" },
};

export default Navbar;