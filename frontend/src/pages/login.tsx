import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { custom_fetch } from '../services/api';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faMagnifyingGlassChart, faListCheck, faCircleInfo, faWallet, faTriangleExclamation, faBell, faB } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
   const navigate = useNavigate()
   const [show_password, set_show_password] = useState(false)
   const [show_form, set_show_form] = useState('login')

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

   // Register
   const [name, set_name] = useState('');
   const [reg_email, set_reg_email] = useState('');
   const [reg_password, set_reg_password] = useState('');
   const [confirm_password, set_confirm_password] = useState('');
   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirm_password) {
         console.error("Passwords do not match!");
         return
      }
      // In a real app, this is where you call your API to register the user
      console.log("Submitting:", { name, reg_email, reg_password });
   }

   return (
      <main className=" bg-(--page-bg) min-h-screen flex flex-col lg:flex-row items-center lg:p-4 gap-4 relative">
         {/* Info */}
         <section className='lg:w-2/3 h-full border border-(--border) flex flex-col gap-6 bg-(--surface-1) lg:rounded-2xl p-4 ' >
            <div className='flex text-4xl font-bold mb-2 ' >
               <h1 className='' >$ubTrack</h1>
               <FontAwesomeIcon icon={faMagnifyingGlassChart} className=' text-(--text-primary) p-1 ' />
            </div>
            <h1 className='text-5xl font-semibold ' >Never lose track of what you're paying for</h1>
            <h2>SubTrack keeps every subscription in one place. See what's due, watch your spending against a budget, and get notified before a renewal catches you off guard.</h2>
            <div className='flex gap-4' >
               <FontAwesomeIcon icon={faListCheck} className='text-2xl   text-green-500 bg-(--border) p-1 rounded-lg ' />
               <div>
                  <h1>List every subscription</h1>
                  <h2>All your recurring payments in one organized view.</h2>
               </div>
            </div>
            <div className='flex gap-4' >
               <FontAwesomeIcon icon={faWallet} className='text-2xl   text-amber-700 bg-(--border) p-1 rounded-lg ' />
               <div>
                  <h1>Track your budget</h1>
                  <h2>Set monthly limits per category and watch them in real time.</h2>
               </div>
            </div>
            <div className='flex gap-4' >
               <FontAwesomeIcon icon={faTriangleExclamation} className='text-2xl   text-(--fill-warning) bg-(--border) p-1 rounded-lg ' />
               <div>
                  <h1>Catch overspending early</h1>
                  <h2>Know the moment expenses go over budget, not after.</h2>
               </div>
            </div>
            <div className='flex gap-4' >
               <FontAwesomeIcon icon={faBell} className='text-2xl   text-(--fill-accent) bg-(--border) p-1 rounded-lg ' />
               <div>
                  <h1>Get renewal reminders</h1>
                  <h2>Never get surprised by a charge you forgot about.</h2>
               </div>
            </div>
            <div className='flex gap-4 ' >
               <FontAwesomeIcon icon={faCircleInfo} className=' text-orange-500 ' />
               <p className='text-sm text-(--fill-warning) ' >SubTrack helps you monitor subscriptions and spending, it doesn't manage or cancel them for you. To cancel a subscription, you'll still need to do it directly through that service.</p>
            </div>
         </section>

         {/* Login card */}
         {show_form === 'login' && (
            <section className="lg:w-1/3 w-full h-full bg-(--surface-1) lg:rounded-2xl border border-(--border) p-8">
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
                        <span className="text-(--text-muted) group-hover:text-blue-500 transition-colors text-xs md:text-md ">Remember me</span>
                     </label>
                     <p  className=" text-xs md:text-sm font-semibold text-blue-700 hover:text-blue-500 cursor-pointer transition-colors">Forgot password?</p>
                  </div>
                  <button type="submit"  className="w-full mt-2 bg-blue-700 text-(--text-primary) font-semibold py-2.5 rounded-lg hover:bg-blue-500 active:bg-slate-950 transition-all duration-200" >{loading ? 'Signing in...' : 'Sign in'}</button>
               </form>
               <p className="text-center text-sm text-(--text-muted) mt-8 flex justify-center flex-nowrap">Don't have an account?<span onClick={()=> set_show_form('register')}  className="font-semibold text-blue-700 hover:text-blue-500 transition-colors ml-1 cursor-pointer" >Register here</span></p>
            </section>
         )}
         
         {/* Register card */}
         {show_form === 'register' && (
            <section className="lg:w-1/3 w-full h-full bg-(--surface-1) lg:rounded-2xl border border-(--border) p-8" >
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
               <p className="text-center text-xs md:text-sm text-(--text-muted) mt-2 flex justify-center flex-nowrap">Already have an account?<span onClick={()=> set_show_form('login')}  className="font-semibold text-blue-700 hover:text-blue-500 transition-colors ml-1 cursor-pointer">Sign in here</span></p>
            </section>
         )}
      </main>
   );
} 