import { useNavigate } from "react-router"
import { useAuth } from "../hooks/useAuth"

const Protected = ({ children }) => {
    const { loading, user } = useAuth()
    const navigate = useNavigate()

    if (loading) {
        return (<main><h1>Loading...</h1></main>)
    }

    if (!user) {
        navigate('/login')
    }

    return children
}

export default Protected