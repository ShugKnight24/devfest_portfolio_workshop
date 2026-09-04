import portfolioData from "../data/examplePortfolioData";

import {
  Email,
  GithubLogo,
  LinkedInLogo,
  TwitterLogo,
} from "../components/Icons";

// Import specific "Advanced" variants directly
import { HeaderAnimatedSplit } from "../components/Headers/HeaderAnimatedSplit";
import { AboutAnimated } from "../components/About/AboutAnimated";
import { SkillsDetails } from "../components/Skills/SkillsDetails";
import { ProjectsCarousel } from "../components/Projects/ProjectsCarousel";
import { FooterSimple } from "../components/Footers/FooterSimple";

export const Demo = () => {
  const { personal, skills, projects } = portfolioData;
  const { avatar, aboutImage, bio, name, email, social } = personal;
  const { github, linkedin, twitter } = social;

  // TODO: Make this an export
  const socialLinks = [
    {
      name: "GitHub",
      url: github,
      color: "from-gray-700 to-gray-900",
      hoverColor: "hover:from-gray-600 hover:to-gray-800",
      icon: <GithubLogo />,
    },
    {
      name: "LinkedIn",
      url: linkedin,
      color: "from-blue-600 to-blue-800",
      hoverColor: "hover:from-blue-500 hover:to-blue-700",
      icon: <LinkedInLogo />,
    },
    {
      name: "Twitter",
      url: twitter,
      color: "from-sky-500 to-blue-600",
      hoverColor: "hover:from-sky-400 hover:to-blue-500",
      icon: <TwitterLogo />,
    },
    {
      name: "Contact Me",
      url: `mailto:${email}`,
      color: "from-green-500 to-green-700",
      hoverColor: "hover:from-green-400 hover:to-green-600",
      icon: <Email />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      <HeaderAnimatedSplit personal={personal} />
      <AboutAnimated aboutImage={aboutImage} bio={bio} />
      <SkillsDetails skills={skills} />
      <ProjectsCarousel projects={projects} />
      <FooterSimple socialLinks={socialLinks} name={name} currentYear={new Date().getFullYear()} />
    </div>
  );
};
