import { useState } from "react"
import SubscriptionAdd from "../components/subscription/add"
import SubscriptionGet from "../components/subscription/get"
import SubscriptionEdit from "../components/subscription/edit"
import SubscriptionDelete from "../components/subscription/delete"

export default function Subscription() {
   const [refresh, set_refresh] = useState<boolean>(false)

   const [show_add_sub, set_show_add_sub] = useState<boolean>(false)
   const [sub_to_edit, set_sub_to_edit] = useState<any | null>(null)
   const [sub_to_delete, set_sub_to_delete] = useState<any | null>(null)

   return (
      <main className="flex flex-col gap-4 w-full h-full overflow-x-hidden overflow-y-auto" >
         {/* Subscription List */}
         <SubscriptionGet 
            open={()=> set_show_add_sub(true)}
            set_show_add_sub={set_show_add_sub} 
            set_sub_to_edit={set_sub_to_edit}
            set_sub_to_delete={set_sub_to_delete}
            refresh={refresh}
         />

         {/* Add Form */}
         {show_add_sub && (
            <SubscriptionAdd 
               close={()=> set_show_add_sub(false)} 
               set_refresh={set_refresh}
            />
         )}    

         {/* Edit form */}
         {sub_to_edit && (
            <SubscriptionEdit 
               subscription={sub_to_edit}
               close={()=> set_sub_to_edit(null)}
               set_refresh={set_refresh} 
            />
         )}

         {/* Delete Confirmation */}
         {sub_to_delete && (
            <SubscriptionDelete
               subscription={sub_to_delete}
               close={()=> set_sub_to_delete(null)}
               set_refresh={set_refresh}
            />
         )}
      </main>
   )
}