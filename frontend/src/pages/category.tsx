import { useState } from "react"
import CategoryGet from '../components/category/get'
import CategoryAdd from "../components/category/add"
import CategoryEdit from "../components/category/edit"
import CategoryDelete from "../components/category/delete"

export default function Category() {
   const [refresh, set_refresh] = useState(false)

   const [show_add_category, set_show_add_category] = useState(false)
   const [cat_to_edit, set_cat_to_edit] = useState<any | null>(null)
   const [cat_to_delete, set_cat_to_delete] = useState<any | null>(null)

   return (
      <main className="flex w-full h-full justify-center" >
         {/* Category cards */}
         <CategoryGet
            refresh={refresh}
            open={()=> set_show_add_category(true)}
            set_cat_to_edit={set_cat_to_edit}
            set_cat_to_delete={set_cat_to_delete}
         />

         {/* Add category form */}
         {show_add_category && (
            <CategoryAdd
               set_refresh={set_refresh}
               close={()=> set_show_add_category(false)}
            />
         )}

         {/* Edit category form */}
         {cat_to_edit && (
            <CategoryEdit 
               set_refresh={set_refresh}
               close={()=> set_cat_to_edit(null)}
               category={cat_to_edit}
            />
         )}

         {/* Delete category confirmation */}
         {cat_to_delete && (
            <CategoryDelete 
               set_refresh={set_refresh}
               close={()=> set_cat_to_delete(null)}
               category={cat_to_delete}
            />
         )}
      </main>
   )
}