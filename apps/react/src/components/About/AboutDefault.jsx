/**
 * CHALLENGE 2: Build the About Section!
 *
 * This component should display your bio/introduction.
 *
 * Tailwind makes responsive design easy with prefixes like `md:` (medium screens).
 *
 * 1. `flex`: Enables Flexbox layout.
 * 2. `flex-col`: Stacks items vertically (mobile default).
 * 3. `md:flex-row`: Switches to horizontal layout on medium screens and up.
 * 4. `items-center`: Aligns items in the center of the cross-axis.
 *
 * PROPS TO USE:
 *
 * 1. Display the `bio` text
 * 2. Display the `avatar` image
 * 3. Use Flexbox or Grid to lay them out side-by-side
 * 4. If you're using Flexbox, try `md:flex-col` Play around with the browser width to see it in action!
 * 5. Style the text to be readable and nice.
 *
 * TIP: Keep it simple! This is mostly styling practice. Feel free to add more content to your About section.
 */
// How do we access bio and avatar props here???
export const AboutDefault = () => {
  return (
    <section className="section-container border-2 border-dashed border-gray-200 rounded-lg p-8 my-8">
      <h2 className="section-title text-3xl font-bold text-center mb-12 text-slate-800 dark:text-slate-100">
        About Me
      </h2>
      <div className="text-center text-gray-500">
        <p className="text-gray-500 mb-6">
          Your basic run of the mill about Component - Add your bio here!
        </p>
        {/* Layout Container */}
        {/* 3. How can we make this a flex container that displays the content vertically on mobile and side-by-side on medium size screens? */}
        {/* Are there any other tailwind responsive classes? Would they be valuable here? What else might you want to add? */}
        <div className="">
          {/* Image Side */}
          {/* 2. Add Your Image or another one if you included one in the header - This is optional and based on personal preference */}
          <div className="w-full md:w-1/3 flex justify-center">
            <img
              src={"https://placehold.co/300x300"}
              alt="About Me"
              className="w-64 h-64 rounded-2xl object-cover shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300"
            />
          </div>

          {/* Text Side */}
          <div className="w-full md:w-2/3 space-y-4 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {/* 1. Add Your Bio */}
            <p>
              {"Your bio text will appear here once you pass it as a prop!"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
