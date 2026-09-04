/**
 * Footer Component
 *
 * This component displays:
 * - Social media links with SVG icons
 * - Copyright information with current year
 * - Optional "Built with" section
 * - Optional navigation links
 * - Modern gradient design
 *
 * PROPS TO USE:
 * @param {Object} social - Contains github, linkedin, twitter URLs
 * @param {string} name - User's name for copyright
 */

import {
  FooterBold,
  FooterDefault,
  FooterGlass,
  FooterMinimal,
  FooterSimple,
} from "./Footers";

import { Email, GithubLogo, LinkedInLogo, TwitterLogo } from "./Icons";

export const Footer = ({ social, name }) => {
  const currentYear = new Date().getFullYear();

  const { github, linkedin, twitter } = social;

  // TODO: Allow the icons to be configurable for size and color
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
      url: `mailto:${social.email}`,
      color: "from-green-500 to-green-700",
      hoverColor: "hover:from-green-400 hover:to-green-600",
      icon: <Email />,
    },
  ];

  const renderFooter = () => {
    // return <FooterDefault name={name} socialLinks={socialLinks} />;
    return (
      <FooterSimple
        currentYear={currentYear}
        name={name}
        socialLinks={socialLinks}
      />
    );
    // return (
    //   <FooterMinimal
    //     currentYear={currentYear}
    //     name={name}
    //     socialLinks={socialLinks}
    //   />
    // );
    // return (
    //   <FooterBold
    //     currentYear={currentYear}
    //     name={name}
    //     socialLinks={socialLinks}
    //   />
    // );
    // return (
    //   <FooterGlass
    //     currentYear={currentYear}
    //     name={name}
    //     socialLinks={socialLinks}
    //   />
    // );
  };

  return renderFooter();
};
