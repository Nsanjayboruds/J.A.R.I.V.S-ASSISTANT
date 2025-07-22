import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const uploadOnCloudinary = async (filePath) => {
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath);
    fs.unlinkSync(filePath); // Clean up local file
    return uploadResult.secure_url; // ✅ Return secure URL
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Clean up even if it fails
    }
    console.error("Cloudinary upload failed:", error);
    return null; // ❌ Return null or throw, depending on how you want to handle it
  }
};

export default uploadOnCloudinary;
