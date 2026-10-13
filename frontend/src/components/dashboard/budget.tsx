import { useState, useEffect } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function Budget() {
   const [budget, set_budget] = useState<any>([])
   useEffect(()=> {
      const get_budget_left = async ()=> {
         try {
            const data = await custom_fetch('dashboard/total/month_budget_left')
            set_budget(data.budget)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting budget left this month: ', err)
         }
      }; get_budget_left()
   }, [])

   const php_safe_max = budget.php_budget > 0 ? budget.php_budget : 1; 
   const php_bar_width = (budget.php_spent / php_safe_max) * 100;

   const usd_safe_max = budget.usd_budget > 0 ? budget.usd_budget : 1; 
   const usd_bar_width = (budget.usd_spent / usd_safe_max) * 100;

   return (
      <main className="bg-(--surface-2) rounded-lg p-4 border border-(--border) flex flex-col gap-3 ">
         <h1 className="text-lg" >Budget this month</h1>

         {/* PHP budget this month */}
         <section className="flex flex-col gap-2" >
            <div className="w-full">
               <div className="flex justify-between items-end">
                  <div className={`flex justify-between w-1/2 items-center`} >
                     <h1 className="truncate" >PHP</h1>
                  </div>
                  <h2 className="text-sm" >₱ {budget.php_spent} of ₱ {budget.php_budget}</h2>
               </div>

               {/* Progress */}
               <div className="w-full h-2 bg-(--surface-1) rounded-full relative">
                  <div 
                     className={`${php_bar_width > 0 && php_bar_width <= 25 ? 'bg-(--fill-safe)' : php_bar_width > 25 && php_bar_width <= 50 ? 'bg-(--fill-accent)' : php_bar_width >= 50 && php_bar_width <= 75 ? 'bg-(--fill-warning)' : php_bar_width > 75 ? 'bg-(--fill-danger)' : ''} absolute h-2 rounded-full transition-all duration-500`} 
                     style={{ width: `${php_bar_width > 100 ? 100 : php_bar_width}%` }}
                  ></div>
               </div>
            </div>
         </section>

         {/* USD budget this month */}
         <section className="flex flex-col gap-2" >
            <div className="w-full">
               <div className="flex justify-between items-end">
                  <div className={`flex justify-between w-1/2 items-center`} >
                     <h1 className="truncate" >USD</h1>
                  </div>
                  <h2 className="text-sm" >$ {budget.usd_spent} of $ {budget.usd_budget}</h2>
               </div>

               {/* Progress */}
               <div className="w-full h-2 bg-(--surface-1) rounded-full relative">
                  <div 
                     className={`${usd_bar_width > 0 && usd_bar_width <= 25 ? 'bg-(--fill-safe)' : usd_bar_width > 25 && usd_bar_width <= 50 ? 'bg-(--fill-accent)' : usd_bar_width >= 50 && usd_bar_width <= 75 ? 'bg-(--fill-warning)' : usd_bar_width > 75 ? 'bg-(--fill-danger)' : ''} absolute h-2 rounded-full transition-all duration-500`} 
                     style={{ width: `${usd_bar_width > 100 ? 100 : usd_bar_width}%` }}
                  ></div>
               </div>
            </div>
         </section>
      </main>
   )
}