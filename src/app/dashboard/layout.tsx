import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200">
      <Sidebar />
      {/* Spacer für Mobile: Reserviert exakt die Höhe des Headers inkl. Safe-Area */}
      <div 
        className="md:hidden w-full shrink-0" 
        style={{ height: 'calc(4rem + env(safe-area-inset-top, 0px))' }} 
      />
      <main className="md:pl-16 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}