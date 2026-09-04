import {
  ProjectsCarousel,
  ProjectsDefault,
  ProjectsFeatured,
  ProjectsFilterable,
  ProjectsMasonry,
  ProjectsSimple,
  ProjectsTimeline,
} from "./Projects/index";

export const Projects = ({ projects }) => {
  const renderProjects = () => {
    // return <ProjectsDefault projects={projects} />;
    // return <ProjectsSimple projects={projects} />;
    // return <ProjectsFeatured projects={projects} />;
    // return <ProjectsMasonry projects={projects} />;
    // return <ProjectsFilterable projects={projects} />;
    return <ProjectsCarousel projects={projects} />;
    // return <ProjectsTimeline projects={projects} />;
  };

  return <>{renderProjects()}</>;
};
