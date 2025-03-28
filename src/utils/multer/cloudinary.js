import { v2 as cloudinary } from 'cloudinary';

export const cloud = () => {

    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        secure: true,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET
    });
    return cloudinary
}


export const operationCloud = async (files, folder) => {

    try {
        let attachment = [];
        for (const obj of files) {
            console.log("🚀 Uploading file:", obj.path)
            const { secure_url, public_id } = await cloud().uploader.upload(
                obj.path,
                folder
            )
            console.log("✅ Uploaded successfully:", secure_url);
            attachment.push({ secure_url, public_id })
        }
        return attachment;
    } catch (error) {
        return { error }
    }

}

export const folderNames = ({ userData = {} , ontherId ="" }) => {
    return {
        post: { folder: `social-app/users/${userData._id}/posts` },
        comment: { folder: `social-app/users/${userData._id}/posts/comments` },
        profile: { folder: `social-app/users/${userData._id}/profile` },
        message: { folder: `social-app/users/${userData._id}/photo-Message/${ontherId}` }
    }
}
