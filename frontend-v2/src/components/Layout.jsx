import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="flex flex-col bg-bb-bg-primary min-h-screen text-white">
      <Navbar />
      <main className="flex-1 mx-auto px-4 py-6 w-full container">{children}</main>
      <Footer />
    </div>
  )
}
