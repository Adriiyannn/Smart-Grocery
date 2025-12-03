import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import supabase from '../utils/supabase';

const modalStyles = `
  .auth-modal-backdrop {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  .auth-modal-backdrop {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    display: flex !important;
    align-items: flex-start !important;
    justify-content: center !important;
    min-height: 100vh !important;
    padding-top: 45px !important;
    pointer-events: none !important;
    z-index: 9999 !important;
    position: sticky !important;
  }
  .auth-modal-backdrop > div {
    pointer-events: auto !important;
  }
  .auth-modal-backdrop * {
    color: #000000 !important;
  }
  .auth-modal-backdrop .text-gray-400,
  .auth-modal-backdrop .text-gray-600 {
    color: #9ca3af !important;
  }
  .auth-modal-backdrop .text-blue-600 {
    color: #2563eb !important;
  }
  .auth-modal-backdrop .text-red-600 {
    color: #dc2626 !important;
  }
  .auth-modal-backdrop button[type="submit"] {
    color: #ffffff !important;
  }
  .auth-modal-backdrop input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    background-color: #ffffff !important;
    cursor: pointer;
  }
  
  .auth-modal-backdrop input[type="checkbox"]:checked {
    background-color: #2563eb !important;
    border-color: #2563eb !important;
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 20 20' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' fill='white'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
  }
`;

export default function AuthModal({ isOpen, onClose, initialTab = 'signin' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sign In Form State
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });

  // Sign Up Form State
  const [signUpForm, setSignUpForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [signUpErrors, setSignUpErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberMe');
    if (savedCredentials) {
      const { email, password } = JSON.parse(savedCredentials);
      setSignInForm({ email, password });
      setRememberMe(true);
    }
  }, []);

  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (signUpErrors[name]) {
      setSignUpErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateSignUp = () => {
    const errors = {};
    if (!signUpForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!signUpForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpForm.email)) errors.email = 'Invalid email format';
    if (!signUpForm.password) errors.password = 'Password is required';
    else if (signUpForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!signUpForm.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (signUpForm.password !== signUpForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    setSignUpErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInForm.email || !signInForm.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill in all fields',
        confirmButtonColor: '#2563eb',
        timer: 4000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'center',
        allowOutsideClick: false,
      });
      return;
    }
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInForm.email,
        password: signInForm.password
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          Swal.fire({
            icon: 'info',
            title: 'Email Confirmation Required',
            html: 'Your email has not been confirmed yet.<br>Please check your email for a confirmation link.<br><br>Once you confirm your email, you can sign in.',
            confirmButtonColor: '#2563eb',
            timer: 5000,
            timerProgressBar: true,
            position: 'center',
            allowOutsideClick: false,
            showConfirmButton: false,
          });
        } else if (error.message.includes('Invalid login credentials')) {
          Swal.fire({
            icon: 'error',
            title: 'Sign In Failed',
            text: 'Invalid email or password. Please check your credentials and try again.',
            confirmButtonColor: '#2563eb',
            timer: 4000,
            timerProgressBar: true,
            position: 'center',
            showConfirmButton: false,
            allowOutsideClick: false,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Sign In Failed',
            text: error.message || 'Unable to sign in. Please try again.',
            confirmButtonColor: '#2563eb',
            timer: 4000,
            timerProgressBar: true,
            position: 'center',
            showConfirmButton: false,
            allowOutsideClick: false,
          });
        }
      } else {
        // Save credentials if "Remember me" is checked
        if (rememberMe) {
          localStorage.setItem('rememberMe', JSON.stringify({
            email: signInForm.email,
            password: signInForm.password
          }));
        } else {
          localStorage.removeItem('rememberMe');
        }

        Swal.fire({
          icon: 'success',
          title: 'Welcome Back!',
          text: `Successfully signed in as ${signInForm.email}`,
          confirmButtonColor: '#2563eb',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
        setSignInForm({ email: '', password: '' });
        onClose();
      }
    } catch (err) {
      console.error('Sign in error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred. Please try again.',
        confirmButtonColor: '#2563eb',
        timer: 4000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'center',
        allowOutsideClick: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    
    setLoading(true);
    
    try {
      // Sign up the user with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: signUpForm.email,
        password: signUpForm.password
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        
        // If user is already registered, switch to sign in
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
          setSignInForm({
            email: signUpForm.email,
            password: signUpForm.password
          });
          
          await Swal.fire({
            icon: 'info',
            title: 'Email Already Exists',
            text: 'This email is already registered. Switching to sign in...',
            confirmButtonColor: '#2563eb',
            timer: 4000,
            timerProgressBar: true,
            showConfirmButton: false,
            position: 'center',
            allowOutsideClick: false,
          });
          
          setActiveTab('signin');
          setLoading(false);
          return;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Sign Up Failed',
          text: signUpError.message || 'Unable to create account. Please try again.',
          confirmButtonColor: '#2563eb',
          timer: 4000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
        setLoading(false);
        return;
      }

      // Save user profile data to the "User" table immediately
      if (signUpData.user) {
        const { error: insertError } = await supabase
          .from('User')
          .insert([
            {
              user_id: signUpData.user.id,
              name: signUpForm.fullName,
              email: signUpForm.email
            }
          ]);

        if (insertError) {
          console.error('Error saving user profile:', insertError);
        }
      }

      // Show success alert
      Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        text: `Welcome ${signUpForm.fullName}! Your account has been created. You can now sign in.`,
        confirmButtonColor: '#2563eb',
        timer: 3000,
        timerProgressBar: true,
        position: 'top',
        allowOutsideClick: false,
      });

      // Reset form
      setSignUpForm({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setSignUpErrors({});
      onClose();
    } catch (err) {
      console.error('Sign up error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred. Please try again.',
        confirmButtonColor: '#2563eb',
        timer: 4000,
        timerProgressBar: true,
        position: 'top',
        allowOutsideClick: false,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{modalStyles}</style>
      <div className="auth-modal-backdrop fixed inset-0 bg-black/50 z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 pt-4">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 pb-4 font-semibold text-center transition-all cursor-pointer ${
              activeTab === 'signin'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 pb-4 font-semibold text-center transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {activeTab === 'signin' ? (
            // Sign In Form
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={signInForm.email}
                    onChange={handleSignInChange}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={signInForm.password}
                    onChange={handleSignInChange}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>


            </form>
          ) : (
            // Sign Up Form
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={signUpForm.fullName}
                    onChange={handleSignUpChange}
                    placeholder="John Doe"
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition placeholder:text-gray-400 ${
                      signUpErrors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {signUpErrors.fullName && <p className="text-red-500 text-xs mt-1">{signUpErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={signUpForm.email}
                    onChange={handleSignUpChange}
                    placeholder="you@example.com"
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition placeholder:text-gray-400 ${
                      signUpErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {signUpErrors.email && <p className="text-red-500 text-xs mt-1">{signUpErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={signUpForm.password}
                    onChange={handleSignUpChange}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition ${
                      signUpErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {signUpErrors.password && <p className="text-red-500 text-xs mt-1">{signUpErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={signUpForm.confirmPassword}
                    onChange={handleSignUpChange}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition ${
                      signUpErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {signUpErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{signUpErrors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>


            </form>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
