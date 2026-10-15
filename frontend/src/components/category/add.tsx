import { useState } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"

export default function CategoryAdd(props:any) {
   const [adding, set_adding] = useState(false)

   // Add category
   const [category_name, set_category_name] = useState("")
   const [category_color, set_category_color] = useState("#898781")
   const add_category = async (e: any)=> {
      set_adding(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('add/category', {
            method: 'POST',
            body: JSON.stringify({ category_name, category_color })
         })
         props.set_refresh((prev:boolean)=> !prev)
         props.close()
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error('Adding new category failed. ', err)
      } finally { set_adding(false) }
   }

   return (
      <main onClick={()=> props.close()}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
         <form onSubmit={(e)=> add_category(e)} onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
            <input type="text" value={category_name} onChange={(e) => set_category_name(e.target.value)}  placeholder="Category Name" required autoFocus  className="px-4 py-2.5 rounded-lg w-full" />
            <label htmlFor="color" className="text-(--text-primary) mt-4 " >Choose color</label>
            <input type="color" id="color" value={category_color} onChange={(e)=> set_category_color(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg" />
            <button type="submit" disabled={adding}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >{adding ? 'Adding Category...' : 'Add Category'}</button>
         </form>
      </main>
   )
}