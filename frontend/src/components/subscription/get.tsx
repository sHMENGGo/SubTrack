import { useState, useEffect } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"

export default function SubscriptionGet(props:any) {

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

   // Get all subscriptions
   const [subscriptions, set_subscriptions] = useState<any[]>([])
   const [filter_category, set_filter_category] = useState<number | string>("")
   const [filter_status, set_filter_status] = useState<string>("")
   useEffect(() => {
      const get_subscriptions = async () => {
         try {
            const data = await custom_fetch('subscription', {
               method: 'POST',
               body: JSON.stringify({ filter_category, filter_status }),
            })
            set_subscriptions(data.subscriptions)
         } catch (err: any) {
            toast.error(err.message)
            console.error("Error fetching subscriptions:", err)
         }
      }
      get_subscriptions()
   }, [filter_category, filter_status, props.refresh])

   const [search_term, set_search_term] = useState<string>("")
   const filtered_subscriptions = subscriptions.filter((subscription) =>
      subscription.name.toLowerCase().includes(search_term.toLowerCase())
   )

   return (
      <>
      {/* Navigation */}
      <section className="flex flex-col md:flex-row gap-4 w-full" >
         <input type="text" value={search_term} onChange={(e) => set_search_term(e.target.value)} placeholder="Search subscription..." className="px-4 w-full md:w-1/3 py-2.5 rounded-lg" />
         <select value={filter_category} onChange={(e) => set_filter_category(e.target.value === "" ? "" : Number(e.target.value))} className="px-2 py-2.5 rounded-lg text-sm " >
            <option  value="" >Category: All</option>
            {categories.map((category) => (
               <option key={category.id} value={category.id}>{category.name}</option>
            ))}
            <option value={0}>None</option>
         </select>
         <select value={filter_status} onChange={(e) => set_filter_status(e.target.value)}  className="px-2 py-2.5 rounded-lg text-sm" >
            <option value="all">Status: All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
         </select>
         <button className="px-4 py-2.5 text-sm rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" onClick={() => props.open()} >+ Add Subscription</button>
      </section>

      <main className="flex flex-col gap-2 md:gap-4 w-full h-full " >
         {filtered_subscriptions?.length > 0 ? (
            filtered_subscriptions.map((subscription) => (
               <div key={subscription.id}  className="grid grid-cols-2 md:grid-cols-8 items-center px-1 lg:px-4 py-1 lg:py-2.5 border-b border-(--border) " >
                  <h1 className="text-base md:col-span-2 lg:col-span-3 text-center md:text-start w-full truncate " >{subscription.name}</h1>
                  <h2 style={{ backgroundColor: subscription.category?.color_hex || 'var(--border)' }}  className=" px-1 md:px-2 text-sm rounded-full w-fit place-self-center " >{subscription.category?.name || 'Uncategorized'}</h2>
                  <h2 className="place-self-center text-sm" >{subscription.currency === 'PHP' ? '₱' : '$'} {Number(subscription.amount).toFixed(2)}</h2>
                  <h2 className="place-self-center text-sm col-span-1 md:col-span-2 lg:col-span-1" >{subscription.month} {subscription.day}, {subscription.year}</h2>
                  <h2 className={` ${subscription.is_active ? 'bg-green-900/50' : ' bg-(--border)'} px-1 md:px-2 text-sm rounded-full  w-fit place-self-center`} >{subscription.is_active ? 'Active' : 'Inactive'}</h2>
                  <div className="flex transition-colors text-xl gap-2 md:gap-4 place-self-center" >
                     <FontAwesomeIcon icon={faPenToSquare} onClick={() => props.set_sub_to_edit(subscription)}  className="text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer " />
                     <FontAwesomeIcon icon={faTrash} onClick={() => props.set_sub_to_delete(subscription)}  className="text-(--fill-danger) hover:text-red-500 active:text-(--fill-danger) cursor-pointer " />
                  </div>
               </div>
            ))
         ) : (<h2  className="mt-10 place-self-center text-lg text-center w-full" >No subscriptions found.</h2>)}
      </main>
      </>
   )
}