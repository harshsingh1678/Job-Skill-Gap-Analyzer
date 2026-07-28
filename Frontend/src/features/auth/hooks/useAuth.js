import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe, googleLogin } from "../services/auth.api";


export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const [actionLoading, setActionLoading] = useState(false)


    const handleLogin = async ({ email, password }) => {
        setActionLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
        } catch (err) {

        } finally {
            setActionLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setActionLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
        } catch (err) {

        } finally {
            setActionLoading(false)
        }
    }

    const handleLogout = async () => {
        setActionLoading(true)
        try {
            const data = await logout()
            setUser(null)
        } catch (err) {

        } finally {
            setActionLoading(false)
        }
    }

    const handleGoogleLogin = async (credential) => {
        setActionLoading(true)
        try {
            const data = await googleLogin(credential)
            setUser(data.user)
        } catch (err) {

        } finally {
            setActionLoading(false)
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            try {

                const data = await getMe()
                setUser(data.user)
            } catch (err) { } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    return { user, loading, actionLoading, handleRegister, handleLogin, handleLogout, handleGoogleLogin }
}