const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || ""
});

function uploadInvoice(pdfBuffer, orderId) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return Promise.reject(new Error("Cloudinary not configured"));
  }

  const id = (orderId || "").toString();
  const last5 = id.slice(-5) || "00000";
  const publicId = `invoice-MBM-${last5}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "thrift-invoices",
        public_id: publicId,
        format: "pdf"
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result || !result.secure_url) return reject(new Error("Cloudinary upload failed"));
        return resolve(result.secure_url);
      }
    );

    stream.end(pdfBuffer);
  });
}

module.exports = { uploadInvoice };
