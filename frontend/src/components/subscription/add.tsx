import { useState, useEffect } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function SubscriptionAdd(props:any) {
   const [refresh, set_refresh] = useState<boolean>(false)

   // Get categories for filter
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

   // Add subscription
   const [loading, set_loading] = useState<boolean>(false)
   const [sub_name, set_sub_name] = useState<string>("")
   const [sub_amount, set_sub_amount] = useState<number>()
   const [sub_currency, set_sub_currency] = useState<string>("")
   // Auto select current month
   const date = new Date()
   const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
   const month = month_name[date.getMonth()]
   const [sub_month, set_sub_month] = useState<string>(month)
   // Auto select current day
   const day = date.getDate()
   const [sub_day, set_sub_day] = useState<number>(day)
   const [sub_category_id, set_sub_category_id] = useState<number | string>("")
   const [sub_duration, set_sub_duration] = useState<string>('monthly')
   const add_sub = async (e : any) => {
      set_loading(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('subscription/add', {
            method: 'POST',
            body: JSON.stringify({ 
               sub_name, 
               sub_amount, 
               sub_currency,
               sub_category_id, 
               sub_month,
               sub_day, 
               sub_duration 
            }),
         })
         props.set_refresh((prev:any)=> !prev)
         set_sub_name("")
         props.close()
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error("Error adding subscription:", err)
      } finally { set_loading(false) }
   }

   return (
      <main onClick={()=> props.close()}  className=" top-0 left-0 w-full h-full fixed bg-black/50 flex justify-center items-center" >
         <form onSubmit={(e)=> add_sub(e)} onClick={(e)=> e.stopPropagation()}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
            <input type="text" value={sub_name} maxLength={40} onChange={(e) => set_sub_name(e.target.value)}  placeholder="Subscription Name" required autoFocus  className=" text-sm px-4 py-2.5 rounded-lg w-full" />
            <select value={sub_category_id} onChange={(e) => set_sub_category_id(Number(e.target.value))} required  className="px-2 py-2.5 rounded-lg w-full mt-4 text-sm" >
               <option disabled value="" >Category</option>
               {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
               ))}
               <option value={0} >None</option>
            </select>
            <input type="number" value={sub_amount} onChange={(e) => {let val = Number(e.target.value); if(val > 99999999) val = 99999999; set_sub_amount(val)}} placeholder="Amount" required className="px-4 py-2.5 rounded-lg w-full mt-4 text-sm " />
            <select value={sub_currency} onChange={(e) => set_sub_currency(e.target.value)} required className="px-2 py-2.5 rounded-lg w-full mt-4 text-sm " >
               <option disabled value="" >Currency</option>
               <option value="PHP">PHP</option>
               <option value="USD">USD</option>
            </select>
            <label className="-mb-6 mt-2 text-(--text-muted) text-sm " >When did you start this subscription?</label>
            <div className="flex gap-4 mt-4" >
               <select value={sub_month} onChange={(e) => set_sub_month(e.target.value)} required  className="px-1 md:px-4 py-2.5 rounded-lg w-full text-sm " >
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
               <input type="number" value={sub_day} onChange={(e) => {let val = Number(e.target.value); if(val > 31) val=31; set_sub_day(val)}} required placeholder="Day" className="px-1 md:px-4 py-2.5 rounded-lg w-full text-sm " />
               <select value={sub_duration} onChange={(e) => set_sub_duration(e.target.value)} className="px-1 md:px-2 py-2.5 rounded-lg w-full text-sm" >
                  <option value={'monthly'}>Monthly</option>
                  <option value={'weekly'}>Weekly</option>
                     <option value={'yearly'}>Yearly</option>
               </select>
            </div>
            <button type="submit" disabled={loading}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors text-sm " >{loading ? 'Adding Subscription...' : 'Add Subscription'}</button>
         </form>
      </main>
   )
}