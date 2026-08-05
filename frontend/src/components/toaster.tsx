import { Toaster as HotToaster } from "react-hot-toast";

export default function Toaster() {
   return (
      <HotToaster 
         containerStyle = {{
            zIndex: 99999
         }}
         toastOptions = {{
            style: {
               background: '#1d4ed8', 
               color: 'var(--text-primary)', 
               font: 'semibold'
            }
         }}
      />
   )
}