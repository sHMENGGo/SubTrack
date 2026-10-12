import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { custom_fetch } from '../../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router'

export default function LoginForm(props: any) {
   const navigate = useNavigate()

   const [email, set_email] = useState('')
   const [password, set_password] = useState('')
   const [remember_me, set_remember_me] = useState(false)
   const [show_password, set_show_password] = useState(false)
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

   return (
      <main>
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
               <p onClick={()=> props.set_show_form('forgot')}  className=" text-xs md:text-sm font-semibold text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer transition-colors">Forgot Password?</p>
            </div>
            <button type="submit"  className="w-full mt-2 bg-(--fill-accent) text-(--text-primary) font-semibold py-2.5 rounded-lg hover:bg-blue-500 active:bg-(--fill-accent) transition-all duration-200 text-xs" >{loading ? 'Signing in...' : 'Sign in'}</button>
         </form>
         <p className="text-center text-xs text-(--text-muted) mt-8 flex justify-center flex-nowrap" >Don't have an account?<span onClick={()=> {props.set_show_form('register'); props.clear_reg_input()}}  className="font-semibold text-blue-700 hover:text-blue-500 transition-colors ml-1 cursor-pointer" >Register here</span></p>
      </main>
   )
}