import {
  AboutAnimated,
  AboutDefault,
  AboutImage,
  AboutSimple,
  AboutSkills,
  AboutStats,
} from "./About/index";

export const About = ({ avatar, aboutImage, bio }) => {
  const renderAbout = () => {
    // return <AboutDefault avatar={avatar} bio={bio} />;
    // return <AboutSimple avatar={avatar} bio={bio} />;
    // return <AboutImage avatar={avatar} bio={bio} />;
    // return <AboutStats avatar={avatar} bio={bio} />;
    return <AboutAnimated avatar={avatar} aboutImage={aboutImage} bio={bio} />;
    // return <AboutSkills avatar={avatar} bio={bio} />;
  };

  return <>{renderAbout()}</>;
};
