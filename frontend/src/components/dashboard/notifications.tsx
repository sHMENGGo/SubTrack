import { useState, useEffect } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function Notifications() {
   const [notifications, set_notifications] = useState<any[]>([])
   useEffect(()=> {
      const get_notifications = async ()=> {
         try {
            const data = await custom_fetch('dashboard/notification/today')
            set_notifications(data.formatted_notifications)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting notifications today: ', err)
         }
      }; get_notifications()
   }, [])

   return (
      <main className=" bg-(--surface-2) border border-(--border) rounded-lg p-4 gap-3 flex flex-col max-h-50 overflow-x-hidden w-full">
         <h1 className="text-lg" >Notifications</h1>
         <div>
            {notifications.length !== 0 ? notifications.map(notif => (
               <div key={notif.id} className="border-b border-(--border) p-1 flex justify-between w-full" >
                  <div className="flex gap-2" >
                     <h1 className="text-base" >{notif.subscription.name}</h1>
                     <h2 className="text-sm" >{notif.message}</h2>
                  </div>
                  
                  <h1 className="text-sm" >{notif.subscription.currency === 'PHP' ? '₱' : '$'} {notif.subscription.amount}</h1>
               </div>
            )) : (
               <h2 className="place-self-center text-lg " >No notification today.</h2>
            )}
         </div>
      </main>
   )
}