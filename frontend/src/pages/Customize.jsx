import React, { useRef, useContext } from 'react'
import Card from '../components/Card'
import image0 from "../assets/jarvis.jpg"
import image3 from "../assets/image5.png"
import image7 from "../assets/image7.jpeg"
import image8 from "../assets/jar.jpg"
import image9 from "../assets/am.jpg"
import image10 from "../assets/shifra.jpg"
import image11 from "../assets/ultron.jpg"
import image12 from "../assets/genn.jpg"
import { RiImageAddLine } from "react-icons/ri";
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import { MdKeyboardBackspace } from "react-icons/md";
import Galaxy from '../components/Galaxy'

function Customize() {
  const {
    setBackendImage,
    setFrontendImage,
    selectedImage,
    setSelectedImage,
    frontendImage
  } = useContext(userDataContext)

  const navigate = useNavigate()
  const inputImage = useRef()

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBackendImage(file)
      setFrontendImage(URL.createObjectURL(file))
      setSelectedImage("input")
    }
  };

  const assistantImages = [
    { src: image0, id: "image0" },
    { src: image3, id: "image3" },
    { src: image7, id: "image7" },
    { src: image8, id: "image8" },
    { src: image9, id: "image9" },
    { src: image10, id: "image10" },
    { src: image11, id: "image11" },
    { src: image12, id: "image12" }
  ]

  return (
    <div className="relative w-full min-h-screen bg-black flex flex-col items-center p-4 ">

      <div className="fixed inset-0  pointer-events-none z-0">
        <Galaxy />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 animate-float-slow"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-10 animate-float"></div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(to right, gray 1px, transparent 1px), linear-gradient(to bottom, gray 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      <div className="relative w-full max-w-6xl flex justify-between items-center py-4 z-10">
        <MdKeyboardBackspace
          className="text-white w-8 h-8 cursor-pointer hover:text-blue-300 transition-all hover:scale-110"
          onClick={() => navigate("/")}
        />
        <h1 className="text-white text-3xl sm:text-4xl text-center font-light">
          Select your <span className="text-blue-300 font-medium">Assistant Avatar</span>
        </h1>
        <div className="w-8"></div>
      </div>

      <div className="relative w-full max-w-6xl flex flex-col items-center z-10">

        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {assistantImages.map((img) => (
            <Card
              key={img.id}
              image={img.src}
              isSelected={selectedImage === img.src}
              onClick={() => setSelectedImage(img.src)}
            />
          ))}

          <div
            className={`relative aspect-[3/4] w-full bg-gray-900 bg-opacity-50 rounded-xl overflow-hidden transition-all duration-300
              border-2 border-dashed border-blue-500 border-opacity-50 hover:border-solid hover:border-blue-300 hover:shadow-[0_0_20px_-5px_rgba(58,58,255,0.4)]
              ${selectedImage === "input" ? "!border-solid !border-blue-300 !shadow-[0_0_25px_-5px_rgba(58,58,255,0.6)]" : ""}
              flex flex-col items-center justify-center cursor-pointer`}
            onClick={() => inputImage.current.click()}
          >
            {!frontendImage ? (
              <>
                <RiImageAddLine className="text-blue-300 w-8 h-8 mb-3" />
                <span className="text-blue-200 text-sm font-medium">Custom Avatar</span>
                <span className="text-blue-400 text-xs mt-1">JPG, PNG</span>
              </>
            ) : (
              <img
                src={frontendImage}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Custom assistant avatar"
              />
            )}
            <input
              type="file"
              accept="image/*"
              ref={inputImage}
              className="hidden"
              onChange={handleImage}
            />
          </div>
        </div>

        {selectedImage && (
          <button
            className="px-8 py-3 text-white font-medium cursor-pointer
            bg-gradient-to-r from-blue-600 to-blue-800 rounded-full text-lg
            hover:shadow-[0_0_15px_-2px_rgba(58,58,255,0.7)] transition-all
            border border-blue-300 border-opacity-30 hover:scale-105
            flex items-center justify-center gap-2"
            onClick={() => navigate("/customize2")}
          >
            Continue
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default Customize
