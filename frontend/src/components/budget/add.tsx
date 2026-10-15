import { useState } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function BudgetAdd(props:any) {
   const [adding, set_adding] = useState<boolean>(false)

   // Add budget
   const [budget_amount, set_budget_amount] = useState<number>()
   const add_budget = async (e: any)=> {
      set_adding(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('budget/add', {
            method: 'POST',
            body: JSON.stringify({ budget_amount, category_id: props.category_id, input_month_index: props.input_month_index, input_year: props.input_year, toggle: props.toggle })
         })
         props.set_refresh((prev:boolean)=> !prev)
         props.close()
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error('Adding budget failed. ', err)
      } finally { set_adding(false) }
   }

   return (
      <main onClick={()=> props.close()}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
         <form onSubmit={(e)=> add_budget(e)} onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
            <input type="number" autoFocus value={budget_amount} onChange={(e) => {let val = Number(e.target.value); if(val > 99999999) val = 99999999; set_budget_amount(val)}}  placeholder="Amount" required  className="px-4 py-2.5 rounded-lg w-full text-sm" />
            <button type="submit" disabled={adding}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors text-sm" >{adding ? 'Adding Budget...' : 'Add Budget'}</button>
         </form>
      </main>
   )
}