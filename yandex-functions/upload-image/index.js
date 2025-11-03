
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "ru-central1",
  endpoint: "https://storage.yandexcloud.net",
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileData, fileType } = body;

    if (!fileName || !fileData) {
      return {
        statusCode: 400,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ error: "fileName and fileData are required" }),
      };
    }

    const buffer = Buffer.from(fileData, 'base64');
    
    const command = new PutObjectCommand({
      Bucket: "sweetdelights-images",
      Key: fileName,
      Body: buffer,
      ContentType: fileType || 'image/png',
      ACL: 'public-read',
    });
    
    await s3Client.send(command);
    
    const imageUrl = `https://storage.yandexcloud.net/sweetdelights-images/${fileName}`;
    
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ url: imageUrl }),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
