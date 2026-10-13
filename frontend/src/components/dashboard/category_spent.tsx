import { useState, useEffect } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function CategorySpent() {
   const [toggle, set_toggle] = useState('PHP')
   const [category_spent, set_category_spent] = useState<any>([])
   useEffect(()=> {
      const get_category_spent = async ()=> {
         try {
            const data = await custom_fetch('dashboard/category_spent', {
               method: 'POST', 
               body: JSON.stringify({ toggle })
            })
            set_category_spent(data.spent_category)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting total budget: ', err)
         }
      }; get_category_spent()
   }, [toggle])

   const [symbol, set_symbol] = useState('')
   useEffect(()=> {
      set_symbol(toggle === 'PHP' ? '₱' : '$')
   }, [toggle])


   return (
      <main className="bg-(--surface-2) rounded-lg p-4 border border-(--border) flex flex-col gap-3">
         <div className="flex justify-between items-center" >
            <h1 className="text-lg" >Spend by Category</h1>
            {/* Toggle button */}
            <div onClick={()=> set_toggle(toggle === 'PHP' ? 'USD' : 'PHP')}  className="p-1 px-3 gap-6 rounded-full bg-(--surface-1) flex items-center justify-around relative cursor-pointer" >
               <div className={` ${toggle === 'PHP' ? 'left-[1%]' : 'left-[48%]'} bg-(--fill-accent) w-1/2 h-9/10 absolute rounded-full transition-all`} ></div>
               <h1 className="z-10 text-sm" >PHP</h1>
               <h1 className="z-10 text-sm" >USD</h1>
            </div>
         </div>

         {/* Progress */}
         {category_spent.length !== 0 ? category_spent.map((c: any) => {
            const safe_max = c.category_budget > 0 ? c.category_budget : 1; 
            const bar_width = (c.total_amount / safe_max) * 100;

            return (
               <section key={c.category_id} className="w-full">
                  <section className="flex justify-between items-end">
                     <div className="flex justify-between w-1/2 items-center" >
                        <h1 className="truncate" >{c.category_name}</h1>
                     </div>
                     <h2 className="text-sm text-nowrap md:text-wrap" >{symbol} {c.total_amount} of {symbol} {c.category_budget}</h2>
                  </section>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-(--surface-1) rounded-full relative">
                     <div 
                        className={`${bar_width > 0 && bar_width <= 25 ? 'bg-(--fill-safe)' : bar_width > 25 && bar_width <= 50 ? 'bg-(--fill-accent)' : bar_width >= 50 && bar_width <= 75 ? 'bg-(--fill-warning)' : bar_width > 75 ? 'bg-(--fill-danger)' : ''} absolute h-2 rounded-full transition-all duration-500`} 
                        style={{ width: `${bar_width > 100 ? 100 : bar_width}%` }}
                     ></div>
                  </div>
               </section>
            )
         }) : (
            <h2 className="place-self-center text-lg " >No Category or spent this month.</h2>
         )}
      </main>
   )
}