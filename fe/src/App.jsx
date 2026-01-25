import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/layout/Layout.jsx';

// Pages
import Home from '@/pages/Home.jsx';
import Search from '@/pages/Search.jsx';
import TaskerProfile from '@/pages/TaskerProfile.jsx';
import BecomeTasker from '@/pages/BecomeTasker.jsx';
import MyBookings from '@/pages/MyBookings.jsx';
import MyServices from '@/pages/MyServices.jsx';
import Messages from '@/pages/Messages.jsx';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout currentPageName="Home" />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route element={<Layout currentPageName="Search" />}>
            <Route path="/search" element={<Search />} />
          </Route>
          <Route element={<Layout currentPageName="Tasker" />}>
            <Route path="/tasker/:id" element={<TaskerProfile />} />
          </Route>
          <Route element={<Layout currentPageName="BecomeTasker" />}>
            <Route path="/become-tasker" element={<BecomeTasker />} />
          </Route>
          <Route element={<Layout currentPageName="Bookings" />}>
            <Route path="/my-bookings" element={<MyBookings />} />
          </Route>
          <Route element={<Layout currentPageName="Services" />}>
            <Route path="/my-services" element={<MyServices />} />
          </Route>
          <Route element={<Layout currentPageName="Messages" />}>
            <Route path="/messages" element={<Messages />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
