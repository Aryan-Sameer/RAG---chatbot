import React from 'react'

const Navbar = () => {

  const API = "http://localhost:8000";

  function checkHealth() {
    try {
      const res = fetch(`${API}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      console.log(res);
    } catch (error) {
      console.log(error.message);
    }
  }

  return (
    <div className='w-full bg-black text-white flex p-2 justify-around items-center'>
      <h1>BRO-GPT</h1>
      <button>Admin Panel</button>
      <button onClick={() => checkHealth()}>health check</button>
    </div>
  )
}

export default Navbar
