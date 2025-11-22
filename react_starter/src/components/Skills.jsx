import {
  SkillsDefault,
  SkillsDetails,
  SkillsGrouped,
  SkillsIcons,
  SkillsInteractive,
  SkillsProgress,
  SkillsSimple,
} from "./Skills/index";

export const Skills = ({ skills }) => {
  // BONUS: Change badge colors to colors you prefer
  const levelColors = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-blue-100 text-blue-800",
    advanced: "bg-purple-100 text-purple-800",
  };

  const renderSkills = () => {
    // return <SkillsDefault skills={skills} />;
    // return <SkillsSimple levelColors={levelColors} skills={skills} />;
    // return <SkillsGrouped skills={skills} />;
    // return <SkillsProgress skills={skills} />;
    // return <SkillsIcons skills={skills} />;
    // return <SkillsInteractive skills={skills} />;
    return <SkillsDetails skills={skills} />;
  };

  return <>{renderSkills()}</>;
};
