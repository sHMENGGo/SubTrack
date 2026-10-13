import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { custom_fetch } from '../../services/api';
import { toast } from 'react-hot-toast';

export default function RecoverAccountForm(props: any) {
   const [email, set_email] = useState('');
   const [code, set_code] = useState('');
   const [password, set_password] = useState('');
   const [confirm_password, set_confirm_password] = useState('');
   const [show_password, set_show_password] = useState(false);
   const [show_confirm_password, set_show_confirm_password] = useState(false);
   const [sending_recover_code, set_sending_recover_code] = useState(false)

   // Recover password send code
   const send_code = async (e: React.SubmitEvent)=> {
      e.preventDefault()
      set_sending_recover_code(true)
      try {
         const data = await custom_fetch('recover/send_code', {
            method: 'POST',
            body: JSON.stringify({ email })
         })
         toast.success(data.message)
      } catch(err: any) {
         toast.error(err.message)
         console.log('Error sending code: ', err)
      }
      finally { (set_sending_recover_code(false)) }
   }

   // Recover verify code and reset password
   const [verifying, set_verifying] = useState(false)
   const verify_code = async (e: React.FormEvent)=> {
      e.preventDefault()
      if (password !== confirm_password) {toast.error("Password doesn't match."); return}
      set_verifying(true)
      try {
         const data = await custom_fetch('recover/verify_code', {
            method: 'POST',
            body: JSON.stringify({ email, code, password })
         })
         toast.success(data.message)
         props.set_show_form('login')
      }
      catch(err: any) {
         toast.error(err.message)
         console.log('Error verifying code: ', err)
      }
      finally { set_verifying(false) }
   }

   return (
      <main>
         <div className="text-center mb-8">
            <h1 className="text-xl font-bold tracking-tight ">Recover Account</h1>
            <h2 className="text-sm mt-2" >Please enter your details to verify your identity.</h2>
         </div>

         <form onSubmit={verify_code} className="flex flex-col gap-5">
            {/* Email Input */}
            <div>
               <label htmlFor="email" className="block text-sm font-medium text-(--text-muted) mb-1.5" >Email</label>
               <div className="flex justify-between items-center gap-2" >
                  <input type="email" id="email" value={email} onChange={(e) => set_email(e.target.value)} placeholder="name@example.com" required autoFocus  className="w-full px-4 py-2.5 rounded-lg text-sm" />
                  <button type='button' onClick={(e: any)=> send_code(e)} disabled={sending_recover_code} className=" text-sm md:text-sm font-semibold bg-(--fill-accent) rounded-lg text-nowrap p-2 text-(--text-primary) hover:bg-blue-500 active:bg-(--fill-accent) cursor-pointer transition-colors">{sending_recover_code ? 'Sending Code...' : 'Send Code'}</button>
               </div>
               <input type="text" id="code" value={code} inputMode='numeric' pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" onChange={(e) => set_code(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="******" required  className="w-full text-center tracking-[0.5rem] px-4 py-2.5 rounded-lg text-sm mt-2" />
            </div>

            {/* New password Input */}
            <div className='relative' >
               <label htmlFor="password" className="block text-sm font-medium text-(--text-muted) mb-1.5" >Password</label>
               <input type={show_password ? 'text' : 'password'} id="password" value={password} onChange={(e) => set_password(e.target.value)} placeholder="••••••••" required  className="w-full px-4 py-2.5 rounded-lg text-sm" />
               {show_password ? (
                  <FontAwesomeIcon icon={faEye} onClick={()=> set_show_password(false)}  className='text-(--text-muted) text-sm absolute right-2 top-[55%] cursor-pointer hover:text-(--text-secondary) ' />
               ) : (
                  <FontAwesomeIcon icon={faEyeSlash} onClick={()=> set_show_password(true)}  className='text-(--text-muted) text-sm absolute right-2 top-[55%] cursor-pointer hover:text-(--text-secondary) ' />
               )}
            </div>

            {/* Confirm new password input */}
            <div className='relative' >
               <label htmlFor="confirmPassword" className="block text-sm font-medium text-(--text-muted) mb-1.5" >Confirm Password</label>
               <input type={show_confirm_password ? 'text' : 'password'} id="confirmPassword" value={confirm_password} onChange={(e) => set_confirm_password(e.target.value)} placeholder="••••••••" required  className="w-full px-4 py-2.5 rounded-lg text-sm" />
               {show_confirm_password ? (
                  <FontAwesomeIcon icon={faEye} onClick={()=> set_show_confirm_password(false)}  className='text-(--text-muted) text-sm absolute right-2 top-[55%] cursor-pointer hover:text-(--text-secondary) ' />
               ) : (
                  <FontAwesomeIcon icon={faEyeSlash} onClick={()=> set_show_confirm_password(true)}  className='text-(--text-muted) text-sm absolute right-2 top-[55%] cursor-pointer hover:text-(--text-secondary) ' />
               )}
            </div>

            <button type="submit"  className="w-full mt-2 bg-(--fill-accent) text-(--text-primary) font-semibold py-2.5 rounded-lg hover:bg-blue-500 active:bg-(--fill-accent) transition-all duration-200 text-sm" >{verifying ? 'Verifying...' : 'Reset Password'}</button>
         </form>

         <p className="text-center text-sm text-(--text-muted) mt-8 flex justify-center flex-nowrap" >Don't have an account?<span onClick={()=> {props.set_show_form('register'); props.clear_reg_input(); props.clear_recover_input()}}  className="font-semibold text-blue-700 hover:text-blue-500 transition-colors ml-1 cursor-pointer" >Register here</span></p>
      </main>
   )
}