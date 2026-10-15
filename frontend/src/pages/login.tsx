import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlassChart, faListCheck, faCircleInfo, faWallet, faTriangleExclamation, faBell } from '@fortawesome/free-solid-svg-icons';
import LoginForm from '../components/auth/login_form';
import RegisterForm from '../components/auth/register_form';
import RecoverAccountForm from '../components/auth/recover_account_form';

export default function Login() {
   const [show_form, set_show_form] = useState('login')

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
               <p className='text-sm text-(--fill-warning) ' >SubTrack helps you monitor subscriptions and spending, it doesn't manage or cancel them for you. To cancel a subscription, you'll still need to do it directly through that service.</p>
            </div>
         </section>

         {/* Login card */}
         {show_form === 'login' && (
            <section className="lg:w-1/3 w-full h-full bg-(--surface-1) lg:rounded-2xl border border-(--border) p-8">
               <LoginForm
                  set_show_form={set_show_form}
               />
            </section>
         )}
         
         {/* Register card */}
         {show_form === 'register' && (
            <section className="lg:w-1/3 w-full h-full bg-(--surface-1) lg:rounded-2xl border border-(--border) p-8" >
               <RegisterForm 
                  set_show_form={set_show_form}
               />
            </section>
         )}

         {/* Forgot password card */}
         {show_form === 'forgot' && (
            <section className="lg:w-1/3 w-full h-full bg-(--surface-1) lg:rounded-2xl border border-(--border) p-8" >
               <RecoverAccountForm
                  set_show_form={set_show_form}
               />
            </section>
         )}
      </main>
   );
} 