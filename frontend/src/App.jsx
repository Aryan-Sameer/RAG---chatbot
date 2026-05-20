import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Navbar from './components/Navbar';

function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />
    },
    {
      path: "/admin",
      element: <Admin />
    },
  ])

  return (
    <div className="max-h-screen">
      <Navbar />
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
