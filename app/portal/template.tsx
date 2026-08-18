export default function PortalTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-content-enter min-h-0">
      {children}
    </div>
  )
}
