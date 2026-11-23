import ImageKit from "imagekit";
import { apiError } from "./api-error.js";

let imagekitInstance = null;

const getImageKitClient = () => {
  if (imagekitInstance) {
    return imagekitInstance;
  }

  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } =
    process.env;

  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new apiError(
      500,
      "ImageKit is not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in backend/.env",
    );
  }

  imagekitInstance = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });

  return imagekitInstance;
};

export const uploadFileToImageKit = async (
  file,
  folder = "/project-management/tasks",
) => {
  const client = getImageKitClient();

  const uploaded = await client.upload({
    file: file.buffer,
    fileName: `${Date.now()}-${file.originalname}`,
    folder,
    useUniqueFileName: true,
  });

  return {
    url: uploaded.url,
    fileId: uploaded.fileId,
    thumbnailUrl: uploaded.thumbnailUrl,
    MimeType: file.mimetype,
    size: file.size,
  };
};

export const uploadFilesToImageKit = async (
  files = [],
  folder = "/project-management/tasks",
) => {
  if (!files || files.length === 0) {
    return [];
  }

  return Promise.all(
    files.map((file) => uploadFileToImageKit(file, folder)),
  );
};

export const deleteFilesFromImageKit = async (fileIds = []) => {
  const validIds = fileIds.filter(Boolean);
  if (validIds.length === 0) {
    return;
  }

  try {
    const client = getImageKitClient();
    await client.bulkDeleteFiles(validIds);
  } catch (error) {
    console.error("Failed to delete files from ImageKit:", error.message);
  }
};
