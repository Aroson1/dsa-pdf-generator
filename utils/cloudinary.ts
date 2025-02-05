async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // Replace with your upload preset
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dqpjceizq/image/upload`, // Replace with your cloud name
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }
  