import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert, fieldClass } from '../components/common/UIComponents';

const AuthShell = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-sm"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-sky-500/15 text-sky-300 font-semibold text-lg mb-4 border border-sky-400/30">
          N
        </div>
        <h1 className="text-xl font-semibold text-slate-100 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl shadow-black/30">
        {children}
      </div>

      <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>
    </motion.div>
  </div>
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const inputClass = `${fieldClass} w-full px-3 py-2.5 text-sm`;

const SubmitButton = ({ loading, children }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex justify-center items-center gap-2"
  >
    {loading && <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />}
    {children}
  </button>
);

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Invalid username or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to Nexgrid"
      subtitle="Collaborative API testing for your team"
      footer={
        <>
          New to Nexgrid?{' '}
          <Link to="/register" className="text-sky-300 hover:text-sky-200 font-medium transition-colors">
            Create an account
          </Link>
        </>
      }
    >
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Username">
          <input
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            placeholder="Enter your username"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Enter your password"
          />
        </Field>

        <SubmitButton loading={loading}>{loading ? 'Signing in...' : 'Sign in'}</SubmitButton>
      </form>
    </AuthShell>
  );
};

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(', ')
          : 'Registration failed. Check details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start collaborating with your team"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-sky-300 hover:text-sky-200 font-medium transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Username">
          <input
            type="text"
            name="username"
            required
            minLength={3}
            maxLength={50}
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            className={inputClass}
            placeholder="At least 3 characters"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="you@company.com"
          />
        </Field>

        <Field label="Full name (optional)">
          <input
            type="text"
            name="full_name"
            autoComplete="name"
            value={formData.full_name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Your name"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            name="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </Field>

        <SubmitButton loading={loading}>{loading ? 'Creating account...' : 'Create account'}</SubmitButton>
      </form>
    </AuthShell>
  );
};
