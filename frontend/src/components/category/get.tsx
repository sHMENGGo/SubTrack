import { useState, useEffect } from "react"
import { custom_fetch } from "../../services/api"
import toast from "react-hot-toast"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons"

export default function CategoryGet(props:any) {

   // Get category summary
   const [category_summary, set_category_summary] = useState([])
   const [loading, set_loading] = useState(false)
   useEffect(() => {
      const get_categories = async () => {
         set_loading(true)
         try {
            const data = await custom_fetch('category/summary')
            set_category_summary(data.category_summary)
         } catch (err: any) {
            toast.error(err.message)
            console.log('Error getting categories: ', err)
         } finally { set_loading(false) }
      }
      get_categories()
   }, [props.refresh])

   if(loading) return (<h2 className="text-3xl mt-5 place-self-center" >Loading Categories...</h2>)

   return (
      <main className="flex flex-col md:flex-row gap-4 flex-wrap" >
         {/* Add category button */}
         <div onClick={()=>props.open()}  className="flex flex-col justify-center items-center w-full md:w-2/9 p-4 rounded-lg bg-(--surface-2) border border-(--border) cursor-pointer hover:bg-(--surface-1) active:ring-2 ring-blue-950 "  >
            <h2 className="text-5xl" >+</h2>
            <h2 className="text-sm" >Add Category</h2>
         </div>
         
         {/* Category list */}
         {category_summary.length !== 0 ? category_summary.map((cat: any) => (
            <div key={cat.id} className="flex flex-col gap-2 w-full md:w-2/9 p-4 rounded-lg bg-(--surface-2) border border-(--border) " >
               <div style={{ background: cat.color_hex }}  className="w-full h-6 rounded bg-blue-900" ></div>
               <h1 className="text-lg" >{cat.name}</h1>
               <h2 className="text-sm" >{cat.subs_count} Subs</h2>
               <h2 className="text-sm" >Total: ₱ {cat.php_sub_amount} | $ {cat.usd_sub_amount}</h2>
               <div className="flex justify-end text-xl gap-2" >
                  <FontAwesomeIcon icon={faPenToSquare} onClick={()=> props.set_cat_to_edit(cat)}  className="text-(--fill-accent) hover:text-blue-400 active:text-(--fill-accent) cursor-pointer" />
                  <FontAwesomeIcon icon={faTrash} onClick={()=> props.set_cat_to_delete(cat)}  className="cursor-pointer text-(--fill-danger) active:text-(--fill-danger) hover:text-red-500 " />
               </div>
            </div>
         )) : (
            <h2 className="text-3xl w-full text-center" >No Category.</h2>
         )}
      </main>
   )
}