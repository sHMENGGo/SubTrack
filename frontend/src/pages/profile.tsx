import React, { useState } from "react"
import { useEffect } from "react"
import { custom_fetch } from "../services/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import toast from "react-hot-toast"
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons"

export default function Profile() {

   const [edit_mode, set_edit_mode] = useState('')

   // Get profile
   const [name, set_name] = useState('')
   const [email, set_email] = useState('')
   const [password, set_password] = useState('')
   useEffect(()=> {
      const get_profile = async () => {
         try {
            const data = await custom_fetch('profile')
            set_name(data.name)
            set_new_name(data.name)
            set_email(data.email)
            set_password(data.password)
         } catch (error: any) {
            console.error('Error fetching profile:', error)
            toast.error(error.message)
         } finally { set_loading(false) }
      }
      get_profile()
   }, [])

   // Edit name
   const [new_name, set_new_name] = useState('')
   const [loading, set_loading] = useState(true)
   useEffect(()=> { if(edit_mode === 'name') set_new_name(name) }, [edit_mode, name])
   const save_name = async (e: React.FormEvent) => {
      e.preventDefault()
      set_loading(true)
      try {
         await custom_fetch('edit/profile/name', {
            method: 'POST',
            body: JSON.stringify({ name: new_name })
         })
         set_name(new_name)
         toast.success('Name updated successfully.')
         set_edit_mode('')
      } catch (error: any) {
         console.error('Error updating name:', error)
         toast.error(error.message)
      } finally { set_loading(false) }
   }

   // Edit password and send code
   const [new_password, set_new_password] = useState('')
   const code_enabled = edit_mode === 'email' || edit_mode === 'password'
   const [confirm_password, set_confirm_password] = useState('')
   const [password_sending_code, set_password_sending_code] = useState(false)
   const edit_password_send_code = async (e: React.SubmitEvent)=> {
      set_password_sending_code(true)
      try {
         const data = await custom_fetch('edit/password/send_code', {
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
   const [password_verifying_code, set_password_verifying_code] = useState(false)
   const edit_passwordverify_code = async (e: React.SubmitEvent) => {
      try {
         const data = await custom_fetch('edit/password/verify_code', {
            method: 'PUT',
            body: JSON.stringify({ email, code })
         })
         toast.success(data.message)
      } catch (error: any) {
         console.error('Error verifying code:', error)
         toast.error(error.message)
      } finally { set_password_verifying_code(false) }
   }


   return (
      <main className="w-full bg-(--surface-1) rounded-md gap-4 grid grid-cols-1 md:grid-cols-2 grid-rows-5 md:grid-rows-3 grid-flow-col  p-4 border border-(--border-primary) h-full">
         {/* Name */}
         <form onSubmit={save_name} className="flex flex-col gap-1">
            <label htmlFor="name" className="block text-(--text-primary) " >Name</label>
            <div className="relative flex gap-4 items-center" >
               <input type="text" value={edit_mode === 'name' ? new_name : ''} onChange={(e)=> set_new_name(e.target.value)} placeholder={name} disabled={edit_mode !== 'name'} className={` ${edit_mode === 'name' ? 'opacity-100' : 'opacity-50'} bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
               {edit_mode === 'name' ? (
                  <>
                  <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 active:bg-green-700">{loading ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => set_edit_mode('')} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 active:bg-gray-700">Cancel</button>
                  </>
               ) : (
                  <FontAwesomeIcon icon={faPenToSquare} onClick={() => set_edit_mode('name')} className=" text-xl text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer" />
               )}
            </div>
         </form>

         {/* Password */}
         <form onSubmit={edit_password_send_code} className="flex flex-col gap-1">
            <label htmlFor="password" className="text-(--text-primary) " >Password</label>
            <div className="relative flex gap-4 items-center" >
               <input type="password" value={new_password} placeholder="••••••••" onChange={(e)=> set_new_password(e.target.value)} disabled={edit_mode !== 'password'} className={` ${edit_mode === 'password' ? 'opacity-100' : 'opacity-50'} bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
               {edit_mode === 'password' ? (
                  <>
                  <button type="submit" className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 active:bg-green-700 text-nowrap">{password_sending_code ? 'Sending code...' : 'Send code'}</button>
                  <button onClick={() => set_edit_mode('')} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 active:bg-gray-700">Cancel</button>
                  </>
               ) : (
                  <FontAwesomeIcon icon={faPenToSquare} onClick={() => set_edit_mode('password')} className=" text-xl text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer" />
               )}
            </div>
         </form>

         {/* Confirm Password */}
         <section className="flex flex-col gap-1">
            <label htmlFor="confirm_password" className="text-(--text-primary) " >Confirm Password</label>
            <div className="relative flex gap-4 items-center" >
               <input type="password" value={confirm_password} placeholder="••••••••" onChange={(e) => set_confirm_password(e.target.value)} disabled={edit_mode !== 'password'} className={` ${edit_mode === 'password' ? 'opacity-100' : 'opacity-50'} bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
            </div>
         </section>
         

         {/* Email */}
         <form className="flex flex-col gap-1">
            <label htmlFor="email" className=" text-(--text-primary) " >Email</label>
            <div className="relative flex gap-4 items-center" >
               <input type="email" value={email} disabled={edit_mode !== 'email'} className={` ${edit_mode === 'email' ? 'opacity-100' : 'opacity-50'} bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
               {edit_mode === 'email' ? (
                  <>
                  <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md text-nowrap hover:bg-green-600 active:bg-green-700">{loading ? 'Sending code...' : 'Send code'}</button>
                  <button onClick={() => set_edit_mode('')} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 active:bg-gray-700">Cancel</button>
                  </>
               ) : (
                  <FontAwesomeIcon icon={faPenToSquare} onClick={() => set_edit_mode('email')} className=" text-xl text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer" />
               )}
            </div>

            
         </form>

         {/* Input code */}
         <section className="flex flex-col gap-1">
            <label htmlFor="code" className="text-(--text-primary) " >6 digit code</label>
            <div className="relative flex gap-5 items-center" >
               <input type="text" placeholder="******" inputMode='numeric' pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} required onChange={(e) => set_code(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} disabled={!code_enabled} className={` ${code_enabled ? 'opacity-100' : 'opacity-50'} tracking-[0.5rem] bg-(--surface-2) w-full p-2 rounded-md border border-(--border-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--fill-primary) focus:border-transparent`} />
               <button type="submit" disabled={password_verifying_code} className="px-4 py-2 bg-green-500 text-white rounded-md text-nowrap hover:bg-green-600 active:bg-green-700">{password_verifying_code ? 'Verifying code...' : 'Submit'}</button>
            </div>
         </section>
      </main>
   )
}