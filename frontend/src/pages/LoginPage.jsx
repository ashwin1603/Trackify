import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login: storeLogin } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const data = await login(form);
      storeLogin(data);
      navigate("/");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <main className="mx-auto mt-16 max-w-md rounded border border-slate-700 p-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-cyan-400">Trackify</h1>
        <p className="text-sm text-slate-400 mt-1">Login to your account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="w-full rounded bg-slate-800 p-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          className="w-full rounded bg-slate-800 p-2"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="w-full rounded bg-cyan-600 p-2">Sign In</button>
      </form>
      <p className="mt-3 text-sm">
        No account?{" "}
        <Link to="/signup" className="text-cyan-400">
          Create one
        </Link>
      </p>
    </main>
  );
}
