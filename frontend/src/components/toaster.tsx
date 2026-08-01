import { Toaster as HotToaster } from "react-hot-toast";

export default function Toaster() {
   return (
      <HotToaster 
         toastOptions = {{
            style: {background: 'khaki', color: 'black', font: 'semibold'}
         }}
      />
   )
}