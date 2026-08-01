// 1. Define your prop types and mark them as optional with "?"
interface ProgressProps {
  id?: string | number;
  name?: string;
  left?: number;
  spent?: number;
  total?: number;
  symbol?: string;
  color?: string;
}

// 2. Assign default values directly in the parameters
export default function Progress({
  id = Math.random().toString(36).substring(2, 15), // Generate a random ID if not provided
  name = "Unnamed Category", 
  left = 0,
  spent = 0, 
  total = 100, // Default to 100 to prevent division by zero (NaN)
  symbol = "₱", 
  color = "#3b82f6" // Default to a standard blue
}: ProgressProps) {
   
   // If total is 0 (passed intentionally), fallback to 1 to avoid Infinity/NaN in CSS
   const safeTotal = total > 0 ? total : 1; 
   const bar_width = (spent / safeTotal) * 100;

   return (
      <main key={id} className="w-full">
         <section className="flex justify-between items-center">
            <div className="flex gap-10 items-center" >
               <h1>{name}</h1>
               {left !== 0 && <h2>{symbol} {spent} / {symbol} {total}</h2>}
            </div>
            {left !== 0 && <h2>{symbol} {left} left</h2>}
            {left === 0 && <h2>{symbol} {spent} / {symbol} {total}</h2>}
         </section>
         {/* Progress */}
         <div className="w-full h-2 bg-gray-500 rounded-full relative">
            <div 
               className="absolute h-2 rounded-full transition-all duration-500" 
               style={{ 
                  background: bar_width > 100 ? '#bf0000' : color, 
                  width: `${bar_width > 100 ? 100 : bar_width}%` 
               }}
            ></div>
         </div>
      </main>
   )
}