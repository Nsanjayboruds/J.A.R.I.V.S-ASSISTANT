
import React, { useContext, useRef, useState } from 'react'
import authVideo from "../assets/auth-bg-video.mp4";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios";

function SignUp() {
    const [showPassword, setShowPassword] = useState(false)
    const { serverUrl, userData, setUserData } = useContext(userDataContext)
    const navigate = useNavigate()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [loading, setloading] = useState(false)
    const [password, setPassword] = useState("")
    const [err, setErr] = useState("")

    const videoRef = useRef();

    const enableSound = () => {
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.play().catch(err => {
                console.warn("Autoplay with sound failed:", err);
            });
        }
    }

    const handleSignUp = async (e) => {
        e.preventDefault()
        setErr("")
        setloading(true)
        try {
            let result = await axios.post(`${serverUrl}/api/auth/signup`, {
                name, email, password
            }, { withCredentials: true })
            setUserData(result.data)
            setloading(false)
            navigate("/customize")
        } catch (error) {
            console.error("Signup failed:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            setUserData(null)
            setloading(false)
            setErr(error.response?.data?.message || "Network Error")
        }
    }

    return (
        <div className='w-full h-[100vh] flex justify-center items-center relative overflow-hidden' onClick={enableSound}>
            <video
                ref={videoRef}
                autoPlay
                loop
                muted // Starts muted; sound enabled on click
                className='absolute w-full h-full object-cover z-0'
            >
                <source src={authVideo} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <form
                className='w-[90%] h-[600px] max-w-[500px] bg-[#0000001f] backdrop-blur shadow-lg shadow-black flex flex-col items-center justify-center gap-[20px] px-[20px]'
                onSubmit={handleSignUp}
            >
                <h1 className="text-white text-4xl font-bold mb-6">
                    Welcome to
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 neon-text">
                        Virtual Assistant
                    </span>
                    <span className="text-xl font-light text-gray-400 mt-2 block tracking-wider">
                        Your <span className="text-cyan-300">AI-driven</span> future starts here
                    </span>
                </h1>

                <style>{`
                    .neon-text {
                        text-shadow: 0 0 5px rgba(100, 200, 255, 0.5),
                                     0 0 10px rgba(100, 180, 255, 0.4),
                                     0 0 20px rgba(80, 160, 255, 0.3);
                        animation: flicker 2s infinite alternate;
                    }
                    @keyframes flicker {
                        0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
                            opacity: 1;
                            text-shadow: 0 0 5px rgba(100, 200, 255, 0.5),
                                         0 0 10px rgba(100, 180, 255, 0.4),
                                         0 0 20px rgba(80, 160, 255, 0.3);
                        }
                        20%, 24%, 55% {
                            opacity: 0.8;
                            text-shadow: none;
                        }
                    }
                `}</style>

                <input type="text" placeholder='Enter your name' className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]' required onChange={(e) => setName(e.target.value)} value={name} />

                <input type="email" placeholder='Email' className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]' required onChange={(e) => setEmail(e.target.value)} value={email} />

                <div className='w-full h-[60px] border-2 border-white bg-transparent  text-white rounded-full text-[18px] relative'>
                    <input type={showPassword ? "text" : "password"} placeholder="password" className='w-full h-full rounded-full outline-none bg-transparent  placeholder-gray-300 px-[20px] py-[10px]' required onChange={(e) => setPassword(e.target.value)} value={password} />
                    {!showPassword && <FaEye className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer' onClick={() => setShowPassword(true)} />}
                    {showPassword && <FaEyeSlash className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer' onClick={() => setShowPassword(false)} />}
                </div>

                {err.length > 0 && <p className='text-red-500 text-[17px]'>*{err}</p>}

                <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] cursor-pointer' disabled={loading}>
                    {loading ? "loading..." : "signup"}
                </button>

                <p className='text-white text-[19px] cursor-pointer' onClick={() => navigate("/signin")}>
                    Already have an account? <span className='text-blue-400'>Sign In</span>
                </p>
            </form>
        </div>
    )
}

export default SignUp
