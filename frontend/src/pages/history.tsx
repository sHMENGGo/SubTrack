import { useEffect, useState } from "react"
import { custom_fetch } from "../services/api"
import toast from "react-hot-toast"


export default function History() {
   // Get categories
   const [categories, set_categories] = useState<any[]>([])
   useEffect(()=> {
      const get_category = async ()=> {
         try {
            const data = await custom_fetch('category')
            set_categories(data.categories)
         } catch (err: any) {
            toast.error(err.message)
            console.error('Retrieving categories failed', err) 
         }
      }
      get_category()
   }, [])

   // Get history
   const [formatted_histories, set_formatted_histories] = useState<any[]>([])
   const [month_amount, set_month_amount] = useState<any>([])
   const [year_amount, set_year_amount] = useState<any>([])
   const [filter_category, set_filter_category] = useState<number | string>("")
   const [filter_days, set_filter_days] = useState("30")
   useEffect(()=> {
      const get_history = async ()=> {
         try {
            const data = await custom_fetch('history', {
               method: 'POST',
               body: JSON.stringify({ filter_category, filter_days })
            })
            set_formatted_histories(data.formatted_histories)
            set_month_amount(data.month_amount)
            set_year_amount(data.year_amount)
         } catch (err: any) {
            toast.error(err.message) 
            console.error('Retrieving history failed', err) 
         }
      }
      get_history()
   }, [filter_category, filter_days])
   console.log('histories',formatted_histories)

   return (
      <main className="flex flex-col gap-4 w-full h-full" >
         {/* Totals */}
         <section className="flex justify-around gap-4 " >
            <div className="bg-(--surface-1) flex flex-col items-center p-2 rounded-lg w-full border-(--border) " >
               <h2>Amount Paid This Month</h2>
               <h1 className="text-3xl" >₱ {month_amount.php} | $ {month_amount.usd}</h1>
            </div>
            <div className="bg-(--surface-1) flex flex-col items-center p-2 rounded-lg w-full border-(--border) " >
               <h2>Amount Paid This Year</h2>
               <h1 className="text-3xl" >₱ {year_amount.php} | $ {year_amount.usd}</h1>
            </div>
         </section>
         {/* Filter */}
         <section className="flex gap-4" >
            <select value={filter_days} onChange={(e)=> set_filter_days(e.target.value)}  className="px-2 py-2.5 rounded-lg " >
               <option value="30" >Last 30 days</option>
               <option value="90" >Last 90 days</option>
               <option value="year" >This Year</option>
               <option value="">All</option>
            </select>
            <select value={filter_category} onChange={(e) => set_filter_category(e.target.value === "" ? "" : Number(e.target.value))}  className="px-2 py-2.5 rounded-lg " >
               <option value="" >Category: All</option>
               {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
               ))}
               <option value={0}>None</option>
            </select>
         </section>
         {/* History list */}
         <section className="flex flex-col">
            {Object.keys(formatted_histories).length !== 0 ? Object.entries(formatted_histories).map(([group_label, histories]) => (
               <div key={group_label}>
                  <p className="text-2xl text-(--text-muted) " >{group_label}</p>
                  {histories.map((history: any) => (
                     <div key={history.id} className="grid grid-cols-4 grid-rows-1 items-center px-4 py-3 border-b border-(--border) ml-4 " >
                        <h1 className="text-xl" >{history.month_day}</h1>
                        <h1 className="text-xl" >{history.subscription.name}</h1>
                        <h2 style={{background: history.subscription.category?.color_hex || 'var(--border)' }} className="rounded-full px-2 w-fit " >{history.subscription.category?.name || 'Uncategorized'}</h2>
                        <h1 >{history.currency === 'PHP' ? '₱' : '$'}{Number(history.amount).toFixed(2)}</h1>
                     </div>
                  ))}
               </div>
            )) : (
               <h2 className=" place-self-center text-3xl text-center w-full" >No History.</h2>
            )}
         </section>
      </main>
   )
}