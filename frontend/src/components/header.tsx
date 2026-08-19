
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRightFromBracket, faBell, faExclamation, faBars, faCircleCheck, faMagnifyingGlassChart, faClock } from "@fortawesome/free-solid-svg-icons"
import { useNavigate } from "react-router"
import { custom_fetch } from "../services/api"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"

export default function Header() {
   const navigate = useNavigate()

   // Logout
   const [show_logout, set_show_logout] = useState(false)
   const [loading, set_loading] = useState(false)
   const logout = async (e: React.FormEvent)=> {
      e.preventDefault()
      set_loading(true)
      try {
         const data = await custom_fetch('logout')
         navigate('/login')
         toast.success(data.message)
      } catch(err) {console.log('Error logout: ', err)}
      finally {set_loading(false)}
   }

   const type_color:any = {
      ONE_WEEK_BEFORE: 'text-(--fill-accent)',
      THREE_DAYS_BEFORE: 'text-(--fill-safe)',
      ONE_DAY_BEFORE: 'text-(--fill-warning)',
      DUE_TODAY: 'text-(--fill-danger)',
   }
   const notif_icon:any = {
      ONE_WEEK_BEFORE: faCircleCheck,
      THREE_DAYS_BEFORE: faBell,
      ONE_DAY_BEFORE: faClock,
      DUE_TODAY: faExclamation,
   }

   const [show_notif, set_show_notif] = useState(false)
   const [notif_count, set_notif_count] = useState(0)
   const [notifications, set_notifications] = useState<any[]>([])
   const get_notifications = async ()=> {
      try {
         const data = await custom_fetch('notification')
         set_notifications(data.formatted_notifications)
         set_notif_count(data.notif_count)
      } catch (error) {console.log('Error getting notifications: ', error)}
   }
   useEffect(()=> { get_notifications() }, [])

   // Mark all as read
   const [marking_all, set_marking_all] = useState(false)
   const mark_all = async ()=> {
      set_marking_all(true)
      try {
         const data = await custom_fetch('notification/mark_all_as_read', { method: 'PUT' })
         await get_notifications() // single, deliberate refetch — no race
         console.log(data.message)
      } catch (error) {console.log('Error marking all notifications as read: ', error)}
      finally {set_marking_all(false)}
   }

   // Menu
   const[show_menu, set_show_menu] = useState(false)

   return (
      <main className=" lg:px-8 gap-8 py-2 rounded-lg w-full flex justify-between " >
         <div className="flex" >
            <p className="font-semibold text-lg md:text-xl lg:text-2xl text-(--text-primary)" >$ubTrack</p>
            <FontAwesomeIcon icon={faMagnifyingGlassChart} className=' text-(--text-primary) text-2xl ' />
         </div>
         {/* Mobile */}
         {window.innerWidth < 768 && (
            <section className="flex gap-2 items-center" >
               <div className="relative" >
                  {notif_count !== 0 && (<h1 className="absolute text-sm md:text-md lg:text-lg -right-2 -top-2 p-[0.2rem] rounded-full bg-(--fill-danger) " >{notif_count}</h1>)}
                  <FontAwesomeIcon icon={faBell} onClick={()=> set_show_notif(!show_notif)}  className="text-(--text-primary) text-xl cursor-pointer hover:text-(--text-secondary) active:text-(--text-primary) " />
               </div>
               <FontAwesomeIcon onClick={()=> set_show_menu(prev => !prev)} icon={faBars} className="text-(--text-primary) text-2xl cursor-pointer active:text-(--text-secondary) " />
               {show_menu && (
                  <div className="absolute right-0 top-15 w-2/3 border border-(--border) bg-(--surface-1) flex flex-col gap-3 rounded text-(--text-primary) p-2 *:border-b *:border-(--border) *:p-1 z-50" >
                     <button onClick={()=> {navigate('/dashboard', {replace: true}); set_show_menu(false)}}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Dashboard</button>
                     <button onClick={()=> {navigate('/subscription', {replace: true}); set_show_menu(false)}}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Subscription</button>
                     <button onClick={()=> {navigate('/category', {replace: true}); set_show_menu(false)}}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Category</button>
                     <button onClick={()=> {navigate('/budget', {replace: true}); set_show_menu(false)}}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Budget</button>
                     <button onClick={()=> {navigate('/history', {replace: true}); set_show_menu(false)}}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >History</button>
                     <button onClick={()=> {set_show_logout(true); set_show_menu(false)}}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" ><FontAwesomeIcon icon={faRightFromBracket} /> Logout</button>
                  </div>
               )}
            </section>
         )}
         {/* Tablet and larger */}
         {window.innerWidth >= 768 && (
            <section className=" gap-3 lg:gap-5 flex items-center text-base " >
               <button onClick={()=> navigate('/dashboard', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Dashboard</button>
               <button onClick={()=> navigate('/subscription', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Subscription</button>
               <button onClick={()=> navigate('/category', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Category</button>
               <button onClick={()=> navigate('/budget', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >Budget</button>
               <button onClick={()=> navigate('/history', {replace: true})}  className="text-(--text-primary) hover:text-(--text-secondary) transition-colors duration-200" >History</button>
               <div className="relative" >
                  {notif_count !== 0 && (<h1 className="absolute text-sm md:text-md lg:text-lg -right-2 -top-2 p-[0.2rem] rounded-full bg-(--fill-danger) " >{notif_count}</h1>)}
                  <FontAwesomeIcon icon={faBell} onClick={()=> set_show_notif(!show_notif)}  className="text-(--text-primary) text-lg md:text-xl lg:text-2xl cursor-pointer hover:text-(--text-secondary) active:text-(--text-primary) " />
               </div>
               <FontAwesomeIcon icon={faRightFromBracket} onClick={()=> set_show_logout(true)}  className="text-(--text-primary) text-lg md:text-xl lg:text-2xl cursor-pointer hover:text-(--text-secondary) active:text-(--text-primary) " />
            </section>
         )}

         {show_logout && (
            <section onClick={()=> set_show_logout(false)}  className="absolute top-0 left-0 w-full h-screen bg-black/50 z-50 flex justify-center items-center" >
               <div onClick={(e)=> e.stopPropagation()}  className="bg-(--surface-1) p-8 rounded-lg flex flex-col gap-4" >
                  <h1 className="text-sm font-semibold" >Are you sure you want to logout?</h1>
                  <section className="flex gap-4 justify-center" >
                     <h1 onClick={()=> set_show_logout(false)}  className="bg-(--surface-2) px-4 py-2 rounded-lg hover:bg-(--border) transition-all duration-200 cursor-pointer text-sm" >Cancel</h1>
                     <h1 onClick={logout}  className="bg-red-700 px-4 py-2 rounded-lg text-(--text-primary) hover:bg-red-500 transition-all duration-200 cursor-pointer text-sm" >{loading ? 'Logging out...' : 'Logout'}</h1>
                  </section>
               </div>
            </section>
         )}

         {show_notif && (
            <section className="absolute w-1/3 h-2/3 flex flex-col border border-(--border) bg-(--surface-2) rounded-lg right-4 top-16 gap-2 overflow-y-auto overflow-x-hidden z-50" >
               <div className="flex justify-between p-2 " >
                  <h1 className="text-xl" >Notifications</h1>
                  <p onClick={mark_all}  className="text-(--fill-accent) cursor-pointer hover:text-blue-400 active:text-(--fill-accent) " >{marking_all ? 'Marking...' : 'Mark all as read'}</p>
               </div>
               <div>
                  {notifications.length !== 0 ? notifications.map(notif => (
                     <div key={notif.notify_at}  className={` ${notif.is_read ? 'opacity-50' : 'opacity-100'} border-b border-(--border) p-2 pr-4 flex items-center gap-2 justify-between `} >
                        <div className="flex gap-2 items-center" >
                           <FontAwesomeIcon className={`${type_color[notif.type] || 'text-(--border)'} text-xl`} icon={notif_icon[notif.type]} />
                              <div className="flex flex-col" >
                                 <h1 className="font-semibold text-sm" >{notif.subscription.name}</h1>
                                 <h2 className="text-xs" >{notif.message}</h2>
                              </div>
                        </div>
                        <div className="flex flex-col items-end" >
                           <h1 className="text-xs" >{notif.subscription.currency === 'PHP' ? '₱' : '$'} {notif.amount}</h1>
                           <h1 className="text-xs" >{notif.month} {notif.day}</h1>
                        </div>
                     </div>
                  )) : (
                     <h2 className='text-xl mt-10 place-self-center' >No notification.</h2>
                  )}
               </div>
            </section>
         )}
      </main>
   )
}