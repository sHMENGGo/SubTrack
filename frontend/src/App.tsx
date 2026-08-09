
import { BrowserRouter, Routes, Route } from "react-router"
import Login from './pages/login'
import Register from "./pages/register"
import Layout from "./components/layout"
import Dashboard from "./pages/dashboard"
import Subscription from "./pages/subscription"
import Category from "./pages/category"
import Budget from "./pages/budget"
import History from "./pages/history"
import Toaster from "./components/toaster"

function App() {
  	return (	
		<main className="w-full bg-(--page-bg) overflow-y-auto overflow-x-hidden">
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Login />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
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
