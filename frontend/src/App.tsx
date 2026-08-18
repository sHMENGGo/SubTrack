
import { BrowserRouter, Routes, Route } from "react-router"
import Login from './pages/login'
import Layout from "./components/layout"
import Dashboard from "./pages/dashboard"
import Subscription from "./pages/subscription"
import Category from "./pages/category"
import Budget from "./pages/budget"
import History from "./pages/history"
import Toaster from "./components/toaster"

function App() {
  	return (	
		<main className="w-full min-h-screen bg-(--page-bg) overflow-y-auto overflow-x-hidden md:text-shift-up lg:text-shift-up2 ">
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Login />} />
					<Route path="/login" element={<Login />} />
					<Route element={<Layout/>} >
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/subscription" element={<Subscription />} />
						<Route path="/category" element={<Category />} />
						<Route path="/budget" element={<Budget />} />
						<Route path="/history" element={<History />} />
					</Route>
				</Routes>
			</BrowserRouter>
			<Toaster />
		</main>
  	)
}

export default App
