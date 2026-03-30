export default function Spinner({ size = 'md', center = false }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  const el = (
    <div className={`${sizeMap[size]} border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin`} />
  )
  if (center) {
    return <div className="flex justify-center items-center py-16">{el}</div>
  }
  return el
}
