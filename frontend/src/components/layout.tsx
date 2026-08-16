import { Outlet } from "react-router";
import Header from "./header";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { custom_fetch } from "../services/api";

export default function Layout() {
   const navigate = useNavigate()
   // Check if logged in
   const [checking, set_checking] = useState(false)
   useEffect(()=> {
      set_checking(true)
      const check_login = async ()=> {
         try {
            await custom_fetch('me')
         } catch(err) {
            navigate('login', {replace: true})
            console.log('Error checking if logged in: ', err)
         } finally {set_checking(false)}
      }; check_login()
   }, [])

   {checking && ( <h2  className="w-full h-full bg-black/50 absolute text-3xl " >Checking...</h2> )}

   return (
      
      <main className="flex flex-col p-4 h-full bg-(--page-bg) gap-4 " >
         <Header/>
         <section ><Outlet/></section>
      </main>
   )
}