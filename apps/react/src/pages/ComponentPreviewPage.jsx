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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LeftArrow className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  <EmojiIcon
                    emoji="🎨"
                    className="w-6 h-6 inline-block align-text-bottom"
                  />{" "}
                  Component Preview
                </h1>
                <p className="text-sm text-gray-500">
                  Interactive component playground
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("gallery")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  view === "gallery"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                <Eye className="w-4 h-4" />
                Gallery
              </button>
              <button
                onClick={() => setView("playground")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  view === "playground"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
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
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to the Component Playground!{" "}
            <EmojiIcon emoji="👋" className="w-5 h-5 inline-block" />
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sticky top-24">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Components
                </h3>
                <div className="space-y-2">
                  {Object.keys(COMPONENT_CONFIGS).map((name) => (
                    <button
                      key={name}
                      onClick={() => setActiveComponent(name)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeComponent === name
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 mb-4">
              <EmojiIcon emoji="📚" className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              Learn by Example
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Each component demonstrates React patterns like props, conditional
              rendering, and component composition.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 mb-4">
              <EmojiIcon emoji="🎯" className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              Experiment Freely
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modify props, see instant results, and understand how different
              values change the component's appearance and behavior.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 mb-4">
              <EmojiIcon emoji="💻" className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              Copy & Use
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              When you've configured a component, copy the generated code and
              use it in your own portfolio project.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">
            Ready to apply what you've learned?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/builder"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon emoji="🏗️" name="tools" className="w-4 h-4" /> Build
              Your Portfolio
            </Link>
            <Link
              to="/quiz"
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon emoji="🧠" className="w-4 h-4" /> Take a Quiz
            </Link>
            <Link
              to="/challenges"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon emoji="⚡" className="w-4 h-4" /> Try Challenges
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentPreviewPage;
