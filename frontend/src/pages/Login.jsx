import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      form: "",
    }));
  };

  // Validate login form
  const validateForm = () => {
    const newErrors = {};

    const email = formData.email.trim();

    if (!email) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Login handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    if (!validateForm()) return;

    setIsLoading(true);

    setErrors({});

    try {
      const data = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Support common FastAPI response formats.
      const token = data?.access_token || data?.token || data?.accessToken;

      if (!token) {
        throw new Error(
          "Login response did not contain an access token. Check your backend response.",
        );
      }

      // Remove previous session credentials first.
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("user");

      // Save credentials according to Remember Me.
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("access_token", token);

      if (data.user) {
        storage.setItem("user", JSON.stringify(data.user));
      }

      // Redirect to the original destination, if available.
      const requestedPath = location.state?.from?.pathname;

      const destination =
        requestedPath &&
        requestedPath !== "/login" &&
        requestedPath !== "/signup"
          ? requestedPath
          : "/dashboard";

      navigate(destination, { replace: true });
    } catch (error) {
      console.error("Login error:", error);

      const status = error.response?.status;
      const responseData = error.response?.data;

      let message =
        responseData?.detail ||
        responseData?.message ||
        error.message ||
        "Unable to sign in. Please try again.";

      // FastAPI can return validation details as an array.
      if (Array.isArray(message)) {
        message = message.map((item) => item.msg || "Invalid input").join(", ");
      }

      if (!error.response && error.request) {
        message =
          "Cannot connect to the server. Check whether the backend is running.";
      } else if (status === 401 || status === 403) {
        message = "Invalid email or password. Please try again.";
      } else if (status === 404) {
        message =
          "Login endpoint not found. Please check the backend API route.";
      } else if (status >= 500) {
        message = "Server error. Please try again after some time.";
      }

      setErrors({
        form: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = () => {
    setErrors({
      form: "Password reset is not available yet.",
    });
  };

  // Input styling
  const inputClass = (field) =>
    `w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${
      errors[field]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-800 focus:border-cyan-400 focus:ring-cyan-400/10"
    }`;

  return (
    <div className="min-h-screen bg-[#080d18] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-800/80 bg-[#0b1220] p-12 lg:flex xl:p-16">
          <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />

          <div className="absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-blue-600/10 blur-[100px]" />

          {/* Brand */}
          <Link to="/login" className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z"
                  strokeLinejoin="round"
                />

                <path
                  d="m9 12 2 2 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">AgentGuard</h1>

              <p className="text-xs text-slate-500">AI Security Platform</p>
            </div>
          </Link>

          {/* Introduction */}
          <div className="relative max-w-lg">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-medium text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Developer Security Console
            </div>

            <h2 className="text-4xl font-semibold leading-tight xl:text-5xl">
              Your security.
              <br />
              <span className="text-cyan-400">One clear view.</span>
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Sign in to review security activity, analyze threats, and manage
              your connected projects from one place.
            </p>

            {/* Security preview */}
            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Security monitoring
                </span>

                <span className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Platform preview
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">Threat analysis</p>

                  <p className="mt-2 text-lg font-semibold">Real-time API</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">Project visibility</p>

                  <p className="mt-2 text-lg font-semibold">Centralized</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="relative text-xs text-slate-600">
            © {new Date().getFullYear()} AgentGuard. Security for the AI era.
          </p>
        </section>

        {/* Login form */}
        <main className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <Link
              to="/login"
              className="mb-10 flex items-center gap-3 lg:hidden"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                🛡
              </div>

              <span className="text-lg font-bold">AgentGuard</span>
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-cyan-400">
                WELCOME BACK
              </p>

              <h2 className="text-3xl font-semibold tracking-tight">
                Sign in to AgentGuard
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Enter your account details to access your security dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={inputClass("email")}
                />

                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-xs text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300 disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={`${inputClass("password")} pr-20`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 transition hover:text-cyan-300 disabled:opacity-50"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {errors.password && (
                  <p
                    id="password-error"
                    className="mt-1.5 text-xs text-red-400"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-cyan-400"
                />

                <span className="text-sm text-slate-400">Remember me</span>
              </label>

              {/* Backend error */}
              {errors.form && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm leading-6 text-red-300"
                >
                  {errors.form}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-[#080d18] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                      />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />

              <span className="text-xs text-slate-600">NEW TO AGENTGUARD?</span>

              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Signup link */}
            <p className="text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                Create account
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
