import { custom_fetch } from "../services/api"
import { useEffect, useState } from "react"
import Progress from "../components/progress"

export default function Dashboard() {
   // Get monthly spend
   const [monthly_usd, set_monthly_usd] = useState(0)
   const [monthly_php, set_monthly_php] = useState(0)
   useEffect(()=> {
      const get_monthly_spend = async ()=> {
         try {
            const data = await custom_fetch('monthly_spend')
            set_monthly_usd(data.monthly_usd)
            set_monthly_php(data.monthly_php)
         } catch (error) {console.log('Error getting monthly spend: ', error)}
      }; get_monthly_spend()
   }, [])

   // Get active subscriptions
   const [active_subs, set_active_subs] = useState(0)
   useEffect(()=> {
      const get_active_subs = async ()=> {
         try {
            const data = await custom_fetch('total/active_sub')
            set_active_subs(data.active_subs)
         } catch (error) {console.log('Error getting active subscriptions: ', error)}
      }; get_active_subs()
   }, [])

   // Get 1 week due subscriptions
   const [due_1_week, set_due_1_week] = useState(0)
   useEffect(()=> {
      const get_due_1_week = async ()=> {
         try {
            const data = await custom_fetch('total/due_1_week')
            set_due_1_week(data.due_1_week)
         } catch (error) {console.log('Error getting active subscriptions: ', error)}
      }; get_due_1_week()
   }, [])

   // Get total budget
   const [php_budget, set_php_budget] = useState(0)
   const [usd_budget, set_usd_budget] = useState(0)
   useEffect(()=> {
      const get_budget = async ()=> {
         try {
            const data = await custom_fetch('total/budget')
            set_usd_budget(data.total_usd)
            set_php_budget(data.total_php)
         } catch (error) {console.log('Error getting total budget: ', error)}
      }; get_budget()
   }, [])

   // Get upcoming renewals
   const [renewals, set_renewals] = useState<any[]>([])
   useEffect(()=> {
      const get_renewals = async ()=> {
         try {
            const data = await custom_fetch('renewals')
            set_renewals(data.formatted_renewals)
         } catch (error) {console.log('Error getting total budget: ', error)}
      }; get_renewals()
   }, [])

   // Get spent by category
   const [toggle, set_toggle] = useState('PHP')
   const [category_spent, set_category_spent] = useState<any[]>([])
   useEffect(()=> {
      const get_category_spent = async ()=> {
         try {
            const data = await custom_fetch('category_spent', {
               method: 'POST', 
               body: JSON.stringify({ money: toggle })
            })
            set_category_spent(data.spent_category)
         } catch (error) {console.log('Error getting total budget: ', error)}
      }; get_category_spent()
   }, [toggle])

   // Get notifications
   const [notifications, set_notifications] = useState<any[]>([])
   useEffect(()=> {
      const get_notifications = async ()=> {
         try {
            const data = await custom_fetch('notification')
            set_notifications(data.notifications)
         } catch (error) {console.log('Error getting total budget: ', error)}
      }; get_notifications()
   }, [])

   // Get budget left this month
   const [budget, set_budget] = useState<any>([])
   useEffect(()=> {
      const get_budget_left = async ()=> {
         try {
            const data = await custom_fetch('total/budget_left')
            set_budget(data.budget)
         } catch (error) {console.log('Error getting budget left this month: ', error)}
      }; get_budget_left()
   }, [])

   return (
      <main className="w-full bg-(--page-bg) gap-4 flex flex-col h-full" >
         {/* Status */}
         <section className=" h-fit w-full gap-4 flex" >
            <div className="bg-(--surface-1) rounded-lg p-4 w-full gap-2 flex flex-col" >
               <h2>Monthly Spend</h2>
               <h1 className="text-4xl" >₱ {monthly_php} <span className="text-(--text-muted)" >|</span> $ {monthly_usd}</h1>
            </div>
            <div className="bg-(--surface-1) rounded-lg p-4 w-full gap-2 flex flex-col" >
               <h2>Active Subscriptions</h2>
               <h1 className="text-4xl" >{active_subs}</h1>
            </div>
            <div className="bg-(--surface-1) rounded-lg p-4 w-full gap-2 flex flex-col" >
               <h2>Due in 7 days</h2>
               <h1 className="text-4xl" >{due_1_week}</h1>
            </div>
            <div className="bg-(--surface-1) rounded-lg p-4 w-full gap-2 flex flex-col" >
               <h2>Total Budget</h2>
               <h1 className="text-3xl" >₱ {php_budget} <br />$ {usd_budget}</h1>
            </div>

         </section>
         {/* Analytics */}
         <section className="grid grid-cols-5 gap-4 items-start">
            {/* Left half */}
            <div className="flex flex-col col-span-3 gap-4">
               <div className="bg-(--surface-2) rounded-lg p-4 border border-(--border) gap-3 flex flex-col">
                  <h1 className="text-xl">Upcoming Renewals</h1>
                  {renewals?.map(renewal => (
                     <div key={renewal.id} className="flex items-center border-b p-1 border-(--border) relative" >
                        <div className="w-2 h-2 aspect-square rounded-full mr-2" style={{background: renewal.category.color_hex}}></div>
                        <h1>{renewal.name}</h1>
                        <div className=" absolute right-0 flex gap-4" >
                           <h2>{renewal.month} {renewal.day}</h2>
                           <h2>{renewal.currency === 'PHP' ? '₱' : '$'} {renewal.amount}</h2>
                        </div>
                     </div>
                  ))}
               </div>
               {/* Spend by category */}
               <div className="bg-(--surface-2) rounded-lg p-4 border border-(--border) flex flex-col gap-3">
                  <div className="flex justify-between items-center" >
                     <h1 className="text-xl" >Spend by Category</h1>
                     {/* Toggle button */}
                     <div onClick={()=> set_toggle(toggle === 'PHP' ? 'USD' : 'PHP')}  className="p-1 px-3 gap-6 rounded-full bg-(--surface-1) flex items-center justify-around relative cursor-pointer" >
                        <div className={` ${toggle === 'PHP' ? 'left-[1%]' : 'left-[48%]'} bg-blue-900 w-1/2 h-9/10 absolute rounded-full transition-all`} ></div>
                        <h1 className="z-10" >PHP</h1>
                        <h1 className="z-10" >USD</h1>
                     </div>
                  </div>
                  {category_spent?.map(c => (
                     <Progress page="dashboard_category" key={c.category_id} id={c.category_id} color={c.category_hex} name={c.category_name} current={c.total_amount} max={c.category_budget} symbol={toggle === 'PHP' ? '₱' : '$'} />
                  ))}
               </div>
            </div>
            {/* Right half */}
            <div className="flex flex-col gap-4 col-span-2">
               <div className="bg-(--surface-2) border border-(--border) rounded-lg p-4 gap-3 flex flex-col max-h-50 overflow-hidden">
                  <h1 className="text-xl" >Notifications</h1>
                  <div>
                     {notifications?.map(notif => (
                        <div key={notif.notify_at} className="border-b border-(--border) p-1 " >
                           <h2>{notif.message}</h2>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="bg-(--surface-2) rounded-lg p-4 border border-(--border) flex flex-col gap-3 ">
                  <h1 className="text-xl" >Budget this month</h1>
                  <div className="flex flex-col gap-2" >
                     <Progress page="dashboard_budget"  name={'PHP'} left={budget.php_left}  current={budget.php_spent} max={budget.php_budget} symbol={'₱'} />
                     <Progress page="dashboard_budget" name={'USD'} left={budget.usd_left} current={budget.usd_spent} max={budget.usd_budget} symbol={'$'} />
                  </div>
               </div>
            </div>
         </section>
      </main>
   )
}