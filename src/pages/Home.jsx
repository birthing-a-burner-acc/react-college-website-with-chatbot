import Header from "../components/Header/Header";
import Courses from "../components/Courses/Courses";
import Facilities from "../components/Facilities/Facilities";
import Cta from "../components/Cta/Cta";
import Testimonials from "../components/Testimonials/Testimonials";
import Footer from "../components/Footer/Footer";
import FloatingChat from "../components/ChatBotComponent/FloatingChat";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;

const Home = () => {
  return (
    <>
      <Header />
      <Courses />
      <Facilities />
      <Cta />
      <Testimonials />
      <Footer />
      <FloatingChat apiKey={GEMINI_KEY} />
    </>
  );
};

export default Home;
