// 1. Define your prop types and mark them as optional with "?"
interface ProgressProps {
  id?: string | number;
  name?: string;
  left?: number;
  current?: number;
  max?: number;
  symbol?: string;
  color?: string;
  page?: string;
}

// 2. Assign default values directly in the parameters
export default function Progress({
  id = Math.random().toString(36).substring(2, 15), // Generate a random ID if not provided
  name = "", 
  left = 0,
  current = 0, 
  max = 0, // Default to 100 to prevent division by zero (NaN)
  symbol = "", 
  page = "",
  color = ""
}: ProgressProps) {
   
   // If total is 0 (passed intentionally), fallback to 1 to avoid Infinity/NaN in CSS
   const safe_max = max > 0 ? max : 1; 
   const bar_width = (current / safe_max) * 100;
   return (
      <main key={id} className="w-full">
         <section className="flex justify-between items-end">
            <div className={`flex ${page === 'budget' && window.innerWidth < 768 ? 'flex-col text-nowrap items-start' : ''} justify-between w-1/2 items-center`} >
               <h1 style={{ color: page === 'budget' ? color : 'var(--text-primary)' }}  className={` ${page === 'budget' ? 'text-lg' : 'text-sm'} truncate`} >{name}</h1>
               {page === 'budget' && <h2 className="text-xs" >{symbol} {current} of {symbol} {max}</h2>}
            </div>
            {page === 'dashboard_category' && <h2 className="text-xs text-nowrap md:text-wrap" >{symbol} {current} of {symbol} {max}</h2>}
            {page === 'dashboard_budget' && <h2 className="text-sm" >{symbol} {current} of {symbol} {max}</h2>}
            {page === 'budget' && <h2 className="text-xs" >{symbol} {left} left</h2>}
         </section>
         {/* Progress */}
         <div className="w-full h-2 bg-(--surface-1) rounded-full relative">
            <div 
               className={`${bar_width < 75 ? 'bg-(--fill-accent)' : 'bg(--fill-warning)'} ${bar_width >= 100 ? 'bg-(--fill-danger)' : ''} absolute h-2 rounded-full transition-all duration-500`} 
               style={{ width: `${bar_width > 100 ? 100 : bar_width}%` }}
            ></div>
         </div>
      </main>
   )
}