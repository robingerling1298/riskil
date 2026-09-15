import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200">
      <Sidebar />
      <main className="pt-16 md:pt-0 md:pl-16 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
