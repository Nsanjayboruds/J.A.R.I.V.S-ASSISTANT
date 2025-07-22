import React, { useContext, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import axios from 'axios'
import { MdKeyboardBackspace } from "react-icons/md"
import { useNavigate } from 'react-router-dom'

function Customize2() {
    const { userData, backendImage, selectedImage, serverUrl, setUserData } = useContext(userDataContext)
    const [assistantName, setAssistantName] = useState(userData?.AssistantName || "")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const handleUpdateAssistant = async () => {
        if (!assistantName.trim()) {
            setError("Assistant name cannot be empty")
            return
        }
        
        setLoading(true)
        setError(null)
        
        try {
            let formData = new FormData()
            formData.append("assistantName", assistantName.trim())
            
            if (backendImage) {
                formData.append("assistantImage", backendImage)
            } else {
                formData.append("imageUrl", selectedImage)
            }
            
            const result = await axios.post(`${serverUrl}/api/user/update`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            
            setUserData(result.data)
            navigate("/")
        } catch (error) {
            console.error("Update error:", error)
            setError(error.response?.data?.message || "Failed to update assistant")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='relative w-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 flex flex-col items-center justify-center p-6 sm:p-8 overflow-hidden'>
            {/* Background effects */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                <div className='absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full filter blur-[80px] opacity-20'></div>
                <div className='absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full filter blur-[80px] opacity-10'></div>
                <div className='absolute inset-0 opacity-10' style={{
                    backgroundImage: 'linear-gradient(to right, gray 1px, transparent 1px), linear-gradient(to bottom, gray 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Back button */}
            <MdKeyboardBackspace 
                className='absolute top-8 left-6 sm:top-10 sm:left-10 text-white w-8 h-8 cursor-pointer hover:text-blue-300 transition-all z-10' 
                onClick={() => navigate("/customize")} 
            />

            {/* Main content */}
            <div className='relative z-10 w-full max-w-2xl flex flex-col items-center'>
                <h1 className='text-white text-3xl sm:text-4xl text-center font-light mb-8'>
                    Name your <span className='text-blue-300 font-medium'>AI Assistant</span>
                </h1>
                
                {/* Input field */}
                <div className='w-full max-w-lg relative mb-6'>
                    <input 
                        type="text" 
                        placeholder='e.g. Jarvis, Friday, EVA...' 
                        className='w-full h-14 sm:h-16 outline-none border-2 border-blue-400 border-opacity-50 bg-gray-900 bg-opacity-60 text-white placeholder-blue-300 px-6 py-2 rounded-full text-lg focus:border-blue-300 focus:shadow-[0_0_15px_-3px_rgba(58,58,255,0.3)] transition-all'
                        onChange={(e) => setAssistantName(e.target.value)} 
                        value={assistantName}
                        maxLength={30}
                    />
                    {error && (
                        <p className='text-red-400 text-sm mt-2 text-center animate-pulse'>
                            {error}
                        </p>
                    )}
                </div>
                
                {/* Submit button */}
                {assistantName.trim() && (
                    <button 
                        className={`min-w-[300px] h-14 sm:h-16 px-8 text-lg font-medium rounded-full transition-all cursor-pointer
                            ${loading ? 
                                'bg-blue-800 text-blue-200 cursor-not-allowed' : 
                                'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:shadow-[0_0_20px_-5px_rgba(58,58,255,0.6)] hover:scale-105'
                            }
                            flex items-center justify-center gap-2`}
                        disabled={loading}
                        onClick={handleUpdateAssistant}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Assistant...
                            </>
                        ) : (
                            <>
                                   Finalize Your AI Assistant
                                <svg className="w-5 h-5 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}

export default Customize2