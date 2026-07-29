import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { LogIn, Loader2 } from "lucide-react";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const onSubmit = async (values) => {
    setLoading(true);
    setServerError("");
    try {
      await login(values.username.trim(), values.password);
      notify("Logged in successfully");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Check your credentials.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 backdrop-blur-md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-slate-500 mb-1 block">Username</label>
          <input
            {...register("username", { required: "Username is required" })}
            placeholder="admin / engineer / operator"
            className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
          {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-slate-500 mb-1 block">Password</label>
          <input
            type="password"
            {...register("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters" } })}
            placeholder="••••••••"
            className="w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-red-400 text-xs">{serverError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center gap-2 bg-cyan-400 text-slate-950 font-bold text-sm rounded-lg py-2.5 hover:bg-cyan-300 disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <p className="text-[11px] text-slate-500 text-center mt-2">
          Demo logins (after <code className="text-cyan-400">npm run seed</code> on the backend):
          <br />
          admin/admin123 · engineer/engineer123 · operator/operator123
        </p>
      </form>
    </div>
  );
}
