import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

cloudinary.config({
    cloud_name: 'dkdeqhz7u', 
    api_key: '191916574317484', 
    api_secret: 'KDwZdZbVDuak-FbFMXLpaZ5WPgw',// Click 'View API Keys' above to copy your API secret
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload file to the cloudinary !!
        const response = await cloudinary.uploader
        .upload(localFilePath, {
            resource_type: "auto"
        });
        //file has been upload successfull !!
        console.log("File has been upload successfully:", response.url);
        return response;
    } catch (error) {//remove the locally saved temporary file as the upload operation got failed 
        console.log("upload nahi ho payi bhai")
        return null;
    }
}

export { uploadOnCloudinary }