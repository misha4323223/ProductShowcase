import type { Request, Response } from 'express';

const GITHUB_API = 'https://api.github.com';
const GITHUB_OWNER = 'misha4323223';
const GITHUB_REPO = 'ProductShowcase';
const GITHUB_BRANCH = 'main';
const IMAGES_PATH = 'product-images';

export async function uploadImageToGitHub(req: Request, res: Response) {
  try {
    const { filename, content, contentType } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ 
        error: 'Filename and content are required' 
      });
    }

    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      return res.status(500).json({ 
        error: 'GitHub token not configured' 
      });
    }

    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFilename = `${timestamp}_${sanitizedFilename}`;
    const filePath = `${IMAGES_PATH}/${finalFilename}`;

    const base64Content = content.split(',')[1] || content;

    const url = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload product image: ${finalFilename}`,
        content: base64Content,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        error: error.message || 'Failed to upload to GitHub' 
      });
    }

    const data = await response.json();
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;

    res.json({
      url: rawUrl,
      filename: finalFilename,
    });
  } catch (error: any) {
    console.error('GitHub upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
