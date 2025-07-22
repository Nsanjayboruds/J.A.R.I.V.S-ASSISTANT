
import genToken from "../config/token.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"

export const signUp = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }


    const existEmail = await User.findOne({ email })
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists!" })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long!" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name, password: hashedPassword, email
    })
    const token = genToken(user._id)

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true
    })

    return res.status(201).json(user)
  } catch (error) {
    console.log("SIGNUP ERROR:", error)
    return res.status(500).json({ message: `sign up error ${error} ` })
  }
}

export const Login = async (req, res) => {
  try {
    const {email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Email doesnot exists!" })
    }
   

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password!" })
    }
   
    const token = genToken(user._id)

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true
    })

    return res.status(200).json(user)
  } catch (error) {
    
    return res.status(500).json({ message: `login error ${error} ` })
  }
}

export const logout = async (req, res) => {
  try {
    res.clearCookie("token")
    return res.status(200).json({ message: "Logout successful!" })
  } catch (error) {
    return res.status(500).json({ message: `logout error ${error} ` })
    
  }
}

