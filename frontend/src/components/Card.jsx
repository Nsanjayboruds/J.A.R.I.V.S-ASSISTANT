// import React from 'react'
import React, { useContext } from 'react'
import { userDataContext } from '../context/UserContext'

function Card({ image }) {
  const { 
    setBackendImage, 
    setFrontendImage, 
    selectedImage, 
    setSelectedImage 
  } = useContext(userDataContext)

  return (
    <div 
      className={`relative aspect-[3/4] w-full bg-gray-800 rounded-xl overflow-hidden transition-all duration-300
        border-2 ${selectedImage === image ? 'border-blue-300 shadow-[0_0_25px_-5px_rgba(58,58,255,0.6)]' : 'border-transparent'}
        hover:border-blue-300 hover:shadow-[0_0_20px_-5px_rgba(58,58,255,0.4)] cursor-pointer
        group`}
      onClick={() => {
        setSelectedImage(image)
        setBackendImage(null)
        setFrontendImage(null)
      }}
    >
      {/* Image container with consistent aspect ratio */}
      <div className="relative w-full h-full">
        <img 
          src={image} 
          className='absolute inset-0 w-full h-full object-cover object-center'
          alt="Assistant avatar"
        />
        {/* Subtle overlay for better visual consistency */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Selection indicator */}
      {selectedImage === image && (
        <div className='absolute inset-0 bg-blue-500/20 flex items-center justify-center'>
          <div className='w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center shadow-lg'>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

export default Card