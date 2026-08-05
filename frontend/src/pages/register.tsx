import React, { useState } from 'react';
import { useNavigate } from 'react-router';

export default function Register() {
  const [name, set_name] = useState('');
  const [email, set_email] = useState('');
  const [password, set_password] = useState('');
  const [confirm_password, set_confirm_password] = useState('');
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm_password) {
       console.error("Passwords do not match!");
       return;
    }
    // In a real app, this is where you call your API to register the user
    console.log("Submitting:", { name, email, password });
  };

  return (
    // The outer wrapper centers the card vertically and horizontally on the screen
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-(--page-bg) p-4">
      {/* Card */}
      <main className="w-full max-w-md bg-(--surface-1) rounded-2xl border border-(--border) p-8">
         <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
            <h2  className="text-sm">Please enter your details to sign up.</h2>
         </div>
         <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name Input */}
            <div>
               <label htmlFor="name" className="block text-sm font-medium text-(--text-muted) mb-1.5">Name</label>
               <input type="text" id="name" value={name} onChange={(e) => set_name(e.target.value)} placeholder="John Doe" required  className="w-full px-4 py-2.5 rounded-lg" />
            </div>
            {/* Email Input */}
            <div>
               <label htmlFor="email" className="block text-sm font-medium text-(--text-muted) mb-1.5">Email</label>
               <input type="email" id="email" value={email} onChange={(e) => set_email(e.target.value)} placeholder="name@example.com" required  className="w-full px-4 py-2.5 rounded-lg" />
            </div>
            {/* Password Input */}
            <div>
               <label htmlFor="password" className="block text-sm font-medium text-(--text-muted) mb-1.5">Password</label>
               <input type="password" id="password" value={password} onChange={(e) => set_password(e.target.value)} placeholder="••••••••" required  className="w-full px-4 py-2.5 rounded-lg" />
            </div>
            {/* Repeat Password Input */}
            <div>
               <label htmlFor="confirmPassword" className="block text-sm font-medium text-(--text-muted) mb-1.5">Repeat Password</label>
               <input type="password" id="confirmPassword" value={confirm_password} onChange={(e) => set_confirm_password(e.target.value)} placeholder="••••••••" required  className="w-full px-4 py-2.5 rounded-lg" />
            </div>
            <button type="submit"  className="w-full mt-2 bg-blue-700 text-(--text-primary) font-semibold py-2.5 rounded-lg hover:bg-blue-500  transition-all duration-200" >Sign Up</button>
         </form>
         <p className="text-center text-sm text-(--text-muted) mt-2 flex justify-center flex-nowrap">Already have an account?<span onClick={()=> navigate('/login')}  className="font-semibold text-blue-700 hover:text-blue-500 transition-colors ml-1 cursor-pointer">Sign in here</span></p>
      </main>
    </div>
  );
}