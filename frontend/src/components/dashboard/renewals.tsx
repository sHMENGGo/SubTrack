import { useState, useEffect } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function Renewals() {
   const [renewals, set_renewals] = useState<any[]>([])
   useEffect(()=> {
      const get_renewals = async ()=> {
         try {
            const data = await custom_fetch('dashboard/renewals')
            set_renewals(data.formatted_renewals)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting total budget: ', err)
         }
      }; get_renewals()
   }, [])

   return (
      <main className="bg-(--surface-2) rounded-lg p-4 border max-h-55 overflow-hidden border-(--border) gap-3 flex flex-col">
         <h1 className="text-lg">Upcoming Renewals</h1>
         {renewals.length !== 0 ? renewals.map(renewal => (
            <div key={renewal.id} className="flex items-center border-b p-1 border-(--border) relative" >
               <div className="w-2 h-2 aspect-square rounded-full mr-2" style={{background: renewal.category.color_hex}}></div>
               <h1 className="text-base truncate" >{renewal.name}</h1>
               <div className=" absolute right-0 flex gap-2 md:gap-4 " >
                  <h2 className="text-sm" >{renewal.month} {renewal.day}</h2>
                  <h2 className="text-sm" >{renewal.currency === 'PHP' ? '₱' : '$'} {renewal.amount}</h2>
               </div>
            </div>
         )) : (
            <h2 className="place-self-center text-lg" >No upcoming renewals.</h2>
         )}
      </main>
   )
}