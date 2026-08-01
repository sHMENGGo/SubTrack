
import { BrowserRouter, Routes, Route } from "react-router"
import Login from './pages/login'
import Register from "./pages/register"
import Layout from "./components/layout"
import Dashboard from "./pages/dashboard"

function App() {
  	return (	
		<main className="w-full h-screen bg-(--page-bg) flex justify-center items-center relative">
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Login />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route element={<Layout/>} >
						<Route path="/dashboard" element={<Dashboard />} />
					</Route>
				</Routes>
			</BrowserRouter>
			
		</main>
  	)
}

export default App
