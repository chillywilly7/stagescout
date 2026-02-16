/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import BookingChat from './pages/BookingChat';
import FindScouts from './pages/FindScouts';
import Home from './pages/Home';
import ProDashboard from './pages/ProDashboard';
import ProSignin from './pages/ProSignin';
import ProSignup from './pages/ProSignup';
import ScoutAvailability from './pages/ScoutAvailability';
import ScoutOnboarding from './pages/ScoutOnboarding';
import ScoutProfile from './pages/ScoutProfile';
import CustomerSignup from './pages/CustomerSignup';
import CustomerSignin from './pages/CustomerSignin';
import CustomerDashboard from './pages/CustomerDashboard';
import SigninChoice from './pages/SigninChoice';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BookingChat": BookingChat,
    "FindScouts": FindScouts,
    "Home": Home,
    "ProDashboard": ProDashboard,
    "ProSignin": ProSignin,
    "ProSignup": ProSignup,
    "ScoutAvailability": ScoutAvailability,
    "ScoutOnboarding": ScoutOnboarding,
    "ScoutProfile": ScoutProfile,
    "CustomerSignup": CustomerSignup,
    "CustomerSignin": CustomerSignin,
    "CustomerDashboard": CustomerDashboard,
    "SigninChoice": SigninChoice,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};