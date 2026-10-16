# Cloudinary image uploads

1. In your existing backend folder, run: `npm install cloudinary multer`. Keep your existing package.json and lock file.
2. Add these values to the backend `.env` (never add secrets to the frontend):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. Restart the backend. Upload endpoints require an authenticated session and accept one `image` file (JPG, PNG, or WebP; maximum 5 MB):
- `POST /api/uploads/menu` — restaurant role
- `POST /api/uploads/restaurant` — normal user applying to own a restaurant
- `POST /api/uploads/profile` — any authenticated user

Each upload returns `image` (secure Cloudinary URL) and `imagePublicId`. The profile endpoint also persists the image to the current user. Menu and restaurant image URLs/public IDs are saved when the existing menu item or restaurant application is submitted.

Use your existing backend `.env` and do not replace it. Uploads have only been syntax-checked; verify them with your own Cloudinary credentials and MongoDB session.
