import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Close, Eye, Desktop, Expand, Checkmark } from "./Icons";
import { EmojiIcon } from "./Icons/EmojiIcon";

/**
 * Live Component Preview System
 *
 * Features:
 * - Live JSX rendering with error boundaries
 * - Props playground with sliders, toggles, inputs
 * - Multiple viewport sizes
 * - Code + preview side by side
 * - Export working code
 */

// Error Boundary for catching render errors
class PreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Preview Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-300 font-medium inline-flex items-center gap-1.5">
            <EmojiIcon name="warning" className="w-5 h-5" /> Render Error
          </p>
          <p className="text-sm text-red-600 dark:text-red-200 mt-1">
            {this.state.error?.message || "Something went wrong"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Sample components for preview
const PreviewComponents = {
  Button: ({
    children,
    variant = "primary",
    size = "md",
    disabled = false,
    onClick,
  }) => {
    const variants = {
      primary: "bg-blue-500 hover:bg-blue-600 text-white",
      secondary:
        "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      success: "bg-green-500 hover:bg-green-600 text-white",
      danger: "bg-red-500 hover:bg-red-600 text-white",
      outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`rounded-lg font-medium transition-all ${
          variants[variant]
        } ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {children}
      </button>
    );
  },

  Card: ({ title, description, image, footer }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-w-sm">
      {image && (
        <div className="h-48 bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
          <EmojiIcon name={image} emoji={image} className="w-16 h-16 text-white" />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-700 dark:text-gray-200">{description}</p>
      </div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
          {footer}
        </div>
      )}
    </div>
  ),

  Badge: ({ text, color = "blue", size = "md" }) => {
    const colors = {
      blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      green:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      yellow:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      purple:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full font-medium ${colors[color]} ${sizes[size]}`}
      >
        {text}
      </span>
    );
  },

  Alert: ({
    type = "info",
    title,
    message,
    dismissible = false,
    onDismiss,
  }) => {
    const types = {
      info: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        icon: "question",
      },
      success: {
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-700 dark:text-green-300",
        icon: "check",
      },
      warning: {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-700 dark:text-yellow-300",
        icon: "warning",
      },
      error: {
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-700 dark:text-red-300",
        icon: "cross",
      },
    };

    const style = types[type] || types.info;

    return (
      <div
        className={`p-4 rounded-lg border ${style.bg} ${style.border} ${style.text}`}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">
            <EmojiIcon name={style.icon} className="w-5 h-5" />
          </span>
          <div className="flex-1">
            {title && <h4 className="font-semibold mb-1">{title}</h4>}
            <p className="text-sm">{message}</p>
          </div>
          {dismissible && (
            <button onClick={onDismiss} className="hover:opacity-70">
              ×
            </button>
          )}
        </div>
      </div>
    );
  },

  Avatar: ({ name, src, size = "md", status }) => {
    const sizes = {
      sm: "w-8 h-8 text-sm",
      md: "w-12 h-12 text-lg",
      lg: "w-16 h-16 text-2xl",
      xl: "w-24 h-24 text-4xl",
    };

    const statusColors = {
      online: "bg-green-500",
      away: "bg-yellow-500",
      busy: "bg-red-500",
      offline: "bg-gray-400",
    };

    const initials =
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?";

    return (
      <div className="relative inline-block">
        {src ? (
          <img
            src={src}
            alt={name}
            className={`rounded-full object-cover ${sizes[size]}`}
          />
        ) : (
          <div
            className={`rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold ${sizes[size]}`}
          >
            {initials}
          </div>
        )}
        {status && (
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${statusColors[status]}`}
          />
        )}
      </div>
    );
  },

  Input: ({
    label,
    placeholder,
    type = "text",
    error,
    helper,
    disabled = false,
  }) => (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        aria-label={label || placeholder || "Text input"}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg border ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:outline-none transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helper && !error && <p className="text-sm text-gray-500">{helper}</p>}
    </div>
  ),

  Toggle: ({ label, checked = false, onChange, disabled = false }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
          } ${disabled ? "opacity-50" : ""}`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              checked ? "translate-x-5" : ""
            }`}
          />
        </div>
      </div>
      {label && (
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
      )}
    </label>
  ),
};

// Component configurations for the playground
const COMPONENT_CONFIGS = {
  Button: {
    name: "Button",
    description:
      "A versatile button component with multiple variants and sizes",
    defaultProps: {
      children: "Click me",
      variant: "primary",
      size: "md",
      disabled: false,
    },
    propControls: [
      { name: "children", type: "text", label: "Text" },
      {
        name: "variant",
        type: "select",
        label: "Variant",
        options: ["primary", "secondary", "success", "danger", "outline"],
      },
      {
        name: "size",
        type: "select",
        label: "Size",
        options: ["sm", "md", "lg"],
      },
      { name: "disabled", type: "boolean", label: "Disabled" },
    ],
  },
  Card: {
    name: "Card",
    description: "A card component for displaying content",
    defaultProps: {
      title: "Card Title",
      description: "This is a description for the card component.",
      image: "palette",
      footer: null,
    },
    propControls: [
      { name: "title", type: "text", label: "Title" },
      { name: "description", type: "text", label: "Description" },
      { name: "image", type: "text", label: "Icon Name" },
    ],
  },
  Badge: {
    name: "Badge",
    description: "A badge component for labels and tags",
    defaultProps: {
      text: "Badge",
      color: "blue",
      size: "md",
    },
    propControls: [
      { name: "text", type: "text", label: "Text" },
      {
        name: "color",
        type: "select",
        label: "Color",
        options: ["blue", "green", "red", "yellow", "purple"],
      },
      {
        name: "size",
        type: "select",
        label: "Size",
        options: ["sm", "md", "lg"],
      },
    ],
  },
  Alert: {
    name: "Alert",
    description: "Alert component for notifications and messages",
    defaultProps: {
      type: "info",
      title: "Heads up!",
      message: "This is an informational alert message.",
      dismissible: false,
    },
    propControls: [
      {
        name: "type",
        type: "select",
        label: "Type",
        options: ["info", "success", "warning", "error"],
      },
      { name: "title", type: "text", label: "Title" },
      { name: "message", type: "text", label: "Message" },
      { name: "dismissible", type: "boolean", label: "Dismissible" },
    ],
  },
  Avatar: {
    name: "Avatar",
    description: "Avatar component for user profile images",
    defaultProps: {
      name: "John Doe",
      src: "",
      size: "md",
      status: "online",
    },
    propControls: [
      { name: "name", type: "text", label: "Name" },
      {
        name: "size",
        type: "select",
        label: "Size",
        options: ["sm", "md", "lg", "xl"],
      },
      {
        name: "status",
        type: "select",
        label: "Status",
        options: ["online", "away", "busy", "offline", ""],
      },
    ],
  },
  Input: {
    name: "Input",
    description: "Input field with label and validation",
    defaultProps: {
      label: "Email",
      placeholder: "Enter your email",
      type: "text",
      error: "",
      helper: "We'll never share your email.",
      disabled: false,
    },
    propControls: [
      { name: "label", type: "text", label: "Label" },
      { name: "placeholder", type: "text", label: "Placeholder" },
      {
        name: "type",
        type: "select",
        label: "Type",
        options: ["text", "email", "password", "number"],
      },
      { name: "error", type: "text", label: "Error Message" },
      { name: "helper", type: "text", label: "Helper Text" },
      { name: "disabled", type: "boolean", label: "Disabled" },
    ],
  },
  Toggle: {
    name: "Toggle",
    description: "Toggle switch for boolean values",
    defaultProps: {
      label: "Enable notifications",
      checked: false,
      onChange: () => {},
      disabled: false,
    },
    propControls: [
      { name: "label", type: "text", label: "Label" },
      { name: "checked", type: "boolean", label: "Checked" },
      { name: "disabled", type: "boolean", label: "Disabled" },
    ],
  },
};

// Props control components
const PropControl = ({ control, value, onChange }) => {
  switch (control.type) {
    case "text":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {control.label}
          </label>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            aria-label={control.label}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      );
    case "select":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {control.label}
          </label>
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            aria-label={control.label}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {control.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "(none)"}
              </option>
            ))}
          </select>
        </div>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            aria-label={control.label}
            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {control.label}
          </span>
        </label>
      );
    case "number":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {control.label}
          </label>
          <input
            type="number"
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={control.label}
            min={control.min}
            max={control.max}
            step={control.step || 1}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      );
    default:
      return null;
  }
};

// Generate code from props
const generateCode = (componentName, props) => {
  const propEntries = Object.entries(props)
    .filter(([key, value]) => {
      const config = COMPONENT_CONFIGS[componentName];
      const defaultValue = config?.defaultProps[key];
      return value !== defaultValue && value !== "" && value !== null;
    })
    .map(([key, value]) => {
      if (key === "children") return null;
      if (typeof value === "boolean") return value ? key : null;
      if (typeof value === "string") return `${key}="${value}"`;
      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter(Boolean);

  const children = props.children || "";
  const propsString = propEntries.length > 0 ? " " + propEntries.join(" ") : "";

  if (children) {
    return `<${componentName}${propsString}>\n  ${children}\n</${componentName}>`;
  }
  return `<${componentName}${propsString} />`;
};

// Main Live Preview Component
export const LivePreview = ({ componentName, initialProps }) => {
  const config = COMPONENT_CONFIGS[componentName];
  const Component = PreviewComponents[componentName];
  const [props, setProps] = useState(
    initialProps || config?.defaultProps || {},
  );
  const [viewport, setViewport] = useState("desktop");

  if (!config || !Component) {
    return (
      <div className="p-4 text-center text-gray-500">
        Component "{componentName}" not found
      </div>
    );
  }

  const handlePropChange = (propName, value) => {
    setProps((prev) => ({ ...prev, [propName]: value }));
  };

  const viewportSizes = {
    mobile: "w-[375px]",
    tablet: "w-[768px]",
    desktop: "w-full",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {config.name}
          </h3>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {["mobile", "tablet", "desktop"].map((vp) => (
            <button
              key={vp}
              onClick={() => setViewport(vp)}
              className={`p-2 rounded-lg transition-colors ${
                viewport === vp
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-500"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title={vp}
            >
              <Desktop className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        {/* Preview Pane */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          <div className={`mx-auto transition-all ${viewportSizes[viewport]}`}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm min-h-[200px] flex items-center justify-center">
              <PreviewErrorBoundary key={JSON.stringify(props)}>
                <Component {...props} />
              </PreviewErrorBoundary>
            </div>
          </div>
        </div>

        {/* Controls Pane */}
        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Props Playground
          </h4>
          <div className="space-y-4">
            {config.propControls.map((control) => (
              <PropControl
                key={control.name}
                control={control}
                value={props[control.name]}
                onChange={(value) => handlePropChange(control.name, value)}
              />
            ))}
          </div>

          {/* Generated Code */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Generated Code
            </h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{generateCode(componentName, props)}</code>
            </pre>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  generateCode(componentName, props),
                )
              }
              className="mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component Gallery Panel
export const ComponentGallery = () => {
  const [selectedComponent, setSelectedComponent] = useState(null);

  return (
    <div className="space-y-6">
      {/* Component Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(COMPONENT_CONFIGS).map(([name, config]) => {
          const Component = PreviewComponents[name];
          return (
            <div
              key={name}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedComponent(name)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedComponent(name); } }}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-left cursor-pointer"
            >
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center min-h-20">
                <Component {...config.defaultProps} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                {config.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Selected Component Preview Modal */}
      {selectedComponent && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setSelectedComponent(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
            >
              <Close className="w-5 h-5 text-gray-500" />
            </button>
            <div className="overflow-y-auto max-h-[90vh]">
              <LivePreview componentName={selectedComponent} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export all components
export { PreviewComponents, COMPONENT_CONFIGS };
export default LivePreview;
