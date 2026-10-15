import { useState } from "react"
import BudgetGet from "../components/budget/get"
import BudgetEdit from "../components/budget/edit"
import BudgetAdd from "../components/budget/add"
import BudgetDelete from "../components/budget/delete"

export default function Budget() {
   const [refresh, set_refresh] = useState(false)

   const [show_add_budget, set_show_add_budget] = useState(false)
   const [category_id, set_category_id] = useState<number>()
   const [bud_to_edit, set_bud_to_edit] = useState<any | null>(null)
   const [bud_to_delete, set_bud_to_delete] = useState<any | null>(null)

   const date = new Date()

   // Month navigation
   const [toggle, set_toggle] = useState('PHP')
   const [input_month_index, set_input_month_index] = useState(date.getMonth())
   const [input_year, set_input_year] = useState(date.getFullYear())
	const month_name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
   
   // Next month
   const next_month = ()=> {
      if(input_month_index === 11) {
         set_input_month_index(0)
         set_input_year(prev => prev + 1)
         set_refresh((prev:boolean)=> !prev) 
      } else { 
         set_input_month_index(prev => prev + 1)
         set_refresh((prev:boolean)=> !prev) 
      }
   }

   // Previous month
   const prev_month = ()=> {
      if(input_month_index === 0) {
         set_input_month_index(11)
         set_input_year(prev => prev - 1)
         set_refresh((prev:boolean)=> !prev)
      } else { 
         set_input_month_index(prev => prev - 1)
         set_refresh((prev:boolean)=> !prev) 
      }
   }

   return (
      <main className="flex flex-col gap-4 w-full h-full justify-center py-4 " >
         {/* Category budgets */}
         <BudgetGet 
            set_refresh={set_refresh}
            refresh={refresh}
            set_bud_to_edit={set_bud_to_edit}
            set_bud_to_delete={set_bud_to_delete}
            open={()=> set_show_add_budget(true)}
            toggle={toggle}
            month_name={month_name}
            input_month_index={input_month_index}
            input_year={input_year}
            set_toggle={set_toggle}
            next_month={next_month}
            prev_month={prev_month}
            set_category_id={set_category_id}
         />

         {/* Add budget */}
         {show_add_budget && (
            <BudgetAdd
               set_refresh={set_refresh}
               category_id={category_id}
               input_month_index={input_month_index}
               input_year={input_year}
               toggle={toggle}
               close={()=> set_show_add_budget(false)}
            />
         )}

         {/* Edit budget */}
         {bud_to_edit && (
            <BudgetEdit
               set_refresh={set_refresh}
               budget={bud_to_edit}
               close={()=> set_bud_to_edit(null)}
               input_month_index={input_month_index}
               input_year={input_year}
            />
         )}

         {/* Delete budget form */}
         {bud_to_delete && (
            <BudgetDelete
               set_refresh={set_refresh}
               budget={bud_to_delete}
               close={()=> set_bud_to_delete(null)}
               input_month_index={input_month_index}
               input_year={input_year}
               toggle={toggle}
            />
         )}
      </main>
   )
}