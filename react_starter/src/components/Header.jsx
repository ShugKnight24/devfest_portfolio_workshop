/**
 * CHALLENGE 1: Build the Header Component
 *
 * This component should display:
 * - Your name (large and bold)
 * - Your title/role
 * - Social links (GitHub, LinkedIn, Email)
 *
 * PROPS TO USE:
 * @param {Object} personal - Contains name, title, email, github, linkedin
 *
 * 💡 TIP: Use Tailwind classes like:
 * - text-4xl, font-bold for large text
 * - flex, items-center, justify-center for centering
 * - bg-gradient-to-r for gradient backgrounds
 */

import {
  HeaderAnimated,
  HeaderAnimatedSplit,
  HeaderDefault,
  HeaderGradient,
  HeaderSimple,
  HeaderSplit,
} from "./Headers";

export const Header = ({ personal }) => {
  const renderHeader = () => {
    // return <HeaderDefault personal={personal} />;
    // return <HeaderSimple personal={personal} />;
    // return <HeaderGradient personal={personal} />;
    // return <HeaderSplit personal={personal} />;
    // return <HeaderAnimated personal={personal} />;
    return <HeaderAnimatedSplit personal={personal} />;
  };

  return <>{renderHeader()}</>;
};
