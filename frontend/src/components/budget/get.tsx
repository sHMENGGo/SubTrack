import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { custom_fetch } from "../../services/api"

// Shared progress math for the main bar and the category bars
function get_progress(spent_raw: any, budget_raw: any) {
   const spent = Number(spent_raw) || 0
   const budget = Number(budget_raw) || 0
   const width = budget > 0 ? Math.min((spent / budget) * 100, 100) : (spent > 0 ? 100 : 0)
   const color = width > 75 ? 'bg-(--fill-danger)' : width > 50 ? 'bg-(--fill-warning)' : width > 25 ? 'bg-(--fill-accent)' : 'bg-(--fill-safe)'
   return { width, color }
}

export default function BudgetGet(props:any) {
   // Get budget details based on toggle and month selected
   const [budget_summary, set_budget_summary] = useState<any>([])
   // const [getting_budget_summary, set_getting_budget_summary] = useState<boolean>(false)
   useEffect(()=> {
      const get_budget = async ()=> {
         // set_getting_budget_summary(true)
         try {
            const data = await custom_fetch('budget/summary', {
               method: 'POST',
               body: JSON.stringify({ toggle: props.toggle, input_month_index: props.input_month_index, input_year: props.input_year })
            })
            set_budget_summary(data.budget_summary)
         } catch (err: any) {
            toast.error(err.message)
            console.error('Getting budget failed. ', err)
         } 
         // finally { set_getting_budget_summary(false) }
      }
      get_budget()
   }, [props.toggle, props.refresh, props.input_month_index, props.input_year])

   // Main progress bar values
   const { width: bar_width, color: bar_color } = get_progress(budget_summary.subs_total, budget_summary.budget)

   // Get categories and their budgets
   const [categories_budgets, set_categories_budgets] = useState<any[]>([])
   useEffect(()=> {
      const get_categories_budgets = async ()=> {
         try {
            const data = await custom_fetch('budget/per_category', {
               method: 'POST',
               body: JSON.stringify({ toggle: props.toggle, input_month_index: props.input_month_index, input_year: props.input_year })
            })
            set_categories_budgets(data.categories_budgets)
         } catch (err: any) {
            toast.error(err.message)
            console.error('Getting categories budgets failed. ', err)
         }
      }
      get_categories_budgets()
   }, [props.toggle, props.refresh, props.input_month_index, props.input_year])

   return (
      <>
      <section className="flex flex-col w-full items-center gap-4 " >
         {/* month navigation */}
         <div className="flex gap-2 md:gap-4 text-lg" >
            <FontAwesomeIcon icon={faChevronLeft} onClick={props.prev_month} className="text-(--text-primary) hover:text-(--text-secondary) cursor-pointer active:text-(--text-primary) " />
            <h1>{props.month_name[props.input_month_index]} {props.input_year}</h1>
            <FontAwesomeIcon icon={faChevronRight} onClick={props.next_month} className="text-(--text-primary) hover:text-(--text-secondary) cursor-pointer active:text-(--text-primary) " />
         </div>

         {/* Total spent of budget */}
         <div className="flex flex-col items-center gap-2 w-1/3" >
            <h2 className="text-sm text-nowrap" >Total Spent of Budget</h2>

            {/* Toggle PHP or USD */}
            <div onClick={()=> props.set_toggle(props.toggle === 'PHP' ? 'USD' : 'PHP')}  className="p-1 px-3 gap-6 rounded-full bg-(--surface-1) flex items-center justify-around relative cursor-pointer" >
               <div className={` ${props.toggle === 'PHP' ? 'left-[1%]' : 'left-[48%]'} bg-blue-900 w-1/2 h-9/10 absolute rounded-full transition-all`} ></div>
               <h1 className="z-10 text-sm" >PHP</h1>
               <h1 className="z-10 text-sm" >USD</h1>
            </div>
            <div className="flex items-end text-nowrap" >
               <h1 className="text-xl" >{props.toggle === 'PHP' ? '₱' : '$'} {budget_summary.subs_total} </h1>
               <h2 className="text-md ml-1" >of {props.toggle === 'PHP' ? '₱' : '$'} {budget_summary.budget}</h2>
            </div>

            {/* Budget summary progress */}
            <section className="w-full">
               <section className="flex justify-between items-end">
                  <div className={` ${window.innerWidth < 768 ? 'flex-col text-nowrap items-start' : ''} justify-between w-1/2 items-center`} >
                  </div>
               </section>
               {/* Progress */}
               <div className="w-full h-2 bg-(--surface-1) rounded-full relative">
                  <div
                     className={`${bar_color} absolute h-2 rounded-full transition-all duration-500`}
                     style={{ width: `${bar_width}%` }}
                  ></div>
               </div>
            </section>

         </div>
      </section>

      {/* Budget details */}
      <section className="flex flex-col gap-8 p-2 md:p-4" >
         {categories_budgets.length !== 0 ? categories_budgets.map(cat_bud => {
            const { width, color } = get_progress(cat_bud.amount, cat_bud.budget)
            const symbol = props.toggle === 'PHP' ? '₱' : '$'

            return (
               <div key={cat_bud.id} className="flex items-center gap-2 md:gap-4" >
                  <div className="flex flex-col gap-1 flex-1" >
                     <div className="flex justify-between text-sm" >
                        <h2 className="text-xl" style={{textShadow: `0 0 5px ${cat_bud.color_hex}`}} >{cat_bud.name}</h2>
                        <span className="text-nowrap text-(--text-primary) " >{symbol} {cat_bud.amount} of {symbol} {cat_bud.budget}</span>
                     </div>
                     <div className="w-full h-2 bg-(--surface-1) rounded-full relative" >
                        <div
                           className={`${color} absolute h-2 rounded-full transition-all duration-500`}
                           style={{ width: `${width}%` }}
                        ></div>
                     </div>
                  </div>

                  {cat_bud.budget !== "0.00" ? (
                     <div className="flex gap-2 md:gap-4" >
                        <FontAwesomeIcon icon={faPenToSquare} onClick={()=> props.set_bud_to_edit(cat_bud)} className="text-2xl cursor-pointer text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent)" />
                        <FontAwesomeIcon icon={faTrash} onClick={()=> props.set_bud_to_delete(cat_bud)} className="text-2xl cursor-pointer text-(--fill-danger) active:text-(--fill-danger) hover:text-red-500" />
                     </div>
                  ) : (
                     <button onClick={()=> {props.open(); props.set_category_id(cat_bud.id)}} className="p-2 px-4 md:px-6 py-1.5 text-nowrap rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors text-sm" >Set</button>
                  )}
               </div>
            )
         }) : (
            <h2 className="text-3xl place-self-center mt-10" >No Category.</h2>
         )}
      </section>
      </>
   )
}