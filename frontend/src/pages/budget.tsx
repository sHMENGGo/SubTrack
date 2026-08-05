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
   }, [toggle, input_month_index])

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
   }, [toggle, input_month_index])

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
               <div className="flex items-center gap-4" >
               <Progress page="budget" name={cat_bud.name} current={cat_bud.amount} max={cat_bud.budget} left={cat_bud.left} symbol={toggle === 'PHP' ? '₱' : '$'} />
               <div className="flex gap-4" >
                  <FontAwesomeIcon icon={faPenToSquare} className=" text-3xl cursor-pointer text-blue-800 hover:text-blue-700 " />
                  <FontAwesomeIcon icon={faTrash} className=" text-3xl cursor-pointer text-red-800 hover:text-red-700 " />
               </div>
               </div>
            ))}
         </section>
      </main>
   )
}