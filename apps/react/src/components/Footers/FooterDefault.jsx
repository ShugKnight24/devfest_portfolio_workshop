/**
 * CHALLENGE: Build your Footer!
 * Dynamic Data & Dates
 *
 * Even simple components can be dynamic.
 * Instead of hardcoding "2025", and forgetting to update the year,
 * We can use JavaScript to get the current year.
 *
 * 1. `new Date().getFullYear()` returns the current year.
 * 2. Use the `name` prop for the copyright
 * 3. Add the copyright (&copy; or ©) and current year to the footer
 * 4. Use the `socialLinks` prop to render icons/links
 * 5. Style the container with a background color
 */

// What props do we need to access here???

export const FooterDefault = () => {
  // TODO: How can we calculate the current year?
  // const currentYear = ...?

  return (
    <footer className="p-8 border-t-2 border-dashed border-gray-300 mt-12">
      <div className="text-center space-y-4">
        <p className="text-gray-500 italic">
          Footer Component: Add your links here!
        </p>

        <div className="flex justify-center gap-3">
          {/* TODO: Map over socialLinks here */}
        </div>

        {/* Add copyright info inside here */}
        <div className="text-sm"></div>
      </div>
    </footer>
  );
};
