import { useEffect, useState } from "react"
import { custom_fetch } from "../services/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"
import toast from "react-hot-toast"


export default function Category() {
   const [refresh, set_refresh] = useState(false)
   const [loading, set_loading] = useState(false)

   // Get category summary
   const [category_summary, set_category_summary] = useState([])
   const [loading_fetch, set_loading_fetch] = useState(false)
   useEffect(() => {
      const get_categories = async () => {
         set_loading_fetch(true)
         try {
            const data = await custom_fetch('category/category_summary')
            set_category_summary(data.category_summary)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting categories: ', err)
         } finally { set_loading_fetch(false) }
      }
      get_categories()
   }, [refresh])

   // Add category
   const [show_add_category, set_show_add_category] = useState(false)
   const [category_name, set_category_name] = useState("")
   const [category_color, set_category_color] = useState("#898781")
   const add_category = async (e: any)=> {
      set_loading(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('add/category', {
            method: 'POST',
            body: JSON.stringify({ category_name, category_color })
         })
         set_refresh(!refresh)
         set_show_add_category(false)
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error('Adding new category failed. ', err)
      } finally { set_loading(false) }
   }

   // Edit category
   const [show_edit_category, set_show_edit_category] = useState(false)
   const [category_id, set_category_id] = useState()
   const [new_category_name, set_new_category_name] = useState('')
   const [new_category_color, set_new_category_color] = useState('')
   const open_edit = (cat: any)=> {
      set_category_id(cat.id)
      set_new_category_name(cat.name)
      set_new_category_color(cat.color_hex)
      set_show_edit_category(true)
   }
   const edit_category = async (e: any)=> {
      set_loading(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('edit/category', {
            method: 'PUT',
            body: JSON.stringify({ category_id, new_category_name, new_category_color })
         })
         set_refresh(!refresh)
         set_show_edit_category(false)
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error('Editing new category failed. ', err)
      } finally { set_loading(false) }
   }

   // Delete category
   const [show_delete_category, set_show_delete_category] = useState(false)
   const [cat_id_to_delete, set_cat_id_to_delete] = useState()
   const [cat_name_to_delete, set_cat_name_to_delete] = useState()
   const open_delete = (cat: any)=> {
      set_cat_id_to_delete(cat.id)
      set_cat_name_to_delete(cat.name)
      set_show_delete_category(true)
   }
   const delete_category = async (e: any)=> {
      set_loading(true)
      e.preventDefault()
      try {
         const data = await custom_fetch('delete/category', {
            method: 'DELETE',
            body: JSON.stringify({ category_id: cat_id_to_delete })
         })
         set_refresh(!refresh)
         set_show_delete_category(false)
         toast.success(data.message)
      } catch (err: any) {
         toast.error(err.message)
         console.error('Adding new category failed. ', err)
      } finally { set_loading(false) }
   }

   if(loading_fetch) return (<h2 className="text-3xl mt-5 place-self-center" >Loading Categories...</h2>)

   return (
      <main className="flex gap-4 w-full h-full flex-wrap" >
         {/* Add category button */}
         <div onClick={()=> set_show_add_category(true)}  className="flex flex-col justify-center items-center w-fit min-w-2xs p-4 rounded-lg bg-(--surface-2) border border-(--border) cursor-pointer hover:bg-(--surface-1) active:ring-2 ring-blue-950 "  >
            <h2 className="text-5xl" >+</h2>
            <h2 className="text-sm" >Add Category</h2>
         </div>
         {/* Category cards */}
         {category_summary.length !== 0 ? category_summary.map((cat: any) => (
            <div key={cat.id} className="flex flex-col gap-2 w-fit min-w-2xs p-4 rounded-lg bg-(--surface-2) border border-(--border) " >
               <div style={{ background: cat.color_hex }}  className="w-full h-6 rounded bg-blue-900" ></div>
               <h1 className="text-lg" >{cat.name}</h1>
               <h2 className="text-sm" >{cat.subs_count} Subs</h2>
               <h2 className="text-sm" >Total: ₱ {cat.php_sub_amount} | $ {cat.usd_sub_amount}</h2>
               <div className="flex justify-end text-xl gap-2" >
                  <FontAwesomeIcon icon={faPenToSquare} onClick={()=> open_edit(cat)}  className="text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer" />
                  <FontAwesomeIcon icon={faTrash} onClick={()=> open_delete(cat)}  className="cursor-pointer text-(--fill-danger) active:text-(--fill-danger) hover:text-red-500 " />
               </div>
            </div>
         )) : (
            <h2 className="text-3xl w-full text-center" >No Category.</h2>
         )}

         {/* Add category form */}
         {show_add_category && (
            <section onClick={()=> set_show_add_category(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onSubmit={(e)=> add_category(e)} onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <input type="text" value={category_name} onChange={(e) => set_category_name(e.target.value)}  placeholder="Category Name" required autoFocus  className="px-4 py-2.5 rounded-lg w-full" />
                  <label htmlFor="color" className="text-(--text-primary) mt-4 " >Choose color</label>
                  <input type="color" id="color" value={category_color} onChange={(e)=> set_category_color(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg" />
                  <button type="submit" disabled={loading}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >{loading ? 'Adding Category...' : 'Add Category'}</button>
               </form>
            </section>
         )}

         {/* Edit category form */}
         {show_edit_category && (
            <section onClick={()=> set_show_edit_category(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onSubmit={(e)=> edit_category(e)} onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <input type="text" value={new_category_name} onChange={(e) => set_new_category_name(e.target.value)}  placeholder="Category Name" required autoFocus  className="px-4 py-2.5 rounded-lg w-full" />
                  <label htmlFor="color" className="text-(--text-primary) mt-4 " >Choose color</label>
                  <input type="color" id="color" value={new_category_color} onChange={(e)=> set_new_category_color(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg" />
                  <button type="submit" disabled={loading}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >{loading ? 'Saving Changes...' : 'Save Changes'}</button>
               </form>
            </section>
         )}

         {/* Delete category confirmation */}
         {show_delete_category && (
            <section onClick={()=> set_show_delete_category(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <div onClick={(e)=> {e.stopPropagation(); e.preventDefault()}}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <h1 className="text-xl font-bold text-center" >Are you sure you want to delete {cat_name_to_delete} category?</h1>
                  <div className="flex gap-4 mt-4 justify-center" >
                     <button onClick={(e)=> delete_category(e)} disabled={loading}  className="px-4 py-2.5 outline-none active:bg-red-700 rounded-lg bg-red-900 text-(--text-primary) hover:bg-red-800 transition-colors" >{loading ? 'Deleting...' : 'Delete'}</button>
                     <button onClick={()=> set_show_delete_category(false)}  className="px-4 py-2.5 outline-none active:bg-blue-700 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Cancel</button>
                  </div>
               </div>
            </section>
         )}
      </main>
   )
}