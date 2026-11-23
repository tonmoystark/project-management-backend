import multer from "multer";

// Store files in memory so buffers stream directly to ImageKit
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
});
