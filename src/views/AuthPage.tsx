import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const title = isLogin ? "Sign In to WOT" : "Sign Up for WOT";
  const buttonText = isLogin ? "Login" : "Create Account";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    if (!email || !password) {
      setError("Email and password are required.");
      setIsProcessing(false);
      return;
    }

    try {
      // --- MOCK AUTHENTICATION LOGIC ---
      console.log(`${isLogin ? 'Login' : 'Signup'} attempt for: ${email}`);

      // In a real application, this is where you would call the NestJS Auth API:
      // const response = await fetch('/api/v1/auth/login', { ... });
      // const { token } = await response.json();

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      // Mock success: Use the mock token from AuthContext
      login('MOCK_SME_TOKEN'); 

      // Redirect to the protected dashboard
      navigate('/sme', { replace: true });

    } catch (err) {
      console.error(err);
      setError("Authentication failed. Please check your credentials or try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 transform transition duration-500 hover:scale-[1.01]">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">{title}</h1>
        <p className="text-center text-gray-500 mb-8">
          Access your SME Dashboard for Smarter Workflows.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-gray-300 border rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="e.g., mama.ngozi@wot.ng"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-gray-300 border rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white p-3 rounded-lg text-lg font-bold shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-150 flex items-center justify-center"
          >
            {isProcessing ? (
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
            ) : (
                <i className={`fa-solid ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'} mr-2`}></i>
            )}
            {isProcessing ? 'Processing...' : buttonText}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Need an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            type="button"
            className="text-blue-600 font-semibold ml-2 hover:text-blue-800 transition duration-150"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;