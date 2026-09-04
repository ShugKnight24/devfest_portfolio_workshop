import { useEffect } from "react";

export const NotFound = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <div className="text-center text-xl mb-3">
        <p className="mb-3">The page you're looking for doesn't exist. </p>
        <p className="mb-3">
          You will be redirected to the homepage in 5 seconds
        </p>
        <p className="mb-3">You can click the button below to go RIGHT now!</p>
      </div>
      <a
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition hover:cursor-pointer"
      >
        Go Home
      </a>
    </div>
  );
};
