import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"
import { useEffect, useState } from "react"
import { custom_fetch } from "../services/api"
import toast from "react-hot-toast"

export default function Subscription() {
   const [refresh, set_refresh] = useState<boolean>(false)

   // Get categories for filter
   const [categories, set_categories] = useState<any[]>([])
   useEffect(() => {
      const get_categories = async () => {
         try {
            const data = await custom_fetch('category')
            set_categories(data.categories)
         } catch (error) {console.error("Error fetching categories:", error)}
      }
      get_categories()
   }, [])

   // Get all subscriptions
   const [subscriptions, set_subscriptions] = useState<any[]>([])
   const [filter_category, set_filter_category] = useState<number>(0)
   const [filter_status, set_filter_status] = useState<string>("")
   useEffect(() => {
      const get_subscriptions = async () => {
         try {
            const data = await custom_fetch('subscription', {
               method: 'POST',
               body: JSON.stringify({ filter_category, filter_status }),
            })
            set_subscriptions(data.subscriptions)
         } catch (error) {console.error("Error fetching subscriptions:", error)}
      }
      get_subscriptions()
   }, [filter_category, filter_status, refresh])

   // Filter by search
   const [search_term, set_search_term] = useState<string>("")
   const filtered_subscriptions = subscriptions.filter((subscription) =>
      subscription.name.toLowerCase().includes(search_term.toLowerCase())
   )

   // Add subscription
   const [show_add_sub, set_show_add_sub] = useState<boolean>(false)
   const [sub_name, set_sub_name] = useState<string>("")
   const [sub_amount, set_sub_amount] = useState<string>("")
   const [sub_currency, set_sub_currency] = useState<string>("")
   const [sub_month, set_sub_month] = useState<string>()
   const [sub_day, set_sub_day] = useState<number>(1)
   const [sub_category_id, set_sub_category_id] = useState<number>()
   const [sub_duration, set_sub_duration] = useState<string>()
   const add_sub = async () => {
      try {
         const data = await custom_fetch('add/subscription', {
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
         set_refresh(!refresh)
         set_show_add_sub(false)
         set_sub_name("")
         toast.success(data.message)
      } catch (error) {
         toast.error("Error adding subscription!")
         console.error("Error adding subscription:", error)
      }
   }

   // Edit subscription
   const [show_edit_sub, set_show_edit_sub] = useState<boolean>(false)
   // New states
   const [sub_id_to_edit, set_sub_id_to_edit] = useState<number | null>(null)
   const [new_sub_name, set_new_sub_name] = useState<string>()
   const [new_sub_amount, set_new_sub_amount] = useState<number>()
   const [new_sub_currency, set_new_sub_currency] = useState<string>()
   const [new_sub_is_active, set_new_sub_is_active] = useState<boolean>(true)
   const [new_sub_month, set_new_sub_month] = useState<string>()
   const [new_sub_day, set_new_sub_day] = useState<number>()
   const [new_sub_category_id, set_new_sub_category_id] = useState<number>()
   const [new_sub_duration, set_new_sub_duration] = useState<string>()
   // Change the states when sub_to_edit changes
   const open_edit_form = (subscription: any) => {
      set_sub_id_to_edit(subscription.id)
      set_new_sub_name(subscription.name)
      set_new_sub_amount(subscription.amount)
      set_new_sub_currency(subscription.currency)
      set_new_sub_is_active(subscription.is_active)
      set_new_sub_month(subscription.month)
      set_new_sub_day(subscription.day)
      set_new_sub_category_id(subscription.category_id)
      set_new_sub_duration(subscription.duration)
      set_show_edit_sub(true)
   }
   const edit_sub = async () => {
      try {
         const data = await custom_fetch('edit/subscription', {
            method: 'PUT',
            body: JSON.stringify({ 
               sub_id: sub_id_to_edit,
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
         set_refresh(!refresh)
         set_show_edit_sub(false)
         toast.success(data.message)
      } catch (error) {
         toast.error("Error editing subscription!")
         console.error("Error editing subscription:", error)
      }
   }

   // Delete subscription
   const [show_delete_sub, set_show_delete_sub] = useState<boolean>(false)
   const [sub_to_delete, set_sub_to_delete] = useState<any[]>([])
   const [sub_to_delete_name, set_sub_to_delete_name] = useState<string>("")
   const open_delete_confirmation = (subscription: any) => {
      set_sub_to_delete(subscription.id)
      set_sub_to_delete_name(subscription.name)
      set_show_delete_sub(true)
   }
   const delete_sub = async () => {
      try {
         const data = await custom_fetch('delete/subscription', {
            method: 'DELETE',
            body: JSON.stringify({ subscription_id: sub_to_delete }),
         })
         set_refresh(!refresh)
         set_show_delete_sub(false)
         set_sub_to_delete([])
         toast.success(data.message)
      } catch (error) {
         toast.error("Error deleting subscription!")
         console.error("Error deleting subscription:", error)
      }
   }

   return (
      <main className="flex flex-col gap-4 w-full h-full overflow-x-hidden overflow-y-auto" >
         {/* Navigation */}
         <section className="flex gap-4 w-full" >
            <input type="text" value={search_term} onChange={(e) => set_search_term(e.target.value)} placeholder="Search subscription..." className="px-4 w-1/3 py-2.5 rounded-lg" />
            <select value={filter_category} onChange={(e) => set_filter_category(Number(e.target.value))} className="px-2 py-2.5 rounded-lg " >
               <option  value={0}>Category: All</option>
               {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
               ))}
            </select>
            <select value={filter_status} onChange={(e) => set_filter_status(e.target.value)}  className="px-2 py-2.5 rounded-lg" >
               <option value="all">Status: All</option>
               <option value="true">Active</option>
               <option value="false">Inactive</option>
            </select>
            <button className="px-4 py-2.5 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" onClick={() => set_show_add_sub(true)} >+ Add Subscription</button>
         </section>

         {/* Subscription List */}
         <section className="flex flex-col gap-4 w-full h-full " >
            {filtered_subscriptions?.length > 0 ? (
               filtered_subscriptions.map((subscription) => (
                  <div key={subscription.id}  className="grid grid-cols-9 grid-rows-1 items-center px-4 py-2.5 border-b border-(--border)  " >
                     <h1 className="text-xl col-span-3 place-self-start " >{subscription.name}</h1>
                        <h2 style={{ backgroundColor: subscription.category?.color_hex || 'var(--border)' }}  className=" px-2 rounded-full w-fit place-self-center " >{subscription.category?.name || 'Uncategorized'}</h2>
                        <h2 className="place-self-center" >{subscription.currency === 'PHP' ? '₱' : '$'} {Number(subscription.amount).toFixed(2)}</h2>
                        <h2 className="place-self-center" >{subscription.month} {subscription.day}</h2>
                        <h2 className={` ${subscription.is_active ? 'bg-green-900/50' : ' bg-(--border)'} px-2 rounded-full  w-fit place-self-center`} >{subscription.is_active ? 'Active' : 'Inactive'}</h2>
                        <FontAwesomeIcon icon={faPenToSquare} onClick={() => open_edit_form(subscription)}  className="text-blue-800 hover:text-blue-700 transition-colors text-2xl cursor-pointer place-self-center" />
                        <FontAwesomeIcon icon={faTrash} onClick={() => open_delete_confirmation(subscription)}  className="text-red-800 hover:text-red-700 transition-colors text-2xl cursor-pointer" />
                  </div>
               ))
            ) : (<h1 className=" place-self-center text-xl text-center w-full" >No subscriptions found.</h1>)}
         </section>

         {/* Add Subscription Form */}
         {show_add_sub && (
            <section onClick={()=> set_show_add_sub(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onClick={(e)=> e.stopPropagation()}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <input type="text" value={sub_name} onChange={(e) => set_sub_name(e.target.value)}  placeholder="Subscription Name" required  className="px-4 py-2.5 rounded-lg w-full" />
                  <select value={sub_category_id} onChange={(e) => set_sub_category_id(Number(e.target.value))} required  className="px-2 py-2.5 rounded-lg w-full mt-4" >
                     <option disabled value="" >Category</option>
                     {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                     ))}
                     <option value={0} >None</option>
                  </select>
                  <input type="number" value={sub_amount} onChange={(e) => set_sub_amount(e.target.value)} placeholder="Amount" required className="px-4 py-2.5 rounded-lg w-full mt-4" />
                  <select value={sub_currency} onChange={(e) => set_sub_currency(e.target.value)} required className="px-2 py-2.5 rounded-lg w-full mt-4" >
                     <option disabled value="" >Currency</option>
                     <option value="PHP">PHP</option>
                     <option value="USD">USD</option>
                  </select>
                  <label className="-mb-6 mt-2 text-(--text-muted) " >When did you start this subscription?</label>
                  <div className="flex gap-4 mt-4" >
                     <select value={sub_month} onChange={(e) => set_sub_month(e.target.value)} required  className="px-4 py-2.5 rounded-lg w-full" >
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
                     <input type="number" value={sub_day} onChange={(e) => set_sub_day(Number(e.target.value) || 1)} required placeholder="Day" className="px-4 py-2.5 rounded-lg w-full" />
                     <select value={sub_duration} onChange={(e) => set_sub_duration(e.target.value)} className="px-2 py-2.5 rounded-lg w-full" >
                        <option value={'monthly'}>Monthly</option>
                        <option value={'weekly'}>Weekly</option>
                           <option value={'yearly'}>Yearly</option>
                     </select>
                  </div>
                  <button onClick={add_sub}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Add Subscription</button>
               </form>
            </section>
         )}    

         {/* Edit form */}
         {show_edit_sub && (
            <section onClick={()=> set_show_edit_sub(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onClick={(e)=> e.stopPropagation()}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <input type="text" value={new_sub_name} onChange={(e) => set_new_sub_name(e.target.value)}  placeholder="Subscription Name" required  className="px-4 py-2.5 rounded-lg w-full" />
                  <select value={new_sub_category_id || 0} onChange={(e) => set_new_sub_category_id(Number(e.target.value))} required  className="px-2 py-2.5 rounded-lg w-full mt-4" >
                     <option disabled value="" >Category</option>
                     {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                     ))}
                     <option value={0} >None</option>
                  </select>
                  <input type="number" value={new_sub_amount} onChange={(e) => set_new_sub_amount(Number(e.target.value))} placeholder="Amount" required className="px-4 py-2.5 rounded-lg w-full mt-4" />
                  <select value={new_sub_currency} onChange={(e) => set_new_sub_currency(e.target.value)} required className="px-2 py-2.5 rounded-lg w-full mt-4" >
                     <option disabled value="" >Currency</option>
                     <option value="PHP">PHP</option>
                     <option value="USD">USD</option>
                  </select>
                  <div className="flex items-center justify-center gap-2" >
                     <input type="checkbox" id="active" checked={new_sub_is_active} onChange={(e) => set_new_sub_is_active(e.target.checked)} className="scale-110 peer cursor-pointer" />
                     <label htmlFor="active"  className="text-(--text-primary) peer-hover:text-blue-500 cursor-pointer " >Active</label>
                  </div>
                  <label className="-mb-6 mt-2 text-(--text-muted) " >When did you start this subscription?</label>
                  <div className="flex gap-4 mt-4" >
                     <select value={new_sub_month} onChange={(e) => set_new_sub_month(e.target.value)} required  className="px-4 py-2.5 rounded-lg w-fit" >
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
                     <input type="number" value={new_sub_day} onChange={(e) => set_new_sub_day(Number(e.target.value) || 1)} required placeholder="Day" className="px-4 py-2.5 rounded-lg w-full" />
                     <select value={new_sub_duration} onChange={(e) => set_new_sub_duration(String(e.target.value))} className="px-2 py-2.5 rounded-lg w-full" >
                        <option value={'monthly'}>Monthly</option>
                        <option value={'weekly'}>Weekly</option>
                           <option value={'yearly'}>Yearly</option>
                     </select>
                  </div>
                  <button onClick={edit_sub}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Save changes</button>
               </form>
            </section>
         )}

         {/* Delete Confirmation */}
         {show_delete_sub && (
            <section onClick={()=> set_show_delete_sub(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <div onClick={(e)=> {e.stopPropagation(); e.preventDefault()}}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <h1 className="text-xl font-bold text-center" >Are you sure you want to delete {sub_to_delete_name} subscription?</h1>
                  <div className="flex gap-4 mt-4 justify-center" >
                     <button onClick={delete_sub}  className="px-4 py-2.5 outline-none active:bg-red-700 rounded-lg bg-red-900 text-(--text-primary) hover:bg-red-800 transition-colors" >Delete</button>
                     <button onClick={()=> set_show_delete_sub(false)}  className="px-4 py-2.5 outline-none active:bg-blue-700 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Cancel</button>
                  </div>
               </div>
            </section>
         )}
      </main>
   )
}