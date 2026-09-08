import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { mockAuth, MOCK_ADMIN_CREDENTIALS } from "@/lib/mockAuth";
import { AlertCircle, Info } from "lucide-react";

export const Login = () => {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your applications and submissions."
      footer={<>Don't have an account? <Link to="/register" className="text-copper-600 font-medium hover:text-copper-900">Create one</Link></>}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); navigate("/"); }}
        className="space-y-4"
      >
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <input type="email" className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white" placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Password</label>
            <a href="#" className="text-xs text-copper-600 hover:text-copper-900">Forgot?</a>
          </div>
          <input type="password" className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl py-3 font-medium hover:from-copper-600 transition-colors">
          Sign in
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sand-200" /></div>
          <div className="relative flex justify-center"><span className="bg-sand-50 px-3 text-xs text-muted-foreground">or continue with</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="border border-sand-200 rounded-lg py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors">Google</button>
          <button type="button" className="border border-sand-200 rounded-lg py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors">Facebook</button>
        </div>
        <div className="pt-4 border-t border-sand-200">
          <Link 
            to="/login-admin" 
            className="block w-full text-center border border-earth-900/20 bg-earth-900/5 rounded-lg py-2.5 text-sm font-medium text-earth-900 hover:bg-earth-900/10 transition-colors"
          >
            Admin Portal
          </Link>
        </div>
      </form>
    </AuthShell>
  );
};

export const Register = () => {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Create your account"
      subtitle="Track applications, save licences and participate in consultations."
      footer={<>Already have an account? <Link to="/login" className="text-copper-600 font-medium hover:text-copper-900">Sign in</Link></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); navigate("/login"); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">First name</label>
            <input className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Last name</label>
            <input className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <input type="email" className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Password</label>
          <input type="password" className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white" />
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" className="mt-0.5 rounded border-sand-200 text-primary focus:ring-primary" />
          <span>I agree to the <Link to="/policy/terms" className="text-copper-600 hover:underline">Terms</Link> and <Link to="/policy/privacy" className="text-copper-600 hover:underline">Privacy Policy</Link>.</span>
        </label>
        <button type="submit" className="w-full bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl py-3 font-medium hover:from-copper-600 transition-colors">
          Create account
        </button>
      </form>
    </AuthShell>
  );
};

export const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const user = mockAuth.login(username, password);
    if (user) {
      navigate(location.state?.from ?? "/login-admin/admin/dashboard", { replace: true });
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <AuthShell
      variant="admin"
      title="Administrator sign-in"
      subtitle="Restricted access for authorised government officials."
      footer={<>Lost access? Contact your system administrator.</>}
    >
      <div className="mb-5 flex items-start gap-3 bg-copper-50 border border-copper-500/20 rounded-lg p-3 text-xs text-earth-900">
        <Info size={14} className="text-copper-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-0.5">Demo credentials</div>
          <div className="text-muted-foreground">
            Username: <code className="font-mono text-earth-900">{MOCK_ADMIN_CREDENTIALS.username}</code>
            {" · "}
            Password: <code className="font-mono text-earth-900">{MOCK_ADMIN_CREDENTIALS.password}</code>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <button type="submit" className="w-full bg-earth-900 text-sand-50 rounded-xl py-3 font-medium hover:bg-earth-800 transition-colors">
          Sign in to console
        </button>
      </form>
    </AuthShell>
  );
};
