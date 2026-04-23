import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleName: "DEVELOPER",
    dob: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Client-side guard: DOB is required for developers
    if (form.roleName === "DEVELOPER" && !form.dob) {
      setError("Date of birth is required for developer accounts.");
      return;
    }

    try {
      // Only send dob when role is DEVELOPER
      const payload = { ...form };
      if (form.roleName !== "DEVELOPER") delete payload.dob;

      const data = await signup(payload);
      login(data);
      navigate("/");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <main className="mx-auto mt-16 max-w-md rounded border border-slate-700 p-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-cyan-400">Trackify</h1>
        <p className="text-sm text-slate-400 mt-1">Create an account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="w-full rounded bg-slate-800 p-2"
        />
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
        <p className="text-xs text-slate-400">
          Your password must meet these requirements: at least one uppercase letter, one lowercase
          letter, one number, one special character, and 8–64 characters total.
        </p>
        <select
          value={form.roleName}
          onChange={(e) => setForm((p) => ({ ...p, roleName: e.target.value, dob: "" }))}
          className="w-full rounded bg-slate-800 p-2"
        >
          <option value="DEVELOPER">DEVELOPER</option>
          <option value="TESTER">TESTER</option>
        </select>
        <p className="text-xs text-slate-400">
          Select the role that best fits your needs.
        </p>

        {/* DOB field — only shown and required for DEVELOPER role */}
        {form.roleName === "DEVELOPER" && (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              Date of Birth <span className="text-cyan-400">(required for developers)</span>
            </label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
              max={new Date().toISOString().split("T")[0]}
              className="w-full rounded bg-slate-800 p-2 text-slate-100"
            />
            <p className="text-xs text-slate-500">
              Your developer code will be generated from your birth year + name (e.g.{" "}
              <span className="text-slate-400">2000johndoe</span>).
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="w-full rounded bg-cyan-600 p-2">Create Account</button>
      </form>
      <p className="mt-3 text-sm">
        Have an account?{" "}
        <Link to="/login" className="text-cyan-400">
          Login
        </Link>
      </p>
    </main>
  );
}
