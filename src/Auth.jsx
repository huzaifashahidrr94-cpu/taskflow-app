import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) alert(error.message)
        else alert('Account created! Check your inbox or log in.')
        setLoading(false)
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert(error.message)
        setLoading(false)
    }

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        })
        if (error) alert(error.message)
    }

    return (
        <div style={{ maxWidth: '380px', margin: '60px auto', padding: '24px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>Sign in to TaskFlow</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" disabled={loading} style={{ padding: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {loading ? 'Processing...' : 'Sign In'}
                </button>
                <button type="button" onClick={handleSignUp} disabled={loading} style={{ padding: '10px', cursor: 'pointer' }}>
                    Create New Account
                </button>
            </form>

            <p style={{ margin: '16px 0', color: '#666' }}>OR</p>

            <button
                onClick={handleGoogleLogin}
                style={{
                    padding: '10px',
                    width: '100%',
                    cursor: 'pointer',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                }}
            >
                Continue with Google
            </button>
        </div>
    )
}