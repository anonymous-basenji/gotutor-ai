import { Link } from "react-router";
import type { MetaFunction } from "react-router";
import "../styles/home.css";

export const meta: MetaFunction = () => [
  { title: "GoTutor.ai — Your Private Tutor, On Demand" },
  { name: "description", content: "GoTutor.ai provides personalized AI-powered tutoring on demand for students of all ages." },
];

export default function Home() {
  return (
    <div className="home-page">
      <div className="top-bar">
        <h1 className="title">GoTutor.ai</h1>
      </div>
      <div className="main-content">
        <h1 className="catchphrase">Your private tutor, on demand.</h1>
        <Link to="/sign-in" className="sign-in-btn">Sign In or Create Account</Link>
      </div>
    </div>
  );
}
