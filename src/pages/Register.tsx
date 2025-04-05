import React from 'react';

function Register() {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSubmit = (event:any) => {
    event.preventDefault();
    // TODO: Implement actual registration logic (API call, etc.)
    console.log('Registration attempt with:', { fullName, email, password, confirmPassword });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Registration
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-5">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Full Name"
              required
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800 shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
            />
          </div>

          {/* Email Address */}
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800 shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800 shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-gray-600"
                  aria-label="Toggle Password Visibility"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.105.189-2.163.537-3.15m2.065-1.863A9.971 9.971 0 0112 3c5.523 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md text-gray-800 shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-gray-600"
                  aria-label="Toggle Confirm Password Visibility"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.105.189-2.163.537-3.15m2.065-1.863A9.971 9.971 0 0112 3c5.523 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-150"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-gray-800 hover:text-gray-700 transition duration-150">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
