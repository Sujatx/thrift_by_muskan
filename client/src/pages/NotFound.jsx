import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh' }}>
      <h1>404 - Page Not Found</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Oops! This page doesn't exist.</p>
      <button onClick={() => navigate('/')} className="btn-primary">
        Back to Home
      </button>
    </main>
  )
}
