import { Link } from "react-router-dom";
import { speakingEvents } from "../data/eventsData";
import { EmojiIcon } from "@portfolio/icons/react";

export const SpeakingEventsHub = ({ compact = false }) => {
  return (
    <section aria-labelledby="speaking-events-heading" className="w-full my-8">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <EmojiIcon name="mic" className="w-4 h-4 shrink-0" />
            Speaking &amp; Keynotes
          </div>
          <h2
            id="speaking-events-heading"
            className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight"
          >
            Conference Presentations &amp; Workshops
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 max-w-2xl">
            Live keynote slide decks, workshop agendas, and official GDG Detroit event links for upcoming and past appearances.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {speakingEvents.map((event) => {
          const isUpcoming = event.status === "upcoming";
          return (
            <div
              key={event.id}
              className={`rounded-2xl p-6 border flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${
                isUpcoming
                  ? "bg-gradient-to-b from-blue-900/10 via-gray-900/40 to-gray-900/90 dark:bg-gray-900/80 border-blue-500/40 hover:border-blue-400"
                  : "bg-gray-50/80 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-80 hover:opacity-100"
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      isUpcoming
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {event.badge}
                  </span>
                  <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <EmojiIcon name="calendar" className="w-3.5 h-3.5 shrink-0" />
                    {event.date}
                  </span>
                </div>

                {/* Organization & Location */}
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  <span>{event.organization}</span>
                  <span>•</span>
                  <span>{event.location}</span>
                </div>

                {/* Title & Topic */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                  {event.title}
                </h3>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-300 mb-3 italic">
                  "{event.topic}"
                </p>

                {/* Abstract */}
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  {event.abstract}
                </p>

                {/* Key highlights */}
                <div className="space-y-1.5 mb-6">
                  {event.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2"
                    >
                      <span className="text-blue-500 font-bold shrink-0">→</span>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200/60 dark:border-gray-800 flex flex-col sm:flex-row gap-2">
                <Link
                  to={event.slideDeckRoute}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <EmojiIcon name="presentation" className="w-4 h-4 shrink-0" />
                  Launch Keynote
                </Link>
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="View official GDG Detroit event registration"
                  >
                    <span>GDG Detroit</span>
                    <EmojiIcon name="link" className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
