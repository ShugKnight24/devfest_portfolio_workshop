/**
 * CHALLENGE 1: Build your Header!
 *
 * In React, data flows DOWN from parent to child via "props".
 *
 * 1. Inspect the `personal` prop. It's an object containing your data.
 * 2. Modify the `portfolioData.js` file to add your own info to the `personal` object.
 * 3. Use "Destructuring" to extract `name`, `title`, and other variables you want to use.
 *    const { name, title, ... } = personal;
 * 4. Use {curly braces} to insert these variables into the JSX.
 * 5. Add Tailwind classes to style it (try 'text-4xl', 'font-bold', 'text-center')
 * 6. What else would you like to add here? An image...? a tagline...? social links...? Would you have to include additional data in your data structure to support it?
 * Ultimately, this is YOUR portfolio, not mine - Highlight what's important to you and build it your way!
 * Play around, experiment, have fun, and create something cool you can share!
 * 7. (Bonus) Add the ThemeSwitcher and DarkModeToggle components
 * In order for these to work, would you have to modify the classes used on the elements you've built? Take a look at colors used to render the name, and look at the other provided header components for examples of theme & dark mode friendly classes.
 * some files to look into `tailwind.config.js`, `index.css`, and `config/themes.js`
 */

// Bonus Imports for #7
// import ThemeSwitcher from "../ThemeSwitcher";
// import DarkModeToggle from "../DarkModeToggle";

export const HeaderDefault = ({ personal }) => {
  // console.log(personal); // or look at portfolioData.js to see what data is available

  // 3. Destructure the props you want to use here
  const { name, title, avatar } = personal;

  return (
    <header className="flex flex-col items-center gap-3 py-6 md:py-10 border-b border-slate-200 dark:border-slate-800">
      {/* Bonus: Add ThemeSwitcher and DarkModeToggle */}

      <div className="text-center space-y-4">
        <p className="text-gray-500 italic">
          Your Header Component: We'll start building here!
        </p>

        {/* 2. Render your Name & Title */}
        <div className="flex text-center justify-center items-center">
          {/* 6. Do you want to include your Avatar ??? */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-primary-500 to-secondary-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={avatar} // TODO: Replace with your avatar
              alt="Profile"
              className="relative w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-lg"
            />
          </div>
          {/* Text Content */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-(--color-primary) to-(--color-secondary)">
              {name} {/* TODO: Replace with your name */}
            </h1>
            {/* 5. Style your title with some tailwind classes */}
            <p className="">
              {title} {/* TODO: Replace with your title */}
            </p>
          </div>
        </div>

        {/* 6. do you want to include Social Links, how can we display these here ??? */}
        {/* <div className="flex gap-3 justify-center">...</div> */}
      </div>
    </header>
  );
};
