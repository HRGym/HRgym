import { getSystemConfig } from './firebase';

/**
 * Uploads a file (File object or Base64 Data URI) to Cloudinary via unsigned upload preset
 * @param {File|string} fileInput - The file object or base64 image data string
 * @returns {Promise<string>} The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (fileInput) => {
  const config = getSystemConfig();
  
  if (!config.cloudinaryCloudName || !config.cloudinaryUploadPreset) {
    throw new Error("Cloudinary cloud name or upload preset is not configured.");
  }

  const url = `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`;
  
  const formData = new FormData();
  formData.append('file', fileInput);
  formData.append('upload_preset', config.cloudinaryUploadPreset);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url; // Returns the HTTPS URL of the uploaded photo
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw error;
  }
};
