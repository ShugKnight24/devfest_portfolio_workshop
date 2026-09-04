import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ComponentGallery,
  LivePreview,
  COMPONENT_CONFIGS,
} from "../components/LiveComponentPreview";
import {
  LeftArrow,
  Eye,
  Desktop,
  Expand,
  EmojiIcon,
} from "../components/Icons";

/**
 * Component Preview Page
 *
 * Interactive component playground where students can:
 * - Browse available components
 * - Modify props in real-time
 * - See the generated code
 * - Learn component patterns
 */

const ComponentPreviewPage = () => {
  const [view, setView] = useState("gallery"); // gallery | playground
  const [activeComponent, setActiveComponent] = useState("Button");

  return (
    <div className="min-h-screen bg-(--color-background) text-(--color-text) dark:text-(--color-text-dark)">
      {/* Header */}
      <div className="bg-(--color-surface)/90 dark:bg-(--color-surface-dark)/90 backdrop-blur-sm border-b border-(--color-border) dark:border-(--color-border-dark) sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 hover:bg-(--color-border)/20 dark:hover:bg-(--color-border-dark)/30 rounded-lg transition-colors"
              >
                <LeftArrow className="w-5 h-5 text-(--color-muted-text) dark:text-(--color-muted-text-dark)" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
                  <EmojiIcon
                    name="palette"
                    className="w-6 h-6 text-(--color-primary)"
                  />
                  <span>Component Preview</span>
                </h1>
                <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                  Interactive component playground
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("gallery")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  view === "gallery"
                    ? "bg-(--color-primary) text-(--color-primary-text)"
                    : "bg-(--color-border)/20 dark:bg-(--color-border-dark)/30 text-(--color-text) dark:text-(--color-text-dark) hover:bg-(--color-border)/40"
                }`}
              >
                <Eye className="w-4 h-4" />
                Gallery
              </button>
              <button
                onClick={() => setView("playground")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  view === "playground"
                    ? "bg-(--color-primary) text-(--color-primary-text)"
                    : "bg-(--color-border)/20 dark:bg-(--color-border-dark)/30 text-(--color-text) dark:text-(--color-text-dark) hover:bg-(--color-border)/40"
                }`}
              >
                <Expand className="w-4 h-4" />
                Playground
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Intro Section */}
        <div className="mb-8 p-6 bg-(--color-primary)/10 rounded-xl border border-(--color-primary)/25">
          <h2 className="text-lg font-bold text-(--color-text) dark:text-(--color-text-dark) mb-2 flex items-center gap-2">
            <span>Welcome to the Component Playground!</span>
            <EmojiIcon name="wave" className="w-5 h-5 text-amber-500" />
          </h2>
          <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
            This is where you can explore and experiment with React components.
            Click on any component to see it in action, modify its props, and
            see the generated code. Use these patterns as inspiration for your
            own portfolio!
          </p>
        </div>

        {view === "gallery" ? (
          <ComponentGallery />
        ) : (
          /* Playground View */
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Component Selector Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-4 sticky top-24">
                <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4">
                  Components
                </h3>
                <div className="space-y-2">
                  {Object.keys(COMPONENT_CONFIGS).map((name) => (
                    <button
                      key={name}
                      onClick={() => setActiveComponent(name)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                        activeComponent === name
                          ? "bg-(--color-primary) text-(--color-primary-text)"
                          : "hover:bg-(--color-border)/20 dark:hover:bg-(--color-border-dark)/30 text-(--color-text) dark:text-(--color-text-dark)"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-3">
              <LivePreview componentName={activeComponent} />
            </div>
          </div>
        )}

        {/* Learning Resources */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-(--color-primary)/10 text-(--color-primary) rounded-xl flex items-center justify-center mb-4">
              <EmojiIcon name="books" className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) mb-2">
              Learn by Example
            </h3>
            <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
              Each component demonstrates React patterns like props, conditional
              rendering, and component composition.
            </p>
          </div>

          <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4">
              <EmojiIcon name="target" className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) mb-2">
              Experiment Freely
            </h3>
            <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
              Modify props, see instant results, and understand how different
              values change the component's appearance and behavior.
            </p>
          </div>

          <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-4">
              <EmojiIcon name="laptop" className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) mb-2">
              Copy & Use
            </h3>
            <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
              When you've configured a component, copy the generated code and
              use it in your own portfolio project.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-4">
            Ready to apply what you've learned?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/builder"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon name="tools" className="w-4 h-4" /> Build
              Your Portfolio
            </Link>
            <Link
              to="/quiz"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon name="brain" className="w-4 h-4" /> Take a Quiz
            </Link>
            <Link
              to="/challenges"
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon name="lightning" className="w-4 h-4" /> Try Challenges
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentPreviewPage;
