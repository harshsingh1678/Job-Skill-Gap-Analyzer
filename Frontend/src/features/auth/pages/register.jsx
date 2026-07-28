import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { GoogleLogin } from '@react-oauth/google'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Register = () => {

    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const { handleRegister, handleGoogleLogin, actionLoading } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleRegister({ username, email, password })
        navigate("/")
    }

    const onGoogleSuccess = async (credentialResponse) => {
        await handleGoogleLogin(credentialResponse.credential)
        navigate('/')
    }

    return (
        <main>
            <div className="form-container">
                <h1>Register</h1>

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name='username' placeholder='Enter username' />
                    </div>
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
                        {actionLoading ? 'Please wait...' : 'Register'}
                    </button>

                </form>

                <div className='or-divider'><span>OR</span></div>

                <GoogleLogin
                    onSuccess={onGoogleSuccess}
                    onError={() => console.log('Google login failed')}
                />

                <p>Already have an account? <Link to={"/login"} >Login</Link> </p>
            </div>
        </main>
    )
}

export default Register