/**
 * CHALLENGE 3: Build the Skills Section
 *
 * Lists, Keys, and .map()
 *
 * In React, we aim to not write repetitive HTML (& JavaScript) where possible.
 * One of the framework's strengthes is creating modular and reusable components.
 * We can bring in these components into other components by `import`ing them.
 * We can use JavaScript's `.map()` method to transform an array of data into an array of JSX elements.
 *
 * 1. `skills.map(skill => ...)` iterates over every item.
 * 2. `key={}` when map renders similar components, a key is REQUIRED so React can track updates efficiently.
 * A lot of folks will use an index from the map function - Funky things can happen if the array changes length though.
 * A better approach is to use a unique identifier from the data if possible (like an id or name).
 *
 * We want our code to be DRY (Don't Repeat Yourself)!
 * and dynamic (data-driven) based on the data we have.
 *
 * This component should:
 * 1. Use the `.map()` function to render a `SkillBadge` for every item in the `skills` array.
 * 2. Pass the skill data to the component using the spread operator `{...skill
 * 3. Display them in a nice grid/flex layout
 *
 *
 * KEY LEARNING: Use .map() to render multiple components from our data!
 *
 * Example:
 * skills.map((skill) => <SkillBadge key={skill.name} {...skill} />)
 */

// What props do we need to access here???
// import { SkillBadge } from "../SkillBadge";

export const SkillsDefault = () => {
  return (
    <section className="section-container bg-white">
      <h2 className="section-title">My Skills</h2>
      <div className="flex flex-wrap gap-3 justify-center">
        {/* 
            TODO: Replace this static message with a map function.
        */}
        <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500">
          Skills will appear here once you map over the array!
        </div>
      </div>
    </section>
  );
};
