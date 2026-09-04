/**
 * Challenge Validators Tests
 *
 * Tests for the code validation functions used in the Challenge Mode.
 * These are critical tests as they determine whether students pass challenges.
 */

import { describe, it, expect } from "vitest";
import {
  validateHelloWorld,
  validatePropsBasics,
  validateStateCounter,
  validateListRendering,
  validateConditionalRender,
  validateUseEffectBasic,
  validateCode,
} from "./validators";

describe("validateHelloWorld", () => {
  it("should pass with correct solution", () => {
    const code = `
      function Greeting() {
        return <h1>Hello, World!</h1>;
      }
      export default Greeting;
    `;
    const result = validateHelloWorld(code);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail if function name is wrong", () => {
    const code = `
      function Hello() {
        return <h1>Hello, World!</h1>;
      }
      export default Hello;
    `;
    const result = validateHelloWorld(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Define a function called 'Greeting'");
  });

  it("should fail if missing return statement", () => {
    const code = `
      function Greeting() {
        const x = "Hello, World!";
      }
      export default Greeting;
    `;
    const result = validateHelloWorld(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Add a return statement with JSX");
  });

  it("should fail if missing h1 tag", () => {
    const code = `
      function Greeting() {
        return <p>Hello, World!</p>;
      }
      export default Greeting;
    `;
    const result = validateHelloWorld(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Use an <h1> element");
  });

  it("should fail if missing Hello World text", () => {
    const code = `
      function Greeting() {
        return <h1>Hi there!</h1>;
      }
      export default Greeting;
    `;
    const result = validateHelloWorld(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Include the text 'Hello, World!'");
  });

  it("should fail if missing export", () => {
    const code = `
      function Greeting() {
        return <h1>Hello, World!</h1>;
      }
    `;
    const result = validateHelloWorld(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Export the component as default");
  });

  it("should accept variations of Hello World text", () => {
    const variations = [
      "Hello, World!",
      "Hello World!",
      "Hello, World",
      "hello, world!",
    ];

    variations.forEach((text) => {
      const code = `
        function Greeting() {
          return <h1>${text}</h1>;
        }
        export default Greeting;
      `;
      const result = validateHelloWorld(code);
      expect(result.errors).not.toContain("Include the text 'Hello, World!'");
    });
  });
});

describe("validatePropsBasics", () => {
  it("should pass with destructured props", () => {
    const code = `
      function Welcome({ name }) {
        return <h1>Welcome, {name}!</h1>;
      }
      export default Welcome;
    `;
    const result = validatePropsBasics(code);
    expect(result.valid).toBe(true);
  });

  it("should pass with props object access", () => {
    const code = `
      function Welcome(props) {
        return <h1>Welcome, {props.name}!</h1>;
      }
      export default Welcome;
    `;
    const result = validatePropsBasics(code);
    expect(result.valid).toBe(true);
  });

  it("should fail if function name is wrong", () => {
    const code = `
      function Greeting({ name }) {
        return <h1>Welcome, {name}!</h1>;
      }
      export default Greeting;
    `;
    const result = validatePropsBasics(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Define a function called 'Welcome'");
  });

  it("should fail if not accepting name prop", () => {
    const code = `
      function Welcome() {
        return <h1>Welcome!</h1>;
      }
      export default Welcome;
    `;
    const result = validatePropsBasics(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Accept 'name' as a prop (via destructuring or props object)"
    );
  });
});

describe("validateStateCounter", () => {
  it("should pass with correct counter implementation", () => {
    const code = `
      import { useState } from 'react';
      
      function Counter() {
        const [count, setCount] = useState(0);
        
        return (
          <div>
            <button onClick={() => setCount(count - 1)}>-</button>
            <span>{count}</span>
            <button onClick={() => setCount(count + 1)}>+</button>
          </div>
        );
      }
      export default Counter;
    `;
    const result = validateStateCounter(code);
    expect(result.valid).toBe(true);
  });

  it("should fail without useState", () => {
    const code = `
      function Counter() {
        let count = 0;
        return (
          <div>
            <button onClick={() => count--}>-</button>
            <span>{count}</span>
            <button onClick={() => count++}>+</button>
          </div>
        );
      }
    `;
    const result = validateStateCounter(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Use the useState hook");
  });

  it("should fail if useState not initialized to 0", () => {
    const code = `
      import { useState } from 'react';
      function Counter() {
        const [count, setCount] = useState(5);
        return (
          <div>
            <button onClick={() => setCount(count - 1)}>-</button>
            <span>{count}</span>
            <button onClick={() => setCount(count + 1)}>+</button>
          </div>
        );
      }
    `;
    const result = validateStateCounter(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Initialize the count state to 0");
  });

  it("should fail with only one button", () => {
    const code = `
      import { useState } from 'react';
      function Counter() {
        const [count, setCount] = useState(0);
        return (
          <div>
            <span>{count}</span>
            <button onClick={() => setCount(count + 1)}>+</button>
          </div>
        );
      }
    `;
    const result = validateStateCounter(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Add two buttons (increment and decrement)"
    );
  });
});

describe("validateListRendering", () => {
  it("should pass with correct list implementation", () => {
    const code = `
      function TodoList({ todos }) {
        return (
          <ul>
            {todos.map((todo, index) => (
              <li key={index}>{todo}</li>
            ))}
          </ul>
        );
      }
      export default TodoList;
    `;
    const result = validateListRendering(code);
    expect(result.valid).toBe(true);
  });

  it("should fail without map method", () => {
    const code = `
      function TodoList({ todos }) {
        return (
          <ul>
            <li>{todos[0]}</li>
          </ul>
        );
      }
    `;
    const result = validateListRendering(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Use the .map() method to iterate over todos"
    );
  });

  it("should fail without key prop", () => {
    const code = `
      function TodoList({ todos }) {
        return (
          <ul>
            {todos.map((todo) => (
              <li>{todo}</li>
            ))}
          </ul>
        );
      }
    `;
    const result = validateListRendering(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Add a 'key' prop to each list item");
  });

  it("should fail without ul element", () => {
    const code = `
      function TodoList({ todos }) {
        return (
          <div>
            {todos.map((todo, index) => (
              <li key={index}>{todo}</li>
            ))}
          </div>
        );
      }
    `;
    const result = validateListRendering(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Wrap your list items in a <ul> element");
  });
});

describe("validateConditionalRender", () => {
  it("should pass with && conditional rendering", () => {
    const code = `
      import { useState } from 'react';
      
      function Toggle() {
        const [isVisible, setIsVisible] = useState(false);
        
        return (
          <div>
            <button onClick={() => setIsVisible(!isVisible)}>
              {isVisible ? 'Hide' : 'Show'}
            </button>
            {isVisible && <p>Hello! 👋</p>}
          </div>
        );
      }
    `;
    const result = validateConditionalRender(code);
    expect(result.valid).toBe(true);
  });

  it("should pass with ternary conditional rendering", () => {
    const code = `
      import { useState } from 'react';
      
      function Toggle() {
        const [isVisible, setIsVisible] = useState(false);
        
        return (
          <div>
            <button onClick={() => setIsVisible(!isVisible)}>
              {isVisible ? 'Hide' : 'Show'}
            </button>
            {isVisible ? <p>Hello! 👋</p> : null}
          </div>
        );
      }
    `;
    const result = validateConditionalRender(code);
    expect(result.valid).toBe(true);
  });

  it("should fail without useState", () => {
    const code = `
      function Toggle() {
        let isVisible = false;
        return (
          <div>
            <button onClick={() => isVisible = !isVisible}>Show</button>
            {isVisible && <p>Hello! 👋</p>}
          </div>
        );
      }
    `;
    const result = validateConditionalRender(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Use the useState hook");
  });
});

describe("validateUseEffectBasic", () => {
  it("should pass with correct useEffect implementation", () => {
    const code = `
      import { useEffect } from 'react';
      
      function PageTitle({ title }) {
        useEffect(() => {
          document.title = title;
        }, [title]);
        
        return <h1>{title}</h1>;
      }
    `;
    const result = validateUseEffectBasic(code);
    expect(result.valid).toBe(true);
  });

  it("should fail without useEffect", () => {
    const code = `
      function PageTitle({ title }) {
        document.title = title;
        return <h1>{title}</h1>;
      }
    `;
    const result = validateUseEffectBasic(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Use the useEffect hook");
  });

  it("should fail without dependency array", () => {
    const code = `
      import { useEffect } from 'react';
      
      function PageTitle({ title }) {
        useEffect(() => {
          document.title = title;
        });
        
        return <h1>{title}</h1>;
      }
    `;
    const result = validateUseEffectBasic(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Add a dependency array to useEffect");
  });

  it("should fail if title not in dependency array", () => {
    const code = `
      import { useEffect } from 'react';
      
      function PageTitle({ title }) {
        useEffect(() => {
          document.title = title;
        }, []);
        
        return <h1>{title}</h1>;
      }
    `;
    const result = validateUseEffectBasic(code);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Include 'title' in the dependency array");
  });
});

describe("validateCode (dispatcher)", () => {
  it("should use correct validator based on challenge id", () => {
    const challenge = { id: "hello-world" };
    const code = `
      function Greeting() {
        return <h1>Hello, World!</h1>;
      }
      export default Greeting;
    `;
    const result = validateCode(code, challenge);
    expect(result.valid).toBe(true);
  });

  it("should return valid for unknown challenge id", () => {
    const challenge = { id: "unknown-challenge" };
    const code = "any code";
    const result = validateCode(code, challenge);
    expect(result.valid).toBe(true);
    expect(result.message).toBe("No validator available");
  });
});
