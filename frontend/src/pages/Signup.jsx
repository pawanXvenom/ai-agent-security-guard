import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../services/api";

const Signup = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle input changes
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
      success: "",
    }));
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must contain at least 2 characters.";
    }

    const email = formData.email.trim();

    if (!email) {
      newErrors.email = "Work email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Submit signup form to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await signupUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Signup successful
      setErrors({
        success: response.message || "Account created successfully.",
      });

      // Do not automatically log in unless the backend returns a token
      // and your application explicitly supports automatic login.
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            email: formData.email.trim().toLowerCase(),
            message:
              response.message ||
              "Account created successfully. Please sign in.",
          },
        });
      }, 800);
    } catch (error) {
      const status = error.response?.status;
      const responseData = error.response?.data;

      let message =
        responseData?.detail ||
        responseData?.message ||
        "Unable to create your account. Please try again.";

      // Handle common FastAPI validation responses
      if (Array.isArray(responseData?.detail)) {
        message = responseData.detail.map((item) => item.msg).join(" ");
      }

      if (status === 409) {
        message = "An account with this email already exists.";
      } else if (status === 422) {
        message =
          typeof responseData?.detail === "string"
            ? responseData.detail
            : "Please check your information and try again.";
      } else if (!error.response) {
        message =
          "Unable to connect to the server. Check that the backend is running.";
      }

      setErrors({
        form: message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Shared input styling
  const inputClass = (field) =>
    `w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${
      errors[field]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-800 focus:border-cyan-400 focus:ring-cyan-400/10"
    }`;

  return (
    <div className="min-h-screen bg-[#080d18] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-800/80 bg-[#0b1220] p-12 lg:flex xl:p-16">
          <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />

          <div className="absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-blue-600/10 blur-[100px]" />

          <Link to="/login" className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
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

          <div className="relative max-w-lg">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-medium text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Security starts here
            </div>

            <h2 className="text-4xl font-semibold leading-tight xl:text-5xl">
              Build with AI.
              <br />
              <span className="text-cyan-400">Stay protected.</span>
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Protect your AI agents and applications with security checks,
              threat analysis, and centralized audit visibility.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Analyze suspicious inputs",
                "Evaluate potentially risky actions",
                "Track security events from your projects",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                    ✓
                  </span>
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-slate-600">
            © {new Date().getFullYear()} AgentGuard. Security for the AI era.
          </p>
        </section>

        {/* Signup form */}
        <main className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <Link
              to="/login"
              className="mb-10 flex items-center gap-3 lg:hidden"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                🛡
              </div>
              <span className="text-lg font-bold">AgentGuard</span>
            </Link>

            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-cyan-400">
                GET STARTED
              </p>

              <h2 className="text-3xl font-semibold tracking-tight">
                Create your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Set up your developer account to get started with AgentGuard.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Full name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Puneet Prajapati"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className={inputClass("name")}
                />

                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Work email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={inputClass("email")}
                />

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className={`${inputClass("password")} pr-20`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-cyan-300"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className={`${inputClass("confirmPassword")} pr-20`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-cyan-300"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* API error */}
              {errors.form && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm leading-6 text-red-300"
                >
                  {errors.form}
                </div>
              )}

              {/* Signup success */}
              {errors.success && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm leading-6 text-emerald-300"
                >
                  {errors.success}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-[#080d18] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                By creating an account, you agree to our Terms of Service and
                Privacy Policy.
              </p>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs text-slate-600">
                ALREADY REGISTERED?
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Signup;
