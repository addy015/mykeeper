# MyKeeper 🗄️

**MyKeeper** is a secure, modern, and efficient file storage management dashboard. It enables users to securely store, organize, and quickly search for their files with an intuitive user interface. 

Built with performance and security in mind, MyKeeper leverages a powerful tech stack to deliver a seamless user experience, making it an excellent solution for personal or professional file management.

---

## 🚀 Key Features

- **Secure Authentication:** Robust user login and registration flows.
- **File Management:** Upload, view, and organize files in a centralized dashboard.
- **Real-time Search:** Lightning-fast client-side file search with a dropdown preview for instant access.
- **Secure Backend:** Powered by Appwrite for reliable backend services.
- **Modern UI/UX:** Sleek, responsive design built with Tailwind CSS v4, featuring a "Monochrome Noir" aesthetic and smooth micro-animations.

---

## 🛠️ Tech Stack

- **Frontend:** [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend/BaaS:** [Appwrite](https://appwrite.io/) (Authentication & Database storage)

---

## 💻 Getting Started

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v18+)
- npm or yarn
- An Appwrite instance (Cloud or Self-hosted)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/addy015/mykeeper.git
   cd mykeeper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Appwrite credentials:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT="your-appwrite-endpoint"
   NEXT_PUBLIC_APPWRITE_PROJECT="your-project-id"
   # Add any other required environment variables mapped to your Appwrite collections/buckets
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🤝 Let's Connect!

If you found this project interesting or have any feedback, feel free to reach out to me on [LinkedIn](https://www.linkedin.com/in/abhishek-maurya-04075b335) or check out more of my work on [GitHub](https://github.com/addy015).
