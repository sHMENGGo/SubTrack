import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { custom_fetch } from '../services/api';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faMagnifyingGlassChart, faListCheck, faCircleInfo, faWallet, faTriangleExclamation, faBell } from '@fortawesome/free-solid-svg-icons';

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
      } catch(err: any) {
         toast.error(err.message)
         console.log('Error login: ', err.message)
      }
      finally {set_loading(false)}
   }

   // Register
   const [reg_error, set_reg_error] = useState('')
   const [show_code_form, set_show_code_form] = useState(false)
   const [sending_code, set_sending_code] = useState(false)
   const [reg_name, set_reg_name] = useState('')
   const [reg_email, set_reg_email] = useState('')
   const [reg_password, set_reg_password] = useState('')
   const [confirm_password, set_confirm_password] = useState('')
   // Send code
   const register_send_code = async (e: React.SubmitEvent) => {
      e.preventDefault()
      if (reg_password !== confirm_password) {set_reg_error("Password doesn't match."); return}
      set_sending_code(true)
      try {
         const data = await custom_fetch('register/send_code', {
            method: 'POST',
            body: JSON.stringify({ reg_email })
         })
         toast.success(data.message)
         set_show_code_form(true)
      } catch(err: any) {
         toast.error(err.message)
         console.log('Error sending code: ', err)
      }
      finally{ set_sending_code(false) }
   }
   // Verify code
   const [verifying, set_verifying]= useState(false)
   const [code, set_code]= useState('')
   const register_verify_code = async (e: React.SubmitEvent) => {
      e.preventDefault()
      set_verifying(true)
      try {
         const data = await custom_fetch('register/verify_code', {
            method: 'POST',
            body: JSON.stringify({ code, reg_name, reg_email, reg_password })
         })
         toast.success(data.message)
         set_show_code_form(false)
         set_code('')
         set_show_form('login')
      } catch(err: any) {
         toast.error(err.message)
         console.log('Error verifying code: ', err)
      }
      finally { (set_verifying(false)) }
   }

   const clear_reg_input = ()=> {
      set_reg_name('')
      set_reg_email('')
      set_reg_password('')
      set_confirm_password('')
      set_reg_error('')
   }

   // Forgot password send code
   const [show_forgot_form, set_show_forgot_form] = useState('')
   const [sending_forgot_code, set_sending_forgot_code]= useState(false)
   const [email_to_change_pass, set_email_to_change_pass] = useState('')
   const forgot_send_code = async (e: React.SubmitEvent)=> {
      e.preventDefault()
      set_sending_forgot_code(true)
      try {
         const data = await custom_fetch('forgot/send_code', {
            method: 'POST',
            body: JSON.stringify({ email })
         })
         set_email_to_change_pass(data.email)
         set_show_forgot_form('verify')
         toast.success(data.message)
      } catch(err: any) {
         toast.error(err.message)
         console.log('Error sending code: ', err)
      }
      finally { (set_sending_forgot_code(false)) }
   }

   // Forgot password verify code
   const [forgot_code, set_forgot_code] = useState('')
   const [forogt_code_verifying, set_forogt_code_verifying] = useState(false)
   const forgot_verify_code = async (e: React.SubmitEvent)=> {
      e.preventDefault()
      set_forogt_code_verifying(true)
      try {
         const data = await custom_fetch('forgot/verify_code', {
            method: 'POST',
            body: JSON.stringify({ forgot_code })
         })
         toast.success(data.message)
         set_show_forgot_form('change_pass')
      } catch(err: any) {
         toast.error(err.message)
         console.log('Error sending code: ', err)
      } finally { (set_forogt_code_verifying(false)) }
   }

   // Change password after forgot verification
   const [submitting_pass, set_submitting_pass] = useState(false)
   const [new_password, set_new_password] = useState('')
   const change_pass = async (e: React.SubmitEvent)=> {
      e.preventDefault()
      set_submitting_pass(true)
      try {
         const data = await custom_fetch('forgot/change_password', {
            method: 'PUT',
            body: JSON.stringify({ new_password })
         })
         toast.success(data.message)
         set_new_password('')
         set_show_forgot_form('')
      } catch(err: any) {
         toast.error(err.message)
         console.log('Error sending code: ', err)
      } finally { (set_submitting_pass(false)) }
   }

   return (
      <main className=" bg-(--page-bg) min-h-screen flex flex-col lg:flex-row items-center lg:p-4 gap-4 relative">
         {/* Info */}
         <section className='lg:w-2/3 h-full border border-(--border) flex flex-col gap-6 bg-(--surface-1) lg:rounded-2xl p-4 ' >
            <div className='flex text-4xl font-bold mb-2 ' >
               <h1 className='text-xl' >$ubTrack</h1>
               <FontAwesomeIcon icon={faMagnifyingGlassChart} className=' text-(--text-primary) text-xl' />
            </div>
            <h1 className='text-2xl font-semibold ' >Never lose track of what you're paying for</h1>
            <h2 className='text-sm' >SubTrack keeps every subscription in one place. See what's due, watch your spending against a budget, and get notified before a renewal catches you off guard.</h2>
            <div className='flex gap-4' >
               <FontAwesomeIcon icon={faListCheck} className='text-xl text-green-500 bg-(--border) p-1 rounded-lg ' />
               <div className='text-sm' >
                  <h1>List every subscription</h1>
                  <h2>All your recurring payments in one organized view.</h2>
               </div>
            </div>
            <div className='flex gap-4 text-sm' >
               <FontAwesomeIcon icon={faWallet} className='text-xl text-amber-700 bg-(--border) p-1 rounded-lg ' />
               <div className='text-sm' >
                  <h1>Track your budget</h1>
                  <h2>Set monthly limits per category and watch them in real time.</h2>
               </div>
            </div>
            <div className='flex gap-4' >
               <FontAwesomeIcon icon={faTriangleExclamation} className='text-xl text-(--fill-warning) bg-(--border) p-1 rounded-lg ' />
               <div className='text-sm' >
                  <h1>Catch overspending early</h1>
                  <h2>Know the moment expenses go over budget, not after.</h2>
               </div>
            </div>
            <div className='flex gap-4' >
               <FontAwesomeIcon icon={faBell} className='text-xl text-(--fill-accent) bg-(--border) p-1 rounded-lg ' />
               <div className='text-sm' >
                  <h1>Get renewal reminders</h1>
                  <h2>Never get surprised by a charge you forgot about.</h2>
               </div>
            </div>
            <div className='flex gap-4 ' >
               <FontAwesomeIcon icon={faCircleInfo} className=' text-orange-500 ' />
               <p className='text-xs text-(--fill-warning) ' >SubTrack helps you monitor subscriptions and spending, it doesn't manage or cancel them for you. To cancel a subscription, you'll still need to do it directly through that service.</p>
            </div>
         </section>

         {/* Login card */}
         {show_form === 'login' && (
            <section className="lg:w-1/3 w-full h-full bg-(--surface-1) lg:rounded-2xl border border-(--border) p-8">
               <div className="text-center mb-8">
                  <h1 className="text-xl font-bold tracking-tight ">Welcome back</h1>
                  <h2 className="text-xs mt-2" >Please enter your details to sign in.</h2>
               </div>
               <form onSubmit={login} className="flex flex-col gap-5">
                  {/* Email Input */}
                  <div>
                     <label htmlFor="email" className="block text-xs font-medium text-(--text-muted) mb-1.5" >Email</label>
                     <input type="email" id="email" value={email} onChange={(e) => set_email(e.target.value)} placeholder="name@example.com" required autoFocus  className="w-full px-4 py-2.5 rounded-lg text-xs" />
                  </div>
                  {/* Password Input */}
                  <div className='relative' >
                     <label htmlFor="password" className="block text-xs font-medium text-(--text-muted) mb-1.5" >Password</label>
                     <input type={show_password ? 'text' : 'password'} id="password" value={password} onChange={(e) => set_password(e.target.value)} placeholder="••••••••" required  className="w-full px-4 py-2.5 rounded-lg text-xs" />
                     {show_password ? (
                        <FontAwesomeIcon icon={faEye} onClick={()=> set_show_password(false)}  className='text-(--text-muted) text-xs absolute right-2 top-[55%] cursor-pointer hover:text-(--text-secondary) ' />
                     ) : (
                        <FontAwesomeIcon icon={faEyeSlash} onClick={()=> set_show_password(true)}  className='text-(--text-muted) text-xs absolute right-2 top-[55%] cursor-pointer hover:text-(--text-secondary) ' />
                     )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                     <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={remember_me} onChange={(e) => set_remember_me(e.target.checked)}  className="w-4 h-4 rounded cursor-pointer transition-colors" />
                        <span className="text-(--text-muted) group-hover:text-blue-500 transition-colors text-xs md:text-[1rem] " >Remember me</span>
                     </label>
                     <p onClick={(e: any)=> forgot_send_code(e)}  className=" text-xs md:text-sm font-semibold text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer transition-colors">{sending_forgot_code ? 'Sending Code...' : 'Forgot Password?'}</p>
                  </div>
                  <button type="submit"  className="w-full mt-2 bg-blue-700 text-(--text-primary) font-semibold py-2.5 rounded-lg hover:bg-blue-500 active:bg-slate-950 transition-all duration-200 text-xs" >{loading ? 'Signing in...' : 'Sign in'}</button>
               </form>
               <p className="text-center text-xs text-(--text-muted) mt-8 flex justify-center flex-nowrap" >Don't have an account?<span onClick={()=> {set_show_form('register'); clear_reg_input()}}  className="font-semibold text-blue-700 hover:text-blue-500 transition-colors ml-1 cursor-pointer" >Register here</span></p>
            </section>
         )}
         
         {/* Register card */}
         {show_form === 'register' && (
            <section className="lg:w-1/3 w-full h-full bg-(--surface-1) lg:rounded-2xl border border-(--border) p-8" >
               <div className="text-center mb-8">
                  <h1 className="text-xl font-bold tracking-tight" >Create an account</h1>
                  <h2  className="text-xs">Please enter your details to sign up.</h2>
               </div>
               <form onSubmit={register_send_code} className="flex flex-col gap-5">
                  {/* Name Input */}
                  <div>
                     <label htmlFor="name" className="block text-xs font-medium text-(--text-muted) mb-1.5">Name</label>
                     <input type="text" id="name" value={reg_name} onChange={(e) => set_reg_name(e.target.value)} placeholder="John Doe" required autoFocus  className="w-full px-4 py-2.5 rounded-lg text-xs" />
                  </div>
                  {/* Email Input */}
                  <div>
                     <label htmlFor="email" className="block text-xs font-medium text-(--text-muted) mb-1.5">Email</label>
                     <input type="email" id="email" value={reg_email} onChange={(e) => set_reg_email(e.target.value)} placeholder="name@example.com" required  className="w-full px-4 py-2.5 rounded-lg text-xs" />
                  </div>
                  {/* Password Input */}
                  <div>
                     <label htmlFor="password" className="block text-xs font-medium text-(--text-muted) mb-1.5">Password</label>
                     <input type="password" id="password" value={reg_password} onChange={(e) => set_reg_password(e.target.value)} placeholder="••••••••" required  className="w-full px-4 py-2.5 rounded-lg text-xs" />
                  </div>
                  {/* Repeat Password Input */}
                  <div>
                     <label htmlFor="confirmPassword" className="block text-xs font-medium text-(--text-muted) mb-1.5">Confirm Password</label>
                     <input type="password" id="confirmPassword" value={confirm_password} onChange={(e) => set_confirm_password(e.target.value)} placeholder="••••••••" required  className="w-full px-4 py-2.5 rounded-lg text-xs" />
                     <p className='text-(--fill-danger)' >{reg_error}</p>
                  </div>
                  <button type="submit"  className="w-full mt-2 bg-blue-700 text-(--text-primary) font-semibold py-2.5 rounded-lg hover:bg-blue-500 active:bg-blue-700  transition-all duration-200 text-xs" >{sending_code ? 'Sending code...' : 'Sign up'}</button>
               </form>
               <p className="text-center text-xs md:text-sm text-(--text-muted) mt-2 flex justify-center flex-nowrap">Already have an account?<span onClick={()=> {set_show_form('login')}}  className="font-semibold text-blue-700 hover:text-blue-500 transition-colors ml-1 cursor-pointer text-xs" >Sign in here</span></p>
            </section>
         )}

         {/* Input code register form */}
         {show_code_form && (
            <section onClick={()=> set_show_code_form(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onSubmit={register_verify_code} onClick={(e)=> e.stopPropagation()}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col items-center" >
                  <h1 className='text-xl font-semibold' >Register Account</h1><br />
                  <h1 className='text-sm' >Input 6 digit verification code sent to your email</h1>
                  <input type="text" maxLength={6} name='code' value={code} onChange={(e) => set_code(e.target.value)} required  className="px-4 py-2.5 rounded-lg text-center tracking wider text-sm " />
                  <p className='text-(--text-primary) text-xs ' >Didn't receive the code? <span onClick={(e: any)=> register_send_code(e)}  className='text-(--fill-accent) active:text-(--fill-accent) cursor-pointer hover:text-blue-400  ' >{sending_code ? 'Resending...' : 'Resend'}</span></p>
                  <button type="submit"  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors text-sm" >{verifying ? 'Verifying...' : 'Verify'}</button>
               </form>
            </section>
         )}

         {/* Input code forgot password form */}
         {show_forgot_form === 'verify' && (
            <section onClick={()=> set_show_forgot_form('')}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onSubmit={forgot_verify_code} onClick={(e)=> e.stopPropagation()}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col items-center" >
                  <h1 className='text-xl font-semibold' >Recover Account</h1><br />
                  <h1 className='text-center text-sm' >Input 6 digit verification code sent to <br /> {email_to_change_pass}</h1>
                  <input type="text" maxLength={6} value={forgot_code} onChange={(e) => set_forgot_code(e.target.value)} required  className="px-4 py-2.5 rounded-lg text-center tracking wider tracking-widest text-sm " />
                  <p className='text-(--text-primary) text-xs ' >Didn't receive the code? <span onClick={(e: any)=> forgot_send_code(e)}  className='text-(--fill-accent) active:text-(--fill-accent) cursor-pointer hover:text-blue-400  ' >{sending_forgot_code ? 'Resending...' : 'Resend'}</span></p>
                  <button type="submit"  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors text-sm" >{forogt_code_verifying ? 'Verifying...' : 'Verify'}</button>
               </form>
            </section>
         )}

         {/* Input change password form after verification */}
         {show_forgot_form === 'change_pass' && (
            <section onClick={()=> set_show_forgot_form('')}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onSubmit={change_pass} onClick={(e)=> e.stopPropagation()}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col items-center" >
                  <h1 className='text-sm' >Enter new password for this account.</h1>
                  <input type="text" value={new_password} onChange={(e) => set_new_password(e.target.value)} required  className="px-4 py-2.5 rounded-lg text-center tracking wider text-sm" />
                  <button type="submit"  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors text-sm" >{submitting_pass ? 'Saving...' : 'Save'}</button>
               </form>
            </section>
         )}
      </main>
   );
} 