import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

export const uploadDoctorImage = async (file: File): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `doctors/${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, fileName);
  
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const deleteDoctorImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) return;
  
  try {
    // Basic extraction of path from firebase storage URL
    // Warning: This is a simplistic approach for typical firebase URLs
    const decodedUrl = decodeURIComponent(imageUrl);
    const startIdx = decodedUrl.indexOf('/o/') + 3;
    const endIdx = decodedUrl.indexOf('?alt=media');
    
    if (startIdx > 2 && endIdx > -1) {
      const filePath = decodedUrl.substring(startIdx, endIdx);
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};
