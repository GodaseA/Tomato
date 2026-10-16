# Frontend Cloudinary uploads

This source includes a reusable `api/uploadImage.js` helper. Restaurant owners can upload menu photos, restaurant applicants can upload a restaurant photo, and users can upload profile photos. Files are sent to the backend session-authenticated `/api/uploads/*` endpoints; Cloudinary credentials belong only in the backend `.env`.

Extract the ZIP contents into the frontend source folder, preserving your existing project configuration.
