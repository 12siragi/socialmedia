import axios from "axios";
import { useNavigate } from "react-router-dom";

function useUserActions() {
    const navigate = useNavigate();
    const baseURL = "http://localhost:8000/api";

    // Login function
    const login = (data) => {
        return axios.post(`${baseURL}/auth/login/`, data)
            .then((res) => {
                setUserData(res.data);
                navigate("/");
                return res.data;
            });
    };

    // Register function
    const register = (data) => {
        return axios.post(`${baseURL}/auth/register/`, data)
            .then((res) => {
                setUserData(res.data);
                navigate("/");
                return res.data;
            });
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem("auth");
        navigate("/login/");
    };

    // Helper function to set user data in localStorage
    const setUserData = (data) => {
        localStorage.setItem(
            "auth",
            JSON.stringify({
                access: data.tokens.access,
                refresh: data.tokens.refresh,
                user: data,
            })
        );
    };

    // Helper function to get current user
    const getUser = () => {
        const auth = JSON.parse(localStorage.getItem("auth"));
        return auth?.user;
    };

    // Helper function to get access token
    const getAccessToken = () => {
        const auth = JSON.parse(localStorage.getItem("auth"));
        return auth?.access;
    };

    // Helper function to get refresh token
    const getRefreshToken = () => {
        const auth = JSON.parse(localStorage.getItem("auth"));
        return auth?.refresh;
    };

    return {
        login,
        register,
        logout,
        getUser,
        getAccessToken,
        getRefreshToken,
    };
}

export default useUserActions;
