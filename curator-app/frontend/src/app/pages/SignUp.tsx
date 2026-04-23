import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(name, email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        {/* Sign Up Card */}
        <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] md:rounded-[60px] p-6 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-[family-name:var(--font-headline)] italic text-4xl md:text-5xl text-on-surface mb-3">
              Join The Curator
            </h1>
            <p className="text-on-surface-variant">
              Start your journey to thoughtful, distilled journalism
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-error-container/50 border border-error text-on-error-container rounded-[30px] p-4 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-on-surface text-sm font-medium">
                <User className="w-4 h-4 text-outline" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Julian Reed"
                required
                className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded-2xl px-5 py-4 text-on-surface text-[15px] focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-on-surface text-sm font-medium">
                <Mail className="w-4 h-4 text-outline" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded-2xl px-5 py-4 text-on-surface text-[15px] focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-on-surface text-sm font-medium">
                <Lock className="w-4 h-4 text-outline" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className="w-full bg-surface-container-lowest/50 border border-outline-variant/20 rounded-2xl pl-5 pr-12 py-4 text-on-surface text-[15px] focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 p-4">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-outline-variant accent-primary"
              />
              <label htmlFor="terms" className="text-sm text-on-surface-variant leading-relaxed">
                I agree to The Curator's{' '}
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="text-primary hover:underline"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-inverse-surface text-white py-5 px-10 rounded-full font-semibold tracking-wide shadow-xl hover:bg-zinc-800 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-container-lowest text-outline">or</span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-on-surface-variant mb-4">
              Already have an account?
            </p>
            <button
              onClick={() => navigate('/sign-in')}
              className="bg-surface-container-lowest/30 border border-outline-variant/15 text-on-surface py-4 px-10 rounded-full font-medium tracking-wide hover:bg-surface-container-low transition-all duration-300 active:scale-95"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
