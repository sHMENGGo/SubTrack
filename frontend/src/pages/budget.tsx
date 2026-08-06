import { useState, useEffect } from "react"
import { custom_fetch } from "../services/api"
import Progress from "../components/progress"
import toast from "react-hot-toast"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"

export default function Budget() {
   const date = new Date()
   const [refresh, set_refresh] = useState(false)
   // Month navigation
   const [input_month_index, set_input_month_index] = useState(date.getMonth())
   const [input_year, set_input_year] = useState(date.getFullYear())
	const month_name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
   // Next month
   const next_month = ()=> {
      if(input_month_index === 11) {
         set_input_month_index(0)
         set_input_year(prev => prev + 1)
         set_refresh(!refresh) 
      } else { set_input_month_index(prev => prev + 1); set_refresh(!refresh) }
   }
   // Previous month
   const prev_month = ()=> {
      if(input_month_index === 0) {
         set_input_month_index(11)
         set_input_year(prev => prev - 1)
         set_refresh(!refresh)
      } else { set_input_month_index(prev => prev - 1); set_refresh(!refresh) }
   } 

   // Get budget details based on toggle and month selected
   const [toggle, set_toggle] = useState('PHP')
   const [budget_summary, set_budget_summary] = useState<any>([])
   useEffect(()=> {
      const get_budget = async ()=> {
         try {
            const data = await custom_fetch('budget_summary', {
               method: 'POST',
               body: JSON.stringify({ toggle, input_month_index, input_year })
            })
            set_budget_summary(data.budget_summary)
         } catch (error) {
            toast.error('Getting budget summary failed')
            console.error('Getting budget failed. ', error)
         }
      }
      get_budget()
   }, [toggle, refresh])

   // Get categories and their budgets
   const [categories_budgets, set_categories_budgets] = useState<any[]>([])
   useEffect(()=> {
      const get_categories_budgets = async ()=> {
         try {
            const data = await custom_fetch('category_budget', {
               method: 'POST',
               body: JSON.stringify({ toggle, input_month_index, input_year })
            })
            set_categories_budgets(data.categories_budgets)
         } catch (error) {
            toast.error('Getting categories budgets failed')
            console.error('Getting categories budgets failed. ', error)
         }
      }
      get_categories_budgets()
   }, [toggle, refresh])

   // Add budget
   const [show_add_budget, set_show_add_budget] = useState(false)
   const [budget_amount, set_budget_amount] = useState<number>()
   const [category_id, set_category_id] = useState<number>()
   const open_add_budget = (cat_bud: any)=> {
      set_category_id(cat_bud.id)
      set_show_add_budget(true)
   }
   const add_budget = async (e: any)=> {
      e.preventDefault()
      try {
         const data = await custom_fetch('add/budget', {
            method: 'POST',
            body: JSON.stringify({ budget_amount, category_id, input_month_index, input_year, toggle })
         })
         set_refresh(!refresh)
         set_show_add_budget(false)
         toast.success(data.message)
      } catch (error) {
         toast.error('Adding budget failed')
         console.error('Adding budget failed. ', error)
      }
   }

   // Edit budget
   const [show_edit_budget, set_show_edit_budget] = useState(false)
   const [new_budget_amount, set_new_budget_amount] = useState<number>()
   const [budget_id, set_budget_id] = useState<number>()
   const open_edit = (cat_bud: any)=> {
      set_new_budget_amount(cat_bud.budget)
      set_budget_id(cat_bud.budget_id)
      set_show_edit_budget(true)
   }
   const edit_budget = async (e: any)=> {
      e.preventDefault()
      try {
         const data = await custom_fetch('edit/budget', {
            method: 'PUT',
            body: JSON.stringify({ budget_id, new_budget_amount, input_month_index, input_year })
         })
         set_refresh(!refresh)
         set_show_edit_budget(false)
         toast.success(data.message)
      } catch (error) {
         toast.error('Editing budget failed')
         console.error('Editing budget failed. ', error)
      }
   }

   // Delete budget
   const [show_delete_budget, set_show_delete_budget] = useState(false)
   const [budget_to_delete, set_budget_to_delete] = useState()
   const [budget_to_delete_name, set_budget_to_delete_name] = useState('')
   const open_delete_confirmation = (cat_bud: any)=> {
      set_budget_to_delete(cat_bud.budget_id)
      set_budget_to_delete_name(cat_bud.name)
      set_show_delete_budget(true)
   }
   const delete_budget = async (e: any)=> {
      e.preventDefault()
      try {
         const data = await custom_fetch('delete/budget', {
            method: 'DELETE',

            body: JSON.stringify({ budget_to_delete, toggle, input_month_index, input_year })
         })
         set_refresh(!refresh)
         set_show_delete_budget(false)
         toast.success(data.message)
      } catch (error) {
         toast.error('Deleting budget failed')
         console.error('Deleting budget failed. ', error)
      }
   }

   return (
      <main className="flex flex-col gap-4 w-full h-full justify-center py-4 " >
         <section className="flex flex-col w-full items-center gap-4 " >
            {/* month navigation */}
            <div className="flex gap-4 text-xl" >
               <FontAwesomeIcon icon={faChevronLeft} onClick={prev_month} className="text-(--text-primary) hover:text-(--text-secondary) cursor-pointer active:text-(--text-primary) " />
               <h1>{month_name[input_month_index]} {input_year}</h1>
               <FontAwesomeIcon icon={faChevronRight} onClick={next_month} className="text-(--text-primary) hover:text-(--text-secondary) cursor-pointer active:text-(--text-primary) " />
            </div>
            {/* Total spent of budget */}
            <div className="flex flex-col items-center gap-2 w-1/3" >
               <h2>Total Spent of Budget</h2>
               {/* Toggle PHP or USD */}
               <div onClick={()=> set_toggle(toggle === 'PHP' ? 'USD' : 'PHP')}  className="p-1 px-3 gap-6 rounded-full bg-(--surface-1) flex items-center justify-around relative cursor-pointer" >
                  <div className={` ${toggle === 'PHP' ? 'left-[1%]' : 'left-[48%]'} bg-blue-900 w-1/2 h-9/10 absolute rounded-full transition-all`} ></div>
                  <h1 className="z-10" >PHP</h1>
                  <h1 className="z-10" >USD</h1>
               </div>
               <div className="flex items-end" >
                  <h1 className="flex text-4xl items-end" >{toggle === 'PHP' ? '₱' : '$'} {budget_summary.subs_total} </h1>
                  <h2 className="text-lg ml-1" >of {toggle === 'PHP' ? '₱' : '$'} {budget_summary.budget}</h2>
               </div>
               <Progress current={budget_summary.subs_total} max={budget_summary.budget} />
            </div>
         </section>
         {/* Budget details */}
         <section className="flex flex-col gap-8 p-4" >
            {categories_budgets.map(cat_bud => (
               <div key={cat_bud.id}  className="flex items-center gap-4" >
               <Progress page="budget" color={cat_bud.color_hex} name={cat_bud.name} current={cat_bud.amount} max={cat_bud.budget} left={cat_bud.left} symbol={toggle === 'PHP' ? '₱' : '$'} />
               {cat_bud.budget !== "0.00" ? (
                  <div className="flex gap-4" >
                     <FontAwesomeIcon icon={faPenToSquare} onClick={()=> open_edit(cat_bud)}  className=" text-3xl cursor-pointer text-blue-800 hover:text-blue-700 " />
                     <FontAwesomeIcon icon={faTrash} onClick={()=> open_delete_confirmation(cat_bud)}  className=" text-3xl cursor-pointer text-red-800 hover:text-red-700 " />
                  </div>
               ) : (
                  <button onClick={()=> open_add_budget(cat_bud)}  className="px-4 py-2.5 text-nowrap  rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Set Budget</button>
               )}
               </div>
            ))}
         </section>

         {/* Add budget */}
         {show_add_budget && (
            <section onClick={()=> set_show_add_budget(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <input type="number" autoFocus value={budget_amount} onChange={(e) => set_budget_amount(e.target.valueAsNumber)}  placeholder="Amount" required  className="px-4 py-2.5 rounded-lg w-full" />
                  <button onClick={(e)=> add_budget(e)}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Add Budget</button>
               </form>
            </section>
         )}

         {/* Edit budget */}
         {show_edit_budget && (
            <section onClick={()=> set_show_edit_budget(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <input type="number" autoFocus value={new_budget_amount} onChange={(e) => set_new_budget_amount(e.target.valueAsNumber)}  placeholder="Amount" required  className="px-4 py-2.5 rounded-lg w-full" />
                  <button onClick={(e)=> edit_budget(e)}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Add Budget</button>
               </form>
            </section>
         )}

         {/* Delete budget form */}
         {show_delete_budget && (
            <section onClick={()=> set_show_delete_budget(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <div onClick={(e)=> {e.stopPropagation(); e.preventDefault()}}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <h1 className="text-xl font-bold text-center" >Are you sure you want to delete {budget_to_delete_name} budget for this month?</h1>
                  <div className="flex gap-4 mt-4 justify-center" >
                     <button onClick={(e)=> delete_budget(e)}  className="px-4 py-2.5 outline-none active:bg-red-700 rounded-lg bg-red-900 text-(--text-primary) hover:bg-red-800 transition-colors" >Delete</button>
                     <button onClick={()=> set_show_delete_budget(false)}  className="px-4 py-2.5 outline-none active:bg-blue-700 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Cancel</button>
                  </div>
               </div>
            </section>
         )}
      </main>
   )
}