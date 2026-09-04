/**
 * Challenge Code Validators
 *
 * Each validator checks user-submitted code against requirements
 * for a specific challenge. Returns { valid, errors, message }.
 *
 * These are extracted to a separate file for:
 * 1. Easier testing
 * 2. Reusability
 * 3. Cleaner ChallengeMode component
 */

/**
 * Validate code for the Hello World challenge
 */
export function validateHelloWorld(code) {
  const errors = [];

  if (!/function\s+Greeting\s*\(/.test(code)) {
    errors.push("Define a function called 'Greeting'");
  }

  if (!/return\s*[\s\S]*?</.test(code)) {
    errors.push("Add a return statement with JSX");
  }

  if (!/<h1[^>]*>/.test(code)) {
    errors.push("Use an <h1> element");
  }

  if (!/Hello,?\s*World!?/i.test(code)) {
    errors.push("Include the text 'Hello, World!'");
  }

  if (!/export\s+default/.test(code)) {
    errors.push("Export the component as default");
  }

  return {
    valid: errors.length === 0,
    errors,
    message: errors.length === 0 ? "All tests passed!" : "Some tests failed",
  };
}

/**
 * Validate code for the Props 101 challenge
 */
export function validatePropsBasics(code) {
  const errors = [];

  if (!/function\s+Welcome\s*\(/.test(code)) {
    errors.push("Define a function called 'Welcome'");
  }

  if (!/Welcome\s*\(\s*(\{[^}]*name[^}]*\}|props)/.test(code)) {
    errors.push("Accept 'name' as a prop (via destructuring or props object)");
  }

  if (
    !/(props\.name|\{.*name.*\}|`[^`]*\$\{name\}|\+\s*name|name\s*\+)/.test(
      code
    )
  ) {
    errors.push("Display the 'name' prop in your output");
  }

  if (!/Welcome/i.test(code.replace(/function\s+Welcome/, ""))) {
    errors.push("Include 'Welcome' in the displayed text");
  }

  if (!/return\s*[\s\S]*?</.test(code)) {
    errors.push("Return JSX from your component");
  }

  return {
    valid: errors.length === 0,
    errors,
    message: errors.length === 0 ? "All tests passed!" : "Some tests failed",
  };
}

/**
 * Validate code for the Counter challenge
 */
export function validateStateCounter(code) {
  const errors = [];

  if (!/useState/.test(code)) {
    errors.push("Use the useState hook");
  }

  if (!/useState\s*\(\s*0\s*\)/.test(code)) {
    errors.push("Initialize the count state to 0");
  }

  if (!/\+\s*1|count\s*\+\s*1|\+\+/.test(code)) {
    errors.push("Add increment logic (+1)");
  }

  if (!/-\s*1|count\s*-\s*1|--/.test(code)) {
    errors.push("Add decrement logic (-1)");
  }

  if (!/onClick/.test(code)) {
    errors.push("Add onClick handlers to your buttons");
  }

  const buttonMatches = code.match(/<button/g);
  if (!buttonMatches || buttonMatches.length < 2) {
    errors.push("Add two buttons (increment and decrement)");
  }

  if (!/\{.*count.*\}/.test(code)) {
    errors.push("Display the current count value");
  }

  return {
    valid: errors.length === 0,
    errors,
    message: errors.length === 0 ? "All tests passed!" : "Some tests failed",
  };
}

/**
 * Validate code for the List Rendering challenge
 */
export function validateListRendering(code) {
  const errors = [];

  if (!/function\s+TodoList\s*\(/.test(code)) {
    errors.push("Define a function called 'TodoList'");
  }

  if (!/TodoList\s*\(\s*\{[^}]*todos/.test(code)) {
    errors.push("Accept 'todos' as a prop");
  }

  if (!/.map\s*\(/.test(code)) {
    errors.push("Use the .map() method to iterate over todos");
  }

  if (!/<ul/.test(code)) {
    errors.push("Wrap your list items in a <ul> element");
  }

  if (!/<li/.test(code)) {
    errors.push("Render each todo as an <li> element");
  }

  if (!/key\s*=/.test(code)) {
    errors.push("Add a 'key' prop to each list item");
  }

  return {
    valid: errors.length === 0,
    errors,
    message: errors.length === 0 ? "All tests passed!" : "Some tests failed",
  };
}

/**
 * Validate code for the Conditional Rendering challenge
 */
export function validateConditionalRender(code) {
  const errors = [];

  if (!/useState/.test(code)) {
    errors.push("Use the useState hook");
  }

  if (!/useState\s*\(\s*(false|true)\s*\)/.test(code)) {
    errors.push("Initialize state with a boolean (true or false)");
  }

  if (!/<button/.test(code)) {
    errors.push("Add a button element");
  }

  if (!/onClick/.test(code)) {
    errors.push("Add an onClick handler to toggle visibility");
  }

  if (!/(\\\&\\\&|[\?:])/.test(code)) {
    errors.push("Use conditional rendering (&& or ternary operator)");
  }

  if (!/Show|Hide/.test(code)) {
    errors.push("Button text should indicate 'Show' or 'Hide'");
  }

  if (!/Hello/.test(code)) {
    errors.push("Display 'Hello!' when visible");
  }

  return {
    valid: errors.length === 0,
    errors,
    message: errors.length === 0 ? "All tests passed!" : "Some tests failed",
  };
}

/**
 * Validate code for the useEffect challenge
 */
export function validateUseEffectBasic(code) {
  const errors = [];

  if (!/useEffect/.test(code)) {
    errors.push("Use the useEffect hook");
  }

  if (!/useEffect\s*\(/.test(code)) {
    errors.push("Call useEffect with a callback function");
  }

  if (!/document\.title\s*=/.test(code)) {
    errors.push("Set document.title inside useEffect");
  }

  if (!/document\.title\s*=\s*title/.test(code)) {
    errors.push("Assign the 'title' prop to document.title");
  }

  if (!/useEffect\s*\(\s*(?:[\s\S]*?),\s*\[/.test(code)) {
    errors.push("Add a dependency array to useEffect");
  }

  if (!/\[\s*title\s*\]/.test(code)) {
    errors.push("Include 'title' in the dependency array");
  }

  return {
    valid: errors.length === 0,
    errors,
    message: errors.length === 0 ? "All tests passed!" : "Some tests failed",
  };
}

/**
 * Map of challenge IDs to validator functions
 */
export const CHALLENGE_VALIDATORS = {
  "hello-world": validateHelloWorld,
  "props-basics": validatePropsBasics,
  "state-counter": validateStateCounter,
  "list-rendering": validateListRendering,
  "conditional-render": validateConditionalRender,
  "useeffect-basic": validateUseEffectBasic,
};

/**
 * Validate code for a given challenge
 * @param {string} code - The user's code
 * @param {Object} challenge - Challenge object with id property
 * @returns {{ valid: boolean, errors: string[], message: string }}
 */
export function validateCode(code, challenge) {
  const validator = CHALLENGE_VALIDATORS[challenge.id];
  if (!validator) {
    return { valid: true, errors: [], message: "No validator available" };
  }
  return validator(code);
}
