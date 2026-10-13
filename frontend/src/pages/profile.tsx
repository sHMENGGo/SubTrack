import React, { useState } from "react"
import { useEffect } from "react"
import { custom_fetch } from "../services/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import toast from "react-hot-toast"
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons"

export default function Profile() {

   const [edit_mode, set_edit_mode] = useState('')
   const code_enabled = edit_mode === 'email' || edit_mode === 'password'

   // Get profile
   const [name, set_name] = useState('')
   const [email, set_email] = useState('')
   useEffect(()=> {
      const get_profile = async () => {
         try {
            const data = await custom_fetch('profile')
            set_name(data.name)
            set_email(data.email)
         } catch (error: any) {
            console.error('Error fetching profile:', error)
            toast.error(error.message)
         }
      }
      get_profile()
   }, [])

   // Edit name
   const [new_name, set_new_name] = useState('')
   const [saving_name, set_saving_name] = useState(false)
   useEffect(()=> { if(edit_mode === 'name') set_new_name(name) }, [edit_mode, name])
   const save_name = async (e: React.SubmitEvent) => {
      e.preventDefault()
      set_saving_name(true)
      try {
         await custom_fetch('profile/edit/name', {
            method: 'PUT',
            body: JSON.stringify({ name: new_name })
         })
         set_name(new_name)
         toast.success('Name updated successfully.')
         set_edit_mode('')
      } catch (error: any) {
         console.error('Error updating name:', error)
         toast.error(error.message)
      } finally { set_saving_name(false) }
   }

   // Edit password, send code
   const [password_sending_code, set_password_sending_code] = useState(false)
   const edit_password_send_code = async (e: React.SubmitEvent)=> {
      e.preventDefault()
      set_password_sending_code(true)
      try {
         const data = await custom_fetch('profile/edit/password/send_code', {
            method: 'POST',
            body: JSON.stringify({ email })
         })
         toast.success(data.message)
         set_edit_mode('')
      } catch (error: any) {
         console.error('Error sending code:', error)
         toast.error(error.message)
      } finally { set_password_sending_code(false) }
   }

   // Verify code and save password
   const [code, set_code] = useState('')
   const [current_password, set_current_password] = useState('')
   const [new_password, set_new_password] = useState('')
   const [password_verifying_code, set_password_verifying_code] = useState(false)
   const edit_password_verify_code = async (e: React.SubmitEvent) => {
      e.preventDefault()
      try {
         const data = await custom_fetch('profile/edit/password/verify_code', {
            method: 'PUT',
            body: JSON.stringify({ email, code, current_password, new_password })
         })
         toast.success(data.message)
      } catch (error: any) {
         console.error('Error verifying code:', error)
         toast.error(error.message)
      } finally { set_password_verifying_code(false) }
   }

   const [email_sending_code, set_email_sending_code] = useState(false)


   return (
      <main className="w-full bg-(--surface-1) rounded-md gap-4 flex flex-col py-4 md:py-10 px-4 md:px-50 border border-(--border-primary) h-full">
         {/* Name */}
         <form onSubmit={save_name} className="flex flex-col gap-1">
            <label htmlFor="name" className="block text-(--text-primary) " >Name</label>
            <div className={` ${edit_mode === 'name' ? 'flex-col md:flex-row' : ''} flex gap-4 items-center`} >
               <input type="text" value={edit_mode === 'name' ? new_name : ''} onChange={(e)=> set_new_name(e.target.value)} placeholder={name} disabled={edit_mode !== 'name'} className={` ${edit_mode === 'name' ? 'opacity-100' : 'opacity-50'} bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
               {edit_mode === 'name' ? (
                  <div className="flex gap-4" >
                     <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 active:bg-green-700">{saving_name ? 'Saving...' : 'Save'}</button>
                     <button onClick={() => set_edit_mode('')} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 active:bg-gray-700">Cancel</button>
                  </div>
               ) : (
                  <FontAwesomeIcon icon={faPenToSquare} onClick={() => set_edit_mode('name')} className=" text-xl text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer" />
               )}
            </div>
         </form>

         {/* Password */}
         <form onSubmit={edit_password_send_code} className="flex flex-col gap-1">
            <label htmlFor="current_password" className="text-(--text-primary) " >Current Password</label>
            <div className={` ${edit_mode === 'password' ? 'flex-col md:flex-row' : ''} flex gap-4 items-center`} >
               <input type="password" value={current_password} placeholder="••••••••" onChange={(e)=> set_current_password(e.target.value)} disabled={edit_mode !== 'password'} className={` ${edit_mode === 'password' ? 'opacity-100' : 'opacity-50'} bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
               {edit_mode === 'password' ? (
                  <div className="flex gap-4" >
                     <button type="submit" className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 active:bg-green-700 text-nowrap">{password_sending_code ? 'Sending code...' : 'Send code'}</button>
                     <button onClick={() => set_edit_mode('')} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 active:bg-gray-700">Cancel</button>
                  </div>
               ) : (
                  <FontAwesomeIcon icon={faPenToSquare} onClick={() => set_edit_mode('password')} className=" text-xl text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer" />
               )}
            </div>
         </form>

         {/* New Password */}
         {edit_mode === 'password' && (
            <section className="flex flex-col gap-1">
               <label htmlFor="new_password" className="text-(--text-primary) " >New Password</label>
               <div className="relative flex gap-4 items-center" >
                  <input type="password" value={new_password} placeholder="••••••••" onChange={(e) => set_new_password(e.target.value)} disabled={edit_mode !== 'password'} className={` ${edit_mode === 'password' ? 'opacity-100' : 'opacity-50'} bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
               </div>
            </section>
         )}

         {/* Email */}
         <form className="flex flex-col gap-1">
            <label htmlFor="email" className=" text-(--text-primary) " >Email</label>
            <div className={` ${edit_mode === 'email' ? 'flex-col md:flex-row' : ''} flex gap-4 items-center`} >
               <input type="email" value={email} disabled={edit_mode !== 'email'} className={` ${edit_mode === 'email' ? 'opacity-100' : 'opacity-50'} bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
               {edit_mode === 'email' ? (
                  <div className="flex gap-4" >
                     <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md text-nowrap hover:bg-green-600 active:bg-green-700">{email_sending_code ? 'Sending code...' : 'Send code'}</button>
                     <button onClick={() => set_edit_mode('')} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 active:bg-gray-700">Cancel</button>
                  </div>
               ) : (
                  <FontAwesomeIcon icon={faPenToSquare} onClick={() => set_edit_mode('email')} className=" text-xl text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer" />
               )}
            </div>
         </form>
      
         {/* Input code */}
         {code_enabled && (
            <form onSubmit={edit_password_verify_code} className="flex flex-col w-full md:w-1/2 place-self-center gap-1">
               <label htmlFor="code" className="text-(--text-primary) text-sm " >Enter 6 digit code sent to your email</label>
               <div className="relative flex gap-5 items-center" >
                  <input type="text" placeholder="******" inputMode='numeric' pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} required onChange={(e) => set_code(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} disabled={!code_enabled} className={` ${code_enabled ? 'opacity-100' : 'opacity-50'} text-center tracking-[0.5rem] bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
                  <button type="submit" className={` px-4 py-2 bg-green-500 text-white rounded-md text-nowrap hover:bg-green-600 active:bg-green-700`}>{password_verifying_code ? 'Verifying code...' : 'Submit'}</button>
               </div>
            </form>
         )}
      </main>
   )
}