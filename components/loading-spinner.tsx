export default function LoadingSpinner() {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
    </div>
  )
}
