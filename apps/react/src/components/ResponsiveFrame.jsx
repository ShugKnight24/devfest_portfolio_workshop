export const ResponsiveFrame = ({ children, viewport }) => {
  const width = viewport.width === "100%" ? "100%" : `${viewport.width}px`;

  return (
    <div className="flex flex-col items-center">
      {viewport.width !== "100%" && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {viewport.width}px
        </div>
      )}
      <div
        className="transition-all duration-300 ease-out overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-inner"
        style={{
          width,
          maxWidth: "100%",
          minHeight: "200px",
        }}
      >
        {children}
      </div>
    </div>
  );
};
