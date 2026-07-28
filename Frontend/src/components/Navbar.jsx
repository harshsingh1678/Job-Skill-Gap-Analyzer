import React from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import './navbar.scss'

const Navbar = () => {
    const { user, handleLogout, actionLoading } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    return (
        <header className='app-navbar'>
            <div className='app-navbar__brand' onClick={() => navigate('/')}>
                Interview<span className='highlight'>AI</span>
            </div>
            <div className='app-navbar__right'>
                {user && <span className='app-navbar__username'>{user.username}</span>}
                <button className='app-navbar__logout' onClick={onLogout} disabled={actionLoading}>
                    {actionLoading ? 'Logging out...' : 'Logout'}
                </button>
            </div>
        </header>
    )
}

export default Navbar