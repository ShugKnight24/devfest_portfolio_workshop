import { useState } from "react";

export const LivePreview = ({
  componentName,
  defaultProps,
  PreviewComponent,
  editableProps = [],
}) => {
  const [props, setProps] = useState(defaultProps);
  const [activeTab, setActiveTab] = useState("preview");

  const updateProp = (key, value) => {
    setProps((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {["preview", "props", "code"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-(--color-primary) text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "preview" && (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <PreviewComponent {...props} />
          </div>
        )}

        {activeTab === "props" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Adjust the props below to see how the component changes:
            </p>
            {editableProps.map((prop) => (
              <div key={prop.name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {prop.name}{" "}
                  <span className="text-gray-400">({prop.type})</span>
                </label>
                {prop.type === "text" && (
                  <input
                    type="text"
                    value={props[prop.name] || ""}
                    onChange={(e) => updateProp(prop.name, e.target.value)}
                    aria-label={prop.name}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                )}
                {prop.type === "boolean" && (
                  <button
                    onClick={() => updateProp(prop.name, !props[prop.name])}
                    className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                      props[prop.name]
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {props[prop.name] ? "true" : "false"}
                  </button>
                )}
                {prop.type === "select" && (
                  <select
                    value={props[prop.name] || ""}
                    onChange={(e) => updateProp(prop.name, e.target.value)}
                    aria-label={prop.name}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    {prop.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "code" && (
          <pre className="p-4 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto">
            {`
              <${componentName}
                ${Object.entries(props)
                  .map(([key, value]) => `  ${key}="${value}"`)
                  .join("\n")}
              />
            `}
          </pre>
        )}
      </div>
    </div>
  );
};
