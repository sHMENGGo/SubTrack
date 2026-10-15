import { useState } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function BudgetEdit(props:any) {
   const bud = props.budget
   console.log(bud)
   const [editing, set_editing] = useState<boolean>(false)

   // Edit budget
   const [new_budget_amount, set_new_budget_amount] = useState<number>(bud.budget)
   const edit_budget = async (e: any)=> {
      set_editing(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('budget/edit', {
            method: 'PUT',
            body: JSON.stringify({ budget_id: bud.budget_id, new_budget_amount, input_month_index: props.input_month_index, input_year: props.input_year })
         })
         props.set_refresh((prev:boolean)=> !prev)
         props.close()
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error('Editing budget failed. ', err)
      } finally { set_editing(false) }
   }

   return (
      <main onClick={()=> props.close()}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
         <form onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
            <input type="number" autoFocus value={new_budget_amount} onChange={(e) => {let val = Number(e.target.value); if(val > 99999999) val = 99999999 ;set_new_budget_amount(val)}}  placeholder="Amount" required  className="px-4 py-2.5 rounded-lg w-full text-sm" />
            <button onClick={(e)=> edit_budget(e)} disabled={editing}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors text-sm" >{editing ? 'Saving Changes...' : 'Save Changes'}</button>
         </form>
      </main>
   )
}