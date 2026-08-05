import { useEffect, useState } from "react"
import { custom_fetch } from "../services/api"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"
import toast from "react-hot-toast"


export default function Category() {
   const [refresh, set_refresh] = useState(false)

   // Get category summary
   const [category_summary, set_category_summary] = useState([])
   const [loading, set_loading] = useState(false)
   useEffect(() => {
      const get_categories = async () => {
         set_loading(true)
         try {
            const data = await custom_fetch('category_summary')
            set_category_summary(data.category_summary)
         } catch(err) {console.log('Error getting categories: ', err)}
         finally {set_loading(false)}
      }
      get_categories()
   }, [refresh])
   console.log(category_summary)

   // Add category
   const [show_add_category, set_show_add_category] = useState(false)
   const [category_name, set_category_name] = useState("")
   const [category_color, set_category_color] = useState("")
   const add_category = async ()=> {
      try {
         const data = await custom_fetch('add/category', {
            method: 'POST',
            body: JSON.stringify({ category_name, category_color })
         })
         set_refresh(!refresh)
         toast.success(data.message)
      } catch (error) {
         toast.error('Adding category failed')
         console.error('Adding new category failed. ', error)
      }
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
   const edit_category = async ()=> {
      try {
         const data = await custom_fetch('edit/category', {
            method: 'PUT',
            body: JSON.stringify({ category_id, new_category_name, new_category_color })
         })
         set_refresh(!refresh)
         toast.success(data.message)
      } catch (error) {
         toast.error('Editing category failed')
         console.error('Editing new category failed. ', error)
      }
   }

   // Delete category
   const [show_delete_category, set_show_delete_category] = useState(false)
   const [cat_id_to_delete, set_cat_id_to_delete] = useState()
   const [cat_name_to_delete, set_cat_name_to_delete] = useState()
   const open_delete = (cat: any)=> {
      set_cat_id_to_delete(cat.id)
      set_cat_name_to_delete(cat.name)
      set_show_delete_category(true)
      console.log(cat.id)
   }
   const delete_category = async ()=> {
      try {
         const data = await custom_fetch('delete/category', {
            method: 'DELETE',
            body: JSON.stringify({ category_id: cat_id_to_delete })
         })
         set_refresh(!refresh)
         set_show_delete_category(false)
         toast.success(data.message)
      } catch (error) {
         toast.error('Deleting category failed')
         console.error('Adding new category failed. ', error)
      }
   }

   if(loading) return (<h2 className="text-6xl place-self-center" >Loading Categories...</h2>)

   return (
      <main className="flex gap-4 w-full h-full flex-wrap" >
         {/* Add category button */}
         <div onClick={()=> set_show_add_category(true)}  className="flex flex-col justify-center items-center w-fit min-w-2xs p-4 rounded-lg bg-(--surface-2) border border-(--border) cursor-pointer hover:bg-(--surface-1) active:ring-2 ring-blue-950 "  >
            <h2 className="text-7xl" >+</h2>
            <h2>Add Category</h2>
         </div>
         {/* Category cards */}
         {category_summary.map((cat: any) => (
            <div key={cat.id} className="flex flex-col gap-2 w-fit min-w-2xs p-4 rounded-lg bg-(--surface-2) border border-(--border) " >
               <div style={{ background: cat.color_hex }}  className="w-full h-6 rounded bg-blue-900" ></div>
               <h1 className="text-2xl" >{cat.name}</h1>
               <h2>{cat.subs_count} Subs</h2>
               <h2>₱ {cat.php_sub_amount} | $ {cat.usd_sub_amount}</h2>
               <div className="flex justify-end text-2xl gap-4" >
                  <FontAwesomeIcon icon={faPenToSquare} onClick={()=> open_edit(cat)}  className="text-blue-800 hover:text-blue-700 cursor-pointer" />
                  <FontAwesomeIcon icon={faTrash} onClick={()=> open_delete(cat)}  className="cursor-pointer text-red-800 hover:text-red-700 " />
               </div>
            </div>
         ))}

         {/* Add category form */}
         {show_add_category && (
            <section onClick={()=> set_show_add_category(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <input type="text" value={category_name} onChange={(e) => set_category_name(e.target.value)}  placeholder="Category Name" required  className="px-4 py-2.5 rounded-lg w-full" />
                  <label htmlFor="color" className="text-(--text-primary) mt-4 " >Choose color</label>
                  <input type="color" id="color" value={category_color} onChange={(e)=> set_category_color(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg" />
                  <button onClick={add_category}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Add Category</button>
               </form>
            </section>
         )}

         {/* Edit category form */}
         {show_edit_category && (
            <section onClick={()=> set_show_edit_category(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <form onClick={(e)=> e.stopPropagation()} className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <input type="text" value={new_category_name} onChange={(e) => set_new_category_name(e.target.value)}  placeholder="Category Name" required  className="px-4 py-2.5 rounded-lg w-full" />
                  <label htmlFor="color" className="text-(--text-primary) mt-4 " >Choose color</label>
                  <input type="color" id="color" value={new_category_color} onChange={(e)=> set_new_category_color(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg" />
                  <button onClick={edit_category}  className="px-4 py-2.5 outline-none active:bg-blue-700 mt-4 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Save changes</button>
               </form>
            </section>
         )}

         {/* Delete category confirmation */}
         {show_delete_category && (
            <section onClick={()=> set_show_delete_category(false)}  className=" top-0 left-0 w-full h-full absolute bg-black/50 flex justify-center items-center" >
               <div onClick={(e)=> {e.stopPropagation(); e.preventDefault()}}  className="w-full max-w-md bg-(--surface-1) rounded-xl p-8 gap-2 flex flex-col" >
                  <h1 className="text-xl font-bold text-center" >Are you sure you want to delete {cat_name_to_delete} category?</h1>
                  <div className="flex gap-4 mt-4 justify-center" >
                     <button onClick={delete_category}  className="px-4 py-2.5 outline-none active:bg-red-700 rounded-lg bg-red-900 text-(--text-primary) hover:bg-red-800 transition-colors" >Delete</button>
                     <button onClick={()=> set_show_delete_category(false)}  className="px-4 py-2.5 outline-none active:bg-blue-700 rounded-lg bg-blue-900 text-(--text-primary) hover:bg-blue-800 transition-colors" >Cancel</button>
                  </div>
               </div>
            </section>
         )}
      </main>
   )
}