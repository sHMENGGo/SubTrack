import { useState } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function BudgetDelete(props:any) {
   const bud = props.budget
   const [deleting, set_deleting] = useState<boolean>(false)

   // Delete budget
   const delete_budget = async (e: any)=> {
      set_deleting(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('budget/delete', {
            method: 'DELETE',
            body: JSON.stringify({ budget_to_delete: bud.budget_id, toggle: props.toggle, input_month_index: props.input_month_index, input_year: props.input_year })
         })
         props.set_refresh((prev:boolean)=> !prev)
         props.close()
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error('Deleting budget failed. ', err)
      } finally { set_deleting(false) }
   }

   return (
      <main onClick={()=> props.close()}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
         <div onClick={(e)=> {e.stopPropagation(); e.preventDefault()}}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
            <h1 className="text-sm font-bold text-center" >Are you sure you want to delete {bud.name} budget for this month?</h1>
            <div className="flex gap-4 mt-4 justify-center transition-colors text-sm" >
               <button onClick={(e)=> delete_budget(e)} disabled={deleting}  className="px-4 py-2.5 outline-none rounded-lg active:bg-red-700 bg-red-900 text-(--text-primary) hover:bg-red-800" >{deleting ? 'Deleting...' : 'Delete'}</button>
               <button onClick={()=> props.close()}  className="px-4 py-2.5 outline-none active:bg-blue-700 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 " >Cancel</button>
            </div>
         </div>
      </main>
   )
}