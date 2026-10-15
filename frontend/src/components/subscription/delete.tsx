import { useState } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function SubscriptionDelete(props:any) {
   const [deleting, set_deleting] = useState(false)
   const sub = props.subscription

   // Delete subscription
   const delete_sub = async (e: any) => {
      set_deleting(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('subscription/delete', {
            method: 'DELETE',
            body: JSON.stringify({ subscription_id: sub.id }),
         })
         props.set_refresh((prev:any) => !prev)
         toast.success(data.message)
         props.close()
      } catch (err: any) {
         toast.error(err.message)
         console.error("Error deleting subscription:", err)
      } finally { set_deleting(false) }
   }

   return (
      <section onClick={()=> props.close()}  className=" top-0 left-0 w-full h-full fixed bg-black/50 flex justify-center items-center" >
         <div onClick={(e)=> {e.stopPropagation(); e.preventDefault()}}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
            <h1 className="text-sm font-bold text-center" >Are you sure you want to delete {sub.name} subscription?</h1>
            <div className="flex gap-4 mt-4 justify-center text-sm transition-colors" >
               <button onClick={(e)=> delete_sub(e)} disabled={deleting}  className="px-4 py-2.5 outline-none active:bg-red-700 rounded-lg bg-red-900 text-(--text-primary) hover:bg-red-800" >{deleting ? 'Deleting...' : 'Delete'}</button>
               <button onClick={()=> props.close()}  className="px-4 py-2.5 outline-none active:bg-blue-700 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800" >Cancel</button>
            </div>
         </div>
      </section>
   )
}