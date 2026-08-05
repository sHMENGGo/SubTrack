import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { custom_fetch } from '../services/api';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
   const navigate = useNavigate()
   const [show_password, set_show_password] = useState(false)

   // Login
   const [email, set_email] = useState('');
   const [password, set_password] = useState('');
   const [remember_me, set_remember_me] = useState(false);
   const [loading, set_loading] = useState(false)
   const login = async (e: React.FormEvent)=> {
      e.preventDefault()
      set_loading(true)
      try {
         const data = await custom_fetch('login', {
            method: 'POST',
            body: JSON.stringify({ email, password, remember_me })
         })
         navigate('/dashboard', {replace: true})
         toast.success(data.message)
      } catch(err) {console.log('Error login: ', err)}
      finally {set_loading(false)}
   }

   return (
      // The outer wrapper centers the card vertically and horizontally on the screen
      <div className=" bg-(--page-bg) min-h-screen min-w-screen flex items-center justify-center p-4">
         {/* Card */}
         <main className="w-full max-w-md bg-(--surface-1) rounded-2xl border border-(--border) p-8">
            <div className="text-center mb-8">
               <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
               <h2 className="text-sm mt-2" >Please enter your details to sign in.</h2>
            </div>
            <form onSubmit={login} className="flex flex-col gap-5">
               {/* Email Input */}
               <div>
                  <label htmlFor="email" className="block text-sm font-medium text-(--text-muted) mb-1.5">Email</label>
                  <input type="email" id="email" value={email} onChange={(e) => set_email(e.target.value)} placeholder="name@example.com" required  className="w-full px-4 py-2.5 rounded-lg" />
               </div>
               {/* Password Input */}
               <div className='relative' >
                  <label htmlFor="password" className="block text-sm font-medium text-(--text-muted) mb-1.5">Password</label>
                  <input type={show_password ? 'text' : 'password'} id="password" value={password} onChange={(e) => set_password(e.target.value)} placeholder="••••••••" required  className="w-full px-4 py-2.5 rounded-lg" />
                  {show_password ? (
                     <FontAwesomeIcon icon={faEye} onClick={()=> set_show_password(false)}  className='text-(--text-muted) text-lg absolute right-2 top-[55%] cursor-pointer hover:text-(--text-secondary) ' />
                  ) : (
                     <FontAwesomeIcon icon={faEyeSlash} onClick={()=> set_show_password(true)}  className='text-(--text-muted) text-lg absolute right-2 top-[55%] cursor-pointer hover:text-(--text-secondary) ' />
                  )}
               </div>
               <div className="flex items-center justify-between mt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <input type="checkbox" checked={remember_me} onChange={(e) => set_remember_me(e.target.checked)}  className="w-4 h-4 rounded cursor-pointer transition-colors" />
                     <span className="text-(--text-muted) group-hover:text-blue-500 transition-colors">Remember me</span>
                  </label>
                  <p  className="text-sm font-semibold text-blue-700 hover:text-blue-500 cursor-pointer transition-colors">Forgot password?</p>
               </div>
               <button type="submit"  className="w-full mt-2 bg-blue-700 text-(--text-primary) font-semibold py-2.5 rounded-lg hover:bg-blue-500 active:bg-slate-950 transition-all duration-200" >{loading ? 'Signing in...' : 'Sign in'}</button>
            </form>
            <p className="text-center text-sm text-(--text-muted) mt-8 flex justify-center flex-nowrap">Don't have an account?<span onClick={()=> navigate('/register')}  className="font-semibold text-blue-700 hover:text-blue-500 transition-colors ml-1 cursor-pointer" >Register here</span></p>
         </main>
      </div>
   );
} 