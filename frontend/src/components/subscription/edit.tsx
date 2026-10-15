import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { custom_fetch } from "../../services/api"

export default function SubscriptionEdit(props:any) {
   const sub = props.subscription

   const [editing, set_editing] = useState(false)
   const [new_sub_name, set_new_sub_name] = useState<string>(sub.name)
   const [new_sub_amount, set_new_sub_amount] = useState<number>(sub.amount)
   const [new_sub_currency, set_new_sub_currency] = useState<string>(sub.currency)
   const [new_sub_is_active, set_new_sub_is_active] = useState<boolean>(sub.is_active)
   const [new_sub_month, set_new_sub_month] = useState<string>(sub.prev_month)
   const [new_sub_day, set_new_sub_day] = useState<number>(sub.prev_day)
   const [new_sub_category_id, set_new_sub_category_id] = useState<number>(sub.category_id)
   const [new_sub_duration, set_new_sub_duration] = useState<string>(sub.duration)
   
   const edit_sub = async (e: any) => {
      set_editing(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('subscription/edit', {
            method: 'PUT',
            body: JSON.stringify({ 
               sub_id: sub.id,
               new_sub_name: new_sub_name, 
               new_sub_amount: new_sub_amount, 
               new_sub_currency: new_sub_currency, 
               new_sub_category_id: new_sub_category_id, 
               new_sub_is_active: new_sub_is_active,
               new_sub_month: new_sub_month, 
               new_sub_day: new_sub_day, 
               new_sub_duration: new_sub_duration 
            }),
         })
         props.set_refresh((prev:any) => !prev)
         toast.success(data.message)
         props.close()
      } catch (err: any) {
         toast.error(err.message)
         console.error("Error editing subscription:", err)
      } finally { set_editing(false) }
   }

   // Get categories
   const [categories, set_categories] = useState<any[]>([])
   useEffect(() => {
      const get_categories = async () => {
         try {
            const data = await custom_fetch('category')
            set_categories(data.categories)
         } catch (err: any) {
            toast.error(err.message)
            console.error("Error fetching categories:", err)
         }
      }
      get_categories()
   }, [])

   return (
      <main onClick={()=> props.close()}  className=" top-0 left-0 w-full h-full fixed bg-black/50 flex justify-center items-center" >
         <form onSubmit={(e)=> edit_sub(e)} onClick={(e)=> e.stopPropagation()}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
            <input type="text" value={new_sub_name} maxLength={40} onChange={(e) => set_new_sub_name(e.target.value)}  placeholder="Subscription Name" required  className="px-4 py-2.5 rounded-lg w-full text-sm" />
            <select value={Number(new_sub_category_id)} onChange={(e) => set_new_sub_category_id(Number(e.target.value))} required  className="px-2 py-2.5 rounded-lg w-full mt-4 text-sm " >
               {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
               ))}
               <option value={0} >None</option>
            </select>
            <input type="number" value={new_sub_amount} onChange={(e) => {let val = Number(e.target.value); if(val > 99999999) val = 99999999; set_new_sub_amount(val)}} placeholder="Amount" required className="px-4 py-2.5 rounded-lg w-full mt-4 text-sm" />
            <select value={new_sub_currency} onChange={(e) => set_new_sub_currency(e.target.value)} required className="px-2 py-2.5 rounded-lg w-full mt-4 text-sm" >
               <option disabled value="" >Currency</option>
               <option value="PHP">PHP</option>
               <option value="USD">USD</option>
            </select>
            <div className="flex items-center justify-center gap-2" >
               <input type="checkbox" id="active" checked={new_sub_is_active} onChange={(e) => set_new_sub_is_active(e.target.checked)} className=" md:scale-110 peer cursor-pointer" />
               <label htmlFor="active"  className="text-(--text-primary) peer-hover:text-blue-500 cursor-pointer " >Active</label>
            </div>
            <label className="-mb-6 mt-2 text-(--text-muted) text-sm" >Last due date.</label>
            <div className="flex gap-4 mt-4" >
               <select value={new_sub_month} onChange={(e) => set_new_sub_month(e.target.value)} required  className="px-1 md:px-4 py-2.5 rounded-lg w-fit text-sm" >
                  <option disabled value="" >Month</option>
                  <option value="Jan">January</option>
                  <option value="Feb">February</option>
                  <option value="Mar">March</option>
                  <option value="Apr">April</option>
                  <option value="May">May</option>
                  <option value="Jun">June</option>
                  <option value="Jul">July</option>
                  <option value="Aug">August</option>
                  <option value="Sep">September</option>
                  <option value="Oct">October</option>
                  <option value="Nov">November</option>
                  <option value="Dec">December</option>
               </select>
               <input type="number" value={new_sub_day} onChange={(e) => set_new_sub_day(Number(e.target.value) || 1)} required placeholder="Day" className="px-1 md:px-4 py-2.5 rounded-lg w-full text-sm" />
               <select value={new_sub_duration} onChange={(e) => set_new_sub_duration(String(e.target.value))} className="px-1 md:px-2 py-2.5 rounded-lg w-full text-sm" >
                  <option value={'monthly'}>Monthly</option>
                  <option value={'weekly'}>Weekly</option>
                     <option value={'yearly'}>Yearly</option>
               </select>
            </div>
            <button type="submit" disabled={editing}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors text-sm" >{editing ? 'Saving Changes...' : 'Save Changes'}</button>
         </form>
      </main>
   )
}