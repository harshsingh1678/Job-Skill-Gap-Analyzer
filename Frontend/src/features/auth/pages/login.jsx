import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { GoogleLogin } from '@react-oauth/google'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { handleLogin, handleGoogleLogin, actionLoading } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleLogin({ email, password })
        navigate('/')
    }

    const onGoogleSuccess = async (credentialResponse) => {
        await handleGoogleLogin(credentialResponse.credential)
        navigate('/')
    }


    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>
                    <button className='button primary-button' disabled={actionLoading}>
                        {actionLoading ? 'Please wait...' : 'Login'}
                    </button>
                </form>

                <div className='or-divider'><span>OR</span></div>

                <GoogleLogin
                    onSuccess={onGoogleSuccess}
                    onError={() => console.log('Google login failed')}
                />

                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login