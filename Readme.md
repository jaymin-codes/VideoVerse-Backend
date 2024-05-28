# 🎬 Welcome to VideoVerse!

VideoVerse is an all-in-one backend solution, packed with features akin to YouTube, and built with the robust MERN stack. 🚀

- [Backend Data Model Link](https://app.eraser.io/workspace/n6AvcWscdh4vyNFcQTWB?origin=share&elements=bDninHQGbAx_F4GzSUq3eg)

Inspired by the [chai-backend by Hitesh Chaoudhary](https://github.com/hiteshchoudhary/chai-backend) 

## 🌟 Key Features

### 🛡️ Authentication
- **Login:** Enjoy secure login with JWT tokens.
- **Signup:** Seamless registration with access and refresh tokens.
- **Logout:** Effortless termination of user sessions.

### 📹 Channel
Empowering users with a personalized space for content management:
- **Videos:** Showcase your uploads with sorting options.
- **Tweets:** Express yourself with tweets, edit, delete, and update capabilities included.
- **Playlists:** Curate your playlists effortlessly.
- **Subscribers:** Keep track of your followers.
- **Liked Videos:** Access your favorites with ease.

### 🎥 Video
Comprehensive features for managing and viewing video content:
- **Video Feed:** Endlessly scroll through videos.
- **Sorting:** Easily find videos with sorting options.
- **Publishing:** Share your creations effortlessly.
- **Management:** Modify and update video status effortlessly.
- **Playlist Integration:** Seamlessly add videos to playlists.
- **Playlist Video View:** Dive into playlist videos with ease.
- **Comments:** Engage with your audience seamlessly.
- **History View:** Keep track of your watch history with ease.

### 🐦 Tweets
Unlock social media-style functionalities:
- **Posting:** Share your thoughts with the world.
- **Interaction:** Like, edit, and delete tweets effortlessly.

### 📬 Subscriptions
Effortless management of channel subscriptions:
- **Subscribe/Unsubscribe:** Stay updated with your favorite channels.
- **Subscription List:** Manage your subscriptions with ease.

### 📊 Dashboard
Gain insightful analytics
- Total number of subscribers
- Number of total views
- Total likes on all videos
- Total videos

## 🛠️ Backend Tech Stack
- Node.js
- Express.js
- Mongoose
- Multer
- JSON Web Token (JWT)
- dotenv
- CORS
- Cookie-parser
- bcrypt
- Cloudinary

## Environment Variables
Before running the server, make sure to set up your environment variables. Create a `.env` file in the root directory of the project and add the following variables:

```plaintext
PORT = 8000
MONGODB_URI = your mongodb uri
CORS_ORIGIN = *

ACCESS_TOKEN_SECRET = your_access_token_secret
ACCESS_TOKEN_EXPIRY = 1d
REFRESH_TOKEN_SECRET = your_refresh_token_secret
REFRESH_TOKEN_EXPIRY = 7d

CLOUDINARY_CLOUD_NAME = your_cloudinary_cloud_name
CLOUDINARY_API_KEY = your_cloudinary_api_key
CLOUDINARY_API_SECRET = your_cloudinary_api_secret
```
