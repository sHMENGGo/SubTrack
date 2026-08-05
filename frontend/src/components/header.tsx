
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons"
import { replace, useNavigate } from "react-router"
import { custom_fetch } from "../services/api"
import { useState } from "react"
import toast from "react-hot-toast"




export default function Header() {
   // Logout
   const navigate = useNavigate()
   const [loading, set_loading] = useState(false)

   const logout = async (e: React.FormEvent)=> {
      e.preventDefault()
      set_loading(true)
      try {
         const data = await custom_fetch('logout')
         navigate('/login')
         toast.success(data.message)
      } catch(err) {console.log('Error logout: ', err)}
      finally {set_loading(false)}
   }

   const [show_logout, set_show_logout] = useState(false)
   
   return (
      <main className="bg-(--surface-2) px-8 py-2 rounded-lg w-full flex justify-between" >
         <p className="font-semibold text-2xl text-(--text-primary)" >SubTrack</p>
         <section className="gap-5 text-lg font-semibold flex items-center" >
            <button onClick={()=> navigate('/dashboard', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Dashboard</button>
            <button onClick={()=> navigate('/subscription', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Subscription</button>
            <button onClick={()=> navigate('/category', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Category</button>
            <button onClick={()=> navigate('/budget', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Budget</button>
            <button onClick={()=> navigate('/history', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >History</button>
            <FontAwesomeIcon icon={faRightFromBracket} onClick={()=> set_show_logout(true)}  className="text-(--text-primary) text-2xl cursor-pointer" />
         </section>

         {show_logout && (
            <div onClick={()=> set_show_logout(false)}  className="absolute top-0 left-0 w-full h-screen bg-gray-950/80 z-50 flex justify-center items-center" >
               <div onClick={(e)=> e.stopPropagation()}  className="bg-(--surface-1) p-8 rounded-lg flex flex-col gap-4" >
                  <h1 className="text-2xl font-semibold" >Are you sure you want to logout?</h1>
                  <section className="flex gap-4 justify-center" >
                     <h1 onClick={()=> set_show_logout(false)}  className="bg-(--surface-2) px-4 py-2 rounded-lg hover:bg-(--border) transition-all duration-200 cursor-pointer" >Cancel</h1>
                     <h1 onClick={logout}  className="bg-red-700 px-4 py-2 rounded-lg text-(--text-primary) hover:bg-red-500 transition-all duration-200 cursor-pointer" >{loading ? 'Logging out...' : 'Logout'}</h1>
                  </section>
               </div>
            </div>
         )}
      </main>
   )
}