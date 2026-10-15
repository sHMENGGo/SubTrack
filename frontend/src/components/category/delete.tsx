import { useState } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function CategoryDelete(props:any) {
   const cat = props.category
   const [deleting, set_deleting] = useState<boolean>(false)

   // Delete category
   const delete_category = async (e: any)=> {
      set_deleting(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('delete/category', {
            method: 'DELETE',
            body: JSON.stringify({ category_id: cat.id })
         })
         props.set_refresh((prev:boolean)=> !prev)
         props.close()
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error('Adding new category failed. ', err)
      } finally { set_deleting(false) }
   }

   return (
      <main onClick={()=> props.close()}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
         <div onClick={(e)=> {e.stopPropagation(); e.preventDefault()}}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
            <h1 className="text-xl font-bold text-center" >Are you sure you want to delete {cat.name} category?</h1>
            <div className="flex gap-4 mt-4 justify-center" >
               <button onClick={(e)=> delete_category(e)} disabled={deleting}  className="px-4 py-2.5 outline-none active:bg-red-700 rounded-lg bg-red-900 text-(--text-primary) hover:bg-red-800 transition-colors" >{deleting ? 'Deleting...' : 'Delete'}</button>
               <button onClick={()=> props.close()}  className="px-4 py-2.5 outline-none active:bg-blue-700 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Cancel</button>
            </div>
         </div>
      </main>
   )
}