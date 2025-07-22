import React, { useContext, useState } from 'react'
import bg from "../assets/authBg.png"
import authVideo from "../assets/auth-bg-video.mp4"; 
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios";
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

function Signin() {
    const [showPassword, setShowPassword] = useState(false)
    const { serverUrl, setUserData } = useContext(userDataContext)
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")
    

    const handleSignin = async (e) => {
        e.preventDefault()
        setErr("")
        setLoading(true)

        try {
            const result = await axios.post(`${serverUrl}/api/auth/signin`, {
                email,
                password
            }, { withCredentials: true })

            setUserData(result.data)
            setLoading(false)
            console.log("Signin successful:", result.data)
            // toast.success("Sign in successful!")
            navigate("/customize")

        } catch (error) {
            console.error("Signin failed:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            })

            setUserData(null)
            setErr(error?.response?.data?.message || "Network error: Unable to connect to server.")
            setLoading(false)

            // toast.error(error?.response?.data?.message || "Network error")
        }
    }

    return (
        // <div
        //     className='w-full h-[100vh] flex justify-center items-center'
        //     style={{
        //         backgroundImage: `url(${bg})`,
        //         backgroundSize: 'cover',
        //         backgroundPosition: 'center'
        //     }}
        // >
        <div className='w-full h-[100vh] flex justify-center items-center relative overflow-hidden'>
             {/* Video Background */}
            <video 
                autoPlay 
                loop 
                muted 
                playsInline

                className='absolute w-full h-full object-cover z-0'
            >
                <source src={authVideo} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <form
                className='w-[90%] h-[600px] max-w-[500px] bg-[#00000062] backdrop-blur shadow-lg shadow-black flex flex-col items-center justify-center gap-[20px] px-[20px]'
                onSubmit={handleSignin}
            >
                <h1 className='text-white text-[30px] font-semibold'>
                    Sign In <span className='text-blue-400'>Virtual Assistant</span>
                </h1>

                <input
                    type="email"
                    placeholder='Email'
                    className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]'
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                />

                <div className='w-full h-[60px] border-2 border-white bg-transparent text-white rounded-full text-[18px] relative'>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className='w-full h-full rounded-full outline-none bg-transparent placeholder-gray-300 px-[20px] py-[10px]'
                        required
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                    />
                    {!showPassword ? (
                        <FaEye
                            className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer'
                            onClick={() => setShowPassword(true)}
                        />
                    ) : (
                        <FaEyeSlash
                            className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer'
                            onClick={() => setShowPassword(false)}
                        />
                    )}
                </div>

                {err.length > 0 && (
                    <p className='text-red-500 text-[17px]'>* {err}</p>
                )}

                <button
                    className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px]'
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Sign In"}
                </button>

                <p className='text-white text-[18px] cursor-pointer' onClick={() => navigate("/signup")}>
                    Want to create a new account? <span className='text-blue-400'>Sign Up</span>
                </p>
            </form>
        </div>
    )
}

export default Signin
