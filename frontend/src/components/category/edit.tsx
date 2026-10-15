import { useState } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function CategoryEdit(props:any) {
   const cat = props.category
   const [editing, set_editing] = useState<boolean>(false)

   const [new_category_name, set_new_category_name] = useState(cat.name)
   const [new_category_color, set_new_category_color] = useState(cat.color_hex)
   const edit_category = async (e: any)=> {
      set_editing(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('edit/category', {
            method: 'PUT',
            body: JSON.stringify({ category_id: cat.id, new_category_name, new_category_color })
         })
         props.set_refresh((prev:boolean)=> !prev)
         props.close()
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error('Editing new category failed. ', err)
      } finally { set_editing(false) }
   }

   return (
      <main onClick={()=> props.close()}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
         <form onSubmit={(e)=> edit_category(e)} onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
            <input type="text" value={new_category_name} onChange={(e) => set_new_category_name(e.target.value)}  placeholder="Category Name" required autoFocus  className="px-4 py-2.5 rounded-lg w-full" />
            <label htmlFor="color" className="text-(--text-primary) mt-4 " >Choose color</label>
            <input type="color" id="color" value={new_category_color} onChange={(e)=> set_new_category_color(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg" />
            <button type="submit" disabled={editing}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >{editing ? 'Saving Changes...' : 'Save Changes'}</button>
         </form>
      </main>
   )
}