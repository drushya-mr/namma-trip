import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import HomeFeedPage from './pages/HomeFeedPage';
import PlanPage from './pages/PlanPage';
import ExplorePage from './pages/ExplorePage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-amber-50/20 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-kannada">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomeFeedPage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/places/:id" element={<PlaceDetailPage />} />
              <Route path="/post" element={<CreatePostPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}
