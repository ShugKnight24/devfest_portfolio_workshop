import { useState } from "react";
import { EmojiIcon } from "@portfolio/icons/react";

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("submitting");

    // Simulate network request (Replace with fetch to Formspree/EmailJS)
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
    }, 1500);
  };

  return (
    <section
      id="contact"
      className="section-container bg-(--color-surface-highlight)"
    >
      <div className="max-w-2xl mx-auto bg-(--color-surface) p-8 rounded-2xl shadow-xl">
        <h2 className="section-title mb-8">Get In Touch</h2>

        {status === "success" ? (
          <div className="text-center py-12 animate-fade-in">
            <EmojiIcon name="check" className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-(--color-text-primary)">
              Message Sent!
            </h3>
            <p className="text-(--color-text-secondary)">
              I'll get back to you as soon as possible.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-(--color-primary) font-semibold hover:underline cursor-pointer"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-(--color-text-secondary) mb-2">
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg bg-(--color-background) border border-(--color-border) focus:ring-2 focus:ring-(--color-primary) outline-none transition-all"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-(--color-text-secondary) mb-2">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg bg-(--color-background) border border-(--color-border) focus:ring-2 focus:ring-(--color-primary) outline-none transition-all"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-(--color-text-secondary) mb-2">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows="4"
                className="w-full px-4 py-3 rounded-lg bg-(--color-background) border border-(--color-border) focus:ring-2 focus:ring-(--color-primary) outline-none transition-all"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-4 bg-(--color-primary) text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {status === "submitting" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default Contact;
