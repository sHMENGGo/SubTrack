import { custom_fetch } from "../services/api"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import CategorySpent from "../components/dashboard/category_spent"
import Renewals from "../components/dashboard/renewals"
import Notifications from "../components/dashboard/notifications"
import Budget from "../components/dashboard/budget"

export default function Dashboard() {
   // Get monthly spend
   const [monthly_usd, set_monthly_usd] = useState(0)
   const [monthly_php, set_monthly_php] = useState(0)
   useEffect(()=> {
      const get_monthly_spend = async ()=> {
         try {
            const data = await custom_fetch('dashboard/monthly_spend')
            set_monthly_usd(data.monthly_usd)
            set_monthly_php(data.monthly_php)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting monthly spend: ', err)
         }
      }; get_monthly_spend()
   }, [])

   // Get active subscriptions
   const [active_subs, set_active_subs] = useState(0)
   useEffect(()=> {
      const get_active_subs = async ()=> {
         try {
            const data = await custom_fetch('dashboard/total/active_sub')
            set_active_subs(data.active_subs)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting active subscriptions: ', err)
         }
      }; get_active_subs()
   }, [])

   // Get 1 week due subscriptions
   const [due_1_week, set_due_1_week] = useState(0)
   useEffect(()=> {
      const get_due_1_week = async ()=> {
         try {
            const data = await custom_fetch('dashboard/total/due_1_week')
            set_due_1_week(data.due_1_week)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting active subscriptions: ', err)
         }
      }; get_due_1_week()
   }, [])

   // Get total budget
   const [php_budget, set_php_budget] = useState(0)
   const [usd_budget, set_usd_budget] = useState(0)
   useEffect(()=> {
      const get_budget = async ()=> {
         try {
            const data = await custom_fetch('dashboard/total/budget')
            set_usd_budget(data.total_usd)
            set_php_budget(data.total_php)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting total budget: ', err)
         }
      }; get_budget()
   }, [])

   return (
      <main className="w-full bg-(--page-bg) gap-4 flex flex-col h-full" >
         <section className=" h-fit w-full gap-4 flex flex-col md:flex-row" >
            <div className="bg-(--surface-1) rounded-lg p-4 w-full gap-2 flex flex-col" >
               <h2>Monthly Spend</h2>
               <h1 className=" text-2xl " >₱ {monthly_php} <span className="text-(--text-muted)" >|</span> $ {monthly_usd}</h1>
            </div>
            <div className="bg-(--surface-1) rounded-lg p-4 w-full gap-2 flex flex-col" >
               <h2>Active Subscriptions</h2>
               <h1 className=" text-2xl" >{active_subs}</h1>
            </div>
            <div className="bg-(--surface-1) rounded-lg p-4 w-full gap-2 flex flex-col" >
               <h2>Due in 7 days</h2>
               <h1 className="text-2xl" >{due_1_week}</h1>
            </div>
            <div className="bg-(--surface-1) rounded-lg p-4 w-full gap-2 flex flex-col" >
               <h2>Total Budget</h2>
               <h1 className="text-2xl" >₱ {php_budget} <br />$ {usd_budget}</h1>
            </div>
         </section>

         <section className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start" >
            <div className="flex flex-col md:col-span-3 gap-4">
               <Renewals/>
               <CategorySpent/>
            </div>

            <div className="flex flex-col gap-4 md:col-span-2  w-full">
               <Notifications/>
               <Budget />
            </div>
         </section>
      </main>
   )
}